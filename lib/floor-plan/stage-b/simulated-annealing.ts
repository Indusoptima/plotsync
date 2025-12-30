/**
 * Simulated Annealing Optimizer
 * Iteratively refines floor plan layouts through probabilistic search
 */

import { FloorPlanSpecification } from '../types';
import { PlacedRoom } from './zone-based-placer';
import { multiObjectiveScorer, LayoutScore } from './multi-objective-scorer';

export interface AnnealingConfig {
  initialTemperature: number;
  coolingRate: number;
  minTemperature: number;
  maxIterations: number;
  perturbationsPerIteration: number;
}

export interface OptimizationResult {
  bestPlacement: PlacedRoom[];
  bestScore: LayoutScore;
  iterations: number;
  scoreHistory: number[];
  converged: boolean;
}

export class SimulatedAnnealingOptimizer {
  private config: AnnealingConfig;

  constructor(config?: Partial<AnnealingConfig>) {
    this.config = {
      initialTemperature: 100,
      coolingRate: 0.95,
      minTemperature: 0.1,
      maxIterations: 500,
      perturbationsPerIteration: 8,
      ...config
    };
  }

  /**
   * Optimize layout using simulated annealing
   */
  optimize(
    initialPlacement: PlacedRoom[],
    spec: FloorPlanSpecification,
    buildingWidth: number,
    buildingHeight: number
  ): OptimizationResult {
    let currentPlacement = this.deepCopyPlacement(initialPlacement);
    let currentScore = multiObjectiveScorer.score(currentPlacement, spec, buildingWidth, buildingHeight);
    
    let bestPlacement = this.deepCopyPlacement(currentPlacement);
    let bestScore = currentScore;
    
    let temperature = this.config.initialTemperature;
    let iteration = 0;
    const scoreHistory: number[] = [currentScore.total];
    let noImprovementCount = 0;
    const maxNoImprovement = 50;

    while (
      temperature > this.config.minTemperature &&
      iteration < this.config.maxIterations &&
      noImprovementCount < maxNoImprovement
    ) {
      let improved = false;

      // Try multiple perturbations at this temperature
      for (let p = 0; p < this.config.perturbationsPerIteration; p++) {
        const neighbor = this.generateNeighbor(currentPlacement, spec, buildingWidth, buildingHeight);
        
        if (!neighbor) continue;

        const neighborScore = multiObjectiveScorer.score(neighbor, spec, buildingWidth, buildingHeight);
        const scoreDelta = neighborScore.total - currentScore.total;

        // Accept if better, or with probability based on temperature
        const acceptanceProbability = scoreDelta > 0 ? 1 : Math.exp(scoreDelta / temperature);
        
        if (Math.random() < acceptanceProbability) {
          currentPlacement = neighbor;
          currentScore = neighborScore;

          // Track best
          if (currentScore.total > bestScore.total) {
            bestPlacement = this.deepCopyPlacement(currentPlacement);
            bestScore = currentScore;
            improved = true;
            noImprovementCount = 0;
          }
        }
      }

      if (!improved) {
        noImprovementCount++;
      }

      scoreHistory.push(currentScore.total);
      temperature *= this.config.coolingRate;
      iteration++;
    }

    return {
      bestPlacement,
      bestScore,
      iterations: iteration,
      scoreHistory,
      converged: noImprovementCount >= maxNoImprovement || temperature <= this.config.minTemperature
    };
  }

  /**
   * Generate a neighboring solution through perturbation
   */
  private generateNeighbor(
    placement: PlacedRoom[],
    spec: FloorPlanSpecification,
    maxWidth: number,
    maxHeight: number
  ): PlacedRoom[] | null {
    const perturbationType = Math.random();
    
    if (perturbationType < 0.3) {
      // Type 1: Swap two rooms
      return this.swapRooms(placement, maxWidth, maxHeight);
    } else if (perturbationType < 0.6) {
      // Type 2: Adjust room dimensions
      return this.adjustDimensions(placement, spec, maxWidth, maxHeight);
    } else if (perturbationType < 0.85) {
      // Type 3: Shift room position
      return this.shiftPosition(placement, maxWidth, maxHeight);
    } else {
      // Type 4: Rotate room cluster
      return this.rotateCluster(placement, spec, maxWidth, maxHeight);
    }
  }

  /**
   * Perturbation 1: Swap positions of two rooms
   */
  private swapRooms(placement: PlacedRoom[], maxWidth: number, maxHeight: number): PlacedRoom[] | null {
    if (placement.length < 2) return null;

    const neighbor = this.deepCopyPlacement(placement);
    const idx1 = Math.floor(Math.random() * neighbor.length);
    const idx2 = Math.floor(Math.random() * neighbor.length);
    
    if (idx1 === idx2) return null;

    const room1 = neighbor[idx1];
    const room2 = neighbor[idx2];

    // Swap positions
    const tempX = room1.x;
    const tempY = room1.y;
    room1.x = room2.x;
    room1.y = room2.y;
    room2.x = tempX;
    room2.y = tempY;

    // Check bounds
    if (
      room1.x + room1.width > maxWidth ||
      room1.y + room1.height > maxHeight ||
      room2.x + room2.width > maxWidth ||
      room2.y + room2.height > maxHeight
    ) {
      return null;
    }

    // Check for new overlaps
    if (this.hasAnyOverlap(neighbor)) {
      return null;
    }

    return neighbor;
  }

  /**
   * Perturbation 2: Adjust room dimensions within constraints
   */
  private adjustDimensions(
    placement: PlacedRoom[],
    spec: FloorPlanSpecification,
    maxWidth: number,
    maxHeight: number
  ): PlacedRoom[] | null {
    if (placement.length === 0) return null;

    const neighbor = this.deepCopyPlacement(placement);
    const idx = Math.floor(Math.random() * neighbor.length);
    const room = neighbor[idx];

    // Adjust by ±10%
    const adjustmentFactor = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
    const newWidth = room.width * adjustmentFactor;
    const newHeight = room.height / adjustmentFactor; // Maintain approximate area

    // Check constraints
    const newArea = newWidth * newHeight;
    if (newArea < room.spec.minArea || newArea > room.spec.maxArea) {
      return null;
    }

    const newAspectRatio = newWidth / newHeight;
    if (
      newAspectRatio < room.spec.aspectRatio.min ||
      newAspectRatio > room.spec.aspectRatio.max
    ) {
      return null;
    }

    // Apply adjustment
    room.width = newWidth;
    room.height = newHeight;

    // Check bounds and overlaps
    if (room.x + room.width > maxWidth || room.y + room.height > maxHeight) {
      return null;
    }

    if (this.hasAnyOverlap(neighbor)) {
      return null;
    }

    return neighbor;
  }

  /**
   * Perturbation 3: Shift room position slightly
   */
  private shiftPosition(placement: PlacedRoom[], maxWidth: number, maxHeight: number): PlacedRoom[] | null {
    if (placement.length === 0) return null;

    const neighbor = this.deepCopyPlacement(placement);
    const idx = Math.floor(Math.random() * neighbor.length);
    const room = neighbor[idx];

    // Shift by small random amount
    const shiftX = (Math.random() - 0.5) * 1.0; // ±0.5m
    const shiftY = (Math.random() - 0.5) * 1.0;

    room.x += shiftX;
    room.y += shiftY;

    // Check bounds
    if (
      room.x < 0 ||
      room.y < 0 ||
      room.x + room.width > maxWidth ||
      room.y + room.height > maxHeight
    ) {
      return null;
    }

    if (this.hasAnyOverlap(neighbor)) {
      return null;
    }

    return neighbor;
  }

  /**
   * Perturbation 4: Rotate a cluster of adjacent rooms
   */
  private rotateCluster(
    placement: PlacedRoom[],
    spec: FloorPlanSpecification,
    maxWidth: number,
    maxHeight: number
  ): PlacedRoom[] | null {
    if (placement.length < 2) return null;

    const neighbor = this.deepCopyPlacement(placement);
    
    // Select a random room and find its adjacent rooms
    const seedIdx = Math.floor(Math.random() * neighbor.length);
    const seedRoom = neighbor[seedIdx];
    const cluster = [seedRoom];

    // Find adjacent rooms
    for (const other of neighbor) {
      if (other.id !== seedRoom.id && this.areAdjacent(seedRoom, other)) {
        cluster.push(other);
        if (cluster.length >= 3) break; // Limit cluster size
      }
    }

    if (cluster.length < 2) return null;

    // Calculate cluster centroid
    const centroidX = cluster.reduce((sum, r) => sum + r.x + r.width / 2, 0) / cluster.length;
    const centroidY = cluster.reduce((sum, r) => sum + r.y + r.height / 2, 0) / cluster.length;

    // Rotate 90 degrees around centroid
    for (const room of cluster) {
      const relX = room.x - centroidX;
      const relY = room.y - centroidY;
      
      // 90-degree rotation
      const newRelX = -relY;
      const newRelY = relX;
      
      room.x = centroidX + newRelX;
      room.y = centroidY + newRelY;
      
      // Swap dimensions
      const tempWidth = room.width;
      room.width = room.height;
      room.height = tempWidth;
    }

    // Check all rooms in cluster are still valid
    for (const room of cluster) {
      if (
        room.x < 0 ||
        room.y < 0 ||
        room.x + room.width > maxWidth ||
        room.y + room.height > maxHeight
      ) {
        return null;
      }
    }

    if (this.hasAnyOverlap(neighbor)) {
      return null;
    }

    return neighbor;
  }

  /**
   * Check if rooms are adjacent
   */
  private areAdjacent(room1: PlacedRoom, room2: PlacedRoom): boolean {
    const tolerance = 0.3;

    const horizontalAdjacent =
      Math.abs(room1.x + room1.width - room2.x) < tolerance ||
      Math.abs(room2.x + room2.width - room1.x) < tolerance;

    const verticalAdjacent =
      Math.abs(room1.y + room1.height - room2.y) < tolerance ||
      Math.abs(room2.y + room2.height - room1.y) < tolerance;

    const xOverlap = !(room1.x + room1.width < room2.x || room2.x + room2.width < room1.x);
    const yOverlap = !(room1.y + room1.height < room2.y || room2.y + room2.height < room1.y);

    return (horizontalAdjacent && yOverlap) || (verticalAdjacent && xOverlap);
  }

  /**
   * Check if any rooms overlap
   */
  private hasAnyOverlap(placement: PlacedRoom[]): boolean {
    const margin = 0.1;

    for (let i = 0; i < placement.length; i++) {
      for (let j = i + 1; j < placement.length; j++) {
        const r1 = placement[i];
        const r2 = placement[j];

        if (this.rectanglesOverlap(
          { x: r1.x - margin, y: r1.y - margin, width: r1.width + 2 * margin, height: r1.height + 2 * margin },
          { x: r2.x, y: r2.y, width: r2.width, height: r2.height }
        )) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check rectangle overlap
   */
  private rectanglesOverlap(
    r1: { x: number; y: number; width: number; height: number },
    r2: { x: number; y: number; width: number; height: number }
  ): boolean {
    return !(
      r1.x + r1.width < r2.x ||
      r2.x + r2.width < r1.x ||
      r1.y + r1.height < r2.y ||
      r2.y + r2.height < r1.y
    );
  }

  /**
   * Deep copy placement
   */
  private deepCopyPlacement(placement: PlacedRoom[]): PlacedRoom[] {
    return placement.map(room => ({
      ...room,
      spec: { ...room.spec }
    }));
  }
}

export const simulatedAnnealingOptimizer = new SimulatedAnnealingOptimizer();
