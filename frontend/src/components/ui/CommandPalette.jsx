import React, { useState, useEffect } from 'react';
import { Search, Image as ImageIcon, Layers, BarChart2, ScrollText, Sun, Moon, Download, X } from 'lucide-react';
import { usePipeline } from '../../context/PipelineContext';

export function CommandPalette({ isOpen, onClose, onNavigateTab, theme, toggleTheme }) {
  const { imagesList, selectImageByName } = usePipeline();
  const [query, setQuery] = useState('');

  // Handle global Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredImages = imagesList
    .filter(img => img.filename.toLowerCase().includes(query.toLowerCase()) || img.class.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 8);

  const actions = [
    { label: 'Jump to Vision Pipeline', icon: Layers, action: () => { onNavigateTab('pipeline'); onClose(); } },
    { label: 'Jump to Performance Analytics', icon: BarChart2, action: () => { onNavigateTab('analytics'); onClose(); } },
    { label: 'Jump to Telemetry Event Log', icon: ScrollText, action: () => { onNavigateTab('events'); onClose(); } },
    { label: 'Jump to Benchmark Gallery', icon: ImageIcon, action: () => { onNavigateTab('gallery'); onClose(); } },
    { label: `Toggle Theme (Current: ${theme})`, icon: theme === 'dark' ? Sun : Moon, action: () => { toggleTheme(); onClose(); } },
  ].filter(a => a.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '15vh'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '560px',
          maxWidth: '92vw',
          background: 'var(--glass-3-bg)',
          backdropFilter: 'blur(32px) saturate(160%)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-float)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Search Input Bar */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', gap: '10px' }}>
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input
            autoFocus
            type="text"
            placeholder="Search benchmark frames, actions, or switch views..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-primary)'
            }}
          />
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '10px' }}>
          {/* Quick Actions */}
          {actions.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', padding: '6px 10px' }}>
                Quick Navigation
              </div>
              {actions.map((act, i) => {
                const Icon = act.icon;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={act.action}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--text-xs)',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Icon size={16} style={{ color: 'var(--leaf-green)' }} />
                    <span>{act.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Benchmark Image Frames */}
          {filteredImages.length > 0 && (
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', padding: '6px 10px' }}>
                Benchmark Frames
              </div>
              {filteredImages.map((img) => (
                <button
                  key={img.filename}
                  type="button"
                  onClick={() => {
                    selectImageByName(img.filename);
                    onNavigateTab('pipeline');
                    onClose();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-xs)',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ImageIcon size={14} style={{ color: 'var(--amber)' }} />
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{img.filename}</span>
                  </div>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: img.class === 'weed' ? 'var(--maple-red-subtle)' : img.class === 'crop' ? 'var(--leaf-green-subtle)' : 'var(--bark-brown-subtle)',
                      color: img.class === 'weed' ? 'var(--maple-red)' : img.class === 'crop' ? 'var(--leaf-green)' : 'var(--bark-brown)'
                    }}
                  >
                    {img.class}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer shortcuts tip */}
        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface-2)', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span>Navigation: ↑ ↓ Enter</span>
          <span>Esc to dismiss</span>
        </div>
      </div>
    </div>
  );
}
