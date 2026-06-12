import { useState, useEffect, useRef } from 'react';
import './App.css';

const API = 'https://polymerismos.pythonanywhere.com';
const catIcon = { School: 'ti-school', Life: 'ti-home', Fun: 'ti-heart' };

function getToken() { return localStorage.getItem('ps_token'); }
function setToken(t) { localStorage.setItem('ps_token', t); }
function getName() { return localStorage.getItem('ps_name'); }
function setName(n) { localStorage.setItem('ps_name', n); }
function getSyncCode() { return localStorage.getItem('ps_sync_code'); }
function setSyncCode(c) { localStorage.setItem('ps_sync_code', c); }
function getOnboarded() { return localStorage.getItem('ps_onboarded') === 'true'; }
function setOnboarded(v) { localStorage.setItem('ps_onboarded', v ? 'true' : 'false'); }

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
  let draining = 0, drainingDone = 0, restoring = 0;
  tasks.forEach(t => {
    if (t.is_restorative || t.mental_load < 0) {
      restoring += Math.abs(t.mental_load);
    } else {
      draining += t.mental_load;
      if (t.status === 'done') drainingDone += t.mental_load;
    }
  });
  const remaining = Math.max(0, draining - drainingDone - restoring);
  const pct = draining > 0 ? Math.round((remaining / draining) * 100) : 0;
  return (
    <div className="load-bar-wrap">
      <div className="load-label">
        <span>MENTAL LOAD</span>
        <strong style={{ color: 'var(--text2)', fontSize: '10px' }}>{Math.max(0, pct)}%</strong>
      </div>
      <div className="load-track">
        <div className="load-fill" style={{ width: `${Math.max(0, pct)}%`, background: loadColor(pct) }} />
      </div>
    </div>
  );
}

// ── ONBOARDING ────────────────────────────────────────────
const RESTORATIVE_PRESETS = ['Walk','Gym','Reading','Music','Cooking','Gaming','Meditation','Cycling','Art','Swimming'];

function Onboarding({ onDone }) {
  const [screen, setScreen] = useState(1);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState([]);
  const [custom, setCustom] = useState('');
  const [timeFormat, setTimeFormat] = useState('24h');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [weekStart, setWeekStart] = useState('monday');
  const [syncInput, setSyncInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function togglePreset(label) {
    setSelected(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
  }

  function addCustom() {
    if (!custom.trim()) return;
    setSelected(prev => [...prev, custom.trim()]);
    setCustom('');
  }

  async function handleSync() {
    if (syncInput.length !== 6) return;
    setLoading(true); setError('');
    try {
      const newToken = crypto.randomUUID();
      const res = await fetch(`${API}/auth/sync`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sync_code: syncInput, token: newToken }),
      });
      if (!res.ok) { setError('Invalid sync code. Try again.'); setLoading(false); return; }
      const data = await res.json();
      setToken(newToken); setName(data.name); setSyncCode(data.sync_code); setOnboarded(true); onDone();
    } catch { setError('Something went wrong.'); }
    setLoading(false);
  }

  async function handleFinish() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const token = crypto.randomUUID();
      const initRes = await fetch(`${API}/auth/init`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name: name.trim() }),
      });
      if (!initRes.ok) throw new Error('Failed');
      const initData = await initRes.json();
      setToken(token); setName(name.trim()); setSyncCode(initData.sync_code);
      const activities = selected.map(label => ({ title: label, time: 30 }));
      await fetch(`${API}/auth/complete-onboarding`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, time_format: timeFormat, date_format: dateFormat, week_start: weekStart, restorative_activities: activities, threshold: 100 }),
      });
      setOnboarded(true); onDone();
    } catch { setError('Something went wrong. Try again.'); }
    setLoading(false);
  }

  const S = {
    wrap: { display: 'flex', flexDirection: 'column', height: '100%', padding: '32px 24px 24px' },
    title: { fontFamily: 'var(--serif)', fontSize: '26px', color: 'var(--text)', marginBottom: '8px', lineHeight: 1.2 },
    sub: { fontSize: '13px', color: 'var(--text3)', lineHeight: 1.65, marginBottom: '24px' },
    btn: { width: '100%', padding: '13px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '12px', fontFamily: 'var(--font)', fontSize: '14px', fontWeight: '500', cursor: 'pointer', marginTop: 'auto' },
    back: { background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 },
    toggle: (active) => ({ flex: 1, padding: '10px', borderRadius: '10px', border: '0.5px solid', borderColor: active ? 'var(--accent)' : 'var(--border)', background: active ? 'var(--accent)' : 'var(--p60)', color: active ? '#fff' : 'var(--text2)', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font)' }),
  };

  const Dots = ({ c }) => (
    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '28px' }}>
      {[1,2,3,4].map(i => <div key={i} style={{ width: i===c?'20px':'6px', height:'6px', borderRadius:'99px', background: i===c?'var(--accent)':'var(--s30)', transition:'all 0.2s' }} />)}
    </div>
  );

  if (screen === 0) return (
    <div style={S.wrap}>
      <div style={S.title}>Already have an account?</div>
      <div style={S.sub}>Enter your 6-digit sync code to access your tasks from this device.</div>
      <input className="form-input" type="text" inputMode="numeric" maxLength={6} placeholder="000000" value={syncInput}
        onChange={e => setSyncInput(e.target.value.replace(/\D/g,'').slice(0,6))}
        style={{ fontSize:'24px', letterSpacing:'0.2em', textAlign:'center', marginBottom:'12px' }} />
      {error && <div style={{ fontSize:'12px', color:'var(--red)', marginBottom:'8px', textAlign:'center' }}>{error}</div>}
      <button style={S.btn} onClick={handleSync} disabled={loading || syncInput.length !== 6}>{loading ? 'Syncing...' : 'Sync account'}</button>
      <button style={{ ...S.back, justifyContent:'center', marginTop:'16px' }} onClick={() => setScreen(1)}>New user? Start here</button>
    </div>
  );

  if (screen === 1) return (
    <div style={S.wrap}>
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:'var(--serif)', fontSize:'30px', color:'var(--text)', marginBottom:'12px', lineHeight:1.15 }}>Your brain has limits.<br />We work with them.</div>
        <div style={S.sub}>Priority System uses your deadlines, energy, and mental load to build your daily task list automatically. No overwhelming lists. Just what matters today, in the right order.</div>
        {[{icon:'ti-brain',text:'Algorithm that respects your mental load'},{icon:'ti-shield-check',text:'Your tasks are private — we never see them'},{icon:'ti-clock-pause',text:'Postpone without penalty, always'}].map((item,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 12px', background:'var(--s30)', borderRadius:'12px', marginBottom:'10px' }}>
            <i className={`ti ${item.icon}`} style={{ fontSize:'18px', color:'var(--accent)', flexShrink:0 }} />
            <span style={{ fontSize:'13px', color:'var(--text2)' }}>{item.text}</span>
          </div>
        ))}
      </div>
      <button style={S.btn} onClick={() => setScreen(2)}>Get started</button>
      <button style={{ ...S.back, justifyContent:'center', marginTop:'12px' }} onClick={() => setScreen(0)}>Already have an account?</button>
    </div>
  );

  if (screen === 2) return (
    <div style={S.wrap}>
      <button style={S.back} onClick={() => setScreen(1)}><i className="ti ti-arrow-left" /> Back</button>
      <Dots c={1} />
      <div style={S.title}>What should we call you?</div>
      <div style={S.sub}>Just your display name. No account, no email needed.</div>
      <input className="form-input" type="text" placeholder="Your name or nickname" value={name}
        onChange={e => setName(e.target.value)} onKeyDown={e => e.key==='Enter' && name.trim() && setScreen(3)}
        style={{ fontSize:'15px', marginBottom:'12px' }} autoFocus />
      <button style={{ ...S.btn, marginTop:'12px' }} onClick={() => name.trim() && setScreen(3)} disabled={!name.trim()}>Continue</button>
    </div>
  );

  if (screen === 3) return (
    <div style={S.wrap}>
      <button style={S.back} onClick={() => setScreen(2)}><i className="ti ti-arrow-left" /> Back</button>
      <Dots c={2} />
      <div style={S.title}>What helps you recharge?</div>
      <div style={S.sub}>These become daily restorative tasks that offset your mental load. Add as many as you like.</div>
      <div style={{ flex:1, overflowY:'auto' }}>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'16px' }}>
          {RESTORATIVE_PRESETS.map(p => (
            <button key={p} onClick={() => togglePreset(p)} style={{ padding:'7px 14px', borderRadius:'99px', border:'0.5px solid', borderColor: selected.includes(p)?'var(--accent)':'var(--border)', background: selected.includes(p)?'var(--accent)':'var(--p60)', color: selected.includes(p)?'#fff':'var(--text2)', fontSize:'13px', cursor:'pointer', fontFamily:'var(--font)', transition:'all 0.15s' }}>{p}</button>
          ))}
          {selected.filter(s => !RESTORATIVE_PRESETS.includes(s)).map(c => (
            <button key={c} onClick={() => setSelected(prev => prev.filter(s => s !== c))} style={{ padding:'7px 14px', borderRadius:'99px', border:'0.5px solid var(--accent)', background:'var(--accent)', color:'#fff', fontSize:'13px', cursor:'pointer', fontFamily:'var(--font)', display:'flex', alignItems:'center', gap:'6px' }}>{c} <span>×</span></button>
          ))}
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <input className="form-input" type="text" placeholder="Add your own..." value={custom} onChange={e => setCustom(e.target.value)} onKeyDown={e => e.key==='Enter' && addCustom()} style={{ flex:1 }} />
          <button onClick={addCustom} style={{ padding:'10px 14px', background:'var(--s30)', border:'0.5px solid var(--border)', borderRadius:'10px', cursor:'pointer', color:'var(--text2)', fontFamily:'var(--font)', fontSize:'13px' }}>Add</button>
        </div>
      </div>
      <button style={S.btn} onClick={() => setScreen(4)}>{selected.length === 0 ? 'Skip for now' : `Continue with ${selected.length} activit${selected.length===1?'y':'ies'}`}</button>
    </div>
  );

  if (screen === 4) return (
    <div style={S.wrap}>
      <button style={S.back} onClick={() => setScreen(3)}><i className="ti ti-arrow-left" /> Back</button>
      <Dots c={3} />
      <div style={S.title}>A few preferences</div>
      <div style={S.sub}>You can change these anytime in settings.</div>
      <div style={{ display:'flex', flexDirection:'column', gap:'14px', marginBottom:'24px' }}>
        <div><label className="form-label">TIME FORMAT</label><div style={{ display:'flex', gap:'8px', marginTop:'5px' }}>{['24h','12h'].map(f => <button key={f} onClick={() => setTimeFormat(f)} style={S.toggle(timeFormat===f)}>{f}</button>)}</div></div>
        <div><label className="form-label">DATE FORMAT</label><div style={{ display:'flex', gap:'8px', marginTop:'5px' }}>{['DD/MM/YYYY','MM/DD/YYYY'].map(f => <button key={f} onClick={() => setDateFormat(f)} style={{ ...S.toggle(dateFormat===f), fontSize:'12px' }}>{f}</button>)}</div></div>
        <div><label className="form-label">WEEK STARTS ON</label><div style={{ display:'flex', gap:'8px', marginTop:'5px' }}>{['monday','sunday'].map(f => <button key={f} onClick={() => setWeekStart(f)} style={{ ...S.toggle(weekStart===f), textTransform:'capitalize' }}>{f}</button>)}</div></div>
      </div>
      <button style={S.btn} onClick={() => setScreen(5)}>Continue</button>
    </div>
  );

  return (
    <div style={S.wrap}>
      <Dots c={4} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center' }}>
        <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'20px' }}>
          <i className="ti ti-check" style={{ fontSize:'28px', color:'#fff' }} />
        </div>
        <div style={S.title}>You're all set, {name}!</div>
        <div style={{ ...S.sub, marginBottom:'32px' }}>Your sync code lets you access Priority System from any device.</div>
        <div style={{ background:'var(--s30)', borderRadius:'16px', padding:'20px 32px', marginBottom:'8px', width:'100%' }}>
          <div style={{ fontSize:'11px', color:'var(--text3)', letterSpacing:'0.08em', marginBottom:'8px' }}>YOUR SYNC CODE</div>
          <div style={{ fontFamily:'var(--serif)', fontSize:'36px', color:'var(--text)', letterSpacing:'0.15em' }}>••••••</div>
          <div style={{ fontSize:'11px', color:'var(--text3)', marginTop:'6px' }}>Revealed in Settings after you start</div>
        </div>
      </div>
      {error && <div style={{ fontSize:'12px', color:'var(--red)', marginBottom:'8px', textAlign:'center' }}>{error}</div>}
      <button style={S.btn} onClick={handleFinish} disabled={loading}>{loading ? 'Setting up...' : "Let's go"}</button>
    </div>
  );
}

// ── HEAT MAP ──────────────────────────────────────────────
function HeatMap({ allTasks }) {
  const today = new Date();
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - 13 + i); return d;
  });

  function getIntensity(date) {
    const ds = date.toISOString().split('T')[0];
    const done = allTasks.filter(t => t.done_date === ds && t.status === 'done');
    if (done.length === 0) return 0;
    const hasRestorative = done.some(t => t.is_restorative || t.mental_load < 0);
    const hasDraining = done.some(t => !t.is_restorative && t.mental_load >= 0);
    if (hasRestorative && hasDraining) return 3;
    if (hasDraining) return 2;
    return 1;
  }

  const intensities = days.map(d => getIntensity(d));
  const doneCount = intensities.filter(i => i > 0).length;

  function getTLDR() {
    const balanced = intensities.filter(i => i === 3).length;
    const workHeavy = intensities.filter(i => i === 2).length;
    const total = intensities.filter(i => i > 0).length;
    if (total === 0) return null;
    if (balanced >= 5) return "You've been showing up for both your work and yourself. This is what sustainable productivity looks like.";
    if (workHeavy >= 5) return "You've been incredibly consistent with your work. Consider weaving in some recharge activities — even small ones reduce burnout risk significantly.";
    if (total <= 3) return "It's been a quieter stretch. That happens. Even one small task today counts — momentum builds from the smallest starts.";
    return "You've been showing up. Keep going.";
  }

  const tldr = getTLDR();
  const colors = ['var(--s30)', '#b8d9cf', '#8dc4b7', '#5C8A7A'];

  return (
    <div style={{ margin:'0 14px 12px', background:'var(--s30)', borderRadius:'14px', padding:'12px 14px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
        <span style={{ fontSize:'10px', color:'var(--text3)', letterSpacing:'0.06em', fontWeight:'500' }}>CONSISTENCY — 14 DAYS</span>
        <span style={{ fontSize:'11px', color:'var(--accent)', fontWeight:'500' }}>{doneCount} / 14</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(14, 1fr)', gap:'3px' }}>
        {days.map((d, i) => (
          <div key={i} style={{ aspectRatio:'1', borderRadius:'3px', background:colors[intensities[i]], border: intensities[i]===0?'0.5px solid var(--border)':'none' }} />
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(14, 1fr)', gap:'3px', marginTop:'4px' }}>
        {days.map((d, i) => (
          <div key={i} style={{ fontSize:'8px', color:'var(--text3)', textAlign:'center' }}>
            {['M','T','W','T','F','S','S'][d.getDay()===0?6:d.getDay()-1]}
          </div>
        ))}
      </div>
      {tldr && (
        <div style={{ marginTop:'10px', fontSize:'11px', color:'var(--text2)', lineHeight:1.55, paddingTop:'10px', borderTop:'0.5px solid var(--border)' }}>{tldr}</div>
      )}
    </div>
  );
}

// ── ADD TASK PANEL ────────────────────────────────────────
function AddTaskPanel({ open, onClose, onAdd, editTask, onEdit }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('School');
  const [type, setType] = useState('task');
  const [deadline, setDeadline] = useState('');
  const [deadlineEnd, setDeadlineEnd] = useState('');
  const [useRange, setUseRange] = useState(false);
  const [estTime, setEstTime] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [importance, setImportance] = useState(5);
  const [loadOverride, setLoadOverride] = useState(0);
  const [isRestorative, setIsRestorative] = useState(false);
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
      setIsRestorative(editTask.is_restorative || false);
      setUseRange(false); setDeadlineEnd('');
    } else {
      setTitle(''); setCategory('School'); setType('task');
      setDeadline(''); setDeadlineEnd(''); setUseRange(false);
      setEstTime(''); setStartTime(''); setEndTime('');
      setImportance(5); setLoadOverride(0); setIsRestorative(false);
    }
  }, [editTask, open]);

  const isEvent = type === 'event';
  const autoRestorative = loadOverride < 0;

  function getDatesInRange(start, end) {
    const dates = [];
    const s = new Date(start), e = new Date(end);
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }

  async function handleSubmit() {
    if (!title.trim()) return;
    setLoading(true);
    const restorativeFlag = isRestorative || autoRestorative;
    if (editTask) {
      await onEdit(editTask.id, { title, category, deadline, estTime, startTime, endTime, importance, loadOverride, type, isRestorative: restorativeFlag });
    } else if (useRange && deadline && deadlineEnd) {
      const dates = getDatesInRange(deadline, deadlineEnd);
      await onAdd({ title, category, type, deadline: null, estTime, startTime, endTime, importance, loadOverride, isRestorative: restorativeFlag, dates });
    } else {
      await onAdd({ title, category, type, deadline, estTime, startTime, endTime, importance, loadOverride, isRestorative: restorativeFlag });
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

        {!isEvent && (
          <div className="form-group">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'5px' }}>
              <label className="form-label" style={{ margin:0 }}>DEADLINE</label>
              {!editTask && (
                <button onClick={() => setUseRange(r => !r)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'11px', color: useRange?'var(--accent)':'var(--text3)', fontFamily:'var(--font)', display:'flex', alignItems:'center', gap:'4px' }}>
                  <i className={`ti ${useRange ? 'ti-calendar-check' : 'ti-calendar-stats'}`} style={{ fontSize:'13px' }} />
                  {useRange ? 'Date range on' : 'Use date range'}
                </button>
              )}
            </div>
            {!useRange ? (
              <input className="form-input" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
            ) : (
              <div className="form-row">
                <input className="form-input" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} placeholder="Start" />
                <input className="form-input" type="date" value={deadlineEnd} onChange={e => setDeadlineEnd(e.target.value)} placeholder="End" />
              </div>
            )}
            {useRange && deadline && deadlineEnd && deadline <= deadlineEnd && (
              <div style={{ fontSize:'11px', color:'var(--accent)', marginTop:'4px' }}>
                Creates {getDatesInRange(deadline, deadlineEnd).length} tasks, one per day
              </div>
            )}
          </div>
        )}

        {isEvent && (
          <>
            <div className="form-group">
              <label className="form-label">EVENT DATE</label>
              <input className="form-input" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
            </div>
            <div className="form-group event-time-fields show">
              <label className="form-label">EVENT TIME</label>
              <div className="form-row">
                <input className="form-input" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                <input className="form-input" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
            </div>
          </>
        )}

        {!isEvent && (
          <div className="form-group">
            <label className="form-label">EST. TIME (min)</label>
            <input className="form-input" type="number" placeholder="e.g. 60" value={estTime} onChange={e => setEstTime(e.target.value)} />
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
              <label className="form-label">MENTAL LOAD</label>
              <div className="slider-row">
                <span className="slider-label">Restorative</span>
                <span className="slider-val" style={{ color: loadOverride < 0 ? 'var(--green)' : loadOverride > 50 ? 'var(--red)' : 'var(--accent)' }}>{loadOverride}</span>
                <span className="slider-label">Draining</span>
              </div>
              <input type="range" min="-100" max="100" value={loadOverride} onChange={e => setLoadOverride(Number(e.target.value))} />
              {autoRestorative && <div style={{ fontSize:'11px', color:'var(--accent)', marginTop:'4px' }}>Auto-marked as restorative</div>}
            </div>
          </>
        )}

        <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Saving...' : editTask ? 'Save changes' : useRange && deadline && deadlineEnd ? `Create ${getDatesInRange(deadline, deadlineEnd).length} tasks` : 'Add task'}
        </button>
      </div>
    </div>
  );
}

// ── SUBTASK ROW ───────────────────────────────────────────
function SubtaskRow({ subtask, token, onRefresh }) {
  async function toggle() {
    await fetch(`${API}/subtasks/${subtask.id}/done?token=${token}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({}) });
    onRefresh();
  }
  async function del() {
    await fetch(`${API}/subtasks/${subtask.id}?token=${token}`, { method:'DELETE' });
    onRefresh();
  }
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'5px 0 5px 12px' }}>
      <button onClick={toggle} style={{ width:'16px', height:'16px', borderRadius:'50%', border:`1.5px solid ${subtask.done?'var(--accent)':'var(--border)'}`, background: subtask.done?'var(--accent)':'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        {subtask.done && <i className="ti ti-check" style={{ fontSize:'9px', color:'#fff' }} />}
      </button>
      <span style={{ fontSize:'12px', color:'var(--text2)', flex:1, textDecoration: subtask.done?'line-through':'none', opacity: subtask.done?0.6:1 }}>{subtask.title}</span>
      <button onClick={del} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', fontSize:'12px', padding:'2px' }}><i className="ti ti-x" /></button>
    </div>
  );
}

// ── POMODORO ──────────────────────────────────────────────
function PomodoroPanel({ open, onClose }) {
  const CIRC = 2 * Math.PI * 82;
  const [focusMin, setFocusMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [seconds, setSeconds] = useState(25*60);
  const [total, setTotal] = useState(25*60);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setSeconds(s => { if (s<=1){clearInterval(ref.current);setRunning(false);return 0;} return s-1; }), 1000);
    } else clearInterval(ref.current);
    return () => clearInterval(ref.current);
  }, [running]);

  function reset(min) { clearInterval(ref.current); setRunning(false); const s=(min||focusMin)*60; setSeconds(s); setTotal(s); }
  const m = String(Math.floor(seconds/60)).padStart(2,'0');
  const s = String(seconds%60).padStart(2,'0');
  const offset = CIRC*(1-(total>0?seconds/total:1));

  return (
    <div className={`panel${open?' open':''}`}>
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
                style={{ transform:'rotate(-90deg)', transformOrigin:'95px 95px', transition:running?'stroke-dashoffset 1s linear':'none' }} />
            </svg>
            <div className="pomo-time-display"><div className="pomo-big">{m}:{s}</div><div className="pomo-small">FOCUS</div></div>
          </div>
          <div className="pomo-controls">
            <button className="pomo-btn" onClick={() => reset()}><i className="ti ti-refresh" /></button>
            <button className="pomo-btn primary" onClick={() => setRunning(r=>!r)}>
              <i className={`ti ${running?'ti-player-pause':'ti-player-play'}`} />
              {running ? 'Pause' : seconds<total ? 'Resume' : 'Start'}
            </button>
          </div>
        </div>
        <div className="pomo-divider" />
        <div className="pomo-setting">
          <div className="pomo-setting-header"><span className="pomo-setting-label"><i className="ti ti-brain" /> Focus duration</span><span className="pomo-setting-val">{focusMin} min</span></div>
          <input type="range" min="5" max="60" step="5" value={focusMin} onChange={e=>{setFocusMin(Number(e.target.value));reset(Number(e.target.value));}} />
        </div>
        <div className="pomo-setting">
          <div className="pomo-setting-header"><span className="pomo-setting-label"><i className="ti ti-coffee" /> Break duration</span><span className="pomo-setting-val">{breakMin} min</span></div>
          <input type="range" min="1" max="30" step="1" value={breakMin} onChange={e=>setBreakMin(Number(e.target.value))} />
        </div>
      </div>
    </div>
  );
}

// ── NOTES ─────────────────────────────────────────────────
function NotesPanel({ open, onClose, token }) {
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState('');
  const [tag, setTag] = useState(null);
  const [sent, setSent] = useState(false);

  async function sendFeedback() {
    if (!feedback.trim() || !tag) return;
    try {
      await fetch(`${API}/feedback`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({token, comment:feedback.trim(), tag}) });
      setFeedback(''); setTag(null); setSent(true); setTimeout(() => setSent(false), 3000);
    } catch {}
  }

  return (
    <div className={`panel${open?' open':''}`}>
      <div className="panel-header"><button className="close-btn" onClick={onClose}><i className="ti ti-arrow-left" /></button><span className="panel-title">Notes</span></div>
      <div className="panel-body">
        <div className="form-label">SCRATCHPAD</div>
        <textarea className="notes-textarea" placeholder="Dump your thoughts here..." value={notes} onChange={e=>setNotes(e.target.value)} style={{ marginTop:'5px' }} />
        <div className="notes-hint">Not saved to tasks</div>
        <div className="feedback-divider">SEND FEEDBACK</div>
        <textarea className="notes-textarea" style={{ minHeight:'80px' }} placeholder="Found a bug? Something confusing? Have a suggestion?" value={feedback} onChange={e=>setFeedback(e.target.value)} />
        <div className="tag-row">{['Bug','Confusing','Suggestion'].map(t=><button key={t} className={`tag-btn${tag===t?' selected':''}`} onClick={()=>setTag(t===tag?null:t)}>{t}</button>)}</div>
        {sent ? <div style={{ textAlign:'center', color:'var(--accent)', fontSize:'13px', marginTop:'12px' }}>Feedback sent!</div>
          : <button className="send-btn" onClick={sendFeedback}><i className="ti ti-send" /> Send feedback</button>}
      </div>
    </div>
  );
}

// ── CALENDAR ──────────────────────────────────────────────
function CalendarPanel({ open, onClose, allTasks, onAddWithDate }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  function daysInMonth(y,m){return new Date(y,m+1,0).getDate();}
  function firstDay(y,m){const d=new Date(y,m,1).getDay();return d===0?6:d-1;}
  function prevMonth(){if(viewMonth===0){setViewYear(y=>y-1);setViewMonth(11);}else setViewMonth(m=>m-1);}
  function nextMonth(){if(viewMonth===11){setViewYear(y=>y+1);setViewMonth(0);}else setViewMonth(m=>m+1);}
  function dateStr(day){return `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;}
  function tasksForDay(day){const ds=dateStr(day);return allTasks.filter(t=>t.deadline===ds||t.done_date===ds);}

  return (
    <div className={`panel${open?' open':''}`}>
      <div className="panel-header"><button className="close-btn" onClick={onClose}><i className="ti ti-arrow-left" /></button><span className="panel-title">Calendar</span></div>
      <div className="panel-body">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
          <button className="icon-btn" onClick={prevMonth}><i className="ti ti-chevron-left" /></button>
          <span style={{ fontFamily:'var(--serif)', fontSize:'17px', color:'var(--text)' }}>{months[viewMonth]} {viewYear}</span>
          <button className="icon-btn" onClick={nextMonth}><i className="ti ti-chevron-right" /></button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px', marginBottom:'8px' }}>
          {['M','T','W','T','F','S','S'].map((d,i)=><div key={i} style={{ textAlign:'center', fontSize:'10px', color:'var(--text3)', fontWeight:'500', padding:'4px 0' }}>{d}</div>)}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'3px' }}>
          {Array.from({length:firstDay(viewYear,viewMonth)}).map((_,i)=><div key={`e${i}`}/>)}
          {Array.from({length:daysInMonth(viewYear,viewMonth)},(_,i)=>i+1).map(day=>{
            const isToday=day===today.getDate()&&viewMonth===today.getMonth()&&viewYear===today.getFullYear();
            const hasTasks=tasksForDay(day).length>0;
            const isSel=selectedDate===day;
            return (
              <div key={day} onClick={()=>setSelectedDate(isSel?null:day)}
                style={{ textAlign:'center', padding:'7px 2px', borderRadius:'10px', cursor:'pointer', background:isSel?'var(--accent)':isToday?'var(--s30)':'transparent', color:isSel?'#fff':'var(--text)', fontSize:'13px', fontWeight:isToday?'600':'400', transition:'background 0.15s' }}>
                {day}
                {hasTasks&&<div style={{ width:'4px', height:'4px', borderRadius:'50%', background:isSel?'rgba(255,255,255,0.7)':'var(--accent)', margin:'2px auto 0' }}/>}
              </div>
            );
          })}
        </div>
        {selectedDate && (
          <div style={{ marginTop:'20px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
              <div style={{ fontSize:'10px', color:'var(--text3)', letterSpacing:'0.07em', fontWeight:'500' }}>{months[viewMonth].toUpperCase()} {selectedDate}</div>
              <button onClick={() => { onAddWithDate(dateStr(selectedDate)); onClose(); }} style={{ fontSize:'11px', color:'var(--accent)', background:'none', border:'0.5px solid var(--accent)', borderRadius:'8px', padding:'4px 10px', cursor:'pointer', fontFamily:'var(--font)', display:'flex', alignItems:'center', gap:'4px' }}>
                <i className="ti ti-plus" style={{ fontSize:'11px' }} /> Add task
              </button>
            </div>
            {tasksForDay(selectedDate).length===0
              ? <div style={{ fontSize:'13px', color:'var(--text3)', textAlign:'center', padding:'20px 0' }}>No tasks for this day</div>
              : tasksForDay(selectedDate).map(t=>(
                <div key={t.id} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 12px', background:'var(--card)', borderRadius:'12px', marginBottom:'7px', border:'0.5px solid var(--border)' }}>
                  <i className={`ti ${catIcon[t.category]||'ti-circle'}`} style={{ fontSize:'14px', color:'var(--accent)' }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'13px', fontWeight:'500', color:'var(--text)', textDecoration:t.status==='done'?'line-through':'none' }}>{t.title}</div>
                    <div style={{ fontSize:'11px', color:'var(--text3)', marginTop:'2px' }}>{t.status}</div>
                  </div>
                  <LoadPill load={t.mental_load||0}/>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}

// ── SETTINGS ──────────────────────────────────────────────
function SettingsPanel({ open, onClose, token, syncCode }) {
  const [threshold, setThreshold] = useState(100);
  const [saved, setSaved] = useState(false);
  const [showCode, setShowCode] = useState(false);

  async function save() {
    await fetch(`${API}/settings`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({token, threshold}) });
    setSaved(true); setTimeout(()=>setSaved(false),2000);
  }

  return (
    <div className={`panel${open?' open':''}`}>
      <div className="panel-header"><button className="close-btn" onClick={onClose}><i className="ti ti-arrow-left" /></button><span className="panel-title">Settings</span></div>
      <div className="panel-body">
        <div className="form-group">
          <label className="form-label">DAILY LOAD THRESHOLD</label>
          <div className="slider-row" style={{ marginBottom:'6px' }}><span className="slider-label">Relaxed</span><span className="slider-val">{threshold}</span><span className="slider-label">Ambitious</span></div>
          <input type="range" min="30" max="300" step="10" value={threshold} onChange={e=>setThreshold(Number(e.target.value))} />
          <div style={{ fontSize:'11px', color:'var(--text3)', marginTop:'6px' }}>Controls how many tasks the algorithm includes in your daily card.</div>
        </div>
        <div className="form-group" style={{ marginTop:'20px' }}>
          <label className="form-label">YOUR SYNC CODE</label>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px', background:'var(--s30)', borderRadius:'12px', marginTop:'5px' }}>
            <span style={{ fontFamily:'var(--serif)', fontSize:'22px', color:'var(--text)', letterSpacing:'0.12em', flex:1 }}>{showCode ? syncCode : '••••••'}</span>
            <button onClick={()=>setShowCode(s=>!s)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', fontSize:'18px' }}><i className={`ti ${showCode?'ti-eye-off':'ti-eye'}`}/></button>
            <button onClick={()=>navigator.clipboard.writeText(syncCode)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', fontSize:'18px' }}><i className="ti ti-copy"/></button>
          </div>
          <div style={{ fontSize:'11px', color:'var(--text3)', marginTop:'6px' }}>Use this code to access your account from any device.</div>
        </div>
        <button className="submit-btn" onClick={save} style={{ marginTop:'24px' }}>{saved ? 'Saved!' : 'Save settings'}</button>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────
const DAYS = ['MON','TUE','WED','THU','FRI','SAT','SUN'];

export default function App() {
  const [dark, setDark] = useState(false);
  const [onboarded, setOnboardedState] = useState(getOnboarded());
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overloadCount, setOverloadCount] = useState(0);
  const [expandedTask, setExpandedTask] = useState(null);
  const [newSubtask, setNewSubtask] = useState('');
  const today = new Date();
  const todayIdx = today.getDay()===0?6:today.getDay()-1;
  const [activeDay, setActiveDay] = useState(todayIdx);
  const [panel, setPanel] = useState(null);
  const [activeNav, setActiveNav] = useState('home');
  const [editTask, setEditTask] = useState(null);
  const [presetDeadline, setPresetDeadline] = useState(null);

  const weekDays = Array.from({length:7},(_,i)=>{const d=new Date(today);d.setDate(today.getDate()-todayIdx+i);return{name:DAYS[i],num:d.getDate()};});

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
        setAllTasks(allData||[]);
        setOverloadCount(cardData.overloaded_count||0);
        const cardIds = new Set((cardData.tasks||[]).map(t=>t.id));
        const todayStr = today.toISOString().split('T')[0];
        const doneTasks = (allData||[]).filter(t=>t.status==='done'&&t.done_date===todayStr&&!cardIds.has(t.id));
        setTasks([...(cardData.tasks||[]),...doneTasks]);
      }
    } catch {}
    setLoading(false);
  }

  useEffect(() => { if (onboarded) loadTasks(); else setLoading(false); }, [onboarded]);

  async function addTask(data) {
    const token = getToken();
    const defaultLoad = (data.isRestorative || data.loadOverride < 0) ? -20 : data.category==='School' ? 40 : data.category==='Life' ? 20 : -20;
    const load = data.loadOverride !== 0 ? data.loadOverride : defaultLoad;
    const base = {
      title: data.title, category: data.category,
      importance: data.importance,
      implementation_time: data.estTime ? parseInt(data.estTime)||30 : 30,
      mental_load: load,
      is_event: data.type==='event', is_assignment: data.type==='assignment',
      is_restorative: data.isRestorative || load < 0,
      start_time: data.startTime||null, end_time: data.endTime||null,
    };
    try {
      if (data.dates && data.dates.length > 0) {
        await Promise.all(data.dates.map(deadline =>
          fetch(`${API}/tasks?token=${token}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...base, deadline}) })
        ));
      } else {
        await fetch(`${API}/tasks?token=${token}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...base, deadline:data.deadline||null}) });
      }
      await loadTasks();
    } catch {}
  }

  async function editTaskFn(id, data) {
    const token = getToken();
    try {
      await fetch(`${API}/tasks/${id}?token=${token}`, {
        method:'PUT', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ title:data.title, category:data.category, deadline:data.deadline||null, importance:data.importance, implementation_time:data.estTime?parseInt(data.estTime)||30:30, mental_load:data.loadOverride, is_restorative:data.isRestorative }),
      });
      await loadTasks();
    } catch {}
  }

  async function toggleDone(task) {
    const token = getToken();
    try {
      if (task.status==='done') {
        await fetch(`${API}/tasks/${task.id}?token=${token}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({status:'active'}) });
      } else {
        await fetch(`${API}/tasks/${task.id}/done?token=${token}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({}) });
      }
      await loadTasks();
    } catch {}
  }

  async function postponeTask(task) {
    const token = getToken();
    try {
      await fetch(`${API}/tasks/${task.id}/postpone?token=${token}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({}) });
      await loadTasks();
    } catch {}
  }

  async function deleteTask(task) {
    const token = getToken();
    try {
      await fetch(`${API}/tasks/${task.id}?token=${token}`, { method:'DELETE' });
      await loadTasks();
    } catch {}
  }

  async function addSubtask(taskId) {
    if (!newSubtask.trim()) return;
    const token = getToken();
    try {
      await fetch(`${API}/tasks/${taskId}/subtasks?token=${token}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({title:newSubtask.trim()}) });
      setNewSubtask('');
      await loadTasks();
    } catch {}
  }

  function openPanel(name) { setPanel(name); setActiveNav(name); }
  function closePanel() { setPanel(null); setActiveNav('home'); setEditTask(null); setPresetDeadline(null); }

  if (!onboarded) return (
    <div className={`phone${dark?' dark':''}`}>
      <Onboarding onDone={() => { setOnboardedState(true); loadTasks(); }} />
    </div>
  );

  const token = getToken();
  const name = getName();
  const syncCode = getSyncCode()||'------';
  const events = tasks.filter(t=>t.is_event);
  const regularTasks = tasks.filter(t=>!t.is_event&&!t.is_restorative&&t.mental_load>=0);
  const restorativeTasks = tasks.filter(t=>!t.is_event&&(t.is_restorative||t.mental_load<0));
  const taskCount = regularTasks.filter(t=>t.status!=='done').length;
  const todayStr = today.toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'});

  function renderTask(t, i, arr) {
    const prev = arr[i-1];
    const showSep = prev && prev.category==='School' && t.category!=='School' && t.status!=='done';
    const isExpanded = expandedTask===t.id;
    return (
      <div key={t.id}>
        {showSep && (
          <div className="separator"><div className="sep-line"/><div className="sep-tag"><i className="ti ti-coffee"/> break</div><div className="sep-line"/></div>
        )}
        <div className={`task-item${t.status==='done'?' done':''}`} style={{ flexDirection:'column' }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:'10px', width:'100%' }}>
            <button className={`task-check${t.status==='done'?' checked':''}`} onClick={()=>toggleDone(t)}>
              {t.status==='done'&&<i className="ti ti-check"/>}
            </button>
            <div className="task-body" onClick={()=>setExpandedTask(isExpanded?null:t.id)} style={{ cursor:'pointer' }}>
              <div className="task-type-row">
                <span className="task-type"><i className={`ti ${catIcon[t.category]||'ti-circle'}`} style={{ fontSize:'10px' }}/> {(t.category||'').toUpperCase()}</span>
              </div>
              <div className="task-title">{t.title}</div>
              <div className="task-meta">
                {t.implementation_time&&<><i className="ti ti-clock" style={{ fontSize:'11px' }}/> {t.implementation_time}min</>}
                {t.deadline&&<><i className="ti ti-calendar-event" style={{ fontSize:'11px' }}/> {t.deadline}</>}
                {t.missed_first_date&&<><i className="ti ti-alert-circle" style={{ fontSize:'11px', color:'var(--red)' }}/> Missed</>}
              </div>
              {t.subtasks&&t.subtasks.length>0&&(
                <div style={{ fontSize:'10px', color:'var(--text3)', marginTop:'3px' }}>{t.subtasks.filter(s=>s.done).length}/{t.subtasks.length} subtasks done</div>
              )}
            </div>
            <div className="task-right">
              <LoadPill load={t.mental_load||0}/>
              {t.missed_first_date&&<div className="missed-dot"/>}
              {t.status!=='done'&&(
                <div style={{ display:'flex', gap:'2px' }}>
                  {!t.is_restorative&&<button className="postpone-btn" onClick={()=>postponeTask(t)}><i className="ti ti-clock-pause"/></button>}
                  <button className="postpone-btn" onClick={()=>{setEditTask(t);openPanel('add');}}><i className="ti ti-pencil"/></button>
                  <button className="postpone-btn" style={{ color:'var(--red)' }} onClick={()=>deleteTask(t)}><i className="ti ti-trash"/></button>
                </div>
              )}
              {t.status==='done'&&<button className="postpone-btn" style={{ color:'var(--red)' }} onClick={()=>deleteTask(t)}><i className="ti ti-trash"/></button>}
            </div>
          </div>
          {isExpanded&&(
            <div style={{ width:'100%', paddingTop:'8px', borderTop:'0.5px solid var(--border)', marginTop:'8px' }}>
              {(t.subtasks||[]).map(sub=><SubtaskRow key={sub.id} subtask={sub} token={token} onRefresh={loadTasks}/>)}
              <div style={{ display:'flex', gap:'6px', marginTop:'6px', paddingLeft:'12px' }}>
                <input className="form-input" type="text" placeholder="Add subtask..." value={newSubtask} onChange={e=>setNewSubtask(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addSubtask(t.id)} style={{ flex:1, fontSize:'12px', padding:'6px 10px' }}/>
                <button onClick={()=>addSubtask(t.id)} style={{ padding:'6px 10px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'12px' }}>+</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`phone${dark?' dark':''}`}>
      <div className="header">
        <div className="header-top">
          <div>
            <div className="date-main">{todayStr}</div>
            <div className="date-sub">{loading?'Loading...':`${taskCount} task${taskCount!==1?'s':''} remaining${events.length?` · ${events.length} event${events.length!==1?'s':''}`:''}`}</div>
          </div>
          <div style={{ display:'flex', gap:'6px' }}>
            <button className="icon-btn" onClick={()=>openPanel('settings')}><i className="ti ti-settings"/></button>
            <button className="icon-btn" onClick={()=>setDark(d=>!d)}><i className={`ti ${dark?'ti-sun':'ti-moon'}`}/></button>
          </div>
        </div>
      </div>

      <LoadBar tasks={tasks}/>

      {overloadCount>0&&(
        <div style={{ margin:'0 14px 8px', padding:'9px 12px', background:'#FAEEDA', borderRadius:'10px', fontSize:'11px', color:'#854F0B', lineHeight:1.5 }}>
          <i className="ti ti-info-circle" style={{ fontSize:'12px', verticalAlign:'-1px', marginRight:'5px' }}/>
          {overloadCount} task{overloadCount!==1?'s':''} didn't fit today. Try spreading your study sessions across more days to avoid overload.
        </div>
      )}

      <div className="week-strip-wrap">
        <div className="week-strip">
          {weekDays.map((d,i)=>(
            <div key={i} className={`day-cell${activeDay===i?' active':''}`} onClick={()=>setActiveDay(i)}>
              <span className="day-name">{d.name}</span>
              <span className="day-num">{d.num}</span>
              <div className={`day-dot${(() => {
              const d = new Date(today);
              d.setDate(today.getDate() - todayIdx + i);
              const ds = d.toISOString().split('T')[0];
              return allTasks.some(t => t.deadline === ds) ? ' has' : '';})()} `}/>
            </div>
          ))}
        </div>
      </div>

      <HeatMap allTasks={allTasks}/>

      <div className="task-section">
        <div className="section-header">
          <span className="section-title">{name?`${name}'s day`:'Today'}</span>
        </div>

        {loading&&<div style={{ textAlign:'center', padding:'40px 0', color:'var(--text3)', fontSize:'13px' }}>Loading your tasks...</div>}
        {!loading&&tasks.length===0&&<div style={{ textAlign:'center', padding:'40px 0', color:'var(--text3)', fontSize:'13px', lineHeight:1.6 }}>No tasks yet.<br/>Tap + to add your first task.</div>}

        {events.map(ev=>(
          <div className="event-block" key={ev.id}>
            <i className="ti ti-calendar-event" style={{ fontSize:'18px', color:'var(--accent)', flexShrink:0 }}/>
            <div style={{ flex:1 }}>
              <div className="event-label">EVENT</div>
              <div className="event-title">{ev.title}</div>
              {ev.start_time&&ev.end_time&&<div className="event-time-display">{ev.start_time} – {ev.end_time}</div>}
            </div>
            <div style={{ display:'flex', gap:'4px' }}>
              <button className="postpone-btn" onClick={()=>{setEditTask(ev);openPanel('add');}}><i className="ti ti-pencil"/></button>
              <button className="postpone-btn" style={{ color:'var(--red)' }} onClick={()=>deleteTask(ev)}><i className="ti ti-trash"/></button>
            </div>
          </div>
        ))}

        {regularTasks.map((t,i,arr)=>renderTask(t,i,arr))}

        {restorativeTasks.length>0&&(
          <>
            <div className="separator">
              <div className="sep-line"/>
              <div className="sep-tag"><i className="ti ti-heart" style={{ color:'var(--accent)' }}/> recharge</div>
              <div className="sep-line"/>
            </div>
            {restorativeTasks.map((t,i,arr)=>renderTask(t,i,arr))}
          </>
        )}
      </div>

      <div className="bottom-nav">
        <button className={`nav-btn${activeNav==='home'?' active':''}`} onClick={closePanel}><i className="ti ti-home"/><span>HOME</span></button>
        <button className={`nav-btn${activeNav==='pomo'?' active':''}`} onClick={()=>openPanel('pomo')}><i className="ti ti-clock-hour-4"/><span>FOCUS</span></button>
        <button className="nav-add" onClick={()=>{setEditTask(null);setPresetDeadline(null);openPanel('add');}}><i className="ti ti-plus"/></button>
        <button className={`nav-btn${activeNav==='notes'?' active':''}`} onClick={()=>openPanel('notes')}><i className="ti ti-notes"/><span>NOTES</span></button>
        <button className={`nav-btn${activeNav==='cal'?' active':''}`} onClick={()=>openPanel('cal')}><i className="ti ti-calendar-month"/><span>CALENDAR</span></button>
      </div>

      <AddTaskPanel open={panel==='add'} onClose={closePanel} onAdd={addTask} editTask={editTask} onEdit={editTaskFn} presetDeadline={presetDeadline}/>
      <PomodoroPanel open={panel==='pomo'} onClose={closePanel}/>
      <NotesPanel open={panel==='notes'} onClose={closePanel} token={token}/>
      <CalendarPanel open={panel==='cal'} onClose={closePanel} allTasks={allTasks} onAddWithDate={date=>{setPresetDeadline(date);setEditTask(null);openPanel('add');}}/>
      <SettingsPanel open={panel==='settings'} onClose={closePanel} token={token} syncCode={syncCode}/>
    </div>
  );
}
