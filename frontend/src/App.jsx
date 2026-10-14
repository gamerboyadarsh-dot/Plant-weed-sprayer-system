import React, { useState, useEffect } from 'react';
import { PipelineProvider, usePipeline } from './context/PipelineContext';
import { useTheme } from './hooks/useTheme';
import { AppShell } from './components/layout/AppShell';
import { LandingPage } from './pages/LandingPage';
import { PipelinePage } from './pages/PipelinePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { EventLogPage } from './pages/EventLogPage';
import { GalleryPage } from './pages/GalleryPage';
import { CommandPalette } from './components/ui/CommandPalette';
import { AnimatePresence, motion } from 'framer-motion';

function AppContent() {
  const [activeTab, setActiveTab] = useState('landing'); // 'landing' | 'pipeline' | 'analytics' | 'events' | 'gallery'
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { selectedImage, selectImageByName, imagesList } = usePipeline();

  // Global keyboard shortcuts: Ctrl+K, Cmd+K, or '/' (when not focused in an input/textarea)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      const isInput = activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === '/' && !isInput) {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Navigate directly from event drawer or command palette to pipeline with selected image
  const handleOpenEventInPipeline = (imageName) => {
    selectImageByName(imageName);
    setActiveTab('pipeline');
  };

  return (
    <>
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setIsCommandPaletteOpen(false);
        }}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {activeTab === 'landing' ? (
        <LandingPage
          onLaunchDashboard={() => setActiveTab('pipeline')}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      ) : (
        <AppShell
          activeTab={activeTab}
          onTabChange={setActiveTab}
          theme={theme}
          toggleTheme={toggleTheme}
          selectedImage={selectedImage}
          datasetCount={imagesList.length || 200}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {activeTab === 'pipeline' && <PipelinePage />}
              {activeTab === 'analytics' && <AnalyticsPage />}
              {activeTab === 'events' && <EventLogPage onNavigatePipeline={handleOpenEventInPipeline} />}
              {activeTab === 'gallery' && <GalleryPage onSelectAndNavigate={setActiveTab} />}
            </motion.div>
          </AnimatePresence>
        </AppShell>
      )}
    </>
  );
}

export default function App() {
  return (
    <PipelineProvider>
      <AppContent />
    </PipelineProvider>
  );
}
