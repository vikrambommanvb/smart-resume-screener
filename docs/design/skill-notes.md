# Hallmark Skill Notes

- **Version**: 2.0.0 (`nutlope/hallmark`)
- **Verbs**: "`redesign <target>` (a full redesign keeping content and wiring) and `audit <target>` (a report); read `references/redesign.md` first. Any other change to an existing design is not a Hallmark run: do it as asked, in the project's own system."
- **Non-Waivable Floor (16 rules)**: "Binds every output in every harness, none of it waivable, even when nothing else is read."
  - Rule 1: "Every colour and every font goes through a token declared at `:root` (or a declared theme block). No literal colour or `font-family` past the token block. (48)"
  - Rule 2: "Never `transition: all`. Never animate `width`, `height`, `top` or `left`. (10a)"
  - Rule 4: "`overflow-x: clip` on both `html` and `body`. Never `hidden`, never `100vw`. (34)"
  - Rule 6: "Every interactive element has `:focus-visible`, appearing instantly. (26a, 15)"
  - Rule 8: "Never an invented metric, testimonial, logo wall or case-study count. (46a)"
  - Rule 9: "Never an eyebrow, and never a label in tracked capitals or small caps: labels, captions, table heads, tags and nav links are the body face (or the theme's label face), a step smaller, sentence or lower case, untracked. (54, 67)"
  - Rule 10: "Never middle-dot-joined meta strings, arrows glued to link text, or decorative status dots. (63)"
  - Rule 11: "Never a purple-to-blue gradient, a card inside a card, an emoji as an icon, or a hand-drawn browser or OS window. (2a, 4, 30a, 47a)"
  - Rule 12: "The hero's headline, one sentence and primary action are all visible at 1280 x 800 without scrolling. (44b)"
  - Rule 14: "The container is capped and centred: at 1920 the gutters grow, the measure and the grids do not. (44d)"
  - Rule 15: "The first non-empty line of the CSS source is the Hallmark stamp, then the critique line, then any waivers. (20)"
  - Rule 16: "If Node is available, run `node <skill-dir>/scripts/sloplint.mjs <output> --render` before handing back. Fix every `FAIL`; fix or waive every `REFLEX`."
- **Reference Files Loaded**: `references/redesign.md`, `references/gates.md`, `references/craft.md`, `references/layout.md`, `references/direction.md`, `references/imagery.md`, `references/flow.md`.
