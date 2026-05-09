export default function Chip({ children, filled = true, small = false }) {
  return (
    <span
      style={{
        display: 'inline-block',
        background: filled ? 'var(--blue)' : 'transparent',
        border: filled ? 'none' : '2px solid var(--black)',
        color: filled ? 'var(--white)' : 'var(--black)',
        borderRadius: 100,
        padding: small ? '4px 14px' : '6px 20px',
        fontSize: small ? 13 : 15,
        fontWeight: 700,
        fontFamily: 'Inter',
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}
