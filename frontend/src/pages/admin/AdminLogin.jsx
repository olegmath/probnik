import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyAdminKey, saveAdminKey, isAdminAuthenticated } from '../../lib/marathonApi.js';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAdminAuthenticated()) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!key.trim()) return;
    setLoading(true);
    setError('');
    try {
      const ok = await verifyAdminKey(key.trim());
      if (ok) {
        saveAdminKey(key.trim());
        navigate('/admin/dashboard', { replace: true });
      } else {
        setError('Неверный ключ доступа');
      }
    } catch {
      setError('Ошибка соединения с сервером');
    }
    setLoading(false);
  };

  return (
    <section style={{ maxWidth: 440, margin: '80px auto', padding: '0 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Доступ</div>
        <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.025em', lineHeight: 1.05, margin: 0 }}>
          ADMIN <span style={{ fontStyle: 'italic', color: 'var(--blue)' }}>ПАНЕЛЬ</span>
        </h1>
      </div>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)', marginBottom: 6 }}>Ключ доступа</div>
          <input
            type="password"
            value={key}
            onChange={(e) => { setKey(e.target.value); setError(''); }}
            placeholder="Введите admin-ключ"
            autoFocus
            style={{ width: '100%', height: 44, padding: '0 14px', border: `2px solid ${error ? '#e05454' : 'var(--border)'}`, borderRadius: 10, fontSize: 14, fontFamily: 'Inter', fontWeight: 600, color: 'var(--black)', background: 'var(--white)', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
          />
          {error && <div style={{ fontSize: 12, color: '#e05454', fontWeight: 700, marginTop: 6 }}>{error}</div>}
        </div>
        <button
          type="submit"
          disabled={loading || !key.trim()}
          style={{ width: '100%', height: 44, border: '2px solid var(--black)', borderRadius: 10, background: loading || !key.trim() ? 'var(--border)' : 'var(--black)', color: loading || !key.trim() ? 'var(--gray)' : 'var(--white)', fontSize: 13, fontWeight: 900, cursor: loading || !key.trim() ? 'default' : 'pointer', fontFamily: 'Inter', transition: 'background 0.15s, color 0.15s' }}
        >
          {loading ? 'Проверка...' : 'Войти'}
        </button>
      </form>
    </section>
  );
}
