import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useProbnik } from '../lib/ProbnikProvider.jsx';
import {
  getPartDivisionPoint,
  getMaxScoreForTask,
  getThemeForTask,
  getTaskDisplayLabel,
  pluralizePoints,
} from '../lib/probnikData.js';
import Chip from '../components/ui/Chip.jsx';
import ThemeAnalysis from '../components/ThemeAnalysis.jsx';
import SubjectStats from '../components/SubjectStats.jsx';
import { safeDecode } from '../lib/safeDecode';

export default function ProbnikDetail() {
  const { id, subject: subjectParam } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { allStudents, scoresData, taskThemes } = useProbnik();

  const student = state?.student || allStudents[safeDecode(id)];
  const subjectName = safeDecode(subjectParam || '');
  const subjectFromState = state?.subject;
  const subject = subjectFromState || student?.subjects?.find((s) => s.name === subjectName);

  const [activeAttemptIndex, setActiveAttemptIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('attempts');

  useEffect(() => {
    setActiveAttemptIndex(0);
    setActiveTab('attempts');
  }, [subjectName]);

  if (!student || !subject) {
    return <div style={{ padding: 40 }}>Предмет не найден</div>;
  }

  const attempts = subject.attempts && subject.attempts.length > 0 ? subject.attempts : [subject];
  const activeAttempt = attempts[Math.min(activeAttemptIndex, attempts.length - 1)] || subject;
  const cur = { ...subject, ...activeAttempt, name: subject.name };
  const p = cur.secondaryScore || 0;
  const scoreColor = p >= 70 ? '#34b87a' : p >= 50 ? '#f5a623' : '#e05454';
  const totalTasks = cur.taskScores ? cur.taskScores.length : 0;
  const divisionPoint = getPartDivisionPoint(cur.examType, cur.name);
  const hasPartSplit = divisionPoint > 0;
  const partOneEnd = hasPartSplit ? divisionPoint : totalTasks;

  const renderTaskRows = (startIdx, endIdx) =>
    cur.taskScores
      ? cur.taskScores.map((score, i) => {
          if (i < startIdx || i >= endIdx) return null;
          const scoreNum = parseInt(score) || 0;
          const maxScore = getMaxScoreForTask(cur.name, i + 1, scoresData);
          const color = scoreNum === 0 ? '#e05454' : '#34b87a';
          const taskLabel = getTaskDisplayLabel(cur.name, cur.examType, i + 1);
          const taskTheme = getThemeForTask(cur.name, i + 1, taskThemes);

          return (
            <div key={`task-${i + startIdx}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'start', gap: 8, borderBottom: '1px solid var(--border)', padding: '3px 0', breakInside: 'avoid' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 800, lineHeight: 1.05, marginBottom: taskTheme ? 1 : 0 }}>{taskLabel}</div>
                {taskTheme && <div title={taskTheme} style={{ fontSize: 10, color: 'var(--gray)', lineHeight: 1.12, overflowWrap: 'anywhere' }}>{taskTheme}</div>}
              </div>
              <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 800, color, whiteSpace: 'nowrap' }}>{scoreNum}/{maxScore}</div>
            </div>
          );
        })
      : [];

  const renderPart = (title, startIdx, endIdx, flowColumns = false) => {
    const rowsCount = Math.max(0, endIdx - startIdx);
    const useFlowColumns = flowColumns && rowsCount > 17;
    return (
      <div style={{ minWidth: 0, border: '2px solid var(--border)', borderRadius: 12, padding: 12, overflow: 'hidden', minHeight: 0, height: flowColumns ? '100%' : 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--black)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>{title}</div>
        <div style={{ flex: 1, minHeight: 0, columnCount: useFlowColumns ? 2 : 1, columnGap: 14, columnFill: 'auto', overflow: 'hidden' }}>
          {renderTaskRows(startIdx, endIdx)}
        </div>
      </div>
    );
  };

  return (
    <div className="detail-page" style={{ height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <main className="detail-main" style={{ flex: 1, maxWidth: 1500, margin: '0 auto', width: '90%', padding: '18px 0 16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>

        <div className="fade-up detail-summary" style={{ marginBottom: 14, flexShrink: 0 }}>
          <div style={{ marginBottom: 10 }}>
            <button
              onClick={() => navigate(-1)}
              style={{ borderRadius: 100, border: '2px solid var(--black)', background: 'var(--white)', color: 'var(--black)', cursor: 'pointer', padding: '6px 14px', fontFamily: 'Inter', fontSize: 12, fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', transition: 'background 0.15s, color 0.15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--black)'; e.currentTarget.style.color = 'var(--white)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--white)'; e.currentTarget.style.color = 'var(--black)'; }}
            >
              <span style={{ fontSize: 14, lineHeight: 1 }}>‹</span>Назад
            </button>
          </div>
          <div className="detail-summary-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                <Chip>{cur.examType}</Chip>
                {cur.date && <Chip filled={false}>Пробник {cur.date}</Chip>}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Предмет</div>
              <h1 className="detail-title" style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 0.95 }}>
                <span style={{ fontStyle: 'italic', color: 'var(--blue)' }}>{cur.name}</span>
              </h1>
            </div>
            <div className="detail-score-row" style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
              <div style={{ border: '2px solid var(--black)', borderRadius: 12, padding: '10px 18px', textAlign: 'center', minWidth: 118 }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray)', marginBottom: 2 }}>Первичный</div>
                <div style={{ fontSize: 42, fontWeight: 900, color: 'var(--blue)', lineHeight: 0.95, fontStyle: 'italic' }}>{cur.primaryScore}</div>
                <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 1 }}>{pluralizePoints(cur.primaryScore)}</div>
              </div>
              <div style={{ border: `2px solid ${scoreColor}`, borderRadius: 12, padding: '10px 18px', textAlign: 'center', minWidth: 118 }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray)', marginBottom: 2 }}>Итоговый</div>
                <div style={{ fontSize: 42, fontWeight: 900, color: scoreColor, lineHeight: 0.95, fontStyle: 'italic' }}>{p}</div>
                <div style={{ fontSize: 11, color: scoreColor, marginTop: 1, fontWeight: 700 }}>{pluralizePoints(p)}</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ height: 2, background: 'var(--black)', marginBottom: 12, borderRadius: 2, flexShrink: 0 }} />

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, flexShrink: 0 }}>
          {[{ id: 'attempts', label: 'Пробники' }, { id: 'stats', label: 'Статистика' }].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{ border: active ? '2px solid var(--black)' : '2px solid var(--border)', background: active ? 'var(--black)' : 'var(--white)', color: active ? 'var(--white)' : 'var(--black)', borderRadius: 100, padding: '8px 16px', cursor: 'pointer', fontFamily: 'Inter', fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap', transition: 'background 0.15s, color 0.15s, border-color 0.15s' }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'attempts' && attempts.length > 1 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, flexShrink: 0 }}>
            {attempts.map((attempt, index) => (
              <button
                key={`${attempt.date || attempt.sheetName || index}-${index}`}
                onClick={() => setActiveAttemptIndex(index)}
                style={{ border: index === activeAttemptIndex ? '2px solid var(--black)' : '2px solid var(--border)', background: index === activeAttemptIndex ? 'var(--black)' : 'var(--white)', color: index === activeAttemptIndex ? 'var(--white)' : 'var(--black)', borderRadius: 100, padding: '7px 14px', cursor: 'pointer', fontFamily: 'Inter', fontSize: 12, fontWeight: 850, whiteSpace: 'nowrap', transition: 'background 0.15s, color 0.15s, border-color 0.15s' }}
              >
                Пробник {attempt.date || index + 1}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'attempts' ? (
          <div
            className="results-layout"
            style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12, width: '100%', flex: 1, minHeight: 0, overflow: 'hidden' }}
          >
            {hasPartSplit
              ? renderPart('Часть 1', 0, partOneEnd, true)
              : renderPart('Задания', 0, totalTasks, true)}

            {hasPartSplit ? (
              <div className="part-stack" style={{ minWidth: 0, minHeight: 0, display: 'grid', gridTemplateRows: 'auto minmax(0, 1fr)', gap: 12 }}>
                {renderPart('Часть 2', partOneEnd, totalTasks)}
                <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <ThemeAnalysis subject={cur} />
                </div>
              </div>
            ) : (
              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <ThemeAnalysis subject={cur} />
              </div>
            )}
          </div>
        ) : (
          <SubjectStats subject={subject} />
        )}
      </main>
    </div>
  );
}
