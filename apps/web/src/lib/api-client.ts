import {
  DonePayload,
  DonePayloadSchema,
  ErrorPayload,
  ErrorPayloadSchema,
  RoleProfile,
  RoleProfileSchema,
  StageEvent,
  StageEventSchema,
} from "../types/api";

const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (isLocalhost ? "http://127.0.0.1:8000" : "https://smart-resume-screener-api-x6c5.onrender.com");

export async function prewarmBackend(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/healthz`, {
      method: "GET",
      headers: { Accept: "application/json" },
      mode: "cors",
    });
  } catch {
    // Non-blocking pre-warm ping
  }
}

export async function fetchPredefinedRoles(): Promise<RoleProfile[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/roles`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Failed to load roles: HTTP ${res.status}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data.map((item) => RoleProfileSchema.parse(item)) : [];
}

export interface StreamCallbacks {
  onStage?: (stage: StageEvent) => void;
  onSection?: (name: string, data: unknown) => void;
  onDone?: (payload: DonePayload) => void;
  onError?: (payload: ErrorPayload) => void;
}

export interface AnalyzeRequestOptions {
  file: File;
  mode: "role" | "custom";
  roleId?: string;
  customJd?: string;
  sections?: string[];
  signal?: AbortSignal;
  callbacks: StreamCallbacks;
}

export async function streamAnalyzeResume(options: AnalyzeRequestOptions): Promise<void> {
  const formData = new FormData();
  formData.append("resume", options.file);
  const apiMode = options.mode === "custom" ? "custom_jd" : "role";
  formData.append("mode", apiMode);

  if (options.mode === "role" && options.roleId) {
    formData.append("role_id", options.roleId);
  } else if (options.mode === "custom" && options.customJd) {
    formData.append("job_description", options.customJd);
    formData.append("custom_jd", options.customJd);
  }

  if (options.sections && options.sections.length > 0) {
    formData.append("sections", options.sections.join(","));
  }

  let response: Response | null = null;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      response = await fetch(`${API_BASE_URL}/api/v1/analyze`, {
        method: "POST",
        headers: {
          Accept: "text/event-stream",
        },
        body: formData,
        signal: options.signal,
      });
      break;
    } catch (fetchErr) {
      lastError = fetchErr;
      if (options.signal?.aborted) throw fetchErr;
      if (attempt < 3) {
        // Render cold start might take up to 30s; wait 3s before retry
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }

  if (!response) {
    throw lastError || new Error("Unable to connect to analysis service.");
  }

  if (!response.ok) {
    let errMsg = `Server returned HTTP ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) errMsg = errJson.detail;
    } catch {
      // Body not JSON
    }
    options.callbacks.onError?.({
      code: `HTTP_${response.status}`,
      message: errMsg,
      section: null,
      retryable: response.status >= 500,
    });
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Response body is not readable as a stream.");
  }

  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const block of parts) {
        if (!block.trim()) continue;

        let eventType: string | null = null;
        let dataPayload: string | null = null;

        const lines = block.split("\n");
        for (const line of lines) {
          if (line.startsWith(":")) {
            // SSE comment / heartbeat ping; safely ignore
            continue;
          }
          if (line.startsWith("event:")) {
            eventType = line.replace("event:", "").trim();
          } else if (line.startsWith("data:")) {
            dataPayload = line.replace("data:", "").trim();
          }
        }

        if (!eventType || dataPayload === null) continue;

        try {
          const parsedJson = JSON.parse(dataPayload);

          switch (eventType) {
            case "stage": {
              const stage = StageEventSchema.parse(parsedJson);
              options.callbacks.onStage?.(stage);
              break;
            }
            case "section": {
              if (parsedJson && typeof parsedJson === "object" && "name" in parsedJson) {
                options.callbacks.onSection?.(parsedJson.name, parsedJson.data);
              }
              break;
            }
            case "done": {
              const doneData = DonePayloadSchema.parse(parsedJson);
              options.callbacks.onDone?.(doneData);
              break;
            }
            case "error": {
              const errData = ErrorPayloadSchema.parse(parsedJson);
              options.callbacks.onError?.(errData);
              break;
            }
            default:
              // Unknown event type, pass safely
              break;
          }
        } catch (parseErr) {
          console.warn(`Failed to parse SSE payload for event '${eventType}':`, parseErr);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
