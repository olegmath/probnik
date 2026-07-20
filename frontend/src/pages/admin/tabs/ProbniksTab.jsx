import { useState, useMemo } from 'react';
import { useProbnik } from '../../../lib/ProbnikProvider.jsx';
import { getMaxScore } from '../../../lib/probnikData.js';
import {
  collectSubjectAttempts,
  buildTeacherComparison,
  buildProbnikDynamics,
  buildAttendance,
} from '../../../lib/probnikTeacherStats.js';
import { Sel, pill } from '../_helpers.jsx';
import { scoreColor, fmtPct } from '../_format.js';
import MultiLine from '../../../components/charts/MultiLine.jsx';
import ProbniksTeachersTables from './ProbniksTeachersTables.jsx';
import ProbniksStudentsTable from './ProbniksStudentsTable.jsx';
import ProbniksTasks from './ProbniksTasks.jsx';

const PALETTE = ['#2563eb', '#dc2626', '#16a34a', '#f5a623', '#7c3aed', '#0d9488', '#e05454', '#b45309', '#0284c7', '#6b7280'];
const ALL_COLOR = '#111827';
const MAX_DEFAULT_SERIES = 6;

// У ОГЭ и матбазы вторичный балл — школьная оценка 2–5: шкала и дефолт метрики другие.
const isGradeScale = (subject) => subject.includes('ОГЭ') || subject.toLowerCase().includes('баз');
const defaultMetric = (subject) => (isGradeScale(subject) ? 'primary' : 'secondary');

function SummaryCard({ label, value, color, note }) {
  return (
    <div style={{ border: '2px solid var(--border)', borderRadius: 12, padding: '12px 16px', background: 'var(--white)' }}>
      <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: color || 'var(--black)', marginTop: 4 }}>{value}</div>
      {note && <div style={{ fontSize: 11, color: 'var(--gray)', fontWeight: 600, marginTop: 2 }}>{note}</div>}
    </div>
  );
}

function SectionTitle({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--black)', margin: '24px 0 10px' }}>{children}</div>;
}

export default function ProbniksTab() {
  const { allStudents, scoresData, taskThemes, loading } = useProbnik();

  // subjectChoice ''/metricChoice null = «не выбран», эффективное значение выводится
  // из данных — без setState в эффекте.
  const [subjectChoice, setSubjectChoice] = useState('');
  const [teacherKey, setTeacherKey] = useState('');
  const [metricChoice, setMetricChoice] = useState(null);
  const [visibleKeys, setVisibleKeys] = useState(null); // null = дефолт (все или топ-6)

  const subjects = useMemo(() => {
    const set = new Set();
    for (const stu of Object.values(allStudents || {})) {
      for (const s of stu.subjects || []) {
        if ((s.attempts || []).length > 0) set.add(s.name);
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'ru'));
  }, [allStudents]);

  const subject = subjectChoice || subjects[0] || '';
  const metric = metricChoice ?? defaultMetric(subject);

  const changeSubject = (name) => {
    setSubjectChoice(name);
    setTeacherKey('');
    setVisibleKeys(null);
    setMetricChoice(null);
  };

  const collected = useMemo(
    () => (subject ? collectSubjectAttempts(allStudents, subject) : null),
    [allStudents, subject]
  );
  const comparison = useMemo(() => (collected ? buildTeacherComparison(collected) : []), [collected]);
  const dynamics = useMemo(
    () => (collected ? buildProbnikDynamics(collected, teacherKey || null) : null),
    [collected, teacherKey]
  );
  const attendance = useMemo(() => (collected ? buildAttendance(collected) : null), [collected]);

  const mk = metric === 'secondary' ? 'avgSecondary' : 'avgPrimary';
  const deltaKey = metric === 'secondary' ? 'deltaSecondary' : 'deltaPrimary';
  const metricMax = metric === 'primary' ? getMaxScore(subject) : (isGradeScale(subject) ? 5 : 100);
  const normPct = (v) => (v == null ? null : (v / metricMax) * 100);

  const scopeAttempts = useMemo(() => {
    if (!collected) return [];
    return teacherKey ? collected.attempts.filter((a) => a.teacherKey === teacherKey) : collected.attempts;
  }, [collected, teacherKey]);

  const summary = useMemo(() => {
    if (!collected) return null;
    const students = new Set(scopeAttempts.map((a) => a.studentId)).size;
    const scores = scopeAttempts.map((a) => (metric === 'secondary' ? a.secondaryScore : a.primaryScore));
    const avg = scores.length ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10 : null;
    const attRow = teacherKey
      ? attendance.teachers.find((t) => t.teacherKey === teacherKey)
      : attendance.overall;
    const scopeFinals = teacherKey
      ? (collected.finals || []).filter((f) => f.teacherKey === teacherKey)
      : (collected.finals || []);
    const finalScores = scopeFinals.map((f) => (metric === 'secondary' ? f.secondaryScore : f.primaryScore));
    const avgFinal = finalScores.length
      ? Math.round((finalScores.reduce((s, v) => s + v, 0) / finalScores.length) * 10) / 10
      : null;
    return {
      students, attempts: scopeAttempts.length, probniks: collected.probniks.length, avg,
      attPct: attRow?.avgPct ?? null,
      avgFinal, finalCount: scopeFinals.length,
    };
  }, [collected, scopeAttempts, metric, teacherKey, attendance]);

  const teacherColor = useMemo(() => {
    const map = {};
    (collected?.teachers || []).forEach((t, i) => { map[t.key] = PALETTE[i % PALETTE.length]; });
    return map;
  }, [collected]);

  // Идентичность Set не важна (используется только .has) — без useMemo,
  // React Compiler мемоизирует сам.
  const defaultVisible = comparison.length <= MAX_DEFAULT_SERIES
    ? new Set(comparison.map((r) => r.teacherKey))
    : new Set([...comparison].sort((a, b) => b.students - a.students).slice(0, MAX_DEFAULT_SERIES).map((r) => r.teacherKey));
  const effectiveVisible = visibleKeys ?? defaultVisible;

  const toggleSeries = (key) => {
    const next = new Set(effectiveVisible);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setVisibleKeys(next);
  };

  const chartSeries = useMemo(() => {
    if (!collected || !dynamics) return [];
    const xLabels = collected.probniks.map((p) => p.label);
    const allSeries = {
      label: teacherKey ? 'Все (предмет)' : 'Все',
      color: ALL_COLOR,
      points: buildProbnikDynamics(collected, null).points.map((p) => p[mk]),
    };
    const teacherRows = teacherKey
      ? comparison.filter((r) => r.teacherKey === teacherKey)
      : comparison.filter((r) => effectiveVisible.has(r.teacherKey));
    const teacherSeries = teacherRows.map((r) => ({
      label: r.teacher,
      color: teacherColor[r.teacherKey],
      points: r.points.map((p) => p[mk]),
      titles: r.points.map((p, i) => `${r.teacher} — ${xLabels[i]}: ${p[mk] ?? '—'} (${p.writers} писавших)`),
    }));
    return [allSeries, ...teacherSeries];
  }, [collected, dynamics, comparison, teacherKey, effectiveVisible, mk, teacherColor]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <svg width="32" height="32" viewBox="0 0 48 48" style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 8px' }}>
          <circle cx="24" cy="24" r="20" stroke="var(--blue)" strokeWidth="4" fill="none" strokeDasharray="31.4 62.8" />
        </svg>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray)' }}>Загрузка пробников…</div>
      </div>
    );
  }
  if (subjects.length === 0) {
    return <div style={{ color: 'var(--gray)', fontWeight: 700, padding: '24px 0' }}>Нет данных пробников.</div>;
  }
  if (!collected || !summary) return null;

  const teacherOptions = collected.teachers.map((t) => t.label);
  const selectedTeacherLabel = collected.teachers.find((t) => t.key === teacherKey)?.label || '';
  const cohort = dynamics?.cohort;
  const metricNote = metric === 'primary'
    ? `первичный балл, макс ${metricMax}`
    : (isGradeScale(subject) ? 'оценка, макс 5' : 'вторичный балл, макс 100');

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 6 }}>
        <Sel label="Предмет" value={subject} onChange={changeSubject} options={subjects} placeholder="Выбери предмет" />
        <Sel
          label="Преподаватель"
          value={selectedTeacherLabel}
          onChange={(label) => setTeacherKey(collected.teachers.find((t) => t.label === label)?.key || '')}
          options={teacherOptions}
          placeholder="Все преподаватели"
        />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingBottom: 4 }}>
          {pill(isGradeScale(subject) ? 'Оценка (2–5)' : 'Вторичный (/100)', metric === 'secondary', () => setMetricChoice('secondary'), 'var(--blue)')}
          {pill(`Первичный (/${getMaxScore(subject)})`, metric === 'primary', () => setMetricChoice('primary'), 'var(--blue)')}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, margin: '14px 0 4px' }}>
        <SummaryCard label="Учеников" value={summary.students} note={teacherKey ? selectedTeacherLabel : 'по предмету'} />
        <SummaryCard label="Попыток" value={summary.attempts} />
        <SummaryCard label="Пробников" value={summary.probniks} />
        <SummaryCard label="Ср. балл" value={summary.avg ?? '—'} color={scoreColor(normPct(summary.avg))} note={metricNote} />
        <SummaryCard label="Посещаемость ср." value={fmtPct(summary.attPct, 0)} color={scoreColor(summary.attPct)} note="от писавших за год" />
        <SummaryCard
          label="Экзамен ср."
          value={summary.avgFinal ?? '—'}
          color={summary.avgFinal != null ? scoreColor(normPct(summary.avgFinal)) : 'var(--gray)'}
          note={summary.finalCount ? `${summary.finalCount} сдавших` : 'финальный лист пуст'}
        />
        <SummaryCard
          label="Прогресс состава"
          value={cohort ? `${cohort[deltaKey] > 0 ? '+' : ''}${cohort[deltaKey]}` : '—'}
          color={cohort ? (cohort[deltaKey] > 0 ? '#34b87a' : cohort[deltaKey] < 0 ? '#e05454' : 'var(--black)') : 'var(--gray)'}
          note={cohort ? `${cohort.count} уч., ${cohort.firstLabel} → ${cohort.lastLabel}` : 'нужно ≥2 пробников'}
        />
      </div>

      <SectionTitle>Динамика по пробникам</SectionTitle>
      {!teacherKey && comparison.length > 1 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {comparison.map((r) => pill(r.teacher, effectiveVisible.has(r.teacherKey), () => toggleSeries(r.teacherKey), teacherColor[r.teacherKey]))}
        </div>
      )}
      <div style={{ border: '2px solid var(--border)', borderRadius: 12, padding: '14px 16px 8px', background: 'var(--white)' }}>
        <MultiLine series={chartSeries} xLabels={collected.probniks.map((p) => p.label)} maxY={metricMax} minY={0} height={240} />
        <div style={{ fontSize: 10, color: 'var(--gray)', fontWeight: 600, margin: '6px 0 4px' }}>
          Средний {metricNote}; в тултипе точки — число писавших. Чёрная линия — весь предмет.
        </div>
      </div>

      <ProbniksTeachersTables
        comparison={comparison}
        attendance={attendance}
        probniks={collected.probniks}
        metricKey={mk}
        deltaKey={deltaKey}
        metricMax={metricMax}
        teacherKey={teacherKey}
        teacherColor={teacherColor}
      />

      <ProbniksStudentsTable
        collected={collected}
        subjectName={subject}
        teacherKey={teacherKey}
        metric={metric}
        metricMax={metricMax}
      />

      <ProbniksTasks
        collected={collected}
        subjectName={subject}
        scoresData={scoresData}
        taskThemes={taskThemes}
        teacherKey={teacherKey}
      />
    </div>
  );
}
