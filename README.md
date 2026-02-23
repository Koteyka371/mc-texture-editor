# MC Texture Editor Pro 🎨

A powerful web-based pixel art texture editor for Minecraft, built with React + Vite + Tailwind CSS.

**Live Demo:** https://Koteyka371.github.io/mc-texture-editor/

---

## ✨ Features

### 🎨 Drawing Tools
- **Pencil** - Draw pixel by pixel
- **Eraser** - Remove pixels
- **Color Picker** - Sample colors from canvas
- **Fill Bucket** - Flood fill areas
- **Color Replace** - Replace one color with another
- **Marquee Selection** - Select rectangular areas

### 🌙 Special Modes
- **Shading Mode** - Darken colors while drawing
- **Lighting Mode** - Lighten colors while drawing
- **Dithering** - Create textured patterns
- **Symmetry** - Horizontal and vertical mirror drawing

### 📐 Transformations
- **Flip Horizontal/Vertical** - Mirror the layer
- **Rotate 90°** - Quick rotation
- **Smooth Rotation** - Rotate by any angle

### 📊 Layers System
- Multiple layers support
- Layer visibility toggle
- Layer reordering
- Merge layers down
- Layer movement (arrow keys)

### 🎮 3D Cube Preview
- Real-time 3D preview of textures
- Rotate cube with mouse drag
- Upload textures to each face
- Apply face textures to canvas
- Copy canvas to cube faces

### 🎨 Palette System
- Auto-generate palette from canvas
- Edit palette colors (HEX input)
- Save/load custom palettes
- Indexed color mode

### ⚡ Productivity
- **Undo/Redo** - Up to 30 steps
- **Hotkeys** - Fully customizable keyboard shortcuts
- **Grid overlay** - Perfect pixel alignment
- **Zoom** - 2x to 60x magnification
- **Pan tool** - Navigate large canvases

### 🖼️ Reference Images
- Upload reference images
- Color picker from reference
- Side-by-side editing

### 🎬 Animation Preview
- Animate through layers as frames
- Adjustable FPS (1-24)
- Real-time preview

### 📤 Import/Export
- **PNG Export** - Download your textures
- **Image Import** - Load images as layers
- **Data Import/Export** - Copy/paste texture data format

---

## ⌨️ Default Hotkeys

| Action | Key |
|--------|-----|
| Pencil | 1 |
| Eraser | 2 |
| Color Picker | 3 |
| Replace Color | 4 |
| Selection | M |
| Pan | H / Space |
| Deselect | Esc |
| Undo | Ctrl+Z |
| Redo | Ctrl+Shift+Z |
| Grid | G |
| Fullscreen | F11 / Alt+Enter |

**Customize:** Click keyboard icon (⌨️) in top-right to change hotkeys!

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/Koteyka371/mc-texture-editor.git
cd mc-texture-editor

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 🛠️ Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **Lucide React** - Icon library

---

## 📝 Usage Tips

1. **Start Small** - Begin with 16x16 or 32x32 canvas
2. **Use Layers** - Keep different elements on separate layers
3. **Save Palettes** - Build color palettes for consistent styles
4. **3D Preview** - Check how textures look on actual blocks
5. **Custom Hotkeys** - Set up shortcuts for your workflow

---

## 🌐 Deployment

Automatically deploys to GitHub Pages on every push to `main` branch.

**CI/CD:** GitHub Actions workflow handles building and deployment.

---

## 📄 License

MIT License - feel free to use for your projects!

---

## 🙏 Acknowledgments

Built for Minecraft texture creators and pixel art enthusiasts.

Made with ❤️ using React + Vite
