import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { FloorPlanGeometry, Point2D, RoomGeometry, Wall, Opening, FurnitureItem } from '@/lib/floor-plan/types';

// ============================================================================
// EDITOR STATE TYPES
// ============================================================================

export type ElementType = 'room' | 'wall' | 'door' | 'window' | 'furniture';

export type EditMode = 'select' | 'room' | 'wall' | 'door' | 'window' | 'furniture';

export type TransformHandleType = 
  | 'top-left' 
  | 'top-right' 
  | 'bottom-left' 
  | 'bottom-right'
  | 'top-center'
  | 'bottom-center'
  | 'left-center'
  | 'right-center'
  | 'center'
  | 'endpoint-1'
  | 'endpoint-2'
  | 'midpoint'
  | 'rotation';

export interface Selection {
  type: ElementType | null;
  elementIds: string[];
  handles: TransformHandle[];
  bounds: BoundingBox | null;
}

export interface TransformHandle {
  id: string;
  type: TransformHandleType;
  position: Point2D;
  cursor: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TransformState {
  isDragging: boolean;
  dragStart: Point2D | null;
  currentPosition: Point2D | null;
  originalGeometry: any | null;
  previewGeometry: any | null;
  activeHandle: TransformHandleType | null;
}

export interface HistoryEntry {
  timestamp: string;
  actionType: 'move' | 'resize' | 'rotate' | 'add' | 'delete' | 'modify';
  elementType: ElementType;
  elementId: string;
  before: any;
  after: any;
  description: string;
}

export interface ValidationError {
  elementId: string;
  type: 'error' | 'warning';
  message: string;
  position?: Point2D;
}

export interface GridConfig {
  visible: boolean;
  majorSpacing: number; // 1.0m
  minorSpacing: number; // 0.1m
  snapEnabled: boolean;
  snapThreshold: number; // 0.05m
}

// ============================================================================
// EDITOR STATE INTERFACE
// ============================================================================

export interface EditorState {
  // Floor plan data
  currentPlan: FloorPlanGeometry | null;
  
  // Editor mode
  activeMode: EditMode;
  
  // Selection
  selection: Selection;
  
  // Transform state
  transform: TransformState;
  
  // History (undo/redo)
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];
  maxHistorySize: number;
  
  // Validation
  errors: ValidationError[];
  
  // Grid
  grid: GridConfig;
  
  // UI state
  hoveredElementId: string | null;
  showDimensions: boolean;
  
  // Actions
  setCurrentPlan: (plan: FloorPlanGeometry | null) => void;
  setActiveMode: (mode: EditMode) => void;
  
  // Selection actions
  selectElement: (type: ElementType, id: string, multiSelect?: boolean) => void;
  deselectAll: () => void;
  updateSelection: (selection: Partial<Selection>) => void;
  
  // Transform actions
  startTransform: (handle: TransformHandleType, position: Point2D) => void;
  updateTransform: (position: Point2D) => void;
  commitTransform: () => void;
  cancelTransform: () => void;
  
  // History actions
  pushHistory: (entry: Omit<HistoryEntry, 'timestamp'>) => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  
  // Validation actions
  addError: (error: ValidationError) => void;
  clearErrors: () => void;
  removeError: (elementId: string) => void;
  
  // Grid actions
  toggleGrid: () => void;
  toggleSnap: () => void;
  setGridConfig: (config: Partial<GridConfig>) => void;
  
  // UI actions
  setHoveredElement: (id: string | null) => void;
  toggleDimensions: () => void;
  
  // Geometry update actions
  updateRoomGeometry: (roomId: string, geometry: Partial<RoomGeometry['geometry']>) => void;
  updateWallGeometry: (wallId: string, geometry: Partial<Wall['geometry']>) => void;
  updateOpeningPosition: (openingId: string, position: number, rotation?: number) => void;
  updateFurniturePosition: (furnitureId: string, position: Point2D, rotation?: number) => void;
  
  // Element operations
  deleteElement: (type: ElementType, id: string) => void;
  duplicateElement: (type: ElementType, id: string) => void;
}

// ============================================================================
// ZUSTAND STORE
// ============================================================================

export const useEditorStore = create<EditorState>()(
  immer((set, get) => ({
    // Initial state
    currentPlan: null,
    activeMode: 'select',
    selection: {
      type: null,
      elementIds: [],
      handles: [],
      bounds: null,
    },
    transform: {
      isDragging: false,
      dragStart: null,
      currentPosition: null,
      originalGeometry: null,
      previewGeometry: null,
      activeHandle: null,
    },
    undoStack: [],
    redoStack: [],
    maxHistorySize: 50,
    errors: [],
    grid: {
      visible: true,
      majorSpacing: 1.0,
      minorSpacing: 0.1,
      snapEnabled: true,
      snapThreshold: 0.05,
    },
    hoveredElementId: null,
    showDimensions: true,

    // Actions
    setCurrentPlan: (plan) => {
      set((state) => {
        state.currentPlan = plan;
      });
    },

    setActiveMode: (mode) => {
      set((state) => {
        state.activeMode = mode;
      });
    },

    // Selection actions
    selectElement: (type, id, multiSelect = false) => {
      set((state) => {
        if (multiSelect) {
          // Add to selection
          if (!state.selection.elementIds.includes(id)) {
            state.selection.type = type;
            state.selection.elementIds.push(id);
          }
        } else {
          // Replace selection
          state.selection.type = type;
          state.selection.elementIds = [id];
        }
        
        // Calculate handles and bounds based on element type
        state.selection.handles = calculateHandles(type, id, state.currentPlan);
        state.selection.bounds = calculateBounds(type, state.selection.elementIds, state.currentPlan);
      });
    },

    deselectAll: () => {
      set((state) => {
        state.selection = {
          type: null,
          elementIds: [],
          handles: [],
          bounds: null,
        };
      });
    },

    updateSelection: (selection) => {
      set((state) => {
        Object.assign(state.selection, selection);
      });
    },

    // Transform actions
    startTransform: (handle, position) => {
      set((state) => {
        state.transform.isDragging = true;
        state.transform.dragStart = position;
        state.transform.currentPosition = position;
        state.transform.activeHandle = handle;
        
        // Store original geometry
        const { type, elementIds } = state.selection;
        if (type && elementIds.length > 0) {
          state.transform.originalGeometry = getElementGeometry(
            type,
            elementIds[0],
            state.currentPlan
          );
        }
      });
    },

    updateTransform: (position) => {
      set((state) => {
        if (!state.transform.isDragging) return;
        
        state.transform.currentPosition = position;
        
        // Calculate preview geometry based on handle type and delta
        const delta = {
          x: position.x - (state.transform.dragStart?.x || 0),
          y: position.y - (state.transform.dragStart?.y || 0),
        };
        
        state.transform.previewGeometry = calculatePreviewGeometry(
          state.transform.originalGeometry,
          state.transform.activeHandle,
          delta,
          state.grid.snapEnabled ? state.grid : null
        );
      });
    },

    commitTransform: () => {
      set((state) => {
        if (!state.transform.previewGeometry || !state.selection.type) return;
        
        const elementId = state.selection.elementIds[0];
        const elementType = state.selection.type;
        
        // Push to history
        const historyEntry: Omit<HistoryEntry, 'timestamp'> = {
          actionType: state.transform.activeHandle === 'center' ? 'move' : 'resize',
          elementType,
          elementId,
          before: state.transform.originalGeometry,
          after: state.transform.previewGeometry,
          description: `${state.transform.activeHandle === 'center' ? 'Moved' : 'Resized'} ${elementType}`,
        };
        
        // Apply the transform
        applyGeometryUpdate(state, elementType, elementId, state.transform.previewGeometry);
        
        // Add to history
        get().pushHistory(historyEntry);
        
        // Reset transform state
        state.transform = {
          isDragging: false,
          dragStart: null,
          currentPosition: null,
          originalGeometry: null,
          previewGeometry: null,
          activeHandle: null,
        };
        
        // Update handles
        state.selection.handles = calculateHandles(elementType, elementId, state.currentPlan);
        state.selection.bounds = calculateBounds(elementType, state.selection.elementIds, state.currentPlan);
      });
    },

    cancelTransform: () => {
      set((state) => {
        state.transform = {
          isDragging: false,
          dragStart: null,
          currentPosition: null,
          originalGeometry: null,
          previewGeometry: null,
          activeHandle: null,
        };
      });
    },

    // History actions
    pushHistory: (entry) => {
      set((state) => {
        const historyEntry: HistoryEntry = {
          ...entry,
          timestamp: new Date().toISOString(),
        };
        
        state.undoStack.push(historyEntry);
        
        // Limit stack size
        if (state.undoStack.length > state.maxHistorySize) {
          state.undoStack.shift();
        }
        
        // Clear redo stack on new action
        state.redoStack = [];
      });
    },

    undo: () => {
      set((state) => {
        const entry = state.undoStack.pop();
        if (!entry) return;
        
        // Restore previous state
        applyGeometryUpdate(state, entry.elementType, entry.elementId, entry.before);
        
        // Add to redo stack
        state.redoStack.push(entry);
      });
    },

    redo: () => {
      set((state) => {
        const entry = state.redoStack.pop();
        if (!entry) return;
        
        // Restore forward state
        applyGeometryUpdate(state, entry.elementType, entry.elementId, entry.after);
        
        // Add back to undo stack
        state.undoStack.push(entry);
      });
    },

    clearHistory: () => {
      set((state) => {
        state.undoStack = [];
        state.redoStack = [];
      });
    },

    // Validation actions
    addError: (error) => {
      set((state) => {
        state.errors.push(error);
      });
    },

    clearErrors: () => {
      set((state) => {
        state.errors = [];
      });
    },

    removeError: (elementId) => {
      set((state) => {
        state.errors = state.errors.filter(e => e.elementId !== elementId);
      });
    },

    // Grid actions
    toggleGrid: () => {
      set((state) => {
        state.grid.visible = !state.grid.visible;
      });
    },

    toggleSnap: () => {
      set((state) => {
        state.grid.snapEnabled = !state.grid.snapEnabled;
      });
    },

    setGridConfig: (config) => {
      set((state) => {
        Object.assign(state.grid, config);
      });
    },

    // UI actions
    setHoveredElement: (id) => {
      set((state) => {
        state.hoveredElementId = id;
      });
    },

    toggleDimensions: () => {
      set((state) => {
        state.showDimensions = !state.showDimensions;
      });
    },

    // Geometry update actions
    updateRoomGeometry: (roomId, geometry) => {
      set((state) => {
        if (!state.currentPlan) return;
        const room = state.currentPlan.rooms.find(r => r.id === roomId);
        if (room) {
          Object.assign(room.geometry, geometry);
        }
      });
    },

    updateWallGeometry: (wallId, geometry) => {
      set((state) => {
        if (!state.currentPlan) return;
        const wall = state.currentPlan.walls.find(w => w.id === wallId);
        if (wall) {
          Object.assign(wall.geometry, geometry);
        }
      });
    },

    updateOpeningPosition: (openingId, position, rotation) => {
      set((state) => {
        if (!state.currentPlan) return;
        const opening = state.currentPlan.openings.find(o => o.id === openingId);
        if (opening) {
          opening.position = position;
          if (rotation !== undefined && opening.properties.swingDirection !== undefined) {
            opening.properties.swingDirection = rotation;
          }
        }
      });
    },

    updateFurniturePosition: (furnitureId, position, rotation) => {
      set((state) => {
        if (!state.currentPlan) return;
        // Note: Furniture is currently in room.furniture array as strings
        // This will need to be updated when we have proper FurnitureItem objects
      });
    },

    // Element operations
    deleteElement: (type, id) => {
      set((state) => {
        if (!state.currentPlan) return;
        
        // Push to history before deleting
        const before = getElementGeometry(type, id, state.currentPlan);
        
        switch (type) {
          case 'room':
            state.currentPlan.rooms = state.currentPlan.rooms.filter(r => r.id !== id);
            break;
          case 'wall':
            state.currentPlan.walls = state.currentPlan.walls.filter(w => w.id !== id);
            break;
          case 'door':
          case 'window':
            state.currentPlan.openings = state.currentPlan.openings.filter(o => o.id !== id);
            break;
        }
        
        get().pushHistory({
          actionType: 'delete',
          elementType: type,
          elementId: id,
          before,
          after: null,
          description: `Deleted ${type}`,
        });
        
        // Clear selection
        get().deselectAll();
      });
    },

    duplicateElement: (type, id) => {
      set((state) => {
        if (!state.currentPlan) return;
        
        const element = getElementGeometry(type, id, state.currentPlan);
        if (!element) return;
        
        // Create duplicate with offset
        const newElement = JSON.parse(JSON.stringify(element));
        const newId = `${type}-${Date.now()}`;
        
        // Offset position
        if (type === 'room') {
          newElement.geometry.bounds.x += 1;
          newElement.geometry.bounds.y += 1;
        }
        
        // Add to current plan
        switch (type) {
          case 'room':
            newElement.id = newId;
            state.currentPlan.rooms.push(newElement);
            break;
        }
        
        get().pushHistory({
          actionType: 'add',
          elementType: type,
          elementId: newId,
          before: null,
          after: newElement,
          description: `Duplicated ${type}`,
        });
        
        // Select new element
        get().selectElement(type, newId);
      });
    },
  }))
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateHandles(
  type: ElementType,
  id: string,
  plan: FloorPlanGeometry | null
): TransformHandle[] {
  if (!plan) return [];
  
  switch (type) {
    case 'room': {
      const room = plan.rooms.find(r => r.id === id);
      if (!room) return [];
      
      const { x, y, width, height } = room.geometry.bounds;
      
      return [
        // 4 corners
        { id: 'tl', type: 'top-left', position: { x, y }, cursor: 'nwse-resize' },
        { id: 'tr', type: 'top-right', position: { x: x + width, y }, cursor: 'nesw-resize' },
        { id: 'bl', type: 'bottom-left', position: { x, y: y + height }, cursor: 'nesw-resize' },
        { id: 'br', type: 'bottom-right', position: { x: x + width, y: y + height }, cursor: 'nwse-resize' },
        // 4 edges
        { id: 'tc', type: 'top-center', position: { x: x + width / 2, y }, cursor: 'ns-resize' },
        { id: 'bc', type: 'bottom-center', position: { x: x + width / 2, y: y + height }, cursor: 'ns-resize' },
        { id: 'lc', type: 'left-center', position: { x, y: y + height / 2 }, cursor: 'ew-resize' },
        { id: 'rc', type: 'right-center', position: { x: x + width, y: y + height / 2 }, cursor: 'ew-resize' },
      ];
    }
    
    case 'wall': {
      const wall = plan.walls.find(w => w.id === id);
      if (!wall) return [];
      
      const { start, end } = wall.geometry;
      const midpoint = {
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2,
      };
      
      return [
        { id: 'ep1', type: 'endpoint-1', position: start, cursor: 'move' },
        { id: 'ep2', type: 'endpoint-2', position: end, cursor: 'move' },
        { id: 'mid', type: 'midpoint', position: midpoint, cursor: 'move' },
      ];
    }
    
    default:
      return [];
  }
}

function calculateBounds(
  type: ElementType,
  elementIds: string[],
  plan: FloorPlanGeometry | null
): BoundingBox | null {
  if (!plan || elementIds.length === 0) return null;
  
  // For now, just return bounds of first element
  const id = elementIds[0];
  
  switch (type) {
    case 'room': {
      const room = plan.rooms.find(r => r.id === id);
      return room ? room.geometry.bounds : null;
    }
    
    case 'wall': {
      const wall = plan.walls.find(w => w.id === id);
      if (!wall) return null;
      
      const { start, end } = wall.geometry;
      return {
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
        width: Math.abs(end.x - start.x),
        height: Math.abs(end.y - start.y),
      };
    }
    
    default:
      return null;
  }
}

function getElementGeometry(type: ElementType, id: string, plan: FloorPlanGeometry | null): any {
  if (!plan) return null;
  
  switch (type) {
    case 'room':
      return plan.rooms.find(r => r.id === id);
    case 'wall':
      return plan.walls.find(w => w.id === id);
    case 'door':
    case 'window':
      return plan.openings.find(o => o.id === id);
    default:
      return null;
  }
}

function calculatePreviewGeometry(
  originalGeometry: any,
  handleType: TransformHandleType | null,
  delta: Point2D,
  grid: GridConfig | null
): any {
  if (!originalGeometry || !handleType) return originalGeometry;
  
  const snapped = grid?.snapEnabled
    ? {
        x: snapToGrid(delta.x, grid.minorSpacing),
        y: snapToGrid(delta.y, grid.minorSpacing),
      }
    : delta;
  
  // For rooms
  if (originalGeometry.geometry?.bounds) {
    const bounds = { ...originalGeometry.geometry.bounds };
    
    switch (handleType) {
      case 'top-left':
        bounds.x += snapped.x;
        bounds.y += snapped.y;
        bounds.width -= snapped.x;
        bounds.height -= snapped.y;
        break;
      case 'top-right':
        bounds.y += snapped.y;
        bounds.width += snapped.x;
        bounds.height -= snapped.y;
        break;
      case 'bottom-left':
        bounds.x += snapped.x;
        bounds.width -= snapped.x;
        bounds.height += snapped.y;
        break;
      case 'bottom-right':
        bounds.width += snapped.x;
        bounds.height += snapped.y;
        break;
      case 'top-center':
        bounds.y += snapped.y;
        bounds.height -= snapped.y;
        break;
      case 'bottom-center':
        bounds.height += snapped.y;
        break;
      case 'left-center':
        bounds.x += snapped.x;
        bounds.width -= snapped.x;
        break;
      case 'right-center':
        bounds.width += snapped.x;
        break;
      case 'center':
        bounds.x += snapped.x;
        bounds.y += snapped.y;
        break;
    }
    
    return {
      ...originalGeometry,
      geometry: {
        ...originalGeometry.geometry,
        bounds,
      },
    };
  }
  
  return originalGeometry;
}

function applyGeometryUpdate(
  state: any,
  type: ElementType,
  id: string,
  geometry: any
) {
  if (!state.currentPlan || !geometry) return;
  
  switch (type) {
    case 'room': {
      const room = state.currentPlan.rooms.find((r: any) => r.id === id);
      if (room && geometry.geometry?.bounds) {
        room.geometry.bounds = geometry.geometry.bounds;
      }
      break;
    }
    case 'wall': {
      const wall = state.currentPlan.walls.find((w: any) => w.id === id);
      if (wall && geometry.geometry) {
        wall.geometry = geometry.geometry;
      }
      break;
    }
  }
}

function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}
