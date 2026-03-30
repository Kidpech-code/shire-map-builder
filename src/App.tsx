import { useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import { IsometricCanvas } from './components/IsometricCanvas';
import { AssetPicker } from './components/AssetPicker';
import { useMapStore } from './store/mapStore';

function App() {
  const undo = useMapStore((s) => s.undo);
  const redo = useMapStore((s) => s.redo);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (isMeta && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  return (
    <div className="flex flex-col h-screen bg-stone-900 overflow-hidden">
      <Toolbar />
      <IsometricCanvas />
      <AssetPicker />
    </div>
  );
}

export default App
