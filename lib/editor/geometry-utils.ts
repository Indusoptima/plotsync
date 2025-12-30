import { Point2D, RoomGeometry, Wall } from '@/lib/floor-plan/types';
import { BoundingBox } from './editor-store';

// ============================================================================
// POINT AND POLYGON UTILITIES
// ============================================================================

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
export function pointInPolygon(point: Point2D, vertices: Point2D[]): boolean {
  let inside = false;
  const x = point.x;
  const y = point.y;

  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x;
    const yi = vertices[i].y;
    const xj = vertices[j].x;
    const yj = vertices[j].y;

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Check if a point is inside a bounding box
 */
export function pointInBoundingBox(point: Point2D, box: BoundingBox): boolean {
  return (
    point.x >= box.x &&
    point.x <= box.x + box.width &&
    point.y >= box.y &&
    point.y <= box.y + box.height
  );
}

/**
 * Check if a point is near another point (within threshold)
 */
export function pointsNear(p1: Point2D, p2: Point2D, threshold: number): boolean {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy) < threshold;
}

// ============================================================================
// LINE AND SEGMENT UTILITIES
// ============================================================================

/**
 * Calculate intersection point of two lines
 * Returns null if lines are parallel
 */
export function lineIntersection(
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  p4: Point2D
): Point2D | null {
  const x1 = p1.x;
  const y1 = p1.y;
  const x2 = p2.x;
  const y2 = p2.y;
  const x3 = p3.x;
  const y3 = p3.y;
  const x4 = p4.x;
  const y4 = p4.y;

  const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

  if (Math.abs(denominator) < 0.0001) {
    return null; // Lines are parallel
  }

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1),
    };
  }

  return null; // Lines don't intersect within segments
}

/**
 * Calculate the closest point on a line segment to a given point
 */
export function closestPointOnSegment(
  point: Point2D,
  lineStart: Point2D,
  lineEnd: Point2D
): Point2D {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;

  if (dx === 0 && dy === 0) {
    return lineStart; // Line is a point
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) /
        (dx * dx + dy * dy)
    )
  );

  return {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy,
  };
}

/**
 * Calculate distance from a point to a line segment
 */
export function distanceToSegment(
  point: Point2D,
  lineStart: Point2D,
  lineEnd: Point2D
): number {
  const closest = closestPointOnSegment(point, lineStart, lineEnd);
  const dx = point.x - closest.x;
  const dy = point.y - closest.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate the length of a line segment
 */
export function lineLength(start: Point2D, end: Point2D): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// ============================================================================
// BOUNDING BOX UTILITIES
// ============================================================================

/**
 * Calculate bounding box from vertices
 */
export function boundingBoxFromVertices(vertices: Point2D[]): BoundingBox {
  if (vertices.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const xs = vertices.map((v) => v.x);
  const ys = vertices.map((v) => v.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Check if two bounding boxes overlap
 */
export function boundingBoxesOverlap(box1: BoundingBox, box2: BoundingBox): boolean {
  return !(
    box1.x + box1.width < box2.x ||
    box2.x + box2.width < box1.x ||
    box1.y + box1.height < box2.y ||
    box2.y + box2.height < box1.y
  );
}

/**
 * Expand bounding box by a margin
 */
export function expandBoundingBox(box: BoundingBox, margin: number): BoundingBox {
  return {
    x: box.x - margin,
    y: box.y - margin,
    width: box.width + margin * 2,
    height: box.height + margin * 2,
  };
}

// ============================================================================
// POLYGON UTILITIES
// ============================================================================

/**
 * Check if two polygons intersect using Separating Axis Theorem (SAT)
 */
export function polygonsIntersect(poly1: Point2D[], poly2: Point2D[]): boolean {
  // Helper function to get axes (normals)
  const getAxes = (vertices: Point2D[]): Point2D[] => {
    const axes: Point2D[] = [];
    for (let i = 0; i < vertices.length; i++) {
      const p1 = vertices[i];
      const p2 = vertices[(i + 1) % vertices.length];
      const edge = { x: p2.x - p1.x, y: p2.y - p1.y };
      const normal = { x: -edge.y, y: edge.x };
      axes.push(normal);
    }
    return axes;
  };

  // Helper function to project polygon onto axis
  const project = (vertices: Point2D[], axis: Point2D): { min: number; max: number } => {
    let min = Infinity;
    let max = -Infinity;

    vertices.forEach((vertex) => {
      const projection = vertex.x * axis.x + vertex.y * axis.y;
      min = Math.min(min, projection);
      max = Math.max(max, projection);
    });

    return { min, max };
  };

  // Get all axes from both polygons
  const axes = [...getAxes(poly1), ...getAxes(poly2)];

  // Test each axis
  for (const axis of axes) {
    const proj1 = project(poly1, axis);
    const proj2 = project(poly2, axis);

    // If projections don't overlap, polygons don't intersect
    if (proj1.max < proj2.min || proj2.max < proj1.min) {
      return false;
    }
  }

  return true;
}

/**
 * Calculate the area of a polygon
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
    cx += (vertices[i].x + vertices[j].x) * cross;
    cy += (vertices[i].y + vertices[j].y) * cross;
    area += cross;
  }

  area /= 2;
  const factor = 1 / (6 * area);

  return {
    x: cx * factor,
    y: cy * factor,
  };
}

/**
 * Get vertices of a bounding box as a polygon
 */
export function boundingBoxToPolygon(box: BoundingBox): Point2D[] {
  return [
    { x: box.x, y: box.y },
    { x: box.x + box.width, y: box.y },
    { x: box.x + box.width, y: box.y + box.height },
    { x: box.x, y: box.y + box.height },
  ];
}

// ============================================================================
// GRID AND SNAP UTILITIES
// ============================================================================

/**
 * Snap a value to grid
 */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Snap a point to grid
 */
export function snapPointToGrid(point: Point2D, gridSize: number): Point2D {
  return {
    x: snapToGrid(point.x, gridSize),
    y: snapToGrid(point.y, gridSize),
  };
}

/**
 * Find the nearest snap point from a list of candidates
 */
export function findNearestSnapPoint(
  point: Point2D,
  candidates: Point2D[],
  threshold: number
): Point2D | null {
  let nearest: Point2D | null = null;
  let minDistance = threshold;

  for (const candidate of candidates) {
    const dx = point.x - candidate.x;
    const dy = point.y - candidate.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < minDistance) {
      minDistance = distance;
      nearest = candidate;
    }
  }

  return nearest;
}

// ============================================================================
// ANGLE AND ROTATION UTILITIES
// ============================================================================

/**
 * Calculate angle between two points in degrees
 */
export function angleBetweenPoints(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

/**
 * Snap angle to nearest increment (e.g., 90 degrees)
 */
export function snapAngle(angle: number, increment: number): number {
  return Math.round(angle / increment) * increment;
}

/**
 * Rotate a point around a center point
 */
export function rotatePoint(point: Point2D, center: Point2D, angleDegrees: number): Point2D {
  const angleRadians = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);

  const dx = point.x - center.x;
  const dy = point.y - center.y;

  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

// ============================================================================
// CONSTRAINT VALIDATION UTILITIES
// ============================================================================

/**
 * Check if a room meets minimum area requirement
 */
export function validateMinArea(area: number, minArea: number): boolean {
  return area >= minArea;
}

/**
 * Check if a room's aspect ratio is within acceptable range
 */
export function validateAspectRatio(
  width: number,
  height: number,
  minRatio: number,
  maxRatio: number
): boolean {
  const ratio = Math.max(width, height) / Math.min(width, height);
  return ratio >= minRatio && ratio <= maxRatio;
}

/**
 * Check if two rooms overlap
 */
export function checkRoomOverlap(room1: RoomGeometry, room2: RoomGeometry): boolean {
  return polygonsIntersect(room1.geometry.vertices, room2.geometry.vertices);
}

/**
 * Check if a wall endpoint is near a valid junction point
 */
export function validateWallConnection(
  endpoint: Point2D,
  junctions: Point2D[],
  threshold: number
): boolean {
  return junctions.some((junction) => pointsNear(endpoint, junction, threshold));
}

/**
 * Calculate clearance distance from door/window to wall endpoint
 */
export function calculateClearanceDistance(
  openingPosition: number,
  wallLength: number,
  openingWidth: number
): { startClearance: number; endClearance: number } {
  const startClearance = openingPosition * wallLength;
  const endClearance = (1 - openingPosition) * wallLength - openingWidth;

  return { startClearance, endClearance };
}

// ============================================================================
// MEASUREMENT UTILITIES
// ============================================================================

/**
 * Format distance with proper units and precision
 */
export function formatDistance(meters: number, precision: number = 1): string {
  return `${meters.toFixed(precision)}m`;
}

/**
 * Format area with proper units and precision
 */
export function formatArea(squareMeters: number, precision: number = 1): string {
  return `${squareMeters.toFixed(precision)} m²`;
}

/**
 * Calculate dimensions text (width × height)
 */
export function formatDimensions(width: number, height: number, precision: number = 1): string {
  return `${width.toFixed(precision)}m × ${height.toFixed(precision)}m`;
}
