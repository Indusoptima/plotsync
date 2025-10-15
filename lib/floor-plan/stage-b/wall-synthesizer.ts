/**
 * Stage B: Wall Synthesizer
 * Generates wall geometry from room placements
 */

import { Wall, Point2D, FloorPlanError } from '../types';
import { DEFAULT_CONFIG } from '../config';
import { distance, generateId } from '../utils';

interface RoomBounds {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export class WallSynthesizer {
  private config = DEFAULT_CONFIG.stageB.walls;

  /**
   * Generate walls from room placements
   */
  synthesize(rooms: RoomBounds[]): Wall[] {
    const walls: Wall[] = [];

    // Step 1: Generate building envelope (exterior walls)
    const envelope = this.generateEnvelope(rooms);
    walls.push(...envelope);

    // Step 2: Generate interior walls (shared and partition)
    const interior = this.generateInteriorWalls(rooms);
    walls.push(...interior);

    // Step 3: Simplify walls (merge collinear segments)
    const simplified = this.simplifyWalls(walls);

    return simplified;
  }

  /**
   * Generate building envelope (exterior walls)
   */
  private generateEnvelope(rooms: RoomBounds[]): Wall[] {
    if (rooms.length === 0) return [];

    // Find bounding box of all rooms
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const room of rooms) {
      minX = Math.min(minX, room.x);
      minY = Math.min(minY, room.y);
      maxX = Math.max(maxX, room.x + room.width);
      maxY = Math.max(maxY, room.y + room.height);
    }

    // Add small margin
    const margin = 0.1;
    minX -= margin;
    minY -= margin;
    maxX += margin;
    maxY += margin;

    // Create four exterior walls
    const walls: Wall[] = [
      // Bottom wall
      {
        id: generateId('wall_ext'),
        type: 'exterior',
        thickness: this.config.exteriorThickness,
        geometry: {
          start: { x: minX, y: minY },
          end: { x: maxX, y: minY }
        },
        length: maxX - minX,
        structuralLoad: true,
        adjacentRooms: []
      },
      // Right wall
      {
        id: generateId('wall_ext'),
        type: 'exterior',
        thickness: this.config.exteriorThickness,
        geometry: {
          start: { x: maxX, y: minY },
          end: { x: maxX, y: maxY }
        },
        length: maxY - minY,
        structuralLoad: true,
        adjacentRooms: []
      },
      // Top wall
      {
        id: generateId('wall_ext'),
        type: 'exterior',
        thickness: this.config.exteriorThickness,
        geometry: {
          start: { x: maxX, y: maxY },
          end: { x: minX, y: maxY }
        },
        length: maxX - minX,
        structuralLoad: true,
        adjacentRooms: []
      },
      // Left wall
      {
        id: generateId('wall_ext'),
        type: 'exterior',
        thickness: this.config.exteriorThickness,
        geometry: {
          start: { x: minX, y: maxY },
          end: { x: minX, y: minY }
        },
        length: maxY - minY,
        structuralLoad: true,
        adjacentRooms: []
      }
    ];

    return walls;
  }

  /**
   * Generate interior walls
   */
  private generateInteriorWalls(rooms: RoomBounds[]): Wall[] {
    const walls: Wall[] = [];
    const processedPairs = new Set<string>();

    // Check each pair of rooms for shared boundaries
    for (let i = 0; i < rooms.length; i++) {
      for (let j = i + 1; j < rooms.length; j++) {
        const room1 = rooms[i];
        const room2 = rooms[j];
        const pairKey = `${i}-${j}`;

        if (processedPairs.has(pairKey)) continue;
        processedPairs.add(pairKey);

        // Check for shared walls
        const sharedWalls = this.findSharedWalls(room1, room2);
        walls.push(...sharedWalls);
      }
    }

    return walls;
  }

  /**
   * Find shared walls between two rooms
   */
  private findSharedWalls(room1: RoomBounds, room2: RoomBounds): Wall[] {
    const walls: Wall[] = [];
    const tolerance = 0.1;

    // Check vertical shared wall (rooms side by side)
    if (Math.abs(room1.x + room1.width - room2.x) < tolerance ||
        Math.abs(room2.x + room2.width - room1.x) < tolerance) {
      
      // Check for Y overlap
      const y1Start = Math.max(room1.y, room2.y);
      const y1End = Math.min(room1.y + room1.height, room2.y + room2.height);
      
      if (y1End - y1Start > this.config.minLength) {
        const wallX = Math.abs(room1.x + room1.width - room2.x) < tolerance
          ? room1.x + room1.width
          : room2.x + room2.width;

        walls.push({
          id: generateId('wall_int'),
          type: 'interior',
          thickness: this.config.interiorThickness,
          geometry: {
            start: { x: wallX, y: y1Start },
            end: { x: wallX, y: y1End }
          },
          length: y1End - y1Start,
          structuralLoad: false,
          adjacentRooms: [room1.id, room2.id]
        });
      }
    }

    // Check horizontal shared wall (rooms above/below)
    if (Math.abs(room1.y + room1.height - room2.y) < tolerance ||
        Math.abs(room2.y + room2.height - room1.y) < tolerance) {
      
      // Check for X overlap
      const x1Start = Math.max(room1.x, room2.x);
      const x1End = Math.min(room1.x + room1.width, room2.x + room2.width);
      
      if (x1End - x1Start > this.config.minLength) {
        const wallY = Math.abs(room1.y + room1.height - room2.y) < tolerance
          ? room1.y + room1.height
          : room2.y + room2.height;

        walls.push({
          id: generateId('wall_int'),
          type: 'interior',
          thickness: this.config.interiorThickness,
          geometry: {
            start: { x: x1Start, y: wallY },
            end: { x: x1End, y: wallY }
          },
          length: x1End - x1Start,
          structuralLoad: false,
          adjacentRooms: [room1.id, room2.id]
        });
      }
    }

    return walls;
  }

  /**
   * Simplify walls by merging collinear segments
   */
  private simplifyWalls(walls: Wall[]): Wall[] {
    const simplified: Wall[] = [];
    const used = new Set<number>();

    for (let i = 0; i < walls.length; i++) {
      if (used.has(i)) continue;

      let currentWall = walls[i];
      let merged = true;

      // Try to merge with other walls
      while (merged) {
        merged = false;
        
        for (let j = 0; j < walls.length; j++) {
          if (i === j || used.has(j)) continue;

          const other = walls[j];
          const mergedWall = this.tryMergeWalls(currentWall, other);
          
          if (mergedWall) {
            currentWall = mergedWall;
            used.add(j);
            merged = true;
          }
        }
      }

      used.add(i);
      simplified.push(currentWall);
    }

    return simplified;
  }

  /**
   * Try to merge two walls if they are collinear and connected
   */
  private tryMergeWalls(wall1: Wall, wall2: Wall): Wall | null {
    // Must be same type
    if (wall1.type !== wall2.type) return null;

    const tolerance = 0.1;

    // Check if walls are collinear and connected
    // Horizontal walls
    if (Math.abs(wall1.geometry.start.y - wall1.geometry.end.y) < tolerance &&
        Math.abs(wall2.geometry.start.y - wall2.geometry.end.y) < tolerance &&
        Math.abs(wall1.geometry.start.y - wall2.geometry.start.y) < tolerance) {
      
      // Check if connected
      if (Math.abs(wall1.geometry.end.x - wall2.geometry.start.x) < tolerance) {
        return {
          ...wall1,
          id: generateId('wall_merged'),
          geometry: {
            start: wall1.geometry.start,
            end: wall2.geometry.end
          },
          length: distance(wall1.geometry.start, wall2.geometry.end),
          adjacentRooms: Array.from(new Set([...wall1.adjacentRooms, ...wall2.adjacentRooms]))
        };
      }
    }

    // Vertical walls
    if (Math.abs(wall1.geometry.start.x - wall1.geometry.end.x) < tolerance &&
        Math.abs(wall2.geometry.start.x - wall2.geometry.end.x) < tolerance &&
        Math.abs(wall1.geometry.start.x - wall2.geometry.start.x) < tolerance) {
      
      // Check if connected
      if (Math.abs(wall1.geometry.end.y - wall2.geometry.start.y) < tolerance) {
        return {
          ...wall1,
          id: generateId('wall_merged'),
          geometry: {
            start: wall1.geometry.start,
            end: wall2.geometry.end
          },
          length: distance(wall1.geometry.start, wall2.geometry.end),
          adjacentRooms: Array.from(new Set([...wall1.adjacentRooms, ...wall2.adjacentRooms]))
        };
      }
    }

    return null;
  }

  /**
   * Get wall segments for a specific room
   */
  getRoomWalls(roomId: string, allWalls: Wall[]): Wall[] {
    return allWalls.filter(wall => wall.adjacentRooms.includes(roomId));
  }
}
