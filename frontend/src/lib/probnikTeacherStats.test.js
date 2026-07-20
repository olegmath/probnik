import { describe, it, expect } from 'vitest';
import {
  normalizeTeacherKey,
  collectSubjectAttempts,
  buildTeacherComparison,
  buildProbnikDynamics,
  buildAttendance,
  buildTaskSolvability,
  buildTaskTeacherMatrix,
  buildStudentMatrix,
  probnikSubjectToJournal,
  buildStudentGroupMap,
  filterCollected,
} from './probnikTeacherStats.js';
import { getMaxScoreForTask, isFinalExamSheet } from './probnikData.js';

const SUBJ = 'математика ЕГЭ-ПРОФ';

// Максимумы первых трёх заданий: 1,1,2 — остальные 16 по 1 (матпроф = 19 заданий).
const SCORES_DATA = {
  'ЕГЭ|Математика профиль': [1, 1, 2, ...Array(16).fill(1)],
};

function attempt(teacher, sheetIndex, date, secondaryScore, taskScores = []) {
  return {
    name: SUBJ, examType: 'ЕГЭ', teacher,
    primaryScore: Math.round(secondaryScore / 5), secondaryScore,
    taskScores, date, sheetName: `МАТ ПРОФ ${date}`, sheetIndex,
  };
}

function student(id, name, attempts, subjectName = SUBJ) {
  return {
    id, name, searchName: name.toLowerCase(), examType: 'ЕГЭ', grade: '11',
    subjects: [{ name: subjectName, examType: 'ЕГЭ', teacher: attempts[0]?.teacher || '', attempts }],
  };
}

// Три пробника: sheetIndex 0 (21.09), 5 (14.12), 9 (18.01).
// Даты без года: по дате «18.01» встал бы ПЕРЕД «21.09» — ось обязана идти по sheetIndex.
const FIXTURE = {
  'вася|ЕГЭ|11': student('вася|ЕГЭ|11', 'Пупкин Вася', [
    attempt('Анна Иванова', 0, '21.09', 50, [1, 1, 2]),
    attempt(' Анна  Иванова ', 5, '14.12', 60, [1, 0, 1]),
    attempt('Анна Иванова', 9, '18.01', 70, [1, 1, 2]),
  ]),
  'маша|ЕГЭ|11': student('маша|ЕГЭ|11', 'Кузнецова Маша', [
    attempt('Анна Иванова', 0, '21.09', 40, [0, 1, 0]),
    attempt('Анна Иванова', 5, '14.12', 50, [1, 1, 1]),
  ]),
  'гриша|ЕГЭ|11': student('гриша|ЕГЭ|11', 'Смирнов Гриша', [
    attempt('Анна Иванова', 0, '21.09', 30, [0, 0, 0]),
    attempt('Пётр Сидоров', 9, '18.01', 80, [1, 1, 2]),
  ]),
  'оля|ЕГЭ|11': student('оля|ЕГЭ|11', 'Иванова Оля', [
    attempt('Петр Сидоров', 5, '14.12', 55, [1, 1, 0]),
    attempt('Пётр Сидоров', 9, '18.01', 65, [0, 1, 1]),
  ]),
  'дима|ЕГЭ|11': student('дима|ЕГЭ|11', 'Орлов Дима', [
    attempt('без препода', 0, '21.09', 20, [0, 0, 0]),
    attempt('Без преподавателя', 5, '14.12', 25, [0, 0, 1]),
    attempt('Без преподавателя', 9, '18.01', 30, [0, 1, 0]),
  ]),
  // Ученик другого предмета — не должен попадать в срез.
  'физик|ЕГЭ|11': student('физик|ЕГЭ|11', 'Чужой Предметник', [
    { name: 'физика ЕГЭ', examType: 'ЕГЭ', teacher: 'Анна Иванова', primaryScore: 10, secondaryScore: 55, taskScores: [1], date: '21.09', sheetName: 'ФИЗ ЕГЭ 21.09', sheetIndex: 1 },
  ], 'физика ЕГЭ'),
  // Marathon-only: attempts пустой — пропускается.
  'пустой|ЕГЭ|11': student('пустой|ЕГЭ|11', 'Марафонов Толя', []),
};
// у «пустого» subjects[0].attempts = [] — collectSubjectAttempts обязан его игнорировать
FIXTURE['пустой|ЕГЭ|11'].subjects = [{ name: SUBJ, examType: 'ЕГЭ', attempts: [] }];

// Финальный (реальный) ЕГЭ — отдельная структура, не участвует в оси пробников.
FIXTURE['вася|ЕГЭ|11'].finalExams = {
  [SUBJ]: { teacher: 'Анна Иванова', primaryScore: 15, secondaryScore: 72, taskScores: [1, 1, 2], sheetName: 'МАТ ПРОФ' },
};
FIXTURE['гриша|ЕГЭ|11'].finalExams = {
  [SUBJ]: { teacher: 'Пётр Сидоров', primaryScore: 17, secondaryScore: 85, taskScores: [1, 1, 2], sheetName: 'МАТ ПРОФ' },
};
FIXTURE['оля|ЕГЭ|11'].finalExams = {
  [SUBJ]: { teacher: 'Петр Сидоров', primaryScore: 12, secondaryScore: 60, taskScores: [1, 1, 0], sheetName: 'МАТ ПРОФ' },
};
// Соня: сдала реальный ЕГЭ, но не писала ни одного пробника.
FIXTURE['соня|ЕГЭ|11'] = student('соня|ЕГЭ|11', 'Финалова Соня', []);
FIXTURE['соня|ЕГЭ|11'].subjects = [{ name: SUBJ, examType: 'ЕГЭ', attempts: [] }];
FIXTURE['соня|ЕГЭ|11'].finalExams = {
  [SUBJ]: { teacher: 'Анна Иванова', primaryScore: 10, secondaryScore: 50, taskScores: [1, 0, 1], sheetName: 'МАТ ПРОФ' },
};

const ANNA = normalizeTeacherKey('Анна Иванова');
const PETR = normalizeTeacherKey('Пётр Сидоров');
const NOBODY = normalizeTeacherKey('без преподавателя');

describe('normalizeTeacherKey', () => {
  it('схлопывает пробелы и регистр', () => {
    expect(normalizeTeacherKey(' Анна  Иванова ')).toBe('анна иванова');
  });
  it('ё → е', () => {
    expect(normalizeTeacherKey('Пётр Сидоров')).toBe(normalizeTeacherKey('Петр Сидоров'));
  });
  it('пустое и «без препода» сливаются в «без преподавателя»', () => {
    expect(normalizeTeacherKey('')).toBe('без преподавателя');
    expect(normalizeTeacherKey('без препода')).toBe('без преподавателя');
    expect(normalizeTeacherKey('Без преподавателя')).toBe('без преподавателя');
  });
});

describe('collectSubjectAttempts', () => {
  const collected = collectSubjectAttempts(FIXTURE, SUBJ);

  it('ось пробников идёт по sheetIndex, а не по дате (в датах нет года)', () => {
    expect(collected.probniks.map((p) => p.sheetIndex)).toEqual([0, 5, 9]);
    expect(collected.probniks.map((p) => p.label)).toEqual(['21.09', '14.12', '18.01']);
  });

  it('берёт только нужный предмет и пропускает пустые attempts', () => {
    expect(collected.attempts).toHaveLength(12);
    expect(collected.attempts.every((a) => a.studentId !== 'физик|ЕГЭ|11')).toBe(true);
    expect(collected.attempts.every((a) => a.studentId !== 'пустой|ЕГЭ|11')).toBe(true);
  });

  it('группирует преподавателей по нормализованному ключу, label = самый частый сырой вариант', () => {
    const keys = collected.teachers.map((t) => t.key);
    expect(keys).toEqual([ANNA, NOBODY, PETR]); // сортировка по label, ru
    const anna = collected.teachers.find((t) => t.key === ANNA);
    expect(anna.label).toBe('Анна Иванова'); // а не ' Анна  Иванова '
    expect(anna.students).toBe(3);
    expect(anna.attempts).toBe(6);
    const nobody = collected.teachers.find((t) => t.key === NOBODY);
    expect(nobody.label).toBe('Без преподавателя'); // 2 раза против 1 «без препода»
  });
});

describe('buildTeacherComparison', () => {
  const rows = buildTeacherComparison(collectSubjectAttempts(FIXTURE, SUBJ));
  const anna = rows.find((r) => r.teacherKey === ANNA);
  const petr = rows.find((r) => r.teacherKey === PETR);
  const nobody = rows.find((r) => r.teacherKey === NOBODY);

  it('уникальные ученики и средние по всем попыткам', () => {
    expect(anna.students).toBe(3);
    expect(anna.attempts).toBe(6);
    expect(anna.avgSecondary).toBe(50); // (50+60+70+40+50+30)/6
    expect(petr.students).toBe(2);
    expect(petr.avgSecondary).toBe(66.7); // (80+55+65)/3
  });

  it('ученик у двух преподавателей входит в обе строки', () => {
    const annaIds = anna.studentIds;
    const petrIds = petr.studentIds;
    expect(annaIds).toContain('гриша|ЕГЭ|11');
    expect(petrIds).toContain('гриша|ЕГЭ|11');
  });

  it('points выровнены по оси пробников, null где преподаватель не писал', () => {
    expect(anna.points.map((p) => p.avgSecondary)).toEqual([40, 55, 70]);
    expect(anna.points.map((p) => p.writers)).toEqual([3, 2, 1]);
    expect(petr.points.map((p) => p.avgSecondary)).toEqual([null, 55, 72.5]);
  });

  it('cohort: писавшие и первый, и последний пробник скоупа преподавателя', () => {
    expect(anna.cohort.count).toBe(1); // только Вася (Гриша ушёл к Петру)
    expect(anna.cohort.deltaSecondary).toBe(20); // 70 - 50
    expect(petr.cohort.count).toBe(1); // Оля: 55 → 65 (скоуп Петра начинается с B)
    expect(petr.cohort.deltaSecondary).toBe(10);
    expect(nobody.cohort.deltaSecondary).toBe(10); // Дима 20 → 30
  });
});

describe('buildProbnikDynamics', () => {
  const collected = collectSubjectAttempts(FIXTURE, SUBJ);

  it('весь предмет: средние и писавшие по каждому пробнику', () => {
    const { points } = buildProbnikDynamics(collected);
    expect(points.map((p) => p.writers)).toEqual([4, 4, 4]);
    expect(points.map((p) => p.avgSecondary)).toEqual([35, 47.5, 61.3]); // 245/4=61.25→61.3
  });

  it('cohort всего предмета: писавшие первый И последний, дельта — среднее по ученикам', () => {
    const { cohort } = buildProbnikDynamics(collected);
    expect(cohort.count).toBe(3); // Вася +20, Гриша +50, Дима +10
    expect(cohort.deltaSecondary).toBe(26.7);
    expect(cohort.firstLabel).toBe('21.09');
    expect(cohort.lastLabel).toBe('18.01');
  });

  it('фильтр по преподавателю сужает скоуп, точки без попыток = null', () => {
    const { points, cohort } = buildProbnikDynamics(collected, PETR);
    expect(points.map((p) => p.avgSecondary)).toEqual([null, 55, 72.5]);
    expect(points.map((p) => p.writers)).toEqual([0, 1, 2]);
    expect(cohort.count).toBe(1); // Оля
  });

  it('один пробник в скоупе → cohort null', () => {
    const one = {
      'x|ЕГЭ|11': student('x|ЕГЭ|11', 'Один Пробник', [attempt('Анна Иванова', 0, '21.09', 50)]),
    };
    const { cohort } = buildProbnikDynamics(collectSubjectAttempts(one, SUBJ));
    expect(cohort).toBeNull();
  });
});

describe('buildAttendance', () => {
  const att = buildAttendance(collectSubjectAttempts(FIXTURE, SUBJ));
  const anna = att.teachers.find((t) => t.teacherKey === ANNA);
  const petr = att.teachers.find((t) => t.teacherKey === PETR);

  it('знаменатель — годовой roster преподавателя', () => {
    expect(anna.roster).toBe(3);
    expect(anna.perProbnik.map((p) => p.wrote)).toEqual([3, 2, 1]);
    expect(anna.perProbnik.map((p) => p.pct)).toEqual([100, 67, 33]);
  });

  it('avgPct считается по активному окну (до первого писавшего пробела нет)', () => {
    // Пётр появился со второго пробника: окно B..C, «нулевой» A не штрафует.
    expect(petr.roster).toBe(2);
    expect(petr.perProbnik.map((p) => p.pct)).toEqual([0, 50, 100]);
    expect(petr.avgPct).toBe(75);
    expect(anna.avgPct).toBe(67); // (100+67+33)/3
  });

  it('строка «Все» по всем ученикам предмета', () => {
    expect(att.overall.roster).toBe(5);
    expect(att.overall.perProbnik.map((p) => p.wrote)).toEqual([4, 4, 4]);
    expect(att.overall.avgPct).toBe(80);
  });
});

describe('buildTaskSolvability', () => {
  const collected = collectSubjectAttempts(FIXTURE, SUBJ);

  it('pct = Σearned/Σpossible, fullPct и zeroPct — по попыткам', () => {
    const rows = buildTaskSolvability(collected, { subjectName: SUBJ, scoresData: SCORES_DATA });
    expect(rows).toHaveLength(19); // getTaskCount матпроф
    const t1 = rows[0];
    expect(t1.maxScore).toBe(1);
    expect(t1.attempts).toBe(12);
    expect(t1.pct).toBe(50); // 6 из 12
    expect(t1.fullPct).toBe(50);
    expect(t1.zeroPct).toBe(50);
    const t3 = rows[2];
    expect(t3.maxScore).toBe(2);
    expect(t3.pct).toBe(42); // 10 из 24
    expect(t3.fullPct).toBe(25); // Вася A, C; Гриша C → 3/12
    expect(t3.zeroPct).toBe(42); // Маша A, Гриша A, Оля B, Дима A, C → 5/12
  });

  it('короткий/пустой taskScores трактуется как нули (конвенция buildSubjectAnalytics)', () => {
    const rows = buildTaskSolvability(collected, { subjectName: SUBJ, scoresData: SCORES_DATA });
    const t19 = rows[18];
    expect(t19.pct).toBe(0);
    expect(t19.zeroPct).toBe(100);
  });

  it('perProbnikPct выровнен по оси пробников', () => {
    const rows = buildTaskSolvability(collected, { subjectName: SUBJ, scoresData: SCORES_DATA });
    // task1 по пробникам: A 1/4 (Вася, Маша, Гриша, Дима), B 3/4, C 2/4
    expect(rows[0].perProbnikPct).toEqual([25, 75, 50]);
  });

  it('фильтр по преподавателю', () => {
    const rows = buildTaskSolvability(collected, { subjectName: SUBJ, scoresData: SCORES_DATA, teacherKey: ANNA });
    expect(rows[0].attempts).toBe(6);
    expect(rows[0].pct).toBe(67); // Вася 3 + Маша 1 + Гриша 0 из 6
  });

  it('РЯ ЕГЭ: лейблы «Сочинение»/К1..К10 и максимумы из scoresData', () => {
    const ryaScores = { 'ЕГЭ|Русский язык': [...Array(26).fill(1), 22, 3, 3, 2, 3, 2, 3, 2, 3, 2] };
    const rya = {
      'катя|ЕГЭ|11': student('катя|ЕГЭ|11', 'Соч Катя', [
        { name: 'русский язык ЕГЭ', examType: 'ЕГЭ', teacher: 'Анна Иванова', primaryScore: 30, secondaryScore: 60, taskScores: [...Array(26).fill(1), 11, 3, 3, 2, 3, 0, 0, 0, 0, 0], date: '28.09', sheetName: 'РЯ ЕГЭ 28.09', sheetIndex: 2 },
      ], 'русский язык ЕГЭ'),
    };
    const rows = buildTaskSolvability(collectSubjectAttempts(rya, 'русский язык ЕГЭ'), { subjectName: 'русский язык ЕГЭ', scoresData: ryaScores });
    expect(rows).toHaveLength(37);
    expect(rows[26].label).toBe('Сочинение');
    expect(rows[26].maxScore).toBe(22);
    expect(rows[26].pct).toBe(50); // 11 из 22
    expect(rows[27].label).toBe('К1');
    expect(rows[36].label).toBe('К10');
  });
});

describe('финальный ЕГЭ в collectSubjectAttempts', () => {
  const collected = collectSubjectAttempts(FIXTURE, SUBJ);

  it('finals собираются отдельно от attempts и не попадают в ось пробников', () => {
    expect(collected.finals).toHaveLength(4); // Вася, Гриша, Оля, Соня
    expect(collected.attempts).toHaveLength(12); // финал не добавил попыток
    expect(collected.probniks.map((p) => p.sheetIndex)).toEqual([0, 5, 9]); // ось не выросла
  });

  it('преподаватель финала нормализуется', () => {
    const olya = collected.finals.find((f) => f.studentId === 'оля|ЕГЭ|11');
    expect(olya.teacherKey).toBe(PETR); // в листе было «Петр» без ё
  });
});

describe('buildTeacherComparison: средний финальный ЕГЭ', () => {
  const rows = buildTeacherComparison(collectSubjectAttempts(FIXTURE, SUBJ));
  const anna = rows.find((r) => r.teacherKey === ANNA);
  const petr = rows.find((r) => r.teacherKey === PETR);
  const nobody = rows.find((r) => r.teacherKey === NOBODY);

  it('avgFinal по ученикам преподавателя из финального листа', () => {
    expect(anna.finalCount).toBe(2); // Вася 72 + Соня 50
    expect(anna.avgFinalSecondary).toBe(61);
    expect(petr.finalCount).toBe(2); // Гриша 85 + Оля 60
    expect(petr.avgFinalSecondary).toBe(72.5);
    expect(nobody.finalCount).toBe(0);
    expect(nobody.avgFinalSecondary).toBeNull();
  });
});

describe('buildStudentMatrix', () => {
  const collected = collectSubjectAttempts(FIXTURE, SUBJ);

  it('строка на ученика: все его пробники по оси + финал + дельта', () => {
    const rows = buildStudentMatrix(collected);
    expect(rows).toHaveLength(6); // 5 писавших + Соня (только финал)
    const vasya = rows.find((r) => r.studentId === 'вася|ЕГЭ|11');
    expect(vasya.perProbnik.map((p) => p?.secondaryScore ?? null)).toEqual([50, 60, 70]);
    expect(vasya.avgSecondary).toBe(60);
    expect(vasya.final.secondaryScore).toBe(72);
    expect(vasya.deltaSecondary).toBe(12); // 72 − 60 (средний по пробникам)
    const grisha = rows.find((r) => r.studentId === 'гриша|ЕГЭ|11');
    expect(grisha.perProbnik.map((p) => p?.secondaryScore ?? null)).toEqual([30, null, 80]);
    expect(grisha.deltaSecondary).toBe(30); // 85 − 55
    expect(grisha.teachers).toContain('Анна Иванова');
    expect(grisha.teachers).toContain('Пётр Сидоров');
  });

  it('без финала — final и дельта null; финал без пробников — пустая строка с ЕГЭ', () => {
    const rows = buildStudentMatrix(collected);
    const dima = rows.find((r) => r.studentId === 'дима|ЕГЭ|11');
    expect(dima.final).toBeNull();
    expect(dima.deltaSecondary).toBeNull();
    const sonya = rows.find((r) => r.studentId === 'соня|ЕГЭ|11');
    expect(sonya.perProbnik.every((p) => p === null)).toBe(true);
    expect(sonya.avgSecondary).toBeNull();
    expect(sonya.final.secondaryScore).toBe(50);
    expect(sonya.deltaSecondary).toBeNull();
  });

  it('фильтр преподавателя отбирает строки, но показывает все попытки ученика', () => {
    const rows = buildStudentMatrix(collected, ANNA);
    expect(rows.map((r) => r.studentId).sort()).toEqual(
      ['вася|ЕГЭ|11', 'гриша|ЕГЭ|11', 'маша|ЕГЭ|11', 'соня|ЕГЭ|11'].sort()
    ); // Соня — по финалу у Анны; Оля и Дима не у Анны
    const grisha = rows.find((r) => r.studentId === 'гриша|ЕГЭ|11');
    expect(grisha.perProbnik.map((p) => p?.secondaryScore ?? null)).toEqual([30, null, 80]); // включая попытку у Петра
  });

  it('сортировка по имени, ru', () => {
    const rows = buildStudentMatrix(collected);
    expect(rows[0].studentName).toBe('Иванова Оля');
    expect(rows[rows.length - 1].studentName).toBe('Финалова Соня');
  });
});

describe('buildTaskTeacherMatrix', () => {
  it('ячейки задание × преподаватель, пустые = null', () => {
    const { teachers, rows } = buildTaskTeacherMatrix(collectSubjectAttempts(FIXTURE, SUBJ), { subjectName: SUBJ, scoresData: SCORES_DATA });
    expect(teachers.map((t) => t.key)).toEqual([ANNA, NOBODY, PETR]);
    const t1 = rows[0];
    expect(t1.byTeacher[ANNA].pct).toBe(67); // 4 из 6
    expect(t1.byTeacher[PETR].pct).toBe(67); // 2 из 3
    expect(t1.byTeacher[NOBODY].pct).toBe(0);
  });
});

describe('probnikSubjectToJournal: мэппинг предмета пробника на журнальный', () => {
  it('уровень и предмет', () => {
    expect(probnikSubjectToJournal('математика ЕГЭ-ПРОФ')).toEqual({ subject: 'математика', level: 'ЕГЭ' });
    expect(probnikSubjectToJournal('математика ЕГЭ (база)')).toEqual({ subject: 'математика', level: 'ЕГЭ' });
    expect(probnikSubjectToJournal('русский язык ОГЭ')).toEqual({ subject: 'русский язык', level: 'ОГЭ' });
    expect(probnikSubjectToJournal('история ЕГЭ')).toEqual({ subject: 'история', level: 'ЕГЭ' });
  });
});

describe('buildStudentGroupMap: сшивка ученик → группы журнала', () => {
  const dir = [
    { name: 'Пупкин Вася', subject: 'математика', level: 'ЕГЭ', group: 'мат11ВТПТ1600Л' },
    { name: 'Пупкин Вася', subject: 'русский язык', level: 'ЕГЭ', group: 'ря11СБ' },
    { name: 'Кузнецова Маша', subject: 'математика', level: 'ЕГЭ', group: 'мат11СБ1200Л' },
    { name: 'Смирнов Гриша', subject: 'математика', level: 'ОГЭ', group: 'мат9ПН1600Л' },
    { name: 'ОрлОв  ДИМА', subject: 'математика', level: 'ЕГЭ', group: 'мат11ВТПТ1600Л' },
  ];
  const map = buildStudentGroupMap(dir, 'математика ЕГЭ-ПРОФ');

  it('берёт только свой предмет и уровень, имя нормализуется', () => {
    expect(map.get('пупкин вася')).toEqual(['мат11ВТПТ1600Л']); // без РЯ-группы
    expect(map.get('орлов дима')).toEqual(['мат11ВТПТ1600Л']); // регистр и пробелы
    expect(map.get('смирнов гриша')).toBeUndefined(); // ОГЭ ≠ ЕГЭ
  });
});

describe('filterCollected: срез по множеству учеников (фильтр группы)', () => {
  const collected = collectSubjectAttempts(FIXTURE, SUBJ);
  const view = filterCollected(collected, new Set(['пупкин вася', 'кузнецова маша']));

  it('фильтрует attempts и finals, ось пробников не трогает', () => {
    expect(view.attempts).toHaveLength(5); // Вася 3 + Маша 2
    expect(view.finals).toHaveLength(1); // финал Васи
    expect(view.probniks).toHaveLength(3);
  });

  it('пересчитывает преподавателей: пустые выпадают', () => {
    expect(view.teachers.map((t) => t.key)).toEqual([ANNA]);
    const anna = view.teachers[0];
    expect(anna.students).toBe(2);
    expect(anna.attempts).toBe(5);
  });

  it('записи несут searchName для сшивки с журналом', () => {
    expect(collected.attempts.every((a) => typeof a.searchName === 'string' && a.searchName)).toBe(true);
    const rows = buildStudentMatrix(collected);
    expect(rows.find((r) => r.studentId === 'вася|ЕГЭ|11').searchName).toBe('пупкин вася');
  });
});

describe('isFinalExamSheet: маркер финала — отдельное слово ЭКЗ', () => {
  it('распознаёт листы «<предмет> ЭКЗ»', () => {
    expect(isFinalExamSheet('ИНФ ЕГЭ ЭКЗ')).toBe(true);
    expect(isFinalExamSheet('Мат ПРОФ ЭКЗ')).toBe(true);
    expect(isFinalExamSheet('инф егэ экз')).toBe(true);
  });
  it('пробники и листы без пометки — не финал', () => {
    expect(isFinalExamSheet('ИНФ ЕГЭ 17.05')).toBe(false);
    expect(isFinalExamSheet('ИНФ ЕГЭ')).toBe(false); // просто без даты — уже не финал
    expect(isFinalExamSheet('ЭКЗАМЕН ИНФ')).toBe(false); // ЭКЗ только как отдельное слово
  });
});

describe('getMaxScoreForTask: математика ЕГЭ (база)', () => {
  it('читает ключ «ЕГЭ|Математика база», а не промахивается на «ЕГЭ|Математика»', () => {
    const scoresData = { 'ЕГЭ|Математика база': [5, ...Array(20).fill(1)] };
    expect(getMaxScoreForTask('математика ЕГЭ (база)', 1, scoresData)).toBe(5);
  });
});
