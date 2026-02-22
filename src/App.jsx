import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import {
  Download, Upload, Eraser, Pencil, Pipette, PaintBucket, Trash2, Undo, Redo,
  Image as ImageIcon, Grid3X3, Moon, Sun, Layers, Plus, ArrowUp, ArrowDown,
  Eye, EyeOff, X, Move, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  RefreshCw, Maximize, Minimize, Hash, ZoomIn, ZoomOut, Hand, BoxSelect,
  FlipHorizontal, FlipVertical, RotateCw, Save, FolderOpen, Play, Pause, Monitor, Maximize2,
  Keyboard
} from 'lucide-react';

// --- Хелперы для цветов ---
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
  return rgbToHex(
    Math.min(255, Math.max(0, r + amount)),
    Math.min(255, Math.max(0, g + amount)),
    Math.min(255, Math.max(0, b + amount)),
    a
  );
};

export default function App() {
  // --- Основные состояния ---
  const [canvasSize, setCanvasSize] = useState({ w: 16, h: 16 });
  const [inputSize, setInputSize] = useState({ w: 16, h: 16 });
  const [zoom, setZoom] = useState(20);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isFullScreen, setIsFullScreen] = useState(false);

  const createEmptyGrid = (w, h) => Array(h).fill().map(() => Array(w).fill('transparent'));

  const [layers, setLayers] = useState([
    { id: 1, name: 'Слой 1', visible: true, grid: createEmptyGrid(16, 16) }
  ]);
  const [activeLayerId, setActiveLayerId] = useState(1);
  const [nextLayerId, setNextLayerId] = useState(2);

  const [history, setHistory] = useState([]);
  const [redoHistory, setRedoHistory] = useState([]);

  // --- Инструменты и настройки ---
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

  // --- Выделение ---
  const [selection, setSelection] = useState(null);
  const [selectionStart, setSelectionStart] = useState(null);

  // --- Панорамирование (Pan) ---
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const isSpaceDown = useRef(false);

  // --- Палитра и Индексы ---
  const [isPaletteMode, setIsPaletteMode] = useState(false);
  const [paletteData, setPaletteData] = useState({ list: [], pixelMap: [] });
  const [savedPalettes, setSavedPalettes] = useState([]);

  // --- Референс ---
  const [referenceImage, setReferenceImage] = useState(null);
  const referenceCanvasRef = useRef(null);

  // --- Анимация ---
  const [animPlaying, setAnimPlaying] = useState(false);
  const [animFps, setAnimFps] = useState(5);
  const [currentFrame, setCurrentFrame] = useState(0);

  // --- Поворот ---
  const [rotationAngle, setRotationAngle] = useState(0);
  const [showHotkeys, setShowHotkeys] = useState(false);

  // --- Вычисляемые свойства ---
  const activeLayerIndex = layers.findIndex(l => l.id === activeLayerId);
  const activeLayer = layers[activeLayerIndex];

  // Загрузка палитр при старте
  useEffect(() => {
      const saved = localStorage.getItem('mc_palettes');
      if (saved) setSavedPalettes(JSON.parse(saved));
  }, []);

  // --- История ---
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

  // --- Полноэкранный режим ---
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

  // --- Горячие клавиши ---
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const key = e.key.toLowerCase();
      if (key === '1') { setTool('pencil'); setIsShadingMode(false); setIsLightenMode(false); }
      if (key === '2') { setTool('picker'); }
      if (key === '3') { setTool('eraser'); setIsShadingMode(false); setIsLightenMode(false); }
      if (key === 'm') { setTool('marquee'); }
      if (key === 'h') { setTool('pan'); }
      if (key === 'z') { handleUndo(); }
      if (key === 'x') { handleRedo(); }
      if (key === 'escape') { setSelection(null); }

      // Перемещение слоя стрелочками
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

      if (key === 'f11' || (e.altKey && key === 'enter')) {
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
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [layers, history, redoHistory, activeLayerId]);

  // --- Колесико мыши (Зум) ---
  const handleWheelCanvas = (e) => {
      if (isSpaceDown.current) {
          if (e.deltaY < 0) {
              setZoom(z => Math.min(60, z + 2));
          } else {
              setZoom(z => Math.max(2, z - 2));
          }
      }
  };

  // --- Получение текущего цвета с учетом Alpha ---
  function getCurrentColorHex() {
     if (tool === 'eraser') return 'transparent';
     const base = selectedColor.substring(0, 7);
     if (opacity < 100) {
         const alpha = Math.round((opacity / 100) * 255).toString(16).padStart(2, '0');
         return base + alpha;
     }
     return base;
  }

  // --- Системная Пипетка ---
  async function useGlobalEyedropper() {
      if (!window.EyeDropper) {
          alert("Ваш браузер не поддерживает системную пипетку. Используйте Chrome или Edge.");
          return;
      }
      try {
          const dropper = new window.EyeDropper();
          const result = await dropper.open();
          setSelectedColor(result.sRGBHex);
          setTool('pencil');
      } catch (e) {
          // Пользователь отменил выбор
      }
  }

  // --- Логика Палитры ---
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

  // --- Управление слоями ---
  function addLayer(name = null, gridData = null) {
    pushToHistory();
    const newGrid = gridData || createEmptyGrid(canvasSize.w, canvasSize.h);
    const newId = nextLayerId;
    const newLayer = { id: newId, name: name ? String(name) : `Слой ${newId}`, visible: true, grid: newGrid };
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
      if (layers.length <= 1) { alert("Нельзя удалить последний слой!"); return; }
      removeLayer(activeLayerId);
  }

  // --- Размер и Зум ---
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

  // --- Рисование ---
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
      if (isShadingMode && tool === 'pencil') {
         const currentColor = activeLayer.grid[startR][startC];
         if (currentColor !== 'transparent') newColor = modifyColorBrightness(currentColor, -25);
      } else if (isLightenMode && tool === 'pencil') {
         const currentColor = activeLayer.grid[startR][startC];
         if (currentColor !== 'transparent') newColor = modifyColorBrightness(currentColor, 25);
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

  // --- Трансформации ---
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

  // --- Палитра: Сохранение и Индексы ---
  function saveCurrentPalette() {
      if (paletteData.list.length === 0) { alert("Палитра пуста!"); return; }
      const name = prompt("Введите имя для палитры:");
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

  // --- Анимация ---
  useEffect(() => {
      let interval;
      if (animPlaying) {
          interval = setInterval(() => {
              setCurrentFrame(prev => (prev + 1) % layers.length);
          }, 1000 / animFps);
      }
      return () => clearInterval(interval);
  }, [animPlaying, animFps, layers.length]);

  // --- Загрузка / Экспорт ---
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
           if (confirm(`Размер изображения (${img.width}x${img.height}) отличается от холста. Изменить холст?`)) {
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

  // --- Хелперы для затемнения/осветления ---
  function darkenColor(hex) {
      return modifyColorBrightness(hex, -25);
  }
  function lightenColor(hex) {
      return modifyColorBrightness(hex, 25);
  }

  // --- Оптимизированный рендеринг через Canvas ---
  const canvasRef = useRef(null);
  const gridCanvasRef = useRef(null);
  const needsRedraw = useRef(false);

  // Функция принудительной перерисовки
  const forceRedraw = useCallback(() => {
      needsRedraw.current = true;
  }, []);

  // Отрисовка основного холста
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

      // Рисуем все видимые слои
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

      // Рисуем выделение
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

  // Отрисовка сетки отдельно
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

      // Рисуем индексы палитры
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

  // Обработка клика по canvas
  const handleCanvasPointerDown = useCallback((e) => {
      if (tool === 'pan') {
          setIsPanning(true);
          setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
          return;
      }

      const container = e.currentTarget;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      // Координаты внутри элемента с учётом transform
      // rect.left/top уже учитывают transform при getBoundingClientRect
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
      // Координаты внутри элемента с учётом transform
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

  // Получение цвета под курсором для пипетки
  const getPixelColorAt = useCallback((clientX, clientY, containerRect) => {
      // Координаты внутри элемента с учётом transform
      const x = clientX - containerRect.left;
      const y = clientY - containerRect.top;
      const c = Math.floor(x / zoom);
      const r = Math.floor(y / zoom);
      if (r >= 0 && r < canvasSize.h && c >= 0 && c < canvasSize.w) {
          return getCompositeColor(r, c);
      }
      return 'transparent';
  }, [zoom, canvasSize, layers]);

  // Обработка клика для пипетки
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
          <button onClick={() => setShowHotkeys(!showHotkeys)} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-400 hover:text-white transition-colors" title="Горячие клавиши">
             <Keyboard size={18} />
          </button>
          <button onClick={toggleFullScreen} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-400 hover:text-white transition-colors" title="На весь экран (F11 или Alt+Enter)">
             <Maximize2 size={18} />
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-4 items-start w-full max-w-[1600px] mx-auto flex-1 overflow-hidden">

        {/* ЛЕВАЯ ПАНЕЛЬ: Инструменты */}
        <div className="flex flex-col gap-3 bg-neutral-800 p-3 rounded-xl border border-neutral-700 shadow-xl w-full lg:w-64 shrink-0 overflow-y-auto custom-scrollbar" style={{maxHeight: 'calc(100vh - 100px)'}}>

          {/* Цвет и прозрачность */}
          <div className="flex flex-col gap-2 bg-neutral-900 p-2 rounded-lg border border-neutral-700">
             <div className="flex justify-between items-center">
                 <span className="text-[10px] text-neutral-400 font-bold uppercase">Цвет</span>
                 <button onClick={useGlobalEyedropper} className="p-1 bg-neutral-700 hover:bg-neutral-600 rounded text-neutral-300" title="Системная пипетка (Берет цвет отовсюду)">
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

          {/* Инструменты */}
          <div className="grid grid-cols-4 gap-1">
            <ToolButton active={tool === 'pencil' && !isShadingMode && !isLightenMode} onClick={() => { setTool('pencil'); setIsShadingMode(false); setIsLightenMode(false); }} icon={<Pencil size={16} />} title="Карандаш [1]" />
            <ToolButton active={tool === 'eraser'} onClick={() => { setTool('eraser'); setIsShadingMode(false); setIsLightenMode(false); }} icon={<Eraser size={16} />} title="Ластик [3]" />
            <ToolButton active={tool === 'picker'} onClick={() => { setTool('picker'); setIsShadingMode(false); setIsLightenMode(false); }} icon={<Pipette size={16} />} title="Пипетка [2]" />
            <ToolButton active={tool === 'bucket'} onClick={() => { setTool('bucket'); setIsShadingMode(false); setIsLightenMode(false); }} icon={<PaintBucket size={16} />} title="Заливка" />
            <ToolButton active={tool === 'replace'} onClick={() => { setTool('replace'); }} icon={<RefreshCw size={16} />} title="Замена цвета [4]" />
            <ToolButton active={tool === 'marquee'} onClick={() => { setTool('marquee'); }} icon={<BoxSelect size={16} />} title="Выделение [M]" />
            <ToolButton active={tool === 'pan'} onClick={() => { setTool('pan'); }} icon={<Hand size={16} />} title="Панорамирование [H]" />
            <button onClick={clearActiveLayer} className="p-1.5 rounded-lg flex items-center justify-center transition-all bg-red-900/30 text-red-400 hover:bg-red-900/50" title="Очистить слой">
                <X size={16}/>
            </button>
          </div>

          {/* Свет/Тень */}
          <div className="flex gap-1">
             <button onClick={() => { setTool('pencil'); setIsShadingMode(!isShadingMode); setIsLightenMode(false); }} className={`flex-1 py-1.5 rounded flex items-center justify-center gap-1 font-bold border text-[10px] ${isShadingMode ? 'bg-purple-600 text-white border-purple-500 shadow-md' : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700'}`}>
                <Moon size={12} /> Тень
             </button>
             <button onClick={() => { setTool('pencil'); setIsLightenMode(!isLightenMode); setIsShadingMode(false); }} className={`flex-1 py-1.5 rounded flex items-center justify-center gap-1 font-bold border text-[10px] ${isLightenMode ? 'bg-yellow-600 text-white border-yellow-500 shadow-md' : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700'}`}>
                <Sun size={12} /> Свет
             </button>
          </div>

          {/* Симметрия и Дизеринг */}
          <div className="flex gap-1">
             <button onClick={() => setSymX(!symX)} className={`flex-1 py-1.5 rounded text-[10px] font-bold border ${symX ? 'bg-blue-600 text-white border-blue-500' : 'bg-neutral-800 text-neutral-400 border-neutral-700'}`}>Sym X</button>
             <button onClick={() => setSymY(!symY)} className={`flex-1 py-1.5 rounded text-[10px] font-bold border ${symY ? 'bg-blue-600 text-white border-blue-500' : 'bg-neutral-800 text-neutral-400 border-neutral-700'}`}>Sym Y</button>
             <button onClick={() => setIsDithering(!isDithering)} className={`flex-1 py-1.5 rounded text-[10px] font-bold border ${isDithering ? 'bg-green-600 text-white border-green-500' : 'bg-neutral-800 text-neutral-400 border-neutral-700'}`}>Dither</button>
          </div>

          <div className="h-px bg-neutral-700"></div>

          {/* Перемещение слоя */}
          <div className="flex flex-col gap-2">
              <span className="text-[10px] text-neutral-400 font-bold uppercase">Перемещение слоя</span>
              <div className="flex justify-center gap-1">
                  <button onClick={() => shiftLayerByOne(0, -1)} className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded border border-neutral-700 flex justify-center text-neutral-300" title="Вверх (↑)">
                      <ChevronUp size={16}/>
                  </button>
              </div>
              <div className="flex justify-center gap-1">
                  <button onClick={() => shiftLayerByOne(-1, 0)} className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded border border-neutral-700 flex justify-center text-neutral-300" title="Влево (←)">
                      <ChevronLeft size={16}/>
                  </button>
                  <button onClick={() => shiftLayerByOne(0, 1)} className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded border border-neutral-700 flex justify-center text-neutral-300" title="Вниз (↓)">
                      <ChevronDown size={16}/>
                  </button>
                  <button onClick={() => shiftLayerByOne(1, 0)} className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded border border-neutral-700 flex justify-center text-neutral-300" title="Вправо (→)">
                      <ChevronRight size={16}/>
                  </button>
              </div>
          </div>

          <div className="h-px bg-neutral-700"></div>

          {/* Трансформации */}
          <div className="flex flex-col gap-2">
              <span className="text-[10px] text-neutral-400 font-bold uppercase">Трансформация (к слою/выделению)</span>

              <div className="flex gap-1">
                  <button onClick={() => applyTransform('flipH')} className="flex-1 p-1 bg-neutral-800 hover:bg-neutral-700 rounded border border-neutral-700 flex justify-center text-neutral-300" title="Отразить по горизонтали"><FlipHorizontal size={14}/></button>
                  <button onClick={() => applyTransform('flipV')} className="flex-1 p-1 bg-neutral-800 hover:bg-neutral-700 rounded border border-neutral-700 flex justify-center text-neutral-300" title="Отразить по вертикали"><FlipVertical size={14}/></button>
                  <button onClick={() => applyTransform('rot90')} className="flex-1 p-1 bg-neutral-800 hover:bg-neutral-700 rounded border border-neutral-700 flex justify-center text-neutral-300" title="Повернуть на 90°"><RotateCw size={14}/></button>
              </div>

              <div className="flex gap-1 items-center bg-neutral-900 p-1.5 rounded border border-neutral-700">
                  <input type="number" value={rotationAngle} onChange={e=>setRotationAngle(e.target.value)} className="w-12 bg-neutral-800 text-xs text-center rounded px-1 py-0.5 outline-none border border-neutral-600" placeholder="Угол"/>
                  <span className="text-[10px] text-neutral-500">°</span>
                  <button onClick={applySmoothRotation} className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-[10px] py-1 rounded text-white font-bold">Применить</button>
              </div>
          </div>

          <div className="h-px bg-neutral-700"></div>

           {/* Размер холста */}
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
                    <FolderOpen size={16} /> Импорт
                    <input type="file" accept="image/*" className="hidden" onChange={handleTextureUpload} />
                </label>
                <button onClick={handleDownload} className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded transition-colors shadow-lg shadow-green-900/20 text-sm">
                    <Download size={16} /> PNG
                </button>
            </div>
          </div>
        </div>

        {/* ЦЕНТР: Холст */}
        <div className="flex flex-col items-center gap-2 flex-1 h-full overflow-hidden">

          {/* Верхняя панель над холстом */}
          <div className="flex items-center justify-between w-full bg-neutral-800 p-2 rounded-xl border border-neutral-700 shadow-md">
             <div className="flex items-center gap-2">
                 <button onClick={() => setShowGrid(!showGrid)} className={`p-1.5 rounded flex items-center justify-center gap-2 text-xs ${showGrid ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:bg-neutral-700'}`}><Grid3X3 size={14} /> Сетка</button>
                 <button onClick={togglePaletteMode} className={`p-1.5 rounded flex items-center justify-center gap-2 text-xs ${isPaletteMode ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:bg-neutral-700'}`}><Hash size={14} /> Индексы</button>
             </div>
             <div className="flex items-center gap-2 bg-neutral-900 p-1 rounded-lg border border-neutral-700">
                <button onClick={() => setZoom(z => Math.max(2, z - 2))} className="p-1 text-neutral-400 hover:text-white"><ZoomOut size={14} /></button>
                <span className="text-[10px] w-8 text-center text-neutral-300 select-none font-mono">{zoom}x</span>
                <button onClick={() => setZoom(z => Math.min(60, z + 2))} className="p-1 text-neutral-400 hover:text-white"><ZoomIn size={14} /></button>
             </div>
          </div>

          {/* Область с холстом */}
          <div
             className="relative bg-neutral-900 rounded-lg border-4 border-neutral-700 shadow-2xl overflow-hidden flex-1 w-full flex items-center justify-center"
             onWheel={handleWheelCanvas}
             style={{ touchAction: 'none' }}
          >
             {/* Затемненный фон 3D кубиков */}
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
                {/* Основной canvas с пикселями */}
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0"
                    style={{ imageRendering: 'pixelated' }}
                />
                {/* Canvas для сетки и индексов */}
                <canvas
                    ref={gridCanvasRef}
                    className="absolute inset-0 pointer-events-none"
                    style={{ imageRendering: 'pixelated' }}
                />
             </div>
          </div>

        </div>

        {/* ПРАВАЯ КОЛОНКА */}
        <div className="flex flex-col gap-3 w-full lg:w-72 shrink-0 overflow-y-auto custom-scrollbar" style={{maxHeight: 'calc(100vh - 100px)'}}>

            {/* Анимация */}
            <div className="bg-neutral-800 p-3 rounded-xl border border-neutral-700 flex flex-col gap-2">
                 <div className="flex justify-between items-center pb-2 border-b border-neutral-700">
                    <h3 className="font-bold text-neutral-300 flex items-center gap-2 text-xs uppercase"><Play size={14}/> Анимация (Слои)</h3>
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
                             <span className="text-[10px] text-neutral-500">Скорость:</span>
                             <input type="range" min="1" max="24" value={animFps} onChange={e=>setAnimFps(e.target.value)} className="flex-1 h-1"/>
                             <span className="text-[10px] text-neutral-400">{String(animFps)} fps</span>
                         </div>
                     </div>
                 )}
            </div>

            {/* Слои */}
            <div className="bg-neutral-800 p-3 rounded-xl border border-neutral-700 flex flex-col gap-2">
                <div className="flex justify-between items-center pb-2 border-b border-neutral-700">
                    <h3 className="font-bold text-neutral-300 flex items-center gap-2 text-xs uppercase">
                        <Layers size={14} /> Слои
                    </h3>
                    <div className="flex gap-1">
                        <button onClick={() => addLayer()} title="Новый слой" className="p-1 bg-neutral-700 hover:bg-neutral-600 rounded text-neutral-300"><Plus size={14} /></button>
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

            {/* СПИСОК ПАЛИТРЫ */}
            {isPaletteMode && (
                <div className="bg-neutral-800 p-3 rounded-xl border border-blue-700/50 shadow-lg shadow-blue-900/20 flex flex-col gap-2">
                     <div className="flex justify-between items-center pb-2 border-b border-neutral-700">
                        <h3 className="font-bold text-blue-300 flex items-center gap-2 text-xs uppercase"><Hash size={14} /> Палитра</h3>
                        <button onClick={saveCurrentPalette} className="text-[10px] flex items-center gap-1 bg-blue-900/50 hover:bg-blue-800 text-blue-200 px-2 py-1 rounded"><Save size={10}/> Сохранить</button>
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
                                <span className="flex-1 text-[10px] font-mono text-neutral-400 uppercase">{String(item.color)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Референс */}
            {!isPaletteMode && (
                <div className="bg-neutral-800 p-3 rounded-xl border border-neutral-700 h-fit">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-neutral-300 flex items-center gap-2 text-xs uppercase"><ImageIcon size={14} /> Рефере��с</h3>
                        {referenceImage && <button onClick={() => setReferenceImage(null)} className="text-[10px] text-red-400">Удалить</button>}
                    </div>
                    {!referenceImage ? (
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-neutral-600 rounded-lg cursor-pointer hover:bg-neutral-700/50 transition-colors">
                            <Upload className="text-neutral-500 mb-1" size={16} />
                            <span className="text-[10px] text-neutral-400 text-center px-2">Загрузить картинку</span>
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
            )}
        </div>

      </div>

      {/* Модальное окно с горячими клавишами */}
      {showHotkeys && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowHotkeys(false)}>
          <div className="bg-neutral-800 rounded-xl border border-neutral-700 shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-neutral-700">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Keyboard size={20} className="text-green-500" />
                Горячие клавиши
              </h2>
              <button onClick={() => setShowHotkeys(false)} className="text-neutral-400 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-neutral-700">
                <span className="text-neutral-300">Карандаш</span>
                <kbd className="bg-neutral-700 px-2 py-1 rounded text-xs text-white font-mono">1</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-neutral-700">
                <span className="text-neutral-300">Пипетка</span>
                <kbd className="bg-neutral-700 px-2 py-1 rounded text-xs text-white font-mono">2</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-neutral-700">
                <span className="text-neutral-300">Ластик</span>
                <kbd className="bg-neutral-700 px-2 py-1 rounded text-xs text-white font-mono">3</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-neutral-700">
                <span className="text-neutral-300">Выделение</span>
                <kbd className="bg-neutral-700 px-2 py-1 rounded text-xs text-white font-mono">M</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-neutral-700">
                <span className="text-neutral-300">Панорамирование</span>
                <kbd className="bg-neutral-700 px-2 py-1 rounded text-xs text-white font-mono">H</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-neutral-700">
                <span className="text-neutral-300">Перемещение слоя</span>
                <kbd className="bg-neutral-700 px-2 py-1 rounded text-xs text-white font-mono">↑↓←→</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-neutral-700">
                <span className="text-neutral-300">Отменить (Undo)</span>
                <kbd className="bg-neutral-700 px-2 py-1 rounded text-xs text-white font-mono">Z</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-neutral-700">
                <span className="text-neutral-300">Повторить (Redo)</span>
                <kbd className="bg-neutral-700 px-2 py-1 rounded text-xs text-white font-mono">X</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-neutral-700">
                <span className="text-neutral-300">Снять выделение</span>
                <kbd className="bg-neutral-700 px-2 py-1 rounded text-xs text-white font-mono">Esc</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-neutral-700">
                <span className="text-neutral-300">Сетка</span>
                <kbd className="bg-neutral-700 px-2 py-1 rounded text-xs text-white font-mono">G</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-neutral-700">
                <span className="text-neutral-300">Индексы/Палитра</span>
                <kbd className="bg-neutral-700 px-2 py-1 rounded text-xs text-white font-mono">H</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-neutral-700">
                <span className="text-neutral-300">Полный экран</span>
                <kbd className="bg-neutral-700 px-2 py-1 rounded text-xs text-white font-mono">F11</kbd>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-neutral-300">Полный экран (альт)</span>
                <kbd className="bg-neutral-700 px-2 py-1 rounded text-xs text-white font-mono">Alt+Enter</kbd>
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
      `}</style>
    </div>
  );
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
