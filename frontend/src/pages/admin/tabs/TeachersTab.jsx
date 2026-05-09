import { useState, useMemo } from 'react';
import { SortTh, Td, sortRows } from '../_helpers.jsx';

export default function TeachersTab({ rows }) {
  const [sortKey, setSortKey] = useState('avgScore');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const byTeacher = useMemo(() => {
    const map = {};
    rows.forEach((r) => {
      const t = r.teacher || 'Без преподавателя';
      if (!map[t]) map[t] = { teacher: t, students: 0, totalFinal: 0, groups: new Set() };
      map[t].students++;
      map[t].totalFinal += r.finalScore ?? r.final_score ?? 0;
      if (r.group) map[t].groups.add(r.group);
    });
    return Object.values(map).map((t) => ({ ...t, groupCount: t.groups.size, avgScore: t.totalFinal / t.students }));
  }, [rows]);

  const sortedTeachers = useMemo(() => sortRows(byTeacher, sortKey, sortDir), [byTeacher, sortKey, sortDir]);

  const s = { key: sortKey, dir: sortDir, on: handleSort };

  if (!byTeacher.length) return <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--gray)', fontWeight: 700 }}>Нет данных</div>;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter' }}>
        <thead>
          <tr>
            <SortTh sortKey="teacher" currentKey={s.key} currentDir={s.dir} onSort={s.on}>Преподаватель</SortTh>
            <SortTh sortKey="students" currentKey={s.key} currentDir={s.dir} onSort={s.on} right>Учеников</SortTh>
            <SortTh sortKey="groupCount" currentKey={s.key} currentDir={s.dir} onSort={s.on} right>Групп</SortTh>
            <SortTh sortKey="avgScore" currentKey={s.key} currentDir={s.dir} onSort={s.on} right>Средний балл</SortTh>
          </tr>
        </thead>
        <tbody>
          {sortedTeachers.map((t, i) => (
            <tr key={t.teacher}>
              <Td bold>{i + 1}. {t.teacher}</Td>
              <Td right mono>{t.students}</Td>
              <Td right mono>{t.groupCount}</Td>
              <Td right mono bold>{t.avgScore.toFixed(2)}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
