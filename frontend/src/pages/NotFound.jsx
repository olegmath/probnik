import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section style={{ maxWidth: 600, margin: '120px auto', padding: '0 24px', textAlign: 'center' }}>
      <h1 style={{ fontSize: 64, fontWeight: 900, letterSpacing: '-0.04em' }}>404</h1>
      <p style={{ color: 'var(--gray)', fontSize: 16, margin: '12px 0 24px' }}>Страница не найдена</p>
      <Link
        to="/"
        style={{
          display: 'inline-block',
          padding: '10px 20px',
          border: '2px solid var(--black)',
          borderRadius: 100,
          fontWeight: 700,
        }}
      >
        На главную
      </Link>
    </section>
  );
}
