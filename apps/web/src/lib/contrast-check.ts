/**
 * Contrast check utility according to WCAG 2.2 specifications.
 * Evaluates relative luminance and contrast ratio between foreground and background hex colors.
 */

export interface ContrastResult {
  fg: string;
  bg: string;
  ratio: number;
  passesAA: boolean; // >= 4.5:1 for normal text
  passesAALarge: boolean; // >= 3.0:1 for large text / UI borders
}

export function parseHex(hex: string): [number, number, number] {
  const clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return [r / 255, g / 255, b / 255];
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return [r / 255, g / 255, b / 255];
  }
  throw new Error(`Invalid hex color: ${hex}`);
}

export function getRelativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((c) => {
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getRelativeLuminance(parseHex(hex1));
  const lum2 = getRelativeLuminance(parseHex(hex2));
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}

export function evaluateContrast(fgHex: string, bgHex: string): ContrastResult {
  const ratio = getContrastRatio(fgHex, bgHex);
  return {
    fg: fgHex,
    bg: bgHex,
    ratio,
    passesAA: ratio >= 4.5,
    passesAALarge: ratio >= 3.0,
  };
}

export const DESIGN_TOKENS = {
  ink950: "#0C0B1D",
  ink900: "#131230",
  ink800: "#1C1B42",
  textHi: "#ECEBFF",
  textMid: "#A9A7D0",
  textLo: "#7C7AA8",
  violet600: "#6538EB",
  violet500: "#7C5CFF",
  violet300: "#B3A1FF",
  blue500: "#3E7BFF",
  blue300: "#8DB4FF",
  amber400: "#FFB547",
} as const;

export function verifyAllDesignTokenPairs(): Record<string, ContrastResult & { compliant: boolean }> {
  // Pairs mapped to required standard: "normal" (>= 4.5:1) or "ui/large" (>= 3.0:1)
  const pairs: Record<string, { fg: string; bg: string; type: "normal" | "ui/large" }> = {
    "textHi on ink950": { fg: DESIGN_TOKENS.textHi, bg: DESIGN_TOKENS.ink950, type: "normal" },
    "textHi on ink900": { fg: DESIGN_TOKENS.textHi, bg: DESIGN_TOKENS.ink900, type: "normal" },
    "textHi on ink800": { fg: DESIGN_TOKENS.textHi, bg: DESIGN_TOKENS.ink800, type: "normal" },
    "textMid on ink950": { fg: DESIGN_TOKENS.textMid, bg: DESIGN_TOKENS.ink950, type: "normal" },
    "textMid on ink900": { fg: DESIGN_TOKENS.textMid, bg: DESIGN_TOKENS.ink900, type: "normal" },
    "textMid on ink800": { fg: DESIGN_TOKENS.textMid, bg: DESIGN_TOKENS.ink800, type: "normal" },
    "amber400 on ink950": { fg: DESIGN_TOKENS.amber400, bg: DESIGN_TOKENS.ink950, type: "normal" },
    "amber400 on ink900": { fg: DESIGN_TOKENS.amber400, bg: DESIGN_TOKENS.ink900, type: "normal" },
    "violet300 on ink950": { fg: DESIGN_TOKENS.violet300, bg: DESIGN_TOKENS.ink950, type: "normal" },
    "violet300 on ink900": { fg: DESIGN_TOKENS.violet300, bg: DESIGN_TOKENS.ink900, type: "normal" },
    "blue300 on ink950": { fg: DESIGN_TOKENS.blue300, bg: DESIGN_TOKENS.ink950, type: "normal" },
    "white on violet600 (button)": { fg: "#FFFFFF", bg: DESIGN_TOKENS.violet600, type: "normal" },
    "textHi on violet500 (button/control)": { fg: DESIGN_TOKENS.textHi, bg: DESIGN_TOKENS.violet500, type: "ui/large" },
  };

  const results: Record<string, ContrastResult & { compliant: boolean }> = {};
  for (const [name, config] of Object.entries(pairs)) {
    const res = evaluateContrast(config.fg, config.bg);
    const compliant = config.type === "normal" ? res.passesAA : res.passesAALarge;
    results[name] = { ...res, compliant };
  }
  return results;
}
