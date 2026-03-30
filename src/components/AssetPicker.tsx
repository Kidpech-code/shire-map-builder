// ============================================================
// AssetPicker — Bottom panel with category tabs and tile grid
// ============================================================

import { useMapStore } from '../store/mapStore';
import { ASSETS_BY_CATEGORY } from '../data/shireAssets';
import type { AssetCategory, TileAsset } from '../types';

const CATEGORIES: { key: AssetCategory; label: string }[] = [
  { key: 'terrain', label: 'Terrain' },
  { key: 'water', label: 'Water' },
  { key: 'trees', label: 'Trees' },
  { key: 'dwellings', label: 'Dwellings' },
  { key: 'buildings', label: 'Buildings' },
  { key: 'characters', label: 'Props' },
];

export function AssetPicker() {
  const activeCategory = useMapStore((s) => s.activeCategory);
  const setActiveCategory = useMapStore((s) => s.setActiveCategory);
  const selectedTile = useMapStore((s) => s.selectedTile);
  const setSelectedTile = useMapStore((s) => s.setSelectedTile);
  const setToolMode = useMapStore((s) => s.setToolMode);

  const assets = ASSETS_BY_CATEGORY[activeCategory];

  const handleSelect = (asset: TileAsset) => {
    setSelectedTile(asset);
    setToolMode('paint');
  };

  return (
    <div className="bg-stone-800 text-stone-100 border-t border-stone-700 flex-shrink-0 select-none">
      {/* ---- Category tabs ---- */}
      <div className="flex border-b border-stone-700">
        {CATEGORIES.map(({ key, label }) => (
          <button
            key={key}
            className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
              activeCategory === key
                ? 'bg-stone-700 text-amber-400 border-b-2 border-amber-400'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-750'
            }`}
            onClick={() => setActiveCategory(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ---- Tile grid ---- */}
      <div className="p-3 flex gap-2 overflow-x-auto">
        {assets.map((asset) => {
          const isSelected = selectedTile?.id === asset.id;
          return (
            <button
              key={asset.id}
              className={`flex-shrink-0 flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all cursor-pointer ${
                isSelected
                  ? 'bg-amber-700/40 ring-2 ring-amber-400'
                  : 'bg-stone-700/50 hover:bg-stone-600/60'
              }`}
              onClick={() => handleSelect(asset)}
              title={asset.name}
            >
              <img
                src={asset.path}
                alt={asset.name}
                className="w-16 h-auto object-contain pointer-events-none"
                draggable={false}
              />
              <span className="text-[10px] text-stone-300 leading-tight text-center max-w-[72px] truncate">
                {asset.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
