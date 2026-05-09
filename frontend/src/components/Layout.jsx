import { NavLink, Outlet } from 'react-router-dom';
import Logo from './decor/Logo';

const headerStyle = {
  background: 'white',
  borderBottom: '2px solid var(--black)',
  padding: '0 40px',
  height: 60,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  position: 'sticky',
  top: 0,
  zIndex: 100,
};

const navStyle = {
  display: 'flex',
  gap: 8,
};

function tabStyle({ isActive }) {
  return {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: 700,
    padding: '8px 18px',
    borderRadius: 100,
    border: '2px solid var(--black)',
    background: isActive ? 'var(--black)' : 'transparent',
    color: isActive ? 'var(--white)' : 'var(--black)',
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
  };
}

export default function Layout() {
  return (
    <>
      <header style={headerStyle}>
        <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Logo size={32} />
          <span style={{ fontWeight: 900, fontSize: 17, letterSpacing: '-0.02em' }}>
            СТАТИСТИКА
          </span>
        </NavLink>
        <nav style={navStyle}>
          <NavLink to="/" end style={tabStyle}>
            Поиск ученика
          </NavLink>
          <NavLink to="/rating" style={tabStyle}>
            Рейтинг марафона
          </NavLink>
        </nav>
      </header>
      <main className="fade-up">
        <Outlet />
      </main>
    </>
  );
}
