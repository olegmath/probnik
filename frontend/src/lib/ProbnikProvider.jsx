import { createContext, useContext, useState, useEffect } from 'react';
import {
  loadExamTemplates,
  loadScoresData,
  loadTaskThemes,
  loadSheetsData,
} from './probnikData.js';

const ProbnikContext = createContext(null);

export function ProbnikProvider({ children }) {
  const [data, setData] = useState({
    allStudents: {},
    examTemplates: {},
    scoresData: {},
    taskThemes: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([loadExamTemplates(), loadScoresData(), loadTaskThemes()])
      .then(([examTemplates, scoresData, taskThemes]) =>
        loadSheetsData().then((allStudents) => ({
          examTemplates,
          scoresData,
          taskThemes,
          allStudents,
        }))
      )
      .then(setData)
      .finally(() => setLoading(false));
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
