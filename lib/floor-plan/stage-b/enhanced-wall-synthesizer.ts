/**
 * Enhanced Wall Synthesizer
 * Supports L-shaped rooms, non-rectangular geometries, and intelligent wall merging
 */

import { Wall, Point2D } from '../types';
import { DEFAULT_CONFIG } from '../config';
import { distance, generateId } from '../utils';
import { PlacedRoom } from './zone-based-placer';

interface WallSegment {
  start: Point2D;
  end: Point2D;
  type: 'exterior' | 'interior';
  adjacentRooms: string[];
}

export class EnhancedWallSynthesizer {
  private config = DEFAULT_CONFIG.stageB.walls;

  /**
   * Generate walls with support for complex room shapes
   */
  synthesize(rooms: PlacedRoom[]): Wall[] {
    const walls: Wall[] = [];

    // Step 1: Generate building envelope
    const envelope = this.generateComplexEnvelope(rooms);
    walls.push(...envelope);

    // Step 2: Generate interior walls with L-shape support
    const interior = this.generateEnhancedInteriorWalls(rooms);
    walls.push(...interior);

    // Step 3: Simplify and merge walls
    const simplified = this.intelligentWallMerging(walls);

    return simplified;
  }

  /**
   * Generate complex building envelope (supports non-rectangular footprints)
   */
  private generateComplexEnvelope(rooms: PlacedRoom[]): Wall[] {
    if (rooms.length === 0) return [];

    // Calculate building perimeter points
    const perimeterPoints = this.calculateBuildingPerimeter(rooms);

    // Generate walls from perimeter
    const walls: Wall[] = [];
    for (let i = 0; i < perimeterPoints.length; i++) {
      const start = perimeterPoints[i];
      const end = perimeterPoints[(i + 1) % perimeterPoints.length];

      walls.push({
        id: generateId('wall_ext'),
        type: 'exterior',
        thickness: this.config.exteriorThickness,
        geometry: { start, end },
        length: distance(start, end),
        structuralLoad: true,
        adjacentRooms: []
      });
    }

    return walls;
  }

  /**
   * Calculate building perimeter (supports L-shaped and complex geometries)
   */
  private calculateBuildingPerimeter(rooms: PlacedRoom[]): Point2D[] {
    // Find all room corners
    const corners: Point2D[] = [];
    for (const room of rooms) {
      corners.push(
        { x: room.x, y: room.y },
        { x: room.x + room.width, y: room.y },
        { x: room.x + room.width, y: room.y + room.height },
        { x: room.x, y: room.y + room.height }
      );
    }

    // Calculate convex hull (simplified approach for rectangular rooms)
    // For now, return bounding box corners
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const room of rooms) {
      minX = Math.min(minX, room.x);
      minY = Math.min(minY, room.y);
      maxX = Math.max(maxX, room.x + room.width);
      maxY = Math.max(maxY, room.y + room.height);
    }

    const margin = 0.1;
    return [
      { x: minX - margin, y: minY - margin },
      { x: maxX + margin, y: minY - margin },
      { x: maxX + margin, y: maxY + margin },
      { x: minX - margin, y: maxY + margin }
    ];
  }

  /**
   * Generate enhanced interior walls with L-shape room support
   */
  private generateEnhancedInteriorWalls(rooms: PlacedRoom[]): Wall[] {
    const walls: Wall[] = [];
    const wallSegments: WallSegment[] = [];

    // Generate all potential wall segments
    for (let i = 0; i < rooms.length; i++) {
      for (let j = i + 1; j < rooms.length; j++) {
        const room1 = rooms[i];
        const room2 = rooms[j];

        const segments = this.findSharedWallSegments(room1, room2);
        wallSegments.push(...segments);
      }
    }

    // Convert segments to walls
    for (const segment of wallSegments) {
      walls.push({
        id: generateId('wall_int'),
        type: segment.type,
        thickness: this.config.interiorThickness,
        geometry: {
          start: segment.start,
          end: segment.end
        },
        length: distance(segment.start, segment.end),
        structuralLoad: false,
        adjacentRooms: segment.adjacentRooms
      });
    }

    // Add partition walls for rooms without full enclosure
    const partitions = this.generatePartitionWalls(rooms, wallSegments);
    walls.push(...partitions);

    return walls;
  }

  /**
   * Find shared wall segments between two rooms
   */
  private findSharedWallSegments(
    room1: PlacedRoom,
    room2: PlacedRoom
  ): WallSegment[] {
    const segments: WallSegment[] = [];
    const tolerance = 0.15;

    // Check vertical shared walls (side by side)
    const verticalShared = this.checkVerticalSharing(room1, room2, tolerance);
    if (verticalShared) {
      segments.push({
        start: verticalShared.start,
        end: verticalShared.end,
        type: 'interior',
        adjacentRooms: [room1.id, room2.id]
      });
    }

    // Check horizontal shared walls (above/below)
    const horizontalShared = this.checkHorizontalSharing(room1, room2, tolerance);
    if (horizontalShared) {
      segments.push({
        start: horizontalShared.start,
        end: horizontalShared.end,
        type: 'interior',
        adjacentRooms: [room1.id, room2.id]
      });
    }

    return segments;
  }

  /**
   * Check for vertical wall sharing
   */
  private checkVerticalSharing(
    room1: PlacedRoom,
    room2: PlacedRoom,
    tolerance: number
  ): { start: Point2D; end: Point2D } | null {
    // Room1 right edge touches room2 left edge
    if (Math.abs(room1.x + room1.width - room2.x) < tolerance) {
      const yStart = Math.max(room1.y, room2.y);
      const yEnd = Math.min(room1.y + room1.height, room2.y + room2.height);
      
      if (yEnd - yStart > this.config.minLength) {
        const wallX = room1.x + room1.width;
        return {
          start: { x: wallX, y: yStart },
          end: { x: wallX, y: yEnd }
        };
      }
    }

    // Room2 right edge touches room1 left edge
    if (Math.abs(room2.x + room2.width - room1.x) < tolerance) {
      const yStart = Math.max(room1.y, room2.y);
      const yEnd = Math.min(room1.y + room1.height, room2.y + room2.height);
      
      if (yEnd - yStart > this.config.minLength) {
        const wallX = room2.x + room2.width;
        return {
          start: { x: wallX, y: yStart },
          end: { x: wallX, y: yEnd }
        };
      }
    }

    return null;
  }

  /**
   * Check for horizontal wall sharing
   */
  private checkHorizontalSharing(
    room1: PlacedRoom,
    room2: PlacedRoom,
    tolerance: number
  ): { start: Point2D; end: Point2D } | null {
    // Room1 bottom edge touches room2 top edge
    if (Math.abs(room1.y + room1.height - room2.y) < tolerance) {
      const xStart = Math.max(room1.x, room2.x);
      const xEnd = Math.min(room1.x + room1.width, room2.x + room2.width);
      
      if (xEnd - xStart > this.config.minLength) {
        const wallY = room1.y + room1.height;
        return {
          start: { x: xStart, y: wallY },
          end: { x: xEnd, y: wallY }
        };
      }
    }

    // Room2 bottom edge touches room1 top edge
    if (Math.abs(room2.y + room2.height - room1.y) < tolerance) {
      const xStart = Math.max(room1.x, room2.x);
      const xEnd = Math.min(room1.x + room1.width, room2.x + room2.width);
      
      if (xEnd - xStart > this.config.minLength) {
        const wallY = room2.y + room2.height;
        return {
          start: { x: xStart, y: wallY },
          end: { x: xEnd, y: wallY }
        };
      }
    }

    return null;
  }

  /**
   * Generate partition walls for room enclosure
   */
  private generatePartitionWalls(
    rooms: PlacedRoom[],
    existingSegments: WallSegment[]
  ): Wall[] {
    const walls: Wall[] = [];

    for (const room of rooms) {
      const roomEdges = this.getRoomEdges(room);

      for (const edge of roomEdges) {
        // Check if this edge is already covered by shared walls
        const isCovered = this.isEdgeCovered(edge, existingSegments);

        if (!isCovered) {
          // Add partition wall
          walls.push({
            id: generateId('wall_partition'),
            type: 'interior',
            thickness: this.config.interiorThickness,
            geometry: {
              start: edge.start,
              end: edge.end
            },
            length: distance(edge.start, edge.end),
            structuralLoad: false,
            adjacentRooms: [room.id]
          });
        }
      }
    }

    return walls;
  }

  /**
   * Get all edges of a room
   */
  private getRoomEdges(room: PlacedRoom): Array<{ start: Point2D; end: Point2D }> {
    return [
      // Bottom edge
      {
        start: { x: room.x, y: room.y },
        end: { x: room.x + room.width, y: room.y }
      },
      // Right edge
      {
        start: { x: room.x + room.width, y: room.y },
        end: { x: room.x + room.width, y: room.y + room.height }
      },
      // Top edge
      {
        start: { x: room.x + room.width, y: room.y + room.height },
        end: { x: room.x, y: room.y + room.height }
      },
      // Left edge
      {
        start: { x: room.x, y: room.y + room.height },
        end: { x: room.x, y: room.y }
      }
    ];
  }

  /**
   * Check if edge is covered by existing wall segments
   */
  private isEdgeCovered(
    edge: { start: Point2D; end: Point2D },
    segments: WallSegment[]
  ): boolean {
    const tolerance = 0.2;

    for (const segment of segments) {
      // Check if segment overlaps with edge
      const isCollinear = this.areCollinear(
        edge.start,
        edge.end,
        segment.start,
        segment.end,
        tolerance
      );

      if (isCollinear) {
        const overlap = this.calculateOverlap(edge, segment);
        if (overlap > 0.8 * distance(edge.start, edge.end)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if two line segments are collinear
   */
  private areCollinear(
    p1: Point2D,
    p2: Point2D,
    p3: Point2D,
    p4: Point2D,
    tolerance: number
  ): boolean {
    // Horizontal lines
    if (Math.abs(p1.y - p2.y) < tolerance && Math.abs(p3.y - p4.y) < tolerance) {
      return Math.abs(p1.y - p3.y) < tolerance;
    }

    // Vertical lines
    if (Math.abs(p1.x - p2.x) < tolerance && Math.abs(p3.x - p4.x) < tolerance) {
      return Math.abs(p1.x - p3.x) < tolerance;
    }

    return false;
  }

  /**
   * Calculate overlap length between two segments
   */
  private calculateOverlap(
    edge: { start: Point2D; end: Point2D },
    segment: WallSegment
  ): number {
    // Horizontal overlap
    if (Math.abs(edge.start.y - edge.end.y) < 0.1) {
      const minX1 = Math.min(edge.start.x, edge.end.x);
      const maxX1 = Math.max(edge.start.x, edge.end.x);
      const minX2 = Math.min(segment.start.x, segment.end.x);
      const maxX2 = Math.max(segment.start.x, segment.end.x);

      const overlapStart = Math.max(minX1, minX2);
      const overlapEnd = Math.min(maxX1, maxX2);

      return Math.max(0, overlapEnd - overlapStart);
    }

    // Vertical overlap
    const minY1 = Math.min(edge.start.y, edge.end.y);
    const maxY1 = Math.max(edge.start.y, edge.end.y);
    const minY2 = Math.min(segment.start.y, segment.end.y);
    const maxY2 = Math.max(segment.start.y, segment.end.y);

    const overlapStart = Math.max(minY1, minY2);
    const overlapEnd = Math.min(maxY1, maxY2);

    return Math.max(0, overlapEnd - overlapStart);
  }

  /**
   * Intelligent wall merging (collinear and connected segments)
   */
  private intelligentWallMerging(walls: Wall[]): Wall[] {
    const merged: Wall[] = [];
    const used = new Set<number>();

    for (let i = 0; i < walls.length; i++) {
      if (used.has(i)) continue;

      let currentWall = walls[i];
      let hasChanges = true;

      // Iteratively merge
      while (hasChanges) {
        hasChanges = false;

        for (let j = 0; j < walls.length; j++) {
          if (i === j || used.has(j)) continue;

          const mergedWall = this.tryMergeWalls(currentWall, walls[j]);
          if (mergedWall) {
            currentWall = mergedWall;
            used.add(j);
            hasChanges = true;
          }
        }
      }

      used.add(i);
      merged.push(currentWall);
    }

    return merged;
  }

  /**
   * Try to merge two walls
   */
  private tryMergeWalls(wall1: Wall, wall2: Wall): Wall | null {
    if (wall1.type !== wall2.type) return null;

    const tolerance = 0.15;

    // Horizontal walls
    if (this.areCollinear(
      wall1.geometry.start,
      wall1.geometry.end,
      wall2.geometry.start,
      wall2.geometry.end,
      tolerance
    )) {
      // Check if connected
      const connected = this.areConnected(wall1, wall2, tolerance);

      if (connected) {
        // Merge
        const allPoints = [
          wall1.geometry.start,
          wall1.geometry.end,
          wall2.geometry.start,
          wall2.geometry.end
        ];

        // Find extremes
        const isHorizontal = Math.abs(wall1.geometry.start.y - wall1.geometry.end.y) < tolerance;

        let start: Point2D, end: Point2D;
        if (isHorizontal) {
          const minX = Math.min(...allPoints.map(p => p.x));
          const maxX = Math.max(...allPoints.map(p => p.x));
          const avgY = (wall1.geometry.start.y + wall2.geometry.start.y) / 2;
          start = { x: minX, y: avgY };
          end = { x: maxX, y: avgY };
        } else {
          const minY = Math.min(...allPoints.map(p => p.y));
          const maxY = Math.max(...allPoints.map(p => p.y));
          const avgX = (wall1.geometry.start.x + wall2.geometry.start.x) / 2;
          start = { x: avgX, y: minY };
          end = { x: avgX, y: maxY };
        }

        return {
          id: generateId('wall_merged'),
          type: wall1.type,
          thickness: wall1.thickness,
          geometry: { start, end },
          length: distance(start, end),
          structuralLoad: wall1.structuralLoad || wall2.structuralLoad,
          adjacentRooms: Array.from(new Set([...wall1.adjacentRooms, ...wall2.adjacentRooms]))
        };
      }
    }

    return null;
  }

  /**
   * Check if two walls are connected
   */
  private areConnected(wall1: Wall, wall2: Wall, tolerance: number): boolean {
    const endpoints = [
      wall1.geometry.start,
      wall1.geometry.end,
      wall2.geometry.start,
      wall2.geometry.end
    ];

    // Check if any endpoints are close
    for (let i = 0; i < 2; i++) {
      for (let j = 2; j < 4; j++) {
        if (distance(endpoints[i], endpoints[j]) < tolerance) {
          return true;
        }
      }
    }

    return false;
  }
}

export const enhancedWallSynthesizer = new EnhancedWallSynthesizer();
