import { useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { useProbnik } from '../lib/ProbnikProvider.jsx';
import { safeDecode } from '../lib/safeDecode';
import Chip from '../components/ui/Chip.jsx';

const TABS = [
  { id: 'overview', label: 'Общая' },
  { id: 'homework', label: 'Домашки' },
  { id: 'tests', label: 'Контрольные' },
  { id: 'attendance', label: 'Посещаемость' },
];

// DEMO data — replace when backend ready
const MOCK_MONTHS = [
  { month: 'Сентябрь 2025', hwDone: 8,  hwTotal: 8,  testAvg: 4.5, attendance: 100 },
  { month: 'Октябрь 2025',  hwDone: 9,  hwTotal: 10, testAvg: 4.2, attendance: 95 },
  { month: 'Ноябрь 2025',   hwDone: 7,  hwTotal: 9,  testAvg: 3.8, attendance: 88 },
  { month: 'Декабрь 2025',  hwDone: 6,  hwTotal: 8,  testAvg: 4.0, attendance: 92 },
  { month: 'Январь 2026',   hwDone: 5,  hwTotal: 6,  testAvg: 4.6, attendance: 100 },
  { month: 'Февраль 2026',  hwDone: 8,  hwTotal: 10, testAvg: 4.1, attendance: 90 },
  { month: 'Март 2026',     hwDone: 9,  hwTotal: 10, testAvg: 4.3, attendance: 95 },
  { month: 'Апрель 2026',   hwDone: 7,  hwTotal: 9,  testAvg: 4.4, attendance: 89 },
  { month: 'Май 2026',      hwDone: 4,  hwTotal: 5,  testAvg: 4.7, attendance: 100 },
];

function pctColor(pct) {
  if (pct >= 95) return 'var(--blue)';
  if (pct >= 80) return 'var(--black)';
  return '#e05';
}

function OverviewTable() {
  const totalHwDone = MOCK_MONTHS.reduce((acc, m) => acc + m.hwDone, 0);
  const totalHwAll = MOCK_MONTHS.reduce((acc, m) => acc + m.hwTotal, 0);
  const avgTest = (MOCK_MONTHS.reduce((acc, m) => acc + m.testAvg, 0) / MOCK_MONTHS.length).toFixed(2);
  const avgAttendance = Math.round(MOCK_MONTHS.reduce((acc, m) => acc + m.attendance, 0) / MOCK_MONTHS.length);

  return (
    <div>
      <div style={{ border: '2px solid #f5a623', background: 'rgba(245,166,35,0.08)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#B46C00', background: 'rgba(245,166,35,0.18)', padding: '3px 8px', borderRadius: 6 }}>DEMO</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#B46C00' }}>Демонстрационные данные. Реальная интеграция в разработке.</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 24 }}>
        <SummaryCard label="Домашки" value={`${totalHwDone}/${totalHwAll}`} note={`${Math.round((totalHwDone / totalHwAll) * 100)}% сдано`} />
        <SummaryCard label="Контрольные" value={avgTest} note="средний балл" />
        <SummaryCard label="Посещаемость" value={`${avgAttendance}%`} note="средняя за год" />
      </div>

      <div style={{ border: '2px solid var(--black)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', background: 'var(--black)', color: 'var(--white)' }}>
          <Th>Месяц</Th>
          <Th>Домашки</Th>
          <Th>Контрольные</Th>
          <Th>Посещаемость</Th>
        </div>
        {MOCK_MONTHS.map((m, i) => (
          <div
            key={m.month}
            style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 1fr 1fr 1fr',
              borderTop: i === 0 ? 'none' : '1px solid var(--border)',
              background: i % 2 === 0 ? 'var(--white)' : '#fafafa',
            }}
          >
            <Td><span style={{ fontWeight: 800 }}>{m.month}</span></Td>
            <Td>
              <span style={{ fontWeight: 800 }}>{m.hwDone}</span>
              <span style={{ color: 'var(--gray)', fontWeight: 600 }}> / {m.hwTotal}</span>
            </Td>
            <Td><span style={{ fontWeight: 800, color: 'var(--blue)' }}>{m.testAvg.toFixed(1)}</span></Td>
            <Td><span style={{ fontWeight: 800, color: pctColor(m.attendance) }}>{m.attendance}%</span></Td>
          </div>
        ))}
      </div>

    </div>
  );
}

function SummaryCard({ label, value, note }) {
  return (
    <div style={{ border: '2px solid var(--border)', borderRadius: 16, padding: '16px 20px', background: 'white' }}>
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)' }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em', marginTop: 4, color: 'var(--black)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--gray)', fontWeight: 600, marginTop: 2 }}>{note}</div>
    </div>
  );
}

function Th({ children }) {
  return (
    <div style={{ padding: '12px 18px', fontSize: 11, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
      {children}
    </div>
  );
}

function Td({ children }) {
  return (
    <div style={{ padding: '14px 18px', fontSize: 14, color: 'var(--black)' }}>
      {children}
    </div>
  );
}

function ComingSoon({ title, description }) {
  return (
    <div style={{ border: '2px dashed var(--border)', borderRadius: 16, padding: '60px 24px', textAlign: 'center', background: 'white' }}>
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gray)', marginBottom: 8 }}>Скоро</div>
      <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 12 }}>{title}</div>
      <div style={{ fontSize: 14, color: 'var(--gray)', fontWeight: 500, maxWidth: 460, margin: '0 auto', lineHeight: 1.5 }}>
        {description}
      </div>
    </div>
  );
}

export default function SchoolYear() {
  const { id } = useParams();
  const { state } = useLocation();
  const { allStudents } = useProbnik();
  const [tab, setTab] = useState('overview');

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
    <section style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 32px 60px' }}>
      <div className="fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Chip>{student.examType} 2026</Chip>
          <Chip filled={false} small>Учебный год 2025/26</Chip>
        </div>
        <div style={{ fontSize: 13, color: 'var(--gray)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ученик</div>
        <h1 style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-0.025em', lineHeight: 1.1, margin: 0 }}>
          {student.name.split(' ')[0]}{' '}
          <span style={{ fontStyle: 'italic', color: 'var(--blue)' }}>{student.name.split(' ').slice(1).join(' ')}</span>
        </h1>
        <div style={{ fontSize: 14, color: 'var(--gray)', marginTop: 8, fontWeight: 500 }}>{student.grade} класс</div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 28, marginBottom: 24 }}>
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  border: active ? '2px solid var(--black)' : '2px solid var(--border)',
                  background: active ? 'var(--black)' : 'var(--white)',
                  color: active ? 'var(--white)' : 'var(--black)',
                  borderRadius: 100,
                  padding: '8px 18px',
                  cursor: 'pointer',
                  fontFamily: 'Inter',
                  fontSize: 13,
                  fontWeight: 800,
                  transition: 'all 0.15s',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === 'overview' && <OverviewTable />}
        {tab === 'homework' && (
          <ComingSoon
            title="Домашки в деталях"
            description="Здесь появится разбор каждой домашки по неделям: статус (сдано / в работе / просрочено), оценка, комментарии преподавателя."
          />
        )}
        {tab === 'tests' && (
          <ComingSoon
            title="Контрольные работы"
            description="Список всех контрольных за год с темами, баллами, разбором ошибок и динамикой прогресса."
          />
        )}
        {tab === 'attendance' && (
          <ComingSoon
            title="Посещаемость"
            description="Календарь занятий с отметками присутствия, списком пропусков и причинами."
          />
        )}
      </div>
    </section>
  );
}

