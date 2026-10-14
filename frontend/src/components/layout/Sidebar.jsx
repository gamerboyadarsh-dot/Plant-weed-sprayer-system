import React from 'react';
import { Layers, BarChart2, ScrollText, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { LeafDropletMark } from '../leaves/LeafIcons';
import { ThemeToggle } from './ThemeToggle';

const NAV_ITEMS = [
  { id: 'pipeline', label: 'Pipeline', icon: Layers },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'events', label: 'Event Log', icon: ScrollText },
  { id: 'gallery', label: 'Dataset Gallery', icon: ImageIcon },
];

export function Sidebar({ activeTab, onTabChange, collapsed, onToggleCollapse, theme, toggleTheme, datasetCount = 200 }) {
  return (
    <aside
      style={{
        width: collapsed ? '72px' : '230px',
        minWidth: collapsed ? '72px' : '230px',
        background: 'var(--bg-surface-1)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 20,
        transition: 'width var(--transition-normal), min-width var(--transition-normal)'
      }}
    >
      {/* Brand Header with organic mark */}
      <div
        style={{
          padding: collapsed ? '18px 12px' : '20px 18px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          position: 'relative'
        }}
      >
        <div 
          onClick={() => onTabChange('landing')}
          role="button"
          tabIndex={0}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            userSelect: 'none'
          }}
          title="Back to Landing Overview"
        >
          <LeafDropletMark size={30} />
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                Weed Sprayer
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                Micro-Dosing PoC
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links with left accent bar for active item */}
      <nav 
        style={{ 
          padding: '16px 0', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '4px',
          flex: 1 
        }}
        aria-label="Main Navigation"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              aria-current={isActive ? 'page' : undefined}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: collapsed ? '10px 0' : '10px 16px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: isActive ? 'var(--bg-surface-2)' : 'transparent',
                border: 'none',
                borderLeft: `3px solid ${isActive ? 'var(--leaf-green)' : 'transparent'}`,
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 400,
                fontSize: 'var(--text-sm)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--bg-surface-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <Icon size={18} style={{ color: isActive ? 'var(--leaf-green)' : 'currentColor', flexShrink: 0 }} />
              {!collapsed && (
                <span style={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap' }}>
                  {item.label}
                </span>
              )}
              {!collapsed && item.id === 'gallery' && (
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    padding: '2px 7px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-surface-hover)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  {datasetCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer controls */}
      <div
        style={{
          padding: '14px 12px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: '8px'
        }}
      >
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            background: 'transparent',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
        >
          {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
        </button>
      </div>
    </aside>
  );
}
