// Полноразмерный график с несколькими линиями на общей оси пробников.
// В отличие от LineSpark (спарклайн в ячейке) рисует сетку, подписи Y и X.
// series: [{ label, color, points: (number|null)[], titles?: string[] }] —
// null в points = разрыв линии (преподаватель не писал этот пробник).
export default function MultiLine({
  series = [],
  xLabels = [],
  width = 680,
  height = 220,
  maxY = 100,
  minY = 0,
}) {
  const hasData = series.some((s) => (s.points || []).some((p) => p != null && Number.isFinite(p)));
  if (!hasData) {
    return (
      <div style={{ width: '100%', maxWidth: width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 12 }}>
        нет данных
      </div>
    );
  }

  const padL = 36;
  const padR = 12;
  const padT = 10;
  const padB = 24;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const range = Math.max(1, maxY - minY);
  const n = Math.max(...series.map((s) => (s.points || []).length), xLabels.length);
  const stepX = n > 1 ? innerW / (n - 1) : 0;
  const xAt = (i) => padL + i * stepX;
  const yAt = (v) => padT + innerH - ((v - minY) / range) * innerH;

  const gridValues = [minY, minY + range * 0.25, minY + range * 0.5, minY + range * 0.75, maxY];
  const labelEvery = Math.max(1, Math.ceil(n / 10));

  const toSegments = (points) => {
    const segments = [];
    let current = [];
    (points || []).forEach((v, i) => {
      if (v != null && Number.isFinite(v)) {
        current.push({ x: xAt(i), y: yAt(v), v, i });
      } else if (current.length) {
        segments.push(current);
        current = [];
      }
    });
    if (current.length) segments.push(current);
    return segments;
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block', width: '100%', maxWidth: width, height: 'auto' }}
    >
      {gridValues.map((v, i) => (
        <g key={i}>
          <line
            x1={padL}
            y1={yAt(v)}
            x2={padL + innerW}
            y2={yAt(v)}
            stroke="#e5e7eb"
            strokeWidth="1"
            strokeDasharray={i === 0 ? 'none' : '3 4'}
          />
          <text x={padL - 6} y={yAt(v) + 3} textAnchor="end" fontSize="9" fontFamily="Inter" fontWeight="700" fill="#9ca3af">
            {Math.round(v)}
          </text>
        </g>
      ))}
      {xLabels.map((label, i) => (
        i % labelEvery === 0 && (
          <text key={i} x={xAt(i)} y={height - 8} textAnchor="middle" fontSize="9" fontFamily="Inter" fontWeight="700" fill="#6b7280">
            {label}
          </text>
        )
      ))}
      {series.map((s, si) => (
        <g key={si}>
          {toSegments(s.points).map((seg, idx) => (
            <polyline
              key={idx}
              points={seg.map((c) => `${c.x},${c.y}`).join(' ')}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {toSegments(s.points).flat().map((c) => (
            <circle key={c.i} cx={c.x} cy={c.y} r="3.2" fill={s.color} vectorEffect="non-scaling-stroke">
              <title>{s.titles?.[c.i] || `${s.label} — ${xLabels[c.i] || ''}: ${c.v}`}</title>
            </circle>
          ))}
        </g>
      ))}
    </svg>
  );
}
