// Числовое форматирование админки — отдельно от _helpers.jsx,
// чтобы не смешивать не-компонентные экспорты с компонентами (react-refresh).

// Общая шкала «хорошо/средне/плохо» по проценту 0–100 (паттерн GradesTab).
export function scoreColor(val) {
  if (val == null) return 'var(--gray)';
  if (val >= 80) return '#34b87a';
  if (val >= 60) return '#f5a623';
  return '#e05454';
}

export function fmtPct(v, digits = 1) {
  if (v == null || !Number.isFinite(v)) return '—';
  return `${Number(v).toFixed(digits)}%`;
}
