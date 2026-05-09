import { NavLink, Outlet } from 'react-router-dom';
import Logo from './decor/Logo';

export default function Layout() {
  return (
    <>
      <header className="site-header">
        <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Logo size={32} />
          <span className="site-logo-text" style={{ fontWeight: 900, fontSize: 17, letterSpacing: '-0.02em' }}>
            СТАТИСТИКА
          </span>
        </NavLink>
        <nav className="site-nav">
          <NavLink to="/" end className={({ isActive }) => `site-nav-link${isActive ? ' active' : ''}`}>
            Поиск ученика
          </NavLink>
          <NavLink to="/rating" className={({ isActive }) => `site-nav-link${isActive ? ' active' : ''}`}>
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
