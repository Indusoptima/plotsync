/**
 * Multi-Objective Optimization Scoring
 * Evaluates floor plan layouts across multiple quality dimensions
 */

import { FloorPlanSpecification } from '../types';
import { PlacedRoom } from './zone-based-placer';

export interface ScoringWeights {
  areaCompliance: number;
  adjacencySatisfaction: number;
  compactness: number;
  alignment: number;
  naturalLight: number;
}

export interface LayoutScore {
  total: number;
  breakdown: {
    areaCompliance: number;
    adjacencySatisfaction: number;
    compactness: number;
    alignment: number;
    naturalLight: number;
  };
  details: {
    areaDeviations: Map<string, number>;
    satisfiedAdjacencies: number;
    totalAdjacencies: number;
    compactnessRatio: number;
    alignmentScore: number;
    exteriorWallRooms: number;
  };
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  areaCompliance: 0.35,
  adjacencySatisfaction: 0.30,
  compactness: 0.15,
  alignment: 0.10,
  naturalLight: 0.10
};

export class MultiObjectiveScorer {
  private weights: ScoringWeights;

  constructor(weights: ScoringWeights = DEFAULT_WEIGHTS) {
    this.weights = weights;
  }

  /**
   * Calculate comprehensive layout score
   */
  score(
    placed: PlacedRoom[],
    spec: FloorPlanSpecification,
    buildingWidth: number,
    buildingHeight: number
  ): LayoutScore {
    const areaScore = this.scoreAreaCompliance(placed);
    const adjacencyScore = this.scoreAdjacencySatisfaction(placed, spec);
    const compactnessScore = this.scoreCompactness(placed, buildingWidth, buildingHeight);
    const alignmentScore = this.scoreAlignment(placed);
    const lightScore = this.scoreNaturalLight(placed, buildingWidth, buildingHeight);

    const total =
      areaScore.score * this.weights.areaCompliance +
      adjacencyScore.score * this.weights.adjacencySatisfaction +
      compactnessScore.score * this.weights.compactness +
      alignmentScore.score * this.weights.alignment +
      lightScore.score * this.weights.naturalLight;

    return {
      total: total * 100, // Scale to 0-100
      breakdown: {
        areaCompliance: areaScore.score * 100,
        adjacencySatisfaction: adjacencyScore.score * 100,
        compactness: compactnessScore.score * 100,
        alignment: alignmentScore.score * 100,
        naturalLight: lightScore.score * 100
      },
      details: {
        areaDeviations: areaScore.deviations,
        satisfiedAdjacencies: adjacencyScore.satisfied,
        totalAdjacencies: adjacencyScore.total,
        compactnessRatio: compactnessScore.ratio,
        alignmentScore: alignmentScore.score,
        exteriorWallRooms: lightScore.exteriorRooms
      }
    };
  }

  /**
   * Score 1: Area Compliance (35%)
   * Measures how close room areas are to target areas
   */
  private scoreAreaCompliance(placed: PlacedRoom[]): { score: number; deviations: Map<string, number> } {
    const deviations = new Map<string, number>();
    let totalDeviation = 0;
    let maxDeviation = 0;

    for (const room of placed) {
      const actualArea = room.width * room.height;
      const targetArea = (room.spec.minArea + room.spec.maxArea) / 2;
      const deviation = Math.abs(actualArea - targetArea) / targetArea;
      
      deviations.set(room.id, deviation);
      totalDeviation += deviation;
      maxDeviation = Math.max(maxDeviation, deviation);

      // Penalty for violating bounds
      if (actualArea < room.spec.minArea) {
        totalDeviation += (room.spec.minArea - actualArea) / room.spec.minArea;
      } else if (actualArea > room.spec.maxArea) {
        totalDeviation += (actualArea - room.spec.maxArea) / room.spec.maxArea;
      }
    }

    const avgDeviation = totalDeviation / placed.length;
    const score = Math.max(0, 1 - avgDeviation);

    return { score, deviations };
  }

  /**
   * Score 2: Adjacency Satisfaction (30%)
   * Measures how well desired adjacencies are satisfied
   */
  private scoreAdjacencySatisfaction(
    placed: PlacedRoom[],
    spec: FloorPlanSpecification
  ): { score: number; satisfied: number; total: number } {
    let satisfiedWeight = 0;
    let totalWeight = 0;
    let satisfiedCount = 0;

    for (const edge of spec.adjacencyGraph) {
      const room1 = placed.find(p => p.id === edge.from);
      const room2 = placed.find(p => p.id === edge.to);

      if (room1 && room2) {
        totalWeight += edge.weight;
        
        if (this.areAdjacent(room1, room2)) {
          satisfiedWeight += edge.weight;
          satisfiedCount++;
          
          // Bonus for shared wall length
          const sharedLength = this.calculateSharedWallLength(room1, room2);
          if (sharedLength > 0) {
            satisfiedWeight += edge.weight * 0.2 * (sharedLength / Math.min(room1.width, room2.width));
          }
        } else {
          // Penalty based on distance for high-weight edges
          if (edge.weight >= 8) {
            const distance = this.calculateDistance(room1, room2);
            const distancePenalty = Math.min(1, distance / 10); // Penalty increases with distance
            satisfiedWeight -= edge.weight * distancePenalty * 0.3;
          }
        }
      }
    }

    const score = totalWeight > 0 ? Math.max(0, satisfiedWeight / totalWeight) : 0;

    return {
      score,
      satisfied: satisfiedCount,
      total: spec.adjacencyGraph.length
    };
  }

  /**
   * Score 3: Compactness (15%)
   * Rewards square/rectangular building footprints, penalizes irregular shapes
   */
  private scoreCompactness(
    placed: PlacedRoom[],
    buildingWidth: number,
    buildingHeight: number
  ): { score: number; ratio: number } {
    // Calculate actual bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    for (const room of placed) {
      minX = Math.min(minX, room.x);
      minY = Math.min(minY, room.y);
      maxX = Math.max(maxX, room.x + room.width);
      maxY = Math.max(maxY, room.y + room.height);
    }

    const actualWidth = maxX - minX;
    const actualHeight = maxY - minY;
    const perimeter = 2 * (actualWidth + actualHeight);
    const area = actualWidth * actualHeight;

    // Compactness ratio (circle = 1, lower is more compact)
    const compactnessRatio = (4 * Math.PI * area) / (perimeter * perimeter);

    // Reward square-ish shapes
    const aspectRatio = Math.max(actualWidth, actualHeight) / Math.min(actualWidth, actualHeight);
    const aspectScore = 1 / (1 + (aspectRatio - 1) * 0.3); // Penalty for non-square

    const score = compactnessRatio * aspectScore;

    return { score, ratio: compactnessRatio };
  }

  /**
   * Score 4: Alignment (10%)
   * Rewards rooms sharing wall lines (grid-aligned)
   */
  private scoreAlignment(placed: PlacedRoom[]): { score: number } {
    let alignmentScore = 0;
    const tolerance = 0.15; // 15cm tolerance

    // Check horizontal alignments
    const horizontalEdges = new Set<number>();
    for (const room of placed) {
      horizontalEdges.add(Math.round(room.y / tolerance) * tolerance);
      horizontalEdges.add(Math.round((room.y + room.height) / tolerance) * tolerance);
    }

    // Check vertical alignments
    const verticalEdges = new Set<number>();
    for (const room of placed) {
      verticalEdges.add(Math.round(room.x / tolerance) * tolerance);
      verticalEdges.add(Math.round((room.x + room.width) / tolerance) * tolerance);
    }

    // Count aligned rooms
    let alignedEdges = 0;
    const maxPossibleEdges = placed.length * 4;

    for (const room of placed) {
      const edges = [
        Math.round(room.x / tolerance) * tolerance,
        Math.round((room.x + room.width) / tolerance) * tolerance,
        Math.round(room.y / tolerance) * tolerance,
        Math.round((room.y + room.height) / tolerance) * tolerance
      ];

      for (const edge of edges) {
        if (verticalEdges.has(edge) || horizontalEdges.has(edge)) {
          alignedEdges++;
        }
      }
    }

    alignmentScore = alignedEdges / maxPossibleEdges;

    return { score: alignmentScore };
  }

  /**
   * Score 5: Natural Light (10%)
   * Rewards rooms touching exterior walls
   */
  private scoreNaturalLight(
    placed: PlacedRoom[],
    buildingWidth: number,
    buildingHeight: number
  ): { score: number; exteriorRooms: number } {
    let exteriorRooms = 0;
    const tolerance = 0.2;

    for (const room of placed) {
      const touchesExterior =
        room.x < tolerance || // Left wall
        room.y < tolerance || // Bottom wall
        room.x + room.width > buildingWidth - tolerance || // Right wall
        room.y + room.height > buildingHeight - tolerance; // Top wall

      if (touchesExterior && room.spec.requiresWindow) {
        exteriorRooms++;
      }
    }

    const requiresWindowCount = placed.filter(r => r.spec.requiresWindow).length;
    const score = requiresWindowCount > 0 ? exteriorRooms / requiresWindowCount : 1;

    return { score, exteriorRooms };
  }

  /**
   * Check if two rooms are adjacent
   */
  private areAdjacent(room1: PlacedRoom, room2: PlacedRoom): boolean {
    const tolerance = 0.2;

    // Horizontal adjacency
    const horizontalAdjacent =
      Math.abs(room1.x + room1.width - room2.x) < tolerance ||
      Math.abs(room2.x + room2.width - room1.x) < tolerance;

    // Vertical adjacency
    const verticalAdjacent =
      Math.abs(room1.y + room1.height - room2.y) < tolerance ||
      Math.abs(room2.y + room2.height - room1.y) < tolerance;

    // Must overlap in perpendicular direction
    const xOverlap = !(room1.x + room1.width < room2.x || room2.x + room2.width < room1.x);
    const yOverlap = !(room1.y + room1.height < room2.y || room2.y + room2.height < room1.y);

    return (horizontalAdjacent && yOverlap) || (verticalAdjacent && xOverlap);
  }

  /**
   * Calculate shared wall length
   */
  private calculateSharedWallLength(room1: PlacedRoom, room2: PlacedRoom): number {
    const tolerance = 0.2;

    // Check horizontal sharing
    if (Math.abs(room1.x + room1.width - room2.x) < tolerance) {
      const overlapStart = Math.max(room1.y, room2.y);
      const overlapEnd = Math.min(room1.y + room1.height, room2.y + room2.height);
      return Math.max(0, overlapEnd - overlapStart);
    }

    if (Math.abs(room2.x + room2.width - room1.x) < tolerance) {
      const overlapStart = Math.max(room1.y, room2.y);
      const overlapEnd = Math.min(room1.y + room1.height, room2.y + room2.height);
      return Math.max(0, overlapEnd - overlapStart);
    }

    // Check vertical sharing
    if (Math.abs(room1.y + room1.height - room2.y) < tolerance) {
      const overlapStart = Math.max(room1.x, room2.x);
      const overlapEnd = Math.min(room1.x + room1.width, room2.x + room2.width);
      return Math.max(0, overlapEnd - overlapStart);
    }

    if (Math.abs(room2.y + room2.height - room1.y) < tolerance) {
      const overlapStart = Math.max(room1.x, room2.x);
      const overlapEnd = Math.min(room1.x + room1.width, room2.x + room2.width);
      return Math.max(0, overlapEnd - overlapStart);
    }

    return 0;
  }

  /**
   * Calculate distance between room centroids
   */
  private calculateDistance(room1: PlacedRoom, room2: PlacedRoom): number {
    const cx1 = room1.x + room1.width / 2;
    const cy1 = room1.y + room1.height / 2;
    const cx2 = room2.x + room2.width / 2;
    const cy2 = room2.y + room2.height / 2;

    return Math.sqrt(Math.pow(cx2 - cx1, 2) + Math.pow(cy2 - cy1, 2));
  }
}

export const multiObjectiveScorer = new MultiObjectiveScorer();
