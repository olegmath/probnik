import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRatings } from '../lib/marathonApi.js';
import { IconCrownFilled, IconRocket, IconSeedlingFilled } from '@tabler/icons-react';

const SCORE_STATUS = (score) => score >= 95 ? 'legends' : score >= 45 ? 'champs' : 'starters';

function nameHash(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xfffff;
  return h;
}

function Avatar({ name, size = 32 }) {
  const hue = nameHash(name) % 360;
  const initials = name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `hsl(${hue}, 60%, 55%)`,
      color: '#fff', fontWeight: 800, fontSize: size * 0.38,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, lineHeight: 1,
    }}>
      {initials}
    </div>
  );
}

const MEDAL_BY_PLACE = {
  1: { emoji: '🥇', bg: '#fffbe8', accent: '#f5c842' },
  2: { emoji: '🥈', bg: '#f6f6f6', accent: '#b0b0b0' },
  3: { emoji: '🥉', bg: '#fff3ec', accent: '#d4845a' },
};

const COLUMN_CONFIG = {
  legends: { title: 'ЛЕГЕНДЫ',   color: '#f5a623', accentBg: '#fff9ee', icon: <IconCrownFilled size={18} /> },
  champs:  { title: 'КРУТЫШИ',   color: 'var(--blue)', accentBg: '#eef4ff', icon: <IconRocket size={18} /> },
  starters:{ title: 'НА СТАРТЕ', color: '#888', accentBg: '#f7f7f7', icon: <IconSeedlingFilled size={18} /> },
};

function RatingColumn({ type, players }) {
  const cfg = COLUMN_CONFIG[type];
  return (
    <div style={{ flex: 1, minWidth: 0, border: '2px solid var(--border)', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ borderBottom: `3px solid ${cfg.color}`, background: cfg.accentBg, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: cfg.color, display: 'flex', alignItems: 'center' }}>{cfg.icon}</span>
        <span style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-0.01em', fontStyle: 'italic', color: cfg.color }}>{cfg.title}</span>
        {players.length > 0 && (
          <span style={{ fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: '0.04em', marginLeft: 'auto' }}>{players.length}</span>
        )}
      </div>
      {/* Subheader */}
      <div style={{ padding: '4px 0', display: 'grid', gridTemplateColumns: '44px 32px 1fr', gap: '0 8px', alignItems: 'center', borderBottom: '1px solid var(--border)', background: '#fafafa' }}>
        <div style={{ padding: '5px 0 5px 14px', fontSize: 9, fontWeight: 900, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>#</div>
        <div />
        <div style={{ padding: '5px 0', fontSize: 9, fontWeight: 900, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>ИМЯ / БАЛЛЫ</div>
      </div>
      {/* Rows */}
      <div style={{ flex: 1, maxHeight: 400, overflowY: 'auto' }}>
        {players.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--gray)', fontSize: 13, fontWeight: 600 }}>Нет участников</div>
        ) : players.map((p, i) => {
          const score = typeof p.finalScore === 'number' ? p.finalScore : (p.score || 0);
          const place = p.place || i + 1;
          const medal = MEDAL_BY_PLACE[place];
          return (
            <div key={`${p.name}-${i}`} style={{
              display: 'grid', gridTemplateColumns: '44px 32px 1fr',
              gap: '0 8px', alignItems: 'center',
              padding: '8px 12px 8px 14px',
              borderBottom: '1px solid var(--border)',
              background: medal ? medal.bg : 'transparent',
              borderLeft: medal ? `3px solid ${medal.accent}` : '3px solid transparent',
            }}>
              <div style={{ fontSize: medal ? 20 : 18, fontWeight: 900, color: medal ? 'inherit' : 'var(--gray)', lineHeight: 1, fontStyle: medal ? 'normal' : 'italic', textAlign: 'center' }}>
                {medal ? medal.emoji : place}
              </div>
              <Avatar name={p.name} size={28} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, fontStyle: 'italic', lineHeight: 1.2, color: 'var(--black)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: cfg.color, marginTop: 1 }}>
                  {score.toFixed(2)}
                </div>
                <div style={{ marginTop: 4, height: 3, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, score)}%`, background: cfg.color, borderRadius: 2, transition: 'width 0.4s ease' }} />
                </div>
              </div>
            </div>
          );
        })}
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
        // 10 классы марафон не пишут — исключаем их из рейтинга (приходят в /api/ratings для Поиска/Учебного года).
        const rows = (res?.rows || []).filter((r) => r.grade !== '10');
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
    const sorted = [...filteredRows].sort((a, b) => (b.finalScore ?? b.score ?? 0) - (a.finalScore ?? a.score ?? 0));
    let currentPlace = 0;
    let prevScore = null;
    const ranked = sorted.map((r) => {
      const score = r.finalScore ?? r.score ?? 0;
      if (score !== prevScore) { currentPlace += 1; prevScore = score; }
      return { ...r, place: currentPlace };
    });
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
    <main className="page-pad" style={{ maxWidth: 1200, margin: '0 auto', width: '100%', padding: '32px 24px' }}>
      <button onClick={() => navigate(-1)} style={backBtnStyle}>← Назад</button>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Марафон</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h1 className="rating-page-title" style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-0.025em', lineHeight: 1.05, margin: 0 }}>
            РЕЙТИНГ <span style={{ fontStyle: 'italic', color: 'var(--blue)' }}>МАРАФОНА</span>
          </h1>
        </div>
      </div>

      {/* Subject buttons */}
      <div className="subject-filter-grid" style={{ marginBottom: 12 }}>
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
        <div className="rating-grid">
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
