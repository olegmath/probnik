import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProbnik } from '../lib/ProbnikProvider.jsx';
import { validateSearchName, getStudentSearchNames } from '../lib/normalizeName.js';
import { pluralizeSubject } from '../lib/probnikData.js';
import Logo from '../components/decor/Logo.jsx';
import Squiggle from '../components/decor/Squiggle.jsx';
import BookDeco from '../components/decor/BookDeco.jsx';
import PenDeco from '../components/decor/PenDeco.jsx';

function Spinner({ size = 18, color = 'white' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" style={{ animation: 'spin 1s linear infinite' }}>
      <circle cx="9" cy="9" r="7" stroke={color} strokeWidth="2" strokeDasharray="22 22" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export default function Search() {
  const { allStudents, loading } = useProbnik();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [searching, setSearching] = useState(false);
  const [matches, setMatches] = useState([]);

  const handleSearch = () => {
    const validationError = validateSearchName(query);
    if (validationError) { setError(validationError); setMatches([]); return; }
    setError(''); setMatches([]); setSearching(true);
    const keys = getStudentSearchNames(query);
    const found = Object.values(allStudents).filter((p) =>
      (p.searchKeys || [p.searchKey || p.searchName]).some((k) => keys.includes(k))
    );
    setSearching(false);
    if (found.length === 1) {
      navigate(`/student/${encodeURIComponent(found[0].id)}`, { state: { student: found[0] } });
    } else if (found.length > 1) {
      setMatches(found.sort((a, b) => a.examType.localeCompare(b.examType)));
      setError('Выберите тип экзамена');
    } else {
      setError('Ученик не найден');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px', display: 'block' }}>
            <circle cx="24" cy="24" r="20" stroke="var(--blue)" strokeWidth="4" fill="none" strokeDasharray="31.4 62.8" />
          </svg>
          <p style={{ fontWeight: 700 }}>Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '40px 24px' }}>
      <Squiggle style={{ position: 'absolute', top: 32, right: 48, opacity: 0.9, pointerEvents: 'none' }} />
      <BookDeco style={{ position: 'absolute', bottom: 40, left: 36, opacity: 0.7, pointerEvents: 'none' }} />
      <PenDeco style={{ position: 'absolute', bottom: 36, right: 64, opacity: 0.6, pointerEvents: 'none' }} />

      <div className="fade-up" style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 2 }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <Logo size={52} />
          <div style={{ marginTop: 24, lineHeight: 1.05 }}>
            <div style={{ fontSize: 52, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--black)' }}>ОБЩАЯ</div>
            <div style={{ fontSize: 52, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.03em', color: 'var(--blue)' }}>СТАТИСТИКА</div>
          </div>
          <p style={{ fontSize: 15, color: 'var(--gray)', marginTop: 16, fontWeight: 500, lineHeight: 1.6 }}>
            Введите фамилию и имя ученика,<br />чтобы посмотреть статистику
          </p>
        </div>

        <div style={{ border: '2.5px solid var(--black)', borderRadius: 16, padding: 28, background: 'white' }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10, color: 'var(--black)' }}>
            Фамилия и имя ученика
          </label>
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setError(''); setMatches([]); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Иванов Иван"
            style={{ width: '100%', height: 52, padding: '0 16px', border: error ? '2px solid #e05' : '2px solid var(--border)', borderRadius: 10, fontSize: 16, fontFamily: 'Inter', fontWeight: 600, color: 'var(--black)', outline: 'none', transition: 'border 0.2s' }}
            onFocus={(e) => e.target.style.borderColor = 'var(--blue)'}
            onBlur={(e) => e.target.style.borderColor = error ? '#e05' : 'var(--border)'}
          />

          {error && <p style={{ color: '#e05', fontSize: 13, marginTop: 8, fontWeight: 600 }}>{error}</p>}

          {matches.length > 0 && (
            <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
              {matches.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => navigate(`/student/${encodeURIComponent(profile.id)}`, { state: { student: profile } })}
                  style={{ width: '100%', border: '2px solid var(--border)', borderRadius: 10, background: 'var(--white)', padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, fontFamily: 'Inter', transition: 'border-color 0.15s, background 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--black)'; e.currentTarget.style.background = '#fafafa'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--white)'; }}
                >
                  <span style={{ fontSize: 14, fontWeight: 850, color: 'var(--black)' }}>{profile.grade} класс</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--gray)' }}>
                    {profile.examType} · {profile.subjects.length} {pluralizeSubject(profile.subjects.length)}
                  </span>
                </button>
              ))}
            </div>
          )}

          <button
            onClick={handleSearch}
            disabled={searching}
            style={{ width: '100%', height: 52, marginTop: 14, borderRadius: 10, border: 'none', background: searching ? 'var(--border)' : 'var(--black)', color: 'white', fontSize: 15, fontWeight: 800, fontFamily: 'Inter', cursor: searching ? 'default' : 'pointer', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.15s' }}
            onMouseEnter={(e) => { if (!searching) e.currentTarget.style.background = 'var(--blue)'; }}
            onMouseLeave={(e) => { if (!searching) e.currentTarget.style.background = 'var(--black)'; }}
          >
            {searching ? <><Spinner /> ПОИСК…</> : 'НАЙТИ РЕЗУЛЬТАТЫ'}
          </button>
        </div>
      </div>
    </div>
  );
}
