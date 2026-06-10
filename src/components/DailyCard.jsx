import React, { useState, useEffect } from 'react';
import AddTask from './AddTask';

function DailyCard({ token, api }) {
  const [tasks, setTasks] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCard = () => {
    fetch(`${api}/card/today?token=${token}`)
      .then(r => r.json())
      .then(data => {
        setTasks(data.tasks || []);
        setLoading(false);
      });
  };

  useEffect(() => { fetchCard(); }, []);

  const markDone = (id) => {
    fetch(`${api}/tasks/${id}/done?token=${token}`, { method: 'POST' })
      .then(() => fetchCard());
  };

  const postpone = (id) => {
    fetch(`${api}/tasks/${id}/postpone?token=${token}`, { method: 'POST' })
      .then(() => fetchCard());
  };

  const drainLoad = tasks
    .filter(t => !t.done && !t.is_separator && !t.is_event && t.mental_load > 0)
    .reduce((s, t) => s + t.mental_load, 0);

  const restoreLoad = tasks
    .filter(t => !t.done && !t.is_separator && !t.is_event && t.mental_load < 0)
    .reduce((s, t) => s + Math.abs(t.mental_load), 0);

  const threshold = 60;
  const pct = Math.min(100, Math.round(drainLoad / threshold * 100));
  const barColor = pct > 90 ? '#A32D2D' : pct > 70 ? '#BA7517' : '#1D9E75';

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  const badgeStyle = (cat, isEvent) => {
    if (isEvent) return { background: '#FBEAF0', color: '#993556' };
    const map = {
      school: { background: '#E6F1FB', color: '#185FA5' },
      life: { background: '#E1F5EE', color: '#0F6E56' },
      fun: { background: '#FAEEDA', color: '#854F0B' },
      break: { background: '#F3F4F6', color: '#6B7280' },
    };
    return map[cat] || map.break;
  };

  const badgeLabel = (cat, isEvent) => {
    if (isEvent) return 'Event';
    return { school: 'School', life: 'Life', fun: 'Fun', break: 'Break' }[cat] || cat;
  };

  if (loading) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
      Loading your card...
    </div>
  );

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '480px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1rem 0.5rem' }}>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>{today}</div>
        <div style={{ fontSize: '20px', fontWeight: '600', color: '#1a1a2e', marginBottom: '0.75rem' }}>
          Today's card
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>
          <span>draining work left</span>
          <span>{drainLoad} / {threshold}</span>
        </div>
        <div style={{ height: '5px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden', marginBottom: '3px' }}>
          <div style={{ height: '5px', width: `${pct}%`, background: barColor, borderRadius: '3px', transition: 'width 0.4s' }} />
        </div>
        {restoreLoad > 0 && (
          <div style={{ fontSize: '11px', color: '#6b7280' }}>
            restorative activities remaining: +{restoreLoad} energy
          </div>
        )}
      </div>

      {/* Task list */}
      <div style={{ padding: '0 1rem' }}>
        <div style={{ fontSize: '11px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.5rem' }}>
          today
        </div>

        {tasks.length === 0 && (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem', fontSize: '14px' }}>
            No tasks for today. Add some below!
          </div>
        )}

        {tasks.map(task => (
          <div key={task.id} style={{
            background: task.is_separator ? '#f9fafb' : 'white',
            border: `0.5px solid ${task.is_separator ? '#e5e7eb' : '#e5e7eb'}`,
            borderStyle: task.is_separator ? 'dashed' : 'solid',
            borderRadius: '12px',
            padding: '11px 13px',
            marginBottom: '8px',
            opacity: task.status === 'done' ? 0.45 : 1,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              {/* Checkbox */}
              {!task.is_event ? (
                <div
                  onClick={() => task.status !== 'done' && markDone(task.id)}
                  style={{
                    width: '20px', height: '20px', borderRadius: '50%',
                    border: `0.5px solid ${task.status === 'done' ? '#1D9E75' : '#d1d5db'}`,
                    background: task.status === 'done' ? '#1D9E75' : 'white',
                    flexShrink: 0, marginTop: '1px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  {task.status === 'done' && <span style={{ color: 'white', fontSize: '12px' }}>✓</span>}
                </div>
              ) : (
                <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                  📅
                </div>
              )}

              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '4px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  <span style={{
                    ...badgeStyle(task.category, task.is_event),
                    fontSize: '10px', fontWeight: '500', padding: '2px 7px',
                    borderRadius: '20px', letterSpacing: '0.4px'
                  }}>
                    {badgeLabel(task.category, task.is_event)}
                  </span>
                  {task.is_assignment && (
                    <span style={{ background: '#f3f4f6', color: '#6b7280', fontSize: '10px', fontWeight: '500', padding: '2px 7px', borderRadius: '20px' }}>
                      Assignment
                    </span>
                  )}
                  {task.mental_load < 0 && !task.is_event && !task.is_assignment && (
                    <span style={{ background: '#E1F5EE', color: '#0F6E56', fontSize: '10px', fontWeight: '500', padding: '2px 7px', borderRadius: '20px' }}>
                      Restorative
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a2e', lineHeight: 1.3 }}>
                  {task.title}
                </div>
                {task.deadline && (
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '3px' }}>
                    🕐 Due {task.deadline}
                  </div>
                )}
                {task.missed_first_date && (
                  <div style={{ fontSize: '11px', color: '#A32D2D', marginTop: '4px' }}>
                    🔴 Missed — first: {task.missed_first_date}
                  </div>
                )}
                {task.status === 'done' && (task.is_event || task.is_assignment) && (
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                    Kept permanently
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {task.status !== 'done' && !task.is_separator && !task.is_event && (
              <div style={{ marginTop: '9px' }}>
                <button
                  onClick={() => postpone(task.id)}
                  style={{
                    fontSize: '12px', color: '#6b7280',
                    background: '#f9fafb', border: '0.5px solid #e5e7eb',
                    borderRadius: '8px', padding: '4px 10px', cursor: 'pointer'
                  }}
                >
                  📅 Tomorrow
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add task */}
      {showAdd && (
        <AddTask
          token={token}
          api={api}
          onDone={() => { setShowAdd(false); fetchCard(); }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      <div style={{ padding: '0.75rem 1rem' }}>
        <button
          onClick={() => setShowAdd(!showAdd)}
          style={{
            width: '100%', background: '#185FA5', color: 'white',
            border: 'none', borderRadius: '12px', padding: '11px',
            fontSize: '14px', fontWeight: '500', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px'
          }}
        >
          {showAdd ? '✕ Cancel' : '+ New task'}
        </button>
      </div>
    </div>
  );
}

export default DailyCard;