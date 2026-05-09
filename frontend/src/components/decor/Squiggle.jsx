export default function Squiggle({ color = 'var(--blue)', style = {} }) {
  return (
    <svg width="90" height="70" viewBox="0 0 90 70" fill="none" style={style}>
      <path
        d="M5 55 C15 20, 30 65, 45 30 C60 -5, 75 50, 85 15"
        stroke={color}
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
