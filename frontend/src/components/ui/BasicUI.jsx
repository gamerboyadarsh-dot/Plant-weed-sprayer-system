import React, { useRef } from 'react';
import { FernLeaf } from '../leaves/LeafIcons';

export function Card({ children, style = {}, className = '', header = null, action = null, tier = 1, interactive = true }) {
  const cardRef = useRef(null);

  const handlePointerMove = (e) => {
    if (!interactive || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--card-mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--card-mouse-y', `${y}px`);
  };

  const tierClass = tier === 2 ? 'glass-2' : tier === 3 ? 'glass-3' : 'glass-1';

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      className={`${tierClass} ${interactive ? 'glass-interactive' : ''} ${className}`}
      style={{
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        position: 'relative',
        ...style
      }}
    >
      <div style={{ position: 'relative', zIndex: 2 }}>
        {(header || action) && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            {header && <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)' }}>{header}</h3>}
            {action}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function Badge({ children, variant = 'neutral', style = {} }) {
  const styles = {
    fire: {
      background: 'var(--leaf-green-subtle)',
      color: 'var(--leaf-green)',
      borderColor: 'rgba(79, 157, 93, 0.35)'
    },
    suppress: {
      background: 'var(--bark-brown-subtle)',
      color: 'var(--bark-brown)',
      borderColor: 'rgba(138, 90, 59, 0.35)'
    },
    warning: {
      background: 'var(--amber-subtle)',
      color: 'var(--amber)',
      borderColor: 'rgba(227, 178, 60, 0.35)'
    },
    neutral: {
      background: 'var(--bg-surface-2)',
      color: 'var(--text-secondary)',
      borderColor: 'var(--border-subtle)'
    }
  };

  const current = styles[variant] || styles.neutral;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 8px',
        borderRadius: 'var(--radius-full)',
        fontSize: '11px',
        fontWeight: 600,
        fontFamily: 'var(--font-mono)',
        border: '1px solid',
        ...current,
        ...style
      }}
    >
      {children}
    </span>
  );
}

// Magnetic Button with spring physics pull toward cursor
export function Button({ children, onClick, variant = 'primary', size = 'md', icon: Icon, disabled = false, style = {}, magnetic = false, ...props }) {
  const btnRef = useRef(null);
  const isPrimary = variant === 'primary';
  const isSubtle = variant === 'subtle';

  const handleMouseMove = (e) => {
    if (!magnetic || disabled || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // Max 6px magnetic pull
    const pullX = Math.max(-6, Math.min(6, x * 0.25));
    const pullY = Math.max(-6, Math.min(6, y * 0.25));
    btnRef.current.style.transform = `translate(${pullX}px, ${pullY}px)`;
  };

  const handleMouseLeave = () => {
    if (!magnetic || !btnRef.current) return;
    btnRef.current.style.transform = 'translate(0px, 0px)';
  };

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        height: size === 'sm' ? '36px' : '44px',
        padding: size === 'sm' ? '0 14px' : '0 20px',
        borderRadius: 'var(--radius-md)',
        background: isPrimary ? 'var(--leaf-green)' : isSubtle ? 'transparent' : 'var(--glass-2-bg)',
        color: isPrimary ? '#FFFFFF' : 'var(--text-primary)',
        border: `1px solid ${isPrimary ? 'var(--leaf-green)' : 'var(--border-subtle)'}`,
        fontWeight: 500,
        fontSize: size === 'sm' ? 'var(--text-xs)' : 'var(--text-sm)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        boxShadow: isPrimary ? '0 4px 14px rgba(79, 157, 93, 0.35)' : 'none',
        transition: 'background var(--transition-fast), border-color var(--transition-fast), transform 120ms ease-out',
        ...style
      }}
      onMouseDown={(e) => {
        if (!disabled) e.currentTarget.style.transform = 'scale(0.98)';
      }}
      onMouseUp={(e) => {
        if (!disabled) e.currentTarget.style.transform = 'scale(1)';
      }}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  );
}

export function EmptyState({ title = 'No records found', message = 'Adjust your criteria or select another target.', icon: CustomIcon }) {
  return (
    <div
      style={{
        padding: '48px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--bg-surface-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          color: 'var(--text-muted)'
        }}
      >
        {CustomIcon ? <CustomIcon size={24} /> : <FernLeaf size={26} color="var(--text-muted)" />}
      </div>
      <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
        {title}
      </h4>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', maxWidth: '360px' }}>
        {message}
      </p>
    </div>
  );
}
