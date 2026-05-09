import { useState } from 'react';
import { Th, Td } from '../_helpers.jsx';
import { setPenaltyOverride } from '../../../lib/marathonApi.js';

export default function DetailsTab({ rows }) {
  const [overrides, setOverrides] = useState({});
  const [saving, setSaving] = useState({});
  const [saveMsg, setSaveMsg] = useState({});

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
      await setPenaltyOverride({ studentName: r.name, subject: r.subject, level: r.level, penalty });
      setSaveMsg((prev) => ({ ...prev, [k]: 'Сохранено' }));
      cancelEdit(r);
      setTimeout(() => setSaveMsg((prev) => { const n = { ...prev }; delete n[k]; return n; }), 2000);
    } catch (e) {
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
            {['Ученик', 'Предмет', 'Группа', 'Дней', 'Коэф.', 'Качество', 'Балл', 'Штраф', 'Итоговый', ''].map((h, i) => <Th key={i} right={i >= 4 && i <= 8}>{h}</Th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const k = rowKey(r);
            const editing = k in overrides;
            const days = r.daysCompleted ?? r.days_completed ?? '—';
            const total = r.totalDays ?? r.total_days ?? '';
            const coef = r.completionRate ?? r.completion_rate;
            const quality = r.quality;
            const score = r.score ?? 0;
            const penalty = r.penalty ?? 0;
            const final = r.finalScore ?? r.final_score ?? score;
            return (
              <tr key={k}>
                <Td bold>{r.name}</Td>
                <Td>{r.subject} {r.level}</Td>
                <Td>{r.group || '—'}</Td>
                <Td right mono>{total ? `${days}/${total}` : days}</Td>
                <Td right mono>{coef != null ? (coef * 100).toFixed(0) + '%' : '—'}</Td>
                <Td right mono>{quality != null ? (quality * 100).toFixed(0) + '%' : '—'}</Td>
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
                <Td>
                  {saveMsg[k] && <span style={{ fontSize: 11, fontWeight: 700, color: saveMsg[k] === 'Сохранено' ? '#34b87a' : '#e05454', marginRight: 6 }}>{saveMsg[k]}</span>}
                  {editing ? (
                    <span style={{ display: 'inline-flex', gap: 4 }}>
                      <button onClick={() => saveOverride(r)} disabled={saving[k]} style={{ padding: '4px 10px', border: '2px solid var(--black)', borderRadius: 6, background: 'var(--black)', color: 'var(--white)', fontFamily: 'Inter', fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>{saving[k] ? '...' : '✓'}</button>
                      <button onClick={() => cancelEdit(r)} style={{ padding: '4px 10px', border: '2px solid var(--border)', borderRadius: 6, background: 'var(--white)', fontFamily: 'Inter', fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>✕</button>
                    </span>
                  ) : (
                    <button onClick={() => startEdit(r)} style={{ padding: '4px 10px', border: '2px solid var(--border)', borderRadius: 6, background: 'var(--white)', fontFamily: 'Inter', fontSize: 11, fontWeight: 800, cursor: 'pointer', color: 'var(--gray)' }}>Штраф</button>
                  )}
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
