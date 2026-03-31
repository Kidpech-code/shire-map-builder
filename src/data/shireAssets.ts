// ============================================================
// Shire Theme Asset Catalog
// ============================================================
// Maps all 72 tile sprites (6 rows × 12 columns) to named entries
// organised by AssetCategory for the palette UI.
// ============================================================

import type { TileAsset, AssetCategory } from '../types';

const tileBasePath = `${import.meta.env.BASE_URL}tiles/shire`;

/** Helper to build a TileAsset entry */
function tile(
  row: number,
  col: number,
  category: AssetCategory,
  name: string,
): TileAsset {
  return {
    id: `shire-r${row}-c${col}`,
    category,
    row,
    col,
    name,
    path: `${tileBasePath}/r${row}-c${col}.png`,
  };
}

// ============================================================
// Row 0 — Terrain (grass, fields, dirt paths)
// ============================================================

const terrainAssets: TileAsset[] = [
  tile(0, 0, 'terrain', 'Grass'),
  tile(0, 1, 'terrain', 'Grass Variant'),
  tile(0, 2, 'terrain', 'Wheat Field Light'),
  tile(0, 3, 'terrain', 'Wheat Field Ripe'),
  tile(0, 4, 'terrain', 'Pumpkin Patch'),
  tile(0, 5, 'terrain', 'Dirt Path Horizontal'),
  tile(0, 6, 'terrain', 'Dirt Path Vertical'),
  tile(0, 7, 'terrain', 'Dirt Path Diagonal'),
  tile(0, 8, 'terrain', 'Dirt Path Corner'),
  tile(0, 9, 'terrain', 'Dirt Path Corner Alt'),
  tile(0, 10, 'terrain', 'Dirt Path Crossroad'),
  tile(0, 11, 'terrain', 'Dirt Path T-Junction'),
];

// ============================================================
// Row 1 — Water (streams, ponds, bridges)
// ============================================================

const waterAssets: TileAsset[] = [
  tile(1, 0, 'water', 'Stream North-South'),
  tile(1, 1, 'water', 'Stream East-West'),
  tile(1, 2, 'water', 'Stream Bend'),
  tile(1, 3, 'water', 'Stream Wide'),
  tile(1, 4, 'water', 'Stream Narrow'),
  tile(1, 5, 'water', 'Grass Base'),
  tile(1, 6, 'water', 'Pond Small'),
  tile(1, 7, 'water', 'Pond Large'),
  tile(1, 8, 'water', 'Bridge over Stream'),
  tile(1, 9, 'water', 'Stone Bridge'),
  tile(1, 10, 'water', 'Bridge Junction'),
  tile(1, 11, 'water', 'Waterfall'),
];

// ============================================================
// Row 2 — Trees & Vegetation
// ============================================================

const treesAssets: TileAsset[] = [
  tile(2, 0, 'trees', 'Oak Tree Small'),
  tile(2, 1, 'trees', 'Oak Tree'),
  tile(2, 2, 'trees', 'Oak Tree Variant'),
  tile(2, 3, 'trees', 'Oak Tree Large'),
  tile(2, 4, 'trees', 'Oak Tree Tall'),
  tile(2, 5, 'trees', 'Fruit Tree Golden'),
  tile(2, 6, 'trees', 'Pear Tree Orchard'),
  tile(2, 7, 'trees', 'Orange Tree Small'),
  tile(2, 8, 'trees', 'Orange Tree'),
  tile(2, 9, 'trees', 'Apple Tree Red'),
  tile(2, 10, 'trees', 'Apple Tree'),
  tile(2, 11, 'trees', 'Apple Tree Fallen'),
];

// ============================================================
// Row 3 — Dwellings (hobbit holes)
// ============================================================

const dwellingsAssets: TileAsset[] = [
  tile(3, 0, 'dwellings', 'Hobbit Hole Green Door'),
  tile(3, 1, 'dwellings', 'Hobbit Hole Stone Entry'),
  tile(3, 2, 'dwellings', 'Hobbit Hole with Bush'),
  tile(3, 3, 'dwellings', 'Hobbit Hole with Tree'),
  tile(3, 4, 'dwellings', 'Hobbit Hole with Bench'),
  tile(3, 5, 'dwellings', 'Hobbit Hole with Mailbox'),
  tile(3, 6, 'dwellings', 'Hobbit Hole Rocks'),
  tile(3, 7, 'dwellings', 'Hobbit Hole Brown Door'),
  tile(3, 8, 'dwellings', 'Hobbit Hole Yellow Door'),
  tile(3, 9, 'dwellings', 'Hobbit Hole Round Window'),
  tile(3, 10, 'dwellings', 'Hobbit Hole Wooden Door'),
  tile(3, 11, 'dwellings', 'Hobbit Hole with Bench Alt'),
];

// ============================================================
// Row 4 — Buildings (inns, mills, walls, ruins)
// ============================================================

const buildingsAssets: TileAsset[] = [
  tile(4, 0, 'buildings', 'Green Dragon Inn Front'),
  tile(4, 1, 'buildings', 'Green Dragon Inn Side'),
  tile(4, 2, 'buildings', 'Wooden Stable'),
  tile(4, 3, 'buildings', 'Water Mill'),
  tile(4, 4, 'buildings', 'Stone Wall Short'),
  tile(4, 5, 'buildings', 'Stone Wall'),
  tile(4, 6, 'buildings', 'Stone Wall Corner'),
  tile(4, 7, 'buildings', 'Stone Wall Tall Corner'),
  tile(4, 8, 'buildings', 'Stone Wall Ruins'),
  tile(4, 9, 'buildings', 'Stone Ruins Small'),
  tile(4, 10, 'buildings', 'Stone Ruins'),
  tile(4, 11, 'buildings', 'Stone Ruins Large'),
];

// ============================================================
// Row 5 — Characters & Props (barrels, carts, signposts)
// ============================================================

const charactersAssets: TileAsset[] = [
  tile(5, 0, 'characters', 'Grass Base'),
  tile(5, 1, 'characters', 'Barrel Single'),
  tile(5, 2, 'characters', 'Barrel Alt'),
  tile(5, 3, 'characters', 'Barrel Double'),
  tile(5, 4, 'characters', 'Barrel Stack'),
  tile(5, 5, 'characters', 'Barrel Pair'),
  tile(5, 6, 'characters', 'Wooden Cart Empty'),
  tile(5, 7, 'characters', 'Wooden Cart Hay'),
  tile(5, 8, 'characters', 'Wooden Cart Covered'),
  tile(5, 9, 'characters', 'Signpost Single'),
  tile(5, 10, 'characters', 'Signpost Crossroads'),
  tile(5, 11, 'characters', 'Signpost Four-Way'),
];

// ============================================================
// Combined flat list + category lookup
// ============================================================

/** All 72 Shire tile assets in a flat array */
export const SHIRE_ASSETS: TileAsset[] = [
  ...terrainAssets,
  ...waterAssets,
  ...treesAssets,
  ...dwellingsAssets,
  ...buildingsAssets,
  ...charactersAssets,
];

/** Assets grouped by category for the palette tabs */
export const ASSETS_BY_CATEGORY: Record<AssetCategory, TileAsset[]> = {
  terrain: terrainAssets,
  water: waterAssets,
  trees: treesAssets,
  dwellings: dwellingsAssets,
  buildings: buildingsAssets,
  characters: charactersAssets,
};

/** Quick lookup by asset ID */
export const ASSET_MAP: Map<string, TileAsset> = new Map(
  SHIRE_ASSETS.map((a) => [a.id, a]),
);
