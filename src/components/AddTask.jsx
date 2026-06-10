import React, { useState } from 'react';

function AddTask({ token, api, onDone, onCancel }) {
  const [form, setForm] = useState({
    title: '',
    category: 'school',
    deadline: '',
    importance: 50,
    implementation_time: 30,
    mental_load: 0,
    is_event: false,
    is_assignment: false,
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    fetch(`${api}/tasks?token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        mental_load: form.is_assignment ? 0 : form.mental_load,
      })
    }).then(() => onDone());
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '0.5px solid #e5e7eb',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '3px',
    display: 'block'
  };

  return (
    <div style={{
      margin: '0 1rem 0.5rem',
      background: 'white',
      border: '0.5px solid #e5e7eb',
      borderRadius: '12px',
      padding: '1rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a2e', marginBottom: '12px' }}>
        New task
      </div>

      {/* Title */}
      <div style={{ marginBottom: '11px' }}>
        <label style={labelStyle}>Title</label>
        <input
          style={inputStyle}
          placeholder="e.g. Math Chapter 5"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          autoFocus
        />
      </div>

      {/* Category */}
      <div style={{ marginBottom: '11px' }}>
        <label style={labelStyle}>Category</label>
        <select style={inputStyle} value={form.category} onChange={e => set('category', e.target.value)}>
          <option value="school">School</option>
          <option value="life">Life</option>
          <option value="fun">Fun</option>
        </select>
      </div>

      {/* Deadline + Time */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '11px' }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Deadline</label>
          <input
            type="date"
            style={inputStyle}
            value={form.deadline}
            onChange={e => set('deadline', e.target.value)}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Est. time (min)</label>
          <input
            type="number"
            style={inputStyle}
            placeholder="30"
            min="5"
            max="480"
            value={form.implementation_time}
            onChange={e => set('implementation_time', parseInt(e.target.value))}
          />
        </div>
      </div>

      {/* Importance */}
      <div style={{ marginBottom: '11px' }}>
        <label style={labelStyle}>Importance: {form.importance}</label>
        <input
          type="range" min="-100" max="100" step="1"
          style={{ width: '100%' }}
          value={form.importance}
          onChange={e => set('importance', parseInt(e.target.value))}
        />
      </div>

      {/* Mental load */}
      <div style={{ marginBottom: '11px' }}>
        <label style={labelStyle}>Mental load: {form.mental_load}</label>
        <input
          type="range" min="-100" max="100" step="1"
          style={{ width: '100%' }}
          value={form.mental_load}
          onChange={e => set('mental_load', parseInt(e.target.value))}
        />
        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
          negative = restorative
        </div>
      </div>

      {/* Checkboxes */}
      <div style={{ marginBottom: '11px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6b7280' }}>
          <input
            type="checkbox"
            checked={form.is_assignment}
            onChange={e => set('is_assignment', e.target.checked)}
          />
          Assignment (load = 0, never auto-deleted)
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6b7280' }}>
          <input
            type="checkbox"
            checked={form.is_event}
            onChange={e => set('is_event', e.target.checked)}
          />
          Event (never auto-deleted)
        </label>
      </div>

      {/* Buttons */}
      <button
        onClick={handleSubmit}
        style={{
          width: '100%', background: '#185FA5', color: 'white',
          border: 'none', borderRadius: '8px', padding: '9px',
          fontSize: '13px', fontWeight: '500', cursor: 'pointer'
        }}
      >
        + Add task
      </button>
    </div>
  );
}

export default AddTask;