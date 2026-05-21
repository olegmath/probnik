import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { useProbnik } from '../lib/ProbnikProvider.jsx';
import { safeDecode } from '../lib/safeDecode';
import Chip from '../components/ui/Chip.jsx';

export default function Student() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { allStudents } = useProbnik();

  const student = state?.student || allStudents[safeDecode(id)];

  if (!student) {
    return (
      <section style={{ maxWidth: 600, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 32, fontWeight: 900 }}>Ученик не найден</h1>
        <Link to="/" style={{ display: 'inline-block', marginTop: 20, padding: '10px 20px', border: '2px solid var(--black)', borderRadius: 100, fontWeight: 700 }}>
          На главную
        </Link>
      </section>
    );
  }

  return (
    <section className="student-section" style={{ maxWidth: 760, margin: '0 auto', padding: '40px 32px' }}>
      <button onClick={() => navigate(-1)} style={backBtnStyle}>← Назад</button>
      <div className="fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Chip>{student.examType} 2026</Chip>
        </div>
        <div style={{ fontSize: 13, color: 'var(--gray)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ученик</div>
        <h1 className="student-name" style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
          {student.name.split(' ')[0]}<br />
          <span style={{ fontStyle: 'italic', color: 'var(--blue)' }}>{student.name.split(' ').slice(1).join(' ')}</span>
        </h1>
        <div style={{ fontSize: 14, color: 'var(--gray)', marginTop: 8, fontWeight: 500 }}>{student.grade} класс</div>

        <div className="student-cards-row" style={{ display: 'flex', gap: 12, marginTop: 36, flexWrap: 'wrap' }}>
          <Link
            to={`/student/${encodeURIComponent(id)}/probniki`}
            state={{ student }}
            className="student-card"
            style={cardStyle}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--blue-light)'; e.currentTarget.style.borderColor = 'var(--blue)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = 'var(--black)'; }}
          >
            <span className="student-card-title" style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em' }}>Пробники</span>
            <span style={{ fontSize: 13, color: 'var(--gray)', fontWeight: 600, marginTop: 4 }}>Результаты и анализ тем</span>
          </Link>
          {/* 10 класс марафон не пишет → карты ошибок марафона у них нет */}
          {student.grade !== '10' && (
            <Link
              to={`/student/${encodeURIComponent(id)}/errors`}
              state={{ student }}
              className="student-card"
              style={cardStyle}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--blue-light)'; e.currentTarget.style.borderColor = 'var(--blue)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = 'var(--black)'; }}
            >
              <span className="student-card-title" style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em' }}>Карта ошибок марафона</span>
              <span style={{ fontSize: 13, color: 'var(--gray)', fontWeight: 600, marginTop: 4 }}>Дневной прогресс</span>
            </Link>
          )}
          <Link
            to={`/student/${encodeURIComponent(id)}/year`}
            state={{ student }}
            className="student-card"
            style={cardStyle}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--blue-light)'; e.currentTarget.style.borderColor = 'var(--blue)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = 'var(--black)'; }}
          >
            <span className="student-card-title" style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em' }}>Учебный год</span>
            <span style={{ fontSize: 13, color: 'var(--gray)', fontWeight: 600, marginTop: 4 }}>Домашки, контрольные, посещаемость</span>
          </Link>
        </div>
      </div>
    </section>
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

const cardStyle = {
  flex: 1,
  minWidth: 240,
  border: '2px solid var(--black)',
  borderRadius: 16,
  padding: '28px 24px',
  display: 'flex',
  flexDirection: 'column',
  background: 'white',
  transition: 'background 0.15s, border-color 0.15s',
  cursor: 'pointer',
};
