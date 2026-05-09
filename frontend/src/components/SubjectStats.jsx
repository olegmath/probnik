import {
  buildSubjectAnalytics,
  getMaxScore,
  getTaskDisplayLabel,
  pluralizeAttempts,
  pluralizeErrors,
  pluralizePoints,
} from '../lib/probnikData.js';
import { useProbnik } from '../lib/ProbnikProvider.jsx';

export default function SubjectStats({ subject }) {
  const { scoresData, taskThemes } = useProbnik();
  const analytics = buildSubjectAnalytics(subject, { scoresData, taskThemes });
  const isOGE = subject.examType === 'ОГЭ';
  const maxSecondary = isOGE ? 5 : 100;
  const trendColor = analytics.trend > 0 ? '#34b87a' : analytics.trend < 0 ? '#e05454' : 'var(--gray)';
  const trendText = analytics.trend > 0 ? `+${analytics.trend}` : `${analytics.trend}`;
  const firstSecondary = Number(analytics.firstAttempt?.secondaryScore) || 0;
  const lastSecondary = Number(analytics.lastAttempt?.secondaryScore) || 0;
  const bestSecondary = Number(analytics.bestAttempt?.secondaryScore) || 0;
  const trendDetail = analytics.firstAttempt && analytics.lastAttempt
    ? `${firstSecondary} → ${lastSecondary}; лучший ${bestSecondary}`
    : 'между пробниками';

  const renderMetric = (label, value, detail, color = 'var(--blue)') => (
    <div style={{ border: '2px solid var(--border)', borderRadius: 12, padding: 14, minWidth: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ fontSize: 34, fontWeight: 950, lineHeight: 1, color, fontStyle: 'italic', marginTop: 6 }}>{value}</div>
      {detail && <div style={{ fontSize: 12, fontWeight: 750, color: 'var(--gray)', marginTop: 6 }}>{detail}</div>}
    </div>
  );

  const renderTaskPracticeRow = (task, mode = 'error') => {
    const color = mode === 'try' ? 'var(--blue2)' : mode === 'good' ? '#34b87a' : task.percent >= 50 ? '#f5a623' : '#e05454';
    const resultText = mode === 'try' ? 'стоит попробовать' : `${task.earned}/${task.possible}`;
    const noteText = mode === 'try'
      ? 'пока 0 баллов во всех работах'
      : `${task.failCount} ${pluralizeErrors(task.failCount)} из ${task.attempts}`;

    return (
      <div key={`${mode}-${task.taskNum}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(128px, auto)', gap: 18, alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 900 }}>{getTaskDisplayLabel(subject.name, subject.examType, task.taskNum)}</div>
          <div title={task.theme} style={{ fontSize: 11, fontWeight: 650, color: 'var(--gray)', lineHeight: 1.2, overflowWrap: 'anywhere', marginTop: 2 }}>{task.theme}</div>
          <div style={{ height: 5, background: '#f0f0f0', borderRadius: 5, overflow: 'hidden', marginTop: 7 }}>
            <div style={{ height: '100%', width: `${task.percent}%`, background: color, borderRadius: 5 }} />
          </div>
        </div>
        <div style={{ textAlign: 'right', minWidth: 128 }}>
          <div style={{ fontSize: mode === 'try' ? 11 : 13, fontWeight: 950, color, lineHeight: 1.12, whiteSpace: 'normal' }}>{resultText}</div>
          <div style={{ fontSize: 10, fontWeight: 850, color: 'var(--gray)', marginTop: 3, lineHeight: 1.12, whiteSpace: 'normal' }}>{noteText}</div>
        </div>
      </div>
    );
  };

  const renderTaskGroup = (title, tasks, mode, emptyText, color = 'var(--black)') => (
    <div style={{ marginTop: 14, paddingTop: 12, borderTop: '2px solid #f0f0f0' }}>
      <div style={{ fontSize: 12, fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, color }}>{title}</div>
      {tasks.length > 0
        ? tasks.map((task) => renderTaskPracticeRow(task, mode))
        : <div style={{ fontSize: 13, fontWeight: 750, color: 'var(--gray)', padding: '10px 0' }}>{emptyText}</div>}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0, overflow: 'auto', padding: '0 18px 18px 0', scrollbarGutter: 'stable' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, flexShrink: 0 }}>
        {renderMetric('Средний итоговый', `${analytics.avgSecondary}/${maxSecondary}`, `${analytics.attempts.length} ${pluralizeAttempts(analytics.attempts.length)}`)}
        {renderMetric('Средний первичный', `${analytics.avgPrimary}/${getMaxScore(subject.name)}`, 'по всем работам')}
        {renderMetric('Лучший результат', analytics.bestAttempt ? `${analytics.bestAttempt.secondaryScore}/${maxSecondary}` : '0', analytics.bestAttempt?.date ? `пробник ${analytics.bestAttempt.date}` : 'лучший пробник', '#34b87a')}
        {renderMetric('Первый → последний', trendText, trendDetail, trendColor)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 0.85fr)', gap: 12, minHeight: 0, alignItems: 'start', flexShrink: 0 }}>
        <div style={{ border: '2px solid var(--border)', borderRadius: 12, padding: 14, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Статистика по заданиям</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--gray)' }}>по всем пробникам</div>
          </div>
          {renderTaskGroup('Хорошо получается', analytics.goodTasks, 'good', 'Пока нет заданий с 0–1 ошибкой', '#34b87a')}
          {renderTaskGroup('Частые ошибки', analytics.frequentErrors, 'error', 'Нет заданий с 3+ ошибками', '#e05454')}
          {renderTaskGroup('Стоит попробовать', analytics.tryTasks, 'try', 'Нет заданий, где всегда 0 баллов', 'var(--blue2)')}
        </div>

        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ border: '2px solid var(--black)', borderRadius: 12, padding: 14, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>На что обратить внимание</div>
            {analytics.recommendations.map((text, index) => (
              <div key={`rec-${index}-${text.slice(0, 20)}`} style={{ display: 'grid', gridTemplateColumns: '22px minmax(0, 1fr)', gap: 8, alignItems: 'start' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: index === 0 ? 'var(--blue)' : '#f5f5f5', color: index === 0 ? 'var(--white)' : 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 950 }}>{index + 1}</div>
                <div style={{ fontSize: 13, fontWeight: 750, lineHeight: 1.28, overflowWrap: 'anywhere' }}>{text}</div>
              </div>
            ))}
          </div>

          <div style={{ border: '2px solid var(--border)', borderRadius: 12, padding: 14, flexShrink: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Темы для практики</div>
            <div style={{ fontSize: 11, fontWeight: 750, color: 'var(--gray)', marginBottom: 12 }}>Темы, где чаще всего теряются баллы или пока нет набранных баллов.</div>
            {analytics.weakThemes.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                {analytics.weakThemes.map((theme) => {
                  const color = theme.percent >= 80 ? '#34b87a' : theme.percent >= 50 ? '#f5a623' : '#e05454';
                  return (
                    <div key={theme.name} style={{ background: '#fafafa', borderRadius: 10, padding: 10, minWidth: 0, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 10, alignItems: 'center' }}>
                      <div style={{ minWidth: 0 }}>
                        <div title={theme.name} style={{ fontSize: 11, fontWeight: 850, lineHeight: 1.14, overflowWrap: 'anywhere' }}>{theme.name}</div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray)', lineHeight: 1.2, marginTop: 4 }}>
                          {theme.earned === 0 ? 'нет набранных баллов' : `набрано ${theme.earned} из ${theme.possible}`}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray)', lineHeight: 1.2, marginTop: 2 }}>
                          задания: {theme.tasks.slice(0, 4).map((n) => getTaskDisplayLabel(subject.name, subject.examType, n)).join(', ')}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 20, fontWeight: 950, color, lineHeight: 1.05 }}>{theme.percent}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: 13, fontWeight: 750, color: 'var(--gray)' }}>Тем для отдельной практики по накопленной статистике нет</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
