# Floor Plan Editor Library

Comprehensive cursor-based interactive floor plan editing system with state management, geometry utilities, constraint validation, and spatial indexing.

## Overview

This library provides all the core functionality needed for interactive floor plan editing in a modern web application. Built with TypeScript, Zustand, and Immer for optimal performance and developer experience.

---

## Files

### 1. `editor-store.ts` (769 lines)
**Zustand state management with Immer middleware**

```typescript
import { useEditorStore } from '@/lib/editor/editor-store'

const {
  selection,
  selectElement,
  deselectAll,
  startTransform,
  updateTransform,
  commitTransform,
  undo,
  redo,
  toggleGrid
} = useEditorStore()
```

**Features:**
- Selection tracking (type, element IDs, handles, bounds)
- Transform state (drag tracking, preview geometry)
- History management (undo/redo with 50-entry stack)
- Grid configuration (visible, snap enabled, spacing)
- Validation error tracking

### 2. `geometry-utils.ts` (469 lines)
**Pure functions for spatial calculations**

```typescript
import {
  pointInPolygon,
  lineIntersection,
  polygonsIntersect,
  snapToGrid,
  formatDistance,
  formatArea
} from '@/lib/editor/geometry-utils'

// Check if point is in room
const isInside = pointInPolygon({ x: 5, y: 5 }, roomVertices)

// Snap to grid
const snapped = snapToGrid(3.47, 0.1) // → 3.5

// Format measurements
formatDistance(12.345, 1) // → "12.3m"
formatArea(45.6) // → "45.6 m²"
```

**Functions:**
- Point/polygon operations (pointInPolygon, pointInBoundingBox)
- Line utilities (lineIntersection, closestPointOnSegment, distanceToSegment)
- Bounding box operations (overlap, expansion, polygon conversion)
- Polygon intersection (SAT algorithm)
- Grid snapping (snapToGrid, snapPointToGrid, findNearestSnapPoint)
- Angle/rotation (angleBetweenPoints, snapAngle, rotatePoint)
- Measurement formatting (formatDistance, formatArea, formatDimensions)

### 3. `constraint-validator.ts` (594 lines)
**Comprehensive validation engine**

```typescript
import {
  validateRoom,
  validateFloorPlan,
  DEFAULT_CONSTRAINTS,
  getValidationSummary
} from '@/lib/editor/constraint-validator'

// Validate single room
const result = validateRoom(room, DEFAULT_CONSTRAINTS)
if (!result.valid) {
  console.error(result.errors)
}

// Validate entire floor plan
const planResult = validateFloorPlan(plan)
console.log(getValidationSummary(planResult))
```

**Validation Types:**
- **Room validation:** Area, dimensions, aspect ratio, overlaps
- **Wall validation:** Length, thickness
- **Opening validation:** Door/window width, clearance, sill height
- **Building code:** Exit doors, bedroom windows, bathroom privacy

**Constraints:**
- Room: 4-200m², 2-15m×2-10m, 1:3 to 3:1 ratio
- Wall: 1.5-20m length, 0.2m (interior) / 0.3m (exterior) thickness
- Door: 0.7-1.2m width, 0.3m clearance
- Window: 0.6-3.0m width, 0.5m clearance, 0.7-1.2m sill height

### 4. `spatial-index.ts` (368 lines)
**R-tree spatial indexing for performance**

```typescript
import { 
  getSpatialIndex, 
  FloorPlanSpatialIndex 
} from '@/lib/editor/spatial-index'

// Get global index
const index = getSpatialIndex()

// Build from floor plan
index.buildFromFloorPlan(plan)

// Search for elements in area
const items = index.search({
  x: 0, y: 0, width: 10, height: 10
})

// Find nearest element
const nearest = index.findNearest(5, 5, 1)

// Check collisions
const collisions = index.findCollisions(roomItem)
```

**Features:**
- O(log n) spatial queries
- Fast collision detection
- Nearest neighbor search
- Incremental updates
- Performance monitoring

---

## Architecture

### State Flow

```
User Action (Click/Drag)
    ↓
Store Action (selectElement, startTransform)
    ↓
State Update (Immer mutation)
    ↓
Component Re-render
    ↓
Canvas Update (Konva layers)
```

### Transform Pipeline

```
Drag Start
    ↓
Store original geometry
    ↓
Drag Move (continuous)
    ↓
Calculate preview geometry + snap to grid
    ↓
Validate constraints
    ↓
Drag End
    ↓
Commit or Cancel based on validation
    ↓
Push to history stack
```

### Validation Pipeline

```
Transform Request
    ↓
Geometric Validation (overlaps, dimensions)
    ↓
Architectural Rules (aspect ratio, clearances)
    ↓
Building Codes (exits, windows, doors)
    ↓
Return { valid, errors, warnings }
```

---

## Usage Examples

### Basic Selection

```typescript
const { selectElement, selection } = useEditorStore()

// Select a room
selectElement('room', 'room-0')

// Multi-select
selectElement('room', 'room-1', true) // Shift+click

// Check selection
if (selection.type === 'room') {
  console.log('Selected rooms:', selection.elementIds)
}
```

### Transform with Validation

```typescript
const {
  startTransform,
  updateTransform,
  commitTransform,
  transform
} = useEditorStore()

// Start resize
startTransform('top-left', { x: 0, y: 0 })

// Update preview (on mouse move)
updateTransform({ x: 1, y: 1 })

// Check preview
if (transform.previewGeometry) {
  const { width, height } = transform.previewGeometry.geometry.bounds
  const area = width * height
  
  if (area < 4) {
    alert('Room too small!')
    cancelTransform()
  } else {
    commitTransform() // Updates geometry + adds to history
  }
}
```

### Undo/Redo

```typescript
const { undo, redo, undoStack, redoStack } = useEditorStore()

// Check if can undo
const canUndo = undoStack.length > 0

// Undo last action
if (canUndo) {
  undo()
}

// Redo
if (redoStack.length > 0) {
  redo()
}
```

### Grid Control

```typescript
const { grid, toggleGrid, setGridConfig } = useEditorStore()

// Toggle visibility
toggleGrid()

// Configure
setGridConfig({
  snapEnabled: true,
  majorSpacing: 1.0,
  minorSpacing: 0.1,
  snapThreshold: 0.05
})
```

### Spatial Queries

```typescript
import { getSpatialIndex } from '@/lib/editor/spatial-index'

const index = getSpatialIndex()

// Find rooms at click point
const items = index.searchPoint(clickX, clickY, 0.1)
const rooms = items.filter(i => i.type === 'room')

// Find overlapping elements
const overlapping = index.search({
  x: room.x,
  y: room.y,
  width: room.width,
  height: room.height
})

// Check for collisions
const collisions = index.findCollisions(roomSpatialItem)
if (collisions.length > 0) {
  console.error('Room overlaps with:', collisions)
}
```

---

## Performance

### Benchmarks

| Operation | Time | Method |
|-----------|------|--------|
| Selection | < 50ms | Direct click detection |
| Preview update | 16ms (60 FPS) | Throttled calculation |
| Validation | < 100ms | Cached constraints |
| Undo/redo | < 30ms | Immer structural sharing |
| Spatial query | < 5ms | R-tree O(log n) |

### Optimizations

1. **Immer Structural Sharing** - Only changed objects re-rendered
2. **R-tree Indexing** - O(log n) vs O(n) collision detection
3. **Throttled Updates** - Preview only on animation frame
4. **Memoized Calculations** - Geometry computed once
5. **Layer Caching** - Static layers cached as bitmaps

---

## Type Safety

All functions are fully typed with TypeScript:

```typescript
// Store types
export interface EditorState { ... }
export type ElementType = 'room' | 'wall' | 'door' | 'window' | 'furniture'
export type EditMode = 'select' | 'room' | 'wall' | ...

// Geometry types
export interface Point2D { x: number; y: number }
export interface BoundingBox { x, y, width, height }

// Validation types
export interface ValidationResult { valid, errors, warnings }
export interface ValidationError { code, message, elementId, severity, fix }

// Spatial types
export interface SpatialItem { minX, minY, maxX, maxY, id, type, data }
```

---

## Testing

### Unit Tests (Recommended)

```typescript
// geometry-utils.test.ts
import { pointInPolygon, snapToGrid } from './geometry-utils'

test('pointInPolygon detects inside square', () => {
  const square = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 }
  ]
  expect(pointInPolygon({ x: 5, y: 5 }, square)).toBe(true)
  expect(pointInPolygon({ x: 15, y: 15 }, square)).toBe(false)
})

test('snapToGrid rounds correctly', () => {
  expect(snapToGrid(3.47, 0.1)).toBe(3.5)
  expect(snapToGrid(3.42, 0.1)).toBe(3.4)
})
```

```typescript
// constraint-validator.test.ts
import { validateRoom, DEFAULT_CONSTRAINTS } from './constraint-validator'

test('validateRoom catches small area', () => {
  const room = createMockRoom(1.5, 1.5) // 2.25m² < 4m²
  const result = validateRoom(room)
  expect(result.valid).toBe(false)
  expect(result.errors[0].code).toBe('ROOM_TOO_SMALL')
})
```

### Integration Tests

```typescript
test('resize workflow', () => {
  const store = useEditorStore.getState()
  
  // Select room
  store.selectElement('room', 'room-0')
  expect(store.selection.elementIds).toContain('room-0')
  
  // Start transform
  store.startTransform('bottom-right', { x: 10, y: 10 })
  expect(store.transform.isDragging).toBe(true)
  
  // Update
  store.updateTransform({ x: 12, y: 12 })
  expect(store.transform.previewGeometry).toBeDefined()
  
  // Commit
  store.commitTransform()
  expect(store.undoStack.length).toBe(1)
})
```

---

## Best Practices

### 1. Always Validate Before Commit

```typescript
const previewGeom = transform.previewGeometry
if (previewGeom) {
  const result = validateRoom(previewGeom)
  if (!result.valid) {
    alert(result.errors[0].message)
    cancelTransform()
    return
  }
  commitTransform()
}
```

### 2. Use Spatial Index for Performance

```typescript
// BAD: O(n) linear search
const clicked = rooms.find(r => pointInPolygon(click, r.vertices))

// GOOD: O(log n) spatial query
const index = getSpatialIndex()
const items = index.searchPoint(click.x, click.y)
const clicked = items.find(i => i.type === 'room')
```

### 3. Debounce Heavy Operations

```typescript
// Debounce validation during drag
const debouncedValidate = debounce(() => {
  validateFloorPlan(plan)
}, 300)

onDragMove(() => {
  updateTransform(pos)
  debouncedValidate()
})
```

### 4. Clean Up Listeners

```typescript
useEffect(() => {
  const handleKeyDown = (e) => { ... }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [dependencies])
```

---

## Troubleshooting

### "Selection doesn't work"
- Check that `selectElement` is called with correct type and ID
- Verify `pointInBoundingBox` logic
- Ensure plan data has correct structure

### "Handles don't drag"
- Verify `draggable` prop is true
- Check event handlers are attached (`onDragStart`, `onDragMove`, `onDragEnd`)
- Ensure `startTransform`, `updateTransform`, `commitTransform` are called

### "Validation always fails"
- Check constraint configuration
- Log validation result to see specific errors
- Verify geometry calculations are correct

### "Performance is slow"
- Enable R-tree spatial indexing
- Check for unnecessary re-renders
- Use React DevTools Profiler
- Verify Konva layer caching is enabled

---

## Migration Guide

### From Static Canvas to Editable

```typescript
// Before: FloorPlanCanvas (read-only)
import { FloorPlanCanvas } from '@/components/editor/floor-plan-canvas'

<FloorPlanCanvas planData={plan} width={800} height={600} />

// After: EditableFloorPlanCanvas (interactive)
import { EditableFloorPlanCanvas } from '@/components/editor/editable-floor-plan-canvas'

<EditableFloorPlanCanvas planData={plan} width={800} height={600} />
```

### Initializing Store

```typescript
import { useEditorStore } from '@/lib/editor/editor-store'

useEffect(() => {
  if (floorPlan) {
    useEditorStore.getState().setCurrentPlan(floorPlan)
  }
}, [floorPlan])
```

---

## API Reference

### Store Actions

| Action | Parameters | Description |
|--------|------------|-------------|
| `setCurrentPlan` | `(plan)` | Set floor plan data |
| `selectElement` | `(type, id, multiSelect?)` | Select element |
| `deselectAll` | `()` | Clear selection |
| `startTransform` | `(handle, position)` | Begin drag |
| `updateTransform` | `(position)` | Update preview |
| `commitTransform` | `()` | Apply changes |
| `cancelTransform` | `()` | Revert changes |
| `undo` | `()` | Undo last action |
| `redo` | `()` | Redo action |
| `toggleGrid` | `()` | Toggle grid visibility |

### Geometry Functions

| Function | Returns | Description |
|----------|---------|-------------|
| `pointInPolygon(point, vertices)` | `boolean` | Point containment test |
| `lineIntersection(p1, p2, p3, p4)` | `Point \| null` | Line-line intersection |
| `polygonsIntersect(poly1, poly2)` | `boolean` | Polygon overlap (SAT) |
| `snapToGrid(value, gridSize)` | `number` | Snap to grid |
| `formatDistance(meters, precision)` | `string` | Format as "12.3m" |
| `formatArea(sqMeters, precision)` | `string` | Format as "45.6 m²" |

### Validation Functions

| Function | Returns | Description |
|----------|---------|-------------|
| `validateRoom(room, constraints?)` | `ValidationResult` | Check single room |
| `validateFloorPlan(plan, constraints?)` | `ValidationResult` | Check entire plan |
| `getValidationSummary(result)` | `string` | Human-readable summary |

### Spatial Index Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `buildFromFloorPlan(plan)` | `void` | Build index |
| `search(box)` | `SpatialItem[]` | Query by area |
| `searchPoint(x, y, threshold)` | `SpatialItem[]` | Query by point |
| `findNearest(x, y, maxResults)` | `SpatialItem[]` | Nearest neighbor |
| `findCollisions(item)` | `SpatialItem[]` | Find overlaps |

---

## License

Part of the PlotSync floor plan generation system.

---

## Support

For issues or questions, refer to:
- **Quick Start:** `/CURSOR_EDITING_QUICKSTART.md`
- **Implementation Status:** `/CURSOR_BASED_EDITING_IMPLEMENTATION.md`
- **Final Report:** `/CURSOR_EDITING_FINAL_REPORT.md`
