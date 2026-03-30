// ============================================================
// IsometricCanvas — Wrapper that creates the PixiJS Application
// and hosts the interactive map scene.
// ============================================================

import { useRef } from 'react';
import { Application, extend } from '@pixi/react';
import { Container, Sprite, Graphics } from 'pixi.js';
import { MapScene } from './MapScene';

// Register PixiJS components that @pixi/react needs to know about
extend({ Container, Sprite, Graphics });

export function IsometricCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden">
      <Application
        resizeTo={containerRef}
        background={0x87CEEB}
        antialias
      >
        <MapScene />
      </Application>
    </div>
  );
}
