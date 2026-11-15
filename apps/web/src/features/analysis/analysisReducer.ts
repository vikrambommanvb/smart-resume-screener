import {
  CareerAlternative,
  HealthSectionData,
  InterviewQuestion,
  MatchSectionData,
  ResumeProfileData,
  RewriteItem,
  RoadmapStep,
  SkillsSectionData,
  StageEvent,
  StrengthsSectionData,
} from "../../types/api";

export interface AnalysisState {
  status: "idle" | "streaming" | "completed" | "error";
  stages: Record<string, StageEvent>;
  resume_profile: ResumeProfileData | null;
  skills: SkillsSectionData | null;
  match: MatchSectionData | null;
  health: HealthSectionData | null;
  careers: CareerAlternative[] | null;
  strengths: StrengthsSectionData | null;
  improvements: RewriteItem[] | null;
  roadmap: RoadmapStep[] | null;
  interview: InterviewQuestion[] | null;
  degraded: boolean;
  requestId: string | null;
  durationMs: number | null;
  globalError: string | null;
  sectionErrors: Record<string, string>;
}

export const initialAnalysisState: AnalysisState = {
  status: "idle",
  stages: {
    read: { id: "read", label: "Extracting text and redacting PII", status: "pending" },
    understand: { id: "understand", label: "Extracting skills and profiling project evidence", status: "pending" },
    match: { id: "match", label: "Computing deterministic alignment score", status: "pending" },
    health: { id: "health", label: "Auditing resume structure and ATS health", status: "pending" },
    guidance: { id: "guidance", label: "Generating grounded strengths and actionable roadmap", status: "pending" },
  },
  resume_profile: null,
  skills: null,
  match: null,
  health: null,
  careers: null,
  strengths: null,
  improvements: null,
  roadmap: null,
  interview: null,
  degraded: false,
  requestId: null,
  durationMs: null,
  globalError: null,
  sectionErrors: {},
};

export type AnalysisAction =
  | { type: "START_STREAM" }
  | { type: "UPDATE_STAGE"; payload: StageEvent }
  | { type: "UPDATE_SECTION"; payload: { name: string; data: unknown } }
  | { type: "STREAM_DONE"; payload: { degraded: boolean; requestId: string; durationMs: number } }
  | { type: "STREAM_ERROR"; payload: { section?: string | null; message: string; code: string } }
  | { type: "CLEAR_ERROR" }
  | { type: "RESET" };

export function analysisReducer(state: AnalysisState, action: AnalysisAction): AnalysisState {
  switch (action.type) {
    case "START_STREAM":
      return {
        ...initialAnalysisState,
        status: "streaming",
      };

    case "UPDATE_STAGE":
      return {
        ...state,
        stages: {
          ...state.stages,
          [action.payload.id]: action.payload,
        },
      };

    case "UPDATE_SECTION": {
      const { name, data } = action.payload;
      return {
        ...state,
        [name]: data,
      };
    }

    case "STREAM_DONE":
      return {
        ...state,
        status: "completed",
        degraded: action.payload.degraded,
        requestId: action.payload.requestId,
        durationMs: action.payload.durationMs,
      };

    case "STREAM_ERROR": {
      const { section, message } = action.payload;
      if (!section) {
        return {
          ...state,
          status: "error",
          globalError: message,
        };
      }
      return {
        ...state,
        sectionErrors: {
          ...state.sectionErrors,
          [section]: message,
        },
      };
    }

    case "CLEAR_ERROR":
      return {
        ...state,
        status: "idle",
        globalError: null,
      };

    case "RESET":
      return initialAnalysisState;

    default:
      return state;
  }
}

