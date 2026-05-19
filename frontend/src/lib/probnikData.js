import {
  normalizePersonName,
  normalizeStudentSearchName,
  getStudentSearchNames,
} from './normalizeName.js';

export async function loadExamTemplates() {
  try {
    return await fetch('/examTemplates.json').then((r) => r.json());
  } catch {
    return {};
  }
}

export async function loadScoresData() {
  try {
    const [ege, oge] = await Promise.all([
      fetch('/ege-scores.json').then((r) => r.json()),
      fetch('/oge-scores.json').then((r) => r.json()),
    ]);
    return { ...ege, ...oge };
  } catch {
    return {};
  }
}

export async function loadTaskThemes() {
  try {
    return await fetch('/task-themes.json').then((r) => r.json());
  } catch {
    return {};
  }
}

export function getTaskCount(subject) {
  if (!subject) return 0;
  const lower = subject.toLowerCase().trim();
  const isEGE = lower.includes('егэ');
  if (lower.includes('инф') || lower.includes('информатик')) return isEGE ? 27 : 16;
  if (lower.includes('ря') || lower.includes('русск')) return isEGE ? 37 : 23;
  if (lower.includes('мат') || lower.includes('математ')) {
    if (lower.includes('баз')) return 21;
    if (lower.includes('проф')) return 19;
    return isEGE ? 19 : 25;
  }
  if (lower.includes('физ') || lower.includes('физик')) return isEGE ? 26 : 22;
  if (lower.includes('общ') || lower.includes('обществ')) return isEGE ? 25 : 24;
  if (lower.includes('ист') || lower.includes('истор')) return isEGE ? 21 : 30;
  return 0;
}

export function getMaxScore(subject) {
  if (!subject) return 100;
  const lower = subject.toLowerCase().trim();
  const isEGE = lower.includes('егэ');
  if (lower.includes('инф') || lower.includes('информатик')) return isEGE ? 29 : 21;
  if (lower.includes('мат') || lower.includes('математ')) {
    if (lower.includes('баз')) return 21;
    return isEGE ? 32 : 31;
  }
  if (lower.includes('ря') || lower.includes('русск')) return isEGE ? 50 : 37;
  if (lower.includes('физ') || lower.includes('физик')) return isEGE ? 45 : 39;
  if (lower.includes('общ') || lower.includes('обществ')) return isEGE ? 58 : 37;
  if (lower.includes('ист') || lower.includes('истор')) return isEGE ? 42 : 37;
  return 100;
}

export function pct(v, m) { return m === 0 ? 0 : Math.round((v / m) * 100); }

export function pluralizeSubject(count) {
  const m10 = count % 10, m100 = count % 100;
  if (m10 === 1 && m100 !== 11) return 'предмет';
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return 'предмета';
  return 'предметов';
}

export function pluralizePoints(count) {
  const m10 = count % 10, m100 = count % 100;
  if (m10 === 1 && m100 !== 11) return 'балл';
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return 'балла';
  return 'баллов';
}

export function pluralizeAttempts(count) {
  const m10 = count % 10, m100 = count % 100;
  if (m10 === 1 && m100 !== 11) return 'пробник';
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return 'пробника';
  return 'пробников';
}

export function pluralizeErrors(count) {
  const m10 = count % 10, m100 = count % 100;
  if (m10 === 1 && m100 !== 11) return 'ошибка';
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return 'ошибки';
  return 'ошибок';
}

export function getTaskDisplayLabel(subjectName, examType, taskNum) {
  const lower = subjectName.toLowerCase();
  if (lower.includes('русский') && examType === 'ЕГЭ') {
    if (taskNum === 27) return 'Сочинение';
    if (taskNum >= 28 && taskNum <= 37) return `К${taskNum - 27}`;
  }
  if (lower.includes('русский') && examType === 'ОГЭ') {
    if (taskNum <= 3) return `ИК${taskNum}`;
    if (taskNum <= 14) return `№${taskNum - 2}`;
    const essayLabels = ['СК1', 'СК2', 'СК3', 'СК4', 'ГК1', 'ГК2', 'ГК3', 'ГК4', 'ФК1'];
    return essayLabels[taskNum - 15] || `№${taskNum}`;
  }
  return `№${taskNum}`;
}

export function getMaxScoreForTask(subjectName, taskNum, scoresData = {}) {
  const lower = subjectName.toLowerCase().trim();
  let exam = '', subject = '';
  if (lower.includes('егэ')) exam = 'ЕГЭ';
  else if (lower.includes('огэ')) exam = 'ОГЭ';
  if (lower.includes('матем')) subject = lower.includes('проф') ? 'Математика профиль' : 'Математика';
  else if (lower.includes('русск')) subject = 'Русский язык';
  else if (lower.includes('физ')) subject = 'Физика';
  else if (lower.includes('инф')) subject = 'Информатика';
  else if (lower.includes('общ')) subject = 'Обществознание';
  else if (lower.includes('ист')) subject = 'История';
  if (!exam || !subject) return 1;
  const key = `${exam}|${subject}`;
  if (scoresData[key] && scoresData[key][taskNum - 1] !== undefined) {
    return scoresData[key][taskNum - 1];
  }
  return 1;
}

export function getPartDivisionPoint(examType, subjectName) {
  const lower = subjectName.toLowerCase().trim();
  if (examType === 'ЕГЭ') {
    if (lower.includes('русский')) return 27;
    if (lower.includes('математика') && (lower.includes('профиль') || lower.includes('проф'))) return 12;
    if (lower.includes('информатика')) return -1;
    if (lower.includes('физика')) return 20;
    if (lower.includes('история')) return 12;
    if (lower.includes('обществознание')) return 16;
  } else if (examType === 'ОГЭ') {
    if (lower.includes('русский')) return 14;
    if (lower.includes('математика')) return 19;
    if (lower.includes('информатика')) return 12;
    if (lower.includes('физика')) return 16;
    if (lower.includes('обществознание')) return 20;
  }
  return 0;
}

export function getThemeForTask(subjectName, taskNum, taskThemes = {}) {
  const lower = subjectName.toLowerCase();
  if (lower.includes('русский') && lower.includes('егэ')) {
    if (taskNum === 27) return 'Сочинение';
    if (taskNum >= 28 && taskNum <= 37) {
      const criteriaKey = `К${taskNum - 27}`;
      return taskThemes[subjectName] ? taskThemes[subjectName][criteriaKey] : '';
    }
  }
  const themes = taskThemes[subjectName];
  return themes ? themes[String(taskNum)] : '';
}

export function normalizeScoreCell(value) {
  const score = parseInt(value);
  return Number.isFinite(score) ? score : 0;
}

function sumScoreCells(values) {
  return values.reduce((sum, v) => sum + normalizeScoreCell(v), 0);
}

export function extractSubjectScores(subjectName, values, taskStartCol, numTasks) {
  const lower = subjectName.toLowerCase();
  if (lower.includes('русский') && lower.includes('егэ')) {
    const regularTasks = values.slice(taskStartCol, taskStartCol + 26).map(normalizeScoreCell);
    const criteria = values.slice(taskStartCol + 26, taskStartCol + 36).map(normalizeScoreCell);
    const essayScore = sumScoreCells(criteria);
    const primaryCol = taskStartCol + 36;
    return { taskScores: [...regularTasks, essayScore, ...criteria], primaryScore: values[primaryCol] || '', secondaryScore: values[primaryCol + 1] || '' };
  }
  if (lower.includes('физика') && lower.includes('егэ')) {
    const regularTasks = values.slice(taskStartCol, taskStartCol + 25).map(normalizeScoreCell);
    const task26 = sumScoreCells(values.slice(taskStartCol + 25, taskStartCol + 27));
    const primaryCol = taskStartCol + 27;
    return { taskScores: [...regularTasks, task26], primaryScore: values[primaryCol] || '', secondaryScore: values[primaryCol + 1] || '' };
  }
  if (lower.includes('обществ') && lower.includes('егэ')) {
    const regularTasks = values.slice(taskStartCol, taskStartCol + 23).map(normalizeScoreCell);
    const task24 = sumScoreCells(values.slice(taskStartCol + 23, taskStartCol + 25));
    const task25 = sumScoreCells(values.slice(taskStartCol + 25, taskStartCol + 28));
    const primaryCol = taskStartCol + 28;
    return { taskScores: [...regularTasks, task24, task25], primaryScore: values[primaryCol] || '', secondaryScore: values[primaryCol + 1] || '' };
  }
  const taskEndCol = taskStartCol + numTasks;
  return {
    taskScores: values.slice(taskStartCol, taskEndCol).map(normalizeScoreCell),
    primaryScore: values[taskEndCol] || '',
    secondaryScore: values[taskEndCol + 1] || '',
  };
}

function getProbnikDateFromSheetName(sheetName) {
  const match = sheetName.match(/(\d{1,2})[.\-/](\d{1,2})(?:[.\-/](\d{2,4}))?/);
  if (!match) return '';
  const day = match[1].padStart(2, '0');
  const month = match[2].padStart(2, '0');
  const year = match[3] ? match[3].padStart(4, '20') : '';
  return year ? `${day}.${month}.${year}` : `${day}.${month}`;
}

export function getDateSortValue(date) {
  const parts = date.split('.').map((p) => parseInt(p, 10));
  if (parts.length < 2 || parts.some((p) => !Number.isFinite(p))) return 0;
  const [day, month, year = 2026] = parts;
  return new Date(year, month - 1, day).getTime();
}

function sortAttemptsByDate(attempts) {
  return [...attempts].sort((a, b) => {
    if (Number.isFinite(a.sheetIndex) && Number.isFinite(b.sheetIndex)) return b.sheetIndex - a.sheetIndex;
    return getDateSortValue(b.date) - getDateSortValue(a.date);
  });
}

function getExpectedSubjectFragment(sheetName) {
  const lower = sheetName.toLowerCase();
  if (lower.includes('ря')) return 'русский';
  if (lower.includes('общ')) return 'обществ';
  if (lower.includes('инф')) return 'информ';
  if (lower.includes('физ')) return 'физик';
  if (lower.includes('ист')) return 'истор';
  if (lower.includes('мат')) return 'математ';
  return '';
}

function rowMatchesSheetSubject(sheetName, rowSubject) {
  const expected = getExpectedSubjectFragment(sheetName);
  if (!expected) return true;
  return String(rowSubject || '').toLowerCase().includes(expected);
}

export async function loadSheetsData() {
  const allStudents = {};
  const probnikCatalog = {};
  try {
    const sheetsData = await fetch('/data.json').then((r) => r.json());
    for (const [sheetIndex, [sheetName, rows]] of Object.entries(sheetsData).entries()) {
      if (rows.length < 3) continue;
      const examType = sheetName.includes('ЕГЭ') || sheetName.includes('БАЗА') || sheetName.includes('ПРОФ') || sheetName.includes('ИСТ') ? 'ЕГЭ' : 'ОГЭ';
      let subjectName = '';
      if (sheetName.includes('РЯ')) subjectName = 'русский язык ' + examType;
      else if (sheetName.includes('МАТ') || sheetName.includes('Мат')) {
        if (sheetName.includes('БАЗА')) subjectName = 'математика ЕГЭ (база)';
        else if (sheetName.includes('ПРОФ')) subjectName = 'математика ЕГЭ-ПРОФ';
        else subjectName = 'математика ' + examType;
      } else if (sheetName.includes('ОБЩ')) subjectName = 'обществознание ' + examType;
      else if (sheetName.includes('ИНФ')) subjectName = 'информатика ' + examType;
      else if (sheetName.includes('ФИЗ')) subjectName = 'физика ' + examType;
      else if (sheetName.includes('ИСТ')) subjectName = 'история ЕГЭ';
      if (!subjectName) continue;
      probnikCatalog[subjectName] = (probnikCatalog[subjectName] || 0) + 1;

      const numTasks = getTaskCount(subjectName);
      for (let i = 2; i < rows.length; i++) {
        const values = rows[i];
        if (values.length < 4) continue;
        if (!rowMatchesSheetSubject(sheetName, values[0])) continue;
        const teacher = values[1] || '';
        const studentName = normalizePersonName(values[2] || '');
        if (!studentName) continue;
        const { taskScores, primaryScore, secondaryScore } = extractSubjectScores(subjectName, values, 3, numTasks);
        if (!secondaryScore || secondaryScore === '#N/A' || secondaryScore === '#Н/Д') continue;
        const key = `${studentName}|${examType}`;
        if (!allStudents[key]) {
          allStudents[key] = {
            name: values[2], searchName: studentName,
            searchKey: normalizeStudentSearchName(values[2] || ''),
            searchKeys: getStudentSearchNames(values[2] || ''),
            examType, subjects: {},
          };
        }
        if (!allStudents[key].subjects[subjectName]) {
          allStudents[key].subjects[subjectName] = { name: subjectName, examType, attempts: [] };
        }
        allStudents[key].subjects[subjectName].attempts.push({
          name: subjectName, examType, teacher, primaryScore, secondaryScore, taskScores,
          date: getProbnikDateFromSheetName(sheetName), sheetName, sheetIndex,
        });
      }
    }
    // Дедупликация: если ученик попал и в ЕГЭ и в ОГЭ листы по одному предмету —
    // убираем ОГЭ-дубль (приоритет у ЕГЭ-записи с реальными баллами).
    const nameToKeys = {};
    for (const key of Object.keys(allStudents)) {
      const n = allStudents[key].searchName;
      if (!nameToKeys[n]) nameToKeys[n] = [];
      nameToKeys[n].push(key);
    }
    for (const keys of Object.values(nameToKeys)) {
      const egeKey = keys.find((k) => k.endsWith('|ЕГЭ'));
      const ogeKey = keys.find((k) => k.endsWith('|ОГЭ'));
      if (!egeKey || !ogeKey) continue;
      const egeSubjects = allStudents[egeKey].subjects;
      const ogeSubjects = allStudents[ogeKey].subjects;
      for (const ogeSubjName of Object.keys(ogeSubjects)) {
        const egeEquivalent = ogeSubjName.replace(' ОГЭ', ' ЕГЭ');
        if (egeSubjects[egeEquivalent]) delete ogeSubjects[ogeSubjName];
      }
      if (Object.keys(ogeSubjects).length === 0) delete allStudents[ogeKey];
    }

    return { students: processStudentData(allStudents), catalog: probnikCatalog };
  } catch {
    return { students: {}, catalog: {} };
  }
}

function deduplicateAttempts(attempts) {
  const sorted = [...attempts].sort((a, b) => {
    if (Number.isFinite(a.sheetIndex) && Number.isFinite(b.sheetIndex)) return a.sheetIndex - b.sheetIndex;
    return getDateSortValue(a.date) - getDateSortValue(b.date);
  });
  const seen = new Set();
  return sorted.filter((a) => {
    const fp = (a.taskScores || []).join(',');
    if (seen.has(fp)) return false;
    seen.add(fp);
    return true;
  });
}

function processStudentData(allStudents) {
  const result = {};
  for (const [key, student] of Object.entries(allStudents)) {
    const subjects = [];
    for (const subjectData of Object.values(student.subjects)) {
      const attempts = sortAttemptsByDate(deduplicateAttempts(subjectData.attempts || []));
      const latest = attempts[0];
      if (!latest) continue;
      subjects.push({
        name: subjectData.name, examType: latest.examType, teacher: latest.teacher,
        primaryScore: parseInt(latest.primaryScore) || 0,
        secondaryScore: parseInt(latest.secondaryScore) || 0,
        taskScores: latest.taskScores, date: latest.date,
        attempts: attempts.map((a) => ({
          ...a, primaryScore: parseInt(a.primaryScore) || 0, secondaryScore: parseInt(a.secondaryScore) || 0,
        })),
      });
    }
    if (subjects.length > 0) {
      const examType = subjects[0].examType;
      result[key] = {
        name: student.name, searchName: student.searchName,
        searchKey: student.searchKey, searchKeys: student.searchKeys,
        id: `${student.searchName}|${examType}`,
        examType, grade: examType === 'ЕГЭ' ? '11' : '9', subjects,
      };
    }
  }
  return result;
}

export function buildSections(subject, examTemplates = {}) {
  if (!examTemplates[subject.name]) return [];
  const template = examTemplates[subject.name];
  const sections = [];
  if (template.sections) {
    for (const section of template.sections) {
      const blocks = section.blocks || (section.name ? [{ name: section.name, tasks: section.tasks }] : []);
      for (const block of blocks) {
        if (!block.tasks || block.tasks.length === 0) continue;
        let correctCount = 0;
        for (const taskNum of block.tasks) {
          const idx = (typeof taskNum === 'string' ? parseInt(taskNum) : taskNum) - 1;
          if (idx >= 0 && idx < subject.taskScores.length) {
            if ((parseInt(subject.taskScores[idx]) || 0) > 0) correctCount++;
          }
        }
        sections.push({
          name: block.name || section.part,
          total: block.tasks.length,
          correct: correctCount,
          percentage: Math.round((correctCount / block.tasks.length) * 100),
        });
      }
    }
  }
  return sections;
}

export function generateRecommendations(sections) {
  if (sections.length === 0) return [];
  const sorted = [...sections].sort((a, b) => a.percentage - b.percentage);
  const recommendations = [];
  for (let i = 0; i < Math.min(2, sorted.length); i++) {
    const s = sorted[i];
    let tip = '';
    if (s.percentage === 0) tip = `Раздел "${s.name}" требует особого внимания. Начните с основ этой темы.`;
    else if (s.percentage < 50) tip = `В разделе "${s.name}" нужна серьёзная подготовка. Решайте больше задач.`;
    else if (s.percentage < 70) tip = `Раздел "${s.name}" требует дополнительной практики.`;
    if (tip) recommendations.push(tip);
  }
  return recommendations;
}

export function buildSubjectAnalytics(subject, data = {}) {
  const { scoresData = {}, taskThemes = {} } = data;
  const attempts = subject.attempts && subject.attempts.length > 0 ? subject.attempts : [subject];
  const hasSheetOrder = attempts.every((a) => Number.isFinite(a.sheetIndex));
  const chronologicalAttempts = hasSheetOrder
    ? [...attempts].sort((a, b) => a.sheetIndex - b.sheetIndex)
    : [...attempts].sort((a, b) => getDateSortValue(a.date || '') - getDateSortValue(b.date || ''));

  const scoreValues = attempts.map((a) => Number(a.secondaryScore) || 0);
  const primaryValues = attempts.map((a) => Number(a.primaryScore) || 0);
  const avgSecondary = scoreValues.length ? Math.round(scoreValues.reduce((s, v) => s + v, 0) / scoreValues.length) : 0;
  const avgPrimary = primaryValues.length ? Math.round(primaryValues.reduce((s, v) => s + v, 0) / primaryValues.length) : 0;
  const bestAttempt = attempts.reduce((best, a) => ((a.secondaryScore || 0) > (best.secondaryScore || 0) ? a : best), attempts[0]);
  const firstAttempt = chronologicalAttempts[0] || attempts[0];
  const lastAttempt = chronologicalAttempts[chronologicalAttempts.length - 1] || attempts[0];
  const trend = (Number(lastAttempt.secondaryScore) || 0) - (Number(firstAttempt.secondaryScore) || 0);
  const bestToLastGap = (Number(bestAttempt.secondaryScore) || 0) - (Number(lastAttempt.secondaryScore) || 0);

  const taskCount = Math.max(...attempts.map((a) => (a.taskScores || []).length), getTaskCount(subject.name));
  const taskStats = [];
  const themeStatsMap = {};

  for (let index = 0; index < taskCount; index++) {
    const taskNum = index + 1;
    const maxScore = getMaxScoreForTask(subject.name, taskNum, scoresData);
    const values = attempts
      .map((a) => normalizeScoreCell((a.taskScores || [])[index]))
      .filter((s) => Number.isFinite(s));
    if (!values.length) continue;

    const earned = values.reduce((s, v) => s + v, 0);
    const possible = maxScore * values.length;
    const lost = Math.max(0, possible - earned);
    const failCount = values.filter((s) => s < maxScore).length;
    const zeroCount = values.filter((s) => s === 0).length;
    const percent = possible > 0 ? Math.round((earned / possible) * 100) : 0;
    const theme = getThemeForTask(subject.name, taskNum, taskThemes) || `Задание ${taskNum}`;
    const mainTheme = theme.split('.')[0].trim();

    taskStats.push({ taskNum, theme, earned, possible, lost, failCount, zeroCount, attempts: values.length, percent });

    if (!themeStatsMap[mainTheme]) {
      themeStatsMap[mainTheme] = { name: mainTheme, earned: 0, possible: 0, lost: 0, failCount: 0, attempts: 0, tasks: new Set() };
    }
    themeStatsMap[mainTheme].earned += earned;
    themeStatsMap[mainTheme].possible += possible;
    themeStatsMap[mainTheme].lost += lost;
    themeStatsMap[mainTheme].failCount += failCount;
    themeStatsMap[mainTheme].attempts += values.length;
    themeStatsMap[mainTheme].tasks.add(taskNum);
  }

  const goodTasks = taskStats.filter((t) => t.zeroCount < t.attempts && t.failCount <= 1).sort((a, b) => a.taskNum - b.taskNum);
  const frequentErrors = taskStats.filter((t) => t.zeroCount < t.attempts && t.failCount >= 2).sort((a, b) => a.taskNum - b.taskNum);
  const tryTasks = taskStats.filter((t) => t.zeroCount === t.attempts && t.possible > 0).sort((a, b) => a.taskNum - b.taskNum);

  const weakThemes = Object.values(themeStatsMap)
    .map((t) => ({ ...t, tasks: Array.from(t.tasks).sort((a, b) => a - b), percent: t.possible > 0 ? Math.round((t.earned / t.possible) * 100) : 0 }))
    .filter((t) => t.lost > 0)
    .sort((a, b) => a.percent - b.percent || b.lost - a.lost)
    .slice(0, 5);

  const recommendations = weakThemes.filter((t) => t.earned > 0).slice(0, 3).map((t) => {
    const taskText = t.tasks.slice(0, 4).map((n) => getTaskDisplayLabel(subject.name, subject.examType, n)).join(', ');
    return `Повторить: ${t.name}${taskText ? ` (${taskText})` : ''}.`;
  });
  if (tryTasks.length > 0) {
    recommendations.unshift(`Взять в работу задания, где пока нет набранных баллов: ${tryTasks.map((t) => getTaskDisplayLabel(subject.name, subject.examType, t.taskNum)).join(', ')}.`);
  }
  if (bestToLastGap > 0) {
    recommendations.unshift(`Последний пробник ниже лучшего на ${bestToLastGap} ${pluralizePoints(bestToLastGap)}: стоит вернуть темы, которые просели после пика.`);
  }
  if (trend < 0) {
    recommendations.unshift('Проверить, что изменилось в последних работах: результат просел относительно первого пробника.');
  } else if (trend > 0) {
    recommendations.unshift('Закрепить темы, которые дали рост, и не отпускать регулярную практику.');
  }
  if (!recommendations.length) {
    recommendations.push('Серьезных повторяющихся провалов нет: держать темп и тренировать задания с потерянными баллами точечно.');
  }

  return { attempts, chronologicalAttempts, avgSecondary, avgPrimary, bestAttempt, firstAttempt, lastAttempt, trend, bestToLastGap, goodTasks, frequentErrors, tryTasks, weakThemes, recommendations };
}
