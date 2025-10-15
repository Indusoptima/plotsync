# SVG Zoom and Pan Feature

## Overview
The SVG floor plan viewer now includes **interactive zoom and pan controls** with automatic fit-to-screen functionality.

## Features

### 1. **Auto Fit to Screen** (Default Behavior)
When you switch to SVG view, the floor plan automatically scales to fit the available screen space with optimal padding.

**How it works:**
- Calculates floor plan bounds (min/max coordinates)
- Determines available container size
- Calculates optimal zoom level to fit with 100px padding
- Centers the floor plan in the viewport
- Maximum auto-zoom capped at 150% (1.5x) to prevent over-magnification

```typescript
const padding = 100
const zoomX = (containerWidth - padding * 2) / scaledWidth
const zoomY = (containerHeight - padding * 2) / scaledHeight
const optimalZoom = Math.min(zoomX, zoomY, 1.5)
```

### 2. **Zoom Controls**

#### **Zoom In** (+)
- Click the zoom in button or scroll up with mouse wheel
- Increases zoom by 20% per click (1.2x multiplier)
- Maximum zoom: 500% (5x)
- Keyboard: `Ctrl/Cmd + Mouse Wheel Up`

#### **Zoom Out** (-)
- Click the zoom out button or scroll down with mouse wheel
- Decreases zoom by ~17% per click (0.83x multiplier)
- Minimum zoom: 10% (0.1x)
- Keyboard: `Ctrl/Cmd + Mouse Wheel Down`

#### **Fit to Screen** (⛶)
- Click the maximize button to reset to optimal fit
- Resets pan position to center
- Calculates best zoom level for current floor plan
- Useful after zooming in too far

#### **Zoom Percentage Display**
- Shows current zoom level as percentage
- Located below zoom controls
- Updates in real-time
- Example: "100%", "150%", "75%"

### 3. **Pan (Drag to Move)**
- Click and drag anywhere on the SVG to pan
- Cursor changes to "grab" when hovering
- Cursor changes to "grabbing" while dragging
- Works at any zoom level
- Smooth transitions when releasing

**Mouse Interaction:**
- `Mouse Down` → Start panning (grab mode)
- `Mouse Move` → Pan the view
- `Mouse Up` → Stop panning
- `Mouse Leave` → Auto-stop panning (prevents stuck drag)

### 4. **Mouse Wheel Zoom**
- Scroll wheel up → Zoom in
- Scroll wheel down → Zoom out
- Smooth incremental zooming
- Works from any zoom level
- Automatically prevents page scroll when over SVG

## User Interface

### Control Panel (Top Right)
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

**Styling:**
- White background with shadow
- Gray hover state
- 40px × 40px icon buttons
- Lucide icons (ZoomIn, ZoomOut, Maximize2)
- Responsive and touch-friendly

## Technical Implementation

### State Management
```typescript
const [zoom, setZoom] = useState(1)              // Current zoom level (1 = 100%)
const [pan, setPan] = useState({ x: 0, y: 0 })   // Pan offset in pixels
const [isPanning, setIsPanning] = useState(false) // Drag state
const [dragStart, setDragStart] = useState({ x: 0, y: 0 }) // Drag origin
```

### Transform Application
```typescript
<div
  style={{
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
    transformOrigin: 'center center',
    transition: isPanning ? 'none' : 'transform 0.2s ease-out',
  }}
>
  <svg>{/* Floor plan */}</svg>
</div>
```

**Transform Order:**
1. **Translate** → Move the view (pan)
2. **Scale** → Zoom in/out
3. **Origin** → Scale from center

### Auto-Fit Algorithm
```typescript
const handleFitToScreen = () => {
  // 1. Get container dimensions
  const containerWidth = container.clientWidth
  const containerHeight = container.clientHeight

  // 2. Calculate floor plan bounds
  const minX = Math.min(...allX)
  const maxX = Math.max(...allX)
  const minY = Math.min(...allY)
  const maxY = Math.max(...allY)

  // 3. Calculate scaled dimensions (15px per meter)
  const scaledWidth = (maxX - minX) * 15
  const scaledHeight = (maxY - minY) * 15

  // 4. Calculate optimal zoom with padding
  const padding = 100
  const zoomX = (containerWidth - padding * 2) / scaledWidth
  const zoomY = (containerHeight - padding * 2) / scaledHeight
  const optimalZoom = Math.min(zoomX, zoomY, 1.5) // Cap at 150%

  // 5. Apply zoom and reset pan
  setZoom(optimalZoom)
  setPan({ x: 0, y: 0 })
}
```

### Mouse Event Handlers

#### Pan (Drag)
```typescript
const handleMouseDown = (e: React.MouseEvent) => {
  setIsPanning(true)
  setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
}

const handleMouseMove = (e: React.MouseEvent) => {
  if (!isPanning) return
  setPan({
    x: e.clientX - dragStart.x,
    y: e.clientY - dragStart.y,
  })
}

const handleMouseUp = () => {
  setIsPanning(false)
}
```

#### Wheel Zoom
```typescript
const handleWheel = (e: React.WheelEvent) => {
  e.preventDefault() // Prevent page scroll
  const delta = e.deltaY > 0 ? 0.9 : 1.1 // Zoom in/out
  setZoom(prev => Math.max(0.1, Math.min(prev * delta, 5)))
}
```

## Usage Examples

### Basic Usage
```tsx
<FloorPlanSVGExporter
  planData={floorPlanData}
  width={1200}
  height={900}
  interactive={true}  // Enable zoom/pan
/>
```

### Static Export (No Interaction)
```tsx
<FloorPlanSVGExporter
  planData={floorPlanData}
  width={1200}
  height={900}
  interactive={false}  // Disable zoom/pan for PDF/print
/>
```

## Behavior Details

### Zoom Limits
- **Minimum:** 10% (0.1x) - Prevents zooming out too far
- **Maximum:** 500% (5x) - Prevents performance issues
- **Auto-fit cap:** 150% (1.5x) - Prevents over-magnification on small plans

### Transition Smoothness
- **Zoom buttons:** 0.2s ease-out transition
- **Fit to screen:** 0.2s ease-out transition
- **Mouse wheel:** Immediate (no transition)
- **Panning:** No transition while dragging, smooth release

### Edge Cases Handled
- ✅ Empty floor plan → Shows "No floor plan data" message
- ✅ Mouse leaves viewport while dragging → Auto-stops panning
- ✅ Rapid zoom clicks → Smooth accumulation
- ✅ Wheel zoom + pan → Works simultaneously
- ✅ Small floor plans → Auto-fit prevents over-zoom (max 150%)
- ✅ Large floor plans → Scales down to fit viewport

## Keyboard Shortcuts (Future)

**Planned shortcuts:**
- `+` or `=` → Zoom in
- `-` → Zoom out
- `0` → Fit to screen (100%)
- `Space + Drag` → Pan (alternative to click-drag)
- `Ctrl/Cmd + 0` → Reset to 100% zoom

## Responsive Behavior

### Desktop (>1024px)
- Full zoom controls visible
- Mouse wheel zoom enabled
- Click-drag pan enabled
- Zoom buttons on top-right

### Tablet (768px - 1024px)
- Zoom controls visible
- Touch gestures for pan (future)
- Pinch-to-zoom (future)

### Mobile (<768px)
- Zoom controls visible
- Touch-optimized buttons (44px minimum)
- Swipe to pan (future)
- Pinch-to-zoom (future)

## Performance Optimizations

### 1. **Smooth Transitions**
```typescript
transition: isPanning ? 'none' : 'transform 0.2s ease-out'
```
- Disables transition during drag for instant feedback
- Enables smooth transition when clicking buttons

### 2. **Transform Origin Center**
```typescript
transformOrigin: 'center center'
```
- Zoom from center instead of top-left corner
- Maintains visual stability

### 3. **Auto-Fit on Mount**
```typescript
useEffect(() => {
  if (!interactive) return
  handleFitToScreen()
}, [planData, interactive])
```
- Automatically fits floor plan when switching to SVG view
- Re-fits when floor plan data changes

### 4. **Prevent Page Scroll**
```typescript
const handleWheel = (e: React.WheelEvent) => {
  e.preventDefault() // Critical!
  // ... zoom logic
}
```

## Comparison with Canvas View

| Feature | Canvas (Konva.js) | SVG (New) |
|---------|------------------|-----------|
| **Zoom In/Out** | Built-in (Stage scale) | Custom controls |
| **Pan** | Built-in (Stage drag) | Custom drag |
| **Fit to Screen** | Manual calculation | Auto on mount |
| **Wheel Zoom** | Yes | Yes |
| **Touch Gestures** | Partial | Planned |
| **Performance** | High (WebGL) | Good (CSS transform) |

## Examples

### Example 1: Small Floor Plan (60m²)
- Auto-fit zoom: ~120% (scaled up for visibility)
- Centered with 100px padding
- All rooms clearly visible

### Example 2: Large Floor Plan (200m²)
- Auto-fit zoom: ~70% (scaled down to fit)
- Centered with 100px padding
- User can zoom in to see details

### Example 3: Very Wide Floor Plan (aspect ratio 3:1)
- Auto-fit zoom: Based on width constraint
- Centered vertically with extra space
- Horizontal fit prioritized

## Best Practices

### For Users
1. ✅ Use **Fit to Screen** after manual zooming to reset view
2. ✅ Use **Mouse Wheel** for quick, incremental zooming
3. ✅ Use **Zoom Buttons** for precise control
4. ✅ **Drag anywhere** on the floor plan to pan
5. ✅ Check **zoom percentage** to know current scale

### For Developers
1. ✅ Always set `interactive={true}` for editor views
2. ✅ Set `interactive={false}` for static exports/prints
3. ✅ Use `ref={containerRef}` for dynamic sizing
4. ✅ Call `handleFitToScreen()` after floor plan updates
5. ✅ Test with various screen sizes and floor plan dimensions

## Troubleshooting

### Issue: Floor plan too small on load
**Solution:** Automatic fit-to-screen should handle this. If not, click "Fit to Screen" button.

### Issue: Can't zoom beyond certain level
**Solution:** Maximum zoom is capped at 500% (5x) for performance. This is intentional.

### Issue: Panning feels laggy
**Solution:** Ensure `transition: 'none'` during dragging. Check browser performance.

### Issue: Mouse wheel scrolls page instead of zooming
**Solution:** `e.preventDefault()` should handle this. Check if event handler is attached.

## Future Enhancements

- [ ] **Touch Gestures** - Pinch-to-zoom, two-finger pan
- [ ] **Keyboard Shortcuts** - +/- for zoom, arrow keys for pan
- [ ] **Mini-map** - Small overview map showing current viewport
- [ ] **Zoom to Selection** - Click room to zoom to that area
- [ ] **Animation** - Smooth animated zoom transitions
- [ ] **Zoom History** - Back/forward through zoom levels
- [ ] **Preset Zoom Levels** - 50%, 100%, 200% quick buttons

## Conclusion

The SVG zoom and pan feature provides a **professional, intuitive viewing experience** with:

✅ **Auto-fit to screen** on load  
✅ **Three zoom methods**: buttons, wheel, fit-to-screen  
✅ **Smooth panning** with click-drag  
✅ **Visual feedback** with cursor changes and zoom percentage  
✅ **Performance optimized** with CSS transforms  
✅ **Edge cases handled** for robust behavior  

This makes PlotSync's SVG viewer feel like professional CAD software! 🎯
