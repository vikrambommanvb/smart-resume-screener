import * as React from "react";
import { SkillsSectionData } from "../../types/api";

interface ConstellationSVGProps {
  skills: SkillsSectionData | null;
  onSelectSkill?: (skillName: string) => void;
  className?: string;
}

interface NodePoint {
  id: string;
  name: string;
  type: "matched" | "partial" | "missing";
  x: number;
  y: number;
  category: string;
}

export const ConstellationSVG: React.FC<ConstellationSVGProps> = ({
  skills,
  onSelectSkill,
  className = "",
}) => {
  const [activeNode, setActiveNode] = React.useState<NodePoint | null>(null);

  const matched = skills?.matched || [];
  const partial = skills?.partial || [];
  const missing = skills?.missing || [];

  const rawList = React.useMemo(() => {
    return [
      ...matched.map((m) => ({ id: m.id, name: m.name, type: "matched" as const, category: m.category })),
      ...partial.map((p) => ({ id: p.id, name: p.name, type: "partial" as const, category: p.category })),
      ...missing.map((g) => ({ id: g.id, name: g.name, type: "missing" as const, category: g.category })),
    ];
  }, [matched, partial, missing]);

  // Compute 2D circular constellation coordinates
  const nodes: NodePoint[] = React.useMemo(() => {
    const cx = 300;
    const cy = 200;
    const count = rawList.length;
    if (count === 0) return [];

    return rawList.map((item, idx) => {
      const angle = (idx / count) * 2 * Math.PI - Math.PI / 2;
      const radius = 100 + (idx % 3) * 35;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      return {
        ...item,
        x: Math.round(x),
        y: Math.round(y),
      };
    });
  }, [rawList]);

  const colorForType = (type: NodePoint["type"]) => {
    switch (type) {
      case "matched":
        return "var(--color-violet)";
      case "partial":
        return "var(--color-cool)";
      case "missing":
        return "var(--color-accent)";
    }
  };

  return (
    <div className={`relative w-full overflow-hidden select-none ${className}`}>
      <svg
        viewBox="0 0 600 400"
        className="w-full h-auto max-h-[380px] bg-paper rounded-[8px] border border-rule"
        role="group"
        aria-label="Skill alignment constellation graph"
      >
        <title>Skill Alignment Constellation</title>
        <desc>
          Visual graph connecting candidate verified skills and target role requirements.
        </desc>

        <defs>
          <filter id="nodeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Center Hub: Target Role */}
        <circle cx="300" cy="200" r="14" fill="var(--color-paper-3)" stroke="var(--color-violet)" strokeWidth="2" />
        <circle cx="300" cy="200" r="4" fill="var(--color-violet)" />
        <text
          x="300"
          y="228"
          textAnchor="middle"
          fill="var(--color-ink)"
          className="text-xs font-medium"
        >
          TARGET ROLE
        </text>

        {/* Spokes / Connection Lines */}
        {nodes.map((node) => (
          <line
            key={`line-${node.id}`}
            x1="300"
            y1="200"
            x2={node.x}
            y2={node.y}
            stroke={activeNode?.id === node.id ? colorForType(node.type) : "var(--color-rule)"}
            strokeWidth={activeNode?.id === node.id ? "1.5" : "1"}
            strokeDasharray={node.type === "missing" ? "3,3" : undefined}
          />
        ))}

        {/* Nodes */}
        {nodes.map((node) => {
          const isActive = activeNode?.id === node.id;
          const color = colorForType(node.type);

          return (
            <g
              key={node.id}
              className="cursor-pointer transition-transform duration-150 focus-visible:outline-none"
              onMouseEnter={() => setActiveNode(node)}
              onMouseLeave={() => setActiveNode((prev) => (prev?.id === node.id ? null : prev))}
              onFocus={() => setActiveNode(node)}
              onBlur={() => setActiveNode((prev) => (prev?.id === node.id ? null : prev))}
              onClick={() => {
                setActiveNode(node);
                onSelectSkill?.(node.name);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveNode(node);
                  onSelectSkill?.(node.name);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`${node.name} (${node.type})`}
            >
              {/* Node Outer Glow */}
              <circle
                cx={node.x}
                cy={node.y}
                r={isActive ? 12 : 8}
                fill={color}
                fillOpacity={isActive ? 0.35 : 0.15}
                filter="url(#nodeGlow)"
              />
              {/* Node Core: Redundant Shape Encoding */}
              {node.type === "matched" && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isActive ? 6 : 4.5}
                  fill={color}
                  stroke="var(--color-paper)"
                  strokeWidth="1.5"
                />
              )}
              {node.type === "partial" && (
                <polygon
                  points={`${node.x},${node.y - (isActive ? 7 : 5.5)} ${node.x + (isActive ? 7 : 5.5)},${node.y} ${node.x},${node.y + (isActive ? 7 : 5.5)} ${node.x - (isActive ? 7 : 5.5)},${node.y}`}
                  fill={color}
                  stroke="var(--color-paper)"
                  strokeWidth="1.5"
                />
              )}
              {node.type === "missing" && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isActive ? 6.5 : 5}
                  fill="none"
                  stroke={color}
                  strokeWidth="1.8"
                  strokeDasharray="3,2"
                />
              )}
              {/* Node Label */}
              <text
                x={node.x}
                y={node.y > 200 ? node.y + 14 : node.y - 10}
                textAnchor="middle"
                fill={isActive ? "var(--color-ink)" : "var(--color-muted)"}
                className={`text-xs transition-colors ${isActive ? "font-medium" : ""}`}
              >
                {node.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Active Node Info Pill */}
      {activeNode && (
        <div className="absolute top-3 right-3 rounded-[6px] border border-rule bg-paper-2 px-2.5 py-1.5 text-xs text-ink shadow-md pointer-events-none">
          <span className="font-medium">{activeNode.name}</span> ·{" "}
          <span className="capitalize" style={{ color: colorForType(activeNode.type) }}>
            {activeNode.type}
          </span>
        </div>
      )}
    </div>
  );
};
