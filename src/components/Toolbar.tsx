// ============================================================
// Toolbar — Grid controls, tool mode, undo/redo, import/export
// ============================================================

import { useMapStore } from '../store/mapStore';

export function Toolbar() {
  const gridSize = useMapStore((s) => s.gridSize);
  const setGridSize = useMapStore((s) => s.setGridSize);
  const toolMode = useMapStore((s) => s.toolMode);
  const setToolMode = useMapStore((s) => s.setToolMode);
  const undo = useMapStore((s) => s.undo);
  const redo = useMapStore((s) => s.redo);
  const past = useMapStore((s) => s.past);
  const future = useMapStore((s) => s.future);
  const exportMap = useMapStore((s) => s.exportMap);
  const importMap = useMapStore((s) => s.importMap);
  const clearMap = useMapStore((s) => s.clearMap);

  // ---- Export as JSON download ----
  const handleExport = () => {
    const data = exportMap();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shire-map.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---- Import from JSON file ----
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.gridSize && data.mapData) {
            importMap(data);
          }
        } catch {
          alert('Invalid map file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const btnBase =
    'px-3 py-1.5 rounded text-sm font-medium transition-colors cursor-pointer';
  const btnActive = 'bg-amber-600 text-white';
  const btnDefault = 'bg-stone-700 hover:bg-stone-600 text-stone-200';
  const btnDisabled = 'bg-stone-700 text-stone-500 cursor-not-allowed';

  return (
    <div className="bg-stone-800 text-stone-100 px-4 py-2 flex items-center gap-3 shadow-md z-10 flex-shrink-0 select-none">
      {/* ---- Grid size ---- */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-stone-400 uppercase tracking-wide">Grid</span>
        <button
          className={`${btnBase} ${btnDefault} !px-2`}
          onClick={() => setGridSize(gridSize - 1)}
        >
          −
        </button>
        <span className="w-8 text-center tabular-nums font-mono">{gridSize}</span>
        <button
          className={`${btnBase} ${btnDefault} !px-2`}
          onClick={() => setGridSize(gridSize + 1)}
        >
          +
        </button>
        <button
          className={`${btnBase} ${btnDefault} !px-2`}
          onClick={() => window.dispatchEvent(new CustomEvent('reset-camera'))}
          title="Reset camera (Home)"
        >
          ⌂
        </button>
      </div>

      <div className="w-px h-6 bg-stone-600" />

      {/* ---- Tool mode ---- */}
      <div className="flex items-center gap-1.5">
        <button
          className={`${btnBase} ${toolMode === 'paint' ? btnActive : btnDefault}`}
          onClick={() => setToolMode('paint')}
        >
          🖌 Paint
        </button>
        <button
          className={`${btnBase} ${toolMode === 'erase' ? btnActive : btnDefault}`}
          onClick={() => setToolMode('erase')}
        >
          🧹 Erase
        </button>
      </div>

      <div className="w-px h-6 bg-stone-600" />

      {/* ---- Undo / Redo ---- */}
      <div className="flex items-center gap-1.5">
        <button
          className={`${btnBase} ${past.length > 0 ? btnDefault : btnDisabled}`}
          disabled={past.length === 0}
          onClick={undo}
          title="Undo (Ctrl+Z)"
        >
          ↩ Undo
        </button>
        <button
          className={`${btnBase} ${future.length > 0 ? btnDefault : btnDisabled}`}
          disabled={future.length === 0}
          onClick={redo}
          title="Redo (Ctrl+Shift+Z)"
        >
          ↪ Redo
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* ---- Import / Export / Download / Clear ---- */}
      <div className="flex items-center gap-1.5">
        <button className={`${btnBase} ${btnDefault}`} onClick={handleImport}>
          📂 Import
        </button>
        <button className={`${btnBase} ${btnDefault}`} onClick={handleExport}>
          💾 Export
        </button>
        <button
          className={`${btnBase} ${btnDefault}`}
          onClick={() => window.dispatchEvent(new CustomEvent('download-png'))}
        >
          📷 PNG
        </button>
        <button
          className={`${btnBase} bg-red-800 hover:bg-red-700 text-red-100`}
          onClick={() => {
            if (confirm('Clear the entire map?')) clearMap();
          }}
        >
          🗑 Clear
        </button>
      </div>
    </div>
  );
}
