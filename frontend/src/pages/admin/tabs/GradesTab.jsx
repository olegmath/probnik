import { useState, useEffect, useMemo } from 'react';
import { SortTh, Td, sortRows } from '../_helpers.jsx';
import { getGradesSummary } from '../../../lib/marathonApi.js';

function scoreColor(val) {
  if (val == null) return 'var(--gray)';
  if (val >= 80) return '#34b87a';
  if (val >= 60) return '#f5a623';
  return '#e05454';
}

export default function GradesTab({ subject, level, teacher, group }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  useEffect(() => {
    setLoading(true);
    setError('');
    getGradesSummary()
      .then((res) => { setRows(res?.rows || []); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir(key === 'name' || key === 'group' ? 'asc' : 'desc'); }
  };

  const filteredRows = useMemo(() => rows.filter((r) =>
    (!subject || r.subject === subject) &&
    (!level || r.level === level) &&
    (!teacher || r.teacher === teacher) &&
    (!group || r.group === group)
  ), [rows, subject, level, teacher, group]);

  const sortedRows = useMemo(() => sortRows(filteredRows, sortKey, sortDir), [filteredRows, sortKey, sortDir]);

  const s = { key: sortKey, dir: sortDir, on: handleSort };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <svg width="32" height="32" viewBox="0 0 48 48" style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 8px' }}>
          <circle cx="24" cy="24" r="20" stroke="var(--blue)" strokeWidth="4" fill="none" strokeDasharray="31.4 62.8" />
        </svg>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray)' }}>Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return <div style={{ color: '#e05454', fontWeight: 700, padding: '24px 0' }}>{error}</div>;
  }

  if (!sortedRows.length) {
    return <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--gray)', fontWeight: 700 }}>Нет данных за период</div>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ fontSize: 11, color: 'var(--gray)', fontWeight: 600, marginBottom: 8 }}>
        {filteredRows.length} учеников
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'Inter' }}>
        <thead>
          <tr>
            <SortTh sortKey="name" currentKey={s.key} currentDir={s.dir} onSort={s.on}>Ученик</SortTh>
            <SortTh sortKey="group" currentKey={s.key} currentDir={s.dir} onSort={s.on}>Группа</SortTh>
            <SortTh sortKey="hwAvg" currentKey={s.key} currentDir={s.dir} onSort={s.on} right>ДЗ ср. %</SortTh>
            <SortTh sortKey="krAvg" currentKey={s.key} currentDir={s.dir} onSort={s.on} right>КР ср. %</SortTh>
            <SortTh sortKey="attendancePct" currentKey={s.key} currentDir={s.dir} onSort={s.on} right>Посещ. %</SortTh>
            <SortTh sortKey="lessonsTotal" currentKey={s.key} currentDir={s.dir} onSort={s.on} right>Уроков</SortTh>
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((r) => {
            const key = `${r.name}||${r.group}`;
            return (
              <tr key={key}>
                <Td bold>{r.name}</Td>
                <Td>{r.group || '—'}</Td>
                <Td right mono>
                  {r.hwAvg != null
                    ? <span style={{ color: scoreColor(r.hwAvg), fontWeight: 900 }}>{r.hwAvg.toFixed(1)}%</span>
                    : <span style={{ color: 'var(--gray)' }}>—</span>}
                  {r.hwCount > 0 && <span style={{ fontSize: 10, color: 'var(--gray)', marginLeft: 4 }}>({r.hwCount})</span>}
                </Td>
                <Td right mono>
                  {r.krAvg != null
                    ? <span style={{ color: scoreColor(r.krAvg), fontWeight: 900 }}>{r.krAvg.toFixed(1)}%</span>
                    : <span style={{ color: 'var(--gray)' }}>—</span>}
                  {r.krCount > 0 && <span style={{ fontSize: 10, color: 'var(--gray)', marginLeft: 4 }}>({r.krCount})</span>}
                </Td>
                <Td right mono>
                  <span style={{ color: scoreColor(r.attendancePct), fontWeight: 900 }}>{r.attendancePct}%</span>
                </Td>
                <Td right mono>{r.lessonsTotal}</Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
