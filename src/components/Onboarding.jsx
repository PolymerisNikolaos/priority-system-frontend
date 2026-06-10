import React, { useState } from 'react';

function Onboarding({ onComplete }) {
  const [name, setName] = useState('');

  const handleSubmit = () => {
    if (name.trim()) {
      onComplete(name.trim());
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'Arial, sans-serif',
      background: '#f9fafb'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '2rem',
        width: '100%',
        maxWidth: '360px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        border: '0.5px solid #e5e7eb'
      }}>
        <div style={{ fontSize: '32px', marginBottom: '0.5rem' }}>👋</div>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#1a1a2e', marginBottom: '0.5rem' }}>
          Welcome to Priority System
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '1.5rem' }}>
          Your personal ADHD-friendly daily planner. What's your name?
        </p>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: '10px',
            border: '0.5px solid #e5e7eb',
            fontSize: '15px',
            marginBottom: '1rem',
            outline: 'none',
            boxSizing: 'border-box'
          }}
          autoFocus
        />
        <button
          onClick={handleSubmit}
          style={{
            width: '100%',
            padding: '11px',
            background: '#185FA5',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Let's go →
        </button>
      </div>
    </div>
  );
}

export default Onboarding;