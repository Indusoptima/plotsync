# 2D Canvas Zoom and Pan Feature

## Overview
The 2D canvas view (Konva.js) now includes **interactive zoom and pan controls** matching the SVG viewer functionality.

## Features

### 1. **Auto Fit to Screen** (Default Behavior)
When you switch to 2D view or generate a new floor plan, it automatically scales to fit the viewport.

**Implementation:**
```typescript
useEffect(() => {
  if (planData && stageRef.current) {
    handleFitToScreen()
  }
}, [planData])
```

### 2. **Zoom Controls** (Top-Right Panel)

#### **Zoom In** (+)
- Click to increase zoom by 20% (1.2x multiplier)
- Mouse wheel scroll up
- Maximum zoom: 500% (5x)
- Zooms towards center of viewport

#### **Zoom Out** (-)
- Click to decrease zoom by ~17% (0.83x multiplier)
- Mouse wheel scroll down
- Minimum zoom: 10% (0.1x)
- Zooms away from center of viewport

#### **Fit to Screen** (⛶)
- Resets to optimal view with padding
- Centers the floor plan
- Calculates best zoom level (max 150%)

#### **Zoom Percentage**
- Real-time display of current zoom level
- Updates during all zoom operations

### 3. **Mouse Wheel Zoom**
- **Scroll up** → Zoom in
- **Scroll down** → Zoom out
- **Zooms towards mouse cursor position** (not center)
- Smooth incremental zooming
- Prevents page scroll

**Technical Implementation:**
```typescript
const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
  e.evt.preventDefault()
  
  const pointer = stage.getPointerPosition()
  const mousePointTo = {
    x: (pointer.x - stage.x()) / oldScale,
    y: (pointer.y - stage.y()) / oldScale,
  }

  const delta = e.evt.deltaY > 0 ? 0.9 : 1.1
  const newScale = Math.max(0.1, Math.min(oldScale * delta, 5))

  const newPos = {
    x: pointer.x - mousePointTo.x * newScale,
    y: pointer.y - mousePointTo.y * newScale,
  }
}
```

### 4. **Pan (Drag to Move)**
- **Click and drag** anywhere on canvas to pan
- Cursor changes to "grab" (via Konva's draggable)
- Works at any zoom level
- Smooth drag interaction

**Konva Stage Properties:**
```typescript
<Stage
  draggable  // Enables click-drag panning
  onDragEnd={handleDragEnd}  // Saves position
/>
```

## User Interface

### Control Panel (Top-Right)
Same as SVG viewer:
```
┌─────────────┐
│     +       │  Zoom In
├─────────────┤
│     -       │  Zoom Out
├─────────────┤
│     ⛶       │  Fit to Screen
├─────────────┤
│    100%     │  Current Zoom
└─────────────┘
```

## State Management

### React State
```typescript
const [stageScale, setStageScale] = useState(1)              // Zoom level
const [stagePos, setStagePos] = useState({ x: 0, y: 0 })     // Pan position
```

### Konva Stage Props
```typescript
<Stage
  scaleX={stageScale}
  scaleY={stageScale}
  x={stagePos.x}
  y={stagePos.y}
  draggable
  onWheel={handleWheel}
  onDragEnd={handleDragEnd}
/>
```

## Zoom Logic

### Button Zoom (Zoom In/Out)
Zooms towards **center of viewport**:

```typescript
const handleZoomIn = () => {
  const oldScale = stage.scaleX()
  const newScale = Math.min(oldScale * 1.2, 5)
  
  const center = {
    x: width / 2,
    y: height / 2,
  }
  
  // Adjust position to zoom towards center
  const newPos = {
    x: center.x - (center.x - stage.x()) * (newScale / oldScale),
    y: center.y - (center.y - stage.y()) * (newScale / oldScale),
  }
  
  setStageScale(newScale)
  setStagePos(newPos)
}
```

### Wheel Zoom
Zooms towards **mouse cursor position**:

```typescript
const mousePointTo = {
  x: (pointer.x - stage.x()) / oldScale,
  y: (pointer.y - stage.y()) / oldScale,
}

const newPos = {
  x: pointer.x - mousePointTo.x * newScale,
  y: pointer.y - mousePointTo.y * newScale,
}
```

### Fit to Screen
Calculates optimal zoom with padding:

```typescript
const handleFitToScreen = () => {
  // Calculate floor plan bounds
  const planWidth = maxX - minX
  const planHeight = maxY - minY
  
  // Fixed scale (15px per meter)
  const scaledWidth = planWidth * 15
  const scaledHeight = planHeight * 15
  
  // Calculate zoom to fit with 100px padding
  const padding = 100
  const scaleX = (width - padding * 2) / scaledWidth
  const scaleY = (height - padding * 2) / scaledHeight
  const optimalScale = Math.min(scaleX, scaleY, 1.5)
  
  setStageScale(optimalScale)
  setStagePos({ x: 0, y: 0 })
}
```

## Comparison: 2D Canvas vs SVG

| Feature | 2D Canvas (Konva.js) | SVG |
|---------|---------------------|-----|
| **Zoom In/Out** | ✅ Konva Stage scale | ✅ CSS transform scale |
| **Pan** | ✅ Konva Stage draggable | ✅ Custom drag handler |
| **Wheel Zoom** | ✅ Mouse cursor position | ✅ Immediate scaling |
| **Fit to Screen** | ✅ Auto on mount | ✅ Auto on mount |
| **Zoom Towards** | Center (buttons) / Cursor (wheel) | Center always |
| **Performance** | High (Canvas API) | Good (DOM/SVG) |
| **Interaction** | Native Konva events | Custom React events |

## Key Differences

### 2D Canvas (Konva.js)
- **Zoom towards cursor** with mouse wheel (more intuitive)
- **Native draggable** support (built into Konva)
- **Canvas-based rendering** (better performance for complex plans)
- **Event handling** via Konva event system

### SVG
- **Zoom towards center** always
- **Custom drag implementation** with React events
- **DOM-based rendering** (better for editing/exporting)
- **Event handling** via React synthetic events

## Usage Examples

### Basic 2D Canvas with Zoom
```tsx
<FloorPlanCanvas
  planData={floorPlanData}
  width={1200}
  height={900}
/>
```

The zoom controls are automatically included - no additional props needed!

## Behavior Details

### Auto-Fit Trigger
Automatically fits to screen when:
1. ✅ Component first mounts with plan data
2. ✅ Plan data changes (new generation)
3. ✅ User clicks "Fit to Screen" button

### Zoom Limits
- **Minimum:** 10% (0.1x)
- **Maximum:** 500% (5x)
- **Auto-fit cap:** 150% (1.5x)

### Pan Constraints
- ✅ Can drag in any direction (no bounds)
- ✅ Position saved on drag end
- ✅ Position preserved during zoom
- ✅ Reset to center (0, 0) when fit to screen

## Mouse Interactions

### Button Clicks
1. **Zoom In** → Zoom towards viewport center
2. **Zoom Out** → Zoom away from viewport center
3. **Fit to Screen** → Reset to optimal view

### Mouse Wheel
1. **Scroll Up** → Zoom in towards cursor
2. **Scroll Down** → Zoom out from cursor
3. **While Panning** → Zoom and pan simultaneously

### Click & Drag
1. **Click** → Grab canvas
2. **Drag** → Move view
3. **Release** → Save position

## Edge Cases Handled

### ✅ No Plan Data
Shows placeholder message with 📐 icon instead of blank canvas

### ✅ Plan Changes During Zoom
Auto-fits to new plan, resets zoom/pan

### ✅ Rapid Zoom Clicks
Smooth accumulation, no jitter

### ✅ Zoom + Pan Combination
Works simultaneously without conflict

### ✅ Mouse Leaves Viewport
Konva handles this automatically

## Performance Optimizations

### 1. **Konva Stage Scaling**
```typescript
<Stage
  scaleX={stageScale}
  scaleY={stageScale}
/>
```
- Uses Konva's native transform (GPU accelerated)
- No DOM manipulation required
- Smooth 60fps rendering

### 2. **State Updates**
```typescript
setStageScale(newScale)
setStagePos(newPos)
```
- Minimal re-renders (only Stage props change)
- Layer content not re-rendered during zoom/pan
- Efficient React state management

### 3. **Wheel Event Prevention**
```typescript
e.evt.preventDefault()
```
- Prevents page scroll
- Improves user experience

## Konva-Specific Features

### Stage Transform
Konva's Stage component handles:
- ✅ **scaleX/scaleY** - Zoom level
- ✅ **x/y** - Pan position
- ✅ **draggable** - Enable/disable drag
- ✅ **onWheel** - Mouse wheel events
- ✅ **onDragEnd** - Drag completion

### Layer Rendering
All floor plan elements (walls, rooms, doors) are in Konva Layers:
- Rendered once
- Transformed by Stage
- No re-rendering during zoom/pan
- Excellent performance

## Future Enhancements

- [ ] **Touch Gestures** - Pinch-to-zoom on mobile/tablet
- [ ] **Keyboard Shortcuts** - +/- keys for zoom
- [ ] **Zoom to Selection** - Click room to zoom to it
- [ ] **Pan Bounds** - Limit panning to floor plan area
- [ ] **Mini-map** - Overview showing current viewport
- [ ] **Smooth Zoom Animation** - Animated transitions

## Troubleshooting

### Issue: Zoom not working
**Check:** Ensure stageRef.current exists before zoom operations

### Issue: Pan feels laggy
**Solution:** Konva's draggable is optimized, should be smooth. Check browser performance.

### Issue: Wheel zooms page instead of canvas
**Solution:** `e.evt.preventDefault()` should handle this automatically

### Issue: Zoom resets when generating new plan
**Expected behavior:** Auto-fits to new floor plan for optimal view

## Conclusion

The 2D canvas now has **professional zoom and pan controls** matching the SVG viewer:

✅ **Auto-fit to screen** on load  
✅ **Three zoom methods**: buttons, wheel, fit-to-screen  
✅ **Smooth panning** with click-drag  
✅ **Visual feedback** with zoom percentage  
✅ **Konva-optimized** for high performance  
✅ **Consistent with SVG viewer** for unified UX  

Both 2D and SVG views now provide the same professional CAD-like experience! 🎯
