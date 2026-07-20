import {
  getTaskCount,
  getTaskDisplayLabel,
  getMaxScoreForTask,
  normalizeScoreCell,
} from './probnikData.js';

// Агрегаты пробников в разрезе предмет × преподаватель для админ-вкладки «Пробники».
// Вход всюду — allStudents из ProbnikProvider (уже распарсен и дедуплицирован),
// второго парсинга data.json нет. Ось пробников — строго по sheetIndex: в датах
// листов нет года, поэтому сортировка по дате перепутала бы осень и весну.

const NO_TEACHER_KEY = 'без преподавателя';
const NO_TEACHER_LABEL = 'Без преподавателя';

export function normalizeTeacherKey(raw) {
  const key = String(raw || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/ё/g, 'е');
  if (!key || key === 'без препода' || key === NO_TEACHER_KEY) return NO_TEACHER_KEY;
  return key;
}

function round1(v) { return Math.round(v * 10) / 10; }
function roundPct(part, total) { return total === 0 ? 0 : Math.round((part / total) * 100); }
function mean(values) { return values.length === 0 ? null : values.reduce((s, v) => s + v, 0) / values.length; }

// Плоский срез попыток по предмету + ось пробников + справочник преподавателей.
// finals — результаты реального экзамена (листы без даты): отдельно от attempts,
// в ось пробников, динамику и посещаемость не входят.
export function collectSubjectAttempts(allStudents, subjectName) {
  const attempts = [];
  const finals = [];
  const probnikByIndex = new Map();
  const teacherMap = new Map(); // key → { variants: Map<label, count>, studentIds: Set, attempts }

  for (const stu of Object.values(allStudents || {})) {
    const fin = stu.finalExams?.[subjectName];
    if (fin) {
      finals.push({
        studentId: stu.id,
        studentName: stu.name,
        teacherKey: normalizeTeacherKey(fin.teacher),
        primaryScore: fin.primaryScore,
        secondaryScore: fin.secondaryScore,
        taskScores: fin.taskScores || [],
      });
    }
    for (const subj of stu.subjects || []) {
      if (subj.name !== subjectName) continue;
      for (const a of subj.attempts || []) {
        const teacherKey = normalizeTeacherKey(a.teacher);
        attempts.push({
          studentId: stu.id,
          studentName: stu.name,
          teacherKey,
          sheetIndex: a.sheetIndex,
          date: a.date,
          examType: a.examType,
          primaryScore: a.primaryScore,
          secondaryScore: a.secondaryScore,
          taskScores: a.taskScores || [],
        });
        if (!probnikByIndex.has(a.sheetIndex)) {
          probnikByIndex.set(a.sheetIndex, {
            sheetIndex: a.sheetIndex,
            sheetName: a.sheetName,
            date: a.date,
            label: a.date || a.sheetName,
          });
        }
        if (!teacherMap.has(teacherKey)) {
          teacherMap.set(teacherKey, { variants: new Map(), studentIds: new Set(), attempts: 0 });
        }
        const t = teacherMap.get(teacherKey);
        const variant = teacherKey === NO_TEACHER_KEY
          ? (String(a.teacher || '').trim().replace(/\s+/g, ' ') || NO_TEACHER_LABEL)
          : String(a.teacher || '').trim().replace(/\s+/g, ' ');
        t.variants.set(variant, (t.variants.get(variant) || 0) + 1);
        t.studentIds.add(stu.id);
        t.attempts += 1;
      }
    }
  }

  const probniks = [...probnikByIndex.values()].sort((a, b) => a.sheetIndex - b.sheetIndex);

  const teachers = [...teacherMap.entries()]
    .map(([key, t]) => {
      let label = '';
      let best = -1;
      for (const [variant, count] of t.variants) {
        if (count > best) { best = count; label = variant; }
      }
      return { key, label, students: t.studentIds.size, attempts: t.attempts };
    })
    .sort((a, b) => a.label.localeCompare(b.label, 'ru'));

  return { subjectName, probniks, attempts, finals, teachers };
}

function scopeAttempts(collected, teacherKey) {
  return teacherKey
    ? collected.attempts.filter((a) => a.teacherKey === teacherKey)
    : collected.attempts;
}

// Точки по оси probniks: { avgSecondary|null, avgPrimary|null, writers } на каждый пробник.
function buildPoints(collected, attempts) {
  return collected.probniks.map((p) => {
    const here = attempts.filter((a) => a.sheetIndex === p.sheetIndex);
    if (here.length === 0) return { avgSecondary: null, avgPrimary: null, writers: 0 };
    return {
      avgSecondary: round1(mean(here.map((a) => a.secondaryScore))),
      avgPrimary: round1(mean(here.map((a) => a.primaryScore))),
      writers: here.length,
    };
  });
}

// «Постоянный состав»: ученики с попыткой и на первом, и на последнем пробнике скоупа.
// Первый/последний — пробники, где в скоупе есть хотя бы один писавший; <2 таких → null.
function buildCohort(collected, attempts) {
  const active = collected.probniks.filter((p) =>
    attempts.some((a) => a.sheetIndex === p.sheetIndex));
  if (active.length < 2) return null;
  const first = active[0];
  const last = active[active.length - 1];

  const byStudent = new Map();
  for (const a of attempts) {
    if (a.sheetIndex !== first.sheetIndex && a.sheetIndex !== last.sheetIndex) continue;
    if (!byStudent.has(a.studentId)) byStudent.set(a.studentId, {});
    const slot = byStudent.get(a.studentId);
    if (a.sheetIndex === first.sheetIndex) slot.first = a;
    else slot.last = a;
  }
  const pairs = [...byStudent.values()].filter((s) => s.first && s.last);
  if (pairs.length === 0) return null;

  const firstSec = pairs.map((p) => p.first.secondaryScore);
  const lastSec = pairs.map((p) => p.last.secondaryScore);
  const firstPrim = pairs.map((p) => p.first.primaryScore);
  const lastPrim = pairs.map((p) => p.last.primaryScore);
  return {
    count: pairs.length,
    firstLabel: first.label,
    lastLabel: last.label,
    avgFirstSecondary: round1(mean(firstSec)),
    avgLastSecondary: round1(mean(lastSec)),
    deltaSecondary: round1(mean(pairs.map((p) => p.last.secondaryScore - p.first.secondaryScore))),
    avgFirstPrimary: round1(mean(firstPrim)),
    avgLastPrimary: round1(mean(lastPrim)),
    deltaPrimary: round1(mean(pairs.map((p) => p.last.primaryScore - p.first.primaryScore))),
  };
}

// Сравнение преподавателей: строка на преподавателя, points выровнены по оси probniks.
// avgFinal* — средний результат реального экзамена по ученикам преподавателя.
export function buildTeacherComparison(collected) {
  return collected.teachers.map((t) => {
    const attempts = scopeAttempts(collected, t.key);
    const studentIds = [...new Set(attempts.map((a) => a.studentId))];
    const finals = (collected.finals || []).filter((f) => f.teacherKey === t.key);
    return {
      teacherKey: t.key,
      teacher: t.label,
      students: studentIds.length,
      studentIds,
      attempts: attempts.length,
      avgSecondary: round1(mean(attempts.map((a) => a.secondaryScore))),
      avgPrimary: round1(mean(attempts.map((a) => a.primaryScore))),
      finalCount: finals.length,
      avgFinalSecondary: finals.length ? round1(mean(finals.map((f) => f.secondaryScore))) : null,
      avgFinalPrimary: finals.length ? round1(mean(finals.map((f) => f.primaryScore))) : null,
      points: buildPoints(collected, attempts),
      cohort: buildCohort(collected, attempts),
    };
  });
}

// Поимённая матрица «ученик × пробники»: строка содержит ВСЕ попытки ученика по
// предмету; фильтр преподавателя лишь отбирает строки (попытка или финал у него).
export function buildStudentMatrix(collected, teacherKey = null) {
  const byStudent = new Map();
  const ensure = (id, name) => {
    if (!byStudent.has(id)) {
      byStudent.set(id, { studentId: id, studentName: name, attempts: [], final: null, teacherKeys: new Set(), teacherLabels: new Set() });
    }
    return byStudent.get(id);
  };
  const labelByKey = Object.fromEntries(collected.teachers.map((t) => [t.key, t.label]));

  for (const a of collected.attempts) {
    const s = ensure(a.studentId, a.studentName);
    s.attempts.push(a);
    s.teacherKeys.add(a.teacherKey);
    s.teacherLabels.add(labelByKey[a.teacherKey] || a.teacherKey);
  }
  for (const f of collected.finals || []) {
    const s = ensure(f.studentId, f.studentName);
    s.final = { primaryScore: f.primaryScore, secondaryScore: f.secondaryScore, teacherKey: f.teacherKey };
    s.teacherKeys.add(f.teacherKey);
    s.teacherLabels.add(labelByKey[f.teacherKey] || f.teacherKey);
  }

  let rows = [...byStudent.values()];
  if (teacherKey) rows = rows.filter((s) => s.teacherKeys.has(teacherKey));

  return rows
    .map((s) => {
      const perProbnik = collected.probniks.map((p) => {
        const here = s.attempts.filter((a) => a.sheetIndex === p.sheetIndex);
        if (here.length === 0) return null;
        return {
          secondaryScore: round1(mean(here.map((a) => a.secondaryScore))),
          primaryScore: round1(mean(here.map((a) => a.primaryScore))),
        };
      });
      const written = perProbnik.filter(Boolean);
      const avgSecondary = written.length ? round1(mean(written.map((p) => p.secondaryScore))) : null;
      const avgPrimary = written.length ? round1(mean(written.map((p) => p.primaryScore))) : null;
      return {
        studentId: s.studentId,
        studentName: s.studentName,
        teachers: [...s.teacherLabels].sort((a, b) => a.localeCompare(b, 'ru')),
        perProbnik,
        writtenCount: written.length,
        avgSecondary,
        avgPrimary,
        final: s.final ? { primaryScore: s.final.primaryScore, secondaryScore: s.final.secondaryScore } : null,
        // Δ — экзамен против среднего по пробникам (разница видимых в таблице колонок).
        deltaSecondary: s.final && avgSecondary != null ? round1(s.final.secondaryScore - avgSecondary) : null,
        deltaPrimary: s.final && avgPrimary != null ? round1(s.final.primaryScore - avgPrimary) : null,
      };
    })
    .sort((a, b) => a.studentName.localeCompare(b.studentName, 'ru'));
}

// Динамика по пробникам для скоупа (весь предмет или один преподаватель).
export function buildProbnikDynamics(collected, teacherKey = null) {
  const attempts = scopeAttempts(collected, teacherKey);
  const points = collected.probniks.map((p, i) => ({
    sheetIndex: p.sheetIndex,
    label: p.label,
    ...buildPoints(collected, attempts)[i],
  }));
  return { points, cohort: buildCohort(collected, attempts) };
}

// Посещаемость: знаменатель — годовой roster (все, кто написал ≥1 пробник у преподавателя).
// avgPct — по «активному окну» (от первого до последнего пробника с писавшими),
// чтобы преподаватель, начавший среди года, не получал незаслуженные нули.
export function buildAttendance(collected) {
  const perScope = (attempts) => {
    const roster = new Set(attempts.map((a) => a.studentId)).size;
    const perProbnik = collected.probniks.map((p) => {
      const wrote = new Set(
        attempts.filter((a) => a.sheetIndex === p.sheetIndex).map((a) => a.studentId)
      ).size;
      return { wrote, pct: roundPct(wrote, roster) };
    });
    const activeIdx = perProbnik
      .map((p, i) => (p.wrote > 0 ? i : -1))
      .filter((i) => i >= 0);
    let avgPct = 0;
    if (activeIdx.length > 0) {
      const from = activeIdx[0];
      const to = activeIdx[activeIdx.length - 1];
      const window = perProbnik.slice(from, to + 1).map((p) => p.pct);
      avgPct = Math.round(mean(window));
    }
    return { roster, perProbnik, avgPct };
  };

  return {
    probniks: collected.probniks,
    teachers: collected.teachers.map((t) => ({
      teacherKey: t.key,
      teacher: t.label,
      ...perScope(scopeAttempts(collected, t.key)),
    })),
    overall: perScope(collected.attempts),
  };
}

function resolveExamType(collected, subjectName) {
  return collected.attempts[0]?.examType || (subjectName.includes('ОГЭ') ? 'ОГЭ' : 'ЕГЭ');
}

function taskStatsFor(attempts, taskIdx, maxScore) {
  let earned = 0;
  let full = 0;
  let zero = 0;
  for (const a of attempts) {
    const score = normalizeScoreCell(a.taskScores[taskIdx]);
    earned += score;
    if (score === maxScore) full += 1;
    if (score === 0) zero += 1;
  }
  return { earned, possible: attempts.length * maxScore, full, zero };
}

// Решаемость заданий: % баллов от максимума + % полный балл + % нулей + динамика по пробникам.
// Отсутствующий/нечисловой балл = 0 — конвенция buildSubjectAnalytics.
export function buildTaskSolvability(collected, { subjectName, scoresData = {}, teacherKey = null }) {
  const numTasks = getTaskCount(subjectName);
  const attempts = scopeAttempts(collected, teacherKey);
  const examType = resolveExamType(collected, subjectName);

  const rows = [];
  for (let taskNum = 1; taskNum <= numTasks; taskNum++) {
    const maxScore = getMaxScoreForTask(subjectName, taskNum, scoresData);
    const total = taskStatsFor(attempts, taskNum - 1, maxScore);
    const perProbnikPct = collected.probniks.map((p) => {
      const here = attempts.filter((a) => a.sheetIndex === p.sheetIndex);
      if (here.length === 0) return null;
      const s = taskStatsFor(here, taskNum - 1, maxScore);
      return roundPct(s.earned, s.possible);
    });
    rows.push({
      taskNum,
      label: getTaskDisplayLabel(subjectName, examType, taskNum),
      maxScore,
      attempts: attempts.length,
      pct: roundPct(total.earned, total.possible),
      fullPct: roundPct(total.full, attempts.length),
      zeroPct: roundPct(total.zero, attempts.length),
      perProbnikPct,
    });
  }
  return rows;
}

// Матрица задание × преподаватель: pct (% баллов от максимума) в каждой ячейке.
export function buildTaskTeacherMatrix(collected, { subjectName, scoresData = {} }) {
  const numTasks = getTaskCount(subjectName);
  const examType = resolveExamType(collected, subjectName);
  const byTeacherAttempts = collected.teachers.map((t) => ({
    key: t.key,
    attempts: scopeAttempts(collected, t.key),
  }));

  const rows = [];
  for (let taskNum = 1; taskNum <= numTasks; taskNum++) {
    const maxScore = getMaxScoreForTask(subjectName, taskNum, scoresData);
    const byTeacher = {};
    for (const { key, attempts } of byTeacherAttempts) {
      if (attempts.length === 0) {
        byTeacher[key] = null;
        continue;
      }
      const s = taskStatsFor(attempts, taskNum - 1, maxScore);
      byTeacher[key] = { pct: roundPct(s.earned, s.possible), attempts: attempts.length };
    }
    rows.push({
      taskNum,
      label: getTaskDisplayLabel(subjectName, examType, taskNum),
      maxScore,
      byTeacher,
    });
  }
  return { teachers: collected.teachers.map((t) => ({ key: t.key, label: t.label })), rows };
}
