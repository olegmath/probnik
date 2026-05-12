import { useState, useMemo } from 'react';
import { Sel } from '../_helpers.jsx';
import { clearCache, sendTelegramReport } from '../../../lib/marathonApi.js';

function formatNames(list, max = 12) {
  const arr = (list || []).filter(Boolean);
  if (arr.length === 0) return '';
  if (arr.length <= max) return arr.join(', ');
  return arr.slice(0, max).join(', ') + ` и ещё ${arr.length - max}`;
}

function Summary({ result }) {
  if (!result) return null;
  const sent = result.sent || [];
  const errors = result.errors || [];
  const missing = (result.missingDetails && result.missingDetails.length
    ? result.missingDetails.map((m) => m.name)
    : result.missing) || [];
  const ok = result.ok && errors.length === 0;
  const color = ok ? '#34b87a' : errors.length ? '#e05454' : '#d99a2b';
  const fmt = result.format === 'pdf' ? 'PDF' : 'текст';
  return (
    <div style={{ fontSize: 12, fontWeight: 700, color, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div>Отправлено ({fmt}): {sent.length}{sent.length ? ` — ${formatNames(sent.map((s) => s.name))}` : ''}</div>
      {missing.length > 0 && <div>Без чата: {missing.length} — {formatNames(missing)}</div>}
      {errors.length > 0 && (
        <div>
          Ошибки: {errors.length}
          {errors.slice(0, 12).map((e, i) => (
            <div key={i} style={{ fontWeight: 600 }}>· {e.name}: {e.error}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReportsTab({ allRows, onLogout }) {
  const students = useMemo(() => [...new Set(allRows.map((r) => r.name))].sort((a, b) => a.localeCompare(b, 'ru')), [allRows]);
  const [student, setStudent] = useState('');
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState('');
  const [sendResult, setSendResult] = useState(null);
  const [sendingAll, setSendingAll] = useState(false);
  const [allErr, setAllErr] = useState('');
  const [allResult, setAllResult] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [clearMsg, setClearMsg] = useState('');

  const subjectsForStudent = useMemo(() => {
    if (!student) return [];
    return [...new Set(allRows.filter((r) => r.name === student).map((r) => r.subject))];
  }, [allRows, student]);

  const handleSend = async () => {
    if (!student) return;
    setSending(true);
    setSendErr('');
    setSendResult(null);
    try {
      const result = await sendTelegramReport({ studentName: student, subject, level: '', format: 'pdf' });
      setSendResult(result);
    } catch (e) {
      setSendErr('Ошибка: ' + e.message);
    }
    setSending(false);
  };

  const handleSendAll = async () => {
    if (!window.confirm('Отправить PDF-отчёт всем ученикам с привязанным чатом?')) return;
    setSendingAll(true);
    setAllErr('');
    setAllResult(null);
    try {
      const result = await sendTelegramReport({ studentName: '', subject: '', level: '', format: 'pdf' });
      setAllResult(result);
    } catch (e) {
      setAllErr('Ошибка: ' + e.message);
    }
    setSendingAll(false);
  };

  const handleClear = async () => {
    setClearing(true);
    setClearMsg('');
    try {
      await clearCache();
      setClearMsg('Кеш очищен');
    } catch (e) {
      setClearMsg('Ошибка: ' + e.message);
    }
    setClearing(false);
  };

  const btnStyle = (disabled, dark = true) => ({
    height: 40,
    border: `2px solid ${dark ? 'var(--black)' : 'var(--border)'}`,
    borderRadius: 8,
    background: disabled ? 'var(--border)' : dark ? 'var(--black)' : 'var(--white)',
    color: disabled ? 'var(--gray)' : dark ? 'var(--white)' : 'var(--black)',
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: 900,
    cursor: disabled ? 'default' : 'pointer',
    transition: 'background 0.15s',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 520 }}>
      <div style={{ border: '2px solid var(--border)', borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 14 }}>PDF-отчёт в Telegram</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Sel label="Ученик" value={student} onChange={(v) => { setStudent(v); setSubject(''); setSendErr(''); setSendResult(null); }} options={students} placeholder="Выберите ученика" />
          {subjectsForStudent.length > 0 && <Sel label="Предмет (необязательно)" value={subject} onChange={setSubject} options={subjectsForStudent} placeholder="Все предметы" />}
          <button onClick={handleSend} disabled={sending || !student} style={{ ...btnStyle(sending || !student), marginTop: 4 }}>
            {sending ? 'Отправка...' : 'Отправить по ученику'}
          </button>
          {sendErr && <div style={{ fontSize: 12, fontWeight: 700, color: '#e05454' }}>{sendErr}</div>}
          <Summary result={sendResult} />

          <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />

          <button onClick={handleSendAll} disabled={sendingAll} style={btnStyle(sendingAll)}>
            {sendingAll ? 'Рассылка...' : 'Отправить всем ученикам'}
          </button>
          {allErr && <div style={{ fontSize: 12, fontWeight: 700, color: '#e05454' }}>{allErr}</div>}
          <Summary result={allResult} />
        </div>
      </div>

      <div style={{ border: '2px solid var(--border)', borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>Кеш сервера</div>
        <div style={{ fontSize: 12, color: 'var(--gray)', fontWeight: 600, marginBottom: 12 }}>Принудительно сбросить кеш данных из Soholms</div>
        <button onClick={handleClear} disabled={clearing} style={{ height: 40, padding: '0 20px', border: '2px solid #e05454', borderRadius: 8, background: clearing ? 'var(--border)' : 'rgba(224,84,84,0.08)', color: clearing ? 'var(--gray)' : '#e05454', fontFamily: 'Inter', fontSize: 13, fontWeight: 900, cursor: clearing ? 'default' : 'pointer', transition: 'background 0.15s' }}>
          {clearing ? 'Очистка...' : 'Очистить кеш'}
        </button>
        {clearMsg && <div style={{ fontSize: 12, fontWeight: 700, color: clearMsg.startsWith('Ошибка') ? '#e05454' : '#34b87a', marginTop: 8 }}>{clearMsg}</div>}
      </div>

      <div style={{ border: '2px solid var(--border)', borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>Выход из админки</div>
        <button onClick={onLogout} style={{ height: 40, padding: '0 20px', border: '2px solid var(--border)', borderRadius: 8, background: 'var(--white)', color: 'var(--black)', fontFamily: 'Inter', fontSize: 13, fontWeight: 900, cursor: 'pointer' }}>
          Выйти
        </button>
      </div>
    </div>
  );
}
