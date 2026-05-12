import { useState, useMemo, Fragment } from 'react';
import { SortTh, Td, sortRows } from '../_helpers.jsx';
import { setPenaltyOverride } from '../../../lib/marathonApi.js';

export default function DetailsTab({ rows, period, onSaved }) {
  const [overrides, setOverrides] = useState({});
  const [saving, setSaving] = useState({});
  const [saveMsg, setSaveMsg] = useState({});
  const [expanded, setExpanded] = useState({});
  const [sortKey, setSortKey] = useState('finalScore');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const normalizedRows = useMemo(() => rows.map((r) => ({
    ...r,
    _days: r.daysDone ?? r.daysCompleted ?? r.days_completed ?? 0,
    _coef: r.coefficient ?? r.completionRate ?? r.completion_rate ?? 0,
    _final: r.finalScore ?? r.final_score ?? r.score ?? 0,
  })), [rows]);

  const sortedRows = useMemo(() => sortRows(normalizedRows, sortKey === 'finalScore' ? '_final' : sortKey === 'coef' ? '_coef' : sortKey === 'days' ? '_days' : sortKey, sortDir), [normalizedRows, sortKey, sortDir]);

  const s = { key: sortKey, dir: sortDir, on: handleSort };

  const toggleExpanded = (k) => setExpanded((prev) => ({ ...prev, [k]: !prev[k] }));

  const rowKey = (r) => `${r.name}||${r.subject}||${r.level}`;

  const startEdit = (r) => {
    const k = rowKey(r);
    setOverrides((prev) => ({ ...prev, [k]: String(r.penalty ?? 0) }));
  };

  const cancelEdit = (r) => {
    const k = rowKey(r);
    setOverrides((prev) => { const n = { ...prev }; delete n[k]; return n; });
  };

  const saveOverride = async (r) => {
    const k = rowKey(r);
    const penalty = parseFloat(overrides[k]);
    if (isNaN(penalty)) return;
    setSaving((prev) => ({ ...prev, [k]: true }));
    try {
      await setPenaltyOverride({
        name: r.name,
        subject: r.subject,
        level: r.level,
        group: r.group ?? '',
        teacher: r.teacher ?? '',
        periodFrom: period?.from ?? '',
        periodTo: period?.to ?? '',
        penalty,
        autoPenalty: r.autoPenalty ?? r.penalty ?? penalty,
      });
      setSaveMsg((prev) => ({ ...prev, [k]: 'Сохранено' }));
      cancelEdit(r);
      setTimeout(() => setSaveMsg((prev) => { const n = { ...prev }; delete n[k]; return n; }), 2000);
      // Backend rebuilds the ratings snapshot in the background; refetch after a couple of beats.
      if (onSaved) { setTimeout(() => { onSaved(); }, 3000); setTimeout(() => { onSaved(); }, 8000); }
    } catch (e) {
      console.error('penalty-override failed:', e);
      setSaveMsg((prev) => ({ ...prev, [k]: 'Ошибка' }));
    }
    setSaving((prev) => ({ ...prev, [k]: false }));
  };

  if (!rows.length) return <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--gray)', fontWeight: 700 }}>Нет данных</div>;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'Inter' }}>
        <thead>
          <tr>
            <SortTh sortKey="name" currentKey={s.key} currentDir={s.dir} onSort={s.on}>Ученик</SortTh>
            <SortTh sortKey="subject" currentKey={s.key} currentDir={s.dir} onSort={s.on}>Предмет</SortTh>
            <SortTh sortKey="group" currentKey={s.key} currentDir={s.dir} onSort={s.on}>Группа</SortTh>
            <SortTh sortKey="teacher" currentKey={s.key} currentDir={s.dir} onSort={s.on}>Преподаватель</SortTh>
            <SortTh sortKey="days" currentKey={s.key} currentDir={s.dir} onSort={s.on} right>Дней</SortTh>
            <SortTh sortKey="coef" currentKey={s.key} currentDir={s.dir} onSort={s.on} right>Коэф.</SortTh>
            <SortTh sortKey="quality" currentKey={s.key} currentDir={s.dir} onSort={s.on} right>Качество</SortTh>
            <SortTh sortKey="score" currentKey={s.key} currentDir={s.dir} onSort={s.on} right>Балл</SortTh>
            <SortTh sortKey="penalty" currentKey={s.key} currentDir={s.dir} onSort={s.on} right>Штраф</SortTh>
            <SortTh sortKey="finalScore" currentKey={s.key} currentDir={s.dir} onSort={s.on} right>Итоговый</SortTh>
            <SortTh sortKey="groupPlace" currentKey={s.key} currentDir={s.dir} onSort={s.on} right>М. группе</SortTh>
            <SortTh sortKey="schoolPlace" currentKey={s.key} currentDir={s.dir} onSort={s.on} right>М. школе</SortTh>
            <th style={{ background: '#f8f8f8', borderBottom: '2px solid var(--border)' }} />
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((r) => {
            const k = rowKey(r);
            const editing = k in overrides;
            const days = r.daysDone ?? r.daysCompleted ?? r.days_completed ?? '—';
            const total = r.daysTotal ?? r.totalDays ?? r.total_days ?? '';
            const coef = r.coefficient ?? r.completionRate ?? r.completion_rate;
            const quality = r.quality;
            const score = r.score ?? 0;
            const penalty = r.penalty ?? 0;
            const final = r.finalScore ?? r.final_score ?? score;
            return (
              <Fragment key={k}>
              <tr>
                <Td bold>{r.name}</Td>
                <Td>{r.subject} {r.level}</Td>
                <Td>{r.group || '—'}</Td>
                <Td>{r.teacher || '—'}</Td>
                <Td right mono>{total ? `${days}/${total}` : days}</Td>
                <Td right mono>{coef != null ? (coef * 100).toFixed(0) + '%' : '—'}</Td>
                <Td right mono>{quality != null ? quality.toFixed(0) + '%' : '—'}</Td>
                <Td right mono>{typeof score === 'number' ? score.toFixed(2) : score}</Td>
                <Td right mono>
                  {editing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={overrides[k]}
                      onChange={(e) => setOverrides((prev) => ({ ...prev, [k]: e.target.value }))}
                      style={{ width: 70, height: 28, padding: '0 6px', border: '2px solid var(--black)', borderRadius: 6, fontFamily: 'Inter', fontSize: 12, fontWeight: 700 }}
                    />
                  ) : (
                    <span style={{ color: penalty > 0 ? '#e05454' : 'var(--gray)' }}>{typeof penalty === 'number' ? penalty.toFixed(2) : penalty}</span>
                  )}
                </Td>
                <Td right mono bold>{typeof final === 'number' ? final.toFixed(2) : final}</Td>
                <Td right mono>{r.groupPlace || '—'}</Td>
                <Td right mono>{r.schoolPlace || '—'}</Td>
                <Td>
                  {saveMsg[k] && <span style={{ fontSize: 11, fontWeight: 700, color: saveMsg[k] === 'Сохранено' ? '#34b87a' : '#e05454', marginRight: 6 }}>{saveMsg[k]}</span>}
                  {editing ? (
                    <span style={{ display: 'inline-flex', gap: 4 }}>
                      <button onClick={() => saveOverride(r)} disabled={saving[k]} style={{ padding: '4px 10px', border: '2px solid var(--black)', borderRadius: 6, background: 'var(--black)', color: 'var(--white)', fontFamily: 'Inter', fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>{saving[k] ? '...' : '✓'}</button>
                      <button onClick={() => cancelEdit(r)} style={{ padding: '4px 10px', border: '2px solid var(--border)', borderRadius: 6, background: 'var(--white)', fontFamily: 'Inter', fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>✕</button>
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', gap: 4 }}>
                      {penalty > 0 && (
                        <button onClick={() => toggleExpanded(k)} style={{ padding: '4px 10px', border: '2px solid var(--border)', borderRadius: 6, background: expanded[k] ? '#fff0f0' : 'var(--white)', fontFamily: 'Inter', fontSize: 11, fontWeight: 800, cursor: 'pointer', color: '#e05454' }}>
                          {expanded[k] ? '▴ Скрыть' : '▾ Дни'}
                        </button>
                      )}
                      <button onClick={() => startEdit(r)} style={{ padding: '4px 10px', border: '2px solid var(--border)', borderRadius: 6, background: 'var(--white)', fontFamily: 'Inter', fontSize: 11, fontWeight: 800, cursor: 'pointer', color: 'var(--gray)' }}>Штраф</button>
                    </span>
                  )}
                </Td>
              </tr>
              {expanded[k] && (
                <tr>
                  <td colSpan={13} style={{ background: '#fff8f8', padding: '4px 16px 12px 32px', borderBottom: '1px solid var(--border)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'Inter' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #eee' }}>
                          {['Дата / день', 'Дата сдачи', 'Первая попытка', 'Штраф за день'].map((h, i) => (
                            <th key={i} style={{ padding: '4px 8px', textAlign: i === 0 ? 'left' : 'right', fontWeight: 900, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 9 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(r.dailyScores ?? []).filter((d) => d.lateDays > 0).length === 0 ? (
                          <tr><td colSpan={4} style={{ padding: '8px', color: 'var(--gray)', fontStyle: 'italic' }}>Нет дней с штрафом (штраф задан вручную?)</td></tr>
                        ) : (
                          (r.dailyScores ?? []).filter((d) => d.lateDays > 0).map((d, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f5e5e5' }}>
                              <td style={{ padding: '4px 8px', fontWeight: 600 }}>{d.dateLabel || d.dateKey || '—'}</td>
                              <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{d.submittedAt ? d.submittedAt.slice(0, 10) : '—'}</td>
                              <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--gray)' }}>{d.firstAttemptAt ? d.firstAttemptAt.slice(0, 10) : '—'}</td>
                              <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 900, color: '#e05454' }}>{d.lateDays}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
