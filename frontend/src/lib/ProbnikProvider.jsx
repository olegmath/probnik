import { createContext, useContext, useState, useEffect } from 'react';
import {
  loadExamTemplates,
  loadScoresData,
  loadTaskThemes,
  loadSheetsData,
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
    const key = `${searchName}|${row.level}`;
    if (key in existingStudents) continue;
    if (!additions[key]) {
      additions[key] = {
        name: row.name,
        searchName,
        searchKey: normalizeStudentSearchName(row.name),
        searchKeys: getStudentSearchNames(row.name),
        examType: row.level,
        grade: row.level === 'ЕГЭ' ? '11' : '9',
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
    Promise.all([loadExamTemplates(), loadScoresData(), loadTaskThemes()])
      .then(([examTemplates, scoresData, taskThemes]) =>
        loadSheetsData().then(({ students, catalog }) => ({
          examTemplates,
          scoresData,
          taskThemes,
          allStudents: students,
          probnikCatalog: catalog,
        }))
      )
      .then((data) => {
        setData(data);
        setLoading(false);

        getRatings({ isPublic: true })
          .then((res) => {
            const rows = res?.rows || [];
            if (!rows.length) return;
            const additions = buildMarathonOnlyStudents(rows, data.allStudents);
            if (!Object.keys(additions).length) return;
            setData((prev) => ({
              ...prev,
              allStudents: { ...prev.allStudents, ...additions },
            }));
          })
          .catch(() => {});
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
