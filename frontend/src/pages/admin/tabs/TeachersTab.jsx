import { useMemo } from 'react';
import { Th, Td } from '../_helpers.jsx';

export default function TeachersTab({ rows }) {
  const byTeacher = useMemo(() => {
    const map = {};
    rows.forEach((r) => {
      const t = r.teacher || 'Без преподавателя';
      if (!map[t]) map[t] = { teacher: t, students: 0, totalFinal: 0, groups: new Set() };
      map[t].students++;
      map[t].totalFinal += r.finalScore ?? r.final_score ?? 0;
      if (r.group) map[t].groups.add(r.group);
    });
    return Object.values(map).sort((a, b) => b.totalFinal / b.students - a.totalFinal / a.students);
  }, [rows]);

  if (!byTeacher.length) return <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--gray)', fontWeight: 700 }}>Нет данных</div>;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter' }}>
        <thead>
          <tr>
            <Th>Преподаватель</Th>
            <Th right>Учеников</Th>
            <Th right>Групп</Th>
            <Th right>Средний балл</Th>
          </tr>
        </thead>
        <tbody>
          {byTeacher.map((t, i) => (
            <tr key={t.teacher}>
              <Td bold>{i + 1}. {t.teacher}</Td>
              <Td right mono>{t.students}</Td>
              <Td right mono>{t.groups.size}</Td>
              <Td right mono bold>{(t.totalFinal / t.students).toFixed(2)}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
