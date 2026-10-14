import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar, SimulationNotice } from './TopBar';

export function AppShell({ activeTab, onTabChange, theme, toggleTheme, children, selectedImage, onUploadClick, onOpenCommandPalette, datasetCount = 200 }) {
  const [collapsed, setCollapsed] = useState(false);
  const [noticeDismissed, setNoticeDismissed] = useState(false);

  const titles = {
    pipeline: 'Vision & Dosing Pipeline',
    analytics: 'Performance Analytics',
    events: 'Structured Telemetry Log',
    gallery: 'Synthetic Benchmark Gallery'
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-canvas)' }}>
      <Sidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        theme={theme}
        toggleTheme={toggleTheme}
        datasetCount={datasetCount}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        <TopBar
          title={titles[activeTab] || 'Precision Weed Sprayer'}
          selectedImage={selectedImage}
          onNavigateLanding={() => onTabChange('landing')}
          onUploadClick={onUploadClick}
          onOpenCommandPalette={onOpenCommandPalette}
        />
        <SimulationNotice
          dismissed={noticeDismissed}
          onDismiss={() => setNoticeDismissed(true)}
        />
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
