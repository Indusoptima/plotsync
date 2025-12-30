import RBush from 'rbush';
import { FloorPlanGeometry, RoomGeometry, Wall, Opening } from '@/lib/floor-plan/types';
import { BoundingBox } from './editor-store';

// ============================================================================
// R-TREE SPATIAL INDEX FOR FAST COLLISION DETECTION
// ============================================================================

/**
 * Spatial index item with bounding box
 */
export interface SpatialItem {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  id: string;
  type: 'room' | 'wall' | 'door' | 'window' | 'furniture';
  data: any; // Original element data
}

/**
 * Spatial index manager using R-tree
 */
export class FloorPlanSpatialIndex {
  private tree: RBush<SpatialItem>;
  
  constructor() {
    this.tree = new RBush<SpatialItem>();
  }

  /**
   * Build index from floor plan geometry
   */
  buildFromFloorPlan(plan: FloorPlanGeometry): void {
    this.clear();
    
    const items: SpatialItem[] = [];
    
    // Index rooms
    plan.rooms.forEach((room) => {
      items.push(this.createItemFromRoom(room));
    });
    
    // Index walls
    plan.walls.forEach((wall) => {
      items.push(this.createItemFromWall(wall));
    });
    
    // Index openings
    plan.openings.forEach((opening) => {
      items.push(this.createItemFromOpening(opening, plan));
    });
    
    this.tree.load(items);
  }

  /**
   * Create spatial item from room
   */
  private createItemFromRoom(room: RoomGeometry): SpatialItem {
    const { x, y, width, height } = room.geometry.bounds;
    return {
      minX: x,
      minY: y,
      maxX: x + width,
      maxY: y + height,
      id: room.id,
      type: 'room',
      data: room,
    };
  }

  /**
   * Create spatial item from wall
   */
  private createItemFromWall(wall: Wall): SpatialItem {
    const { start, end } = wall.geometry;
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);
    
    // Expand by wall thickness for accurate collision
    const halfThickness = wall.thickness / 2;
    
    return {
      minX: minX - halfThickness,
      minY: minY - halfThickness,
      maxX: maxX + halfThickness,
      maxY: maxY + halfThickness,
      id: wall.id,
      type: 'wall',
      data: wall,
    };
  }

  /**
   * Create spatial item from opening (door/window)
   */
  private createItemFromOpening(opening: Opening, plan: FloorPlanGeometry): SpatialItem {
    // Find parent wall
    const wall = plan.walls.find((w) => w.id === opening.wallId);
    if (!wall) {
      // Fallback to zero-size item if wall not found
      return {
        minX: 0,
        minY: 0,
        maxX: 0,
        maxY: 0,
        id: opening.id,
        type: opening.type === 'door' ? 'door' : 'window',
        data: opening,
      };
    }
    
    // Calculate opening position along wall
    const { start, end } = wall.geometry;
    const wallLength = Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
    );
    
    const openingPos = opening.position * wallLength;
    const dx = (end.x - start.x) / wallLength;
    const dy = (end.y - start.y) / wallLength;
    
    const centerX = start.x + dx * openingPos;
    const centerY = start.y + dy * openingPos;
    
    const halfWidth = opening.width / 2;
    
    return {
      minX: centerX - halfWidth,
      minY: centerY - halfWidth,
      maxX: centerX + halfWidth,
      maxY: centerY + halfWidth,
      id: opening.id,
      type: opening.type === 'door' ? 'door' : 'window',
      data: opening,
    };
  }

  /**
   * Search for elements that overlap with a bounding box
   */
  search(box: BoundingBox): SpatialItem[] {
    return this.tree.search({
      minX: box.x,
      minY: box.y,
      maxX: box.x + box.width,
      maxY: box.y + box.height,
    });
  }

  /**
   * Search for elements at a specific point
   */
  searchPoint(x: number, y: number, threshold: number = 0.1): SpatialItem[] {
    return this.tree.search({
      minX: x - threshold,
      minY: y - threshold,
      maxX: x + threshold,
      maxY: y + threshold,
    });
  }

  /**
   * Find nearest element to a point
   */
  findNearest(x: number, y: number, maxResults: number = 1): SpatialItem[] {
    // Start with small search radius and expand if needed
    let radius = 0.5;
    let results: SpatialItem[] = [];
    
    while (results.length === 0 && radius < 50) {
      results = this.searchPoint(x, y, radius);
      radius *= 2;
    }
    
    // Sort by distance and return top N
    results.sort((a, b) => {
      const distA = this.distanceToBox(x, y, a);
      const distB = this.distanceToBox(x, y, b);
      return distA - distB;
    });
    
    return results.slice(0, maxResults);
  }

  /**
   * Calculate distance from point to bounding box
   */
  private distanceToBox(x: number, y: number, item: SpatialItem): number {
    const dx = Math.max(item.minX - x, 0, x - item.maxX);
    const dy = Math.max(item.minY - y, 0, y - item.maxY);
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Update a single element in the index
   */
  update(item: SpatialItem): void {
    // Remove old entry
    this.tree.remove(item, (a, b) => a.id === b.id);
    // Insert new entry
    this.tree.insert(item);
  }

  /**
   * Remove an element from the index
   */
  remove(id: string): void {
    const items = this.tree.all();
    const item = items.find((i) => i.id === id);
    if (item) {
      this.tree.remove(item);
    }
  }

  /**
   * Clear the entire index
   */
  clear(): void {
    this.tree.clear();
  }

  /**
   * Get all items in the index
   */
  all(): SpatialItem[] {
    return this.tree.all();
  }

  /**
   * Get number of items in the index
   */
  size(): number {
    return this.tree.all().length;
  }

  /**
   * Check if two elements are likely to collide
   */
  checkCollision(item1: SpatialItem, item2: SpatialItem): boolean {
    return !(
      item1.maxX < item2.minX ||
      item2.maxX < item1.minX ||
      item1.maxY < item2.minY ||
      item2.maxY < item1.minY
    );
  }

  /**
   * Find all collisions for a given element
   */
  findCollisions(item: SpatialItem): SpatialItem[] {
    const candidates = this.search({
      x: item.minX,
      y: item.minY,
      width: item.maxX - item.minX,
      height: item.maxY - item.minY,
    });
    
    return candidates.filter(
      (candidate) => candidate.id !== item.id && this.checkCollision(item, candidate)
    );
  }
}

/**
 * Global spatial index instance (singleton)
 */
let globalIndex: FloorPlanSpatialIndex | null = null;

/**
 * Get or create global spatial index
 */
export function getSpatialIndex(): FloorPlanSpatialIndex {
  if (!globalIndex) {
    globalIndex = new FloorPlanSpatialIndex();
  }
  return globalIndex;
}

/**
 * Reset global spatial index
 */
export function resetSpatialIndex(): void {
  globalIndex = new FloorPlanSpatialIndex();
}

/**
 * Performance utilities
 */
export class SpatialQueryPerformance {
  private static queryTimes: number[] = [];
  
  /**
   * Measure query performance
   */
  static measureQuery<T>(queryFn: () => T): { result: T; time: number } {
    const start = performance.now();
    const result = queryFn();
    const time = performance.now() - start;
    
    this.queryTimes.push(time);
    if (this.queryTimes.length > 100) {
      this.queryTimes.shift(); // Keep last 100 measurements
    }
    
    return { result, time };
  }

  /**
   * Get average query time
   */
  static getAverageQueryTime(): number {
    if (this.queryTimes.length === 0) return 0;
    return this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length;
  }

  /**
   * Reset performance statistics
   */
  static reset(): void {
    this.queryTimes = [];
  }
}

/**
 * Utility: Convert simple floor plan data to spatial items
 */
export function createSpatialItemsFromSimplePlan(planData: any): SpatialItem[] {
  const items: SpatialItem[] = [];
  
  // Add rooms
  if (planData.rooms) {
    planData.rooms.forEach((room: any, index: number) => {
      items.push({
        minX: room.x,
        minY: room.y,
        maxX: room.x + room.width,
        maxY: room.y + room.height,
        id: `room-${index}`,
        type: 'room',
        data: room,
      });
    });
  }
  
  // Add walls
  if (planData.walls) {
    planData.walls.forEach((wall: any, index: number) => {
      items.push({
        minX: Math.min(wall.x1, wall.x2),
        minY: Math.min(wall.y1, wall.y2),
        maxX: Math.max(wall.x1, wall.x2),
        maxY: Math.max(wall.y1, wall.y2),
        id: `wall-${index}`,
        type: 'wall',
        data: wall,
      });
    });
  }
  
  return items;
}
