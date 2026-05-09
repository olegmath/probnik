export default function PenDeco({ style = {} }) {
  return (
    <svg width="60" height="80" viewBox="0 0 60 80" fill="none" style={style}>
      <rect x="22" y="5" width="16" height="55" rx="4" stroke="var(--blue)" strokeWidth="2.2" />
      <polygon points="22,60 38,60 30,75" stroke="var(--blue)" strokeWidth="2.2" fill="none" />
      <line x1="22" y1="16" x2="38" y2="16" stroke="var(--blue)" strokeWidth="1.5" />
    </svg>
  );
}
