import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import {
  Download, Upload, Eraser, Pencil, Pipette, PaintBucket, Trash2, Undo, Redo,
  Image as ImageIcon, Grid3X3, Moon, Sun, Layers, Plus, ArrowUp, ArrowDown,
  Eye, EyeOff, X, Move, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  RefreshCw, Maximize, Minimize, Hash, ZoomIn, ZoomOut, Hand, BoxSelect,
  FlipHorizontal, FlipVertical, RotateCw, Save, FolderOpen, Play, Pause, Monitor, Maximize2,
  Keyboard, RotateCcw, Check
} from 'lucide-react';

// Hotkeys modal component
function HotkeysModal({ hotkeys, setHotkeys, defaultHotkeys, onClose }) {
  const [editingKey, setEditingKey] = useState(null);
  const inputRef = useRef(null);

  const hotkeyLabels = {
    undo: 'Undo',
    redo: 'Redo',
    pencil: 'Pencil',
    picker: 'Color Picker',
    eraser: 'Eraser',
    marquee: 'Selection',
    pan: 'Pan',
    escape: 'Deselect'
  };

  const getKeyName = (key) => {
    const specialKeys = {
      ' ': 'Space',
      'ArrowUp': '↑',
      'ArrowDown': '↓',
      'ArrowLeft': '←',
      'ArrowRight': '→',
      'Escape': 'Esc',
      'Enter': 'Enter',
      'Tab': 'Tab',
      'Backspace': 'Backspace',
      'Delete': 'Delete',
      'Home': 'Home',
      'End': 'End',
      'PageUp': 'PageUp',
      'PageDown': 'PageDown'
    };
    return specialKeys[key] || key;
  };

  const handleKeyDown = (e, action) => {
    e.preventDefault();
    e.stopPropagation();

    const key = e.key;
    const ctrl = e.ctrlKey || e.metaKey;
    const shift = e.shiftKey;
    const alt = e.altKey;

    // Esc to cancel (without modifiers)
    if (key === 'Escape' && !ctrl && !shift && !alt) {
      setEditingKey(null);
      return;
    }

    // Ignore pure modifiers
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
      return;
    }

    const keyName = getKeyName(key);
    let combo = '';
    if (ctrl) combo += 'ctrl+';
    if (shift) combo += 'shift+';
    if (alt) combo += 'alt+';
    combo += keyName.toLowerCase();

    // Check for conflicts
    const newCombo = combo.toLowerCase();
    const conflict = Object.entries(hotkeys).find(([k, v]) => k !== action && v.toLowerCase() === newCombo);
    if (conflict) {
      alert(`This combination is already used for "${hotkeyLabels[conflict[0]]}"`);
      return;
    }

    setHotkeys(prev => ({ ...prev, [action]: combo.toLowerCase() }));
    setEditingKey(null);
  };

  const resetToDefaults = () => {
    if (confirm('Reset all hotkeys to default values?')) {
      setHotkeys(defaultHotkeys);
    }
  };

  const formatKeyCombo = (combo) => {
    if (!combo) return '';
    return combo.split('+').map(part => {
      if (part === 'ctrl') return 'Ctrl';
      if (part === 'shift') return 'Shift';
      if (part === 'alt') return 'Alt';
      const key = part.toUpperCase();
      if (key === 'ARROWUP') return '↑';
      if (key === 'ARROWDOWN') return '↓';
      if (key === 'ARROWLEFT') return '←';
      if (key === 'ARROWRIGHT') return '→';
      return key;
    }).join(' + ');
  };

  // Auto-focus on input when editing starts
  useEffect(() => {
    if (editingKey && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingKey]);

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-neutral-800 rounded-xl border border-neutral-700 shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto custom-scrollbar" 
        onClick={handleModalClick}
      >
        <div className="flex justify-between items-center p-4 border-b border-neutral-700">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Keyboard size={20} className="text-green-500" />
            Hotkeys Settings
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {Object.entries(hotkeyLabels).map(([action, label]) => (
            <div key={action} className="flex justify-between items-center py-2 border-b border-neutral-700">
              <span className="text-neutral-300">{label}</span>
              {editingKey === action ? (
                <input
                  ref={inputRef}
                  autoFocus
                  readOnly
                  className="bg-neutral-700 text-white px-3 py-2 rounded text-xs font-mono border border-blue-500 outline-none cursor-pointer min-w-[140px] text-center"
                  value="Press a key..."
                  onKeyDown={(e) => handleKeyDown(e, action)}
                />
              ) : (
                <button
                  onClick={() => setEditingKey(action)}
                  className="bg-neutral-700 hover:bg-neutral-600 px-2 py-1 rounded text-xs text-white font-mono min-w-[120px]"
                >
                  {formatKeyCombo(hotkeys[action])}
                </button>
              )}
            </div>
          ))}

          <div className="pt-4 flex gap-2">
            <button
              onClick={resetToDefaults}
              className="flex-1 py-2 bg-neutral-700 hover:bg-neutral-600 rounded text-neutral-300 text-sm flex items-center justify-center gap-2"
            >
              <RotateCcw size={14} /> Reset
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm flex items-center justify-center gap-2"
            >
              <Check size={14} /> Done
            </button>
          </div>

          <p className="text-xs text-neutral-500 text-center">
            Click on a combination to change. Esc to cancel.
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Color Helpers ---
const rgbToHex = (r, g, b, a = 255) => {
  if (a === 0) return 'transparent';
  const toHex = (c) => {
    const hex = Math.round(c).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  if (a < 255) return hex + toHex(a);
  return hex;
};

const hexToRgba = (hex) => {
  if (!hex || hex === 'transparent') return [0, 0, 0, 0];
  let r = 0, g = 0, b = 0, a = 255;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 5) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
    a = parseInt(hex[4] + hex[4], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  } else if (hex.length === 9) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
    a = parseInt(hex.substring(7, 9), 16);
  }
  return [r, g, b, a];
};

const modifyColorBrightness = (hex, amount) => {
  if (!hex || hex === 'transparent') return 'transparent';
  const [r, g, b, a] = hexToRgba(hex);
  if (a === 0) return 'transparent';
  // Плавный переход - уменьшаем шаг изменения
  return rgbToHex(
    Math.min(255, Math.max(0, r + amount)),
    Math.min(255, Math.max(0, g + amount)),
    Math.min(255, Math.max(0, b + amount)),
    a
  );
};

export default function App() {
  // --- Main States ---
  const [canvasSize, setCanvasSize] = useState({ w: 16, h: 16 });
  const [inputSize, setInputSize] = useState({ w: 16, h: 16 });
  const [zoom, setZoom] = useState(20);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isFullScreen, setIsFullScreen] = useState(false);

  const createEmptyGrid = (w, h) => Array(h).fill().map(() => Array(w).fill('transparent'));

  const [layers, setLayers] = useState([
    { id: 1, name: 'Layer 1', visible: true, grid: createEmptyGrid(16, 16) }
  ]);
  const [activeLayerId, setActiveLayerId] = useState(1);
  const [nextLayerId, setNextLayerId] = useState(2);

  const [history, setHistory] = useState([]);
  const [redoHistory, setRedoHistory] = useState([]);

  // --- Tools and Settings ---
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [opacity, setOpacity] = useState(100);
  const [tool, setTool] = useState('pencil');
  const [isShadingMode, setIsShadingMode] = useState(false);
  const [isLightenMode, setIsLightenMode] = useState(false);
  const [isDithering, setIsDithering] = useState(false);
  const [symX, setSymX] = useState(false);
  const [symY, setSymY] = useState(false);

  const [isDrawing, setIsDrawing] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  // --- Selection ---
  const [selection, setSelection] = useState(null);
  const [selectionStart, setSelectionStart] = useState(null);

  // --- Panning ---
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const isSpaceDown = useRef(false);

  // --- Palette and Indices ---
  const [isPaletteMode, setIsPaletteMode] = useState(false);
  const [paletteData, setPaletteData] = useState({ list: [], pixelMap: [] });
  const [savedPalettes, setSavedPalettes] = useState([]);

  // --- Reference ---
  const [referenceImage, setReferenceImage] = useState(null);
  const referenceCanvasRef = useRef(null);

  // --- Animation ---
  const [animPlaying, setAnimPlaying] = useState(false);
  const [animFps, setAnimFps] = useState(5);
  const [currentFrame, setCurrentFrame] = useState(0);

  // --- Rotation ---
  const [rotationAngle, setRotationAngle] = useState(0);
  const [showHotkeys, setShowHotkeys] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [importData, setImportData] = useState('');

  // --- 3D Cube ---
  const [show3DCube, setShow3DCube] = useState(false);
  const [cubeRotation, setCubeRotation] = useState({ x: -30, y: 45 });
  const [isDraggingCube, setIsDraggingCube] = useState(false);
  const [cubeTextures, setCubeTextures] = useState({
    front: null,
    back: null,
    left: null,
    right: null,
    top: null,
    bottom: null
  });
  const [selectedFace, setSelectedFace] = useState(null);
  const [editingFace, setEditingFace] = useState(null);
  const frontCanvasRef = useRef(null);
  const backCanvasRef = useRef(null);
  const leftCanvasRef = useRef(null);
  const rightCanvasRef = useRef(null);
  const topCanvasRef = useRef(null);
  const bottomCanvasRef = useRef(null);

  // --- Hotkeys (with user settings) ---
  const defaultHotkeys = {
    undo: 'ctrl+z',
    redo: 'ctrl+shift+z',
    pencil: '1',
    picker: '3',
    eraser: '2',
    replace: '4',
    marquee: 'm',
    pan: 'h',
    escape: 'escape'
  };

  const [hotkeys, setHotkeys] = useState(() => {
    const saved = localStorage.getItem('mc-editor-hotkeys');
    return saved ? JSON.parse(saved) : defaultHotkeys;
  });

  // --- Computed Properties ---
  const activeLayerIndex = layers.findIndex(l => l.id === activeLayerId);
  const activeLayer = layers[activeLayerIndex];

  // Load palettes on startup
  useEffect(() => {
      const saved = localStorage.getItem('mc_palettes');
      if (saved) setSavedPalettes(JSON.parse(saved));
  }, []);

  // --- History ---
  function pushToHistory() {
    setHistory(prev => [...prev.slice(-30), { layers: JSON.parse(JSON.stringify(layers)), size: { ...canvasSize }, selection }]);
    setRedoHistory([]);
  }

  function handleUndo() {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setRedoHistory(p => [...p, { layers, size: canvasSize, selection }]);
    setLayers(prev.layers);
    setCanvasSize(prev.size);
    setSelection(prev.selection);
    setHistory(p => p.slice(0, -1));
  }

  function handleRedo() {
    if (redoHistory.length === 0) return;
    const next = redoHistory[redoHistory.length - 1];
    setHistory(p => [...p, { layers, size: canvasSize, selection }]);
    setLayers(next.layers);
    setCanvasSize(next.size);
    setSelection(next.selection);
    setRedoHistory(p => p.slice(0, -1));
  }

  // --- Fullscreen Mode ---
  function toggleFullScreen() {
      if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(err => {
              console.warn("Fullscreen API blocked, using CSS fallback", err);
              setIsFullScreen(prev => !prev);
          });
      } else {
          if (document.exitFullscreen) {
              document.exitFullscreen();
          }
          setIsFullScreen(false);
      }
  }

  useEffect(() => {
      const handleFsChange = () => setIsFullScreen(!!document.fullscreenElement);
      document.addEventListener('fullscreenchange', handleFsChange);
      return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // --- Save Hotkeys to localStorage ---
  useEffect(() => {
    localStorage.setItem('mc-editor-hotkeys', JSON.stringify(hotkeys));
  }, [hotkeys]);

  // --- Key Match Check ---
  const isKeyMatch = (e, keyCombo) => {
    const combo = keyCombo.toLowerCase();
    const parts = combo.split('+');
    
    const needCtrl = parts.includes('ctrl');
    const needShift = parts.includes('shift');
    const needAlt = parts.includes('alt');
    const needKey = parts[parts.length - 1];
    
    const ctrl = e.ctrlKey || e.metaKey;
    const shift = e.shiftKey;
    const alt = e.altKey;
    
    // Check modifiers
    if (needCtrl !== ctrl) return false;
    if (needShift !== shift) return false;
    if (needAlt !== alt) return false;
    
    // Get key name
    let keyName = e.key.toLowerCase();
    
    // Special cases
    if (e.code === 'Space' && e.key === ' ') keyName = 'space';
    if (e.key === 'ArrowUp') keyName = 'arrowup';
    if (e.key === 'ArrowDown') keyName = 'arrowdown';
    if (e.key === 'ArrowLeft') keyName = 'arrowleft';
    if (e.key === 'ArrowRight') keyName = 'arrowright';
    if (e.key === 'Escape') keyName = 'escape';
    
    return keyName === needKey;
  };

  // --- Mouse Button Check ---
  const isMouseMatch = (e, keyCombo) => {
    const combo = keyCombo.toLowerCase();
    const parts = combo.split('+');
    
    const needCtrl = parts.includes('ctrl');
    const needShift = parts.includes('shift');
    const needAlt = parts.includes('alt');
    const needKey = parts[parts.length - 1];
    
    const ctrl = e.ctrlKey || e.metaKey;
    const shift = e.shiftKey;
    const alt = e.altKey;
    
    // Check modifiers
    if (needCtrl !== ctrl) return false;
    if (needShift !== shift) return false;
    if (needAlt !== alt) return false;
    
    // Get mouse button
    let mouseButton = '';
    if (e.button === 0) mouseButton = 'leftclick';
    if (e.button === 1) mouseButton = 'middleclick';
    if (e.button === 2) mouseButton = 'rightclick';
    if (e.button === 3) mouseButton = 'mouseback';
    if (e.button === 4) mouseButton = 'mouseforward';
    
    return mouseButton === needKey;
  };

  // --- Hotkeys ---
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // Check hotkeys
      if (isKeyMatch(e, hotkeys.undo)) { e.preventDefault(); handleUndo(); return; }
      if (isKeyMatch(e, hotkeys.redo)) { e.preventDefault(); handleRedo(); return; }
      if (isKeyMatch(e, hotkeys.pencil)) { setTool('pencil'); setIsShadingMode(false); setIsLightenMode(false); return; }
      if (isKeyMatch(e, hotkeys.picker)) { setTool('picker'); return; }
      if (isKeyMatch(e, hotkeys.eraser)) { setTool('eraser'); setIsShadingMode(false); setIsLightenMode(false); return; }
      if (isKeyMatch(e, hotkeys.marquee)) { setTool('marquee'); return; }
      if (isKeyMatch(e, hotkeys.pan)) { setTool('pan'); return; }
      if (isKeyMatch(e, hotkeys.escape)) { setSelection(null); return; }

      // Move layer with arrows
      if (e.key === 'ArrowUp') {
          e.preventDefault();
          shiftLayerByOne(0, -1);
      }
      if (e.key === 'ArrowDown') {
          e.preventDefault();
          shiftLayerByOne(0, 1);
      }
      if (e.key === 'ArrowLeft') {
          e.preventDefault();
          shiftLayerByOne(-1, 0);
      }
      if (e.key === 'ArrowRight') {
          e.preventDefault();
          shiftLayerByOne(1, 0);
      }

      if (e.key === 'F11' || (e.altKey && e.key === 'Enter')) {
          e.preventDefault();
          toggleFullScreen();
      }

      if (e.code === 'Space') {
          isSpaceDown.current = true;
          setTool('pan');
          e.preventDefault();
      }
    }

    function handleKeyUp(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.code === 'Space') {
            isSpaceDown.current = false;
            setTool('pencil');
        }
    }
    
    function handleMouseDown(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        // Check mouse hotkeys
        if (isMouseMatch(e, hotkeys.undo)) { e.preventDefault(); handleUndo(); return; }
        if (isMouseMatch(e, hotkeys.redo)) { e.preventDefault(); handleRedo(); return; }
        if (isMouseMatch(e, hotkeys.pencil)) { setTool('pencil'); setIsShadingMode(false); setIsLightenMode(false); return; }
        if (isMouseMatch(e, hotkeys.picker)) { setTool('picker'); return; }
        if (isMouseMatch(e, hotkeys.eraser)) { setTool('eraser'); setIsShadingMode(false); setIsLightenMode(false); return; }
        if (isMouseMatch(e, hotkeys.marquee)) { setTool('marquee'); return; }
        if (isMouseMatch(e, hotkeys.pan)) { setTool('pan'); return; }
    }
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [layers, history, redoHistory, activeLayerId, handleUndo, handleRedo, hotkeys]);

  // --- Mouse Wheel (Zoom) ---
  const handleWheelCanvas = (e) => {
      if (isSpaceDown.current) {
          if (e.deltaY < 0) {
              setZoom(z => Math.min(60, z + 2));
          } else {
              setZoom(z => Math.max(2, z - 2));
          }
      }
  };

  // --- Get Current Color with Alpha ---
  function getCurrentColorHex() {
     if (tool === 'eraser') return 'transparent';
     const base = selectedColor.substring(0, 7);
     if (opacity < 100) {
         const alpha = Math.round((opacity / 100) * 255).toString(16).padStart(2, '0');
         return base + alpha;
     }
     return base;
  }

  // --- System Eyedropper ---
  async function useGlobalEyedropper() {
      if (!window.EyeDropper) {
          alert("Your browser does not support the system eyedropper. Use Chrome or Edge.");
          return;
      }
      try {
          const dropper = new window.EyeDropper();
          const result = await dropper.open();
          setSelectedColor(result.sRGBHex);
          setTool('pencil');
      } catch (e) {
          // User canceled selection
      }
  }

  // --- Palette Logic ---
  function generatePaletteData(overrideGrid = null) {
    if (!activeLayer && !overrideGrid) return;
    const grid = overrideGrid || activeLayer.grid;
    const colorToId = new Map();
    const list = [];
    let nextId = 1;
    const pixelMap = grid.map(row => row.map(color => {
        if (color === 'transparent') return null;
        if (!colorToId.has(color)) {
            colorToId.set(color, nextId);
            list.push({ id: nextId, color: color });
            nextId++;
        }
        return colorToId.get(color);
    }));
    setPaletteData({ list, pixelMap });
  }

  function togglePaletteMode() {
      if (!isPaletteMode) {
          generatePaletteData();
          setIsPaletteMode(true);
      } else {
          setIsPaletteMode(false);
          setPaletteData({ list: [], pixelMap: [] });
      }
  }

  function updatePaletteColor(id, newColor) {
      const newList = paletteData.list.map(item => item.id === id ? { ...item, color: newColor } : item);
      setPaletteData(prev => ({ ...prev, list: newList }));
      if (!activeLayer) return;
      pushToHistory();
      const newGrid = activeLayer.grid.map((row, r) =>
          row.map((pixelColor, c) => {
              if (paletteData.pixelMap[r] && paletteData.pixelMap[r][c] === id) {
                  return newColor;
              }
              return pixelColor;
          })
      );
      const newLayers = layers.map(l => l.id === activeLayerId ? { ...l, grid: newGrid } : l);
      setLayers(newLayers);
  }

  // --- Layer Management ---
  function addLayer(name = null, gridData = null) {
    pushToHistory();
    const newGrid = gridData || createEmptyGrid(canvasSize.w, canvasSize.h);
    const newId = nextLayerId;
    const newLayer = { id: newId, name: name ? String(name) : `Layer ${newId}`, visible: true, grid: newGrid };
    setLayers([newLayer, ...layers]);
    setActiveLayerId(newId);
    setNextLayerId(prev => prev + 1);
  }

  function removeLayer(id) {
    if (layers.length <= 1) return;
    pushToHistory();
    const newLayers = layers.filter(l => l.id !== id);
    setLayers(newLayers);
    if (activeLayerId === id) setActiveLayerId(newLayers[0].id);
  }

  function toggleLayerVisibility(id) {
    const newLayers = layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l);
    setLayers(newLayers);
  }

  function moveLayer(index, direction) {
     const newIndex = index + direction;
     if (newIndex < 0 || newIndex >= layers.length) return;
     const newLayers = [...layers];
     const [movedLayer] = newLayers.splice(index, 1);
     newLayers.splice(newIndex, 0, movedLayer);
     setLayers(newLayers);
  }

  function shiftLayer(dx, dy) {
      if (!activeLayer) return;
      pushToHistory();
      const newGrid = createEmptyGrid(canvasSize.w, canvasSize.h);
      const oldGrid = activeLayer.grid;
      for (let r = 0; r < canvasSize.h; r++) {
          for (let c = 0; c < canvasSize.w; c++) {
              const newR = r + dy;
              const newC = c + dx;
              if (newR >= 0 && newR < canvasSize.h && newC >= 0 && newC < canvasSize.w) {
                  newGrid[newR][newC] = oldGrid[r][c];
              }
          }
      }
      const newLayers = layers.map(l => l.id === activeLayerId ? { ...l, grid: newGrid } : l);
      setLayers(newLayers);
      if (isPaletteMode) generatePaletteData(newGrid);
  }

  function shiftLayerByOne(dx, dy) {
      shiftLayer(dx, dy);
  }

  function clearActiveLayer() {
    if (!activeLayer) return;
    pushToHistory();
    const newGrid = createEmptyGrid(canvasSize.w, canvasSize.h);
    const newLayers = layers.map(l => l.id === activeLayerId ? { ...l, grid: newGrid } : l);
    setLayers(newLayers);
    if (isPaletteMode) generatePaletteData(newGrid);
  }

  function deleteActiveLayer() {
      if (layers.length <= 1) { alert("Cannot delete the last layer!"); return; }
      removeLayer(activeLayerId);
  }

  function mergeDown() {
      if (activeLayerIndex >= layers.length - 1) {
          alert("Cannot merge - this is the bottom layer!");
          return;
      }
      pushToHistory();
      const currentLayer = layers[activeLayerIndex];
      const layerBelow = layers[activeLayerIndex + 1];
      
      const newGrid = currentLayer.grid.map((row, r) => 
          row.map((pixel, c) => {
              // If current pixel is transparent, use pixel from layer below
              if (pixel === 'transparent' || pixel === undefined) {
                  return layerBelow.grid[r][c];
              }
              return pixel;
          })
      );
      
      const newLayers = layers.filter(l => l.id !== layerBelow.id);
      const newCurrentLayer = { ...currentLayer, grid: newGrid };
      newLayers[activeLayerIndex] = newCurrentLayer;
      
      setLayers(newLayers);
  }

  // --- Size and Zoom ---
  function handleResizeCanvas() {
    const newW = parseInt(inputSize.w) || 16;
    const newH = parseInt(inputSize.h) || 16;
    if (newW === canvasSize.w && newH === canvasSize.h) return;
    pushToHistory();
    const newLayers = layers.map(layer => {
        const newGrid = createEmptyGrid(newW, newH);
        for(let r = 0; r < Math.min(canvasSize.h, newH); r++) {
            for(let c = 0; c < Math.min(canvasSize.w, newW); c++) {
                newGrid[r][c] = layer.grid[r][c];
            }
        }
        return { ...layer, grid: newGrid };
    });
    setCanvasSize({ w: newW, h: newH });
    setLayers(newLayers);
    setIsPaletteMode(false);
  }

  function handleScaleCanvas() {
    const newW = parseInt(inputSize.w) || 16;
    const newH = parseInt(inputSize.h) || 16;
    if (newW === canvasSize.w && newH === canvasSize.h) return;
    pushToHistory();
    const ratioW = newW / canvasSize.w;
    const ratioH = newH / canvasSize.h;
    const newLayers = layers.map(layer => {
        const newGrid = createEmptyGrid(newW, newH);
        for(let r = 0; r < newH; r++) {
            for(let c = 0; c < newW; c++) {
                const srcR = Math.floor(r / ratioH);
                const srcC = Math.floor(c / ratioW);
                const safeR = Math.min(srcR, canvasSize.h - 1);
                const safeC = Math.min(srcC, canvasSize.w - 1);
                newGrid[r][c] = layer.grid[safeR][safeC];
            }
        }
        return { ...layer, grid: newGrid };
    });
    setCanvasSize({ w: newW, h: newH });
    setLayers(newLayers);
    setIsPaletteMode(false);
  }

  function changeSize(newSize) {
    if (newSize === canvasSize.w && newSize === canvasSize.h) return;
    setInputSize({ w: newSize, h: newSize });
    pushToHistory();
    const newLayers = layers.map(layer => {
        const newGrid = createEmptyGrid(newSize, newSize);
        for(let r = 0; r < Math.min(canvasSize.h, newSize); r++) {
            for(let c = 0; c < Math.min(canvasSize.w, newSize); c++) {
                newGrid[r][c] = layer.grid[r][c];
            }
        }
        return { ...layer, grid: newGrid };
    });
    setCanvasSize({ w: newSize, h: newSize });
    setLayers(newLayers);
    setIsPaletteMode(false);
  }

  // --- Drawing ---
  function getCompositeColor(r, c) {
     for (let i = layers.length - 1; i >= 0; i--) {
         const layer = layers[i];
         if (!layer.visible) continue;
         const color = layer.grid[r][c];
         if (color !== 'transparent') return color;
     }
     return 'transparent';
  }

  function updatePixelState(newLayers, r, c, color) {
    if (r < 0 || r >= canvasSize.h || c < 0 || c >= canvasSize.w) return;
    if (!isInSelection(r, c)) return;
    const layerIdx = newLayers.findIndex(l => l.id === activeLayerId);
    if (layerIdx === -1) return;
    newLayers[layerIdx].grid[r][c] = color;
  }

  function isInSelection(r, c) {
      if (!selection) return true;
      return (c >= selection.x && c < selection.x + selection.w && r >= selection.y && r < selection.y + selection.h);
  }

  function drawPixelWithSymmetry(startR, startC) {
      if (!activeLayer || !activeLayer.visible) return;
      let newColor = getCurrentColorHex();
      // Smooth shading/lightening - step 10 instead of 25
      if (isShadingMode && tool === 'pencil') {
         const currentColor = activeLayer.grid[startR][startC];
         if (currentColor !== 'transparent') newColor = modifyColorBrightness(currentColor, -10);
      } else if (isLightenMode && tool === 'pencil') {
         const currentColor = activeLayer.grid[startR][startC];
         if (currentColor !== 'transparent') newColor = modifyColorBrightness(currentColor, 10);
      }

      const points = [[startR, startC]];
      if (symX) points.push([startR, canvasSize.w - 1 - startC]);
      if (symY) points.push([canvasSize.h - 1 - startR, startC]);
      if (symX && symY) points.push([canvasSize.h - 1 - startR, canvasSize.w - 1 - startC]);

      const newLayers = JSON.parse(JSON.stringify(layers));
      let changed = false;
      const layerIdx = newLayers.findIndex(l => l.id === activeLayerId);

      points.forEach(([r, c]) => {
          if (r < 0 || r >= canvasSize.h || c < 0 || c >= canvasSize.w) return;
          if (isDithering && (r + c) % 2 !== 0) return;
          if (!isInSelection(r, c)) return;

          if (newLayers[layerIdx].grid[r][c] !== newColor) {
             newLayers[layerIdx].grid[r][c] = newColor;
             changed = true;
          }
      });

      if (changed) {
          setLayers(newLayers);
          if (isPaletteMode) generatePaletteData(newLayers[layerIdx].grid);
      }
  }

  function drawPixelSingle(r, c) {
    if (r < 0 || r >= canvasSize.h || c < 0 || c >= canvasSize.w) return;
    if (tool === 'picker') {
      const color = getCompositeColor(r, c);
      if (color !== 'transparent') setSelectedColor(color);
      setTool('pencil');
      return;
    }
    if (!activeLayer || !activeLayer.visible) return;
    let newColor;
    if (tool === 'eraser') newColor = 'transparent';
    else if (isShadingMode && tool === 'pencil') {
       const currentColor = activeLayer.grid[r][c];
       if (currentColor === 'transparent') return;
       newColor = darkenColor(currentColor);
    } else if (isLightenMode && tool === 'pencil') {
       const currentColor = activeLayer.grid[r][c];
       if (currentColor === 'transparent') return;
       newColor = lightenColor(currentColor);
    } else newColor = getCurrentColorHex();

    if (activeLayer.grid[r][c] === newColor) return;
    const newLayers = JSON.parse(JSON.stringify(layers));
    updatePixelState(newLayers, r, c, newColor);
    setLayers(newLayers);

    const layerIdx = newLayers.findIndex(l => l.id === activeLayerId);
    if (isPaletteMode && layerIdx !== -1) generatePaletteData(newLayers[layerIdx].grid);
  }

  function fillBucket(r, c) {
    if (!activeLayer || !activeLayer.visible) return;
    const targetColor = activeLayer.grid[r][c];
    const newColor = getCurrentColorHex();
    if (targetColor === newColor) return;
    pushToHistory();
    const newGrid = JSON.parse(JSON.stringify(activeLayer.grid));
    const stack = [[r, c]];
    while (stack.length > 0) {
      const [cr, cc] = stack.pop();
      if (cr < 0 || cr >= canvasSize.h || cc < 0 || cc >= canvasSize.w) continue;
      if (!isInSelection(cr, cc)) continue;
      if (newGrid[cr][cc] !== targetColor) continue;
      newGrid[cr][cc] = newColor;
      stack.push([cr + 1, cc], [cr - 1, cc], [cr, cc + 1], [cr, cc - 1]);
    }
    const newLayers = layers.map(l => l.id === activeLayerId ? { ...l, grid: newGrid } : l);
    setLayers(newLayers);
    if (isPaletteMode) generatePaletteData(newGrid);
  }

  function replaceColor(r, c) {
    if (!activeLayer || !activeLayer.visible) return;
    const targetColor = activeLayer.grid[r][c];
    const newColor = getCurrentColorHex();
    if (targetColor === newColor) return;
    pushToHistory();
    const newGrid = activeLayer.grid.map((row, rowIndex) =>
      row.map((pixel, colIndex) => {
          if (isInSelection(rowIndex, colIndex) && pixel === targetColor) return newColor;
          return pixel;
      })
    );
    const newLayers = layers.map(l => l.id === activeLayerId ? { ...l, grid: newGrid } : l);
    setLayers(newLayers);
    if (isPaletteMode) generatePaletteData(newGrid);
  }

  function handleMouseDownCanvas(e, r, c) {
    if (tool === 'pan') {
        setIsPanning(true);
        setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
        return;
    }
    if (tool === 'marquee') {
        setSelectionStart({ r, c });
        setSelection({ x: c, y: r, w: 1, h: 1 });
        setIsDrawing(true);
        return;
    }
    if (tool === 'picker') {
        drawPixelSingle(r, c);
        return;
    }
    if (tool === 'bucket' && !isShadingMode && !isLightenMode) {
        fillBucket(r, c);
        return;
    }
    if (tool === 'replace') {
        replaceColor(r, c);
        return;
    }
    pushToHistory();
    setIsDrawing(true);
    drawPixelWithSymmetry(r, c);
  }

  function handleMouseMoveCanvas(e, r, c) {
    if (isPanning && tool === 'pan') {
        setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
        return;
    }
    if (isDrawing) {
        if (tool === 'marquee' && selectionStart) {
            const minR = Math.min(selectionStart.r, r);
            const maxR = Math.max(selectionStart.r, r);
            const minC = Math.min(selectionStart.c, c);
            const maxC = Math.max(selectionStart.c, c);
            setSelection({ x: minC, y: minR, w: maxC - minC + 1, h: maxR - minR + 1 });
        } else if (tool === 'pencil' || tool === 'eraser') {
            drawPixelWithSymmetry(r, c);
        }
    }
  }

  function handleGlobalMouseUp() {
      setIsDrawing(false);
      setIsPanning(false);
  }

  function handleManualColorChange(e) {
      setSelectedColor(e.target.value);
  }

  // --- Transformations ---
  function applyTransform(transformType) {
      if (!activeLayer) return;
      pushToHistory();
      const newLayers = JSON.parse(JSON.stringify(layers));
      const layerIdx = newLayers.findIndex(l => l.id === activeLayerId);
      const grid = newLayers[layerIdx].grid;
      const newGrid = createEmptyGrid(canvasSize.w, canvasSize.h);

      for (let r = 0; r < canvasSize.h; r++) {
          for (let c = 0; c < canvasSize.w; c++) {
              if (selection && !isInSelection(r, c)) {
                  newGrid[r][c] = grid[r][c];
                  continue;
              }
              const bounds = selection || { x: 0, y: 0, w: canvasSize.w, h: canvasSize.h };
              if (isInSelection(r, c)) {
                  let srcR = r, srcC = c;
                  if (transformType === 'flipH') {
                      srcC = bounds.x + bounds.w - 1 - (c - bounds.x);
                  } else if (transformType === 'flipV') {
                      srcR = bounds.y + bounds.h - 1 - (r - bounds.y);
                  } else if (transformType === 'rot90') {
                      const relR = r - bounds.y;
                      const relC = c - bounds.x;
                      srcR = bounds.y + bounds.w - 1 - relC;
                      srcC = bounds.x + relR;
                  }
                  if (srcR >= 0 && srcR < canvasSize.h && srcC >= 0 && srcC < canvasSize.w) {
                       newGrid[r][c] = grid[srcR][srcC];
                  }
              }
          }
      }
      newLayers[layerIdx].grid = newGrid;
      setLayers(newLayers);
  }

  function applySmoothRotation() {
      if (!activeLayer || rotationAngle === 0) return;
      pushToHistory();
      const bounds = selection || { x: 0, y: 0, w: canvasSize.w, h: canvasSize.h };
      const srcCanvas = document.createElement('canvas');
      srcCanvas.width = bounds.w;
      srcCanvas.height = bounds.h;
      const ctxSrc = srcCanvas.getContext('2d');
      const grid = activeLayer.grid;
      for (let r = 0; r < bounds.h; r++) {
          for (let c = 0; c < bounds.w; c++) {
              const color = grid[bounds.y + r][bounds.x + c];
              if (color !== 'transparent') {
                  ctxSrc.fillStyle = color;
                  ctxSrc.fillRect(c, r, 1, 1);
              }
          }
      }
      const dstCanvas = document.createElement('canvas');
      dstCanvas.width = bounds.w;
      dstCanvas.height = bounds.h;
      const ctxDst = dstCanvas.getContext('2d');
      ctxDst.imageSmoothingEnabled = false;

      ctxDst.translate(bounds.w / 2, bounds.h / 2);
      ctxDst.rotate(rotationAngle * Math.PI / 180);
      ctxDst.translate(-bounds.w / 2, -bounds.h / 2);
      ctxDst.drawImage(srcCanvas, 0, 0);

      const imgData = ctxDst.getImageData(0, 0, bounds.w, bounds.h).data;
      const newLayers = JSON.parse(JSON.stringify(layers));
      const layerIdx = newLayers.findIndex(l => l.id === activeLayerId);

      for (let r = 0; r < bounds.h; r++) {
          for (let c = 0; c < bounds.w; c++) {
              const idx = (r * bounds.w + c) * 4;
              if (imgData[idx+3] > 0) {
                  newLayers[layerIdx].grid[bounds.y + r][bounds.x + c] = rgbToHex(imgData[idx], imgData[idx+1], imgData[idx+2], imgData[idx+3]);
              } else {
                  newLayers[layerIdx].grid[bounds.y + r][bounds.x + c] = 'transparent';
              }
          }
      }
      setLayers(newLayers);
  }

  // --- Palette: Save and Indices ---
  function saveCurrentPalette() {
      if (paletteData.list.length === 0) { alert("Palette is empty!"); return; }
      const name = prompt("Enter palette name:");
      if (!name) return;
      const newPalettes = [...savedPalettes, { name: String(name), colors: paletteData.list.map(i => i.color) }];
      setSavedPalettes(newPalettes);
      localStorage.setItem('mc_palettes', JSON.stringify(newPalettes));
  }

  function loadPalette(colors) {
      colors.forEach((col, idx) => {
          if (paletteData.list[idx]) {
              updatePaletteColor(paletteData.list[idx].id, col);
          }
      });
  }

  // --- Animation ---
  useEffect(() => {
      let interval;
      if (animPlaying) {
          interval = setInterval(() => {
              setCurrentFrame(prev => (prev + 1) % layers.length);
          }, 1000 / animFps);
      }
      return () => clearInterval(interval);
  }, [animPlaying, animFps, layers.length]);

  // --- Load / Export ---
  function handleTextureUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let newW = canvasSize.w;
        let newH = canvasSize.h;
        let shouldResize = false;
        if (img.width !== canvasSize.w || img.height !== canvasSize.h) {
           if (confirm(`Image size (${img.width}x${img.height}) differs from canvas. Resize canvas?`)) {
               newW = img.width;
               newH = img.height;
               shouldResize = true;
           }
        }
        const canvas = document.createElement('canvas');
        canvas.width = newW;
        canvas.height = newH;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, newW, newH).data;
        const newGrid = createEmptyGrid(newW, newH);
        for (let i = 0; i < newW * newH; i++) {
            const r = Math.floor(i / newW);
            const c = i % newW;
            const idx = i * 4;
            if (r < img.height && c < img.width) {
               newGrid[r][c] = rgbToHex(imgData[idx], imgData[idx+1], imgData[idx+2], imgData[idx+3]);
            }
        }
        if (shouldResize) {
            pushToHistory();
            const resizedOldLayers = layers.map(layer => {
                const resizedGrid = createEmptyGrid(newW, newH);
                for(let r = 0; r < Math.min(canvasSize.h, newH); r++) {
                    for(let c = 0; c < Math.min(canvasSize.w, newW); c++) {
                        resizedGrid[r][c] = layer.grid[r][c];
                    }
                }
                return { ...layer, grid: resizedGrid };
            });
            const newId = nextLayerId;
            const newLayer = { id: newId, name: `Imp: ${file.name.substring(0,8)}`, visible: true, grid: newGrid };
            setCanvasSize({ w: newW, h: newH });
            setInputSize({ w: newW, h: newH });
            setLayers([newLayer, ...resizedOldLayers]);
            setActiveLayerId(newId);
            setNextLayerId(prev => prev + 1);
            setIsPaletteMode(false);
        } else {
             addLayer(`Imp: ${file.name.substring(0,8)}`, newGrid);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  // --- Import/Export Data ---
  function exportData() {
      if (!activeLayer) return '';
      const data = [];
      for (let r = 0; r < canvasSize.h; r++) {
          for (let c = 0; c < canvasSize.w; c++) {
              const color = activeLayer.grid[r][c];
              if (color !== 'transparent') {
                  data.push(`${c},${r};${color}`);
              }
          }
      }
      return data.join(';');
  }

  function importDataToCanvas(dataString) {
      if (!dataString.trim()) return;
      pushToHistory();
      const newGrid = createEmptyGrid(canvasSize.w, canvasSize.h);
      
      // Parse format: x,y;#HEX;x,y;#HEX;...
      // First split by semicolon
      const parts = dataString.split(';').filter(s => s.trim());
      
      for (let i = 0; i < parts.length - 1; i += 2) {
          const coordPart = parts[i].trim();
          const colorPart = parts[i + 1].trim();
          
          // Parse coordinates: x,y
          const coords = coordPart.split(',');
          if (coords.length >= 2) {
              const x = parseInt(coords[0].trim());
              const y = parseInt(coords[1].trim());
              const color = colorPart;
              
              if (x >= 0 && x < canvasSize.w && y >= 0 && y < canvasSize.h) {
                  if (/^#[0-9A-Fa-f]{6,9}$/.test(color)) {
                      newGrid[y][x] = color;
                  }
              }
          }
      }

      const newLayers = layers.map(l => l.id === activeLayerId ? { ...l, grid: newGrid } : l);
      setLayers(newLayers);
  }

  // --- 3D Cube Functions ---
  const lastMousePos = useRef({ x: 0, y: 0 });

  function handleCubeMouseDown(e) {
      if (e.target.closest('.cube-face-btn')) return;
      setIsDraggingCube(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
  }

  function handleCubeMouseMove(e) {
      if (!isDraggingCube) return;
      const deltaX = e.clientX - lastMousePos.current.x;
      const deltaY = e.clientY - lastMousePos.current.y;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      
      // Rotation: mouse X moves Y axis, mouse Y moves X axis
      // Increased sensitivity from 0.5 to 1.0
      setCubeRotation(prev => ({
          x: prev.x - deltaY * 1.0,
          y: prev.y + deltaX * 1.0
      }));
  }

  function handleCubeMouseUp() {
      setIsDraggingCube(false);
  }

  // Render textures on canvas
  useEffect(() => {
      if (cubeTextures.front) renderGridToCanvas(cubeTextures.front, frontCanvasRef);
      if (cubeTextures.back) renderGridToCanvas(cubeTextures.back, backCanvasRef);
      if (cubeTextures.left) renderGridToCanvas(cubeTextures.left, leftCanvasRef);
      if (cubeTextures.right) renderGridToCanvas(cubeTextures.right, rightCanvasRef);
      if (cubeTextures.top) renderGridToCanvas(cubeTextures.top, topCanvasRef);
      if (cubeTextures.bottom) renderGridToCanvas(cubeTextures.bottom, bottomCanvasRef);
  }, [cubeTextures]);

  function handleFaceTextureUpload(face, e) {
      e.stopPropagation();
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = canvasSize.w;
              canvas.height = canvasSize.h;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, canvasSize.w, canvasSize.h);
              const textureData = ctx.getImageData(0, 0, canvasSize.w, canvasSize.h).data;
              const grid = [];
              for (let r = 0; r < canvasSize.h; r++) {
                  const row = [];
                  for (let c = 0; c < canvasSize.w; c++) {
                      const i = (r * canvasSize.w + c) * 4;
                      row.push(rgbToHex(textureData[i], textureData[i+1], textureData[i+2], textureData[i+3]));
                  }
                  grid.push(row);
              }
              setCubeTextures(prev => ({ ...prev, [face]: grid }));
          };
          img.src = event.target.result;
      };
      reader.readAsDataURL(file);
      e.target.value = '';
  }

  function openFaceEditor(face) {
      setEditingFace(face);
  }

  function applyFaceToCanvas() {
      if (!selectedFace || !cubeTextures[selectedFace]) return;
      pushToHistory();
      const newGrid = cubeTextures[selectedFace];
      const newLayers = layers.map(l => l.id === activeLayerId ? { ...l, grid: newGrid } : l);
      setLayers(newLayers);
      setEditingFace(null);
  }

  function applyCanvasToFace() {
      if (!selectedFace || !activeLayer) return;
      setCubeTextures(prev => ({ ...prev, [selectedFace]: JSON.parse(JSON.stringify(activeLayer.grid)) }));
  }

  function handleReferenceUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => setReferenceImage(evt.target.result);
    reader.readAsDataURL(file);
  }

  useEffect(() => {
    if (referenceImage && referenceCanvasRef.current) {
      const canvas = referenceCanvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
      };
      img.src = referenceImage;
    }
  }, [referenceImage]);

  function pickColorFromReference(e) {
    if (!referenceCanvasRef.current) return;
    const canvas = referenceCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);
    const ctx = canvas.getContext('2d');
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = rgbToHex(pixel[0], pixel[1], pixel[2], pixel[3]);
    if (hex !== 'transparent') {
      setSelectedColor(hex);
      if (tool !== 'pencil') setTool('pencil');
      if (isShadingMode) setIsShadingMode(false);
      if (isLightenMode) setIsLightenMode(false);
    }
  }

  function handleDownload() {
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize.w;
    canvas.height = canvasSize.h;
    const ctx = canvas.getContext('2d');
    [...layers].reverse().forEach(layer => {
        if (!layer.visible) return;
        for (let r = 0; r < canvasSize.h; r++) {
            for (let c = 0; c < canvasSize.w; c++) {
                const color = layer.grid[r][c];
                if (color !== 'transparent') {
                    ctx.fillStyle = color;
                    ctx.fillRect(c, r, 1, 1);
                }
            }
        }
    });
    const link = document.createElement('a');
    link.download = `texture_${canvasSize.w}x${canvasSize.h}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  // --- Shade/Light Helpers ---
  function darkenColor(hex) {
      return modifyColorBrightness(hex, -10);
  }
  function lightenColor(hex) {
      return modifyColorBrightness(hex, 10);
  }

  // --- Optimized Canvas Rendering ---
  const canvasRef = useRef(null);
  const gridCanvasRef = useRef(null);
  const needsRedraw = useRef(false);

  // Force redraw function
  const forceRedraw = useCallback(() => {
      needsRedraw.current = true;
  }, []);

  // Main canvas rendering
  useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      const w = canvasSize.w;
      const h = canvasSize.h;
      const pixelSize = zoom;

      canvas.width = w * pixelSize;
      canvas.height = h * pixelSize;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw all visible layers
      for (let i = layers.length - 1; i >= 0; i--) {
          const layer = layers[i];
          if (!layer.visible) continue;
          for (let r = 0; r < h; r++) {
              for (let c = 0; c < w; c++) {
                  const color = layer.grid[r][c];
                  if (color !== 'transparent') {
                      ctx.fillStyle = color;
                      ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize, pixelSize);
                  }
              }
          }
      }

      // Draw selection
      if (selection) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 2]);
          ctx.strokeRect(
              selection.x * pixelSize,
              selection.y * pixelSize,
              selection.w * pixelSize,
              selection.h * pixelSize
          );
          ctx.setLineDash([]);
      }
  }, [layers, canvasSize, zoom, selection]);

  // Grid rendering separately
  useEffect(() => {
      const canvas = gridCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      canvas.width = canvasSize.w * zoom;
      canvas.height = canvasSize.h * zoom;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (showGrid) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 0.5;
          for (let i = 0; i <= canvasSize.w; i++) {
              ctx.beginPath();
              ctx.moveTo(i * zoom, 0);
              ctx.lineTo(i * zoom, canvas.height);
              ctx.stroke();
          }
          for (let i = 0; i <= canvasSize.h; i++) {
              ctx.beginPath();
              ctx.moveTo(0, i * zoom);
              ctx.lineTo(canvas.width, i * zoom);
              ctx.stroke();
          }
      }

      // Draw palette indices
      if (isPaletteMode && paletteData.pixelMap.length > 0) {
          ctx.font = `bold ${Math.max(8, zoom / 2.5)}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          for (let r = 0; r < canvasSize.h; r++) {
              for (let c = 0; c < canvasSize.w; c++) {
                  const idx = paletteData.pixelMap[r]?.[c];
                  if (idx !== null && idx !== undefined) {
                      ctx.fillStyle = 'black';
                      ctx.fillText(String(idx), c * zoom + zoom / 2, r * zoom + zoom / 2);
                      ctx.fillStyle = 'white';
                      ctx.lineWidth = 0.5;
                      ctx.strokeText(String(idx), c * zoom + zoom / 2, r * zoom + zoom / 2);
                  }
              }
          }
      }
  }, [canvasSize, zoom, showGrid, isPaletteMode, paletteData]);

  // Handle canvas click
  const handleCanvasPointerDown = useCallback((e) => {
      if (tool === 'pan') {
          setIsPanning(true);
          setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
          return;
      }

      const container = e.currentTarget;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      // Coordinates inside element with transform
      // rect.left/top already account for transform in getBoundingClientRect
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const c = Math.floor(x / zoom);
      const r = Math.floor(y / zoom);

      if (tool === 'marquee') {
          setSelectionStart({ r, c });
          setSelection({ x: c, y: r, w: 1, h: 1 });
          setIsDrawing(true);
          return;
      }

      if (tool === 'picker') {
          drawPixelSingle(r, c);
          return;
      }

      if (tool === 'bucket' && !isShadingMode && !isLightenMode) {
          fillBucket(r, c);
          return;
      }

      if (tool === 'replace') {
          replaceColor(r, c);
          return;
      }

      pushToHistory();
      setIsDrawing(true);
      drawPixelWithSymmetry(r, c);
  }, [tool, zoom, isShadingMode, isLightenMode, drawPixelSingle, fillBucket, replaceColor, drawPixelWithSymmetry]);

  const handleCanvasPointerMove = useCallback((e) => {
      if (isPanning && tool === 'pan') {
          setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
          return;
      }

      if (!isDrawing) return;

      const container = e.currentTarget;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      // Coordinates inside element with transform
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const c = Math.floor(x / zoom);
      const r = Math.floor(y / zoom);

      if (tool === 'marquee' && selectionStart) {
          const minR = Math.min(selectionStart.r, r);
          const maxR = Math.max(selectionStart.r, r);
          const minC = Math.min(selectionStart.c, c);
          const maxC = Math.max(selectionStart.c, c);
          setSelection({ x: minC, y: minR, w: maxC - minC + 1, h: maxR - minR + 1 });
      } else if (tool === 'pencil' || tool === 'eraser') {
          drawPixelWithSymmetry(r, c);
      }
  }, [isPanning, tool, panStart, isDrawing, zoom, selectionStart, drawPixelWithSymmetry]);

  // Get color under cursor for picker
  const getPixelColorAt = useCallback((clientX, clientY, containerRect) => {
      // Coordinates inside element with transform
      const x = clientX - containerRect.left;
      const y = clientY - containerRect.top;
      const c = Math.floor(x / zoom);
      const r = Math.floor(y / zoom);
      if (r >= 0 && r < canvasSize.h && c >= 0 && c < canvasSize.w) {
          return getCompositeColor(r, c);
      }
      return 'transparent';
  }, [zoom, canvasSize, layers]);

  // Handle click for picker
  const handlePickerClick = useCallback((e) => {
      if (tool !== 'picker') return;
      const container = e.currentTarget;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const color = getPixelColorAt(e.clientX, e.clientY, rect);
      if (color !== 'transparent') {
          setSelectedColor(color);
      }
      setTool('pencil');
  }, [tool, getPixelColorAt]);

  return (
    <div className={`${isFullScreen ? 'fixed inset-0 z-50 w-full h-full overflow-hidden m-0' : 'min-h-screen'} bg-neutral-900 text-neutral-100 p-2 md:p-6 font-sans flex flex-col`} onMouseUp={handleGlobalMouseUp}>

      <header className="mb-4 flex items-center justify-center shrink-0 relative">
        <h1 className="text-2xl md:text-3xl font-bold text-green-500 flex items-center justify-center gap-2">
           <Grid3X3 /> MC Texture Editor Pro
        </h1>
        <div className="absolute right-4 flex gap-2">
          <button onClick={() => setShowHotkeys(!showHotkeys)} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-400 hover:text-white transition-colors" title="Hotkeys">
             <Keyboard size={18} />
          </button>
          <button onClick={() => setShow3DCube(!show3DCube)} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-400 hover:text-white transition-colors" title="3D Cube Preview">
             <BoxSelect size={18} />
          </button>
          <button onClick={toggleFullScreen} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-400 hover:text-white transition-colors" title="Fullscreen (F11 or Alt+Enter)">
             <Maximize2 size={18} />
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-4 items-start w-full max-w-[1600px] mx-auto flex-1 overflow-hidden px-2 lg:px-4">

        {/* LEFT PANEL: Tools */}
        <div className="flex flex-col gap-3 bg-neutral-800 p-3 rounded-xl border border-neutral-700 shadow-xl w-full lg:w-64 shrink-0 overflow-y-auto custom-scrollbar" style={{maxHeight: 'calc(100vh - 100px)'}}>

          {/* Color and Opacity */}
          <div className="flex flex-col gap-2 bg-neutral-900 p-2 rounded-lg border border-neutral-700">
             <div className="flex justify-between items-center">
                 <span className="text-[10px] text-neutral-400 font-bold uppercase">Color</span>
                 <button onClick={useGlobalEyedropper} className="p-1 bg-neutral-700 hover:bg-neutral-600 rounded text-neutral-300" title="System Eyedropper (Pick color from anywhere)">
                     <Monitor size={12}/>
                 </button>
             </div>

             <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={selectedColor.substring(0,7)}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-10 h-8 cursor-pointer rounded bg-transparent border-none p-0 shrink-0"
                />
                <input
                   type="text"
                   value={selectedColor}
                   onChange={handleManualColorChange}
                   className="w-full bg-neutral-800 border border-neutral-600 rounded px-2 py-1 text-xs font-mono text-neutral-200 focus:border-green-500 outline-none uppercase"
                />
             </div>
             <div className="flex items-center gap-2 mt-1">
                 <span className="text-[10px] text-neutral-500 w-8">Alpha</span>
                 <input
                     type="range" min="0" max="100" value={opacity}
                     onChange={(e) => setOpacity(e.target.value)}
                     className="flex-1 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                 />
                 <span className="text-[10px] text-neutral-400 w-6 text-right">{opacity}%</span>
             </div>
          </div>

          {/* Tools */}
          <div className="grid grid-cols-4 gap-1">
            <ToolButton active={tool === 'pencil' && !isShadingMode && !isLightenMode} onClick={() => { setTool('pencil'); setIsShadingMode(false); setIsLightenMode(false); }} icon={<Pencil size={16} />} title="Pencil [1]" />
            <ToolButton active={tool === 'eraser'} onClick={() => { setTool('eraser'); setIsShadingMode(false); setIsLightenMode(false); }} icon={<Eraser size={16} />} title="Eraser [2]" />
            <ToolButton active={tool === 'picker'} onClick={() => { setTool('picker'); setIsShadingMode(false); setIsLightenMode(false); }} icon={<Pipette size={16} />} title="Color Picker [3]" />
            <ToolButton active={tool === 'bucket'} onClick={() => { setTool('bucket'); setIsShadingMode(false); setIsLightenMode(false); }} icon={<PaintBucket size={16} />} title="Fill Bucket" />
            <ToolButton active={tool === 'replace'} onClick={() => { setTool('replace'); }} icon={<RefreshCw size={16} />} title="Replace Color [4]" />
            <ToolButton active={tool === 'marquee'} onClick={() => { setTool('marquee'); }} icon={<BoxSelect size={16} />} title="Selection [M]" />
            <ToolButton active={tool === 'pan'} onClick={() => { setTool('pan'); }} icon={<Hand size={16} />} title="Pan [H]" />
            <button onClick={clearActiveLayer} className="p-1.5 rounded-lg flex items-center justify-center transition-all bg-red-900/30 text-red-400 hover:bg-red-900/50" title="Clear Layer">
                <X size={16}/>
            </button>
          </div>

          {/* Shade/Light */}
          <div className="flex gap-1">
             <button onClick={() => { setTool('pencil'); setIsShadingMode(!isShadingMode); setIsLightenMode(false); }} className={`flex-1 py-1.5 rounded flex items-center justify-center gap-1 font-bold border text-[10px] ${isShadingMode ? 'bg-purple-600 text-white border-purple-500 shadow-md' : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700'}`}>
                <Moon size={12} /> Shade
             </button>
             <button onClick={() => { setTool('pencil'); setIsLightenMode(!isLightenMode); setIsShadingMode(false); }} className={`flex-1 py-1.5 rounded flex items-center justify-center gap-1 font-bold border text-[10px] ${isLightenMode ? 'bg-yellow-600 text-white border-yellow-500 shadow-md' : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700'}`}>
                <Sun size={12} /> Light
             </button>
          </div>

          {/* Symmetry and Dithering */}
          <div className="flex gap-1">
             <button onClick={() => setSymX(!symX)} className={`flex-1 py-1.5 rounded text-[10px] font-bold border ${symX ? 'bg-blue-600 text-white border-blue-500' : 'bg-neutral-800 text-neutral-400 border-neutral-700'}`}>Sym X</button>
             <button onClick={() => setSymY(!symY)} className={`flex-1 py-1.5 rounded text-[10px] font-bold border ${symY ? 'bg-blue-600 text-white border-blue-500' : 'bg-neutral-800 text-neutral-400 border-neutral-700'}`}>Sym Y</button>
             <button onClick={() => setIsDithering(!isDithering)} className={`flex-1 py-1.5 rounded text-[10px] font-bold border ${isDithering ? 'bg-green-600 text-white border-green-500' : 'bg-neutral-800 text-neutral-400 border-neutral-700'}`}>Dither</button>
          </div>

          <div className="h-px bg-neutral-700"></div>

          {/* Layer Movement */}
          <div className="flex flex-col gap-2">
              <span className="text-[10px] text-neutral-400 font-bold uppercase">Layer Movement</span>
              <div className="flex justify-center gap-1">
                  <button onClick={() => shiftLayerByOne(0, -1)} className="p-1 bg-neutral-800 hover:bg-neutral-700 rounded border border-neutral-700 flex justify-center text-neutral-300" title="Up (↑)">
                      <ChevronUp size={14}/>
                  </button>
              </div>
              <div className="flex justify-center gap-1">
                  <button onClick={() => shiftLayerByOne(-1, 0)} className="p-1 bg-neutral-800 hover:bg-neutral-700 rounded border border-neutral-700 flex justify-center text-neutral-300" title="Left (←)">
                      <ChevronLeft size={14}/>
                  </button>
                  <button onClick={() => shiftLayerByOne(0, 1)} className="p-1 bg-neutral-800 hover:bg-neutral-700 rounded border border-neutral-700 flex justify-center text-neutral-300" title="Down (↓)">
                      <ChevronDown size={14}/>
                  </button>
                  <button onClick={() => shiftLayerByOne(1, 0)} className="p-1 bg-neutral-800 hover:bg-neutral-700 rounded border border-neutral-700 flex justify-center text-neutral-300" title="Right (→)">
                      <ChevronRight size={14}/>
                  </button>
              </div>
          </div>

          <div className="h-px bg-neutral-700"></div>

          {/* Transformations */}
          <div className="flex flex-col gap-2">
              <span className="text-[10px] text-neutral-400 font-bold uppercase">Transform (Layer/Selection)</span>

              <div className="flex gap-1">
                  <button onClick={() => applyTransform('flipH')} className="flex-1 p-1 bg-neutral-800 hover:bg-neutral-700 rounded border border-neutral-700 flex justify-center text-neutral-300" title="Flip Horizontal"><FlipHorizontal size={14}/></button>
                  <button onClick={() => applyTransform('flipV')} className="flex-1 p-1 bg-neutral-800 hover:bg-neutral-700 rounded border border-neutral-700 flex justify-center text-neutral-300" title="Flip Vertical"><FlipVertical size={14}/></button>
                  <button onClick={() => applyTransform('rot90')} className="flex-1 p-1 bg-neutral-800 hover:bg-neutral-700 rounded border border-neutral-700 flex justify-center text-neutral-300" title="Rotate 90°"><RotateCw size={14}/></button>
              </div>

              <div className="flex gap-1 items-center bg-neutral-900 p-1.5 rounded border border-neutral-700">
                  <input type="number" value={rotationAngle} onChange={e=>setRotationAngle(e.target.value)} className="w-12 bg-neutral-800 text-xs text-center rounded px-1 py-0.5 outline-none border border-neutral-600" placeholder="Angle"/>
                  <span className="text-[10px] text-neutral-500">°</span>
                  <button onClick={applySmoothRotation} className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-[10px] py-1 rounded text-white font-bold">Apply</button>
              </div>
          </div>

          <div className="h-px bg-neutral-700"></div>

           {/* Canvas Size */}
           <div className="flex flex-col gap-1">
             <div className="flex gap-1 items-center">
                 <input type="number" value={inputSize.w} onChange={(e) => setInputSize(p => ({ ...p, w: e.target.value }))} className="w-full bg-neutral-900 border border-neutral-700 rounded p-1 text-[10px] text-center text-white" />
                 <span className="text-neutral-500 text-xs">x</span>
                 <input type="number" value={inputSize.h} onChange={(e) => setInputSize(p => ({ ...p, h: e.target.value }))} className="w-full bg-neutral-900 border border-neutral-700 rounded p-1 text-[10px] text-center text-white" />
             </div>
             <div className="flex gap-1">
                 <button onClick={handleResizeCanvas} className="flex-1 p-1 bg-neutral-800 hover:bg-neutral-700 rounded text-[10px] text-neutral-300 border border-neutral-700">Crop</button>
                 <button onClick={handleScaleCanvas} className="flex-1 p-1 bg-neutral-800 hover:bg-neutral-700 rounded text-[10px] text-neutral-300 border border-neutral-700">Scale NN</button>
             </div>
          </div>

          <div className="mt-auto flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-1">
                <button onClick={handleUndo} className="p-1.5 bg-neutral-700 hover:bg-neutral-600 rounded flex items-center justify-center gap-1 text-xs" disabled={history.length === 0}><Undo size={12} /> Undo</button>
                <button onClick={handleRedo} className="p-1.5 bg-neutral-700 hover:bg-neutral-600 rounded flex items-center justify-center gap-1 text-xs" disabled={redoHistory.length === 0}><Redo size={12} /> Redo</button>
            </div>
            <div className="grid grid-cols-2 gap-1">
                <label className="flex items-center justify-center gap-2 w-full bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-2 rounded transition-colors text-sm cursor-pointer">
                    <FolderOpen size={16} /> Import
                    <input type="file" accept="image/*" className="hidden" onChange={handleTextureUpload} />
                </label>
                <button onClick={handleDownload} className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded transition-colors shadow-lg shadow-green-900/20 text-sm">
                    <Download size={16} /> PNG
                </button>
            </div>
            <button onClick={() => { setImportData(exportData()); setShowImportExport(true); }} className="w-full py-2 bg-neutral-700 hover:bg-neutral-600 text-white font-bold rounded transition-colors text-sm flex items-center justify-center gap-2">
                <Hash size={16} /> Import/Export Data
            </button>
          </div>
        </div>

        {/* CENTER: Canvas */}
        <div className="flex flex-col items-center gap-2 flex-1 h-full overflow-hidden">

          {/* Top panel above canvas */}
          <div className="flex items-center justify-between w-full bg-neutral-800 p-2 rounded-xl border border-neutral-700 shadow-md">
             <div className="flex items-center gap-2">
                 <button onClick={() => setShowGrid(!showGrid)} className={`p-1.5 rounded flex items-center justify-center gap-2 text-xs ${showGrid ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:bg-neutral-700'}`}><Grid3X3 size={14} /> Grid</button>
                 <button onClick={togglePaletteMode} className={`p-1.5 rounded flex items-center justify-center gap-2 text-xs ${isPaletteMode ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:bg-neutral-700'}`}><Hash size={14} /> Indices</button>
             </div>
             <div className="flex items-center gap-2 bg-neutral-900 p-1 rounded-lg border border-neutral-700">
                <button onClick={() => setZoom(z => Math.max(2, z - 2))} className="p-1 text-neutral-400 hover:text-white"><ZoomOut size={14} /></button>
                <span className="text-[10px] w-8 text-center text-neutral-300 select-none font-mono">{zoom}x</span>
                <button onClick={() => setZoom(z => Math.min(60, z + 2))} className="p-1 text-neutral-400 hover:text-white"><ZoomIn size={14} /></button>
             </div>
          </div>

          {/* Canvas Area */}
          <div
             className="relative bg-neutral-900 rounded-lg border-4 border-neutral-700 shadow-2xl overflow-hidden flex-1 w-full flex items-center justify-center"
             onWheel={handleWheelCanvas}
             style={{ touchAction: 'none' }}
          >
             {/* Затемненный фо�� 3D кубиков */}
             <div className="absolute inset-0 pointer-events-none opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

             <div
               className={`relative bg-[url('https://www.transparenttextures.com/patterns/checkerboard-cross.png')] bg-white/5 select-none ${tool === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
               style={{
                 width: `${canvasSize.w * zoom}px`,
                 height: `${canvasSize.h * zoom}px`,
                 transform: `translate(${panOffset.x}px, ${panOffset.y}px)`
               }}
               onMouseLeave={handleGlobalMouseUp}
               onPointerDown={handleCanvasPointerDown}
               onPointerMove={(e) => {
                   if (isPanning && tool === 'pan') {
                       setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
                   } else {
                       handleCanvasPointerMove(e);
                   }
               }}
               onPointerUp={handleGlobalMouseUp}
               onClick={handlePickerClick}
             >
                {/* Main canvas with pixels */}
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0"
                    style={{ imageRendering: 'pixelated' }}
                />
                {/* Canvas for grid and indices */}
                <canvas
                    ref={gridCanvasRef}
                    className="absolute inset-0 pointer-events-none"
                    style={{ imageRendering: 'pixelated' }}
                />
             </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-3 w-full lg:w-72 shrink-0 overflow-y-auto custom-scrollbar" style={{maxHeight: 'calc(100vh - 100px)'}}>

            {/* 3D Cube Preview */}
            {show3DCube && (
              <div className="bg-neutral-800 p-3 rounded-xl border border-purple-700/50 shadow-lg shadow-purple-900/20 flex flex-col gap-2">
                <div className="flex justify-between items-center pb-2 border-b border-neutral-700">
                  <h3 className="font-bold text-neutral-300 flex items-center gap-2 text-xs uppercase">
                    <BoxSelect size={14} className="text-purple-500" /> 3D Cube
                  </h3>
                  <button onClick={() => setShow3DCube(false)} className="text-neutral-400 hover:text-white p-1">
                    <X size={14} />
                  </button>
                </div>

                {/* 3D Cube Container */}
                <div 
                  className="w-full h-48 flex items-center justify-center perspective-1000 cursor-grab active:cursor-grabbing"
                  onMouseDown={handleCubeMouseDown}
                  onMouseMove={handleCubeMouseMove}
                  onMouseUp={handleCubeMouseUp}
                  onMouseLeave={handleCubeMouseUp}
                >
                  <div 
                    className="relative w-32 h-32"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: `rotateX(${cubeRotation.x}deg) rotateY(${cubeRotation.y}deg)`
                    }}
                  >
                    {/* Front Face */}
                    <div 
                      className="absolute w-32 h-32 border border-neutral-600 cube-face overflow-hidden"
                      style={{
                        transform: 'translateZ(64px)',
                        backgroundColor: '#2d2d2d'
                      }}
                      onClick={() => setSelectedFace('front')}
                    >
                      <canvas ref={frontCanvasRef} className="absolute inset-0 w-full h-full" style={{imageRendering: 'pixelated'}}></canvas>
                      <div className="cube-face-buttons">
                        <label className="cube-face-btn bg-black/60 hover:bg-blue-600/80 text-white p-1 rounded cursor-pointer transition-opacity opacity-0 hover:opacity-100">
                          <Upload size={12} />
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFaceTextureUpload('front', e)} />
                        </label>
                        <button className="cube-face-btn bg-black/60 hover:bg-green-600/80 text-white p-1 rounded transition-opacity opacity-0 hover:opacity-100" onClick={() => openFaceEditor('front')}>
                          <Pencil size={12} />
                        </button>
                      </div>
                      {selectedFace === 'front' && <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none"></div>}
                    </div>

                    {/* Back Face */}
                    <div 
                      className="absolute w-32 h-32 border border-neutral-600 cube-face overflow-hidden"
                      style={{
                        transform: 'rotateY(180deg) translateZ(64px)',
                        backgroundColor: '#3d3d3d'
                      }}
                      onClick={() => setSelectedFace('back')}
                    >
                      <canvas ref={backCanvasRef} className="absolute inset-0 w-full h-full" style={{imageRendering: 'pixelated'}}></canvas>
                      <div className="cube-face-buttons">
                        <label className="cube-face-btn bg-black/60 hover:bg-blue-600/80 text-white p-1 rounded cursor-pointer transition-opacity opacity-0 hover:opacity-100">
                          <Upload size={12} />
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFaceTextureUpload('back', e)} />
                        </label>
                        <button className="cube-face-btn bg-black/60 hover:bg-green-600/80 text-white p-1 rounded transition-opacity opacity-0 hover:opacity-100" onClick={() => openFaceEditor('back')}>
                          <Pencil size={12} />
                        </button>
                      </div>
                      {selectedFace === 'back' && <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none"></div>}
                    </div>

                    {/* Left Face */}
                    <div 
                      className="absolute w-32 h-32 border border-neutral-600 cube-face overflow-hidden"
                      style={{
                        transform: 'rotateY(-90deg) translateZ(64px)',
                        backgroundColor: '#4d4d4d'
                      }}
                      onClick={() => setSelectedFace('left')}
                    >
                      <canvas ref={leftCanvasRef} className="absolute inset-0 w-full h-full" style={{imageRendering: 'pixelated'}}></canvas>
                      <div className="cube-face-buttons">
                        <label className="cube-face-btn bg-black/60 hover:bg-blue-600/80 text-white p-1 rounded cursor-pointer transition-opacity opacity-0 hover:opacity-100">
                          <Upload size={12} />
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFaceTextureUpload('left', e)} />
                        </label>
                        <button className="cube-face-btn bg-black/60 hover:bg-green-600/80 text-white p-1 rounded transition-opacity opacity-0 hover:opacity-100" onClick={() => openFaceEditor('left')}>
                          <Pencil size={12} />
                        </button>
                      </div>
                      {selectedFace === 'left' && <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none"></div>}
                    </div>

                    {/* Right Face */}
                    <div 
                      className="absolute w-32 h-32 border border-neutral-600 cube-face overflow-hidden"
                      style={{
                        transform: 'rotateY(90deg) translateZ(64px)',
                        backgroundColor: '#5d5d5d'
                      }}
                      onClick={() => setSelectedFace('right')}
                    >
                      <canvas ref={rightCanvasRef} className="absolute inset-0 w-full h-full" style={{imageRendering: 'pixelated'}}></canvas>
                      <div className="cube-face-buttons">
                        <label className="cube-face-btn bg-black/60 hover:bg-blue-600/80 text-white p-1 rounded cursor-pointer transition-opacity opacity-0 hover:opacity-100">
                          <Upload size={12} />
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFaceTextureUpload('right', e)} />
                        </label>
                        <button className="cube-face-btn bg-black/60 hover:bg-green-600/80 text-white p-1 rounded transition-opacity opacity-0 hover:opacity-100" onClick={() => openFaceEditor('right')}>
                          <Pencil size={12} />
                        </button>
                      </div>
                      {selectedFace === 'right' && <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none"></div>}
                    </div>

                    {/* Top Face */}
                    <div 
                      className="absolute w-32 h-32 border border-neutral-600 cube-face overflow-hidden"
                      style={{
                        transform: 'rotateX(90deg) translateZ(64px)',
                        backgroundColor: '#6d6d6d'
                      }}
                      onClick={() => setSelectedFace('top')}
                    >
                      <canvas ref={topCanvasRef} className="absolute inset-0 w-full h-full" style={{imageRendering: 'pixelated'}}></canvas>
                      <div className="cube-face-buttons">
                        <label className="cube-face-btn bg-black/60 hover:bg-blue-600/80 text-white p-1 rounded cursor-pointer transition-opacity opacity-0 hover:opacity-100">
                          <Upload size={12} />
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFaceTextureUpload('top', e)} />
                        </label>
                        <button className="cube-face-btn bg-black/60 hover:bg-green-600/80 text-white p-1 rounded transition-opacity opacity-0 hover:opacity-100" onClick={() => openFaceEditor('top')}>
                          <Pencil size={12} />
                        </button>
                      </div>
                      {selectedFace === 'top' && <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none"></div>}
                    </div>

                    {/* Bottom Face */}
                    <div 
                      className="absolute w-32 h-32 border border-neutral-600 cube-face overflow-hidden"
                      style={{
                        transform: 'rotateX(-90deg) translateZ(64px)',
                        backgroundColor: '#7d7d7d'
                      }}
                      onClick={() => setSelectedFace('bottom')}
                    >
                      <canvas ref={bottomCanvasRef} className="absolute inset-0 w-full h-full" style={{imageRendering: 'pixelated'}}></canvas>
                      <div className="cube-face-buttons">
                        <label className="cube-face-btn bg-black/60 hover:bg-blue-600/80 text-white p-1 rounded cursor-pointer transition-opacity opacity-0 hover:opacity-100">
                          <Upload size={12} />
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFaceTextureUpload('bottom', e)} />
                        </label>
                        <button className="cube-face-btn bg-black/60 hover:bg-green-600/80 text-white p-1 rounded transition-opacity opacity-0 hover:opacity-100" onClick={() => openFaceEditor('bottom')}>
                          <Pencil size={12} />
                        </button>
                      </div>
                      {selectedFace === 'bottom' && <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none"></div>}
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col gap-1 bg-neutral-900 p-2 rounded border border-neutral-700">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-neutral-400">Face: <strong className="text-white capitalize">{selectedFace || 'None'}</strong></span>
                    <div className="flex gap-1">
                      <button 
                        onClick={applyFaceToCanvas} 
                        disabled={!selectedFace || !cubeTextures[selectedFace]}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:text-neutral-500 text-white text-[9px] rounded font-bold"
                      >
                        To Canvas
                      </button>
                      <button 
                        onClick={applyCanvasToFace}
                        disabled={!selectedFace || !activeLayer}
                        className="px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-neutral-700 disabled:text-neutral-500 text-white text-[9px] rounded font-bold"
                      >
                        From Canvas
                      </button>
                    </div>
                  </div>
                  <p className="text-[9px] text-neutral-500">Drag to rotate • Click face</p>
                </div>
              </div>
            )}

            {/* Animation */}
            <div className="bg-neutral-800 p-3 rounded-xl border border-neutral-700 flex flex-col gap-2">
                 <div className="flex justify-between items-center pb-2 border-b border-neutral-700">
                    <h3 className="font-bold text-neutral-300 flex items-center gap-2 text-xs uppercase"><Play size={14}/> Animation (Layers)</h3>
                    <button onClick={() => setAnimPlaying(!animPlaying)} className={`p-1 rounded ${animPlaying ? 'bg-red-600' : 'bg-green-600'} text-white`}>
                        {animPlaying ? <Pause size={12}/> : <Play size={12}/>}
                    </button>
                 </div>
                 {animPlaying && (
                     <div className="flex flex-col items-center gap-2">
                         <div className="w-16 h-16 bg-[url('https://www.transparenttextures.com/patterns/checkerboard-cross.png')] bg-white/5 border border-neutral-600 flex items-center justify-center relative overflow-hidden" style={{imageRendering: 'pixelated'}}>
                             {layers[currentFrame] && (
                                 <div style={{
                                     display: 'grid',
                                     gridTemplateColumns: `repeat(${canvasSize.w}, 1fr)`,
                                     gridTemplateRows: `repeat(${canvasSize.h}, 1fr)`,
                                     width: '100%', height: '100%'
                                 }}>
                                    {layers[currentFrame].grid.flatMap((row, r) => row.map((col, c) => (
                                        <div key={`anim-${r}-${c}`} style={{backgroundColor: String(col)}}></div>
                                    )))}
                                 </div>
                             )}
                         </div>
                         <div className="flex items-center gap-2 w-full">
                             <span className="text-[10px] text-neutral-500">Speed:</span>
                             <input type="range" min="1" max="24" value={animFps} onChange={e=>setAnimFps(e.target.value)} className="flex-1 h-1"/>
                             <span className="text-[10px] text-neutral-400">{String(animFps)} fps</span>
                         </div>
                     </div>
                 )}
            </div>

            {/* Layers */}
            <div className="bg-neutral-800 p-3 rounded-xl border border-neutral-700 flex flex-col gap-2">
                <div className="flex justify-between items-center pb-2 border-b border-neutral-700">
                    <h3 className="font-bold text-neutral-300 flex items-center gap-2 text-xs uppercase">
                        <Layers size={14} /> Layers
                    </h3>
                    <div className="flex gap-1">
                        <button onClick={() => addLayer()} title="New layer" className="p-1 bg-neutral-700 hover:bg-neutral-600 rounded text-neutral-300"><Plus size={14} /></button>
                        <button onClick={mergeDown} title="Merge down" className="p-1 bg-neutral-700 hover:bg-neutral-600 rounded text-neutral-300"><Layers size={14} /></button>
                    </div>
                </div>

                <div className="overflow-y-auto flex flex-col gap-1 pr-1 custom-scrollbar max-h-48">
                    {layers.map((layer, idx) => (
                        <div key={layer.id} onClick={() => setActiveLayerId(layer.id)} className={`flex items-center gap-1 p-1.5 rounded text-xs cursor-pointer border ${layer.id === activeLayerId ? 'bg-blue-900/40 border-blue-500/50' : 'bg-neutral-900/50 border-transparent hover:bg-neutral-700'}`}>
                            <button onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }} className={`text-neutral-400 hover:text-white ${!layer.visible && 'opacity-30'}`}>
                                {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                            </button>
                            <span className="flex-1 truncate select-none text-[10px]">{String(layer.name)}</span>

                            <div className="flex flex-col gap-0.5 opacity-50 hover:opacity-100">
                                <button onClick={(e) => { e.stopPropagation(); moveLayer(idx, -1); }} disabled={idx === 0}><ArrowUp size={10}/></button>
                                <button onClick={(e) => { e.stopPropagation(); moveLayer(idx, 1); }} disabled={idx === layers.length - 1}><ArrowDown size={10}/></button>
                            </div>

                            <button onClick={(e) => { e.stopPropagation(); deleteActiveLayer(); }} className="text-neutral-500 hover:text-red-400 ml-1 p-1"><Trash2 size={12} /></button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Reference */}
            <div className="bg-neutral-800 p-3 rounded-xl border border-neutral-700 h-fit">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-neutral-300 flex items-center gap-2 text-xs uppercase"><ImageIcon size={14} /> Reference</h3>
                        {referenceImage && <button onClick={() => setReferenceImage(null)} className="text-[10px] text-red-400">Delete</button>}
                    </div>
                    {!referenceImage ? (
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-neutral-600 rounded-lg cursor-pointer hover:bg-neutral-700/50 transition-colors">
                            <Upload className="text-neutral-500 mb-1" size={16} />
                            <span className="text-[10px] text-neutral-400 text-center px-2">Upload image</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleReferenceUpload} />
                        </label>
                    ) : (
                        <div className="flex flex-col gap-1">
                            <div className="border border-neutral-600 rounded overflow-hidden bg-neutral-900 relative">
                                <canvas ref={referenceCanvasRef} onClick={pickColorFromReference} className="cursor-crosshair w-full block" style={{ imageRendering: 'pixelated' }} />
                            </div>
                        </div>
                    )}
            </div>

            {/* PALETTE LIST */}
            {isPaletteMode && (
                <div className="bg-neutral-800 p-3 rounded-xl border border-blue-700/50 shadow-lg shadow-blue-900/20 flex flex-col gap-2">
                     <div className="flex justify-between items-center pb-2 border-b border-neutral-700">
                        <h3 className="font-bold text-blue-300 flex items-center gap-2 text-xs uppercase"><Hash size={14} /> Palette</h3>
                        <button onClick={saveCurrentPalette} className="text-[10px] flex items-center gap-1 bg-blue-900/50 hover:bg-blue-800 text-blue-200 px-2 py-1 rounded"><Save size={10}/> Save</button>
                     </div>

                     {savedPalettes.length > 0 && (
                         <div className="flex items-center gap-1 mb-1 overflow-x-auto pb-1 custom-scrollbar">
                             <span className="text-[9px] text-neutral-500 uppercase">Load:</span>
                             {savedPalettes.map((p, i) => (
                                 <button key={`pal-${i}`} onClick={()=>loadPalette(p.colors)} className="text-[9px] bg-neutral-700 px-1.5 py-0.5 rounded text-neutral-300 whitespace-nowrap hover:bg-neutral-600">{String(p.name)}</button>
                             ))}
                         </div>
                     )}

                    <div className="overflow-y-auto pr-1 custom-scrollbar flex flex-col gap-1 max-h-48">
                        {paletteData.list.map((item) => (
                            <div key={`color-${item.id}`} className="flex items-center gap-2 bg-neutral-900 p-1.5 rounded border border-neutral-700">
                                <span className="font-bold text-neutral-400 w-4 text-center text-[10px]">{String(item.id)}</span>
                                <input type="color" value={item.color.substring(0,7)} onChange={(e) => updatePaletteColor(item.id, e.target.value)} className="w-5 h-5 rounded cursor-pointer border-none p-0 bg-transparent" />
                                <input
                                    type="text"
                                    value={item.color.substring(0,7).toUpperCase()}
                                    onChange={(e) => {
                                        let val = e.target.value;
                                        // Add # if missing
                                        if (!val.startsWith('#')) val = '#' + val;
                                        if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                                            updatePaletteColor(item.id, val);
                                        }
                                    }}
                                    className="flex-1 bg-neutral-800 border border-neutral-600 rounded px-1 py-0.5 text-[10px] font-mono text-neutral-200 focus:border-blue-500 outline-none uppercase w-16"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

      </div>

      {/* Hotkeys modal */}
      {showHotkeys && (
        <HotkeysModal hotkeys={hotkeys} setHotkeys={setHotkeys} defaultHotkeys={defaultHotkeys} onClose={() => setShowHotkeys(false)} />
      )}

      {/* Import/Export Data modal */}
      {showImportExport && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowImportExport(false)}>
          <div className="bg-neutral-800 rounded-xl border border-neutral-700 shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-neutral-700">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Hash size={20} className="text-blue-500" />
                Import/Export Data
              </h2>
              <button onClick={() => setShowImportExport(false)} className="text-neutral-400 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 flex flex-col gap-3 flex-1 overflow-hidden">
              <p className="text-xs text-neutral-400">
                Format: <code className="bg-neutral-700 px-1 py-0.5 rounded">x,y;#HEX;x,y;#HEX;...</code>
              </p>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                className="flex-1 bg-neutral-900 border border-neutral-600 rounded p-2 text-xs font-mono text-neutral-200 focus:border-blue-500 outline-none resize-none min-h-[200px]"
                placeholder="0,0;#FF0000;1,0;#00FF00;..."
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const data = exportData();
                    setImportData(data);
                  }}
                  className="flex-1 py-2 bg-neutral-700 hover:bg-neutral-600 rounded text-white text-sm font-bold"
                >
                  Export from Canvas
                </button>
                <button
                  onClick={() => {
                    importDataToCanvas(importData);
                    setShowImportExport(false);
                  }}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm font-bold"
                >
                  Import to Canvas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #262626; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #525252; border-radius: 2px; }

        @keyframes dash {
          to { stroke-dashoffset: 1000; }
        }
        
        .perspective-1000 {
          perspective: 1000px;
        }
        
        .cube-face {
          backface-visibility: visible;
          transition: box-shadow 0.2s;
        }
        
        .cube-face:hover {
          box-shadow: 0 0 15px rgba(168, 85, 247, 0.5);
        }
        
        .cube-face-buttons {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          gap: 4px;
          z-index: 10;
        }
        
        .cube-face:hover .cube-face-buttons .cube-face-btn {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}

// Helper function to render grid as canvas
function renderGridToCanvas(grid, canvasRef) {
    if (!grid || !canvasRef || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = grid[0].length;
    const height = grid.length;
    const pixelSize = 4;
    
    canvas.width = width * pixelSize;
    canvas.height = height * pixelSize;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw each pixel
    for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
            const color = grid[r][c];
            if (color !== 'transparent') {
                ctx.fillStyle = color;
                ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize, pixelSize);
            }
        }
    }
}

function ToolButton({ active, onClick, icon, title }) {
  return (
    <button
      onClick={onClick} title={title}
      className={`p-1.5 rounded-lg flex items-center justify-center transition-all w-full
        ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600'}`}
    >
      {icon}
    </button>
  );
}
