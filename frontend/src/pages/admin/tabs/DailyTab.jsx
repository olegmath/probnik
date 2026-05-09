import { useState, useMemo } from 'react';
import { Sel, Th, Td } from '../_helpers.jsx';

export default function DailyTab({ rows }) {
  const students = useMemo(() => [...new Set(rows.map((r) => r.name))].sort((a, b) => a.localeCompare(b, 'ru')), [rows]);
  const [sel, setSel] = useState('');

  const studentRows = rows.filter((r) => r.name === sel);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Sel label="Ученик" value={sel} onChange={setSel} options={students} placeholder="Выберите ученика" />
      </div>
      {sel && studentRows.map((r) => {
        const dailyScores = r.dailyScores ?? r.daily_scores ?? {};
        const days = Object.entries(dailyScores).sort(([a], [b]) => a.localeCompare(b));
        return (
          <div key={`${r.subject}${r.level}`} style={{ marginBottom: 20, border: '2px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', background: '#f8fcfe', borderBottom: '1px solid var(--border)', fontWeight: 900, fontSize: 14 }}>{r.subject} {r.level} — итог: <span style={{ color: 'var(--blue)' }}>{(r.finalScore ?? r.final_score ?? 0).toFixed(2)}</span></div>
            {days.length === 0 ? (
              <div style={{ padding: '20px 14px', color: 'var(--gray)', fontSize: 13, fontWeight: 600 }}>Нет данных по дням</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter' }}>
                  <thead><tr><Th>Дата / день</Th><Th right>Баллы</Th></tr></thead>
                  <tbody>
                    {days.map(([day, score]) => (
                      <tr key={day}>
                        <Td>{day}</Td>
                        <Td right mono bold>{typeof score === 'number' ? score.toFixed(2) : score}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
