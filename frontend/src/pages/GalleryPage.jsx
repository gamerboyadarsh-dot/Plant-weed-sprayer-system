import React, { useState, useEffect, useMemo } from 'react';
import { Card, Badge } from '../components/ui/BasicUI';
import { usePipeline } from '../context/PipelineContext';

export function GalleryPage({ onSelectAndNavigate }) {
  const { imagesList, selectImageByName } = usePipeline();
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All Benchmarks', accent: 'var(--text-muted)' },
    { id: 'weed', label: 'Weed Targets', accent: 'var(--maple-red)' },
    { id: 'crop', label: 'Crop Blades', accent: 'var(--leaf-green)' },
    { id: 'background', label: 'Bare Soil', accent: 'var(--bark-brown)' },
  ];

  const filteredImages = useMemo(() => {
    if (activeCategory === 'all') return imagesList;
    return imagesList.filter(img => img.class === activeCategory);
  }, [imagesList, activeCategory]);

  const handleCardClick = (filename) => {
    selectImageByName(filename);
    if (onSelectAndNavigate) {
      onSelectAndNavigate('pipeline');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Category Tabs using consistent autumn semantic colors */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          const count = cat.id === 'all'
            ? imagesList.length
            : imagesList.filter(img => img.class === cat.id).length;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                background: isActive ? 'var(--bg-surface-2)' : 'transparent',
                border: '1px solid',
                borderColor: isActive ? 'var(--border-strong)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 400,
                fontSize: 'var(--text-xs)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: cat.accent }} />
              <span>{cat.label}</span>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-surface-1)',
                  color: 'var(--text-muted)'
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid of Image Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
        {filteredImages.map((img) => {
          const isWeed = img.class === 'weed';
          const isCrop = img.class === 'crop';

          return (
            <div
              key={img.filename}
              onClick={() => handleCardClick(img.filename)}
              style={{
                background: 'var(--bg-surface-1)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform var(--transition-fast), border-color var(--transition-fast)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = isWeed ? 'var(--maple-red)' : isCrop ? 'var(--leaf-green)' : 'var(--bark-brown)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              <div style={{ aspectRatio: '4/3', background: 'var(--bg-surface-2)', overflow: 'hidden' }}>
                <img
                  src={img.url}
                  alt={img.filename}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <div style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {img.filename}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-full)',
                    background: isWeed ? 'var(--maple-red-subtle)' : isCrop ? 'var(--leaf-green-subtle)' : 'var(--bark-brown-subtle)',
                    color: isWeed ? 'var(--maple-red)' : isCrop ? 'var(--leaf-green)' : 'var(--bark-brown)',
                    border: `1px solid ${isWeed ? 'rgba(192, 73, 47, 0.3)' : isCrop ? 'rgba(79, 157, 93, 0.3)' : 'rgba(138, 90, 59, 0.3)'}`
                  }}
                >
                  {img.class}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
