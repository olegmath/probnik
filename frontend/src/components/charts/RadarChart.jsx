export default function RadarChart({ sections }) {
  if (!sections || sections.length === 0) return null;

  const size = 300;
  const center = size / 2;
  const maxRadius = center - 40;
  const slices = sections.length;
  const angleSlice = (Math.PI * 2) / slices;

  const getPoint = (idx, value) => {
    const angle = angleSlice * idx - Math.PI / 2;
    const r = maxRadius * (value / 100);
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const gridPoints = Array.from({ length: 5 }, (_, level) =>
    Array.from({ length: slices }, (_, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const r = (maxRadius / 5) * (level + 1);
      return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
    })
  );

  const radarPoints = sections.map((s, i) => getPoint(i, s.percentage));
  const polygonPath =
    `M ${radarPoints[0].x} ${radarPoints[0].y}` +
    radarPoints.slice(1).map((p) => ` L ${p.x} ${p.y}`).join('') +
    ' Z';

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ maxWidth: '100%', height: 'auto' }}
      >
        {gridPoints.map((points, level) => {
          const gridPath =
            `M ${points[0].x} ${points[0].y}` +
            points.slice(1).map((p) => ` L ${p.x} ${p.y}`).join('') +
            ' Z';
          return <path key={`grid-${level}`} d={gridPath} stroke="#ddd" strokeWidth="1" fill="none" />;
        })}

        {sections.map((_, i) => {
          const angle = angleSlice * i - Math.PI / 2;
          const labelR = maxRadius + 35;
          const lx = center + labelR * Math.cos(angle);
          const ly = center + labelR * Math.sin(angle);
          return (
            <line key={`line-${i}`} x1={center} y1={center} x2={lx} y2={ly} stroke="#eee" strokeWidth="1" />
          );
        })}

        <path d={polygonPath} fill="#8CC0DC" fillOpacity="0.3" stroke="#8CC0DC" strokeWidth="2" />

        {sections.map((section, i) => {
          const angle = angleSlice * i - Math.PI / 2;
          const labelR = maxRadius + 50;
          const lx = center + labelR * Math.cos(angle);
          const ly = center + labelR * Math.sin(angle);
          const textAnchor = Math.abs(Math.cos(angle)) < 0.1 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end';
          return (
            <g key={`label-${i}`}>
              <text x={lx} y={ly} textAnchor={textAnchor} dominantBaseline="middle" fontSize="11" fontWeight="600" fill="#666">
                {section.name.substring(0, 15)}
              </text>
              <text x={lx} y={ly + 14} textAnchor={textAnchor} dominantBaseline="middle" fontSize="12" fontWeight="900" fill="#1a1a1a">
                {section.percentage}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
