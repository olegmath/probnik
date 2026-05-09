import { useState, useMemo } from 'react';
import { Sel, SortTh, Td, sortRows } from '../_helpers.jsx';
import { getGroupErrors } from '../../../lib/marathonApi.js';

export default function GroupErrorsTab({ allRows }) {
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('');
  const [teacher, setTeacher] = useState('');
  const [group, setGroup] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortKey, setSortKey] = useState('errorRate');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const subjects = useMemo(() => [...new Set(allRows.map((r) => r.subject).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru')), [allRows]);
  const levels = useMemo(() => [...new Set(allRows.filter((r) => !subject || r.subject === subject).map((r) => r.level).filter(Boolean))].sort(), [allRows, subject]);
  const teachers = useMemo(() => [...new Set(allRows.filter((r) => (!subject || r.subject === subject) && (!level || r.level === level)).map((r) => r.teacher).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru')), [allRows, subject, level]);
  const groups = useMemo(() => [...new Set(allRows.filter((r) => (!subject || r.subject === subject) && (!level || r.level === level) && (!teacher || r.teacher === teacher)).map((r) => r.group).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru')), [allRows, subject, level, teacher]);

  const load = async () => {
    setLoading(true);
    setError('');
    setData(null);
    try {
      const res = await getGroupErrors({ subject, level, teacher, group });
      setData(res);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const rawTasks = data?.tasks || data?.errors || [];
  const tasks = useMemo(() => {
    const normalized = rawTasks.map((t, i) => ({
      ...t,
      _taskNum: t.task ?? t.taskNumber ?? t.number ?? i + 1,
      _studentCount: t.studentCount ?? t.students ?? 0,
      _errors: t.wrongTotal ?? t.errors ?? t.wrong ?? 0,
      _errorRate: t.errorRate ?? 0,
    }));
    return sortRows(normalized, sortKey === 'taskNum' ? '_taskNum' : sortKey === 'studentCount' ? '_studentCount' : sortKey === 'errors' ? '_errors' : sortKey === 'errorRate' ? '_errorRate' : sortKey, sortDir);
  }, [rawTasks, sortKey, sortDir]);

  const s = { key: sortKey, dir: sortDir, on: handleSort };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16, alignItems: 'flex-end' }}>
        <Sel label="Предмет" value={subject} onChange={(v) => { setSubject(v); setLevel(''); setTeacher(''); setGroup(''); setData(null); }} options={subjects} placeholder="Все предметы" />
        {levels.length > 0 && <Sel label="Уровень" value={level} onChange={(v) => { setLevel(v); setTeacher(''); setGroup(''); setData(null); }} options={levels} placeholder="Все уровни" />}
        {teachers.length > 0 && <Sel label="Преподаватель" value={teacher} onChange={(v) => { setTeacher(v); setGroup(''); setData(null); }} options={teachers} placeholder="Все" />}
        {teacher && groups.length > 0 && <Sel label="Группа" value={group} onChange={(v) => { setGroup(v); setData(null); }} options={groups} placeholder="Все группы" />}
        <button onClick={load} disabled={loading} style={{ height: 36, padding: '0 18px', border: '2px solid var(--black)', borderRadius: 8, background: 'var(--black)', color: 'var(--white)', fontFamily: 'Inter', fontSize: 12, fontWeight: 900, cursor: loading ? 'default' : 'pointer', alignSelf: 'flex-end' }}>
          {loading ? 'Загрузка...' : 'Загрузить'}
        </button>
      </div>
      {error && <div style={{ color: '#e05454', fontWeight: 700, fontSize: 13, marginBottom: 12 }}>{error}</div>}
      {tasks.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter' }}>
            <thead>
              <tr>
                <SortTh sortKey="taskNum" currentKey={s.key} currentDir={s.dir} onSort={s.on}>Задание</SortTh>
                <SortTh sortKey="topic" currentKey={s.key} currentDir={s.dir} onSort={s.on}>Тема</SortTh>
                <SortTh sortKey="studentCount" currentKey={s.key} currentDir={s.dir} onSort={s.on} right>Учеников</SortTh>
                <SortTh sortKey="errors" currentKey={s.key} currentDir={s.dir} onSort={s.on} right>Ошибок</SortTh>
                <SortTh sortKey="errorRate" currentKey={s.key} currentDir={s.dir} onSort={s.on} right>% ошибок</SortTh>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t, i) => (
                <tr key={i}>
                  <Td bold>№{t._taskNum}</Td>
                  <Td>{t.topic ?? t.theme ?? t.section ?? '—'}</Td>
                  <Td right mono>{t._studentCount || '—'}</Td>
                  <Td right mono bold>{t._errors}</Td>
                  <Td right mono>{t._errorRate != null ? (t._errorRate * 100).toFixed(0) + '%' : '—'}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && tasks.length === 0 && !loading && <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--gray)', fontWeight: 700 }}>Ошибок не найдено</div>}
    </div>
  );
}
