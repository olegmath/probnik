import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRatings } from '../lib/marathonApi.js';

function FlameIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C12 2 7 8 7 13a5 5 0 0010 0c0-5-5-11-5-11z" fill="var(--blue)" stroke="var(--black)" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M12 14c0 1.1-.9 2-2 2" stroke="var(--white)" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}
function ThumbsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M7 22V11M2 13v7a2 2 0 002 2h11.5a2 2 0 001.98-1.74l1-8A2 2 0 0016.5 9H14V5a2 2 0 00-2-2h-.5c-.83 0-1.5.67-1.5 1.5V8a1 1 0 01-1 1H4a2 2 0 00-2 2v2z" stroke="var(--blue)" strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  );
}
function TurtleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <ellipse cx="12" cy="12" rx="6" ry="5" stroke="var(--blue)" strokeWidth="1.8"/>
      <path d="M6 10l-3-2M6 14l-3 2M18 10l3-2M18 14l3 2M10 17l-1 3M14 17l1 3" stroke="var(--blue)" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

const SCORE_STATUS = (score) => score >= 95 ? 'legends' : score >= 45 ? 'champs' : 'starters';

const COLUMN_CONFIG = {
  legends: { title: 'ЛЕГЕНДЫ',   icon: <FlameIcon />,  color: '#f5a623' },
  champs:  { title: 'КРУТЫШИ',   icon: <ThumbsIcon />, color: 'var(--blue)' },
  starters:{ title: 'НА СТАРТЕ', icon: <TurtleIcon />, color: 'var(--gray)' },
};

function RatingColumn({ type, players }) {
  const cfg = COLUMN_CONFIG[type];
  const slots = [...players, ...Array(Math.max(0, 5 - players.length)).fill(null)];
  return (
    <div style={{ flex: 1, minWidth: 0, border: '2px solid var(--border)', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'var(--black)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.01em', fontStyle: 'italic', color: cfg.color }}>{cfg.title}</span>
        {cfg.icon}
      </div>
      <div style={{ padding: '4px 0', display: 'grid', gridTemplateColumns: '52px 1fr', gap: '0 8px', alignItems: 'center', borderBottom: '1px solid var(--border)', marginBottom: 0, background: '#fafafa' }}>
        <div style={{ padding: '5px 16px', fontSize: 9, fontWeight: 900, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>МЕСТО</div>
        <div style={{ padding: '5px 0', fontSize: 9, fontWeight: 900, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>ИМЯ / БАЛЛЫ</div>
      </div>
      <div style={{ flex: 1 }}>
        {slots.map((p, i) =>
          p ? (
            <div key={`${p.name}-${i}`} style={{ display: 'grid', gridTemplateColumns: '52px 1fr', gap: '0 8px', alignItems: 'center', padding: '7px 0 7px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: i < 3 ? cfg.color : 'var(--black)', lineHeight: 1, fontStyle: 'italic' }}>{p.place || i + 1}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, fontStyle: 'italic', lineHeight: 1.2, color: 'var(--black)' }}>{p.name}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--blue)', marginTop: 1 }}>
                  {typeof p.finalScore === 'number' ? p.finalScore.toFixed(2) : (p.score || 0)}
                </div>
              </div>
            </div>
          ) : (
            <div key={`empty-${i}`} style={{ height: 44, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 16px' }}>
              <div style={{ height: 1, background: 'var(--border)', width: '100%', opacity: 0.5 }} />
            </div>
          )
        )}
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options, disabled, placeholder }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      {label && <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)' }}>{label}</div>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{ height: 38, padding: '0 12px', border: '2px solid var(--border)', borderRadius: 10, fontSize: 13, fontFamily: 'Inter', fontWeight: 700, color: disabled ? 'var(--gray)' : 'var(--black)', background: 'var(--white)', outline: 'none', cursor: disabled ? 'default' : 'pointer', minWidth: 200, maxWidth: 280 }}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export default function Rating() {
  const navigate = useNavigate();
  const [rawRows, setRawRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeSubject, setActiveSubject] = useState('');
  const [activeLevel, setActiveLevel] = useState('');
  const [activeTeacher, setActiveTeacher] = useState('');
  const [activeGroup, setActiveGroup] = useState('');

  useEffect(() => {
    getRatings({ isPublic: true })
      .then((res) => {
        const rows = res?.rows || [];
        setRawRows(rows);
        if (rows.length > 0) {
          setActiveSubject(rows[0].subject || '');
          setActiveLevel(rows[0].level || '');
        }
        setLoading(false);
      })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  const subjects = useMemo(() => [...new Set(rawRows.map((r) => r.subject).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru')), [rawRows]);

  const levels = useMemo(() => {
    const filtered = activeSubject ? rawRows.filter((r) => r.subject === activeSubject) : rawRows;
    return [...new Set(filtered.map((r) => r.level).filter(Boolean))].sort();
  }, [rawRows, activeSubject]);

  const teachers = useMemo(() => {
    const filtered = rawRows.filter((r) =>
      (!activeSubject || r.subject === activeSubject) &&
      (!activeLevel || r.level === activeLevel)
    );
    return [...new Set(filtered.map((r) => r.teacher).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru'));
  }, [rawRows, activeSubject, activeLevel]);

  const groups = useMemo(() => {
    const filtered = rawRows.filter((r) =>
      (!activeSubject || r.subject === activeSubject) &&
      (!activeLevel || r.level === activeLevel) &&
      (!activeTeacher || r.teacher === activeTeacher)
    );
    return [...new Set(filtered.map((r) => r.group).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru'));
  }, [rawRows, activeSubject, activeLevel, activeTeacher]);

  const filteredRows = useMemo(() => {
    return rawRows.filter((r) =>
      (!activeSubject || r.subject === activeSubject) &&
      (!activeLevel || r.level === activeLevel) &&
      (!activeTeacher || r.teacher === activeTeacher) &&
      (!activeGroup || r.group === activeGroup)
    );
  }, [rawRows, activeSubject, activeLevel, activeTeacher, activeGroup]);

  const { legends, champs, starters } = useMemo(() => {
    const ranked = [...filteredRows]
      .sort((a, b) => (b.finalScore ?? b.score ?? 0) - (a.finalScore ?? a.score ?? 0))
      .map((r, i) => ({ ...r, place: i + 1 }));
    return {
      legends:  ranked.filter((r) => SCORE_STATUS(r.finalScore ?? r.score ?? 0) === 'legends'),
      champs:   ranked.filter((r) => SCORE_STATUS(r.finalScore ?? r.score ?? 0) === 'champs'),
      starters: ranked.filter((r) => SCORE_STATUS(r.finalScore ?? r.score ?? 0) === 'starters'),
    };
  }, [filteredRows]);

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px', display: 'block' }}>
            <circle cx="24" cy="24" r="20" stroke="var(--blue)" strokeWidth="4" fill="none" strokeDasharray="31.4 62.8" />
          </svg>
          <p style={{ fontWeight: 700 }}>Загрузка рейтинга...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <section style={{ maxWidth: 600, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 900 }}>Рейтинг недоступен</h1>
        <p style={{ color: 'var(--gray)', marginTop: 8 }}>{error}</p>
      </section>
    );
  }

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', width: '100%', padding: '32px 24px' }}>
      <button onClick={() => navigate(-1)} style={backBtnStyle}>← Назад</button>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Марафон</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-0.025em', lineHeight: 1.05, margin: 0 }}>
            РЕЙТИНГ <span style={{ fontStyle: 'italic', color: 'var(--blue)' }}>МАРАФОНА</span>
          </h1>
        </div>
      </div>

      {/* Subject buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {subjects.map((s) => {
          const active = activeSubject === s;
          return (
            <button key={s} onClick={() => { setActiveSubject(s); setActiveTeacher(''); setActiveGroup(''); }}
              style={{ border: active ? '2px solid var(--black)' : '2px solid var(--border)', background: active ? 'var(--black)' : 'var(--white)', color: active ? 'var(--white)' : 'var(--black)', borderRadius: 100, padding: '7px 16px', cursor: 'pointer', fontFamily: 'Inter', fontSize: 12, fontWeight: 800, transition: 'all 0.15s' }}>
              {s}
            </button>
          );
        })}
      </div>

      {/* Level + teacher + group filters */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {levels.map((lvl) => {
            const active = activeLevel === lvl;
            return (
              <button key={lvl} onClick={() => { setActiveLevel(lvl); setActiveTeacher(''); setActiveGroup(''); }}
                style={{ border: active ? '2px solid var(--blue)' : '2px solid var(--border)', background: active ? 'var(--blue)' : 'var(--white)', color: active ? 'var(--white)' : 'var(--black)', borderRadius: 100, padding: '5px 14px', cursor: 'pointer', fontFamily: 'Inter', fontSize: 12, fontWeight: 800, transition: 'all 0.15s' }}>
                {lvl}
              </button>
            );
          })}
        </div>

        {teachers.length > 0 && (
          <SelectField
            label="Преподаватель"
            value={activeTeacher}
            onChange={(v) => { setActiveTeacher(v); setActiveGroup(''); }}
            options={teachers}
            placeholder="Все преподаватели"
          />
        )}

        {activeTeacher && groups.length > 0 && (
          <SelectField
            label="Группа"
            value={activeGroup}
            onChange={setActiveGroup}
            options={groups}
            placeholder="Все группы"
          />
        )}
      </div>

      <div style={{ height: 2, background: 'var(--black)', borderRadius: 2, marginBottom: 20 }} />

      {filteredRows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--gray)', fontWeight: 700 }}>Нет данных по выбранным фильтрам</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
          <RatingColumn type="legends" players={legends} />
          <RatingColumn type="champs" players={champs} />
          <RatingColumn type="starters" players={starters} />
        </div>
      )}
    </main>
  );
}

const backBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  marginBottom: 20,
  padding: '7px 16px',
  border: '2px solid var(--border)',
  borderRadius: 100,
  background: 'var(--white)',
  color: 'var(--black)',
  fontSize: 13,
  fontWeight: 700,
  fontFamily: 'Inter',
  cursor: 'pointer',
  transition: 'border-color 0.15s',
};
