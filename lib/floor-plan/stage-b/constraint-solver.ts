/**
 * Stage B: Constraint-based Room Placement Solver
 * Simplified solver using iterative placement with constraints
 * Note: Full Cassowary integration can be added for production
 */

import { FloorPlanSpecification, RoomSpec, ConstraintSolution, FloorPlanError } from '../types';
import { DEFAULT_CONFIG, CIRCULATION_FACTOR } from '../config';
import { rectanglesOverlap, clamp } from '../utils';

interface PlacedRoom {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  spec: RoomSpec;
}

export class ConstraintSolver {
  private config = DEFAULT_CONFIG.stageB;
  private maxIterations: number;

  constructor(maxIterations?: number) {
    this.maxIterations = maxIterations || this.config.solver.maxIterations;
  }

  /**
   * Solve room placement with constraints
   */
  solve(spec: FloorPlanSpecification): ConstraintSolution {
    const relaxedConstraints: string[] = [];
    
    // Calculate available area (accounting for circulation)
    const effectiveArea = spec.totalArea * (1 - CIRCULATION_FACTOR);
    
    // Estimate building dimensions (try to keep square-ish)
    const buildingSide = Math.sqrt(spec.totalArea);
    const buildingWidth = buildingSide * 1.2; // Slightly rectangular
    const buildingHeight = spec.totalArea / buildingWidth;

    // Sort rooms by priority (higher first)
    const sortedRooms = [...spec.rooms].sort((a, b) => 
      (b.priority || 5) - (a.priority || 5)
    );

    // Initialize placement
    let placed: PlacedRoom[] = [];
    let iterations = 0;
    let bestPlacement: PlacedRoom[] = [];
    let bestScore = -Infinity;

    // Try multiple times with different starting conditions
    const attempts = Math.min(5, this.maxIterations / 200);
    
    for (let attempt = 0; attempt < attempts; attempt++) {
      placed = [];
      iterations = 0;

      // Place rooms one by one
      for (const room of sortedRooms) {
        const placedRoom = this.placeRoom(
          room,
          placed,
          buildingWidth,
          buildingHeight,
          spec,
          attempt
        );
        
        if (placedRoom) {
          placed.push(placedRoom);
        } else {
          // Failed to place - relax constraints
          relaxedConstraints.push(`Could not optimally place ${room.id}`);
          
          // Force placement anyway (simplified)
          const fallback = this.forcePlacement(room, placed, buildingWidth, buildingHeight);
          placed.push(fallback);
        }

        iterations++;
        if (iterations > this.maxIterations) break;
      }

      // Score this placement
      const score = this.scorePlacement(placed, spec);
      if (score > bestScore) {
        bestScore = score;
        bestPlacement = [...placed];
      }
    }

    // Convert to solution format
    const rooms = bestPlacement.map(p => ({
      id: p.id,
      x: p.x,
      y: p.y,
      width: p.width,
      height: p.height
    }));

    return {
      rooms,
      solved: relaxedConstraints.length === 0,
      iterations,
      relaxedConstraints
    };
  }

  /**
   * Place a single room
   */
  private placeRoom(
    room: RoomSpec,
    placed: PlacedRoom[],
    maxWidth: number,
    maxHeight: number,
    spec: FloorPlanSpecification,
    seed: number
  ): PlacedRoom | null {
    // Calculate room dimensions
    const targetArea = (room.minArea + room.maxArea) / 2;
    const aspectRatio = (room.aspectRatio.min + room.aspectRatio.max) / 2;
    
    let width = Math.sqrt(targetArea * aspectRatio);
    let height = targetArea / width;

    // Constrain to max dimensions
    width = Math.min(width, maxWidth * 0.8);
    height = Math.min(height, maxHeight * 0.8);

    // Ensure area constraints
    const actualArea = width * height;
    if (actualArea < room.minArea) {
      const scale = Math.sqrt(room.minArea / actualArea);
      width *= scale;
      height *= scale;
    }

    // Try to find valid position
    const candidates: Array<{ x: number; y: number; score: number }> = [];

    // Strategy: Try positions based on zone and adjacency
    if (placed.length === 0) {
      // First room - place at entrance (bottom-left for north entrance)
      candidates.push({ x: 0, y: 0, score: 10 });
    } else {
      // Find adjacent placement opportunities
      const adjacencies = spec.adjacencyGraph.filter(
        e => e.from === room.id || e.to === room.id
      );

      for (const adj of adjacencies) {
        const adjacentRoomId = adj.from === room.id ? adj.to : adj.from;
        const adjacentRoom = placed.find(p => p.id === adjacentRoomId);
        
        if (adjacentRoom) {
          // Try placing next to this room
          const positions = [
            { x: adjacentRoom.x + adjacentRoom.width, y: adjacentRoom.y }, // Right
            { x: adjacentRoom.x, y: adjacentRoom.y + adjacentRoom.height }, // Below
            { x: adjacentRoom.x - width, y: adjacentRoom.y }, // Left
            { x: adjacentRoom.x, y: adjacentRoom.y - height } // Above
          ];

          for (const pos of positions) {
            if (this.isValidPosition(pos.x, pos.y, width, height, maxWidth, maxHeight)) {
              candidates.push({ ...pos, score: adj.weight });
            }
          }
        }
      }

      // Add some random positions for diversity
      for (let i = 0; i < 5; i++) {
        const x = (Math.random() + seed * 0.1) * (maxWidth - width);
        const y = (Math.random() + seed * 0.1) * (maxHeight - height);
        if (this.isValidPosition(x, y, width, height, maxWidth, maxHeight)) {
          candidates.push({ x, y, score: 1 });
        }
      }
    }

    // Sort candidates by score
    candidates.sort((a, b) => b.score - a.score);

    // Try each candidate
    for (const candidate of candidates) {
      const testRoom: PlacedRoom = {
        id: room.id,
        x: candidate.x,
        y: candidate.y,
        width,
        height,
        spec: room
      };

      // Check for overlaps
      if (!this.hasOverlap(testRoom, placed)) {
        return testRoom;
      }
    }

    return null;
  }

  /**
   * Force placement (fallback)
   */
  private forcePlacement(
    room: RoomSpec,
    placed: PlacedRoom[],
    maxWidth: number,
    maxHeight: number
  ): PlacedRoom {
    const targetArea = room.minArea;
    const width = Math.sqrt(targetArea);
    const height = targetArea / width;

    // Find first available position with grid search
    const gridSize = 0.5; // meters
    for (let y = 0; y < maxHeight - height; y += gridSize) {
      for (let x = 0; x < maxWidth - width; x += gridSize) {
        const testRoom: PlacedRoom = {
          id: room.id,
          x, y, width, height,
          spec: room
        };

        if (!this.hasOverlap(testRoom, placed)) {
          return testRoom;
        }
      }
    }

    // Last resort: place at (0,0) - will overlap but prevents crash
    return {
      id: room.id,
      x: 0, y: 0, width, height,
      spec: room
    };
  }

  /**
   * Check if position is valid
   */
  private isValidPosition(
    x: number,
    y: number,
    width: number,
    height: number,
    maxWidth: number,
    maxHeight: number
  ): boolean {
    return x >= 0 && y >= 0 && x + width <= maxWidth && y + height <= maxHeight;
  }

  /**
   * Check for overlaps
   */
  private hasOverlap(room: PlacedRoom, placed: PlacedRoom[]): boolean {
    const margin = 0.1; // Small margin
    for (const other of placed) {
      if (rectanglesOverlap(
        { x: room.x - margin, y: room.y - margin, width: room.width + 2 * margin, height: room.height + 2 * margin },
        { x: other.x, y: other.y, width: other.width, height: other.height }
      )) {
        return true;
      }
    }
    return false;
  }

  /**
   * Score placement quality
   */
  private scorePlacement(placed: PlacedRoom[], spec: FloorPlanSpecification): number {
    let score = 0;

    // Reward proper areas
    for (const room of placed) {
      const area = room.width * room.height;
      const targetArea = (room.spec.minArea + room.spec.maxArea) / 2;
      const areaScore = 1 - Math.abs(area - targetArea) / targetArea;
      score += areaScore * 10;
    }

    // Reward adjacencies
    for (const edge of spec.adjacencyGraph) {
      const room1 = placed.find(p => p.id === edge.from);
      const room2 = placed.find(p => p.id === edge.to);
      
      if (room1 && room2) {
        // Check if rooms are adjacent
        const adjacent = this.areAdjacent(room1, room2);
        if (adjacent) {
          score += edge.weight * 5;
        }
      }
    }

    return score;
  }

  /**
   * Check if two rooms are adjacent
   */
  private areAdjacent(room1: PlacedRoom, room2: PlacedRoom): boolean {
    const tolerance = 0.2;
    
    // Check horizontal adjacency
    const horizontalAdjacent = 
      Math.abs(room1.x + room1.width - room2.x) < tolerance ||
      Math.abs(room2.x + room2.width - room1.x) < tolerance;
    
    // Check vertical adjacency
    const verticalAdjacent =
      Math.abs(room1.y + room1.height - room2.y) < tolerance ||
      Math.abs(room2.y + room2.height - room1.y) < tolerance;
    
    // Must overlap in perpendicular direction
    const xOverlap = !(room1.x + room1.width < room2.x || room2.x + room2.width < room1.x);
    const yOverlap = !(room1.y + room1.height < room2.y || room2.y + room2.height < room1.y);
    
    return (horizontalAdjacent && yOverlap) || (verticalAdjacent && xOverlap);
  }
}
