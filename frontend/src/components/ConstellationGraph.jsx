import { useMemo } from "react";
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from "d3-force";

export const CATEGORY_COLORS = {
  Programming: "#4FD9C5",
  Data: "#F2B84B",
  "Cloud & DevOps": "#7C9CF2",
  Design: "#E8607A",
  Product: "#B98BEB",
  "Soft Skills": "#8B93A7",
};

const WIDTH = 900;
const HEIGHT = 560;

/**
 * Renders a set of Skill nodes + RELATED_TO edges as a constellation:
 * gold-tinted stars sized by demand, joined by faint connecting lines.
 * Pass `highlightIds`/`highlightEdgeSet` to light up a specific route
 * (used by the Pathway page to show the learning route it found).
 */
export default function ConstellationGraph({
  nodes,
  edges,
  onSelect,
  selectedId,
  highlightIds = null,
  compact = false,
}) {
  const { laidOutNodes, laidOutEdges } = useMemo(() => {
    if (!nodes.length) return { laidOutNodes: [], laidOutEdges: [] };

    const nodeMap = new Map(nodes.map((n) => [n.id, { ...n }]));
    const simNodes = Array.from(nodeMap.values());
    const simEdges = edges
      .filter((e) => nodeMap.has(e.source) && nodeMap.has(e.target))
      .map((e) => ({ ...e }));

    const sim = forceSimulation(simNodes)
      .force(
        "link",
        forceLink(simEdges)
          .id((d) => d.id)
          .distance(70)
          .strength(0.35)
      )
      .force("charge", forceManyBody().strength(-140))
      .force("center", forceCenter(WIDTH / 2, HEIGHT / 2))
      .force("collide", forceCollide(26))
      .stop();

    for (let i = 0; i < 260; i++) sim.tick();

    // Clamp to viewport with margin so no star renders off-canvas.
    const margin = 40;
    for (const n of simNodes) {
      n.x = Math.max(margin, Math.min(WIDTH - margin, n.x));
      n.y = Math.max(margin, Math.min(HEIGHT - margin, n.y));
    }

    return { laidOutNodes: simNodes, laidOutEdges: simEdges };
  }, [nodes, edges]);

  const maxDemand = Math.max(1, ...laidOutNodes.map((n) => n.demand || 0));
  const highlightSet = highlightIds ? new Set(highlightIds) : null;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full h-auto select-none"
      role="img"
      aria-label="Skill constellation map"
    >
      <g opacity={highlightSet ? 0.18 : 0.35}>
        {laidOutEdges.map((e, i) => (
          <line
            key={i}
            x1={e.source.x}
            y1={e.source.y}
            x2={e.target.x}
            y2={e.target.y}
            stroke="#4FD9C5"
            strokeWidth={0.6 + (e.strength || 1) * 0.25}
          />
        ))}
      </g>

      {highlightSet && (
        <g>
          {laidOutEdges
            .filter((e) => highlightSet.has(e.source.id) && highlightSet.has(e.target.id))
            .map((e, i) => (
              <line
                key={`h${i}`}
                x1={e.source.x}
                y1={e.source.y}
                x2={e.target.x}
                y2={e.target.y}
                stroke="#F2B84B"
                strokeWidth={2.5}
                strokeDasharray="1 6"
                strokeLinecap="round"
              />
            ))}
        </g>
      )}

      {laidOutNodes.map((n) => {
        const r = compact ? 5 + (n.demand / maxDemand) * 6 : 6 + (n.demand / maxDemand) * 10;
        const isHighlighted = highlightSet?.has(n.id);
        const isSelected = selectedId === n.id;
        const color = CATEGORY_COLORS[n.category] || "#8B93A7";
        return (
          <g
            key={n.id}
            transform={`translate(${n.x}, ${n.y})`}
            className={onSelect ? "cursor-pointer" : ""}
            onClick={() => onSelect?.(n)}
          >
            {(isHighlighted || isSelected) && (
              <circle r={r + 6} fill={isHighlighted ? "#F2B84B" : color} opacity={0.18} />
            )}
            <circle
              r={r}
              fill={isHighlighted ? "#F2B84B" : color}
              opacity={isHighlighted || isSelected ? 1 : 0.85}
              stroke={isSelected ? "#EDEFF5" : "none"}
              strokeWidth={isSelected ? 2 : 0}
            />
            {!compact && (
              <text
                y={r + 14}
                textAnchor="middle"
                fontSize="10.5"
                fontFamily="Inter, sans-serif"
                fill={isHighlighted ? "#F2B84B" : "#8B93A7"}
              >
                {n.name}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
