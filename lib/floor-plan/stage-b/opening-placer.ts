/**
 * Stage B: Opening Placer
 * Places doors and windows on walls
 */

import { Wall, Opening, Point2D, FloorPlanSpecification, RoomSpec } from '../types';
import { DEFAULT_CONFIG } from '../config';
import { distance, generateId, pointOnWall } from '../utils';

interface RoomBounds {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  spec: RoomSpec;
}

export class OpeningPlacer {
  private config = DEFAULT_CONFIG.stageB.openings;

  /**
   * Place doors and windows on walls
   */
  placeOpenings(
    rooms: RoomBounds[],
    walls: Wall[],
    spec: FloorPlanSpecification
  ): Opening[] {
    const openings: Opening[] = [];

    // Step 1: Place entry door
    const entryDoor = this.placeEntryDoor(walls, spec);
    if (entryDoor) openings.push(entryDoor);

    // Step 2: Place interior doors
    const interiorDoors = this.placeInteriorDoors(rooms, walls, spec);
    openings.push(...interiorDoors);

    // Step 3: Place windows
    const windows = this.placeWindows(rooms, walls);
    openings.push(...windows);

    return openings;
  }

  /**
   * Place main entry door
   */
  private placeEntryDoor(walls: Wall[], spec: FloorPlanSpecification): Opening | null {
    const entrance = spec.metadata?.entrance || 'north';
    
    // Find appropriate exterior wall
    const exteriorWalls = walls.filter(w => w.type === 'exterior');
    if (exteriorWalls.length === 0) return null;

    // Select wall based on entrance direction
    let targetWall: Wall | null = null;
    
    for (const wall of exteriorWalls) {
      const isHorizontal = Math.abs(wall.geometry.start.y - wall.geometry.end.y) < 0.1;
      const isVertical = Math.abs(wall.geometry.start.x - wall.geometry.end.x) < 0.1;

      if (entrance === 'north' && isHorizontal && wall.geometry.start.y < 5) {
        targetWall = wall;
        break;
      } else if (entrance === 'south' && isHorizontal && wall.geometry.start.y > 5) {
        targetWall = wall;
        break;
      } else if (entrance === 'east' && isVertical && wall.geometry.start.x > 5) {
        targetWall = wall;
        break;
      } else if (entrance === 'west' && isVertical && wall.geometry.start.x < 5) {
        targetWall = wall;
        break;
      }
    }

    // Fallback: use first exterior wall
    if (!targetWall) targetWall = exteriorWalls[0];

    // Check if wall is long enough
    if (targetWall.length < this.config.doorWidth.entrance + 2 * this.config.minClearance) {
      return null;
    }

    return {
      id: generateId('door_entry'),
      type: 'door',
      width: this.config.doorWidth.entrance,
      wallId: targetWall.id,
      position: 0.5, // Center of wall
      properties: {
        swingDirection: 90,
        isEntry: true
      }
    };
  }

  /**
   * Place interior doors between rooms
   */
  private placeInteriorDoors(
    rooms: RoomBounds[],
    walls: Wall[],
    spec: FloorPlanSpecification
  ): Opening[] {
    const doors: Opening[] = [];
    const processedWalls = new Set<string>();

    // Place doors based on adjacency graph
    for (const edge of spec.adjacencyGraph) {
      const room1 = rooms.find(r => r.id === edge.from);
      const room2 = rooms.find(r => r.id === edge.to);
      
      if (!room1 || !room2) continue;

      // Find shared wall
      const sharedWall = walls.find(w => 
        w.adjacentRooms.includes(room1.id) && 
        w.adjacentRooms.includes(room2.id)
      );

      if (sharedWall && !processedWalls.has(sharedWall.id)) {
        // Check if wall is long enough for door
        if (sharedWall.length >= this.config.doorWidth.standard + 2 * this.config.minClearance) {
          doors.push({
            id: generateId('door'),
            type: 'door',
            width: this.config.doorWidth.standard,
            wallId: sharedWall.id,
            position: 0.5, // Center
            properties: {
              swingDirection: this.calculateSwingDirection(room1, room2, sharedWall)
            }
          });
          processedWalls.add(sharedWall.id);
        }
      }
    }

    // Place doors for rooms without adjacency connections
    for (const room of rooms) {
      if (room.spec.requiresDoor) {
        // Check if room already has a door
        const hasDoor = doors.some(d => {
          const wall = walls.find(w => w.id === d.wallId);
          return wall?.adjacentRooms.includes(room.id);
        });

        if (!hasDoor) {
          // Find a suitable wall for this room
          const roomWalls = walls.filter(w => 
            w.adjacentRooms.includes(room.id) && 
            !processedWalls.has(w.id)
          );

          for (const wall of roomWalls) {
            if (wall.length >= this.config.doorWidth.standard + 2 * this.config.minClearance) {
              doors.push({
                id: generateId('door'),
                type: 'door',
                width: this.config.doorWidth.standard,
                wallId: wall.id,
                position: 0.5,
                properties: {
                  swingDirection: 90
                }
              });
              processedWalls.add(wall.id);
              break;
            }
          }
        }
      }
    }

    return doors;
  }

  /**
   * Calculate door swing direction
   */
  private calculateSwingDirection(
    room1: RoomBounds,
    room2: RoomBounds,
    wall: Wall
  ): number {
    // Swing into the private room, or away from hallway
    const room1IsHallway = room1.spec.type === 'hallway';
    const room2IsHallway = room2.spec.type === 'hallway';
    
    if (room1IsHallway && !room2IsHallway) return 270; // Swing into room2
    if (room2IsHallway && !room1IsHallway) return 90;  // Swing into room1
    
    // Default
    return 90;
  }

  /**
   * Place windows on exterior walls
   */
  private placeWindows(rooms: RoomBounds[], walls: Wall[]): Opening[] {
    const windows: Opening[] = [];
    const exteriorWalls = walls.filter(w => w.type === 'exterior');

    for (const room of rooms) {
      if (!room.spec.requiresWindow) continue;

      // Find exterior walls for this room
      const roomExteriorWalls = exteriorWalls.filter(w => 
        this.isWallOnRoomPerimeter(w, room)
      );

      // Place windows on longest wall
      if (roomExteriorWalls.length > 0) {
        const longestWall = roomExteriorWalls.reduce((prev, current) => 
          current.length > prev.length ? current : prev
        );

        // Calculate window size (percentage of wall length)
        const windowWidth = longestWall.length * this.config.windowSizePercent.default;
        
        if (windowWidth >= 0.5 && windowWidth <= longestWall.length * 0.8) {
          // Place one or two windows depending on wall length
          const numWindows = longestWall.length > 4 ? 2 : 1;
          
          for (let i = 0; i < numWindows; i++) {
            const position = numWindows === 1 ? 0.5 : (i === 0 ? 0.33 : 0.67);
            
            windows.push({
              id: generateId('window'),
              type: 'window',
              width: windowWidth / numWindows,
              height: 1.5, // Standard window height
              wallId: longestWall.id,
              position,
              properties: {
                sillHeight: 0.9 // Standard sill height
              }
            });
          }
        }
      }
    }

    return windows;
  }

  /**
   * Check if wall is on room perimeter
   */
  private isWallOnRoomPerimeter(wall: Wall, room: RoomBounds): boolean {
    const tolerance = 0.2;
    const { start, end } = wall.geometry;
    
    // Check if wall endpoints are near room boundaries
    const onLeftEdge = Math.abs(start.x - room.x) < tolerance || Math.abs(end.x - room.x) < tolerance;
    const onRightEdge = Math.abs(start.x - (room.x + room.width)) < tolerance || 
                        Math.abs(end.x - (room.x + room.width)) < tolerance;
    const onTopEdge = Math.abs(start.y - room.y) < tolerance || Math.abs(end.y - room.y) < tolerance;
    const onBottomEdge = Math.abs(start.y - (room.y + room.height)) < tolerance || 
                         Math.abs(end.y - (room.y + room.height)) < tolerance;
    
    // Check if wall is within room Y bounds (for vertical walls)
    const withinYBounds = (start.y >= room.y - tolerance && start.y <= room.y + room.height + tolerance) ||
                          (end.y >= room.y - tolerance && end.y <= room.y + room.height + tolerance);
    
    // Check if wall is within room X bounds (for horizontal walls)
    const withinXBounds = (start.x >= room.x - tolerance && start.x <= room.x + room.width + tolerance) ||
                          (end.x >= room.x - tolerance && end.x <= room.x + room.width + tolerance);
    
    return (onLeftEdge || onRightEdge) && withinYBounds || 
           (onTopEdge || onBottomEdge) && withinXBounds;
  }

  /**
   * Validate opening placement
   */
  validateOpenings(openings: Opening[], walls: Wall[]): boolean {
    for (const opening of openings) {
      const wall = walls.find(w => w.id === opening.wallId);
      if (!wall) return false;

      // Check if opening fits on wall
      const minRequired = opening.width + 2 * this.config.minClearance;
      if (wall.length < minRequired) return false;

      // Check position is valid (0-1)
      if (opening.position < 0 || opening.position > 1) return false;
    }

    return true;
  }
}
