'use client';

import Snowfall from 'react-snowfall';
import { useEffect, useState } from 'react';

export default function SnowfallEffect() {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Set initial size
    const updateSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateSize();

    // Update on resize with debounce
    let timeoutId: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateSize, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Don't render until we have dimensions
  if (windowSize.width === 0) return null;

  return (
    <Snowfall
      key={`${windowSize.width}-${windowSize.height}`}
      color="#e8f4f8"
      snowflakeCount={150}
      radius={[0.5, 3.0]}
      speed={[0.5, 1.5]}
      wind={[-0.5, 1.0]}
      style={{
        position: 'fixed',
        width: '100vw',
        height: '100vh',
        top: 0,
        left: 0,
        zIndex: 9999,
        pointerEvents: 'none'
      }}
    />
  );
}
