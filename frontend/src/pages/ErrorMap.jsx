import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useProbnik } from '../lib/ProbnikProvider.jsx';
import { getErrorMap } from '../lib/marathonApi.js';
import { safeDecode } from '../lib/safeDecode';

function StatusBadge({ status }) {
  const configs = {
    fixed:      { label: 'Исправлено',    bg: 'rgba(52,184,122,0.12)',  color: '#238B2F' },
    remaining:  { label: 'Нужно исправить', bg: 'rgba(224,84,84,0.12)', color: '#e05454' },
    unfinished: { label: 'Не выполнен',   bg: 'rgba(245,166,35,0.14)', color: '#B46C00' },
    empty:      { label: 'Нет попыток',   bg: 'rgba(140,192,220,0.15)', color: 'var(--blue2)' },
    ok:         { label: 'Ошибок нет',    bg: 'rgba(52,184,122,0.12)',  color: '#238B2F' },
  };
  const cfg = configs[status] || configs.empty;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '5px 12px', fontWeight: 700, fontSize: 12, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
      {cfg.label}
    </span>
  );
}

function AttemptDots({ attempts = [] }) {
  return (
    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
      {attempts.map((a, i) => (
        <span key={`${a.isCorrect}-${i}`} style={{ width: 16, height: 16, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, background: a.isCorrect ? '#34b87a' : '#e05454', color: 'white' }}>
          {a.isCorrect ? '✓' : '×'}
        </span>
      ))}
    </div>
  );
}

function DayCard({ day }) {
  const subMaps = day.maps || [];
  const questions = subMaps.flatMap((item) =>
    (item.questions || []).map((q) => ({ ...q, marathonPlan: item.marathonPlan || day.marathonPlan || null }))
  ).sort((a, b) => (a.number || 0) - (b.number || 0));

  const wrongTotal = subMaps.reduce((s, m) => s + Number(m.summary?.wrongTotal || 0), 0);
  const fixed = subMaps.reduce((s, m) => s + Number(m.summary?.fixed || 0), 0);
  const remaining = subMaps.reduce((s, m) => s + Number(m.summary?.remaining || 0), 0);

  const getStatus = () => {
    if (day.completed === false) return 'unfinished';
    if (subMaps.length === 0) return 'empty';
    if (remaining > 0) return 'remaining';
    if (wrongTotal > 0) return 'fixed';
    return 'ok';
  };

  const status = getStatus();

  const getTaskLabel = (q) => {
    if (q.plannedTask?.label) return q.plannedTask.label;
    if (q.marathonPlan?.label) return q.marathonPlan.label;
    return q.number ? `${q.number}` : '?';
  };

  const getTopicNote = (q) => {
    const mp = q.marathonPlan;
    if (!mp) return '';
    return mp.topic || mp.section || '';
  };

  return (
    <div style={{ border: '2px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '12px 16px', borderBottom: '1px solid var(--border)', background: '#f8fcfe' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--black)', lineHeight: 1 }}>
            {day.title || day.dayTitle || `День ${day.dayOrder || day.dayNumber || '?'}`}
          </div>
          <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 4, fontWeight: 600 }}>
            {day.dateLabel || day.dateKey || ''}
            {subMaps.length > 0 && wrongTotal > 0 && ` · ошибок: ${wrongTotal}, исправлено: ${fixed}, осталось: ${remaining}`}
          </div>
          {day.marathonPlan && (
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue2)', marginTop: 3 }}>
              {[day.marathonPlan.label, day.marathonPlan.topic || day.marathonPlan.section].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
        <StatusBadge status={status} />
      </div>

      <div style={{ padding: '12px 16px' }}>
        {status === 'unfinished' && (
          <p style={{ fontSize: 13, color: 'var(--gray)', fontWeight: 600, margin: 0 }}>
            Ученик не выполнил этот день — ошибок нет не потому, что всё верно, а потому что не было сдачи.
          </p>
        )}
        {status === 'empty' && (
          <p style={{ fontSize: 13, color: 'var(--gray)', fontWeight: 600, margin: 0 }}>Пока нет проверенных попыток по этому дню.</p>
        )}
        {status === 'ok' && (
          <p style={{ fontSize: 13, color: '#34b87a', fontWeight: 700, margin: 0 }}>Ошибок в проверенных попытках нет.</p>
        )}
        {(status === 'fixed' || status === 'remaining') && questions.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'Inter' }}>
              <thead>
                <tr style={{ background: '#f8f8f8' }}>
                  {['Задание', 'Тема', 'История', 'Ошибок', 'Статус'].map((h) => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--black)', borderBottom: '2px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {questions.map((q, i) => (
                  <tr key={q.number ?? i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '9px 10px', fontWeight: 900, fontSize: 13 }}>№{getTaskLabel(q)}</td>
                    <td style={{ padding: '9px 10px', color: 'var(--gray)', fontWeight: 600, maxWidth: 220 }}>{getTopicNote(q) || '—'}</td>
                    <td style={{ padding: '9px 10px' }}><AttemptDots attempts={q.attempts || []} /></td>
                    <td style={{ padding: '9px 10px', fontWeight: 900, textAlign: 'center' }}>{Number(q.wrongAttempts || 0)}</td>
                    <td style={{ padding: '9px 10px' }}><StatusBadge status={q.status || 'empty'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ErrorMap() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { allStudents } = useProbnik();

  const student = state?.student || allStudents[safeDecode(id)];
  const subjects = student?.subjects?.map((s) => s.name) || [];

  const [activeSubject, setActiveSubject] = useState(subjects[0] || '');
  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!student || !activeSubject) return;
    setLoading(true);
    setError('');
    setMaps([]);
    getErrorMap({ studentName: student.name, subject: activeSubject, level: student.examType })
      .then((res) => { setMaps(res?.maps || []); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [student?.name, activeSubject]);

  if (!student) return <div style={{ padding: 40 }}>Ученик не найден</div>;

  const totalErrors = maps.reduce((s, d) => {
    const sub = d.maps || [];
    return s + sub.reduce((ss, m) => ss + Number(m.summary?.wrongTotal || 0), 0);
  }, 0);
  const totalFixed = maps.reduce((s, d) => {
    const sub = d.maps || [];
    return s + sub.reduce((ss, m) => ss + Number(m.summary?.fixed || 0), 0);
  }, 0);
  const totalRemaining = maps.reduce((s, d) => {
    const sub = d.maps || [];
    return s + sub.reduce((ss, m) => ss + Number(m.summary?.remaining || 0), 0);
  }, 0);

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', width: '100%', padding: '32px 24px' }}>
      <div style={{ marginBottom: 14 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ borderRadius: 100, border: '2px solid var(--black)', background: 'var(--white)', color: 'var(--black)', cursor: 'pointer', padding: '6px 14px', fontFamily: 'Inter', fontSize: 12, fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', transition: 'background 0.15s, color 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--black)'; e.currentTarget.style.color = 'var(--white)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--white)'; e.currentTarget.style.color = 'var(--black)'; }}
        >
          <span style={{ fontSize: 14, lineHeight: 1 }}>‹</span>Назад
        </button>
      </div>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Марафон</div>
        <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.025em', lineHeight: 1.05, margin: 0 }}>
          Карта ошибок<br />
          <span style={{ fontStyle: 'italic', color: 'var(--blue)', fontSize: 28 }}>{student.name}</span>
        </h1>
      </div>

      {subjects.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
          {subjects.map((s) => {
            const active = activeSubject === s;
            return (
              <button key={s} onClick={() => setActiveSubject(s)}
                style={{ border: active ? '2px solid var(--black)' : '2px solid var(--border)', background: active ? 'var(--black)' : 'var(--white)', color: active ? 'var(--white)' : 'var(--black)', borderRadius: 100, padding: '7px 16px', cursor: 'pointer', fontFamily: 'Inter', fontSize: 12, fontWeight: 800, transition: 'all 0.15s' }}>
                {s}
              </button>
            );
          })}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <svg width="40" height="40" viewBox="0 0 48 48" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', display: 'block' }}>
            <circle cx="24" cy="24" r="20" stroke="var(--blue)" strokeWidth="4" fill="none" strokeDasharray="31.4 62.8" />
          </svg>
          <p style={{ fontWeight: 700, color: 'var(--gray)' }}>Загрузка карты ошибок...</p>
        </div>
      )}

      {error && (
        <div style={{ border: '2px solid #e05454', borderRadius: 12, padding: 20, background: 'rgba(224,84,84,0.05)', marginBottom: 20 }}>
          <div style={{ fontWeight: 900, color: '#e05454', marginBottom: 4 }}>Ошибка загрузки</div>
          <div style={{ fontSize: 13, color: 'var(--gray)' }}>{error}</div>
          <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 8 }}>Возможно, у ученика нет записей в марафоне или нужен admin-ключ.</div>
        </div>
      )}

      {!loading && !error && maps.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
            {[
              { label: 'Всего ошибок', value: totalErrors, color: 'var(--black)', border: 'var(--border)' },
              { label: 'Исправлено', value: totalFixed, color: '#34b87a', border: '#34b87a' },
              ...(totalRemaining > 0 ? [{ label: 'Осталось', value: totalRemaining, color: '#e05454', border: '#e05454' }] : []),
            ].map(({ label, value, color, border }) => (
              <div key={label} style={{ border: `2px solid ${border}`, borderRadius: 12, padding: '10px 18px', minWidth: 110 }}>
                <div style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)' }}>{label}</div>
                <div style={{ fontSize: 30, fontWeight: 950, color, fontStyle: 'italic', lineHeight: 1.1 }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {maps.map((day, i) => <DayCard key={day.dayOrder ?? day.dayKey ?? day.dateKey ?? i} day={day} />)}
          </div>
        </>
      )}

      {!loading && !error && maps.length === 0 && (
        <div style={{ border: '2px solid var(--border)', borderRadius: 14, padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
          <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 8 }}>Данных пока нет</div>
          <div style={{ color: 'var(--gray)', fontSize: 14 }}>У этого ученика нет записей в марафоне по выбранному предмету.</div>
        </div>
      )}
    </main>
  );
}
