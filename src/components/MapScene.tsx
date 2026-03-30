// ============================================================
// MapScene — PixiJS rendering + interaction for the isometric grid.
// Renders inside <Application> via @pixi/react.
// ============================================================

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useApplication } from '@pixi/react';
import { Assets, Container as PixiContainer, Sprite as PixiSprite, Rectangle, Texture } from 'pixi.js';
import type { FederatedPointerEvent } from 'pixi.js';
import { useMapStore } from '../store/mapStore';
import { SHIRE_ASSETS } from '../data/shireAssets';
import { toKey } from '../store/mapStore';
import {
  cartesianToIso,
  screenToGrid,
  tileScreenPosition,
  depthSort,
  TILE_WIDTH,
  SPRITE_HEIGHT,
} from '../utils/isometric';

// ---- Constants ----
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;

// ============================================================
// Component
// ============================================================

export function MapScene() {
  const { app } = useApplication();

  // ---- Zustand selectors ----
  const gridSize = useMapStore((s) => s.gridSize);
  const mapData = useMapStore((s) => s.mapData);
  const selectedTile = useMapStore((s) => s.selectedTile);
  const toolMode = useMapStore((s) => s.toolMode);
  const placeTile = useMapStore((s) => s.placeTile);
  const eraseTile = useMapStore((s) => s.eraseTile);

  // ---- Local state ----
  const [loaded, setLoaded] = useState(false);
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);

  // Camera state — kept in both a ref (for non-stale event handlers)
  // and React state (to trigger re-renders).
  const [camera, _setCamera] = useState({ ox: 0, oy: 0, zoom: 1 });
  const camRef = useRef(camera);
  const setCamera = useCallback(
    (next: { ox: number; oy: number; zoom: number }) => {
      camRef.current = next;
      _setCamera(next);
    },
    [],
  );

  // ---- Interaction refs ----
  const isPanning = useRef(false);
  const isPainting = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const camStart = useRef({ ox: 0, oy: 0 });
  const spaceHeld = useRef(false);
  const lastPaintKey = useRef<string | null>(null);

  // Refs to avoid stale closures in callbacks
  const toolModeRef = useRef(toolMode);
  toolModeRef.current = toolMode;
  const selectedTileRef = useRef(selectedTile);
  selectedTileRef.current = selectedTile;
  const gridSizeRef = useRef(gridSize);
  gridSizeRef.current = gridSize;
  const placeRef = useRef(placeTile);
  placeRef.current = placeTile;
  const eraseRef = useRef(eraseTile);
  eraseRef.current = eraseTile;

  // ============================================================
  // Texture preloading
  // ============================================================

  useEffect(() => {
    const items = SHIRE_ASSETS.map((a) => ({ alias: a.id, src: a.path }));
    Assets.load(items).then(() => setLoaded(true));
  }, []);

  // ============================================================
  // Camera centering helper
  // ============================================================

  // Helper to compute centered camera for a given grid size
  const computeCenteredCamera = useCallback((gs: number) => {
    if (!app?.screen) return null;
    const topLeft = tileScreenPosition(0, 0);
    const topRight = tileScreenPosition(gs - 1, 0);
    const botLeft = tileScreenPosition(0, gs - 1);
    const botRight = tileScreenPosition(gs - 1, gs - 1);

    const minX = Math.min(topLeft.px, botLeft.px);
    const maxX = Math.max(topRight.px, botRight.px) + TILE_WIDTH;
    const minY = Math.min(topLeft.py, topRight.py);
    const maxY = Math.max(botLeft.py, botRight.py) + SPRITE_HEIGHT;

    return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
  }, [app]);

  // ============================================================
  // Center camera when gridSize changes
  // ============================================================

  useEffect(() => {
    if (!app?.screen) return;
    const c = computeCenteredCamera(gridSize);
    if (!c) return;
    setCamera({
      ox: app.screen.width / 2 - c.cx,
      oy: app.screen.height / 2 - c.cy,
      zoom: 1,
    });
  }, [gridSize, app, setCamera, computeCenteredCamera]);

  // ============================================================
  // Keyboard — space for pan mode, Home to recenter
  // ============================================================

  useEffect(() => {
    const resetCamera = () => {
      const c = computeCenteredCamera(gridSizeRef.current);
      if (c && app?.screen) {
        setCamera({
          ox: app.screen.width / 2 - c.cx,
          oy: app.screen.height / 2 - c.cy,
          zoom: 1,
        });
      }
    };

    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        spaceHeld.current = true;
      }
      if (e.code === 'Home') {
        e.preventDefault();
        resetCamera();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') spaceHeld.current = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('reset-camera', resetCamera);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('reset-camera', resetCamera);
    };
  }, [app, computeCenteredCamera, setCamera]);

  // ============================================================
  // Wheel zoom (DOM event on canvas for reliability)
  // ============================================================

  useEffect(() => {
    const canvas = app?.canvas;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { ox, oy, zoom } = camRef.current;
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * factor));

      // Zoom toward mouse position
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const worldX = (mx - ox) / zoom;
      const worldY = (my - oy) / zoom;

      setCamera({
        ox: mx - worldX * newZoom,
        oy: my - worldY * newZoom,
        zoom: newZoom,
      });
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [app, setCamera]);

  // Prevent right-click context menu on canvas
  useEffect(() => {
    const canvas = app?.canvas;
    if (!canvas) return;
    const block = (e: Event) => e.preventDefault();
    canvas.addEventListener('contextmenu', block);
    return () => canvas.removeEventListener('contextmenu', block);
  }, [app]);

  // ============================================================
  // PNG Export — builds an offscreen container & downloads image
  // ============================================================

  useEffect(() => {
    const handleDownloadPng = async () => {
      if (!app?.renderer) return;

      const gs = gridSizeRef.current;
      const currentMapData = useMapStore.getState().mapData;

      // Compute tight bounding box first
      const topLeft = tileScreenPosition(0, 0);
      const topRight = tileScreenPosition(gs - 1, 0);
      const botLeft = tileScreenPosition(0, gs - 1);
      const botRight = tileScreenPosition(gs - 1, gs - 1);

      const padding = 40;
      const minX = Math.min(topLeft.px, botLeft.px) - padding;
      const maxX = Math.max(topRight.px, botRight.px) + TILE_WIDTH + padding;
      const minY = Math.min(topLeft.py, topRight.py) - padding;
      const maxY = Math.max(botLeft.py, botRight.py) + SPRITE_HEIGHT + padding;

      // Build offscreen container — offset all children to positive space
      const container = new PixiContainer();
      container.sortableChildren = true;

      for (const [coordKey, cell] of Object.entries(currentMapData)) {
        const [xs, ys] = coordKey.split(',');
        const x = Number(xs);
        const y = Number(ys);

        if (cell.terrain) {
          const tex = Assets.get(cell.terrain.id) as Texture;
          if (tex) {
            const pos = tileScreenPosition(x, y);
            const s = new PixiSprite(tex);
            s.x = pos.px - minX;
            s.y = pos.py - minY;
            s.zIndex = depthSort(x, y, false);
            container.addChild(s);
          }
        }

        if (cell.character) {
          const tex = Assets.get(cell.character.id) as Texture;
          if (tex) {
            const pos = tileScreenPosition(x, y);
            const s = new PixiSprite(tex);
            s.x = pos.px - minX;
            s.y = pos.py - minY;
            s.zIndex = depthSort(x, y, true);
            container.addChild(s);
          }
        }
      }

      if (container.children.length === 0) {
        container.destroy();
        return;
      }

      const width = Math.ceil(maxX - minX);
      const height = Math.ceil(maxY - minY);

      // Extract as canvas
      const canvas = app.renderer.extract.canvas({
        target: container,
        resolution: 2,
        frame: new Rectangle(0, 0, width, height),
      }) as HTMLCanvasElement;

      // Download
      const link = document.createElement('a');
      link.download = 'shire-map.png';
      link.href = canvas.toDataURL('image/png');
      link.click();

      // Cleanup
      container.destroy({ children: true });
    };

    window.addEventListener('download-png', handleDownloadPng);
    return () => window.removeEventListener('download-png', handleDownloadPng);
  }, [app]);

  // ============================================================
  // Coordinate helpers
  // ============================================================

  const toGrid = useCallback((sx: number, sy: number) => {
    const { ox, oy, zoom } = camRef.current;
    const wx = (sx - ox) / zoom;
    const wy = (sy - oy) / zoom;
    return screenToGrid(wx, wy, gridSizeRef.current);
  }, []);

  const applyTool = useCallback((gx: number, gy: number) => {
    if (toolModeRef.current === 'paint' && selectedTileRef.current) {
      placeRef.current(gx, gy);
    } else if (toolModeRef.current === 'erase') {
      eraseRef.current(gx, gy);
    }
  }, []);

  // ============================================================
  // Pointer events
  // ============================================================

  const handlePointerDown = useCallback(
    (e: FederatedPointerEvent) => {
      const gx = e.global.x;
      const gy = e.global.y;

      // Middle button, right button, or Space + left button → pan
      if (e.button === 1 || e.button === 2 || (e.button === 0 && spaceHeld.current)) {
        isPanning.current = true;
        panStart.current = { x: gx, y: gy };
        camStart.current = { ox: camRef.current.ox, oy: camRef.current.oy };
        return;
      }

      // Left button → paint / erase
      if (e.button === 0) {
        isPainting.current = true;
        const cell = toGrid(gx, gy);
        if (cell) {
          lastPaintKey.current = toKey(cell.x, cell.y);
          applyTool(cell.x, cell.y);
        }
      }
    },
    [toGrid, applyTool],
  );

  const handlePointerMove = useCallback(
    (e: FederatedPointerEvent) => {
      const gx = e.global.x;
      const gy = e.global.y;

      // Pan drag
      if (isPanning.current) {
        const dx = gx - panStart.current.x;
        const dy = gy - panStart.current.y;
        setCamera({
          ...camRef.current,
          ox: camStart.current.ox + dx,
          oy: camStart.current.oy + dy,
        });
        return;
      }

      // Hover cell tracking
      const cell = toGrid(gx, gy);
      setHoverCell(cell);

      // Paint drag
      if (isPainting.current && cell) {
        const key = toKey(cell.x, cell.y);
        if (key !== lastPaintKey.current) {
          lastPaintKey.current = key;
          applyTool(cell.x, cell.y);
        }
      }
    },
    [toGrid, applyTool, setCamera],
  );

  const handlePointerUp = useCallback(() => {
    isPanning.current = false;
    isPainting.current = false;
    lastPaintKey.current = null;
  }, []);

  // ============================================================
  // Draw callbacks for <pixiGraphics>
  // ============================================================

  /** Draw isometric grid lines */
  const drawGrid = useCallback(
    (g: any) => {
      g.clear();

      // Lines along constant-y (SE direction)
      for (let y = 0; y <= gridSize; y++) {
        const s = cartesianToIso(0, y);
        const e = cartesianToIso(gridSize, y);
        g.moveTo(s.screenX, s.screenY);
        g.lineTo(e.screenX, e.screenY);
      }

      // Lines along constant-x (SW direction)
      for (let x = 0; x <= gridSize; x++) {
        const s = cartesianToIso(x, 0);
        const e = cartesianToIso(x, gridSize);
        g.moveTo(s.screenX, s.screenY);
        g.lineTo(e.screenX, e.screenY);
      }

      g.stroke({ width: 1, color: 0x8b7355, alpha: 0.35 });
    },
    [gridSize],
  );

  /** Draw diamond highlight on the hovered cell */
  const drawHighlight = useCallback(
    (g: any) => {
      g.clear();
      if (!hoverCell) return;

      const { x, y } = hoverCell;
      const top = cartesianToIso(x, y);
      const right = cartesianToIso(x + 1, y);
      const bottom = cartesianToIso(x + 1, y + 1);
      const left = cartesianToIso(x, y + 1);

      g.moveTo(top.screenX, top.screenY);
      g.lineTo(right.screenX, right.screenY);
      g.lineTo(bottom.screenX, bottom.screenY);
      g.lineTo(left.screenX, left.screenY);
      g.closePath();
      g.fill({ color: 0xffffff, alpha: 0.15 });
      g.stroke({ width: 2, color: 0xffffff, alpha: 0.5 });
    },
    [hoverCell],
  );

  /** Invisible full-screen rect for event capture */
  const drawHitArea = useCallback((g: any) => {
    g.clear();
    g.rect(-50000, -50000, 100000, 100000);
    g.fill({ color: 0x000000, alpha: 0.001 });
  }, []);

  // ============================================================
  // Sorted tile list for rendering
  // ============================================================

  const sortedTiles = useMemo(() => {
    if (!loaded) return [];

    const tiles: Array<{
      key: string;
      assetId: string;
      px: number;
      py: number;
      depth: number;
    }> = [];

    for (const [coordKey, cell] of Object.entries(mapData)) {
      const [xs, ys] = coordKey.split(',');
      const x = Number(xs);
      const y = Number(ys);

      if (cell.terrain) {
        const pos = tileScreenPosition(x, y);
        tiles.push({
          key: `t-${coordKey}`,
          assetId: cell.terrain.id,
          px: pos.px,
          py: pos.py,
          depth: depthSort(x, y, false),
        });
      }

      if (cell.character) {
        const pos = tileScreenPosition(x, y);
        tiles.push({
          key: `c-${coordKey}`,
          assetId: cell.character.id,
          px: pos.px,
          py: pos.py,
          depth: depthSort(x, y, true),
        });
      }
    }

    tiles.sort((a, b) => a.depth - b.depth);
    return tiles;
  }, [mapData, loaded]);

  // Hover preview sprite data
  const hoverPreview = useMemo(() => {
    if (!loaded || !hoverCell || !selectedTile || toolMode !== 'paint') return null;
    const pos = tileScreenPosition(hoverCell.x, hoverCell.y);
    return {
      assetId: selectedTile.id,
      px: pos.px,
      py: pos.py,
      depth:
        depthSort(hoverCell.x, hoverCell.y, selectedTile.category === 'characters') +
        0.1,
    };
  }, [loaded, hoverCell, selectedTile, toolMode]);

  // ============================================================
  // Render
  // ============================================================

  if (!loaded) return null;

  return (
    <>
      {/* Invisible hit area — captures all pointer events */}
      <pixiGraphics
        draw={drawHitArea}
        eventMode="static"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerUpOutside={handlePointerUp}
      />

      {/* Camera container — panned / zoomed */}
      <pixiContainer
        x={camera.ox}
        y={camera.oy}
        scale={camera.zoom}
        sortableChildren
      >
        {/* Grid lines (on top of tiles) */}
        <pixiGraphics draw={drawGrid} zIndex={9997} />

        {/* Placed tiles */}
        {sortedTiles.map((t) => (
          <pixiSprite
            key={t.key}
            texture={Assets.get(t.assetId) as Texture}
            x={t.px}
            y={t.py}
            zIndex={t.depth}
          />
        ))}

        {/* Hover cell highlight diamond */}
        <pixiGraphics draw={drawHighlight} zIndex={9998} />

        {/* Hover preview (semi-transparent ghost tile) */}
        {hoverPreview && (
          <pixiSprite
            texture={Assets.get(hoverPreview.assetId) as Texture}
            x={hoverPreview.px}
            y={hoverPreview.py}
            alpha={0.5}
            zIndex={hoverPreview.depth}
          />
        )}
      </pixiContainer>
    </>
  );
}
