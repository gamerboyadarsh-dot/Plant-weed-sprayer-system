import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

export function Slider({ label, value, min, max, step, unit = '', tooltip = '', onChange }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Compute percentage fill for gradient track
  const percent = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <div style={{ marginBottom: '18px', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-secondary)' }}>
            {label}
          </label>
          {tooltip && (
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <button
                type="button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip(!showTooltip)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center'
                }}
                aria-label={`Tooltip for ${label}`}
              >
                <HelpCircle size={13} />
              </button>
              {showTooltip && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '125%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--glass-3-bg)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    fontSize: '11px',
                    color: 'var(--text-primary)',
                    width: '210px',
                    zIndex: 100,
                    boxShadow: 'var(--shadow-float)',
                    pointerEvents: 'none',
                    lineHeight: 1.4
                  }}
                >
                  {tooltip}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Monospace numeric input sync */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: '68px',
              padding: '3px 6px',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              textAlign: 'right',
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)'
            }}
          />
          {unit && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{unit}</span>}
        </div>
      </div>

      {/* Slider Track with Live Value Bubble */}
      <div 
        style={{ position: 'relative' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isHovered && (
          <div
            style={{
              position: 'absolute',
              bottom: '18px',
              left: `${percent}%`,
              transform: 'translateX(-50%)',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--leaf-green)',
              color: '#FFFFFF',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              fontWeight: 600,
              pointerEvents: 'none',
              zIndex: 10,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}
          >
            {value} {unit}
          </div>
        )}

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            height: '6px',
            appearance: 'none',
            WebkitAppearance: 'none',
            background: `linear-gradient(90deg, var(--leaf-green) 0%, var(--amber) ${percent}%, var(--border-strong) ${percent}%)`,
            borderRadius: 'var(--radius-full)',
            cursor: 'pointer',
            outline: 'none'
          }}
        />
      </div>
    </div>
  );
}

export function AccordionGroup({ title, defaultOpen = true, children, onReset = null }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px', marginBottom: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'none',
            border: 'none',
            padding: '6px 0',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
            {title}
          </span>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {open ? '−' : '+'}
          </span>
        </button>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '11px',
              color: 'var(--leaf-green)',
              cursor: 'pointer',
              padding: '2px 8px'
            }}
            title="Reset this section to defaults"
          >
            Reset
          </button>
        )}
      </div>

      {open && <div style={{ paddingTop: '12px' }}>{children}</div>}
    </div>
  );
}
