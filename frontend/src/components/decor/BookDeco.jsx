export default function BookDeco({ style = {} }) {
  return (
    <svg width="80" height="68" viewBox="0 0 80 68" fill="none" style={style}>
      <rect x="8" y="10" width="30" height="40" rx="3" stroke="var(--blue)" strokeWidth="2.2" />
      <rect x="42" y="10" width="30" height="40" rx="3" stroke="var(--blue)" strokeWidth="2.2" />
      <line x1="23" y1="10" x2="23" y2="50" stroke="var(--blue)" strokeWidth="2.2" />
      <line x1="57" y1="10" x2="57" y2="50" stroke="var(--blue)" strokeWidth="2.2" />
      <line x1="12" y1="22" x2="34" y2="22" stroke="var(--blue)" strokeWidth="1.5" />
      <line x1="12" y1="30" x2="34" y2="30" stroke="var(--blue)" strokeWidth="1.5" />
      <line x1="46" y1="22" x2="68" y2="22" stroke="var(--blue)" strokeWidth="1.5" />
      <line x1="46" y1="30" x2="68" y2="30" stroke="var(--blue)" strokeWidth="1.5" />
    </svg>
  );
}
