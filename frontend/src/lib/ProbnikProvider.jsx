import { createContext, useContext, useState, useEffect } from 'react';
import {
  loadExamTemplates,
  loadScoresData,
  loadTaskThemes,
  loadSheetsData,
  resolveGrade,
  buildGradeByName,
} from './probnikData.js';
import { getRatings } from './marathonApi.js';
import {
  normalizePersonName,
  normalizeStudentSearchName,
  getStudentSearchNames,
} from './normalizeName.js';

const ProbnikContext = createContext(null);

function buildMarathonOnlyStudents(rows, existingStudents) {
  const additions = {};
  for (const row of rows) {
    if (!row.name || !row.level || !row.subject) continue;
    const searchName = normalizePersonName(row.name);
    const grade = resolveGrade(row.grade, row.level);
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
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Сначала тянем marathon-рейтинги: они источник истины по классу (gradeByName).
    // Падение/пустой ответ не блокирует probnik — класс довычислится из examType.
    Promise.all([
      loadExamTemplates(),
      loadScoresData(),
      loadTaskThemes(),
      getRatings({ isPublic: true }).then((res) => res?.rows || []).catch(() => []),
    ])
      .then(([examTemplates, scoresData, taskThemes, ratingRows]) => {
        const gradeByName = buildGradeByName(ratingRows);
        return loadSheetsData(gradeByName).then(({ students, catalog }) => {
          const additions = buildMarathonOnlyStudents(ratingRows, students);
          return {
            examTemplates,
            scoresData,
            taskThemes,
            allStudents: { ...students, ...additions },
            probnikCatalog: catalog,
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
