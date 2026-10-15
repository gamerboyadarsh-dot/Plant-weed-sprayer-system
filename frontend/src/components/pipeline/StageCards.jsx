import React, { useState } from 'react';
import { Card, Badge, EmptyState } from '../ui/BasicUI';
import { Maximize2, Split, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export function StageCards({
  originalUrl,
  exgUrl,
  maskUrl,
  overlayUrl,
  loading = false,
  candidates = [],
  hoveredId = null,
  onHoverCandidate = null
}) {
  // Hero Stage Viewer: 0 = Original, 1 = ExG Contrast, 2 = Morphological Mask, 3 = Decision Overlay
  const [activeStage, setActiveStage] = useState(3);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [swipePos, setSwipePos] = useState(50);
  const [showSwipe, setShowSwipe] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const stages = [
    { id: 0, title: '1. Input Frame', desc: 'Normalized RGB feed', src: originalUrl },
    { id: 1, title: '2. ExG Contrast', desc: 'Index: 2G - R - B', src: exgUrl },
    { id: 2, title: '3. Morphology Mask', desc: 'Otsu + noise suppression', src: maskUrl },
    { id: 3, title: '4. Decision Overlay', desc: 'Dual-cue centroid & bounding boxes', src: overlayUrl },
  ];

  const currentHero = stages[activeStage];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Hero Stage Viewer Container */}
      <Card
        tier={1}
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          position: fullscreen ? 'fixed' : 'relative',
          inset: fullscreen ? '20px' : 'auto',
          zIndex: fullscreen ? 9999 : 'auto',
          height: fullscreen ? 'calc(100vh - 40px)' : 'auto'
        }}
      >
        {/* Header Controls Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>
              {currentHero.title}
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {currentHero.desc}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Draggable Swipe Comparison Toggle */}
            <button
              type="button"
              onClick={() => setShowSwipe(!showSwipe)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: 'var(--radius-md)',
                background: showSwipe ? 'var(--leaf-green-subtle)' : 'var(--bg-surface-2)',
                border: `1px solid ${showSwipe ? 'var(--leaf-green)' : 'var(--border-subtle)'}`,
                color: showSwipe ? 'var(--leaf-green)' : 'var(--text-secondary)',
                fontSize: 'var(--text-xs)',
                cursor: 'pointer'
              }}
            >
              <Split size={14} />
              <span>{showSwipe ? 'Exit Swipe' : 'Before / After Swipe'}</span>
            </button>

            {/* Zoom In / Out */}
            <button
              type="button"
              onClick={() => setZoomLevel(z => Math.min(2.5, z + 0.25))}
              style={{
                background: 'var(--bg-surface-2)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(z => Math.max(1, z - 0.25))}
              style={{
                background: 'var(--bg-surface-2)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            {zoomLevel > 1 && (
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                style={{
                  background: 'var(--bg-surface-2)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
                title="Reset Zoom"
              >
                <RotateCcw size={14} />
              </button>
            )}

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setFullscreen(!fullscreen)}
              style={{
                background: 'var(--bg-surface-2)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
              title={fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              <Maximize2 size={14} />
            </button>
          </div>
        </div>

        {/* Viewport Frame */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: fullscreen ? 'calc(100% - 120px)' : '420px',
            background: 'var(--bg-surface-2)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {showSwipe ? (
            /* Draggable Before / After Split View */
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <img
                src={overlayUrl}
                alt="Overlay frame"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: `${swipePos}%`,
                  overflow: 'hidden',
                  borderRight: '2px solid #FFFFFF'
                }}
              >
                <img
                  src={originalUrl}
                  alt="Original frame"
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={swipePos}
                onChange={(e) => setSwipePos(Number(e.target.value))}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'ew-resize',
                  zIndex: 20
                }}
                aria-label="Swipe between raw input and annotated overlay"
              />
            </div>
          ) : (
            /* Main Image with Zoom and Interactive SVG Overlays */
            <div
              style={{
                position: 'relative',
                transform: `scale(${zoomLevel})`,
                transition: 'transform var(--transition-fast)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {currentHero.src ? (
                <img
                  src={currentHero.src}
                  alt={currentHero.title}
                  style={{
                    maxWidth: '100%',
                    maxHeight: fullscreen ? '70vh' : '400px',
                    objectFit: 'contain',
                    borderRadius: 'var(--radius-sm)',
                    opacity: loading ? 0.6 : 1,
                    transition: 'opacity var(--transition-fast)'
                  }}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '60px 20px', color: 'var(--text-muted)' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid rgba(79, 157, 93, 0.2)', borderTopColor: 'var(--leaf-green)', animation: 'spin 1s linear infinite' }} />
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
                    Loading computer vision pipeline...
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Generating ExG heatmap and decision overlays
                  </div>
                </div>
              )}

              {/* Scanning-line sweep animation when loading */}
              {loading && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: 'var(--leaf-green)',
                    boxShadow: '0 0 12px var(--leaf-green)',
                    animation: 'scanline 1.4s infinite ease-in-out'
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* Thumbnail Rail of 4 Stages */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '14px' }}>
          {stages.map((st) => {
            const isActive = activeStage === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  setActiveStage(st.id);
                  setShowSwipe(false);
                }}
                style={{
                  padding: '8px',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'var(--bg-surface-2)' : 'var(--bg-surface-1)',
                  border: `2px solid ${isActive ? 'var(--leaf-green)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  textAlign: 'left',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ aspectRatio: '16/10', borderRadius: '4px', overflow: 'hidden', background: 'var(--bg-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {st.src ? (
                    <img
                      src={st.src}
                      alt={st.title}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(79, 157, 93, 0.2)', borderTopColor: 'var(--leaf-green)', animation: 'spin 1s linear infinite' }} />
                  )}
                </div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: isActive ? 'var(--leaf-green)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {st.title}
                </div>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
