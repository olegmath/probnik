import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRatings, clearAdminKey } from '../../lib/marathonApi.js';
import { pill, Sel } from './_helpers.jsx';
import DetailsTab from './tabs/DetailsTab.jsx';
import TeachersTab from './tabs/TeachersTab.jsx';
import DailyTab from './tabs/DailyTab.jsx';
import GroupErrorsTab from './tabs/GroupErrorsTab.jsx';
import GradesTab from './tabs/GradesTab.jsx';
import ProbniksTab from './tabs/ProbniksTab.jsx';
import ReportsTab from './tabs/ReportsTab.jsx';

const TABS = [
  { id: 'details', label: 'Детали' },
  { id: 'teachers', label: 'Преподаватели' },
  { id: 'daily', label: 'По дням' },
  { id: 'grades', label: 'ДЗ / КР' },
  { id: 'probniki', label: 'Пробники' },
  { id: 'group-errors', label: 'Ошибки групп' },
  { id: 'reports', label: 'Отчёты' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('details');
  const [rawRows, setRawRows] = useState([]);
  const [period, setPeriod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('');
  const [teacher, setTeacher] = useState('');
  const [group, setGroup] = useState('');
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');

  useEffect(() => {
    let pollTimer = null;
    let attempts = 0;
    const MAX_ATTEMPTS = 15;

    const load = (isRetry = false) => {
      if (!isRetry) setLoading(true);
      getRatings({ isPublic: false, periodFrom, periodTo })
        .then((res) => {
          const rows = res?.rows || [];
          setRawRows(rows);
          if (res?.period) setPeriod(res.period);
          if (rows.length === 0 && res?.snapshot?.refreshing && attempts < MAX_ATTEMPTS) {
            attempts++;
            setLoading(false);
            setRefreshing(true);
            pollTimer = setTimeout(() => load(true), 8000);
          } else {
            setLoading(false);
            setRefreshing(false);
          }
        })
        .catch((e) => { setError(e.message); setLoading(false); setRefreshing(false); });
    };

    load();
    return () => { if (pollTimer) clearTimeout(pollTimer); };
  }, [periodFrom, periodTo]);

  // Silent one-shot refetch (e.g. after saving a penalty override).
  const reloadRatings = useCallback(() => {
    return getRatings({ isPublic: false, periodFrom, periodTo })
      .then((res) => {
        const rows = res?.rows || [];
        if (rows.length) setRawRows(rows); // don't blank the table on a warming snapshot
        if (res?.period) setPeriod(res.period);
      })
      .catch(() => {});
  }, [periodFrom, periodTo]);

  const handleLogout = () => {
    clearAdminKey();
    navigate('/admin', { replace: true });
  };

  // Марафон-фильтры (Детали/По дням/Преподаватели) строятся из рейтингов — только 9/11.
  // 10 класс марафон не пишет → он живёт отдельно во вкладке «ДЗ/КР» (GradesTab со своими фильтрами).
  const subjects = useMemo(() => [...new Set(rawRows.map((r) => r.subject).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru')), [rawRows]);
  const levels = useMemo(() => [...new Set(rawRows.filter((r) => !subject || r.subject === subject).map((r) => r.level).filter(Boolean))].sort(), [rawRows, subject]);
  const teachers = useMemo(() => [...new Set(rawRows.filter((r) => (!subject || r.subject === subject) && (!level || r.level === level)).map((r) => r.teacher).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru')), [rawRows, subject, level]);
  const groups = useMemo(() => [...new Set(rawRows.filter((r) => (!subject || r.subject === subject) && (!level || r.level === level) && (!teacher || r.teacher === teacher)).map((r) => r.group).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru')), [rawRows, subject, level, teacher]);

  const filteredRows = useMemo(() => rawRows.filter((r) =>
    (!subject || r.subject === subject) &&
    (!level || r.level === level) &&
    (!teacher || r.teacher === teacher) &&
    (!group || r.group === group)
  ), [rawRows, subject, level, teacher, group]);

  const resetFilters = () => { setSubject(''); setLevel(''); setTeacher(''); setGroup(''); };

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="40" height="40" viewBox="0 0 48 48" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', display: 'block' }}>
            <circle cx="24" cy="24" r="20" stroke="var(--blue)" strokeWidth="4" fill="none" strokeDasharray="31.4 62.8" />
          </svg>
          <p style={{ fontWeight: 700 }}>Загрузка данных марафона...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <section style={{ maxWidth: 600, margin: '80px auto', padding: '0 24px' }}>
        <div style={{ border: '2px solid #e05454', borderRadius: 12, padding: 24 }}>
          <div style={{ fontWeight: 900, color: '#e05454', marginBottom: 8 }}>Ошибка загрузки</div>
          <div style={{ fontSize: 13, color: 'var(--gray)' }}>{error}</div>
          <button onClick={handleLogout} style={{ marginTop: 16, padding: '8px 16px', border: '2px solid var(--border)', borderRadius: 8, background: 'var(--white)', fontFamily: 'Inter', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Выйти</button>
        </div>
      </section>
    );
  }

  // ДЗ/КР (grades) фильтруется своими фильтрами из журнала (вкл. 10 класс), не из марафон-рейтингов.
  const showFilters = activeTab === 'details' || activeTab === 'teachers' || activeTab === 'daily';

  return (
    <main style={{ maxWidth: 1800, margin: '0 auto', width: '100%', padding: '28px 24px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Административная панель</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.025em', lineHeight: 1.05, margin: 0 }}>
            ADMIN <span style={{ fontStyle: 'italic', color: 'var(--blue)' }}>ДАШБОРД</span>
          </h1>
          <span style={{ fontSize: 13, color: 'var(--gray)', fontWeight: 600 }}>{rawRows.length} учеников</span>
        </div>
      </div>

      {refreshing && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '10px 16px', background: '#eef4ff', border: '2px solid var(--blue)', borderRadius: 10 }}>
          <svg width="16" height="16" viewBox="0 0 48 48" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}>
            <circle cx="24" cy="24" r="20" stroke="var(--blue)" strokeWidth="4" fill="none" strokeDasharray="31.4 62.8" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)' }}>Данные марафона обновляются, подождите…</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ border: `2px solid ${active ? 'var(--black)' : 'var(--border)'}`, background: active ? 'var(--black)' : 'var(--white)', color: active ? 'var(--white)' : 'var(--black)', borderRadius: 100, padding: '8px 18px', cursor: 'pointer', fontFamily: 'Inter', fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
              {tab.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)' }}>С</div>
          <input type="date" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)}
            style={{ height: 36, padding: '0 10px', border: '2px solid var(--border)', borderRadius: 8, fontFamily: 'Inter', fontSize: 13, fontWeight: 700, color: 'var(--black)', background: 'var(--white)', outline: 'none', cursor: 'pointer' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)' }}>ПО</div>
          <input type="date" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)}
            style={{ height: 36, padding: '0 10px', border: '2px solid var(--border)', borderRadius: 8, fontFamily: 'Inter', fontSize: 13, fontWeight: 700, color: 'var(--black)', background: 'var(--white)', outline: 'none', cursor: 'pointer' }} />
        </div>
        {(periodFrom || periodTo) && (
          <button onClick={() => { setPeriodFrom(''); setPeriodTo(''); }}
            style={{ height: 36, padding: '0 12px', border: '2px solid var(--border)', borderRadius: 8, background: 'var(--white)', fontFamily: 'Inter', fontSize: 11, fontWeight: 800, cursor: 'pointer', color: 'var(--gray)', alignSelf: 'flex-end' }}>
            Сбросить период
          </button>
        )}
      </div>

      {showFilters && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {/* Строка 1: Предмет */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)', minWidth: 64 }}>Предмет</span>
            {subjects.map((s) => pill(s, subject === s, () => { setSubject(subject === s ? '' : s); setLevel(''); setTeacher(''); setGroup(''); }))}
          </div>
          {/* Строка 2: Экзамен */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)', minWidth: 64 }}>Экзамен</span>
            {levels.map((l) => pill(l, level === l, () => { setLevel(level === l ? '' : l); setTeacher(''); setGroup(''); }, 'var(--blue)'))}
          </div>
          {/* Строка 3: Преподаватель + Группа + Сбросить */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)', minWidth: 64 }}>Препод.</span>
            {teachers.length > 0 && <Sel value={teacher} onChange={(v) => { setTeacher(v); setGroup(''); }} options={teachers} placeholder="Все преподаватели" />}
            {teacher && groups.length > 0 && <Sel value={group} onChange={setGroup} options={groups} placeholder="Все группы" />}
            {(subject || level || teacher || group) && (
              <button onClick={resetFilters} style={{ height: 36, padding: '0 12px', border: '2px solid var(--border)', borderRadius: 8, background: 'var(--white)', fontFamily: 'Inter', fontSize: 11, fontWeight: 800, cursor: 'pointer', color: 'var(--gray)' }}>Сбросить</button>
            )}
          </div>
        </div>
      )}

      <div style={{ height: 2, background: 'var(--black)', borderRadius: 2, marginBottom: 16 }} />

      {activeTab === 'details' && <DetailsTab rows={filteredRows} period={period} onSaved={reloadRatings} />}
      {activeTab === 'teachers' && <TeachersTab rows={filteredRows} />}
      {activeTab === 'daily' && <DailyTab rows={filteredRows} />}
      {activeTab === 'grades' && <GradesTab />}
      {activeTab === 'probniki' && <ProbniksTab />}
      {activeTab === 'group-errors' && <GroupErrorsTab allRows={rawRows} />}
      {activeTab === 'reports' && <ReportsTab allRows={rawRows} onLogout={handleLogout} />}
    </main>
  );
}
