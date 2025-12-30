/**
 * Circulation-Aware Opening Placer
 * Intelligent placement of doors and windows based on circulation patterns and accessibility
 */

import { Wall, Opening, FloorPlanSpecification, RoomSpec } from '../types';
import { DEFAULT_CONFIG } from '../config';
import { distance, generateId } from '../utils';
import { PlacedRoom } from './zone-based-placer';
import { determineEntranceStrategy } from '../stage-a/architectural-rules';

interface CirculationNode {
  roomId: string;
  isHub: boolean; // Central circulation space (hallway, foyer)
  connections: string[]; // Connected room IDs
}

export class CirculationAwareOpeningPlacer {
  private config = DEFAULT_CONFIG.stageB.openings;

  /**
   * Place openings with circulation awareness
   */
  placeOpenings(
    rooms: PlacedRoom[],
    walls: Wall[],
    spec: FloorPlanSpecification
  ): Opening[] {
    const openings: Opening[] = [];

    // Step 1: Analyze circulation pattern
    const circulationGraph = this.buildCirculationGraph(rooms, spec);

    // Step 2: Determine entrance strategy
    const entranceStrategy = determineEntranceStrategy(
      spec.totalArea,
      spec.rooms.map(r => r.type),
      this.classifyTypology(spec.totalArea, spec.rooms.length)
    );

    // Step 3: Place main entrance door
    const entryDoor = this.placeEntranceDoor(
      rooms,
      walls,
      entranceStrategy,
      circulationGraph
    );
    if (entryDoor) openings.push(entryDoor);

    // Step 4: Place interior doors based on circulation
    const interiorDoors = this.placeCirculationDoors(
      rooms,
      walls,
      spec,
      circulationGraph
    );
    openings.push(...interiorDoors);

    // Step 5: Place windows on exterior walls
    const windows = this.placeStrategicWindows(rooms, walls);
    openings.push(...windows);

    return openings;
  }

  /**
   * Build circulation graph from room layout
   */
  private buildCirculationGraph(
    rooms: PlacedRoom[],
    spec: FloorPlanSpecification
  ): Map<string, CirculationNode> {
    const graph = new Map<string, CirculationNode>();

    // Initialize nodes
    for (const room of rooms) {
      const isHub = this.isCirculationHub(room.spec.type);
      graph.set(room.id, {
        roomId: room.id,
        isHub,
        connections: []
      });
    }

    // Build connections from adjacency graph
    for (const edge of spec.adjacencyGraph) {
      const node1 = graph.get(edge.from);
      const node2 = graph.get(edge.to);

      if (node1 && node2) {
        if (!node1.connections.includes(edge.to)) {
          node1.connections.push(edge.to);
        }
        if (!node2.connections.includes(edge.from)) {
          node2.connections.push(edge.from);
        }
      }
    }

    return graph;
  }

  /**
   * Check if room type is a circulation hub
   */
  private isCirculationHub(roomType: string): boolean {
    return ['hallway', 'foyer', 'living'].includes(roomType);
  }

  /**
   * Place entrance door with strategy
   */
  private placeEntranceDoor(
    rooms: PlacedRoom[],
    walls: Wall[],
    entranceStrategy: any,
    circulationGraph: Map<string, CirculationNode>
  ): Opening | null {
    const exteriorWalls = walls.filter(w => w.type === 'exterior');
    if (exteriorWalls.length === 0) return null;

    // Find entrance location wall
    const entranceWall = this.findEntranceWall(
      exteriorWalls,
      entranceStrategy.location
    );

    if (!entranceWall) return null;

    // Find preferred adjacent room
    const preferredRoom = this.findPreferredEntranceRoom(
      rooms,
      entranceStrategy.preferredAdjacentRooms,
      entranceWall
    );

    // Calculate door position
    let position = 0.5; // Default center

    if (preferredRoom) {
      // Place door aligned with preferred room
      position = this.calculateOptimalDoorPosition(
        entranceWall,
        preferredRoom
      );
    }

    return {
      id: generateId('door_entry'),
      type: 'door',
      width: this.config.doorWidth.entrance,
      wallId: entranceWall.id,
      position,
      properties: {
        swingDirection: 90,
        isEntry: true,
        clearance: entranceStrategy.clearanceRequired
      }
    };
  }

  /**
   * Find entrance wall based on location
   */
  private findEntranceWall(
    exteriorWalls: Wall[],
    location: 'north' | 'south' | 'east' | 'west'
  ): Wall | null {
    for (const wall of exteriorWalls) {
      const isHorizontal = Math.abs(wall.geometry.start.y - wall.geometry.end.y) < 0.1;
      const isVertical = Math.abs(wall.geometry.start.x - wall.geometry.end.x) < 0.1;

      const avgY = (wall.geometry.start.y + wall.geometry.end.y) / 2;
      const avgX = (wall.geometry.start.x + wall.geometry.end.x) / 2;

      // Match location
      if (location === 'south' && isHorizontal && avgY < 5) {
        return wall;
      } else if (location === 'north' && isHorizontal && avgY > 5) {
        return wall;
      } else if (location === 'east' && isVertical && avgX > 5) {
        return wall;
      } else if (location === 'west' && isVertical && avgX < 5) {
        return wall;
      }
    }

    // Fallback: longest exterior wall
    return exteriorWalls.reduce((longest, wall) => 
      wall.length > longest.length ? wall : longest
    );
  }

  /**
   * Find preferred room for entrance adjacency
   */
  private findPreferredEntranceRoom(
    rooms: PlacedRoom[],
    preferredTypes: string[],
    entranceWall: Wall
  ): PlacedRoom | null {
    for (const roomType of preferredTypes) {
      const room = rooms.find(r => 
        r.spec.type === roomType &&
        this.isRoomAdjacentToWall(r, entranceWall)
      );
      if (room) return room;
    }

    return null;
  }

  /**
   * Check if room is adjacent to wall
   */
  private isRoomAdjacentToWall(room: PlacedRoom, wall: Wall): boolean {
    const tolerance = 0.3;
    const { start, end } = wall.geometry;

    // Check if any room edge aligns with wall
    const roomEdges = [
      { x1: room.x, y1: room.y, x2: room.x + room.width, y2: room.y }, // bottom
      { x1: room.x + room.width, y1: room.y, x2: room.x + room.width, y2: room.y + room.height }, // right
      { x1: room.x + room.width, y1: room.y + room.height, x2: room.x, y2: room.y + room.height }, // top
      { x1: room.x, y1: room.y + room.height, x2: room.x, y2: room.y } // left
    ];

    for (const edge of roomEdges) {
      if (this.doSegmentsOverlap(
        { x: edge.x1, y: edge.y1 },
        { x: edge.x2, y: edge.y2 },
        start,
        end,
        tolerance
      )) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if two segments overlap
   */
  private doSegmentsOverlap(
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number },
    p4: { x: number; y: number },
    tolerance: number
  ): boolean {
    // Horizontal segments
    if (Math.abs(p1.y - p2.y) < tolerance && Math.abs(p3.y - p4.y) < tolerance) {
      if (Math.abs(p1.y - p3.y) < tolerance) {
        const minX1 = Math.min(p1.x, p2.x);
        const maxX1 = Math.max(p1.x, p2.x);
        const minX2 = Math.min(p3.x, p4.x);
        const maxX2 = Math.max(p3.x, p4.x);
        return !(maxX1 < minX2 || maxX2 < minX1);
      }
    }

    // Vertical segments
    if (Math.abs(p1.x - p2.x) < tolerance && Math.abs(p3.x - p4.x) < tolerance) {
      if (Math.abs(p1.x - p3.x) < tolerance) {
        const minY1 = Math.min(p1.y, p2.y);
        const maxY1 = Math.max(p1.y, p2.y);
        const minY2 = Math.min(p3.y, p4.y);
        const maxY2 = Math.max(p3.y, p4.y);
        return !(maxY1 < minY2 || maxY2 < minY1);
      }
    }

    return false;
  }

  /**
   * Calculate optimal door position on wall
   */
  private calculateOptimalDoorPosition(
    wall: Wall,
    room: PlacedRoom
  ): number {
    const isHorizontal = Math.abs(wall.geometry.start.y - wall.geometry.end.y) < 0.1;

    if (isHorizontal) {
      const wallMinX = Math.min(wall.geometry.start.x, wall.geometry.end.x);
      const wallMaxX = Math.max(wall.geometry.start.x, wall.geometry.end.x);
      const roomCenterX = room.x + room.width / 2;

      // Clamp to wall bounds
      const targetX = Math.max(wallMinX + 0.5, Math.min(wallMaxX - 0.5, roomCenterX));
      const position = (targetX - wallMinX) / (wallMaxX - wallMinX);

      return Math.max(0.2, Math.min(0.8, position));
    } else {
      const wallMinY = Math.min(wall.geometry.start.y, wall.geometry.end.y);
      const wallMaxY = Math.max(wall.geometry.start.y, wall.geometry.end.y);
      const roomCenterY = room.y + room.height / 2;

      const targetY = Math.max(wallMinY + 0.5, Math.min(wallMaxY - 0.5, roomCenterY));
      const position = (targetY - wallMinY) / (wallMaxY - wallMinY);

      return Math.max(0.2, Math.min(0.8, position));
    }
  }

  /**
   * Place interior doors based on circulation graph
   */
  private placeCirculationDoors(
    rooms: PlacedRoom[],
    walls: Wall[],
    spec: FloorPlanSpecification,
    circulationGraph: Map<string, CirculationNode>
  ): Opening[] {
    const doors: Opening[] = [];
    const processedWalls = new Set<string>();

    // Prioritize circulation hub connections
    const hubRooms = rooms.filter(r => 
      circulationGraph.get(r.id)?.isHub
    );

    // Place doors from hubs to connected rooms
    for (const hubRoom of hubRooms) {
      const node = circulationGraph.get(hubRoom.id);
      if (!node) continue;

      for (const connectedId of node.connections) {
        const connectedRoom = rooms.find(r => r.id === connectedId);
        if (!connectedRoom) continue;

        const sharedWall = this.findSharedWall(hubRoom, connectedRoom, walls);

        if (sharedWall && !processedWalls.has(sharedWall.id)) {
          const doorWidth = this.selectDoorWidth(hubRoom.spec.type, connectedRoom.spec.type);

          if (sharedWall.length >= doorWidth + 2 * this.config.minClearance) {
            doors.push({
              id: generateId('door'),
              type: 'door',
              width: doorWidth,
              wallId: sharedWall.id,
              position: 0.5,
              properties: {
                swingDirection: this.calculateSwingDirection(hubRoom, connectedRoom)
              }
            });
            processedWalls.add(sharedWall.id);
          }
        }
      }
    }

    // Place remaining doors based on adjacency
    for (const edge of spec.adjacencyGraph) {
      const room1 = rooms.find(r => r.id === edge.from);
      const room2 = rooms.find(r => r.id === edge.to);

      if (!room1 || !room2) continue;

      const sharedWall = this.findSharedWall(room1, room2, walls);

      if (sharedWall && !processedWalls.has(sharedWall.id)) {
        const doorWidth = this.selectDoorWidth(room1.spec.type, room2.spec.type);

        if (sharedWall.length >= doorWidth + 2 * this.config.minClearance) {
          doors.push({
            id: generateId('door'),
            type: 'door',
            width: doorWidth,
            wallId: sharedWall.id,
            position: 0.5,
            properties: {
              swingDirection: this.calculateSwingDirection(room1, room2)
            }
          });
          processedWalls.add(sharedWall.id);
        }
      }
    }

    return doors;
  }

  /**
   * Find shared wall between two rooms
   */
  private findSharedWall(
    room1: PlacedRoom,
    room2: PlacedRoom,
    walls: Wall[]
  ): Wall | null {
    return walls.find(w =>
      w.adjacentRooms.includes(room1.id) &&
      w.adjacentRooms.includes(room2.id)
    ) || null;
  }

  /**
   * Select appropriate door width
   */
  private selectDoorWidth(roomType1: string, roomType2: string): number {
    // Wider doors for main circulation
    if (roomType1 === 'living' || roomType2 === 'living') {
      return this.config.doorWidth.wide || 1.0;
    }

    // Standard doors for most connections
    return this.config.doorWidth.standard;
  }

  /**
   * Calculate door swing direction
   */
  private calculateSwingDirection(
    room1: PlacedRoom,
    room2: PlacedRoom
  ): number {
    // Swing into private rooms, away from circulation
    if (this.isCirculationHub(room1.spec.type) && !this.isCirculationHub(room2.spec.type)) {
      return 270; // Swing into room2
    }
    if (this.isCirculationHub(room2.spec.type) && !this.isCirculationHub(room1.spec.type)) {
      return 90; // Swing into room1
    }

    return 90; // Default
  }

  /**
   * Place windows strategically on exterior walls
   */
  private placeStrategicWindows(
    rooms: PlacedRoom[],
    walls: Wall[]
  ): Opening[] {
    const windows: Opening[] = [];
    const exteriorWalls = walls.filter(w => w.type === 'exterior');

    for (const room of rooms) {
      if (!room.spec.requiresWindow) continue;

      // Find exterior walls for this room
      const roomExteriorWalls = exteriorWalls.filter(w =>
        this.isRoomAdjacentToWall(room, w)
      );

      if (roomExteriorWalls.length === 0) continue;

      // Sort walls by length (prefer longer walls)
      roomExteriorWalls.sort((a, b) => b.length - a.length);

      // Place windows on longest wall(s)
      const wallsToUse = roomExteriorWalls.slice(0, Math.min(2, roomExteriorWalls.length));

      for (const wall of wallsToUse) {
        const windowWidth = this.calculateWindowWidth(room, wall);

        if (windowWidth >= 0.6 && windowWidth <= wall.length * 0.7) {
          // Determine number of windows
          const numWindows = wall.length > 5 ? 2 : 1;

          for (let i = 0; i < numWindows; i++) {
            const position = numWindows === 1 ? 0.5 : (i === 0 ? 0.33 : 0.67);

            windows.push({
              id: generateId('window'),
              type: 'window',
              width: windowWidth / numWindows,
              height: 1.5,
              wallId: wall.id,
              position,
              properties: {
                sillHeight: 0.9
              }
            });
          }

          break; // One wall per room for now
        }
      }
    }

    return windows;
  }

  /**
   * Calculate appropriate window width for room
   */
  private calculateWindowWidth(room: PlacedRoom, wall: Wall): number {
    const roomArea = room.width * room.height;

    // Window area should be 10-20% of floor area
    const targetWindowArea = roomArea * 0.15;

    // Window height is typically 1.5m
    const windowHeight = 1.5;
    const calculatedWidth = targetWindowArea / windowHeight;

    // Limit to wall length
    return Math.min(calculatedWidth, wall.length * 0.6);
  }

  /**
   * Classify building typology
   */
  private classifyTypology(totalArea: number, roomCount: number): string {
    if (totalArea < 35) return 'studio';
    if (totalArea < 100 && roomCount <= 5) return 'apartment';
    if (totalArea < 200 && roomCount <= 8) return 'townhouse';
    if (totalArea < 400) return 'villa';
    return 'mansion';
  }
}

export const circulationAwareOpeningPlacer = new CirculationAwareOpeningPlacer();
