import React, { useState } from 'react';

function Feedback({ token, api }) {
  const [comment, setComment] = useState('');
  const [tag, setTag] = useState('bug');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!comment.trim()) return;
    setLoading(true);
    fetch(`${api}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, comment, tag })
    })
      .then(() => {
        setSubmitted(true);
        setLoading(false);
      });
  };

  const tags = [
    { value: 'bug', label: '🐛 Bug', bg: '#FEE2E2', color: '#991B1B' },
    { value: 'confusing', label: '😕 Confusing', bg: '#FEF3C7', color: '#92400E' },
    { value: 'suggestion', label: '💡 Suggestion', bg: '#E1F5EE', color: '#0F6E56' },
  ];

  if (submitted) return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      maxWidth: '480px', margin: '0 auto',
      padding: '2rem 1rem', textAlign: 'center'
    }}>
      <div style={{ fontSize: '48px', marginBottom: '1rem' }}>🙏</div>
      <div style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a2e', marginBottom: '0.5rem' }}>
        Thanks for the feedback!
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '1.5rem' }}>
        It helps make the app better for everyone.
      </div>
      <button
        onClick={() => { setSubmitted(false); setComment(''); setTag('bug'); }}
        style={{
          background: '#185FA5', color: 'white', border: 'none',
          borderRadius: '10px', padding: '10px 24px',
          fontSize: '14px', cursor: 'pointer'
        }}
      >
        Send more feedback
      </button>
    </div>
  );

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      maxWidth: '480px', margin: '0 auto', padding: '1rem'
    }}>
      <div style={{ fontSize: '20px', fontWeight: '600', color: '#1a1a2e', marginBottom: '0.25rem' }}>
        Feedback
      </div>
      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '1.5rem' }}>
        Found something weird? Have an idea? Let us know.
      </div>

      {/* Tag selector */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Type</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {tags.map(t => (
            <button
              key={t.value}
              onClick={() => setTag(t.value)}
              style={{
                flex: 1, padding: '8px 4px',
                background: tag === t.value ? t.bg : '#f9fafb',
                color: tag === t.value ? t.color : '#6b7280',
                border: `0.5px solid ${tag === t.value ? t.color : '#e5e7eb'}`,
                borderRadius: '8px', fontSize: '12px',
                fontWeight: tag === t.value ? '500' : 'normal',
                cursor: 'pointer'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Your comment</div>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Describe what you found or what you'd like to see..."
          rows={5}
          style={{
            width: '100%', padding: '10px 12px',
            borderRadius: '10px', border: '0.5px solid #e5e7eb',
            fontSize: '14px', outline: 'none', resize: 'vertical',
            fontFamily: 'Arial, sans-serif', boxSizing: 'border-box'
          }}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !comment.trim()}
        style={{
          width: '100%', background: comment.trim() ? '#185FA5' : '#93C5FD',
          color: 'white', border: 'none', borderRadius: '10px',
          padding: '11px', fontSize: '14px', fontWeight: '500',
          cursor: comment.trim() ? 'pointer' : 'not-allowed'
        }}
      >
        {loading ? 'Sending...' : 'Send feedback'}
      </button>
    </div>
  );
}

export default Feedback;