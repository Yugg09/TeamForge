import { CONSTELLATION_LINKS, CONSTELLATION_NODES } from "./constellation-data";

export function ConstellationFallback() {
  const width = 560;
  const height = 320;
  const cx = 280;
  const cy = 155;
  const projected = CONSTELLATION_NODES.map((node) => ({
    ...node,
    x: cx + node.rest[0] * 72,
    y: cy - node.rest[1] * 72 - node.rest[2] * 16,
  }));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-full w-full"
      aria-hidden
    >
      <ellipse
        cx={cx}
        cy={cy + 8}
        rx="150"
        ry="150"
        fill="none"
        stroke="#E5E5E5"
        strokeWidth="1"
      />
      {projected.map((node) => (
        <line
          key={`core-${node.id}`}
          x1={cx}
          y1={cy}
          x2={node.x}
          y2={node.y}
          stroke="#0A0A0A"
          strokeOpacity="0.28"
          strokeWidth="1"
        />
      ))}
      {CONSTELLATION_LINKS.map(([a, b]) => (
        <line
          key={`${a}-${b}`}
          x1={projected[a].x}
          y1={projected[a].y}
          x2={projected[b].x}
          y2={projected[b].y}
          stroke="#737373"
          strokeOpacity="0.25"
          strokeWidth="1"
        />
      ))}
      <circle cx={cx} cy={cy} r="8" fill="#0A0A0A" />
      <circle cx={cx} cy={cy} r="14" fill="none" stroke="#A3A3A3" opacity="0.7" />
      {projected.map((node) => (
        <g key={node.id}>
          <circle cx={node.x} cy={node.y} r="11" fill="#FFFFFF" stroke={node.color} />
          <circle cx={node.x} cy={node.y} r="4" fill={node.color} />
          <text
            x={node.x}
            y={node.y + 24}
            textAnchor="middle"
            fill="#0A0A0A"
            fontSize="10"
            fontFamily="Inter, system-ui, sans-serif"
            fontWeight="600"
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
