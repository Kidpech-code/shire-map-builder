// ============================================================
// Isometric Math Utilities
// ============================================================
//
// Coordinate system:
//   - Cartesian (x, y): grid column and row (0-based integers)
//   - Isometric (screenX, screenY): pixel position on the canvas
//
// The tiles use a standard 2:1 isometric ratio.
// Tile sprite dimensions: 130 × 230 px
// Isometric diamond footprint: 130 × 65 px
// ============================================================

/** Width of the isometric diamond (also the sprite width) */
export const TILE_WIDTH = 130;

/** Height of the isometric diamond base (half the width for 2:1 ratio) */
export const TILE_HEIGHT = 65;

/** Full sprite height (includes vertical space for tall objects) */
export const SPRITE_HEIGHT = 230;

/**
 * Y-coordinate within the sprite where the left/right vertices of the
 * isometric diamond sit (the widest row). All tile sprites share this
 * consistent anchor point.
 */
const DIAMOND_MID_Y = 160;

// ============================================================
// Cartesian → Isometric
// ============================================================

export interface IsoPoint {
  screenX: number;
  screenY: number;
}

/**
 * Convert a grid coordinate (x, y) to an isometric screen position.
 * Returns the top-center of the diamond at that grid cell.
 */
export function cartesianToIso(x: number, y: number): IsoPoint {
  return {
    screenX: (x - y) * (TILE_WIDTH / 2),
    screenY: (x + y) * (TILE_HEIGHT / 2),
  };
}

// ============================================================
// Isometric → Cartesian (Mouse Picking)
// ============================================================

export interface GridCoord {
  x: number;
  y: number;
}

/**
 * Convert a screen position back to floating-point grid coordinates.
 * Useful for mapping a mouse position to the grid cell beneath it.
 *
 * Derivation (inverse of the forward transform):
 *   screenX = (x - y) * (TILE_WIDTH / 2)
 *   screenY = (x + y) * (TILE_HEIGHT / 2)
 *
 *   Let a = screenX / (TILE_WIDTH / 2)  =>  a = x - y
 *   Let b = screenY / (TILE_HEIGHT / 2) =>  b = x + y
 *
 *   x = (a + b) / 2
 *   y = (b - a) / 2
 */
export function isoToCartesian(screenX: number, screenY: number): GridCoord {
  const a = screenX / (TILE_WIDTH / 2);
  const b = screenY / (TILE_HEIGHT / 2);
  return {
    x: (a + b) / 2,
    y: (b - a) / 2,
  };
}

/**
 * Snap a screen position to the nearest integer grid cell.
 * Returns null if the result is outside the grid bounds.
 */
export function screenToGrid(
  screenX: number,
  screenY: number,
  gridSize: number,
): GridCoord | null {
  const { x, y } = isoToCartesian(screenX, screenY);
  const gx = Math.floor(x);
  const gy = Math.floor(y);

  if (gx < 0 || gy < 0 || gx >= gridSize || gy >= gridSize) {
    return null;
  }

  return { x: gx, y: gy };
}

// ============================================================
// Depth Sorting
// ============================================================

/**
 * Compute the z-index (draw order) for a tile at grid (x, y).
 *
 * Tiles with higher y should render on top of tiles with the same x,
 * and tiles with higher x should render on top of tiles with the same y.
 * The simple sum `x + y` gives a correct back-to-front order for flat
 * isometric grids. Character overlays add +0.5 so they always render
 * on top of their terrain tile.
 */
export function depthSort(x: number, y: number, isCharacter = false): number {
  return x + y + (isCharacter ? 0.5 : 0);
}

// ============================================================
// Grid Anchor Offset
// ============================================================

/**
 * Compute the pixel offset to position a sprite at grid (x, y).
 *
 * PixiJS sprites are anchored at the top-left by default. We need to
 * offset so the diamond base of the sprite aligns with the iso grid.
 *
 * The anchor point for the sprite: center-bottom of the isometric diamond.
 *   - offsetX = screenX - TILE_WIDTH / 2  (center horizontally)
 *   - offsetY = screenY - (SPRITE_HEIGHT - TILE_HEIGHT) (align base)
 *
 * This ensures tall sprites (buildings, trees) extend *upward* from
 * their grid position.
 */
export function tileScreenPosition(x: number, y: number): { px: number; py: number } {
  const { screenX, screenY } = cartesianToIso(x, y);
  return {
    px: screenX - TILE_WIDTH / 2,
    py: screenY - (DIAMOND_MID_Y - TILE_HEIGHT / 2),
  };
}
