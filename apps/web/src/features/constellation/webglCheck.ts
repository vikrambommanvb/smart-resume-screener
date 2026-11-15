/**
 * Utility to verify WebGL2 support and user environmental preferences.
 */
export function canUseWebGL(): boolean {
  if (typeof window === "undefined") return false;

  // Check prefers-reduced-motion
  try {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      return false;
    }
  } catch {
    // If matchMedia fails or is not implemented, proceed safely
  }

  // Check Save-Data header
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) {
    return false;
  }

  // Check WebGL2 context
  try {
    const canvas = document.createElement("canvas");
    return Boolean(window.WebGL2RenderingContext && canvas.getContext("webgl2"));
  } catch {
    return false;
  }
}
