# SVG Floor Plan Feature

## Overview
PlotSync now generates **editable SVG floor plans** instead of static canvas images. This allows users to export, edit, and manipulate floor plans in any vector graphics editor (Adobe Illustrator, Inkscape, Figma, etc.).

## What Changed

### Previous Approach (Canvas)
- Floor plans rendered using Konva.js on HTML5 Canvas
- **Static raster output** - cannot be edited externally
- Export only as PNG/JPEG images
- Limited to browser-based editing

### New Approach (SVG)
- Floor plans rendered as **pure SVG** (Scalable Vector Graphics)
- **Fully editable** in any vector graphics software
- Export as `.svg` files with complete metadata
- Preserve all architectural elements with unique IDs
- Infinite scalability without quality loss

## Features

### 1. **Three View Modes**
- **2D Canvas** - Interactive Konva.js canvas with zoom/pan
- **3D View** - React Three Fiber 3D visualization
- **SVG Editor** - NEW! Editable vector floor plan

### 2. **SVG Structure**
Each floor plan SVG contains properly organized groups:

```xml
<svg width="1200" height="900" viewBox="0 0 1200 900">
  <!-- Background grid -->
  <rect fill="url(#grid)" />
  
  <g id="floorPlan">
    <!-- Rooms with unique IDs -->
    <g id="rooms">
      <g id="room-0-Living-Room">
        <rect fill="#E8E8E8" />
        <text>Living Room</text>
        <text>25.5 m²</text>
      </g>
    </g>
    
    <!-- Walls with dimension labels -->
    <g id="walls">
      <g id="wall-0">
        <line stroke="#334155" stroke-width="8" />
        <text>5.2m</text>
      </g>
    </g>
    
    <!-- Doors with arcs -->
    <g id="doors">
      <g id="door-0">
        <line stroke="#8B4513" />
        <path d="..." />
      </g>
    </g>
    
    <!-- Windows -->
    <g id="windows">
      <g id="window-0">
        <line stroke="#60a5fa" />
      </g>
    </g>
  </g>
  
  <!-- Scale indicator -->
  <g id="scaleIndicator">
    <text>5m</text>
  </g>
  
  <!-- Metadata -->
  <g id="metadata">
    <text>Floor Plan - 4 Rooms</text>
    <text>Scale: 1:7 • Total Area: 120.5 m²</text>
  </g>
</svg>
```

### 3. **Unique Element IDs**
Every element has a semantic ID for easy editing:
- Rooms: `room-0-Living-Room`, `room-1-Kitchen`, etc.
- Walls: `wall-0`, `wall-1`, etc.
- Doors: `door-0`, `door-1`, etc.
- Windows: `window-0`, `window-1`, etc.

### 4. **Visual Features**
- ✅ **Fixed Scale** - 15 pixels per meter (consistent with canvas)
- ✅ **Centered Layout** - Proper bounds calculation
- ✅ **Dimension Labels** - Wall lengths, room areas, room dimensions
- ✅ **Material Colors** - Wood, concrete, brick, marble, tile
- ✅ **Furniture Icons** - Emoji-based furniture placement
- ✅ **Grid Background** - Reference grid for precision
- ✅ **Scale Indicator** - Visual scale bar (5m reference)
- ✅ **Metadata Header** - Room count, total area, scale ratio

### 5. **Download Functionality**
```typescript
// One-click SVG download
<Button onClick={() => downloadFloorPlanSVG(currentPlan, `floor-plan-${Date.now()}.svg`)}>
  <Download className="mr-1 h-4 w-4" />
  Download SVG
</Button>
```

## Usage

### For Users
1. Generate floor plan with AI or manual editor
2. Click **"SVG"** tab in view mode toggle
3. Review the editable vector floor plan
4. Click **"Download SVG"** to export
5. Open in any vector editor (Illustrator, Inkscape, Figma, etc.)
6. Edit walls, rooms, labels, colors freely
7. Export to any format (PDF, PNG, DXF, etc.)

### For Developers
```tsx
import { FloorPlanSVGExporter, downloadFloorPlanSVG } from "@/components/editor/floor-plan-svg-exporter"

// Render SVG
<FloorPlanSVGExporter
  planData={floorPlanData}
  width={1200}
  height={900}
/>

// Download SVG
downloadFloorPlanSVG(floorPlanData, 'my-floor-plan.svg')
```

## Technical Details

### Fixed Scale Rendering
Same 15 pixels per meter scale as canvas:
```typescript
const scale = 15 // FIXED SCALE: 15 pixels per meter
const scaledWidth = planWidth * scale
const scaledHeight = planHeight * scale
```

### Proper Centering
Uses actual bounds (no default values):
```typescript
const minX = Math.min(...allX)  // Not Math.min(...allX, 0)
const maxX = Math.max(...allX)  // Not Math.max(...allX, 100)

const offsetX = (width - scaledWidth) / 2 - minX * scale
const offsetY = (height - scaledHeight) / 2 - minY * scale
```

### Material Colors
```typescript
const getMaterialColor = (material?: string): string => {
  const colors: Record<string, string> = {
    wood: "#8B4513",
    concrete: "#808080",
    brick: "#B22222",
    marble: "#F0F0F0",
    tile: "#D3D3D3",
    default: "#E8E8E8",
  }
  return colors[material || "default"] || colors.default
}
```

## Benefits

### For Architects & Designers
- ✅ **Professional Editing** - Use industry-standard tools (AutoCAD, Revit imports)
- ✅ **Client Presentations** - High-quality vector graphics for proposals
- ✅ **Print Ready** - Infinite scalability for large format printing
- ✅ **Style Customization** - Change colors, fonts, line weights freely

### For Developers
- ✅ **Clean Code** - Semantic SVG structure with proper IDs
- ✅ **Accessibility** - Text elements readable by screen readers
- ✅ **Interoperability** - Standard SVG format works everywhere
- ✅ **Version Control** - SVG is text-based, works with Git

### For End Users
- ✅ **Easy Export** - One-click download
- ✅ **Universal Compatibility** - Opens in any modern software
- ✅ **No Vendor Lock-in** - Standard format, not proprietary
- ✅ **Future-Proof** - SVG is a W3C standard since 2001

## File Structure

```
components/editor/
├── floor-plan-canvas.tsx          # Konva.js 2D canvas (existing)
├── floor-plan-3d-viewer.tsx       # React Three Fiber 3D view (existing)
└── floor-plan-svg-exporter.tsx    # NEW! SVG generation & export
```

## Example Export

**Filename**: `floor-plan-1736825472000.svg`

**File Size**: ~15-30 KB (text-based, very small!)

**Opens In**:
- Adobe Illustrator
- Inkscape (free)
- Figma
- Sketch
- Affinity Designer
- CorelDRAW
- Web browsers
- Microsoft Visio
- AutoCAD (with SVG import)

## Future Enhancements

### Planned Features
- [ ] **Inline Editing** - Edit SVG directly in browser
- [ ] **Layer Management** - Show/hide walls, furniture, labels
- [ ] **Style Presets** - Architectural, minimalist, colorful themes
- [ ] **DXF Export** - Direct AutoCAD format export
- [ ] **PDF Export** - Print-ready PDF with embedded fonts
- [ ] **Measurement Tools** - Add custom dimensions to SVG
- [ ] **Annotation Layer** - Add notes and callouts

### Advanced Features
- [ ] **Parametric Elements** - Change room size by dragging handles
- [ ] **Smart Snapping** - Align elements to grid
- [ ] **Symbol Libraries** - Drag-and-drop furniture symbols
- [ ] **Multi-page Export** - Generate multiple floors in one file

## Code Example

### Generate Floor Plan
```typescript
// AI generates floor plan data
const floorPlan = {
  walls: [
    { x1: 0, y1: 0, x2: 10, y2: 0 },
    { x1: 10, y1: 0, x2: 10, y2: 8 },
    { x1: 10, y1: 8, x2: 0, y2: 8 },
    { x1: 0, y1: 8, x2: 0, y2: 0 },
  ],
  rooms: [
    {
      name: "Living Room",
      x: 0,
      y: 0,
      width: 10,
      height: 8,
      furniture: ["sofa", "table"],
      material: "wood",
    },
  ],
  doors: [{ x: 5, y: 0, rotation: 0 }],
  windows: [{ x: 2, y: 0, width: 1.5 }],
}
```

### Render as SVG
```tsx
<FloorPlanSVGExporter
  planData={floorPlan}
  width={1200}
  height={900}
/>
```

### Download SVG
```typescript
downloadFloorPlanSVG(floorPlan, 'living-room-plan.svg')
```

## Comparison: Canvas vs SVG

| Feature | Canvas (2D) | SVG |
|---------|------------|-----|
| **Format** | Raster (pixels) | Vector (paths) |
| **Scalability** | Pixelated when zoomed | Infinite quality |
| **Editability** | Browser only | Any vector editor |
| **File Size** | Large (images) | Small (text) |
| **Interactivity** | High (Konva.js) | Medium (DOM events) |
| **Export** | PNG, JPEG | SVG, PDF, DXF |
| **Best For** | In-app editing | Professional workflows |

## Conclusion

The SVG floor plan feature transforms PlotSync from a browser-only tool to a **professional architectural design platform**. Users can now:

1. ✅ Generate AI floor plans
2. ✅ View in 2D canvas, 3D, or SVG
3. ✅ Download editable SVG files
4. ✅ Edit in professional software
5. ✅ Integrate with existing workflows

This feature makes PlotSync **production-ready** for architects, designers, and real estate professionals who need high-quality, editable floor plans.
