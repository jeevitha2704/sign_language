import { useEffect, useState } from 'react';
import { DetectionModeSelector } from '@/components/DetectionModeSelector';
import { StaticDetectionScreen } from '@/components/StaticDetectionScreen';
import { MotionDetectionScreen } from '@/components/MotionDetectionScreen';
import { Toaster } from '@/components/ui/sonner';

type DetectionMode = 'selector' | 'static' | 'motion';

function App() {
  // Get initial mode from URL or default to selector
  const getInitialMode = (): DetectionMode => {
    const path = window.location.pathname;
    if (path === '/static') return 'static';
    if (path === '/motion') return 'motion';
    return 'selector';
  };

  const [detectionMode, setDetectionMode] = useState<DetectionMode>(getInitialMode);

  const handleModeChange = (mode: 'static' | 'motion') => {
    setDetectionMode(mode);
    // Update URL to reflect the mode
    window.history.pushState({}, '', `/${mode}`);
  };

  const handleBackToSelector = () => {
    setDetectionMode('selector');
    // Update URL to reflect the mode
    window.history.pushState({}, '', '/');
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setDetectionMode(getInitialMode());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Render different screens based on mode
  switch (detectionMode) {
    case 'static':
      return (
        <>
          <StaticDetectionScreen onBack={handleBackToSelector} />
          <Toaster />
        </>
      );
    
    case 'motion':
      return (
        <>
          <MotionDetectionScreen onBack={handleBackToSelector} />
          <Toaster />
        </>
      );
    
    case 'selector':
    default:
      return (
        <>
          <DetectionModeSelector 
            selectedMode={detectionMode === 'selector' ? 'static' : detectionMode}
            onModeChange={handleModeChange}
          />
          <Toaster />
        </>
      );
  }
}

export default App;
