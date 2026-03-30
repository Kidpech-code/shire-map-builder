import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  MapStore,
  GridState,
  CoordinateKey,
  AssetCategory,
  TileAsset,
  ToolMode,
  HistoryEntry,
} from '../types';

// ============================================================
// Helpers
// ============================================================

/** Build a coordinate key from grid x/y */
export const toKey = (x: number, y: number): CoordinateKey => `${x},${y}`;

/** Deep-clone grid state (all values are small JSON-safe objects) */
const cloneGrid = (grid: GridState): GridState => JSON.parse(JSON.stringify(grid));

/** Maximum number of undo steps to retain */
const MAX_HISTORY = 50;

/** The default grass tile placed in every cell of a new grid */
const GRASS_TILE = { id: 'shire-r0-c0', category: 'terrain' as const, row: 0, col: 0 };

/** Build a grid fully covered with grass terrain */
function buildGrassGrid(size: number): GridState {
  const grid: GridState = {};
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      grid[toKey(x, y)] = { terrain: { ...GRASS_TILE } };
    }
  }
  return grid;
}

// ============================================================
// Store
// ============================================================

export const useMapStore = create<MapStore>()(
  persist(
    (set, get) => ({
      // ---- Initial state ----
      gridSize: 10,
      mapData: buildGrassGrid(10),
      selectedTile: null,
      activeCategory: 'terrain' as AssetCategory,
      toolMode: 'paint' as ToolMode,
      past: [],
      future: [],

      // ---- Grid size ----
      setGridSize: (size: number) => {
        const clamped = Math.max(3, Math.min(20, size));
        const state = get();

        // Push current state to history before resizing
        const snapshot: HistoryEntry = { mapData: cloneGrid(state.mapData) };

        // Start with a full grass grid, then overlay existing tiles
        const newMapData: GridState = buildGrassGrid(clamped);
        for (const [key, cell] of Object.entries(state.mapData)) {
          const [xStr, yStr] = key.split(',');
          const x = Number(xStr);
          const y = Number(yStr);
          if (x < clamped && y < clamped) {
            newMapData[key as CoordinateKey] = cell;
          }
        }

        set({
          gridSize: clamped,
          mapData: newMapData,
          past: [...state.past, snapshot].slice(-MAX_HISTORY),
          future: [],
        });
      },

      // ---- Selection ----
      setSelectedTile: (tile: TileAsset | null) => set({ selectedTile: tile }),
      setActiveCategory: (category: AssetCategory) => set({ activeCategory: category }),
      setToolMode: (mode: ToolMode) => set({ toolMode: mode }),

      // ---- Tile placement ----
      placeTile: (x: number, y: number) => {
        const state = get();
        const { selectedTile, gridSize, mapData } = state;
        if (!selectedTile) return;
        if (x < 0 || y < 0 || x >= gridSize || y >= gridSize) return;

        // Push snapshot for undo
        const snapshot: HistoryEntry = { mapData: cloneGrid(mapData) };

        const key = toKey(x, y);
        const existing = mapData[key] ?? {};
        const tileRef = {
          id: selectedTile.id,
          category: selectedTile.category,
          row: selectedTile.row,
          col: selectedTile.col,
        };

        // Characters go into the character layer; everything else into terrain
        const updated =
          selectedTile.category === 'characters'
            ? { ...existing, character: tileRef }
            : { ...existing, terrain: tileRef };

        set({
          mapData: { ...mapData, [key]: updated },
          past: [...state.past, snapshot].slice(-MAX_HISTORY),
          future: [],
        });
      },

      // ---- Erase ----
      eraseTile: (x: number, y: number) => {
        const state = get();
        const { gridSize, mapData } = state;
        if (x < 0 || y < 0 || x >= gridSize || y >= gridSize) return;

        const key = toKey(x, y);
        const existing = mapData[key];
        if (!existing) return;

        // If there's a character overlay, remove that first
        if (existing.character) {
          const snapshot: HistoryEntry = { mapData: cloneGrid(mapData) };
          const updated = { ...existing };
          delete updated.character;
          set({
            mapData: { ...mapData, [key]: updated },
            past: [...state.past, snapshot].slice(-MAX_HISTORY),
            future: [],
          });
          return;
        }

        // Already default grass — nothing to erase
        if (existing.terrain?.id === GRASS_TILE.id && !existing.character) return;

        // Otherwise reset terrain back to default grass
        const snapshot: HistoryEntry = { mapData: cloneGrid(mapData) };
        set({
          mapData: { ...mapData, [key]: { terrain: { ...GRASS_TILE } } },
          past: [...state.past, snapshot].slice(-MAX_HISTORY),
          future: [],
        });
      },

      // ---- Undo ----
      undo: () => {
        const state = get();
        if (state.past.length === 0) return;

        const previous = state.past[state.past.length - 1];
        const newPast = state.past.slice(0, -1);

        set({
          mapData: cloneGrid(previous.mapData),
          past: newPast,
          future: [
            { mapData: cloneGrid(state.mapData) },
            ...state.future,
          ],
        });
      },

      // ---- Redo ----
      redo: () => {
        const state = get();
        if (state.future.length === 0) return;

        const next = state.future[0];
        const newFuture = state.future.slice(1);

        set({
          mapData: cloneGrid(next.mapData),
          past: [
            ...state.past,
            { mapData: cloneGrid(state.mapData) },
          ],
          future: newFuture,
        });
      },

      // ---- Import / Export ----
      importMap: (data) => {
        const state = get();
        const snapshot: HistoryEntry = { mapData: cloneGrid(state.mapData) };
        set({
          gridSize: Math.max(3, Math.min(20, data.gridSize)),
          mapData: data.mapData,
          past: [...state.past, snapshot].slice(-MAX_HISTORY),
          future: [],
        });
      },

      exportMap: () => {
        const { gridSize, mapData } = get();
        return { gridSize, mapData: cloneGrid(mapData) };
      },

      clearMap: () => {
        const state = get();
        const snapshot: HistoryEntry = { mapData: cloneGrid(state.mapData) };
        set({
          mapData: buildGrassGrid(state.gridSize),
          past: [...state.past, snapshot].slice(-MAX_HISTORY),
          future: [],
        });
      },
    }),
    {
      name: 'shire-map-builder',
      // Only persist grid data, not selection or history
      partialize: (state) => ({
        gridSize: state.gridSize,
        mapData: state.mapData,
      }),
      // Ensure every cell has at least grass when hydrating from storage
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted as Partial<MapStore>) };
        const size = merged.gridSize;
        const filled = buildGrassGrid(size);
        for (const [key, cell] of Object.entries(merged.mapData)) {
          filled[key as CoordinateKey] = cell;
        }
        merged.mapData = filled;
        return merged;
      },
    },
  ),
);
