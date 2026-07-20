import { useState, useMemo } from 'react';
import { SortTh, Th, Td, sortRows, pill } from '../_helpers.jsx';
import { scoreColor } from '../_format.js';
import { getThemeForTask } from '../../../lib/probnikData.js';
import { buildTaskSolvability, buildTaskTeacherMatrix } from '../../../lib/probnikTeacherStats.js';
import LineSpark from '../../../components/charts/LineSpark.jsx';

function SectionTitle({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--black)', margin: '24px 0 10px' }}>{children}</div>;
}

function PctCell({ value, invert }) {
  if (value == null) return <span style={{ color: 'var(--gray)' }}>—</span>;
  // Для «% нулей» шкала обратная: много нулей = плохо.
  const color = scoreColor(invert ? 100 - value : value);
  return <span style={{ color, fontWeight: 900 }}>{value}%</span>;
}

// Решаемость заданий: сводная таблица и матрица «задание × преподаватель».
export default function ProbniksTasks({ collected, subjectName, scoresData, taskThemes, teacherKey }) {
  const [mode, setMode] = useState('summary');
  const [sortKey, setSortKey] = useState('taskNum');
  const [sortDir, setSortDir] = useState('asc');

  const onSort = (key) => {
    if (key === sortKey) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir(key === 'taskNum' ? 'asc' : 'desc'); }
  };

  const summaryRows = useMemo(
    () => sortRows(
      buildTaskSolvability(collected, { subjectName, scoresData, teacherKey: teacherKey || null }),
      sortKey,
      sortDir
    ),
    [collected, subjectName, scoresData, teacherKey, sortKey, sortDir]
  );

  const matrix = useMemo(
    () => (mode === 'byTeacher' ? buildTaskTeacherMatrix(collected, { subjectName, scoresData }) : null),
    [mode, collected, subjectName, scoresData]
  );

  const xLabels = collected.probniks.map((p) => p.label);

  return (
    <div>
      <SectionTitle>Решаемость заданий</SectionTitle>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {pill('Сводно', mode === 'summary', () => setMode('summary'))}
        {pill('По преподавателям', mode === 'byTeacher', () => setMode('byTeacher'))}
      </div>

      {mode === 'summary' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <SortTh sortKey="taskNum" currentKey={sortKey} currentDir={sortDir} onSort={onSort}>Задание</SortTh>
                <Th>Тема</Th>
                <Th right>Макс</Th>
                <SortTh sortKey="pct" currentKey={sortKey} currentDir={sortDir} onSort={onSort} right>% баллов</SortTh>
                <SortTh sortKey="fullPct" currentKey={sortKey} currentDir={sortDir} onSort={onSort} right>Полный балл</SortTh>
                <SortTh sortKey="zeroPct" currentKey={sortKey} currentDir={sortDir} onSort={onSort} right>Нули</SortTh>
                <Th>Динамика</Th>
              </tr>
            </thead>
            <tbody>
              {summaryRows.map((r) => {
                const theme = getThemeForTask(subjectName, r.taskNum, taskThemes) || '';
                return (
                  <tr key={r.taskNum}>
                    <Td bold>{r.label}</Td>
                    <Td title={theme}>
                      <span style={{ display: 'inline-block', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'bottom', color: 'var(--gray)', fontWeight: 600 }}>
                        {theme}
                      </span>
                    </Td>
                    <Td right mono>{r.maxScore}</Td>
                    <Td right mono><PctCell value={r.pct} /></Td>
                    <Td right mono><PctCell value={r.fullPct} /></Td>
                    <Td right mono><PctCell value={r.zeroPct} invert /></Td>
                    <Td>
                      <LineSpark points={r.perProbnikPct} width={130} height={30} maxY={100} minY={0} color="#2563eb" labels={xLabels} showAxis={false} />
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {mode === 'byTeacher' && matrix && (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ fontSize: 11, color: 'var(--gray)', fontWeight: 600, marginBottom: 8 }}>
            % набранных баллов от максимума задания по всем попыткам преподавателя. Фильтр преподавателя не применяется — это и есть сравнение.
          </div>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <Th>Задание</Th>
                {matrix.teachers.map((t) => <Th key={t.key} right>{t.label}</Th>)}
              </tr>
            </thead>
            <tbody>
              {matrix.rows.map((r) => (
                <tr key={r.taskNum}>
                  <Td bold>{r.label}</Td>
                  {matrix.teachers.map((t) => {
                    const cell = r.byTeacher[t.key];
                    return (
                      <Td key={t.key} right mono title={cell ? `${cell.attempts} попыток` : ''}>
                        <PctCell value={cell?.pct ?? null} />
                      </Td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
