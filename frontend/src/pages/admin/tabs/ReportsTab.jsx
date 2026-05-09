import { useState, useMemo } from 'react';
import { Sel } from '../_helpers.jsx';
import { clearCache, sendTelegramReport } from '../../../lib/marathonApi.js';

export default function ReportsTab({ allRows, onLogout }) {
  const students = useMemo(() => [...new Set(allRows.map((r) => r.name))].sort((a, b) => a.localeCompare(b, 'ru')), [allRows]);
  const [student, setStudent] = useState('');
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState('');
  const [clearing, setClearing] = useState(false);
  const [clearMsg, setClearMsg] = useState('');

  const subjectsForStudent = useMemo(() => {
    if (!student) return [];
    return [...new Set(allRows.filter((r) => r.name === student).map((r) => r.subject))];
  }, [allRows, student]);

  const handleSend = async () => {
    if (!student) return;
    setSending(true);
    setSendMsg('');
    try {
      await sendTelegramReport({ studentName: student, subject, level: '' });
      setSendMsg('Отчёт отправлен в Telegram');
    } catch (e) {
      setSendMsg('Ошибка: ' + e.message);
    }
    setSending(false);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 520 }}>
      <div style={{ border: '2px solid var(--border)', borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 14 }}>PDF-отчёт в Telegram</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Sel label="Ученик" value={student} onChange={(v) => { setStudent(v); setSubject(''); setSendMsg(''); }} options={students} placeholder="Выберите ученика" />
          {subjectsForStudent.length > 0 && <Sel label="Предмет (необязательно)" value={subject} onChange={setSubject} options={subjectsForStudent} placeholder="Все предметы" />}
          <button onClick={handleSend} disabled={sending || !student} style={{ height: 40, border: '2px solid var(--black)', borderRadius: 8, background: sending || !student ? 'var(--border)' : 'var(--black)', color: sending || !student ? 'var(--gray)' : 'var(--white)', fontFamily: 'Inter', fontSize: 13, fontWeight: 900, cursor: sending || !student ? 'default' : 'pointer', marginTop: 4, transition: 'background 0.15s' }}>
            {sending ? 'Отправка...' : 'Отправить в Telegram'}
          </button>
          {sendMsg && <div style={{ fontSize: 12, fontWeight: 700, color: sendMsg.startsWith('Ошибка') ? '#e05454' : '#34b87a' }}>{sendMsg}</div>}
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
