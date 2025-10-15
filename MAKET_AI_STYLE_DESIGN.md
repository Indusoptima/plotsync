# Maket.ai Professional Floor Plan Design

## Overview
PlotSync floor plans now feature a **professional, clean architectural design** inspired by Maket.ai's high-quality output.

## Design Principles

### 1. **Clean Black & White Aesthetic**
- ✅ Pure white room backgrounds (#ffffff)
- ✅ Bold black walls (#000000)
- ✅ No colored fills or gradients
- ✅ Professional architectural appearance

### 2. **Professional Furniture Symbols**
Replaced emoji-based furniture with **geometric shapes** like architectural drawings:

| Furniture | Old (Emoji) | New (Professional Shape) |
|-----------|-------------|--------------------------|
| **Sofa** | 🛋️ | Black rectangle with backrest |
| **Bed** | 🛏️ | Large rectangle with pillow section |
| **Table** | 🪑 | Circle outline (dining table) |
| **Toilet** | 🚽 | Circle with tank rectangle |
| **Sink/Bathtub** | 🚰 | Rectangle outline |
| **Stove** | 🔥 | Rectangle with burner circles |
| **Chair** | 💺 | Small square outline |

### 3. **Typography & Labels**
- **Room names**: 13px Arial, bold, black (#1a1a1a)
- **Centered** in each room
- **Clean placement** without cluttering
- **No area/dimension labels** (like Maket.ai - cleaner look)

### 4. **Architectural Elements**

#### Walls
- **Color**: Pure black (#000000)
- **Width**: 6px (bold but not overwhelming)
- **Style**: Square line caps (crisp corners)
- **No dimension labels** (clean appearance)

#### Doors
- **Opening**: White gap in wall (#ffffff, 8px width)
- **Swing arc**: Black dashed line (3,3 pattern)
- **Simple**: Just arc, no decorative elements
- **Professional**: Matches CAD software style

#### Windows
- **Style**: Simple black line (#000000, 3px)
- **Clean**: No double lines or colored frames
- **Architectural**: Minimal representation

## Visual Comparison

### Before (Colorful Style)
```
❌ Colored room fills (purple, blue, etc.)
❌ Emoji furniture (🛏️, 🛋️, 🚽)
❌ Dimension labels everywhere
❌ Dotted grid background
❌ Colored doors/windows (purple, blue)
❌ Multiple text labels per room
```

### After (Maket.ai Style)
```
✅ Pure white rooms
✅ Geometric furniture shapes
✅ Room names only
✅ Clean white background
✅ Black walls, doors, windows
✅ Minimal, professional labels
```

## Implementation Details

### 2D Canvas (Konva.js)

#### Background
```typescript
// Clean white background
<Rect
  x={-width}
  y={-height}
  width={width * 3}
  height={height * 3}
  fill="#ffffff"
/>
```

#### Rooms
```typescript
// Pure white fill, no borders
<Rect
  x={room.x * scale + offsetX}
  y={room.y * scale + offsetY}
  width={room.width * scale}
  height={room.height * scale}
  fill="#ffffff"
/>

// Clean room name only
<Text
  text={room.name}
  fontSize={13}
  fontFamily="Arial, sans-serif"
  fontStyle="bold"
  fill="#1a1a1a"
/>
```

#### Walls
```typescript
// Bold black walls
<Line
  points={[x1, y1, x2, y2]}
  stroke="#000000"
  strokeWidth={6}
  lineCap="square"
/>
```

#### Professional Furniture
```typescript
// Sofa - rectangle with backrest
<>
  <Rect width={35} height={20} fill="#000000" />
  <Rect width={35} height={5} fill="#000000" />
</>

// Bed - rectangle with pillow
<>
  <Rect width={30} height={40} fill="#000000" />
  <Rect width={30} height={8} fill="#666666" />
</>

// Table - circle outline
<Circle radius={12} fill="none" stroke="#000000" strokeWidth={2} />
```

### SVG Exporter

#### Same Design Principles
```xml
<!-- Clean white background -->
<rect width="1200" height="900" fill="#ffffff" />

<!-- Rooms with pure white fill -->
<rect fill="#ffffff" stroke="none" />

<!-- Bold black walls -->
<line stroke="#000000" strokeWidth="6" />

<!-- Professional furniture shapes -->
<g id="furniture">
  <!-- Sofa -->
  <rect fill="#000000" />
  
  <!-- Table -->
  <circle fill="none" stroke="#000000" />
</g>
```

## Furniture Rendering Function

### Canvas (Konva.js)
```typescript
function renderFurnitureShape(
  item: string,
  room: { x, y, width, height },
  index: number,
  scale: number,
  offsetX: number,
  offsetY: number
) {
  // 6 strategic positions in room
  const positions = [
    { x: roomX + 15, y: roomY + 15 },           // Top-left
    { x: roomX + roomWidth - 35, y: roomY + 15 }, // Top-right
    { x: roomX + 15, y: roomY + roomHeight - 35 }, // Bottom-left
    // ... 3 more positions
  ]
  
  const pos = positions[index % positions.length]
  const type = item.toLowerCase()
  
  // Render specific shape based on furniture type
  if (type === 'sofa') {
    return <Rect.../> // Sofa shape
  }
  // ... other furniture types
}
```

### SVG
```typescript
function renderSVGFurniture(
  item: string,
  roomX, roomY, roomWidth, roomHeight,
  index: number,
  roomIndex: number
) {
  // Same positioning logic
  // Same shapes, but using SVG elements
  return <g key={furKey}>...</g>
}
```

## Furniture Positioning Strategy

### Smart Placement Algorithm
1. **6 predefined positions** per room:
   - Top-left
   - Top-right
   - Bottom-left
   - Bottom-right
   - Top-center
   - Bottom-center

2. **Cycling**: Furniture items cycle through positions
   - Item 0 → Top-left
   - Item 1 → Top-right
   - Item 2 → Bottom-left
   - Item 3 → Bottom-right
   - Item 4 → Top-center
   - Item 5 → Bottom-center
   - Item 6 → Back to top-left

3. **Spacing**: 15px padding from edges

## Design Benefits

### For Users
✅ **Professional appearance** - Looks like CAD software output  
✅ **Clean & readable** - Easy to understand room layouts  
✅ **Print-ready** - Black & white for easy printing  
✅ **Client presentations** - Professional quality for proposals  

### For Architects
✅ **Industry standard** - Matches architectural drawing conventions  
✅ **Editable** - Easy to modify in vector editors  
✅ **Scalable** - Maintains quality at any size  
✅ **Compatible** - Works with AutoCAD, Revit workflows  

### For Real Estate
✅ **Marketing ready** - Professional floor plans for listings  
✅ **Consistent branding** - Clean, uniform appearance  
✅ **Cost effective** - No need for professional drafting  

## Examples

### Kitchen Floor Plan
```
┌─────────────────────────┐
│                         │
│     Kitchen 1           │ ← Clean room name
│                         │
│  ◯ ◯                   │ ← Stove (circles = burners)
│  ▭                     │
│                         │
│         ⭕             │ ← Table (circle)
│                         │
└─────────────────────────┘
```

### Bedroom Floor Plan
```
┌─────────────────────────┐
│  ▭▭▭▭▭▭▭▭▭            │ ← Bed (rectangle)
│  ▭▭▭▭▭▭▭▭▭            │
│                         │
│     Bedroom 1           │
│                         │
│                    ▭▭▭ │ ← Wardrobe
│                         │
└─────────────────────────┘
```

### Living Room Floor Plan
```
┌─────────────────────────┐
│  ▭▭▭▭▭▭▭               │ ← Sofa
│  ▭                      │
│                         │
│   Living room 1         │
│                         │
│         ⭕             │ ← Coffee table
│                         │
└─────────────────────────┘
```

## Color Palette

### Main Colors
- **Background**: `#ffffff` (pure white)
- **Walls**: `#000000` (pure black)
- **Text**: `#1a1a1a` (near black)
- **Furniture**: `#000000` (black outlines/fills)

### Removed Colors
- ❌ `#8b5cf6` (purple doors)
- ❌ `#3b82f6` (blue windows)
- ❌ `#e5e7eb` (gray grid)
- ❌ `#94a3b8` (gray room borders)
- ❌ All colored room fills

## Typography

### Font Specifications
```typescript
{
  fontFamily: "Arial, sans-serif",
  fontSize: 13,  // Room names
  fontWeight: "600",  // Bold
  fill: "#1a1a1a",  // Near black
  align: "center"
}
```

### Text Placement
- **Room names**: Centered vertically and horizontally
- **No area labels**: Removed for cleaner look
- **No dimension labels**: Removed for cleaner look
- **Entry markers**: Could add "Entry" text (like Maket.ai)

## Comparison with Maket.ai

### Matching Features ✅
- ✅ Black walls
- ✅ White rooms
- ✅ Professional furniture symbols
- ✅ Clean typography
- ✅ Minimal labels
- ✅ Architectural style

### PlotSync Advantages 🚀
- ✅ **Interactive zoom/pan** - Better than static image
- ✅ **3D visualization** - Switch to 3D view
- ✅ **Multiple proposals** - Compare variations
- ✅ **Editable SVG** - Export for external editing
- ✅ **Free & unlimited** - No subscription required

## Future Enhancements

### Planned Improvements
- [ ] **Entry markers** - Add "Entry" label like Maket.ai
- [ ] **Dimension toggle** - Show/hide measurements on demand
- [ ] **Furniture library** - More detailed symbols
- [ ] **Wall thickness** - Filled walls instead of lines
- [ ] **Textures** - Optional floor textures
- [ ] **North arrow** - Orientation indicator
- [ ] **Scale bar** - Visual scale reference

### Advanced Features
- [ ] **Custom furniture** - Upload custom symbols
- [ ] **Color themes** - Alternative color schemes
- [ ] **Print layouts** - A4/Letter sized exports
- [ ] **Multi-floor** - Stacked floor plan views

## Migration Notes

### Breaking Changes
⚠️ **Visual changes only** - No API changes  
⚠️ **Data structure unchanged** - Existing floor plans work  
⚠️ **Backwards compatible** - Old and new styles coexist  

### User Impact
✅ **Automatic upgrade** - All floor plans use new style  
✅ **No action required** - Seamless transition  
✅ **Better quality** - Immediate visual improvement  

## Conclusion

PlotSync now generates **professional, Maket.ai-style floor plans** with:

✅ **Clean black & white aesthetic**  
✅ **Geometric furniture symbols**  
✅ **Professional typography**  
✅ **Architectural quality rendering**  
✅ **Industry-standard appearance**  

This transforms PlotSync from a good floor plan generator to a **professional architectural design tool** suitable for:
- Real estate listings
- Client presentations
- Architectural proposals
- Construction documentation
- Marketing materials

The new design maintains PlotSync's core advantages (interactive, 3D, free) while matching the visual quality of premium paid tools like Maket.ai! 🎯
