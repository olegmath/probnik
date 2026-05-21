import { useState, useEffect, useMemo } from 'react';
import { SortTh, Td, sortRows, pill } from '../_helpers.jsx';
import { getJournalSummary } from '../../../lib/marathonApi.js';

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 10, marginBottom: 16 }}>
        <MetricCard label="Учеников" value={data.studentsCount ?? 0} />
        <MetricCard label="Групп" value={data.groupsCount ?? 0} />
        <MetricCard label="Посещ. ср." value={fmtPct(data.attendancePct, 0)} color={scoreColor(data.attendancePct)} />
        <MetricCard label="ДЗ ср." value={fmtPct(data.hwAvg, 0)} color={scoreColor(data.hwAvg)} />
        <MetricCard label="КР ср." value={fmtPct(data.krAvg, 0)} color={scoreColor(data.krAvg)} />
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
            <SortTh sortKey="hwAvg" currentKey={sort.key} currentDir={sort.dir} onSort={sort.on} right>ДЗ %</SortTh>
            <SortTh sortKey="krAvg" currentKey={sort.key} currentDir={sort.dir} onSort={sort.on} right>КР %</SortTh>
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
              <Td right mono><ColoredPct value={g.hwAvg} digits={0} /></Td>
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

function StudentsView({ rows, sort, filters }) {
  const filtered = useMemo(() => rows.filter((r) =>
    (!filters.subject || r.subject === filters.subject) &&
    (!filters.level || r.level === filters.level) &&
    (!filters.grade || r.grade === filters.grade) &&
    (!filters.teacher || r.teacher === filters.teacher) &&
    (!filters.group || r.group === filters.group)
  ), [rows, filters.subject, filters.level, filters.grade, filters.teacher, filters.group]);

  const sorted = useMemo(() => sortRows(filtered, sort.key, sort.dir), [filtered, sort.key, sort.dir]);

  if (sorted.length === 0) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--gray)' }}>Нет учеников</div>;

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ fontSize: 11, color: 'var(--gray)', fontWeight: 600, marginBottom: 8 }}>{sorted.length} учеников</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'Inter' }}>
        <thead>
          <tr>
            <SortTh sortKey="name" currentKey={sort.key} currentDir={sort.dir} onSort={sort.on}>Ученик</SortTh>
            <SortTh sortKey="group" currentKey={sort.key} currentDir={sort.dir} onSort={sort.on}>Группа</SortTh>
            <SortTh sortKey="hwAvg" currentKey={sort.key} currentDir={sort.dir} onSort={sort.on} right>ДЗ %</SortTh>
            <SortTh sortKey="krAvg" currentKey={sort.key} currentDir={sort.dir} onSort={sort.on} right>КР %</SortTh>
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
              <Td bold>{r.name}</Td>
              <Td>{r.group || '—'}</Td>
              <Td right mono>
                <ColoredPct value={r.hwAvg} digits={1} />
                {r.hwCount > 0 && <span style={{ fontSize: 10, color: 'var(--gray)', marginLeft: 4 }}>({r.hwCount})</span>}
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

export default function GradesTab({ subject, level, grade, teacher, group }) {
  const [mode, setMode] = useState('students');
  const [data, setData] = useState({ school: null, groups: null, students: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortKey, setSortKey] = useState('integral');
  const [sortDir, setSortDir] = useState('desc');

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

      {loading && <Loading />}
      {error && !loading && <ErrorBox message={error} />}
      {!loading && !error && current && (
        <>
          {mode === 'school' && <SchoolView data={current} />}
          {mode === 'groups' && <GroupsView rows={current.groups || []} sort={sort} />}
          {mode === 'students' && (
            <StudentsView
              rows={current.students || []}
              sort={sort}
              filters={{ subject, level, grade, teacher, group }}
            />
          )}
        </>
      )}
    </div>
  );
}
