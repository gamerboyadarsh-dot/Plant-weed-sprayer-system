import React from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle({ theme, toggleTheme }) {
  const isLight = theme === 'light';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} theme`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-surface-2)',
        border: '1px solid var(--border-subtle)',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        transition: 'all var(--transition-fast)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--text-primary)';
        e.currentTarget.style.borderColor = 'var(--border-strong)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--text-secondary)';
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
      }}
    >
      {isLight ? <Moon size={17} /> : <Sun size={17} />}
    </button>
  );
}
