// ============================================================
// Core Type Definitions for the Shire Isometric Map Builder
// ============================================================

/** Coordinate key used as dictionary key in the grid state, format: "x,y" */
export type CoordinateKey = `${number},${number}`;

/** The six asset categories available in the Shire theme */
export type AssetCategory =
  | 'terrain'
  | 'water'
  | 'trees'
  | 'dwellings'
  | 'buildings'
  | 'characters';

/** A tile asset descriptor loaded from the sprite catalog */
export interface TileAsset {
  /** Unique ID, e.g. "shire-r0-c0" */
  id: string;
  /** Which category this asset belongs to */
  category: AssetCategory;
  /** Row index in the sprite sheet grid */
  row: number;
  /** Column index in the sprite sheet grid */
  col: number;
  /** Human-readable display name */
  name: string;
  /** Resolved public asset URL, e.g. "/shire-map-builder/tiles/shire/r0-c0.png" in production */
  path: string;
}

/** A placed tile on the map (lightweight reference to a TileAsset) */
export interface MapTile {
  id: string;
  category: AssetCategory;
  row: number;
  col: number;
}

/** Each grid cell can hold a terrain layer and an optional character overlay */
export interface CellData {
  terrain?: MapTile;
  character?: MapTile;
}

/** The full grid state — a dictionary keyed by "x,y" coordinate strings */
export type GridState = Record<CoordinateKey, CellData>;

/** Snapshot stored in the undo/redo history stack */
export interface HistoryEntry {
  mapData: GridState;
}

/** Interaction mode for the canvas */
export type ToolMode = 'paint' | 'erase';

// ============================================================
// Zustand Store Interface
// ============================================================

export interface MapStore {
  // --- Grid data ---
  gridSize: number;
  mapData: GridState;

  // --- Selection ---
  selectedTile: TileAsset | null;
  activeCategory: AssetCategory;

  // --- Undo/Redo ---
  past: HistoryEntry[];
  future: HistoryEntry[];

  // --- Tool mode ---
  toolMode: ToolMode;

  // --- Actions: Grid ---
  setGridSize: (size: number) => void;
  setToolMode: (mode: ToolMode) => void;

  // --- Actions: Selection ---
  setSelectedTile: (tile: TileAsset | null) => void;
  setActiveCategory: (category: AssetCategory) => void;

  // --- Actions: Tile placement ---
  placeTile: (x: number, y: number) => void;
  eraseTile: (x: number, y: number) => void;

  // --- Actions: History ---
  undo: () => void;
  redo: () => void;

  // --- Actions: Import/Export ---
  importMap: (data: { gridSize: number; mapData: GridState }) => void;
  exportMap: () => { gridSize: number; mapData: GridState };
  clearMap: () => void;
}
