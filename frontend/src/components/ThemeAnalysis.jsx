import { useState } from 'react';
import { getMaxScoreForTask } from '../lib/probnikData.js';
import { useProbnik } from '../lib/ProbnikProvider.jsx';

export default function ThemeAnalysis({ subject }) {
  const { scoresData, taskThemes } = useProbnik();
  const [activeZone, setActiveZone] = useState(null);
  const themeStats = {};

  if (subject.taskScores && taskThemes[subject.name]) {
    const themes = taskThemes[subject.name];
    subject.taskScores.forEach((score, i) => {
      const theme = themes[i + 1];
      if (!theme) return;
      const mainTheme = theme.split('.')[0].trim();
      if (!themeStats[mainTheme]) themeStats[mainTheme] = { earned: 0, possible: 0, total: 0 };
      const scoreNum = parseInt(score) || 0;
      const maxScore = getMaxScoreForTask(subject.name, i + 1, scoresData);
      themeStats[mainTheme].earned += scoreNum;
      themeStats[mainTheme].possible += maxScore;
      themeStats[mainTheme].total++;
    });
  }

  const sortedThemes = Object.entries(themeStats)
    .map(([name, stats]) => ({
      name, ...stats,
      lost: Math.max(0, stats.possible - stats.earned),
      percent: stats.possible > 0 ? Math.round((stats.earned / stats.possible) * 100) : 0,
    }))
    .sort((a, b) => a.percent - b.percent || b.lost - a.lost);

  if (sortedThemes.length === 0) return null;

  const weakThemes = sortedThemes.filter((t) => t.percent < 50);
  const watchThemes = sortedThemes.filter((t) => t.percent >= 50 && t.percent < 80);
  const strongThemes = sortedThemes.filter((t) => t.percent >= 80).sort((a, b) => b.percent - a.percent || b.earned - a.earned);
  const focusThemes = sortedThemes.filter((t) => t.lost > 0).sort((a, b) => a.percent - b.percent || b.lost - a.lost).slice(0, 2);
  const totalPossible = sortedThemes.reduce((s, t) => s + t.possible, 0);
  const totalLost = sortedThemes.reduce((s, t) => s + t.lost, 0);
  const focusText = focusThemes.length > 0 ? focusThemes.map((t) => t.name).join(' и ') : 'Ошибок по темам почти нет';

  const zones = {
    weak: { title: 'Подтянуть', themes: weakThemes, color: '#e05454', note: 'самые срочные' },
    watch: { title: 'На контроле', themes: watchThemes, color: '#f5a623', note: 'нужна практика' },
    strong: { title: 'Сильные', themes: strongThemes, color: '#34b87a', note: 'уже уверенно' },
  };

  const renderThemeRow = (themeData) => {
    const color = themeData.percent >= 80 ? '#34b87a' : themeData.percent >= 50 ? '#f5a623' : '#e05454';
    return (
      <div key={themeData.name} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ minWidth: 0 }}>
          <div title={themeData.name} style={{ fontSize: 11, fontWeight: 750, lineHeight: 1.14, overflowWrap: 'anywhere' }}>{themeData.name}</div>
          <div style={{ height: 4, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden', marginTop: 5 }}>
            <div style={{ height: '100%', width: `${themeData.percent}%`, background: color, borderRadius: 4 }} />
          </div>
        </div>
        <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
          <div style={{ fontSize: 12, fontWeight: 900, color }}>{themeData.earned}/{themeData.possible}</div>
          <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--gray)' }}>{themeData.percent}%</div>
        </div>
      </div>
    );
  };

  const renderZoneButton = (id, zone) => {
    const lost = zone.themes.reduce((s, t) => s + t.lost, 0);
    return (
      <button
        key={id}
        onClick={() => setActiveZone(id)}
        style={{ border: `2px solid ${zone.color}`, background: 'var(--white)', borderRadius: 10, padding: '10px 9px', minWidth: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter', boxShadow: '0 2px 0 rgba(26,26,26,0.08)', transition: 'transform 0.15s, background 0.15s, box-shadow 0.15s' }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.boxShadow = '0 4px 0 rgba(26,26,26,0.1)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'var(--white)'; e.currentTarget.style.boxShadow = '0 2px 0 rgba(26,26,26,0.08)'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.04em', textTransform: 'uppercase', color: zone.color, whiteSpace: 'nowrap' }}>{zone.title}</span>
          <span style={{ fontSize: 18, fontWeight: 950, color: zone.color, lineHeight: 1 }}>{zone.themes.length}</span>
        </div>
        <div style={{ fontSize: 10, color: 'var(--gray)', fontWeight: 750, marginTop: 4 }}>{zone.note}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 7 }}>
          <span style={{ fontSize: 10, color: 'var(--gray)', fontWeight: 850 }}>-{lost} б.</span>
          <span style={{ fontSize: 10, color: 'var(--black)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Открыть ›</span>
        </div>
      </button>
    );
  };

  const activeData = activeZone ? zones[activeZone] : null;

  return (
    <div
      key={activeZone || 'summary'}
      className="theme-analysis-card"
      style={{ border: '2px solid var(--border)', borderRadius: 12, padding: 14, width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--white)', animation: 'flipIn 0.24s ease both' }}
    >
      {activeData ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8, flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase', color: activeData.color }}>{activeData.title}</div>
            <button
              onClick={() => setActiveZone(null)}
              style={{ borderRadius: 100, border: '2px solid var(--black)', background: 'var(--white)', color: 'var(--black)', cursor: 'pointer', padding: '5px 12px', fontFamily: 'Inter', fontSize: 11, fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', transition: 'background 0.15s, color 0.15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--black)'; e.currentTarget.style.color = 'var(--white)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--white)'; e.currentTarget.style.color = 'var(--black)'; }}
            >
              <span style={{ fontSize: 14, lineHeight: 1 }}>‹</span>Назад
            </button>
          </div>
          <div style={{ overflow: 'auto', minHeight: 0, paddingRight: 4 }}>
            {activeData.themes.length > 0
              ? activeData.themes.map(renderThemeRow)
              : <div style={{ fontSize: 13, color: 'var(--gray)', fontWeight: 750, padding: '14px 0' }}>Здесь тем нет</div>}
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--black)', flexShrink: 0 }}>Анализ тем</div>
          <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 10, flexShrink: 0 }}>Главная боль</div>
          <div style={{ fontSize: 24, fontWeight: 950, lineHeight: 0.98, color: totalLost > 0 ? 'var(--black)' : '#34b87a', marginTop: 5, overflowWrap: 'anywhere', flexShrink: 0 }}>{focusText}</div>
          <div style={{ fontSize: 11, fontWeight: 750, color: 'var(--gray)', marginTop: 8, flexShrink: 0 }}>Потеряно {totalLost} из {totalPossible} баллов</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginTop: 'auto', paddingTop: 12, flexShrink: 0 }}>
            {renderZoneButton('weak', zones.weak)}
            {renderZoneButton('watch', zones.watch)}
            {renderZoneButton('strong', zones.strong)}
          </div>
        </>
      )}
    </div>
  );
}
