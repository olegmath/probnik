export default function LineSpark({
  points = [],
  width = 240,
  height = 60,
  maxY = 100,
  minY = 0,
  color = '#2563eb',
  showAxis = true,
  showDots = true,
  labels = null,
}) {
  const valid = points.filter((p) => p != null && Number.isFinite(p));
  if (!valid.length) {
    return (
      <div style={{ width: '100%', maxWidth: width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 12 }}>
        нет данных
      </div>
    );
  }

  const padX = 8;
  const padY = 6;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const range = Math.max(1, maxY - minY);
  const stepX = points.length > 1 ? innerW / (points.length - 1) : 0;

  const coords = points.map((v, i) => {
    if (v == null || !Number.isFinite(v)) return null;
    const x = padX + i * stepX;
    const y = padY + innerH - ((v - minY) / range) * innerH;
    return { x, y, v };
  });

  const segments = [];
  let current = [];
  coords.forEach((c) => {
    if (c) {
      current.push(c);
    } else if (current.length) {
      segments.push(current);
      current = [];
    }
  });
  if (current.length) segments.push(current);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block', width: '100%', maxWidth: width, height: 'auto' }}
    >
      {showAxis && (
        <line
          x1={padX}
          y1={padY + innerH}
          x2={padX + innerW}
          y2={padY + innerH}
          stroke="#e5e7eb"
          strokeWidth="1"
        />
      )}
      {segments.map((seg, idx) => (
        <polyline
          key={idx}
          points={seg.map((c) => `${c.x},${c.y}`).join(' ')}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {showDots && coords.map((c, i) => c && (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r="3" fill={color} vectorEffect="non-scaling-stroke">
            <title>{labels ? `${labels[i]}: ${c.v}` : c.v}</title>
          </circle>
        </g>
      ))}
    </svg>
  );
}
