import { useState, useEffect, useRef } from 'react';
import './App.css';

const API = 'https://polymerismos.pythonanywhere.com';
const catIcon = { School: 'ti-school', Life: 'ti-home', Fun: 'ti-heart' };

function getToken() { return localStorage.getItem('ps_token'); }
function setToken(t) { localStorage.setItem('ps_token', t); }
function getName() { return localStorage.getItem('ps_name'); }
function setName(n) { localStorage.setItem('ps_name', n); }

function loadColor(pct) {
  if (pct < 40) return '#5C8A7A';
  if (pct < 70) return '#C08A3A';
  return '#C0513A';
}

function LoadPill({ load }) {
  if (load < 0) return <span className="load-pill pill-rest">{load}</span>;
  if (load >= 60) return <span className="load-pill pill-high">+{load}</span>;
  if (load >= 30) return <span className="load-pill pill-mid">+{load}</span>;
  return <span className="load-pill pill-low">+{load}</span>;
}

function LoadBar({ tasks }) {
  let total = 0, remaining = 0;
  tasks.forEach(t => {
    if (t.mental_load > 0) {
      total += t.mental_load;
      if (t.status !== 'done') remaining += t.mental_load;
    }
  });
  const pct = total > 0 ? Math.round((remaining / total) * 100) : 0;
  return (
    <div className="load-bar-wrap">
      <div className="load-label">
        <span>MENTAL LOAD</span>
        <strong style={{ color: 'var(--text2)', fontSize: '10px' }}>{pct}%</strong>
      </div>
      <div className="load-track">
        <div className="load-fill" style={{ width: `${pct}%`, background: loadColor(pct) }} />
      </div>
    </div>
  );
}

function Onboarding({ onDone }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const token = crypto.randomUUID();
      const res = await fetch(`${API}/auth/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name: name.trim() }),
      });
      if (!res.ok) throw new Error('Failed');
      setToken(token);
      setName(name.trim());
      onDone();
    } catch {
      setError('Something went wrong, try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '32px 24px' }}>
      <div style={{ fontFamily: 'var(--serif)', fontSize: '28px', color: 'var(--text)', marginBottom: '8px', textAlign: 'center' }}>
        Welcome to Priority System
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '36px', textAlign: 'center', lineHeight: 1.6 }}>
        Your algorithmic daily planner.<br />What should we call you?
      </div>
      <input
        className="form-input"
        type="text"
        placeholder="Your name"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        style={{ marginBottom: '12px', fontSize: '15px' }}
        autoFocus
      />
      {error && <div style={{ fontSize: '12px', color: 'var(--red)', marginBottom: '8px' }}>{error}</div>}
      <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
        {loading ? 'Setting up...' : "Let's go"}
      </button>
    </div>
  );
}

function AddTaskPanel({ open, onClose, onAdd, editTask, onEdit }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('School');
  const [type, setType] = useState('task');
  const [deadline, setDeadline] = useState('');
  const [estTime, setEstTime] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [importance, setImportance] = useState(5);
  const [loadOverride, setLoadOverride] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title || '');
      setCategory(editTask.category || 'School');
      setType(editTask.is_event ? 'event' : editTask.is_assignment ? 'assignment' : 'task');
      setDeadline(editTask.deadline || '');
      setEstTime(editTask.implementation_time ? String(editTask.implementation_time) : '');
      setImportance(editTask.importance || 5);
      setLoadOverride(editTask.mental_load || 0);
      setStartTime(editTask.start_time || '');
      setEndTime(editTask.end_time || '');
    } else {
      setTitle(''); setCategory('School'); setType('task');
      setDeadline(''); setEstTime(''); setStartTime(''); setEndTime('');
      setImportance(5); setLoadOverride(0);
    }
  }, [editTask, open]);

  const isEvent = type === 'event';

  async function handleSubmit() {
    if (!title.trim()) return;
    setLoading(true);
    if (editTask) {
      await onEdit(editTask.id, { title, category, deadline, estTime, startTime, endTime, importance, loadOverride, type });
    } else {
      await onAdd({ title, category, type, deadline, estTime, startTime, endTime, importance, loadOverride });
    }
    setLoading(false);
    onClose();
  }

  return (
    <div className={`panel${open ? ' open' : ''}`}>
      <div className="panel-header">
        <button className="close-btn" onClick={onClose}><i className="ti ti-arrow-left" /></button>
        <span className="panel-title">{editTask ? 'Edit task' : 'New task'}</span>
      </div>
      <div className="panel-body">
        <div className="form-group">
          <label className="form-label">TASK NAME</label>
          <input className="form-input" type="text" placeholder="What needs to be done?" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">CATEGORY</label>
            <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
              <option>School</option><option>Life</option><option>Fun</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">TYPE</label>
            <select className="form-select" value={type} onChange={e => setType(e.target.value)}>
              <option value="task">Task</option>
              <option value="event">Event</option>
              <option value="assignment">Assignment</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{isEvent ? 'EVENT DATE' : 'DEADLINE'}</label>
            <input className="form-input" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
          </div>
          {!isEvent && (
            <div className="form-group">
              <label className="form-label">EST. TIME (min)</label>
              <input className="form-input" type="number" placeholder="e.g. 60" value={estTime} onChange={e => setEstTime(e.target.value)} />
            </div>
          )}
        </div>
        {isEvent && (
          <div className="form-group event-time-fields show">
            <label className="form-label">EVENT TIME</label>
            <div className="form-row">
              <input className="form-input" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
              <input className="form-input" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
        )}
        {!isEvent && (
          <>
            <div className="form-group">
              <label className="form-label">IMPORTANCE</label>
              <div className="slider-row">
                <span className="slider-label">Low</span>
                <span className="slider-val">{importance} / 10</span>
                <span className="slider-label">High</span>
              </div>
              <input type="range" min="1" max="10" value={importance} onChange={e => setImportance(Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="form-label">MENTAL LOAD OVERRIDE</label>
              <div className="slider-row">
                <span className="slider-label">Restorative</span>
                <span className="slider-val">{loadOverride}</span>
                <span className="slider-label">Draining</span>
              </div>
              <input type="range" min="-100" max="100" value={loadOverride} onChange={e => setLoadOverride(Number(e.target.value))} />
            </div>
          </>
        )}
        <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Saving...' : editTask ? 'Save changes' : 'Add task'}
        </button>
      </div>
    </div>
  );
}

function PomodoroPanel({ open, onClose }) {
  const CIRC = 2 * Math.PI * 82;
  const [focusMin, setFocusMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [seconds, setSeconds] = useState(25 * 60);
  const [total, setTotal] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) { clearInterval(intervalRef.current); setRunning(false); return 0; }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  function reset(min) {
    clearInterval(intervalRef.current);
    setRunning(false);
    const s = (min || focusMin) * 60;
    setSeconds(s); setTotal(s);
  }

  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  const offset = CIRC * (1 - (total > 0 ? seconds / total : 1));

  return (
    <div className={`panel${open ? ' open' : ''}`}>
      <div className="panel-header">
        <button className="close-btn" onClick={onClose}><i className="ti ti-arrow-left" /></button>
        <span className="panel-title">Focus timer</span>
      </div>
      <div className="panel-body">
        <div className="pomo-wrap">
          <div className="pomo-circle">
            <svg className="pomo-svg" width="190" height="190" viewBox="0 0 190 190">
              <circle cx="95" cy="95" r="82" fill="none" stroke="var(--s30)" strokeWidth="7" />
              <circle cx="95" cy="95" r="82" fill="none" stroke="var(--accent)" strokeWidth="7"
                strokeDasharray={CIRC} strokeDashoffset={offset} strokeLinecap="round"
                style={{ transform: 'rotate(-90deg)', transformOrigin: '95px 95px', transition: running ? 'stroke-dashoffset 1s linear' : 'none' }} />
            </svg>
            <div className="pomo-time-display">
              <div className="pomo-big">{m}:{s}</div>
              <div className="pomo-small">FOCUS</div>
            </div>
          </div>
          <div className="pomo-controls">
            <button className="pomo-btn" onClick={() => reset()}><i className="ti ti-refresh" /></button>
            <button className="pomo-btn primary" onClick={() => setRunning(r => !r)}>
              <i className={`ti ${running ? 'ti-player-pause' : 'ti-player-play'}`} />
              {running ? 'Pause' : seconds < total ? 'Resume' : 'Start'}
            </button>
          </div>
        </div>
        <div className="pomo-divider" />
        <div className="pomo-setting">
          <div className="pomo-setting-header">
            <span className="pomo-setting-label"><i className="ti ti-brain" /> Focus duration</span>
            <span className="pomo-setting-val">{focusMin} min</span>
          </div>
          <input type="range" min="5" max="60" step="5" value={focusMin} onChange={e => { setFocusMin(Number(e.target.value)); reset(Number(e.target.value)); }} />
        </div>
        <div className="pomo-setting">
          <div className="pomo-setting-header">
            <span className="pomo-setting-label"><i className="ti ti-coffee" /> Break duration</span>
            <span className="pomo-setting-val">{breakMin} min</span>
          </div>
          <input type="range" min="1" max="30" step="1" value={breakMin} onChange={e => setBreakMin(Number(e.target.value))} />
        </div>
      </div>
    </div>
  );
}

function NotesPanel({ open, onClose, token }) {
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState('');
  const [tag, setTag] = useState(null);
  const [sent, setSent] = useState(false);

  async function sendFeedback() {
    if (!feedback.trim() || !tag) return;
    try {
      await fetch(`${API}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, comment: feedback.trim(), tag }),
      });
      setFeedback(''); setTag(null); setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch { }
  }

  return (
    <div className={`panel${open ? ' open' : ''}`}>
      <div className="panel-header">
        <button className="close-btn" onClick={onClose}><i className="ti ti-arrow-left" /></button>
        <span className="panel-title">Notes</span>
      </div>
      <div className="panel-body">
        <div className="form-label">SCRATCHPAD</div>
        <textarea className="notes-textarea" placeholder="Dump your thoughts here..." value={notes} onChange={e => setNotes(e.target.value)} style={{ marginTop: '5px' }} />
        <div className="notes-hint">Not saved to tasks</div>
        <div className="feedback-divider">SEND FEEDBACK</div>
        <textarea className="notes-textarea" style={{ minHeight: '80px' }} placeholder="Found a bug? Something confusing? Have a suggestion?" value={feedback} onChange={e => setFeedback(e.target.value)} />
        <div className="tag-row">
          {['Bug', 'Confusing', 'Suggestion'].map(t => (
            <button key={t} className={`tag-btn${tag === t ? ' selected' : ''}`} onClick={() => setTag(t === tag ? null : t)}>{t}</button>
          ))}
        </div>
        {sent
          ? <div style={{ textAlign: 'center', color: 'var(--accent)', fontSize: '13px', marginTop: '12px' }}>Feedback sent!</div>
          : <button className="send-btn" onClick={sendFeedback}><i className="ti ti-send" /> Send feedback</button>
        }
      </div>
    </div>
  );
}

function CalendarPanel({ open, onClose, allTasks }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
  function firstDayOfMonth(y, m) {
    const d = new Date(y, m, 1).getDay();
    return d === 0 ? 6 : d - 1;
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const totalDays = daysInMonth(viewYear, viewMonth);
  const startOffset = firstDayOfMonth(viewYear, viewMonth);

  function dateStr(day) {
    return `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  }

  function tasksForDay(day) {
    const ds = dateStr(day);
    return allTasks.filter(t => t.deadline === ds || t.done_date === ds);
  }

  const selectedTasks = selectedDate ? tasksForDay(selectedDate) : [];

  return (
    <div className={`panel${open ? ' open' : ''}`}>
      <div className="panel-header">
        <button className="close-btn" onClick={onClose}><i className="ti ti-arrow-left" /></button>
        <span className="panel-title">Calendar</span>
      </div>
      <div className="panel-body">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <button className="icon-btn" onClick={prevMonth}><i className="ti ti-chevron-left" /></button>
          <span style={{ fontFamily: 'var(--serif)', fontSize: '17px', color: 'var(--text)' }}>{monthNames[viewMonth]} {viewYear}</span>
          <button className="icon-btn" onClick={nextMonth}><i className="ti ti-chevron-right" /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '8px' }}>
          {['M','T','W','T','F','S','S'].map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: '10px', color: 'var(--text3)', fontWeight: '500', padding: '4px 0', letterSpacing: '0.04em' }}>{d}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
          {Array.from({ length: startOffset }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => {
            const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
            const hasTasks = tasksForDay(day).length > 0;
            const isSelected = selectedDate === day;
            return (
              <div key={day} onClick={() => setSelectedDate(isSelected ? null : day)}
                style={{
                  textAlign: 'center', padding: '7px 2px', borderRadius: '10px', cursor: 'pointer',
                  background: isSelected ? 'var(--accent)' : isToday ? 'var(--s30)' : 'transparent',
                  color: isSelected ? '#fff' : 'var(--text)', fontSize: '13px', fontWeight: isToday ? '600' : '400',
                  position: 'relative', transition: 'background 0.15s',
                }}>
                {day}
                {hasTasks && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--accent)', margin: '2px auto 0' }} />}
              </div>
            );
          })}
        </div>

        {selectedDate && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '0.07em', fontWeight: '500', marginBottom: '10px' }}>
              {monthNames[viewMonth].toUpperCase()} {selectedDate}
            </div>
            {selectedTasks.length === 0
              ? <div style={{ fontSize: '13px', color: 'var(--text3)', textAlign: 'center', padding: '20px 0' }}>No tasks for this day</div>
              : selectedTasks.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', background: 'var(--card)', borderRadius: '12px', marginBottom: '7px', border: '0.5px solid var(--border)' }}>
                  <i className={`ti ${catIcon[t.category] || 'ti-circle'}`} style={{ fontSize: '14px', color: 'var(--accent)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>{t.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>{t.status}</div>
                  </div>
                  <LoadPill load={t.mental_load || 0} />
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}

const DAYS = ['MON','TUE','WED','THU','FRI','SAT','SUN'];

export default function App() {
  const [dark, setDark] = useState(false);
  const [onboarded, setOnboarded] = useState(!!getToken());
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const todayIdx = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const [activeDay, setActiveDay] = useState(todayIdx);
  const [panel, setPanel] = useState(null);
  const [activeNav, setActiveNav] = useState('home');
  const [editTask, setEditTask] = useState(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - todayIdx + i);
    return { name: DAYS[i], num: d.getDate() };
  });

  async function loadTasks() {
    const token = getToken();
    if (!token) return;
    try {
      const [cardRes, allRes] = await Promise.all([
        fetch(`${API}/card/today?token=${token}`),
        fetch(`${API}/tasks?token=${token}`)
      ]);
      if (cardRes.ok && allRes.ok) {
        const cardData = await cardRes.json();
        const allData = await allRes.json();
        setAllTasks(allData || []);
        const cardIds = new Set((cardData.tasks || []).map(t => t.id));
        const doneTodayTasks = (allData || []).filter(t => t.status === 'done' && t.done_date === new Date().toISOString().split('T')[0] && !cardIds.has(t.id));
        setTasks([...(cardData.tasks || []), ...doneTodayTasks]);
      }
    } catch { }
    setLoading(false);
  }

  useEffect(() => {
    if (onboarded) loadTasks();
    else setLoading(false);
  }, [onboarded]);

  async function addTask(data) {
    const token = getToken();
    const defaultLoad = data.category === 'School' ? 40 : data.category === 'Life' ? 20 : -20;
    try {
      await fetch(`${API}/tasks?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          category: data.category,
          deadline: data.deadline || null,
          importance: data.importance,
          implementation_time: data.estTime ? parseInt(data.estTime) || 30 : 30,
          mental_load: data.loadOverride !== 0 ? data.loadOverride : defaultLoad,
          is_event: data.type === 'event',
          is_assignment: data.type === 'assignment',
          start_time: data.startTime || null,
          end_time: data.endTime || null,
        }),
      });
      await loadTasks();
    } catch { }
  }

  async function editTaskFn(id, data) {
    const token = getToken();
    try {
      await fetch(`${API}/tasks/${id}?token=${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          category: data.category,
          deadline: data.deadline || null,
          importance: data.importance,
          implementation_time: data.estTime ? parseInt(data.estTime) || 30 : 30,
          mental_load: data.loadOverride,
        }),
      });
      await loadTasks();
    } catch { }
  }

  async function toggleDone(task) {
    const token = getToken();
    try {
      if (task.status === 'done') {
        await fetch(`${API}/tasks/${task.id}?token=${token}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'active' }),
        });
      } else {
        await fetch(`${API}/tasks/${task.id}/done?token=${token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
      }
      await loadTasks();
    } catch { }
  }

  async function postponeTask(task) {
    const token = getToken();
    try {
      await fetch(`${API}/tasks/${task.id}/postpone?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      await loadTasks();
    } catch { }
  }

  async function deleteTask(task) {
    const token = getToken();
    try {
      await fetch(`${API}/tasks/${task.id}?token=${token}`, { method: 'DELETE' });
      await loadTasks();
    } catch { }
  }

  function openPanel(name) { setPanel(name); setActiveNav(name); }
  function closePanel() { setPanel(null); setActiveNav('home'); setEditTask(null); }

  if (!onboarded) return (
    <div className={`phone${dark ? ' dark' : ''}`}>
      <Onboarding onDone={() => { setOnboarded(true); loadTasks(); }} />
    </div>
  );

  const token = getToken();
  const name = getName();
  const events = tasks.filter(t => t.is_event);
  const regularTasks = tasks.filter(t => !t.is_event);
  const taskCount = regularTasks.filter(t => t.status !== 'done').length;
  const todayStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className={`phone${dark ? ' dark' : ''}`}>
      <div className="header">
        <div className="header-top">
          <div>
            <div className="date-main">{todayStr}</div>
            <div className="date-sub">
              {loading ? 'Loading...' : `${taskCount} task${taskCount !== 1 ? 's' : ''} remaining${events.length ? ` · ${events.length} event${events.length !== 1 ? 's' : ''}` : ''}`}
            </div>
          </div>
          <button className="icon-btn" onClick={() => setDark(d => !d)}>
            <i className={`ti ${dark ? 'ti-sun' : 'ti-moon'}`} />
          </button>
        </div>
      </div>

      <LoadBar tasks={tasks} />

      <div className="week-strip">
        {weekDays.map((d, i) => (
          <div key={i} className={`day-cell${activeDay === i ? ' active' : ''}`} onClick={() => setActiveDay(i)}>
            <span className="day-name">{d.name}</span>
            <span className="day-num">{d.num}</span>
            <div className={`day-dot${i === todayIdx ? ' has' : ''}`} />
          </div>
        ))}
      </div>

      <div className="task-section">
        <div className="section-header">
          <span className="section-title">{name ? `${name}'s day` : 'Today'}</span>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)', fontSize: '13px' }}>Loading your tasks...</div>
        )}

        {!loading && tasks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)', fontSize: '13px', lineHeight: 1.6 }}>
            No tasks yet.<br />Tap + to add your first task.
          </div>
        )}

        {events.map(ev => (
          <div className="event-block" key={ev.id}>
            <i className="ti ti-calendar-event" style={{ fontSize: '18px', color: 'var(--accent)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="event-label">EVENT</div>
              <div className="event-title">{ev.title}</div>
              {ev.start_time && ev.end_time && <div className="event-time-display">{ev.start_time} – {ev.end_time}</div>}
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button className="postpone-btn" onClick={() => { setEditTask(ev); openPanel('add'); }} title="Edit"><i className="ti ti-pencil" /></button>
              <button className="postpone-btn" style={{ color: 'var(--red)' }} onClick={() => deleteTask(ev)} title="Delete"><i className="ti ti-trash" /></button>
            </div>
          </div>
        ))}

        {regularTasks.map((t, i) => {
          const prev = regularTasks[i - 1];
          const showSep = prev && prev.category === 'School' && t.category !== 'School' && t.status !== 'done';
          return (
            <div key={t.id}>
              {showSep && (
                <div className="separator">
                  <div className="sep-line" />
                  <div className="sep-tag"><i className="ti ti-coffee" /> break</div>
                  <div className="sep-line" />
                </div>
              )}
              <div className={`task-item${t.status === 'done' ? ' done' : ''}`}>
                <button className={`task-check${t.status === 'done' ? ' checked' : ''}`} onClick={() => toggleDone(t)}>
                  {t.status === 'done' && <i className="ti ti-check" />}
                </button>
                <div className="task-body">
                  <div className="task-type-row">
                    <span className="task-type">
                      <i className={`ti ${catIcon[t.category] || 'ti-circle'}`} style={{ fontSize: '10px' }} /> {(t.category || '').toUpperCase()}
                    </span>
                  </div>
                  <div className="task-title">{t.title}</div>
                  <div className="task-meta">
                    {t.implementation_time && <><i className="ti ti-clock" style={{ fontSize: '11px' }} /> {t.implementation_time}min</>}
                    {t.deadline && <><i className="ti ti-calendar-event" style={{ fontSize: '11px' }} /> {t.deadline}</>}
                    {t.missed_first_date && <><i className="ti ti-alert-circle" style={{ fontSize: '11px', color: 'var(--red)' }} /> Missed</>}
                  </div>
                </div>
                <div className="task-right">
                  <LoadPill load={t.mental_load || 0} />
                  {t.missed_first_date && <div className="missed-dot" title={`Missed since ${t.missed_first_date}`} />}
                  {t.status !== 'done' && (
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {t.mental_load >= 0 && (
                        <button className="postpone-btn" title="Postpone" onClick={() => postponeTask(t)}><i className="ti ti-clock-pause" /></button>
                      )}
                      <button className="postpone-btn" title="Edit" onClick={() => { setEditTask(t); openPanel('add'); }}><i className="ti ti-pencil" /></button>
                      <button className="postpone-btn" style={{ color: 'var(--red)' }} title="Delete" onClick={() => deleteTask(t)}><i className="ti ti-trash" /></button>
                    </div>
                  )}
                  {t.status === 'done' && (
                    <button className="postpone-btn" style={{ color: 'var(--red)' }} title="Delete" onClick={() => deleteTask(t)}><i className="ti ti-trash" /></button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bottom-nav">
        <button className={`nav-btn${activeNav === 'home' ? ' active' : ''}`} onClick={closePanel}>
          <i className="ti ti-home" /><span>HOME</span>
        </button>
        <button className={`nav-btn${activeNav === 'pomo' ? ' active' : ''}`} onClick={() => openPanel('pomo')}>
          <i className="ti ti-clock-hour-4" /><span>FOCUS</span>
        </button>
        <button className="nav-add" onClick={() => { setEditTask(null); openPanel('add'); }}>
          <i className="ti ti-plus" />
        </button>
        <button className={`nav-btn${activeNav === 'notes' ? ' active' : ''}`} onClick={() => openPanel('notes')}>
          <i className="ti ti-notes" /><span>NOTES</span>
        </button>
        <button className={`nav-btn${activeNav === 'cal' ? ' active' : ''}`} onClick={() => openPanel('cal')}>
          <i className="ti ti-calendar-month" /><span>CALENDAR</span>
        </button>
      </div>

      <AddTaskPanel open={panel === 'add'} onClose={closePanel} onAdd={addTask} editTask={editTask} onEdit={editTaskFn} />
      <PomodoroPanel open={panel === 'pomo'} onClose={closePanel} />
      <NotesPanel open={panel === 'notes'} onClose={closePanel} token={token} />
      <CalendarPanel open={panel === 'cal'} onClose={closePanel} allTasks={allTasks} />
    </div>
  );
}
