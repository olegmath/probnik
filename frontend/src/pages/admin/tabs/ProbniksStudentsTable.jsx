import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { SortTh, Th, Td, sortRows } from '../_helpers.jsx';
import { scoreColor } from '../_format.js';
import { buildStudentMatrix } from '../../../lib/probnikTeacherStats.js';

function SectionTitle({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--black)', margin: '24px 0 10px' }}>{children}</div>;
}

function ScoreCell({ value, max }) {
  if (value == null) return <span style={{ color: 'var(--gray)' }}>—</span>;
  return <span style={{ color: scoreColor((value / max) * 100), fontWeight: 900 }}>{value}</span>;
}

function DeltaCell({ value }) {
  if (value == null) return <span style={{ color: 'var(--gray)' }}>—</span>;
  const color = value > 0 ? '#34b87a' : value < 0 ? '#e05454' : 'var(--black)';
  return <span style={{ color, fontWeight: 900 }}>{value > 0 ? '+' : ''}{value}</span>;
}

// Поимённая таблица: строка — ученик, колонки — все пробники + реальный экзамен.
export default function ProbniksStudentsTable({ collected, subjectName, teacherKey, metric, metricMax }) {
  const [sortKey, setSortKey] = useState('studentName');
  const [sortDir, setSortDir] = useState('asc');

  const onSort = (key) => {
    if (key === sortKey) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir(key === 'studentName' ? 'asc' : 'desc'); }
  };

  const mk = metric === 'secondary' ? 'secondaryScore' : 'primaryScore';
  const avgKey = metric === 'secondary' ? 'avgSecondary' : 'avgPrimary';
  const deltaKey = metric === 'secondary' ? 'deltaSecondary' : 'deltaPrimary';

  const rows = useMemo(() => {
    const matrix = buildStudentMatrix(collected, teacherKey || null);
    const flat = matrix.map((r) => ({
      studentId: r.studentId,
      studentName: r.studentName,
      teachersLabel: r.teachers.join(', '),
      perProbnik: r.perProbnik,
      writtenCount: r.writtenCount,
      avg: r[avgKey],
      final: r.final ? r.final[mk] : null,
      delta: r[deltaKey],
    }));
    return sortRows(flat, sortKey === 'studentName' ? 'studentName' : sortKey, sortDir);
  }, [collected, teacherKey, avgKey, mk, deltaKey, sortKey, sortDir]);

  const hasFinals = (collected.finals || []).length > 0;

  return (
    <div>
      <SectionTitle>Ученики</SectionTitle>
      <div style={{ fontSize: 11, color: 'var(--gray)', fontWeight: 600, marginBottom: 8 }}>
        Все пробники ученика по предмету{teacherKey ? ' (строки — ученики выбранного преподавателя, включая их попытки у других)' : ''}.
        {hasFinals ? ' «Экзамен» — реальный результат; Δ — экзамен минус последний написанный пробник.' : ' Колонка «Экзамен» появится, когда будет заполнен финальный лист (имя листа без даты).'}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <SortTh sortKey="studentName" currentKey={sortKey} currentDir={sortDir} onSort={onSort}>Ученик</SortTh>
              <Th>Преподаватель</Th>
              {collected.probniks.map((p) => <Th key={p.sheetIndex} right>{p.label}</Th>)}
              <SortTh sortKey="writtenCount" currentKey={sortKey} currentDir={sortDir} onSort={onSort} right>Написал</SortTh>
              <SortTh sortKey="avg" currentKey={sortKey} currentDir={sortDir} onSort={onSort} right>Ср.</SortTh>
              <SortTh sortKey="final" currentKey={sortKey} currentDir={sortDir} onSort={onSort} right>Экзамен</SortTh>
              <SortTh sortKey="delta" currentKey={sortKey} currentDir={sortDir} onSort={onSort} right>Δ</SortTh>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.studentId}>
                <Td bold>
                  <Link
                    to={`/student/${encodeURIComponent(r.studentId)}/probniki/${encodeURIComponent(subjectName)}`}
                    style={{ color: 'var(--black)', textDecoration: 'underline', textDecorationColor: 'var(--border)', textUnderlineOffset: 3 }}
                  >
                    {r.studentName}
                  </Link>
                </Td>
                <Td title={r.teachersLabel}>
                  <span style={{ display: 'inline-block', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'bottom', color: 'var(--gray)', fontWeight: 600 }}>
                    {r.teachersLabel}
                  </span>
                </Td>
                {r.perProbnik.map((p, i) => (
                  <Td key={i} right mono>
                    <ScoreCell value={p ? p[mk] : null} max={metricMax} />
                  </Td>
                ))}
                <Td right mono>{r.writtenCount}</Td>
                <Td right mono><ScoreCell value={r.avg} max={metricMax} /></Td>
                <Td right mono style={{ background: '#f8f8f8' }}><ScoreCell value={r.final} max={metricMax} /></Td>
                <Td right mono><DeltaCell value={r.delta} /></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
