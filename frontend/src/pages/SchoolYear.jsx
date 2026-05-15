import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { useProbnik } from '../lib/ProbnikProvider.jsx';
import { safeDecode } from '../lib/safeDecode';
import { getStudentJournal } from '../lib/marathonApi.js';
import Chip from '../components/ui/Chip.jsx';
import LineSpark from '../components/charts/LineSpark.jsx';

const TABS = [
  { id: 'overview', label: 'Общая' },
  { id: 'homework', label: 'Домашки' },
  { id: 'tests', label: 'Контрольные' },
  { id: 'attendance', label: 'Посещаемость' },
];

function pctColor(pct) {
  if (pct == null) return 'var(--gray)';
  if (pct >= 85) return '#16a34a';
  if (pct >= 70) return 'var(--black)';
  if (pct >= 60) return '#f59e0b';
  return '#e05';
}

function fmtPct(v, digits = 1) {
  if (v == null || !Number.isFinite(v)) return '—';
  return `${v.toFixed(digits)}%`;
}

function fmtNum(v, digits = 1) {
  if (v == null || !Number.isFinite(v)) return '—';
  return v.toFixed(digits);
}

function formatDate(iso) {
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[3]}.${m[2]}.${m[1].slice(2)}`;
}

function capitalize(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function SummaryCard({ label, value, note, color }) {
  return (
    <div style={{ border: '2px solid var(--border)', borderRadius: 16, padding: '16px 20px', background: 'white' }}>
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)' }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em', marginTop: 4, color: color || 'var(--black)' }}>{value}</div>
      {note && <div style={{ fontSize: 12, color: 'var(--gray)', fontWeight: 600, marginTop: 2 }}>{note}</div>}
    </div>
  );
}

function FlagsRow({ flags }) {
  if (!flags || flags.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
      {flags.map((f, i) => (
        <span key={i} style={{
          background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
          padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700,
        }}>{f}</span>
      ))}
    </div>
  );
}

function RankPill({ label, place, of }) {
  if (!place || !of) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'baseline', gap: 6,
      background: 'var(--black)', color: 'var(--white)',
      padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700,
    }}>
      <span style={{ opacity: 0.7, fontSize: 11 }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 900 }}>{place}</span>
      <span style={{ opacity: 0.6 }}>/ {of}</span>
    </span>
  );
}

function OverviewTab({ data }) {
  const { attendance, homework, kr, integral, flags, ranks } = data;
  const hwPoints = [...(homework.trend || [])].map((h) => h.grade);
  const krPoints = [...(kr.list || [])].map((k) => k.grade);

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <RankPill label="в группе" place={ranks?.in_group?.place} of={ranks?.in_group?.of} />
        <RankPill label="в предмете" place={ranks?.in_school?.place} of={ranks?.in_school?.of} />
      </div>

      <FlagsRow flags={flags} />

      <div className="year-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 24 }}>
        <SummaryCard
          label="Посещаемость"
          value={fmtPct(attendance.pct, 0)}
          note={`был ${attendance.was} / ${attendance.total}`}
          color={pctColor(attendance.pct)}
        />
        <SummaryCard
          label="Сдано ДЗ"
          value={`${homework.count ?? '—'} / ${homework.total ?? '?'}`}
          note="с оценкой из всех"
          color={homework.count != null && homework.total ? pctColor(homework.count / homework.total * 100) : 'var(--black)'}
        />
        <SummaryCard
          label="Среднее ДЗ"
          value={fmtPct(homework.avg, 0)}
          note="средний балл"
          color={pctColor(homework.avg)}
        />
        <SummaryCard
          label="Среднее КР"
          value={fmtPct(kr.avg, 0)}
          note={`${kr.count} КР`}
          color={pctColor(kr.avg)}
        />
      </div>

      <div className="year-trend-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
        <div style={{ border: '2px solid var(--border)', borderRadius: 16, padding: 16, background: 'white' }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)', marginBottom: 8 }}>Тренд ДЗ</div>
          <LineSpark points={hwPoints} width={320} height={70} color="#2563eb" />
        </div>
        <div style={{ border: '2px solid var(--border)', borderRadius: 16, padding: 16, background: 'white' }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)', marginBottom: 8 }}>Тренд КР</div>
          <LineSpark points={krPoints} width={320} height={70} color="#dc2626" />
        </div>
      </div>

      <div className="gt-table-scroll" style={{ border: '2px solid var(--black)', borderRadius: 16, overflow: 'hidden' }}>
        <div className="gt-table-row" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', background: 'var(--black)', color: 'var(--white)' }}>
          <Th>Месяц</Th>
          <Th>Был / Пропустил</Th>
          <Th>Посещ.</Th>
        </div>
        {(attendance.by_month || []).map((m, i) => (
          <div key={m.monthKey} className="gt-table-row" style={{
            display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr',
            borderTop: i === 0 ? 'none' : '1px solid var(--border)',
            background: i % 2 === 0 ? 'var(--white)' : '#fafafa',
          }}>
            <Td><span style={{ fontWeight: 800 }}>{m.month}</span></Td>
            <Td>
              <span style={{ fontWeight: 800 }}>{m.was}</span>
              <span style={{ color: 'var(--gray)', fontWeight: 600 }}> / {m.absent + m.sick}</span>
            </Td>
            <Td><span style={{ fontWeight: 800, color: pctColor(m.pct) }}>{Math.round(m.pct)}%</span></Td>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--gray)', fontWeight: 500 }}>
        ДЗ и КР нормализованы по максимуму группы за каждую работу.
      </div>
    </div>
  );
}

function HomeworkTab({ data }) {
  const { homework } = data;
  const trend = homework.trend || [];
  const points = trend.map((h) => h.grade);
  const labels = trend.map((h) => h.no != null ? `№${h.no}` : '?');
  const kindPct = homework.kind_pct || {};
  const kindKeys = Object.keys(kindPct);

  return (
    <div>
      <div className="gt-summary-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <SummaryCard label="Выполнено" value={fmtPct(homework.done_pct, 0)} note="заданий принято" color={pctColor(homework.done_pct)} />
        <SummaryCard label="Принято" value={homework.done_count ?? '—'} note="задач со статусом Принято" />
        <SummaryCard label="Не открыто" value={fmtPct(homework.not_opened_pct, 0)} note="задачи не открыты" color={homework.not_opened_pct >= 30 ? '#dc2626' : 'var(--black)'} />
        <SummaryCard label="Качество" value={fmtPct(homework.avg, 0)} note="средний балл сданных ДЗ" color={pctColor(homework.avg)} />
      </div>
      {kindKeys.length >= 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${kindKeys.length}, 1fr)`, gap: 12, marginBottom: 16 }}>
          {kindKeys.map((k) => (
            <SummaryCard key={k} label={capitalize(k)} value={fmtPct(kindPct[k], 0)} note="принято из всех" color={pctColor(kindPct[k])} />
          ))}
        </div>
      )}

      <div style={{ border: '2px solid var(--border)', borderRadius: 16, padding: 16, background: 'white', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)', marginBottom: 8 }}>Тренд по номеру ДЗ</div>
        <LineSpark points={points} labels={labels} width={680} height={90} color="#2563eb" />
      </div>

      {trend.length === 0 ? (
        <div style={{ border: '2px dashed var(--border)', borderRadius: 16, padding: 40, textAlign: 'center', color: 'var(--gray)' }}>Нет ДЗ с оценками</div>
      ) : (
        <div className="gt-table-scroll" style={{ border: '2px solid var(--black)', borderRadius: 16, overflow: 'hidden' }}>
          <div className="gt-table-row" style={{ display: 'grid', gridTemplateColumns: '60px 2fr 1fr 1fr 1fr', background: 'var(--black)', color: 'var(--white)' }}>
            <Th>№</Th>
            <Th>Тема</Th>
            <Th>%</Th>
            <Th>Балл</Th>
            <Th>Дата</Th>
          </div>
          {trend.map((h, i) => (
            <div key={i} className="gt-table-row" style={{
              display: 'grid', gridTemplateColumns: '60px 2fr 1fr 1fr 1fr',
              borderTop: i === 0 ? 'none' : '1px solid var(--border)',
              background: h.not_done ? '#fef2f2' : (i % 2 === 0 ? 'var(--white)' : '#fafafa'),
            }}>
              <Td><span style={{ fontWeight: 800, color: h.not_done ? '#dc2626' : 'inherit' }}>{h.no ?? '—'}</span></Td>
              <Td><span style={{ fontSize: 13, color: h.not_done ? '#dc2626' : 'inherit' }}>{h.lesson}</span></Td>
              <Td>
                {h.not_done
                  ? <span style={{ fontWeight: 700, color: '#dc2626' }}>Не сдано</span>
                  : <span style={{ fontWeight: 800, color: pctColor(h.grade) }}>{h.grade.toFixed(0)}%</span>
                }
              </Td>
              <Td><span style={{ fontFamily: 'monospace', color: 'var(--gray)' }}>{h.not_done ? '—' : `${h.raw}/${h.max}`}</span></Td>
              <Td><span style={{ fontSize: 12, color: 'var(--gray)' }}>{formatDate(h.date)}</span></Td>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TestsTab({ data }) {
  const { kr } = data;
  const list = kr.list || [];
  const points = list.map((k) => k.grade);
  const labels = list.map((k) => formatDate(k.date));

  return (
    <div>
      <div className="gt-summary-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
        <SummaryCard label="Средний КР" value={fmtPct(kr.avg, 0)} note={`${kr.count} работ`} color={pctColor(kr.avg)} />
        <SummaryCard label="Лучшая" value={list.length ? `${Math.round(Math.max(...points))}%` : '—'} note="за год" />
      </div>

      <div style={{ border: '2px solid var(--border)', borderRadius: 16, padding: 16, background: 'white', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)', marginBottom: 8 }}>Динамика</div>
        <LineSpark points={points} labels={labels} width={680} height={90} color="#dc2626" />
      </div>

      {list.length === 0 ? (
        <div style={{ border: '2px dashed var(--border)', borderRadius: 16, padding: 40, textAlign: 'center', color: 'var(--gray)' }}>Нет КР с оценками</div>
      ) : (
        <div className="gt-table-scroll" style={{ border: '2px solid var(--black)', borderRadius: 16, overflow: 'hidden' }}>
          <div className="gt-table-row" style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr', background: 'var(--black)', color: 'var(--white)' }}>
            <Th>Тема</Th>
            <Th>%</Th>
            <Th>Балл</Th>
            <Th>Дата</Th>
          </div>
          {list.map((k, i) => (
            <div key={i} className="gt-table-row" style={{
              display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr',
              borderTop: i === 0 ? 'none' : '1px solid var(--border)',
              background: i % 2 === 0 ? 'var(--white)' : '#fafafa',
            }}>
              <Td><span style={{ fontSize: 13 }}>{k.lesson}</span></Td>
              <Td><span style={{ fontWeight: 800, color: pctColor(k.grade) }}>{k.grade.toFixed(0)}%</span></Td>
              <Td><span style={{ fontFamily: 'monospace', color: 'var(--gray)' }}>{k.raw}/{k.max}</span></Td>
              <Td><span style={{ fontSize: 12, color: 'var(--gray)' }}>{formatDate(k.date)}</span></Td>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AttendanceTab({ data }) {
  const { attendance } = data;
  const months = attendance.by_month || [];
  const points = months.map((m) => m.pct);
  const labels = months.map((m) => m.month);

  return (
    <div>
      <div className="gt-summary-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        <SummaryCard label="Был" value={attendance.was} color="#16a34a" note={`из ${attendance.total} занятий`} />
        <SummaryCard label="Пропустил" value={attendance.absent + attendance.sick} color={(attendance.absent + attendance.sick) > 5 ? '#dc2626' : 'var(--black)'} note="вкл. болезни" />
        <SummaryCard label="Подряд пропусков" value={attendance.max_streak} color={attendance.max_streak >= 3 ? '#dc2626' : 'var(--black)'} note="максимум" />
      </div>

      <div style={{ border: '2px solid var(--border)', borderRadius: 16, padding: 16, background: 'white', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)', marginBottom: 8 }}>% посещений по месяцам</div>
        <LineSpark points={points} labels={labels} width={680} height={90} color="#16a34a" />
      </div>

      {months.length === 0 ? (
        <div style={{ border: '2px dashed var(--border)', borderRadius: 16, padding: 40, textAlign: 'center', color: 'var(--gray)' }}>Нет данных о посещениях</div>
      ) : (
        <div className="gt-table-scroll" style={{ border: '2px solid var(--black)', borderRadius: 16, overflow: 'hidden' }}>
          <div className="gt-table-row" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', background: 'var(--black)', color: 'var(--white)' }}>
            <Th>Месяц</Th>
            <Th>Был</Th>
            <Th>Пропустил</Th>
            <Th>Посещ.</Th>
          </div>
          {months.map((m, i) => (
            <div key={m.monthKey} className="gt-table-row" style={{
              display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr',
              borderTop: i === 0 ? 'none' : '1px solid var(--border)',
              background: i % 2 === 0 ? 'var(--white)' : '#fafafa',
            }}>
              <Td><span style={{ fontWeight: 800 }}>{m.month}</span></Td>
              <Td><span style={{ fontWeight: 800, color: '#16a34a' }}>{m.was}</span></Td>
              <Td><span style={{ fontWeight: 800, color: (m.absent + m.sick) > 0 ? '#dc2626' : 'var(--gray)' }}>{m.absent + m.sick}</span></Td>
              <Td><span style={{ fontWeight: 800, color: pctColor(m.pct) }}>{Math.round(m.pct)}%</span></Td>
            </div>
          ))}
        </div>
      )}
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

function LoadingState() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--gray)', fontSize: 14, fontWeight: 600 }}>
      Загружаем данные…
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div style={{ border: '2px solid #e05', borderRadius: 12, padding: '16px 20px', color: '#e05', fontSize: 14, fontWeight: 700 }}>
      Ошибка загрузки: {message}
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ border: '2px dashed var(--border)', borderRadius: 16, padding: '40px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 14, color: 'var(--gray)', fontWeight: 600 }}>Данные за этот период недоступны</div>
    </div>
  );
}

function computeAggregate(subjects) {
  if (!subjects || subjects.length === 0) return null;
  if (subjects.length === 1) return subjects[0];

  const totalHwCount = subjects.reduce((s, sub) => s + (sub.homework?.count || 0), 0);
  const totalHwEvents = subjects.reduce((s, sub) => s + (sub.homework?.total || 0), 0);
  const hwAvg = totalHwCount > 0
    ? subjects.reduce((s, sub) => s + (sub.homework?.avg || 0) * (sub.homework?.count || 0), 0) / totalHwCount
    : null;
  const hwDonePct = subjects.some((s) => s.homework?.done_pct != null)
    ? subjects.reduce((s, sub) => s + (sub.homework?.done_pct || 0), 0) / subjects.length
    : null;
  const hwNotOpenedPct = subjects.some((s) => s.homework?.not_opened_pct != null)
    ? subjects.reduce((s, sub) => s + (sub.homework?.not_opened_pct || 0), 0) / subjects.length
    : null;
  const hwDoneCount = subjects.reduce((s, sub) => s + (sub.homework?.done_count || 0), 0);
  const hwTrend = subjects.flatMap((sub) => sub.homework?.trend || [])
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const attWas = subjects.reduce((s, sub) => s + (sub.attendance?.was || 0), 0);
  const attAbsent = subjects.reduce((s, sub) => s + (sub.attendance?.absent || 0), 0);
  const attSick = subjects.reduce((s, sub) => s + (sub.attendance?.sick || 0), 0);
  const attTotal = subjects.reduce((s, sub) => s + (sub.attendance?.total || 0), 0);
  const attPct = attTotal > 0 ? attWas / attTotal * 100 : null;
  const attMaxStreak = Math.max(...subjects.map((s) => s.attendance?.max_streak || 0));
  const attByMonth = subjects[0]?.attendance?.by_month || [];

  const krCount = subjects.reduce((s, sub) => s + (sub.kr?.count || 0), 0);
  const krAvg = krCount > 0
    ? subjects.reduce((s, sub) => s + (sub.kr?.avg || 0) * (sub.kr?.count || 0), 0) / krCount
    : null;
  const krList = subjects.flatMap((sub) => sub.kr?.list || [])
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const flags = [...new Set(subjects.flatMap((s) => s.flags || []))];
  const ranks = subjects[0]?.ranks;

  return {
    subject: 'Все предметы',
    group: subjects.map((s) => s.group).filter(Boolean).join(', '),
    teacher: null,
    attendance: { pct: attPct != null ? Math.round(attPct * 10) / 10 : null, was: attWas, absent: attAbsent, sick: attSick, total: attTotal, max_streak: attMaxStreak, by_month: attByMonth },
    homework: { avg: hwAvg != null ? Math.round(hwAvg * 10) / 10 : null, count: totalHwCount, total: totalHwEvents, done_count: hwDoneCount, done_pct: hwDonePct != null ? Math.round(hwDonePct * 10) / 10 : null, not_opened_pct: hwNotOpenedPct != null ? Math.round(hwNotOpenedPct * 10) / 10 : null, sub_status: {}, trend: hwTrend },
    kr: { avg: krAvg != null ? Math.round(krAvg * 10) / 10 : null, count: krCount, list: krList },
    integral: null,
    flags,
    ranks,
  };
}

function PillBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
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
      {children}
    </button>
  );
}

export default function SchoolYear() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { allStudents } = useProbnik();
  const [tab, setTab] = useState('overview');
  const [subjectIdx, setSubjectIdx] = useState(-1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const student = state?.student || allStudents[safeDecode(id)];

  useEffect(() => {
    if (!student) return;
    setLoading(true);
    setError(null);
    setData(null);
    setSubjectIdx(-1);
    getStudentJournal(student.name)
      .then((res) => {
        if (res.ok) {
          setData(res);
        } else {
          setError(res.error || 'Данные недоступны');
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [student?.name]);

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

  const subjects = data?.subjects || [];
  const activeSubject = subjectIdx === -1
    ? computeAggregate(subjects)
    : (subjects[subjectIdx] || null);

  const renderContent = () => {
    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} />;
    if (!data || !activeSubject) return <EmptyState />;
    if (tab === 'overview') return <OverviewTab data={activeSubject} />;
    if (tab === 'homework') return <HomeworkTab data={activeSubject} />;
    if (tab === 'tests') return <TestsTab data={activeSubject} />;
    if (tab === 'attendance') return <AttendanceTab data={activeSubject} />;
    return null;
  };

  return (
    <section className="year-section" style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 32px 60px' }}>
      <div className="fade-up">
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'none', border: '2px solid var(--border)', borderRadius: 100,
            padding: '8px 16px', cursor: 'pointer', fontFamily: 'Inter',
            fontSize: 13, fontWeight: 700, color: 'var(--black)', marginBottom: 20,
          }}
        >
          ← Назад
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Chip>{student.examType} 2026</Chip>
          <Chip filled={false} small>Учебный год 2025/26</Chip>
        </div>
        <div style={{ fontSize: 13, color: 'var(--gray)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ученик</div>
        <h1 className="year-title" style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-0.025em', lineHeight: 1.1, margin: 0 }}>
          {student.name.split(' ')[0]}{' '}
          <span style={{ fontStyle: 'italic', color: 'var(--blue)' }}>{student.name.split(' ').slice(1).join(' ')}</span>
        </h1>
        <div style={{ fontSize: 14, color: 'var(--gray)', marginTop: 8, fontWeight: 500 }}>{student.grade} класс</div>

        {/* Subject selector — shown only when multiple subjects */}
        {subjects.length > 1 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 24 }}>
            <PillBtn
              active={subjectIdx === -1}
              onClick={() => { setSubjectIdx(-1); setTab('overview'); }}
            >
              Все предметы
            </PillBtn>
            {subjects.map((s, i) => (
              <PillBtn
                key={s.subject + s.group}
                active={i === subjectIdx}
                onClick={() => { setSubjectIdx(i); setTab('overview'); }}
              >
                {capitalize(s.subject) || s.group}
              </PillBtn>
            ))}
          </div>
        )}

        {/* Group label for active subject */}
        {activeSubject && (
          <div style={{ marginTop: subjects.length > 1 ? 8 : 24, marginBottom: 0, display: 'flex', gap: 8, alignItems: 'center' }}>
            <Chip filled={false} small>{activeSubject.group}</Chip>
            {activeSubject.teacher && (
              <span style={{ fontSize: 13, color: 'var(--gray)', fontWeight: 600 }}>{activeSubject.teacher}</span>
            )}
          </div>
        )}

        {/* Content tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16, marginBottom: 24 }}>
          {TABS.map((t) => (
            <PillBtn key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
              {t.label}
            </PillBtn>
          ))}
        </div>

        {renderContent()}
      </div>
    </section>
  );
}
