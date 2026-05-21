import { useState, useEffect, useMemo } from 'react';
import { SortTh, Td, sortRows, pill, Sel } from '../_helpers.jsx';
import { getJournalSummary } from '../../../lib/marathonApi.js';

// Бакет «Экзамен»: 10 класс (grade==='10') пишет ЕГЭ-формат, но выносится отдельно.
const levelBucket = (r) => (r.grade === '10' ? '10 класс' : (r.level || ''));
const LEVEL_ORDER = ['ОГЭ', 'ЕГЭ', '10 класс'];
const sortLevels = (arr) => [...arr].sort((a, b) => {
  const ia = LEVEL_ORDER.indexOf(a), ib = LEVEL_ORDER.indexOf(b);
  return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
});

const MODES = [
  { id: 'school', label: 'Школа' },
  { id: 'groups', label: 'Группы' },
  { id: 'students', label: 'Ученики' },
];

function scoreColor(val) {
  if (val == null) return 'var(--gray)';
  if (val >= 80) return '#34b87a';
  if (val >= 60) return '#f5a623';
  return '#e05454';
}

function fmtPct(v, digits = 1) {
  if (v == null || !Number.isFinite(v)) return '—';
  return `${Number(v).toFixed(digits)}%`;
}

function ColoredPct({ value, digits = 1 }) {
  if (value == null) return <span style={{ color: 'var(--gray)' }}>—</span>;
  return <span style={{ color: scoreColor(value), fontWeight: 900 }}>{Number(value).toFixed(digits)}%</span>;
}

// Обрезка длинного текста с многоточием — освобождает место под доп. колонки.
function Trunc({ text, max = 130 }) {
  return (
    <span style={{ display: 'inline-block', maxWidth: max, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'bottom' }}>
      {text}
    </span>
  );
}

function Loading() {
  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <svg width="32" height="32" viewBox="0 0 48 48" style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 8px' }}>
        <circle cx="24" cy="24" r="20" stroke="var(--blue)" strokeWidth="4" fill="none" strokeDasharray="31.4 62.8" />
      </svg>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray)' }}>Загрузка…</div>
    </div>
  );
}

function ErrorBox({ message }) {
  return <div style={{ color: '#e05454', fontWeight: 700, padding: '24px 0' }}>{message}</div>;
}

function MetricCard({ label, value, color, note }) {
  return (
    <div style={{ border: '2px solid var(--border)', borderRadius: 12, padding: '12px 16px', background: 'var(--white)' }}>
      <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: color || 'var(--black)', marginTop: 4 }}>{value}</div>
      {note && <div style={{ fontSize: 11, color: 'var(--gray)', fontWeight: 600, marginTop: 2 }}>{note}</div>}
    </div>
  );
}

function TopList({ title, items, valueKey = 'integral' }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ border: '2px solid var(--border)', borderRadius: 12, padding: 14, background: 'var(--white)' }}>
      <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)', marginBottom: 8 }}>{title}</div>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12, borderBottom: i < items.length - 1 ? '1px dashed var(--border)' : 'none' }}>
          <span><span style={{ color: 'var(--gray)', fontWeight: 700 }}>{i + 1}.</span> {it.name || it.group}</span>
          <span style={{ fontWeight: 900, color: scoreColor(it[valueKey]) }}>{fmtPct(it[valueKey], 1)}</span>
        </div>
      ))}
    </div>
  );
}

function SchoolView({ data }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 16 }}>
        <MetricCard label="Учеников" value={data.studentsCount ?? 0} />
        <MetricCard label="Групп" value={data.groupsCount ?? 0} />
        <MetricCard label="Посещ. ср." value={fmtPct(data.attendancePct, 0)} color={scoreColor(data.attendancePct)} />
        <MetricCard label="ДЗ сдел. ср." value={fmtPct(data.hwDonePct, 0)} color={scoreColor(data.hwDonePct)} />
        <MetricCard label="ДЗ кач. ср." value={fmtPct(data.hwAvg, 0)} color={scoreColor(data.hwAvg)} />
        <MetricCard label="КР сдел. ср." value={fmtPct(data.krDonePct, 0)} color={scoreColor(data.krDonePct)} />
        <MetricCard label="КР кач. ср." value={fmtPct(data.krAvg, 0)} color={scoreColor(data.krAvg)} />
        <MetricCard label="Интеграл" value={fmtPct(data.integral, 1)} color={scoreColor(data.integral)} note={`${data.flagsCount ?? 0} флагов`} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <TopList title="Топ-3 группы" items={data.top3Groups} valueKey="integral" />
        <TopList title="Топ-3 ученика" items={data.top3Students} valueKey="integral" />
        <TopList title="Слабые звенья" items={data.bottom3Students} valueKey="integral" />
      </div>
    </div>
  );
}

function GroupsView({ rows, sort }) {
  const sorted = useMemo(() => sortRows(rows, sort.key, sort.dir), [rows, sort.key, sort.dir]);
  if (sorted.length === 0) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--gray)' }}>Нет групп</div>;
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ fontSize: 11, color: 'var(--gray)', fontWeight: 600, marginBottom: 8 }}>{sorted.length} групп</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'Inter' }}>
        <thead>
          <tr>
            <SortTh sortKey="group" currentKey={sort.key} currentDir={sort.dir} onSort={sort.on}>Группа</SortTh>
            <SortTh sortKey="subject" currentKey={sort.key} currentDir={sort.dir} onSort={sort.on}>Предмет</SortTh>
            <SortTh sortKey="teacher" currentKey={sort.key} currentDir={sort.dir} onSort={sort.on}>Преподаватель</SortTh>
            <SortTh sortKey="studentsCount" currentKey={sort.key} currentDir={sort.dir} onSort={sort.on} right>Учеников</SortTh>
            <SortTh sortKey="attendancePct" currentKey={sort.key} currentDir={sort.dir} onSort={sort.on} right>Посещ. %</SortTh>
            <SortTh sortKey="hwDonePct" currentKey={sort.key} currentDir={sort.dir} onSort={sort.on} right>ДЗ сдел.</SortTh>
            <SortTh sortKey="hwAvg" currentKey={sort.key} currentDir={sort.dir} onSort={sort.on} right>ДЗ кач.</SortTh>
            <SortTh sortKey="krDonePct" currentKey={sort.key} currentDir={sort.dir} onSort={sort.on} right>КР сдел.</SortTh>
            <SortTh sortKey="krAvg" currentKey={sort.key} currentDir={sort.dir} onSort={sort.on} right>КР кач.</SortTh>
            <SortTh sortKey="integral" currentKey={sort.key} currentDir={sort.dir} onSort={sort.on} right>Интеграл</SortTh>
            <SortTh sortKey="flagsCount" currentKey={sort.key} currentDir={sort.dir} onSort={sort.on} right>Флагов</SortTh>
          </tr>
        </thead>
        <tbody>
          {sorted.map((g, i) => (
            <tr key={`${g.group}-${i}`}>
              <Td bold>{g.group || '—'}</Td>
              <Td>{g.subject || '—'}</Td>
              <Td>{g.teacher || '—'}</Td>
              <Td right mono>{g.studentsCount}</Td>
              <Td right mono><ColoredPct value={g.attendancePct} digits={0} /></Td>
              <Td right mono><ColoredPct value={g.hwDonePct} digits={0} /></Td>
              <Td right mono><ColoredPct value={g.hwAvg} digits={0} /></Td>
              <Td right mono><ColoredPct value={g.krDonePct} digits={0} /></Td>
              <Td right mono><ColoredPct value={g.krAvg} digits={0} /></Td>
              <Td right mono><ColoredPct value={g.integral} digits={1} /></Td>
              <Td right mono>
                <span style={{ fontWeight: 800, color: g.flagsCount > 0 ? '#dc2626' : 'var(--gray)' }}>{g.flagsCount ?? 0}</span>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StudentsView({ rows, sort }) {
  const sorted = useMemo(() => sortRows(rows, sort.key, sort.dir), [rows, sort.key, sort.dir]);

  if (sorted.length === 0) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--gray)' }}>Нет учеников</div>;

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ fontSize: 11, color: 'var(--gray)', fontWeight: 600, marginBottom: 8 }}>{sorted.length} учеников</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'Inter' }}>
        <thead>
          <tr>
            <SortTh sortKey="name" currentKey={sort.key} currentDir={sort.dir} onSort={sort.on}>Ученик</SortTh>
            <SortTh sortKey="group" currentKey={sort.key} currentDir={sort.dir} onSort={sort.on}>Группа</SortTh>
            <SortTh sortKey="hwDonePct" currentKey={sort.key} currentDir={sort.dir} onSort={sort.on} right>ДЗ сдел.</SortTh>
            <SortTh sortKey="hwAvg" currentKey={sort.key} currentDir={sort.dir} onSort={sort.on} right>ДЗ кач.</SortTh>
            <SortTh sortKey="krDonePct" currentKey={sort.key} currentDir={sort.dir} onSort={sort.on} right>КР сдел.</SortTh>
            <SortTh sortKey="krAvg" currentKey={sort.key} currentDir={sort.dir} onSort={sort.on} right>КР кач.</SortTh>
            <SortTh sortKey="attendancePct" currentKey={sort.key} currentDir={sort.dir} onSort={sort.on} right>Посещ. %</SortTh>
            <SortTh sortKey="lessonsTotal" currentKey={sort.key} currentDir={sort.dir} onSort={sort.on} right>Уроков</SortTh>
            <SortTh sortKey="maxStreak" currentKey={sort.key} currentDir={sort.dir} onSort={sort.on} right>Подряд</SortTh>
            <SortTh sortKey="integral" currentKey={sort.key} currentDir={sort.dir} onSort={sort.on} right>Интеграл</SortTh>
            <SortTh sortKey="flagsCount" currentKey={sort.key} currentDir={sort.dir} onSort={sort.on} right>Флаги</SortTh>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => (
            <tr key={`${r.name}||${r.group}||${i}`} title={(r.flags || []).join(' · ')}>
              <Td bold title={r.name}><Trunc text={r.name} max={130} /></Td>
              <Td title={r.group}><Trunc text={r.group || '—'} max={100} /></Td>
              <Td right mono><ColoredPct value={r.hwDonePct} digits={0} /></Td>
              <Td right mono>
                <ColoredPct value={r.hwAvg} digits={1} />
                {r.hwCount > 0 && <span style={{ fontSize: 10, color: 'var(--gray)', marginLeft: 4 }}>({r.hwCount})</span>}
              </Td>
              <Td right mono>
                <ColoredPct value={r.krDonePct} digits={0} />
                {r.krTotal > 0 && <span style={{ fontSize: 10, color: 'var(--gray)', marginLeft: 4 }}>({r.krCount}/{r.krTotal})</span>}
              </Td>
              <Td right mono>
                <ColoredPct value={r.krAvg} digits={1} />
                {r.krCount > 0 && <span style={{ fontSize: 10, color: 'var(--gray)', marginLeft: 4 }}>({r.krCount})</span>}
              </Td>
              <Td right mono><ColoredPct value={r.attendancePct} digits={0} /></Td>
              <Td right mono>{r.lessonsTotal ?? 0}</Td>
              <Td right mono>
                <span style={{ fontWeight: 800, color: (r.maxStreak ?? 0) >= 3 ? '#dc2626' : 'var(--gray)' }}>{r.maxStreak ?? 0}</span>
              </Td>
              <Td right mono><ColoredPct value={r.integral} digits={1} /></Td>
              <Td right mono>
                <span style={{ fontWeight: 800, color: (r.flags?.length || 0) > 0 ? '#dc2626' : 'var(--gray)' }}>{r.flags?.length || 0}</span>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const DEFAULT_SORT_BY_MODE = {
  school: { key: '', dir: 'desc' },
  groups: { key: 'integral', dir: 'desc' },
  students: { key: 'integral', dir: 'desc' },
};

export default function GradesTab() {
  const [mode, setMode] = useState('students');
  const [data, setData] = useState({ school: null, groups: null, students: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortKey, setSortKey] = useState('integral');
  const [sortDir, setSortDir] = useState('desc');

  // Свои фильтры из данных журнала (вкл. 10 класс с преподами/группами) —
  // марафон-фильтры из AdminDashboard сюда не подходят (в рейтингах 10кл нет).
  const [subject, setSubject] = useState('');
  const [levelSel, setLevelSel] = useState('');
  const [teacher, setTeacher] = useState('');
  const [group, setGroup] = useState('');

  const studentRows = data.students?.students || [];
  const subjects = useMemo(() => [...new Set(studentRows.map((r) => r.subject).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru')), [studentRows]);
  const levels = useMemo(() => sortLevels([...new Set(studentRows.filter((r) => !subject || r.subject === subject).map(levelBucket).filter(Boolean))]), [studentRows, subject]);
  const teachers = useMemo(() => [...new Set(studentRows.filter((r) => (!subject || r.subject === subject) && (!levelSel || levelBucket(r) === levelSel)).map((r) => r.teacher).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru')), [studentRows, subject, levelSel]);
  const groups = useMemo(() => [...new Set(studentRows.filter((r) => (!subject || r.subject === subject) && (!levelSel || levelBucket(r) === levelSel) && (!teacher || r.teacher === teacher)).map((r) => r.group).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru')), [studentRows, subject, levelSel, teacher]);

  const filteredStudents = useMemo(() => studentRows.filter((r) =>
    (!subject || r.subject === subject) &&
    (!levelSel || levelBucket(r) === levelSel) &&
    (!teacher || r.teacher === teacher) &&
    (!group || r.group === group)
  ), [studentRows, subject, levelSel, teacher, group]);

  const resetFilters = () => { setSubject(''); setLevelSel(''); setTeacher(''); setGroup(''); };

  useEffect(() => {
    if (data[mode] != null) return;
    setLoading(true);
    setError('');
    getJournalSummary({ mode })
      .then((res) => {
        if (!res.ok) {
          setError(res.error || 'Ошибка');
        } else {
          setData((prev) => ({ ...prev, [mode]: res }));
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [mode, data]);

  useEffect(() => {
    const def = DEFAULT_SORT_BY_MODE[mode];
    setSortKey(def.key);
    setSortDir(def.dir);
  }, [mode]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir(['name', 'group', 'subject', 'teacher'].includes(key) ? 'asc' : 'desc'); }
  };

  const sort = { key: sortKey, dir: sortDir, on: handleSort };
  const current = data[mode];

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {MODES.map((m) => pill(m.label, mode === m.id, () => setMode(m.id), 'var(--blue)'))}
      </div>

      {mode === 'students' && studentRows.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)', minWidth: 64 }}>Предмет</span>
            {subjects.map((s) => pill(s, subject === s, () => { setSubject(subject === s ? '' : s); setTeacher(''); setGroup(''); }))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)', minWidth: 64 }}>Класс</span>
            {levels.map((l) => pill(l, levelSel === l, () => { setLevelSel(levelSel === l ? '' : l); setTeacher(''); setGroup(''); }, 'var(--blue)'))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)', minWidth: 64 }}>Препод.</span>
            {teachers.length > 0 && <Sel value={teacher} onChange={(v) => { setTeacher(v); setGroup(''); }} options={teachers} placeholder="Все преподаватели" />}
            {teacher && groups.length > 0 && <Sel value={group} onChange={setGroup} options={groups} placeholder="Все группы" />}
            {(subject || levelSel || teacher || group) && (
              <button onClick={resetFilters} style={{ height: 36, padding: '0 12px', border: '2px solid var(--border)', borderRadius: 8, background: 'var(--white)', fontFamily: 'Inter', fontSize: 11, fontWeight: 800, cursor: 'pointer', color: 'var(--gray)' }}>Сбросить</button>
            )}
          </div>
        </div>
      )}

      {loading && <Loading />}
      {error && !loading && <ErrorBox message={error} />}
      {!loading && !error && current && (
        <>
          {mode === 'school' && <SchoolView data={current} />}
          {mode === 'groups' && <GroupsView rows={current.groups || []} sort={sort} />}
          {mode === 'students' && (
            <StudentsView rows={filteredStudents} sort={sort} />
          )}
        </>
      )}
    </div>
  );
}
