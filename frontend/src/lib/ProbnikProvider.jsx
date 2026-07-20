import { createContext, useContext, useState, useEffect } from 'react';
import {
  loadExamTemplates,
  loadScoresData,
  loadTaskThemes,
  loadSheetsData,
  resolveGrade,
  buildGradeByName,
} from './probnikData.js';
import { getRatings, getStudents } from './marathonApi.js';
import {
  normalizePersonName,
  normalizeStudentSearchName,
  getStudentSearchNames,
} from './normalizeName.js';

const ProbnikContext = createContext(null);

function buildMarathonOnlyStudents(rows, existingStudents, gradeByName = {}) {
  const additions = {};
  for (const row of rows) {
    if (!row.name || !row.level || !row.subject) continue;
    const searchName = normalizePersonName(row.name);
    // Класс резолвим тем же источником истины, что и probnik-запись (gradeByName):
    // явный grade строки > карта по имени > examType-fallback. Иначе строки с пустым
    // grade (ТПП-рейтинги) дали бы fallback "11" и создали фантом |ЕГЭ|11 рядом с
    // настоящей записью десятиклассника |ЕГЭ|10.
    const grade = resolveGrade(row.grade || gradeByName[searchName], row.level);
    // Ключ включает класс — так тёзки 10/11 (оба ЕГЭ) не склеиваются,
    // а 10-классник с пробником совпадёт со своей probnik-записью (она тоже grade-keyed).
    const key = `${searchName}|${row.level}|${grade}`;
    if (key in existingStudents) continue;
    if (!additions[key]) {
      additions[key] = {
        name: row.name,
        searchName,
        searchKey: normalizeStudentSearchName(row.name),
        searchKeys: getStudentSearchNames(row.name),
        examType: row.level,
        grade,
        subjects: [],
        id: key,
        _marathonOnly: true,
      };
    }
    const subj = additions[key].subjects;
    if (!subj.some((s) => s.name === row.subject)) {
      subj.push({ name: row.subject, examType: row.level, attempts: [] });
    }
  }
  return additions;
}

export function ProbnikProvider({ children }) {
  const [data, setData] = useState({
    allStudents: {},
    examTemplates: {},
    scoresData: {},
    taskThemes: {},
    probnikCatalog: {},
    journalDirectory: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Тянем marathon-рейтинги + публичный справочник журнала: вместе они источник
    // истины по классу (gradeByName). Справочник добавляет 10 класс, которого нет в рейтингах.
    // Падение/пустой ответ не блокирует probnik — класс довычислится из examType.
    Promise.all([
      loadExamTemplates(),
      loadScoresData(),
      loadTaskThemes(),
      getRatings({ isPublic: true }).then((res) => res?.rows || []).catch(() => []),
      getStudents().then((res) => res?.students || []).catch(() => []),
    ])
      .then(([examTemplates, scoresData, taskThemes, ratingRows, directoryRows]) => {
        const allRows = [...ratingRows, ...directoryRows];
        const gradeByName = buildGradeByName(allRows);
        // Участники марафона — только те, кто есть в рейтингах (/api/ratings).
        // Справочник журнала (/api/students) сюда НЕ входит: в нём 10 класс есть
        // всегда, но марафон пишут не все.
        // Класс резолвим через gradeByName (журнал — источник истины), а не из самой
        // строки: у ТПП-групп grade пустой и fallback дал бы "11", тогда как десятиклассник
        // в ТПП реально grade "10" (из журнала). Ключ совпадает с id-составляющими ученика.
        const marathonKeys = new Set(
          ratingRows
            .filter((r) => r.name)
            .map((r) => {
              const searchName = normalizePersonName(r.name);
              return `${searchName}|${resolveGrade(r.grade || gradeByName[searchName], r.level)}`;
            })
        );
        return loadSheetsData(gradeByName).then(({ students, catalog }) => {
          const additions = buildMarathonOnlyStudents(allRows, students, gradeByName);
          const stamp = (s) => ({ ...s, hasMarathon: marathonKeys.has(`${s.searchName}|${s.grade}`) });
          const allStudents = Object.fromEntries(
            Object.entries({ ...students, ...additions }).map(([k, v]) => [k, stamp(v)])
          );
          return {
            examTemplates,
            scoresData,
            taskThemes,
            allStudents,
            probnikCatalog: catalog,
            // Сырые строки /api/students: сшивка ученик → группа в админ-вкладке «Пробники».
            journalDirectory: directoryRows,
          };
        });
      })
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <ProbnikContext.Provider value={{ ...data, loading }}>
      {children}
    </ProbnikContext.Provider>
  );
}

export function useProbnik() {
  return useContext(ProbnikContext);
}
