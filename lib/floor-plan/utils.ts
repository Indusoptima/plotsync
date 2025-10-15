/**
 * Common utility functions for the floor plan generation system
 */

import { Point2D, Dimensions, RoomGeometry, Wall } from './types';

// ============================================================================
// GEOMETRIC UTILITIES
// ============================================================================

/**
 * Calculate Euclidean distance between two points
 */
export function distance(p1: Point2D, p2: Point2D): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Calculate the area of a polygon using the shoelace formula
 */
export function polygonArea(vertices: Point2D[]): number {
  if (vertices.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    area += vertices[i].x * vertices[j].y;
    area -= vertices[j].x * vertices[i].y;
  }
  return Math.abs(area / 2);
}

/**
 * Calculate the centroid of a polygon
 */
export function polygonCentroid(vertices: Point2D[]): Point2D {
  if (vertices.length === 0) return { x: 0, y: 0 };
  
  let cx = 0;
  let cy = 0;
  let area = 0;
  
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    const cross = vertices[i].x * vertices[j].y - vertices[j].x * vertices[i].y;
    area += cross;
    cx += (vertices[i].x + vertices[j].x) * cross;
    cy += (vertices[i].y + vertices[j].y) * cross;
  }
  
  area /= 2;
  cx /= (6 * area);
  cy /= (6 * area);
  
  return { x: cx, y: cy };
}

/**
 * Check if a point is inside a polygon
 */
export function pointInPolygon(point: Point2D, vertices: Point2D[]): boolean {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x, yi = vertices[i].y;
    const xj = vertices[j].x, yj = vertices[j].y;
    
    const intersect = ((yi > point.y) !== (yj > point.y))
      && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Calculate bounding box for a set of points
 */
export function boundingBox(vertices: Point2D[]): { x: number; y: number; width: number; height: number } {
  if (vertices.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  
  for (const v of vertices) {
    minX = Math.min(minX, v.x);
    minY = Math.min(minY, v.y);
    maxX = Math.max(maxX, v.x);
    maxY = Math.max(maxY, v.y);
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

/**
 * Check if two line segments intersect
 */
export function lineSegmentsIntersect(
  p1: Point2D, p2: Point2D,
  p3: Point2D, p4: Point2D
): boolean {
  const det = (p2.x - p1.x) * (p4.y - p3.y) - (p4.x - p3.x) * (p2.y - p1.y);
  if (Math.abs(det) < 1e-10) return false;
  
  const lambda = ((p4.y - p3.y) * (p4.x - p1.x) + (p3.x - p4.x) * (p4.y - p1.y)) / det;
  const gamma = ((p1.y - p2.y) * (p4.x - p1.x) + (p2.x - p1.x) * (p4.y - p1.y)) / det;
  
  return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
}

/**
 * Check if two rectangles overlap
 */
export function rectanglesOverlap(
  r1: { x: number; y: number; width: number; height: number },
  r2: { x: number; y: number; width: number; height: number }
): boolean {
  return !(r1.x + r1.width < r2.x || 
           r2.x + r2.width < r1.x || 
           r1.y + r1.height < r2.y || 
           r2.y + r2.height < r1.y);
}

/**
 * Normalize a vector
 */
export function normalize(v: Point2D): Point2D {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

/**
 * Rotate a point around origin
 */
export function rotatePoint(point: Point2D, angle: number, origin: Point2D = { x: 0, y: 0 }): Point2D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  
  return {
    x: cos * dx - sin * dy + origin.x,
    y: sin * dx + cos * dy + origin.y
  };
}

// ============================================================================
// WALL UTILITIES
// ============================================================================

/**
 * Calculate wall length
 */
export function wallLength(wall: Wall): number {
  return distance(wall.geometry.start, wall.geometry.end);
}

/**
 * Get point along wall at position t (0-1)
 */
export function pointOnWall(wall: Wall, t: number): Point2D {
  const { start, end } = wall.geometry;
  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t
  };
}

/**
 * Check if two walls are collinear (within tolerance)
 */
export function wallsCollinear(wall1: Wall, wall2: Wall, tolerance: number = 0.05): boolean {
  const { start: s1, end: e1 } = wall1.geometry;
  const { start: s2, end: e2 } = wall2.geometry;
  
  const v1 = { x: e1.x - s1.x, y: e1.y - s1.y };
  const v2 = { x: e2.x - s2.x, y: e2.y - s2.y };
  
  const cross = Math.abs(v1.x * v2.y - v1.y * v2.x);
  const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  
  return cross / (len1 * len2) < tolerance;
}

/**
 * Merge collinear walls
 */
export function mergeWalls(wall1: Wall, wall2: Wall): Wall | null {
  if (!wallsCollinear(wall1, wall2)) return null;
  
  // Find the extremes
  const points = [
    wall1.geometry.start,
    wall1.geometry.end,
    wall2.geometry.start,
    wall2.geometry.end
  ];
  
  const { start, end } = wall1.geometry;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  
  // Sort by projection along wall direction
  points.sort((a, b) => {
    const ta = ((a.x - start.x) * dx + (a.y - start.y) * dy) / (dx * dx + dy * dy);
    const tb = ((b.x - start.x) * dx + (b.y - start.y) * dy) / (dx * dx + dy * dy);
    return ta - tb;
  });
  
  return {
    ...wall1,
    id: `${wall1.id}_merged`,
    geometry: {
      start: points[0],
      end: points[3]
    },
    length: distance(points[0], points[3]),
    adjacentRooms: Array.from(new Set([...wall1.adjacentRooms, ...wall2.adjacentRooms]))
  };
}

// ============================================================================
// CONVERSION UTILITIES
// ============================================================================

/**
 * Convert meters to feet
 */
export function metersToFeet(meters: number): number {
  return meters * 3.28084;
}

/**
 * Convert feet to meters
 */
export function feetToMeters(feet: number): number {
  return feet / 3.28084;
}

/**
 * Convert square meters to square feet
 */
export function sqmToSqft(sqm: number): number {
  return sqm * 10.7639;
}

/**
 * Convert square feet to square meters
 */
export function sqftToSqm(sqft: number): number {
  return sqft / 10.7639;
}

/**
 * Format area with appropriate units
 */
export function formatArea(area: number, unit: 'metric' | 'imperial'): string {
  if (unit === 'imperial') {
    return `${sqmToSqft(area).toFixed(1)} sq ft`;
  }
  return `${area.toFixed(1)} m²`;
}

/**
 * Format dimension with appropriate units
 */
export function formatDimension(meters: number, unit: 'metric' | 'imperial'): string {
  if (unit === 'imperial') {
    const feet = metersToFeet(meters);
    const wholeFeet = Math.floor(feet);
    const inches = Math.round((feet - wholeFeet) * 12);
    return inches > 0 ? `${wholeFeet}' ${inches}"` : `${wholeFeet}'`;
  }
  return `${meters.toFixed(2)} m`;
}

// ============================================================================
// ID GENERATION
// ============================================================================

/**
 * Generate unique ID
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Check if a number is within range
 */
export function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Clamp a number to a range
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Check if two numbers are approximately equal
 */
export function approximately(a: number, b: number, epsilon: number = 1e-6): boolean {
  return Math.abs(a - b) < epsilon;
}

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

/**
 * Remove duplicates from array
 */
export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

/**
 * Shuffle array (Fisher-Yates)
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

/**
 * Simple performance timer
 */
export class Timer {
  private startTime: number = 0;
  
  start() {
    this.startTime = Date.now();
  }
  
  elapsed(): number {
    return Date.now() - this.startTime;
  }
  
  stop(): number {
    const elapsed = this.elapsed();
    this.startTime = 0;
    return elapsed;
  }
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  initialDelay: number = 1000,
  backoffMultiplier: number = 2
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts - 1) {
        const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}
