# Cursor-Based Editable Floor Plan Generation

## Overview

This design proposes an enhanced approach for generating floor plans that enables intuitive cursor-based editing, allowing users to directly manipulate floor plan elements through drag-and-drop interactions, visual handles, and real-time feedback. The system bridges the gap between AI-generated static plans and fully interactive architectural editing tools.

### Design Goals

- **Intuitive Interaction**: Enable direct manipulation of floor plan elements using mouse/touch gestures
- **Real-Time Feedback**: Provide immediate visual feedback during editing operations
- **Constraint Preservation**: Maintain architectural validity while allowing flexible editing
- **Seamless Workflow**: Integrate cursor-based editing with existing AI generation pipeline
- **Professional Quality**: Ensure edited floor plans maintain Maket.ai-level visual fidelity

### Target Repository Type

Full-Stack Application (Next.js frontend + API routes backend)

---

## Architecture

### Component Hierarchy

```mermaid
graph TD
    A[Editor Page] --> B[Interactive Canvas Layer]
    A --> C[Edit Mode Controller]
    A --> D[Constraint Validator]
    
    B --> E[Selection Manager]
    B --> F[Transform Handles]
    B --> G[Snap Grid System]
    B --> H[Visual Feedback Layer]
    
    C --> I[Room Edit Mode]
    C --> J[Wall Edit Mode]
    C --> K[Door/Window Edit Mode]
    C --> L[Furniture Edit Mode]
    
    D --> M[Geometric Validator]
    D --> N[Architectural Rules Engine]
    D --> O[Collision Detector]
```

### Data Flow Architecture

```mermaid
sequenceDiagram
    participant User
    participant Canvas
    participant SelectionMgr
    participant TransformMgr
    participant Validator
    participant StateStore
    
    User->>Canvas: Click element
    Canvas->>SelectionMgr: Identify target
    SelectionMgr->>StateStore: Set active element
    StateStore->>Canvas: Render selection handles
    
    User->>Canvas: Drag handle
    Canvas->>TransformMgr: Calculate new geometry
    TransformMgr->>Validator: Validate constraints
    
    alt Valid transformation
        Validator->>StateStore: Update geometry
        StateStore->>Canvas: Re-render with new position
    else Invalid transformation
        Validator->>Canvas: Show error indicator
        Canvas->>User: Visual feedback (red outline)
    end
```

---

## Interactive Editing System

### 1. Selection and Interaction Model

#### Element Selection Strategy

| Interaction | Behavior | Visual Feedback |
|-------------|----------|-----------------|
| Click on room | Select room, show resize handles | Blue outline, 8 corner/edge handles |
| Click on wall | Select wall, show endpoints | Highlighted wall, 2 endpoint circles |
| Click on door/window | Select opening, show rotation handle | Orange outline, rotation arc |
| Click on furniture | Select item, show move/rotate handles | Green outline, position + rotation handles |
| Click empty space | Deselect all | Clear all highlights |
| Shift + Click | Multi-select elements | All selected show outlines |

#### Cursor States

| Mode | Default Cursor | Hover Cursor | Drag Cursor |
|------|---------------|--------------|-------------|
| Selection | `default` | `pointer` | `pointer` |
| Room Resize | `default` | `nwse-resize` / `nesw-resize` / `ew-resize` / `ns-resize` | Same as hover |
| Wall Drag | `default` | `move` | `grabbing` |
| Door Rotate | `default` | `crosshair` | `crosshair` |
| Furniture Move | `default` | `grab` | `grabbing` |

### 2. Transform Handle System

#### Room Transform Handles

```mermaid
graph LR
    A[Room Rectangle] --> B[8 Handles]
    B --> C[4 Corner Handles - Resize diagonal]
    B --> D[4 Edge Handles - Resize single dimension]
    A --> E[Center Handle - Move entire room]
```

**Handle Specifications:**

| Handle Position | Action | Constraint |
|----------------|--------|------------|
| Top-left corner | Resize width + height maintaining opposite corner | Min room area: 4m² |
| Top-right corner | Resize width + height maintaining opposite corner | Aspect ratio: 1:3 to 3:1 |
| Bottom-left corner | Resize width + height maintaining opposite corner | Snap to grid: 0.1m |
| Bottom-right corner | Resize width + height maintaining opposite corner | No overlap with other rooms |
| Top edge center | Resize height only | Min height: 2m |
| Bottom edge center | Resize height only | Max height: 10m |
| Left edge center | Resize width only | Min width: 2m |
| Right edge center | Resize width only | Max width: 15m |

#### Wall Transform Handles

```mermaid
graph LR
    A[Wall Line] --> B[2 Endpoint Handles]
    A --> C[Midpoint Handle - Move entire wall]
    B --> D[Endpoint 1 - Adjust position]
    B --> E[Endpoint 2 - Adjust position]
```

**Wall Editing Constraints:**

- Endpoints must snap to room corners or other wall endpoints
- Minimum wall length: 1.5m
- Maximum wall length: 20m
- Wall thickness: Fixed at 0.2m (interior) or 0.3m (exterior)
- Must maintain connectivity: Endpoints must connect to valid junctions

#### Door/Window Rotation Handle

```mermaid
graph TD
    A[Door/Window] --> B[Rotation Handle - 30px from center]
    A --> C[Position Handle - Move along wall]
    B --> D[Snap to 90° increments]
    C --> E[Constrained to parent wall]
```

**Opening Editing Rules:**

- Rotation: Snap to 0°, 90°, 180°, 270°
- Position: Slide along parent wall only
- Clearance: Minimum 0.3m from wall endpoints
- Door swing: Must not overlap with adjacent walls
- Window height: Fixed sill height at 0.9m

### 3. Snap and Grid System

#### Grid Configuration

| Grid Type | Spacing | Visibility | Usage |
|-----------|---------|------------|-------|
| Major Grid | 1.0m | Faint gray lines (#E0E0E0) | Structural alignment |
| Minor Grid | 0.1m | Subtle dots (#F5F5F5) | Precise positioning |
| Magnetic Snap | 0.05m threshold | Invisible | Auto-align to grid |

#### Snap Targets

```mermaid
graph TD
    A[Snap System] --> B[Grid Snap - 0.1m intervals]
    A --> C[Edge Snap - Align to room edges]
    A --> D[Center Snap - Align to room centers]
    A --> E[Wall Snap - Align to wall endpoints]
    A --> F[Equal Spacing Snap - Distribute evenly]
```

**Snap Priority (highest to lowest):**

1. Wall endpoint junctions (critical for structural integrity)
2. Room corner alignment
3. Grid major lines (1m intervals)
4. Room center alignment
5. Grid minor lines (0.1m intervals)

### 4. Visual Feedback Layer

#### Real-Time Feedback Elements

| Edit Action | Visual Indicator | Color Code | Animation |
|-------------|-----------------|------------|-----------|
| Valid move | Dashed blue outline | `#3B82F6` | Smooth follow |
| Invalid move | Dashed red outline + X icon | `#EF4444` | Shake on constraint violation |
| Snap active | Yellow highlight line | `#FBBF24` | Pulse 0.3s |
| Dimension display | Floating label with measurement | `#1F2937` on `#FFFFFF` | Fade in/out |
| Collision warning | Overlapping area shaded | `#EF4444` at 30% opacity | Flash 0.5s |

#### Dimension Labels

```mermaid
graph LR
    A[Active Element] --> B[Auto-show dimensions]
    B --> C[Width label - top edge]
    B --> D[Height label - right edge]
    B --> E[Area label - center]
    B --> F[Distance to nearest element - dotted line]
```

**Label Format:**

- Width/Height: `"12.5m"` (1 decimal precision)
- Area: `"45.3 m²"` (1 decimal precision)
- Distance: `"2.1m"` with dotted line to reference point

---

## Edit Modes and Workflows

### Mode 1: Room Editing

#### User Interaction Flow

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> RoomSelected: Click room
    RoomSelected --> ResizingRoom: Drag corner/edge handle
    ResizingRoom --> Validating: Mouse move
    Validating --> ResizingRoom: Valid geometry
    Validating --> ShowError: Constraint violation
    ShowError --> ResizingRoom: Adjust position
    ResizingRoom --> RoomSelected: Mouse release
    RoomSelected --> MovingRoom: Drag room center
    MovingRoom --> Validating
    Validating --> MovingRoom: Valid position
    MovingRoom --> RoomSelected: Mouse release
    RoomSelected --> Idle: Click outside
```

#### Room Edit Capabilities

| Capability | Input Method | Result |
|------------|--------------|--------|
| Resize room | Drag corner handle diagonally | Adjust width and height simultaneously |
| Change width | Drag left/right edge handle horizontally | Modify width while maintaining height |
| Change height | Drag top/bottom edge handle vertically | Modify height while maintaining width |
| Move room | Drag anywhere inside room (not on handle) | Translate entire room to new position |
| Rotate room | Shift + drag corner handle | Rotate in 90° increments (optional) |
| Rename room | Double-click room label | Open inline text editor |
| Change room type | Right-click → context menu | Convert to different room type (updates furniture) |

### Mode 2: Wall Editing

#### Wall Manipulation Model

```mermaid
stateDiagram-v2
    [*] --> NoSelection
    NoSelection --> WallSelected: Click wall
    WallSelected --> DraggingEndpoint: Drag endpoint handle
    DraggingEndpoint --> SnappingToJunction: Move near junction
    SnappingToJunction --> WallConnected: Release on valid junction
    WallConnected --> WallSelected: Update complete
    WallSelected --> MovingWall: Drag wall midpoint
    MovingWall --> WallSelected: Release
    WallSelected --> NoSelection: Click outside
```

#### Wall Edit Operations

| Operation | Constraint | Validation Rule |
|-----------|------------|-----------------|
| Move wall endpoint | Must connect to room corner or wall junction | Auto-snap within 0.2m |
| Create wall branch | Drag from existing wall midpoint | Creates T-junction |
| Delete wall | Select wall + Delete key | Only if not load-bearing (interior wall) |
| Split wall | Ctrl + Click on wall | Inserts new junction point |
| Adjust wall thickness | Right-click → properties | Interior: 0.15-0.25m, Exterior: 0.25-0.40m |

### Mode 3: Door and Window Editing

#### Opening Interaction Model

```mermaid
stateDiagram-v2
    [*] --> Unselected
    Unselected --> DoorSelected: Click door/window
    DoorSelected --> SlidingAlongWall: Drag position handle
    SlidingAlongWall --> CheckClearance: Mouse move
    CheckClearance --> SlidingAlongWall: ≥ 0.3m from endpoints
    CheckClearance --> ShowWarning: < 0.3m from endpoints
    ShowWarning --> SlidingAlongWall: Adjust position
    SlidingAlongWall --> DoorSelected: Mouse release
    DoorSelected --> RotatingOpening: Drag rotation handle
    RotatingOpening --> SnapToAngle: Mouse move
    SnapToAngle --> DoorSelected: Release (snaps to 90° increment)
    DoorSelected --> Unselected: Click outside
```

#### Opening Edit Rules

| Element | Editable Properties | Constraints |
|---------|-------------------|-------------|
| Door | Position along wall, rotation (swing direction), width | Width: 0.7-1.2m, clearance: 0.3m from corners, swing must not hit adjacent walls |
| Window | Position along wall, width, sill height | Width: 0.6-3.0m, sill height: 0.7-1.2m, clearance: 0.5m from corners |
| Entry Door | Position, rotation | Must be on exterior wall, width: 0.9-1.2m, accessible from outside |

### Mode 4: Furniture Editing

#### Furniture Manipulation

```mermaid
stateDiagram-v2
    [*] --> NotSelected
    NotSelected --> FurnitureSelected: Click furniture
    FurnitureSelected --> DraggingFurniture: Drag item
    DraggingFurniture --> CheckBounds: Mouse move
    CheckBounds --> DraggingFurniture: Inside parent room
    CheckBounds --> ShowBoundary: Crossing room boundary
    ShowBoundary --> DraggingFurniture: Pull back
    DraggingFurniture --> FurnitureSelected: Mouse release
    FurnitureSelected --> RotatingFurniture: Drag rotation handle (R key held)
    RotatingFurniture --> FurnitureSelected: Release (free rotation)
    FurnitureSelected --> NotSelected: Click outside
```

#### Furniture Edit Features

| Feature | Interaction | Constraint |
|---------|-------------|------------|
| Move furniture | Drag item | Must remain within parent room boundaries |
| Rotate furniture | R key + drag | Free rotation (0-360°) or snap to 45° increments (Shift held) |
| Resize furniture | Drag corner handle (proportional) | Min: 50% of default, Max: 150% of default |
| Change furniture type | Right-click → replace with... | Updates to new type with similar footprint |
| Delete furniture | Select + Delete key | Removes from room |
| Duplicate furniture | Ctrl + drag | Creates copy with same properties |

---

## State Management

### Editable Floor Plan State Schema

```mermaid
classDiagram
    class EditorState {
        +FloorPlanData currentPlan
        +EditMode activeMode
        +Selection selection
        +TransformState transform
        +HistoryStack undoStack
        +HistoryStack redoStack
        +ValidationErrors errors
    }
    
    class FloorPlanData {
        +Room[] rooms
        +Wall[] walls
        +Opening[] openings
        +FurnitureItem[] furniture
        +Metadata metadata
    }
    
    class Selection {
        +ElementType type
        +string[] elementIds
        +TransformHandles handles
        +BoundingBox bounds
    }
    
    class TransformState {
        +boolean isDragging
        +Point2D dragStart
        +Point2D currentPosition
        +ElementGeometry originalGeometry
        +ElementGeometry previewGeometry
    }
    
    class HistoryStack {
        +HistoryEntry[] entries
        +int currentIndex
        +int maxSize
        +push(entry)
        +undo()
        +redo()
    }
    
    EditorState --> FloorPlanData
    EditorState --> Selection
    EditorState --> TransformState
    EditorState --> HistoryStack
```

### State Update Pattern

| User Action | State Updates | Side Effects |
|-------------|--------------|--------------|
| Start drag | `transform.isDragging = true`, store `originalGeometry` | Show transform handles |
| Drag move | Update `previewGeometry` | Validate + render preview |
| Drag end | Commit `previewGeometry` to `currentPlan`, push to `undoStack` | Clear preview, re-render |
| Undo (Ctrl+Z) | Pop from `undoStack`, restore previous state | Re-render canvas |
| Redo (Ctrl+Y) | Pop from `redoStack`, restore forward state | Re-render canvas |

### Undo/Redo System

```mermaid
graph TD
    A[User Edit Action] --> B[Create History Entry]
    B --> C{Action Type}
    C -->|Geometric Change| D[Store full geometry delta]
    C -->|Property Change| E[Store property key-value pairs]
    C -->|Element Add/Delete| F[Store element data + parent refs]
    
    D --> G[Push to Undo Stack]
    E --> G
    F --> G
    
    G --> H[Limit stack to 50 entries]
    H --> I[Clear Redo Stack]
```

**History Entry Schema:**

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | ISO string | When action occurred |
| `actionType` | enum | "move", "resize", "rotate", "add", "delete", "modify" |
| `elementType` | enum | "room", "wall", "door", "window", "furniture" |
| `elementId` | string | Unique identifier |
| `before` | JSON | Previous state |
| `after` | JSON | New state |
| `description` | string | Human-readable description (e.g., "Resized Living Room") |

---

## Constraint Validation System

### Validation Pipeline

```mermaid
graph LR
    A[Transform Request] --> B{Geometric Validator}
    B --> C{Check Overlaps}
    C -->|Pass| D{Check Dimensions}
    C -->|Fail| H[Reject + Show Error]
    
    D -->|Pass| E{Architectural Rules}
    D -->|Fail| H
    
    E -->|Pass| F{Building Codes}
    E -->|Fail| I[Warn + Allow with flag]
    
    F -->|Pass| G[Accept Transform]
    F -->|Fail| I
    
    I --> J{User Choice}
    J -->|Override| G
    J -->|Cancel| H
```

### Validation Rules Table

| Rule Category | Validation | Severity | Error Message |
|--------------|------------|----------|---------------|
| **Geometric** | No room overlaps | Error | "Room overlaps with {room_name}" |
| **Geometric** | No furniture outside room | Error | "Furniture must stay within room boundaries" |
| **Geometric** | Wall endpoints connect | Error | "Wall endpoint must connect to junction" |
| **Dimensional** | Room area ≥ 4m² | Error | "Room too small (min 4m²)" |
| **Dimensional** | Room aspect ratio 1:3 to 3:1 | Warning | "Room proportions may be impractical" |
| **Dimensional** | Door clearance ≥ 0.3m | Error | "Door too close to corner" |
| **Architectural** | Bathroom has door | Warning | "Bathroom should have a door for privacy" |
| **Architectural** | Kitchen near dining area | Warning | "Kitchen typically adjacent to dining room" |
| **Building Code** | Min corridor width 1.0m | Warning | "Corridor narrower than building code (1.0m)" |
| **Building Code** | Min 1 window per bedroom | Warning | "Bedroom requires natural light source" |

### Constraint Relaxation Strategy

When strict validation prevents edits:

```mermaid
graph TD
    A[Constraint Violation] --> B{Severity}
    B -->|Error| C[Block action + show error]
    B -->|Warning| D{User Preference}
    
    D -->|Strict Mode ON| C
    D -->|Strict Mode OFF| E[Allow with warning banner]
    
    E --> F[Mark plan as 'Non-Compliant']
    F --> G[Show relaxed constraints list]
    G --> H[Offer 'Auto-Fix' suggestions]
```

**Auto-Fix Suggestions:**

| Violation | Auto-Fix Action |
|-----------|-----------------|
| Room too small | Suggest minimum dimensions (show blue ghost outline) |
| Room overlap | Snap to non-overlapping position (nearest valid position) |
| Door swing collision | Rotate door to opposite direction |
| Missing window | Suggest window placement on exterior wall |
| Narrow corridor | Widen by reducing adjacent room sizes proportionally |

---

## Rendering and Performance

### Canvas Layer Architecture

```mermaid
graph TD
    A[Konva Stage] --> B[Background Layer - Grid]
    A --> C[Floor Plan Layer - Walls, Rooms]
    A --> D[Furniture Layer - Furniture Items]
    A --> E[Openings Layer - Doors, Windows]
    A --> F[Labels Layer - Text, Dimensions]
    A --> G[Interaction Layer - Handles, Highlights]
    A --> H[Feedback Layer - Errors, Warnings]
```

**Layer Rendering Order (bottom to top):**

1. Background: Grid lines and canvas background
2. Floor Plan: Walls (thick black lines), room fills (white)
3. Furniture: Geometric shapes representing furniture
4. Openings: Doors (arcs), windows (thick lines)
5. Labels: Room names, dimensions, areas
6. Interaction: Transform handles, selection outlines
7. Feedback: Error indicators, snap guides, dimension tooltips

### Performance Optimizations

| Optimization | Strategy | Impact |
|--------------|----------|--------|
| **Selective Rendering** | Only re-render changed layers | 60% faster updates |
| **Handle Virtualization** | Show handles only for selected elements | Reduced DOM nodes |
| **Throttled Validation** | Validate on drag end, not every mouse move | 80% less CPU usage |
| **Spatial Indexing** | Use R-tree for collision detection | O(log n) overlap checks |
| **Canvas Caching** | Cache static layers (walls, rooms) as bitmap | 50% faster zoom/pan |
| **Debounced Label Updates** | Update dimension labels 100ms after drag stops | Smoother dragging |

### Interaction Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Selection response time | < 50ms | Click to highlight |
| Drag frame rate | ≥ 60 FPS | Smooth visual feedback |
| Validation delay | < 100ms | Transform validation |
| Undo/redo action | < 30ms | State restoration |
| Auto-save trigger | Every 5s or 10 actions | Background save |

---

## Technology Stack

### Frontend Components

| Component | Library | Version | Purpose |
|-----------|---------|---------|---------|
| Canvas Rendering | react-konva | 18.x | 2D interactive canvas with event handling |
| Shape Primitives | konva | 9.x | Low-level canvas drawing API |
| State Management | zustand | 4.x | Lightweight global state for editor |
| Gesture Handling | use-gesture | 10.x | Advanced drag/pinch/rotate gestures |
| Spatial Indexing | rbush | 3.x | R-tree for fast collision detection |
| Undo/Redo | immer + zustand-middleware-immer | Latest | Immutable state history |

### Data Structures

#### R-Tree Spatial Index

```mermaid
graph TD
    A[R-Tree Index] --> B[Insert room bounds on edit]
    A --> C[Query overlapping elements on drag]
    A --> D[Remove element on delete]
    A --> E[Update element on transform]
    
    C --> F[Return candidate collisions]
    F --> G[Detailed polygon intersection test]
```

**Index Update Strategy:**

- Rebuild index on: Room add/delete, room resize
- Incremental update on: Room move, wall adjust
- Query on: Every drag move event (throttled to 60 FPS)

#### Geometry Utilities

| Utility Function | Input | Output | Usage |
|-----------------|-------|--------|-------|
| `pointInPolygon` | Point, Polygon vertices | boolean | Check if click is inside room |
| `lineIntersection` | Line1, Line2 | Point or null | Detect wall crossing |
| `boundingBox` | Element geometry | Rectangle | Calculate selection bounds |
| `closestPointOnLine` | Point, Line | Point | Snap to wall segment |
| `polygonIntersection` | Polygon1, Polygon2 | boolean | Check room overlap |
| `distanceToSegment` | Point, LineSegment | number | Snap distance calculation |

---

## Integration with Existing System

### Compatibility with Current Architecture

```mermaid
graph LR
    A[AI Generation Pipeline] --> B[Generate Floor Plan Data]
    B --> C[FloorPlanData JSON]
    C --> D[Editable Canvas Component]
    
    D --> E[User Edits via Cursor]
    E --> F[Updated FloorPlanData]
    
    F --> G[Save to Database]
    F --> H[Export as SVG/DXF]
    F --> I[3D Visualization Update]
    
    G --> J[Project Record]
    H --> K[Download/Export]
    I --> L[FloorPlan3DViewer]
```

### Migration Path from Current Implementation

| Current Feature | Enhanced with Cursor Editing | Migration Strategy |
|----------------|------------------------------|-------------------|
| Static canvas rendering | Add interactive layer with handles | Overlay interaction layer on existing canvas |
| Advanced Edit panel (form-based) | Keep as fallback + add direct manipulation | Dual input: form OR drag handles |
| Zoom/pan controls | Maintain existing implementation | No change (independent from editing) |
| 3D viewer | Auto-update on edit commit | Listen to state changes, re-render 3D |
| SVG export | Export edited geometry | Update exporter to use live state |

### State Synchronization

```mermaid
sequenceDiagram
    participant EditCanvas
    participant EditorStore
    participant AdvancedPanel
    participant 3DViewer
    participant Database
    
    EditCanvas->>EditorStore: User drags room handle
    EditorStore->>EditorStore: Validate + update state
    EditorStore->>EditCanvas: Trigger re-render
    EditorStore->>AdvancedPanel: Sync form values
    EditorStore->>3DViewer: Update 3D geometry
    
    Note over EditorStore,Database: Debounced auto-save
    EditorStore->>Database: Save after 5s idle
```

**Sync Events:**

- **Canvas → Store**: Mouse events, transform actions
- **Store → Canvas**: Geometry updates, validation errors
- **Store → Advanced Panel**: Selected element properties
- **Advanced Panel → Store**: Form input changes
- **Store → 3D Viewer**: Geometry changes (debounced 500ms)
- **Store → Database**: Auto-save (debounced 5s)

---

## User Experience Enhancements

### Keyboard Shortcuts

| Shortcut | Action | Mode |
|----------|--------|------|
| `Ctrl/Cmd + Z` | Undo last action | All modes |
| `Ctrl/Cmd + Y` | Redo action | All modes |
| `Delete` | Delete selected element | All modes |
| `Ctrl/Cmd + D` | Duplicate selected element | Room, Furniture |
| `Ctrl/Cmd + C` | Copy selected element | Room, Furniture |
| `Ctrl/Cmd + V` | Paste copied element | Room, Furniture |
| `Arrow Keys` | Nudge selected element 0.1m | Room, Wall, Furniture |
| `Shift + Arrow Keys` | Nudge selected element 1.0m | Room, Wall, Furniture |
| `R` (hold) | Enable rotation mode | Furniture |
| `G` | Toggle grid visibility | All modes |
| `Shift` (hold) | Disable snapping | All modes |
| `Esc` | Deselect all | All modes |

### Context Menus

#### Room Context Menu

| Menu Item | Action |
|-----------|--------|
| Rename Room | Open inline text editor |
| Change Room Type | Submenu: Bedroom, Bathroom, Kitchen, etc. |
| Duplicate Room | Create copy at offset position |
| Split Room | Add dividing wall |
| Merge with Adjacent Room | Remove shared wall |
| Properties | Open property panel (dimensions, area, materials) |
| Delete Room | Remove room + connected walls |

#### Wall Context Menu

| Menu Item | Action |
|-----------|--------|
| Split Wall | Add junction point at click position |
| Convert to Door Opening | Replace wall segment with door |
| Convert to Window Opening | Replace wall segment with window |
| Make Load-Bearing | Toggle structural status (prevents deletion) |
| Wall Properties | Thickness, material, color |
| Delete Wall | Remove wall (if not load-bearing) |

### Tooltip System

```mermaid
graph TD
    A[Hover Event] --> B{Hover Target}
    B -->|Room| C[Show: Name, Area, Dimensions]
    B -->|Wall| D[Show: Length, Thickness, Type]
    B -->|Door| E[Show: Width, Swing Direction]
    B -->|Window| F[Show: Width, Sill Height]
    B -->|Furniture| G[Show: Type, Dimensions]
    
    C --> H[Display after 500ms delay]
    D --> H
    E --> H
    F --> H
    G --> H
```

**Tooltip Content Examples:**

- **Room**: "Living Room | 45.2 m² | 7.5m × 6.0m"
- **Wall**: "Exterior Wall | 8.5m long | 0.30m thick"
- **Door**: "Entry Door | 1.0m wide | Swing: Inward"
- **Window**: "Window | 1.5m wide | Sill: 0.9m"
- **Furniture**: "Sofa | 2.1m × 0.9m"

---

## Testing Strategy

### Unit Tests

| Test Category | Test Cases | Validation |
|--------------|------------|------------|
| **Geometry Utilities** | Point in polygon, line intersection, bounding box | Correct mathematical calculations |
| **Constraint Validation** | Room overlap, dimension limits, wall connectivity | Rules enforced correctly |
| **Transform Logic** | Resize, move, rotate calculations | Correct coordinate transformations |
| **Snap System** | Grid snap, edge snap, junction snap | Snap to correct targets within threshold |
| **Undo/Redo** | Push, pop, clear history | State correctly restored |

### Integration Tests

| Test Scenario | Steps | Expected Result |
|--------------|-------|-----------------|
| **Edit and Save** | 1. Generate floor plan<br>2. Resize room<br>3. Save | Database updated with new geometry |
| **Undo/Redo Flow** | 1. Make 5 edits<br>2. Undo 3 times<br>3. Redo 2 times | State matches expected history position |
| **Validation Enforcement** | 1. Attempt invalid resize<br>2. System blocks action | Error shown, state unchanged |
| **Multi-Element Edit** | 1. Select multiple rooms<br>2. Move together | All elements move maintaining relative positions |
| **3D Sync** | 1. Edit room in 2D<br>2. Switch to 3D view | 3D view reflects 2D changes |

### Interaction Tests (Manual/Automated with Playwright)

| Interaction | Test Method | Pass Criteria |
|-------------|-------------|---------------|
| Click to select | Automated click event | Element highlighted, handles shown |
| Drag to resize | Automated drag simulation | Element resized, dimensions updated |
| Keyboard shortcuts | Automated key press | Correct action executed |
| Context menu | Automated right-click | Menu appears with correct options |
| Snap behavior | Automated drag near snap target | Element snaps to target |

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Deliverables:**

- Selection system with single-element selection
- Basic transform handles for rooms (8 resize handles)
- Grid rendering and snap-to-grid functionality
- State management setup with Zustand
- Undo/redo infrastructure

**Acceptance Criteria:**

- User can click a room to select it
- User can drag corner handles to resize room
- Room snaps to grid lines while dragging
- Undo/redo works for resize actions

### Phase 2: Core Editing (Week 3-4)

**Deliverables:**

- Wall endpoint dragging
- Door/window position and rotation editing
- Furniture drag-and-drop
- Real-time dimension labels
- Constraint validation (overlaps, dimensions)

**Acceptance Criteria:**

- User can reposition wall endpoints with snap
- User can slide doors along walls
- User can move furniture within room boundaries
- System prevents invalid transformations

### Phase 3: Advanced Features (Week 5-6)

**Deliverables:**

- Multi-select and group transformations
- Context menus for all element types
- Keyboard shortcuts
- R-tree spatial indexing for performance
- Visual feedback layer (error indicators, snap guides)

**Acceptance Criteria:**

- User can select and move multiple rooms together
- Right-click menus provide relevant actions
- Keyboard shortcuts work as documented
- Drag performance maintains 60 FPS

### Phase 4: Integration and Polish (Week 7-8)

**Deliverables:**

- Sync with Advanced Edit panel (form inputs)
- 3D viewer auto-update on edits
- Auto-save with debouncing
- Export edited plans to SVG/DXF
- Comprehensive testing suite

**Acceptance Criteria:**

- Form panel reflects selected element properties
- 3D view updates within 500ms of edit
- Changes auto-save after 5 seconds idle
- Exported files match edited geometry
- All tests pass

---

## Alternative Approaches Considered

### Approach A: Form-Based Editing Only (Current Implementation)

**Pros:**
- Precise numeric input
- No complex canvas interactions
- Simpler to implement

**Cons:**
- Not intuitive for spatial design
- Slow workflow (type coordinates)
- Disconnected from visual representation

**Decision:** Rejected - Poor UX for architectural design tasks

---

### Approach B: Full CAD-Style Editor (Heavyweight Solution)

**Pros:**
- Professional-grade tools
- Advanced features (layers, dimensioning, constraints)
- Industry-standard workflows

**Cons:**
- Very complex implementation (months of work)
- Steep learning curve
- Overkill for target users (non-architects)

**Decision:** Rejected - Over-engineered, doesn't fit product vision

---

### Approach C: Hybrid: Direct Manipulation + Form Panel (Recommended)

**Pros:**
- Intuitive visual editing via cursor
- Precise control via form inputs when needed
- Familiar to design tool users (Figma, Canva)
- Balances ease-of-use and power

**Cons:**
- Moderate complexity to implement
- Requires careful state synchronization

**Decision:** Selected - Best balance of usability and development effort

---

### Approach D: AI-Assisted Editing (Future Enhancement)

**Concept:**
- User describes desired changes in natural language
- AI interprets intent and suggests transformations
- User approves/refines suggestions

**Example:**
- User: "Make the living room bigger"
- AI: Resizes living room, adjusts adjacent walls
- User: Drags handles to fine-tune

**Decision:** Deferred to future iteration - Requires LLM integration for spatial reasoning
