---
name: r3f-scene-craft
description: Use when building or changing any Three.js or React Three Fiber content, including the skill constellation hero and results graph. Covers data-driven scene design, performance budgets, lazy loading, fallbacks, and accessibility for 3D.
---

# 3D scene craft

## The one memorable thing: the skill constellation
Nodes are skills, clustered by category (languages, frameworks, data, cloud, tools, practices). State is encoded redundantly in shape AND color so color is never the only signal:
- matched: solid sphere, violet-300, soft glow
- partial: half-filled ring, blue-300
- missing: hollow dashed ring, amber-400, slightly desaturated and set back in depth
Edges connect related skills (from the taxonomy `related` graph). The same component powers the landing hero (labelled sample data) and the results page (real data, draggable, click a node to open its evidence panel).

## Rules
- Lazy-load the whole 3D chunk with `React.lazy` after first paint and idle. Show the static SVG constellation (same layout, precomputed) immediately and swap when ready without layout shift.
- Skip 3D and keep the SVG when: `prefers-reduced-motion`, `navigator.connection.saveData`, no WebGL2, `deviceMemory` <= 2, or the tab is hidden.
- `<Canvas dpr={[1, 1.75]} frameloop="demand">`. Invalidate only on interaction or while a settle animation runs. Pause when off screen (IntersectionObserver).
- `InstancedMesh` for nodes (<= 120 on desktop, <= 60 on mobile). No postprocessing stack; fake glow with additive sprites. Share geometries and materials. Dispose on unmount.
- No loading of external models or HDRIs. Procedural geometry only so the bundle stays small.
- The canvas is `aria-hidden`. A real, keyboard-navigable skill list or table beside it carries the same information.
- Budget: 3D chunk <= 220 KB gzip, 55+ fps on a mid-range phone, no main-thread block > 50ms during interaction.
- Test with a forced-WebGL-failure path and the reduced-motion path.

