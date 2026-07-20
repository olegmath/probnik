import { useState, useMemo } from 'react';
import { SortTh, Th, Td, sortRows } from '../_helpers.jsx';
import { scoreColor, fmtPct } from '../_format.js';
import LineSpark from '../../../components/charts/LineSpark.jsx';

function SectionTitle({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--black)', margin: '24px 0 10px' }}>{children}</div>;
}

function DeltaCell({ cohort, deltaKey }) {
  if (!cohort) return <span style={{ color: 'var(--gray)' }}>—</span>;
  const d = cohort[deltaKey];
  const color = d > 0 ? '#34b87a' : d < 0 ? '#e05454' : 'var(--black)';
  return (
    <span style={{ color, fontWeight: 900 }} title={`${cohort.count} уч., ${cohort.firstLabel} → ${cohort.lastLabel}`}>
      {d > 0 ? '+' : ''}{d}
    </span>
  );
}

// Сравнение преподавателей + таблица посещаемости по пробникам.
export default function ProbniksTeachersTables({
  comparison,
  attendance,
  probniks,
  metricKey,
  deltaKey,
  metricMax,
  teacherKey,
  teacherColor,
}) {
  const [sortKey, setSortKey] = useState('avgScore');
  const [sortDir, setSortDir] = useState('desc');

  const onSort = (key) => {
    if (key === sortKey) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const finalKey = metricKey === 'avgSecondary' ? 'avgFinalSecondary' : 'avgFinalPrimary';
  const rows = useMemo(() => {
    const attByKey = Object.fromEntries(attendance.teachers.map((t) => [t.teacherKey, t]));
    const flat = comparison.map((r) => ({
      teacherKey: r.teacherKey,
      teacher: r.teacher,
      students: r.students,
      attempts: r.attempts,
      avgScore: r[metricKey],
      avgFinal: r[finalKey],
      finalCount: r.finalCount,
      attPct: attByKey[r.teacherKey]?.avgPct ?? null,
      points: r.points.map((p) => p[metricKey]),
      cohort: r.cohort,
    }));
    return sortRows(flat, sortKey, sortDir);
  }, [comparison, attendance, metricKey, finalKey, sortKey, sortDir]);

  const attRows = teacherKey
    ? attendance.teachers.filter((t) => t.teacherKey === teacherKey)
    : attendance.teachers;
  const xLabels = probniks.map((p) => p.label);

  return (
    <div>
      <SectionTitle>Сравнение преподавателей</SectionTitle>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <SortTh sortKey="teacher" currentKey={sortKey} currentDir={sortDir} onSort={onSort}>Преподаватель</SortTh>
              <SortTh sortKey="students" currentKey={sortKey} currentDir={sortDir} onSort={onSort} right>Учеников</SortTh>
              <SortTh sortKey="attempts" currentKey={sortKey} currentDir={sortDir} onSort={onSort} right>Попыток</SortTh>
              <SortTh sortKey="avgScore" currentKey={sortKey} currentDir={sortDir} onSort={onSort} right>Ср. балл</SortTh>
              <SortTh sortKey="avgFinal" currentKey={sortKey} currentDir={sortDir} onSort={onSort} right>Ср. экзамен</SortTh>
              <SortTh sortKey="attPct" currentKey={sortKey} currentDir={sortDir} onSort={onSort} right>Посещ. ср.</SortTh>
              <Th>Динамика</Th>
              <Th right>Δ состава</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.teacherKey} style={{ background: r.teacherKey === teacherKey ? '#eef4ff' : 'transparent' }}>
                <Td bold>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: teacherColor[r.teacherKey], marginRight: 8 }} />
                  {r.teacher}
                </Td>
                <Td right mono>{r.students}</Td>
                <Td right mono>{r.attempts}</Td>
                <Td right mono>
                  <span style={{ color: scoreColor(r.avgScore == null ? null : (r.avgScore / metricMax) * 100), fontWeight: 900 }}>
                    {r.avgScore ?? '—'}
                  </span>
                </Td>
                <Td right mono title={r.finalCount ? `${r.finalCount} сдавших` : 'нет данных финального экзамена'}>
                  <span style={{ color: scoreColor(r.avgFinal == null ? null : (r.avgFinal / metricMax) * 100), fontWeight: 900 }}>
                    {r.avgFinal ?? '—'}
                  </span>
                </Td>
                <Td right mono>
                  <span style={{ color: scoreColor(r.attPct), fontWeight: 900 }}>{fmtPct(r.attPct, 0)}</span>
                </Td>
                <Td>
                  <LineSpark points={r.points} width={130} height={34} maxY={metricMax} minY={0} color={teacherColor[r.teacherKey]} labels={xLabels} showAxis={false} />
                </Td>
                <Td right mono><DeltaCell cohort={r.cohort} deltaKey={deltaKey} /></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionTitle>Посещаемость пробников</SectionTitle>
      <div style={{ fontSize: 11, color: 'var(--gray)', fontWeight: 600, marginBottom: 8 }}>
        Знаменатель — все, кто написал хотя бы один пробник предмета у преподавателя за год. Среднее — по окну от первого до последнего пробника с писавшими.
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <Th>Преподаватель</Th>
              <Th right>Учеников</Th>
              {probniks.map((p) => <Th key={p.sheetIndex} right>{p.label}</Th>)}
              <Th right>Среднее</Th>
            </tr>
          </thead>
          <tbody>
            {attRows.map((t) => (
              <tr key={t.teacherKey} style={{ background: t.teacherKey === teacherKey ? '#eef4ff' : 'transparent' }}>
                <Td bold>{t.teacher}</Td>
                <Td right mono>{t.roster}</Td>
                {t.perProbnik.map((p, i) => (
                  <Td key={i} right mono>
                    <span style={{ color: p.wrote === 0 ? 'var(--gray)' : scoreColor(p.pct) }}>
                      {p.wrote === 0 ? '—' : `${p.wrote} (${p.pct}%)`}
                    </span>
                  </Td>
                ))}
                <Td right mono>
                  <span style={{ color: scoreColor(t.avgPct), fontWeight: 900 }}>{fmtPct(t.avgPct, 0)}</span>
                </Td>
              </tr>
            ))}
            <tr style={{ background: '#f8f8f8' }}>
              <Td bold>Все</Td>
              <Td right mono bold>{attendance.overall.roster}</Td>
              {attendance.overall.perProbnik.map((p, i) => (
                <Td key={i} right mono bold>
                  <span style={{ color: p.wrote === 0 ? 'var(--gray)' : scoreColor(p.pct) }}>
                    {p.wrote === 0 ? '—' : `${p.wrote} (${p.pct}%)`}
                  </span>
                </Td>
              ))}
              <Td right mono bold>
                <span style={{ color: scoreColor(attendance.overall.avgPct) }}>{fmtPct(attendance.overall.avgPct, 0)}</span>
              </Td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
