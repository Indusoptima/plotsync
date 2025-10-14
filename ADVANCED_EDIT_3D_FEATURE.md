# Advanced Edit Mode with 3D Visualization

## Overview
This document describes the enhanced Advanced Edit Mode feature that provides comprehensive floor plan editing capabilities with real-time 3D visualization.

## Features Implemented

### 1. **Layout Editing**
- **Add Rooms**: Create rooms with custom dimensions, positions, materials, and colors
- **Add Walls**: Place walls with precise start/end coordinates
- **Add Doors**: Position doors with rotation control
- **Add Windows**: Place windows with adjustable width

### 2. **Materials System**
Select from 6 professional materials for floors and walls:
- **Default** (#E8E8E8) - Standard neutral finish
- **Wood** (#8B4513) - Natural wood flooring
- **Concrete** (#808080) - Industrial concrete
- **Brick** (#B22222) - Classic brick texture
- **Marble** (#F0F0F0) - Elegant marble finish
- **Tile** (#D3D3D3) - Ceramic tile

Each material has unique visual properties in the 3D view with appropriate roughness and metalness values.

### 3. **Paint Colors**
Choose from 8 pre-defined paint colors or use custom colors:
- White (#FFFFFF)
- Beige (#F5F5DC)
- Light Gray (#D3D3D3)
- Cream (#FFFDD0)
- Light Blue (#ADD8E6)
- Mint (#98FF98)
- Lavender (#E6E6FA)
- Peach (#FFDAB9)

Custom color picker supports any hex color value.

### 4. **Furniture Placement**
Add 9 different furniture types to any room:
- 🛋️ Sofa - Living room seating
- 🛏️ Bed - Bedroom furniture
- 🪑 Table - Dining/work surface
- 💺 Chair - Seating furniture
- 🖥️ Desk - Office workspace
- 📺 TV - Entertainment center
- 🧊 Fridge - Kitchen appliance
- 🔥 Stove - Cooking appliance
- 👔 Wardrobe - Storage furniture

Each furniture item is rendered in 3D with realistic dimensions and materials.

### 5. **3D Visualization**
Real-time 3D view powered by React Three Fiber and Three.js:

#### Features:
- **Interactive Camera Controls**: Orbit, zoom, and pan with mouse/touch
- **Realistic Lighting**: Ambient light + directional light with shadows
- **Material Rendering**: PBR (Physically Based Rendering) materials
- **Furniture Display**: 3D models for all furniture types
- **Smooth Navigation**: Damped camera movements for smooth experience

#### Technical Details:
- **Canvas**: React Three Fiber Canvas component
- **Controls**: OrbitControls from @react-three/drei
- **Lighting Setup**:
  - Ambient light: intensity 0.6
  - Directional light: position [10, 10, 5], intensity 0.8, with shadow mapping
  - Point light: position [-10, 10, -5], intensity 0.3
- **Shadows**: 2048x2048 shadow maps for high-quality shadows
- **Camera**: FOV 50, positioned at [15, 15, 15] for optimal view angle

### 6. **View Mode Toggle**
Switch between 2D and 3D views:
- **2D View**: Traditional Konva.js canvas with floor plan drawing
- **3D View**: Immersive three.js 3D visualization

## User Interface

### Tab Structure
1. **Layout Tab**: Add/edit rooms, walls, doors, windows
2. **Materials Tab**: Select floor and wall materials
3. **Paint Tab**: Choose wall paint colors
4. **Furniture Tab**: Add furniture to rooms

### Advanced Edit Panel Components
```
AdvancedEditPanel (components/editor/advanced-edit-panel.tsx)
├── Main Tabs (Layout | Materials | Paint | Furniture)
├── Layout Sub-tabs (Room | Wall | Door | Window)
├── Material Selector (6 materials with visual previews)
├── Paint Color Picker (8 presets + custom color)
└── Furniture Selector (9 types with icons)
```

### 3D Viewer Components
```
FloorPlan3DViewer (components/editor/floor-plan-3d-viewer.tsx)
├── Canvas (React Three Fiber)
├── Scene (Lights + Camera Controls)
├── Room3D (Walls + Floor rendering)
├── Furniture3D (3D furniture models)
└── Ground Plane (Base surface)
```

## Technical Stack

### Libraries Added
- **@react-three/fiber**: React renderer for Three.js
- **@react-three/drei**: Helper components for R3F (OrbitControls, Box, Plane)
- **three**: Core 3D graphics library
- **@types/three**: TypeScript definitions
- **@radix-ui/react-label**: Accessible label component
- **class-variance-authority**: Class name utilities

### TypeScript Configuration
Created custom type declarations for Three.js JSX elements in `types/three-jsx.d.ts`

## Usage

### Activating Advanced Edit Mode
1. Click "Advanced Edit" button in the action bar
2. The sidebar switches to Advanced Edit Panel
3. Choose between Layout, Materials, Paint, or Furniture tabs

### Adding Elements

#### Add a Room:
1. Go to Layout → Room tab
2. Enter room name
3. Set position (X, Y) and dimensions (Width, Height)
4. Optionally select material and color
5. Click "Add Room"

#### Apply Materials:
1. Go to Materials tab
2. Click on desired material
3. Material will be applied to next room created
4. Existing rooms can have materials added via paint tab

#### Paint a Room:
1. Go to Paint tab
2. Select preset color or use custom color picker
3. Apply to rooms when creating them

#### Add Furniture:
1. Go to Furniture tab
2. Enter room index (0 for first room, 1 for second, etc.)
3. Select furniture type from grid
4. Click "Add Furniture"
5. View in 3D mode to see placement

### Viewing in 3D
1. Toggle to "3D" view using the 2D/3D buttons in the header
2. Use mouse to:
   - **Left-click + drag**: Rotate camera
   - **Right-click + drag**: Pan view
   - **Scroll wheel**: Zoom in/out
3. Furniture and materials render with realistic lighting

## Data Structure

### Enhanced Room Interface
```typescript
interface Room {
  name: string
  x: number
  y: number
  width: number
  height: number
  furniture: string[]
  material?: string  // New: material type
  color?: string     // New: paint/floor color
}
```

### Enhanced Wall Interface
```typescript
interface Wall {
  x1: number
  y1: number
  x2: number
  y2: number
  material?: string  // New: wall material
  color?: string     // New: wall color
}
```

## 3D Rendering Details

### Coordinate System
- 2D coordinates are scaled by 0.1 for 3D visualization
- Y-axis in 2D becomes Z-axis in 3D
- Walls have height of 3 units and thickness of 0.1 units

### Material Properties
All materials use PBR (Physically Based Rendering):
- **Floors**: roughness 0.8, metalness 0.2
- **Walls**: roughness 0.9, metalness 0
- **Furniture**: roughness 0.7, metalness 0.3

### Furniture Sizing
Realistic proportions:
- Sofa: 1.0 x 0.6 x 0.5
- Bed: 1.2 x 0.4 x 1.8
- Table: 1.0 x 0.05 x 1.0
- Chair: 0.4 x 0.6 x 0.4
- TV: 0.05 x 0.6 x 1.0
- Fridge: 0.6 x 1.5 x 0.6
- Stove: 0.6 x 0.8 x 0.6
- Wardrobe: 0.6 x 1.8 x 1.2
- Desk: 1.2 x 0.7 x 0.6

## Benefits

1. **Visual Feedback**: See changes instantly in 3D
2. **Material Planning**: Choose materials before construction
3. **Furniture Layout**: Plan furniture placement in advance
4. **Client Presentation**: Show realistic 3D renderings
5. **Better Design Decisions**: Understand spatial relationships
6. **Professional Output**: Export with material specifications

## Future Enhancements

Potential features for next iteration:
- Texture mapping for materials
- Custom furniture models (GLTF import)
- Lighting customization
- Shadow quality settings
- Export 3D models
- VR/AR preview mode
- Measurement tools in 3D
- Collision detection for furniture
- Auto-arrange furniture
- Material cost estimation

## Performance Considerations

- 3D rendering uses WebGL hardware acceleration
- Shadow maps limited to 2048x2048 for performance
- Dynamic imports prevent SSR issues
- Furniture instances optimized for multiple items
- Camera controls use damping for smooth performance

## Accessibility

- All color selections include text labels
- Keyboard navigation supported
- Screen reader compatible labels
- Clear visual feedback for selections
- Intuitive icon-based furniture selection
