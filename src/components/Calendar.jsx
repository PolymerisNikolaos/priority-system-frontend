import React, { useState, useEffect } from 'react';

function Calendar({ token, api }) {
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState('week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);

  const TODAY = new Date();

  useEffect(() => {
    fetch(`${api}/tasks?token=${token}`)
      .then(r => r.json())
      .then(data => setTasks(data));
  }, []);

  const getTasksForDate = (date) => {
    const ds = date.toISOString().split('T')[0];
    return tasks.filter(t => t.deadline && t.deadline === ds);
  };

  const dotColor = (cat) => ({
    school: '#378ADD', life: '#1D9E75', fun: '#EF9F27'
  }[cat] || '#888');

  const chipStyle = (cat, isEvent) => {
    if (isEvent) return { background: '#FBEAF0', color: '#993556' };
    return {
      school: { background: '#E6F1FB', color: '#185FA5' },
      life: { background: '#E1F5EE', color: '#0F6E56' },
      fun: { background: '#FAEEDA', color: '#854F0B' },
    }[cat] || { background: '#f3f4f6', color: '#6b7280' };
  };

  const chipLabel = (cat, isEvent) => {
    if (isEvent) return 'Event';
    return { school: 'School', life: 'Life', fun: 'Fun' }[cat] || cat;
  };

  // ── WEEKLY VIEW ──────────────────────────────────────
  const renderWeek = () => {
    const base = new Date(TODAY);
    const day = base.getDay() || 7;
    base.setDate(base.getDate() - day + 1 + weekOffset * 7);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d;
    });
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const fmt = d => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <button onClick={() => setWeekOffset(w => w - 1)} style={navBtn}>←</button>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a2e' }}>
            {fmt(days[0])} – {fmt(days[6])}
          </span>
          <button onClick={() => setWeekOffset(w => w + 1)} style={navBtn}>→</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '4px' }}>
          {days.map((d, i) => {
            const isToday = d.toDateString() === TODAY.toDateString();
            const ts = getTasksForDate(d);
            return (
              <div
                key={i}
                onClick={() => setSelectedDay({ date: d, tasks: ts })}
                style={{
                  background: 'white',
                  border: `0.5px solid ${isToday ? '#185FA5' : '#e5e7eb'}`,
                  borderRadius: '8px', padding: '6px 4px',
                  minHeight: '80px', cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '10px', color: '#6b7280', textAlign: 'center' }}>{dayNames[i]}</div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: isToday ? '#185FA5' : '#1a1a2e', textAlign: 'center', marginBottom: '4px' }}>
                  {d.getDate()}
                </div>
                {ts.map((t, j) => (
                  <div key={j} style={{
                    ...chipStyle(t.category, t.is_event),
                    fontSize: '9px', padding: '2px 3px', borderRadius: '3px',
                    marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {t.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── MONTHLY VIEW ─────────────────────────────────────
  const renderMonth = () => {
    const base = new Date(TODAY.getFullYear(), TODAY.getMonth() + monthOffset, 1);
    const year = base.getFullYear();
    const month = base.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
    const monthName = base.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <button onClick={() => setMonthOffset(m => m - 1)} style={navBtn}>←</button>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a2e' }}>{monthName}</span>
          <button onClick={() => setMonthOffset(m => m + 1)} style={navBtn}>→</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '3px', marginBottom: '4px' }}>
          {['M','T','W','T','F','S','S'].map((n, i) => (
            <div key={i} style={{ fontSize: '10px', color: '#6b7280', textAlign: 'center', fontWeight: '500' }}>{n}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '3px' }}>
          {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const d = new Date(year, month, i + 1);
            const isToday = d.toDateString() === TODAY.toDateString();
            const ts = getTasksForDate(d);
            return (
              <div
                key={i}
                onClick={() => setSelectedDay({ date: d, tasks: ts })}
                style={{
                  background: 'white',
                  border: `0.5px solid ${isToday ? '#185FA5' : '#e5e7eb'}`,
                  borderRadius: '6px', padding: '4px 3px',
                  minHeight: '50px', cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: '500', color: isToday ? '#185FA5' : '#1a1a2e', textAlign: 'center', marginBottom: '3px' }}>
                  {i + 1}
                </div>
                <div style={{ textAlign: 'center' }}>
                  {ts.map((t, j) => (
                    <span key={j} style={{
                      width: '5px', height: '5px', borderRadius: '50%',
                      background: dotColor(t.category),
                      display: 'inline-block', margin: '1px'
                    }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const navBtn = {
    background: 'none', border: '0.5px solid #e5e7eb',
    borderRadius: '8px', width: '30px', height: '30px',
    cursor: 'pointer', color: '#6b7280', fontSize: '16px'
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '480px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ fontSize: '20px', fontWeight: '600', color: '#1a1a2e', marginBottom: '1rem' }}>
        Calendar
      </div>

      {/* Toggle */}
      <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '8px', padding: '3px', marginBottom: '1rem' }}>
        {['week', 'month'].map(v => (
          <button
            key={v}
            onClick={() => { setView(v); setSelectedDay(null); }}
            style={{
              flex: 1, padding: '6px', fontSize: '13px', border: 'none',
              borderRadius: '6px', cursor: 'pointer',
              background: view === v ? 'white' : 'none',
              color: view === v ? '#1a1a2e' : '#6b7280',
              fontWeight: view === v ? '500' : 'normal',
              boxShadow: view === v ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {view === 'week' ? renderWeek() : renderMonth()}

      {/* Day detail */}
      {selectedDay && (
        <div style={{
          marginTop: '1rem', background: 'white',
          border: '0.5px solid #e5e7eb', borderRadius: '12px', padding: '1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a2e' }}>
              {selectedDay.date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            <button onClick={() => setSelectedDay(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '16px' }}>✕</button>
          </div>
          {selectedDay.tasks.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center', padding: '0.5rem' }}>
              No tasks due this day
            </div>
          ) : selectedDay.tasks.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderTop: '0.5px solid #f3f4f6' }}>
              <span style={{
                ...chipStyle(t.category, t.is_event),
                fontSize: '10px', fontWeight: '500', padding: '2px 7px', borderRadius: '20px', flexShrink: 0
              }}>
                {chipLabel(t.category, t.is_event)}
              </span>
              <span style={{ fontSize: '13px', color: '#1a1a2e' }}>{t.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Calendar;