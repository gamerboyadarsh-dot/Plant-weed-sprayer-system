import React from 'react';
import { CircleDot, Upload, Home, Info, X, Search } from 'lucide-react';
import { useBackendStatus } from '../../hooks/useBackendStatus';

export function TopBar({ title, selectedImage, onNavigateLanding, onUploadClick, onOpenCommandPalette, dismissNotice, setDismissNotice }) {
  const { online } = useBackendStatus();

  return (
    <header
      style={{
        height: '60px',
        padding: '0 24px',
        background: 'var(--bg-surface-1)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 15
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          type="button"
          onClick={onNavigateLanding}
          title="Return to Landing Page"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            background: 'transparent',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-xs)',
            cursor: 'pointer'
          }}
        >
          <Home size={14} />
          <span>Home</span>
        </button>

        <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)' }}>
          {title}
        </h1>

        {selectedImage && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-subtle)',
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)'
            }}
          >
            <span>Target:</span>
            <strong style={{ color: 'var(--text-primary)' }}>{selectedImage}</strong>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Quick Command Palette Trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          title="Open Command Palette (Ctrl+K or /)"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 12px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-surface-2)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-xs)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--leaf-green)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <Search size={13} style={{ color: 'var(--text-muted)' }} />
          <span>Quick Find</span>
          <kbd
            style={{
              padding: '1px 6px',
              borderRadius: '4px',
              background: 'var(--bg-surface-1)',
              border: '1px solid var(--border-medium)',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)'
            }}
          >
            Ctrl+K
          </kbd>
        </button>

        {/* Upload Custom Shortcut */}
        {onUploadClick && (
          <button
            type="button"
            onClick={onUploadClick}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--leaf-green)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <Upload size={14} />
            <span>Upload Image</span>
          </button>
        )}

        {/* Backend Online/Offline Status Chip */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            background: online ? 'var(--leaf-green-subtle)' : 'var(--maple-red-subtle)',
            border: `1px solid ${online ? 'rgba(79, 157, 93, 0.3)' : 'rgba(192, 73, 47, 0.3)'}`,
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            color: online ? 'var(--leaf-green)' : 'var(--maple-red)'
          }}
        >
          <CircleDot size={12} />
          <span>{online ? 'Backend Online' : 'Connecting...'}</span>
        </div>
      </div>
    </header>
  );
}

export function SimulationNotice({ dismissed, onDismiss }) {
  if (dismissed) return null;

  return (
    <div
      style={{
        padding: '6px 20px',
        background: 'var(--bg-surface-2)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 'var(--text-xs)',
        color: 'var(--text-secondary)',
        gap: '12px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Info size={14} style={{ color: 'var(--amber)', flexShrink: 0 }} />
        <span>
          <strong>Simulation mode:</strong> Algorithmic proof-of-concept. Spray timings and Cartesian coordinates are computed for mathematical verification.
        </span>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notice"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
