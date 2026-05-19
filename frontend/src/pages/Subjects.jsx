import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useProbnik } from '../lib/ProbnikProvider.jsx';
import { pluralizeSubject, pluralizePoints, getMaxScore, pluralizeAttempts } from '../lib/probnikData.js';
import Chip from '../components/ui/Chip.jsx';
import Squiggle from '../components/decor/Squiggle.jsx';

export default function Subjects() {
  const { id } = useParams();
  const { state } = useLocation();
  const { allStudents, probnikCatalog = {} } = useProbnik();
  const navigate = useNavigate();

  const student = state?.student || allStudents[decodeURIComponent(id)];
  if (!student) {
    return <div style={{ padding: 40 }}>Ученик не найден</div>;
  }

  const writtenTotal = student.subjects.reduce((s, x) => s + (x.attempts?.length || 0), 0);
  const heldTotal = student.subjects.reduce((s, x) => s + (probnikCatalog[x.name] || 0), 0);

  if (writtenTotal === 0) {
    return (
      <main className="subjects-main" style={{ flex: 1, maxWidth: 760, margin: '0 auto', width: '100%', padding: '40px 32px', position: 'relative', overflow: 'hidden' }}>
        <Squiggle style={{ position: 'absolute', top: -10, right: -20, opacity: 0.6, pointerEvents: 'none' }} />
        <button onClick={() => navigate(-1)} style={backBtnStyle}>← Назад</button>
        <div className="fade-up" style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Chip>{student.examType} 2026</Chip>
          </div>
          <div style={{ fontSize: 13, color: 'var(--gray)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ученик</div>
          <h1 className="subjects-title" style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.025em', lineHeight: 1.1, color: 'var(--black)' }}>
            {student.name.split(' ')[0]}<br />
            <span style={{ fontStyle: 'italic', color: 'var(--blue)' }}>{student.name.split(' ').slice(1).join(' ')}</span>
          </h1>
          <div style={{ fontSize: 14, color: 'var(--gray)', marginTop: 8, fontWeight: 500 }}>{student.grade} класс</div>
        </div>
        <div style={{ border: '2px dashed var(--border)', borderRadius: 16, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--black)' }}>Ученик ещё не писал ни одного пробника</div>
          <div style={{ fontSize: 14, color: 'var(--gray)', fontWeight: 500, marginTop: 8 }}>Результаты появятся здесь, как только он напишет первый пробник.</div>
        </div>
      </main>
    );
  }

  const avg = Math.round(student.subjects.reduce((s, x) => s + (x.secondaryScore || 0), 0) / student.subjects.length);
  const total = student.subjects.reduce((s, x) => s + (student.examType === 'ОГЭ' ? (x.primaryScore || 0) : (x.secondaryScore || 0)), 0);

  return (
    <main
      className="subjects-main"
      style={{ flex: 1, maxWidth: 760, margin: '0 auto', width: '100%', padding: '40px 32px', position: 'relative', overflow: 'hidden' }}
    >
      <Squiggle style={{ position: 'absolute', top: -10, right: -20, opacity: 0.6, pointerEvents: 'none' }} />
      <button onClick={() => navigate(-1)} style={backBtnStyle}>← Назад</button>

      <div className="fade-up subjects-hero" style={{ marginBottom: 40 }}>
        <div className="subjects-hero-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Chip>{student.examType} 2026</Chip>
            </div>
            <div style={{ fontSize: 13, color: 'var(--gray)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ученик</div>
            <h1 className="subjects-title" style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.025em', lineHeight: 1.1, color: 'var(--black)' }}>
              {student.name.split(' ')[0]}<br />
              <span style={{ fontStyle: 'italic', color: 'var(--blue)' }}>{student.name.split(' ').slice(1).join(' ')}</span>
            </h1>
            <div style={{ fontSize: 14, color: 'var(--gray)', marginTop: 8, fontWeight: 500 }}>{student.grade} класс</div>
            <div style={{ fontSize: 13, color: 'var(--gray)', fontWeight: 700, marginTop: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Преподаватели</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {student.subjects.map((subj, i) => (
                <div key={i} style={{ fontSize: 13, color: 'var(--gray)', fontWeight: 500 }}>
                  {subj.name} — <span style={{ fontWeight: 600, color: 'var(--black)' }}>{subj.teacher}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ border: '3px solid var(--black)', borderRadius: 20, padding: '20px 32px', textAlign: 'center', minWidth: 140 }}>
            <div style={{ fontSize: 68, fontWeight: 900, color: 'var(--blue)', lineHeight: 1, fontStyle: 'italic' }}>{avg}</div>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4, color: 'var(--black)' }}>{pluralizePoints(avg).toUpperCase()}</div>
            <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2, fontWeight: 500 }}>средний результат</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--blue-light)', borderRadius: 12, padding: '10px 20px', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--blue2)' }}>{total}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{pluralizePoints(total)}</span>
          </div>
          <div style={{ background: '#f5f5f5', borderRadius: 12, padding: '10px 20px', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 22, fontWeight: 900 }}>{student.subjects.length}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{pluralizeSubject(student.subjects.length)}</span>
          </div>
          <div style={{ background: '#f5f5f5', borderRadius: 12, padding: '10px 20px', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 22, fontWeight: 900 }}>{writtenTotal} из {Math.max(heldTotal, writtenTotal)}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{pluralizeAttempts(Math.max(heldTotal, writtenTotal))}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>ПРЕДМЕТЫ</span>
        <div style={{ flex: 1, height: 2, background: 'var(--black)' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {student.subjects.map((subj, i) => {
          const isOGE = student.examType === 'ОГЭ';
          const written = subj.attempts?.length || 0;
          const held = probnikCatalog[subj.name] || 0;
          const p = subj.secondaryScore || 0;
          const dotColor = isOGE
            ? (p >= 4 ? '#34b87a' : p >= 3 ? '#f5a623' : '#e05454')
            : (p >= 70 ? '#34b87a' : p >= 50 ? '#f5a623' : '#e05454');
          const scoreTextColor = isOGE
            ? (p >= 4 ? 'var(--blue2)' : p >= 3 ? '#f5a623' : '#e05454')
            : (p >= 70 ? 'var(--blue2)' : p >= 50 ? '#f5a623' : '#e05454');
          const progressWidth = isOGE ? Math.min(100, (p / 5) * 100) : Math.min(100, p);

          return (
            <div
              key={i}
              onClick={() => navigate(`/student/${encodeURIComponent(id)}/probniki/${encodeURIComponent(subj.name)}`, { state: { student, subject: subj } })}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < student.subjects.length - 1 ? '1.5px solid #eee' : 'none', cursor: 'pointer', gap: 16, transition: 'padding 0.15s', padding: '18px 0px' }}
              onMouseEnter={(e) => e.currentTarget.style.paddingLeft = '8px'}
              onMouseLeave={(e) => e.currentTarget.style.paddingLeft = '0'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, letterSpacing: '-0.01em', fontSize: '20px' }}>{subj.name}</div>
                  {subj.date && (
                    <div style={{ fontSize: 12, color: 'var(--gray)', fontWeight: 700, marginTop: 4 }}>
                      {held > 0
                        ? `${written} из ${Math.max(held, written)} ${pluralizeAttempts(Math.max(held, written))}, последний ${subj.date}`
                        : (written > 1 ? `${written} ${pluralizeAttempts(written)}, последний ${subj.date}` : `Пробник ${subj.date}`)}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
                <div className="subj-progress" style={{ width: 120, height: 6, borderRadius: 4, background: '#eee', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progressWidth}%`, background: dotColor, borderRadius: 4 }} />
                </div>
                <div style={{ width: 80, textAlign: 'right' }}>
                  <span style={{ fontWeight: 900, fontSize: 24, color: scoreTextColor }}>{p}</span>
                  <span style={{ fontSize: 13, color: 'var(--gray)', fontWeight: 600 }}>{isOGE ? '/5' : '/100'}</span>
                </div>
                <div className="subj-primary" style={{ fontSize: 13, color: 'var(--gray)', fontWeight: 700, width: 54, textAlign: 'right' }}>{subj.primaryScore}/{getMaxScore(subj.name)}</div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 3L11 8L6 13" stroke="var(--border)" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
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
  background: 'white',
  color: 'var(--black)',
  fontSize: 13,
  fontWeight: 700,
  fontFamily: 'Inter',
  cursor: 'pointer',
};
