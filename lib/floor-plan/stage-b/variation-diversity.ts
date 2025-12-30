/**
 * Variation Diversity Scorer
 * Ensures generated variations are sufficiently different from each other
 */

import { PlacedRoom } from './zone-based-placer';

export interface DiversityScore {
  structuralSimilarity: number; // 0-1, lower is more diverse
  spatialSimilarity: number;
  layoutSimilarity: number;
  overallDiversity: number; // 0-100, higher is more diverse
}

export class VariationDiversityScorer {
  
  /**
   * Compare two floor plan variations and score their diversity
   */
  scoreDiversity(
    variation1: PlacedRoom[],
    variation2: PlacedRoom[]
  ): DiversityScore {
    const structuralSimilarity = this.calculateStructuralSimilarity(variation1, variation2);
    const spatialSimilarity = this.calculateSpatialSimilarity(variation1, variation2);
    const layoutSimilarity = this.calculateLayoutSimilarity(variation1, variation2);

    // Overall diversity (inverse of average similarity)
    const avgSimilarity = (structuralSimilarity + spatialSimilarity + layoutSimilarity) / 3;
    const overallDiversity = (1 - avgSimilarity) * 100;

    return {
      structuralSimilarity,
      spatialSimilarity,
      layoutSimilarity,
      overallDiversity
    };
  }

  /**
   * Calculate structural similarity (room topology and connections)
   */
  private calculateStructuralSimilarity(
    variation1: PlacedRoom[],
    variation2: PlacedRoom[]
  ): number {
    if (variation1.length !== variation2.length) {
      return 0; // Different number of rooms = structurally different
    }

    // Build adjacency matrices
    const adj1 = this.buildAdjacencyMatrix(variation1);
    const adj2 = this.buildAdjacencyMatrix(variation2);

    // Compare matrices
    let matchingEdges = 0;
    let totalEdges = 0;

    for (let i = 0; i < variation1.length; i++) {
      for (let j = i + 1; j < variation1.length; j++) {
        const room1_i = variation1[i];
        const room1_j = variation1[j];
        const room2_i = variation2.find(r => r.spec.type === room1_i.spec.type);
        const room2_j = variation2.find(r => r.spec.type === room1_j.spec.type);

        if (room2_i && room2_j) {
          const adj1_val = adj1[i][j];
          const adj2_idx_i = variation2.indexOf(room2_i);
          const adj2_idx_j = variation2.indexOf(room2_j);
          const adj2_val = adj2[adj2_idx_i][adj2_idx_j];

          totalEdges++;
          if (adj1_val === adj2_val) {
            matchingEdges++;
          }
        }
      }
    }

    return totalEdges > 0 ? matchingEdges / totalEdges : 0;
  }

  /**
   * Build adjacency matrix from room placements
   */
  private buildAdjacencyMatrix(rooms: PlacedRoom[]): number[][] {
    const n = rooms.length;
    const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (this.areAdjacent(rooms[i], rooms[j])) {
          matrix[i][j] = 1;
          matrix[j][i] = 1;
        }
      }
    }

    return matrix;
  }

  /**
   * Check if two rooms are adjacent
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
   * Calculate spatial similarity (room positions and orientations)
   */
  private calculateSpatialSimilarity(
    variation1: PlacedRoom[],
    variation2: PlacedRoom[]
  ): number {
    if (variation1.length !== variation2.length) {
      return 0;
    }

    // Normalize room positions to compare
    const normalized1 = this.normalizePositions(variation1);
    const normalized2 = this.normalizePositions(variation2);

    let totalDistance = 0;
    const n = variation1.length;

    // For each room type, find corresponding room in other variation
    for (const room1 of normalized1) {
      const room2 = normalized2.find(r => r.spec.type === room1.spec.type);
      
      if (room2) {
        // Calculate centroid distance
        const centroid1 = {
          x: room1.x + room1.width / 2,
          y: room1.y + room1.height / 2
        };
        const centroid2 = {
          x: room2.x + room2.width / 2,
          y: room2.y + room2.height / 2
        };

        const dist = Math.sqrt(
          Math.pow(centroid1.x - centroid2.x, 2) +
          Math.pow(centroid1.y - centroid2.y, 2)
        );

        totalDistance += dist;
      }
    }

    // Normalize distance to 0-1 range
    // Assume max reasonable distance is diagonal of normalized space (sqrt(2))
    const avgDistance = totalDistance / n;
    const similarity = Math.max(0, 1 - avgDistance / Math.sqrt(2));

    return similarity;
  }

  /**
   * Normalize room positions to 0-1 range
   */
  private normalizePositions(rooms: PlacedRoom[]): PlacedRoom[] {
    if (rooms.length === 0) return [];

    // Find bounds
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const room of rooms) {
      minX = Math.min(minX, room.x);
      minY = Math.min(minY, room.y);
      maxX = Math.max(maxX, room.x + room.width);
      maxY = Math.max(maxY, room.y + room.height);
    }

    const rangeX = maxX - minX;
    const rangeY = maxY - minY;

    // Normalize
    return rooms.map(room => ({
      ...room,
      x: (room.x - minX) / rangeX,
      y: (room.y - minY) / rangeY,
      width: room.width / rangeX,
      height: room.height / rangeY
    }));
  }

  /**
   * Calculate layout similarity (room arrangement patterns)
   */
  private calculateLayoutSimilarity(
    variation1: PlacedRoom[],
    variation2: PlacedRoom[]
  ): number {
    // Compare zone distributions
    const zoneDistribution1 = this.analyzeZoneDistribution(variation1);
    const zoneDistribution2 = this.analyzeZoneDistribution(variation2);

    let zoneSimilarity = 0;
    const zones = ['public', 'private', 'service'];
    
    for (const zone of zones) {
      const diff = Math.abs(
        (zoneDistribution1[zone] || 0) - (zoneDistribution2[zone] || 0)
      );
      zoneSimilarity += 1 - diff;
    }
    zoneSimilarity /= zones.length;

    // Compare aspect ratios
    const aspectRatioSimilarity = this.compareAspectRatios(variation1, variation2);

    // Combine metrics
    return (zoneSimilarity + aspectRatioSimilarity) / 2;
  }

  /**
   * Analyze zone distribution (percentage of area in each zone)
   */
  private analyzeZoneDistribution(
    rooms: PlacedRoom[]
  ): Record<string, number> {
    const distribution: Record<string, number> = {};
    const totalArea = rooms.reduce((sum, r) => sum + r.width * r.height, 0);

    for (const room of rooms) {
      const zone = room.zone;
      const area = room.width * room.height;
      distribution[zone] = (distribution[zone] || 0) + area / totalArea;
    }

    return distribution;
  }

  /**
   * Compare aspect ratios of layouts
   */
  private compareAspectRatios(
    variation1: PlacedRoom[],
    variation2: PlacedRoom[]
  ): number {
    const aspectRatio1 = this.calculateLayoutAspectRatio(variation1);
    const aspectRatio2 = this.calculateLayoutAspectRatio(variation2);

    const ratio = Math.min(aspectRatio1, aspectRatio2) / Math.max(aspectRatio1, aspectRatio2);
    return ratio;
  }

  /**
   * Calculate overall layout aspect ratio
   */
  private calculateLayoutAspectRatio(rooms: PlacedRoom[]): number {
    if (rooms.length === 0) return 1;

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const room of rooms) {
      minX = Math.min(minX, room.x);
      minY = Math.min(minY, room.y);
      maxX = Math.max(maxX, room.x + room.width);
      maxY = Math.max(maxY, room.y + room.height);
    }

    const width = maxX - minX;
    const height = maxY - minY;

    return width / height;
  }

  /**
   * Check if variation set has sufficient diversity
   */
  checkVariationSetDiversity(
    variations: PlacedRoom[][],
    minDiversityThreshold: number = 30
  ): {
    hasSufficientDiversity: boolean;
    pairwiseScores: DiversityScore[][];
    averageDiversity: number;
  } {
    const n = variations.length;
    const pairwiseScores: DiversityScore[][] = Array(n).fill(null).map(() => Array(n).fill(null));

    let totalDiversity = 0;
    let comparisons = 0;

    // Compare all pairs
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const score = this.scoreDiversity(variations[i], variations[j]);
        pairwiseScores[i][j] = score;
        pairwiseScores[j][i] = score;
        totalDiversity += score.overallDiversity;
        comparisons++;
      }
    }

    const averageDiversity = comparisons > 0 ? totalDiversity / comparisons : 0;

    return {
      hasSufficientDiversity: averageDiversity >= minDiversityThreshold,
      pairwiseScores,
      averageDiversity
    };
  }

  /**
   * Filter variations to ensure minimum diversity
   */
  filterForDiversity(
    variations: PlacedRoom[][],
    targetCount: number,
    minDiversity: number = 30
  ): PlacedRoom[][] {
    if (variations.length <= targetCount) {
      return variations;
    }

    const selected: PlacedRoom[][] = [variations[0]]; // Always include first

    while (selected.length < targetCount && selected.length < variations.length) {
      let bestCandidate: PlacedRoom[] | null = null;
      let bestMinDiversity = -Infinity;

      // Find candidate with best minimum diversity to already selected
      for (const candidate of variations) {
        if (selected.includes(candidate)) continue;

        let minDiversityToSelected = Infinity;

        for (const selectedVar of selected) {
          const score = this.scoreDiversity(candidate, selectedVar);
          minDiversityToSelected = Math.min(minDiversityToSelected, score.overallDiversity);
        }

        if (minDiversityToSelected > bestMinDiversity) {
          bestMinDiversity = minDiversityToSelected;
          bestCandidate = candidate;
        }
      }

      if (bestCandidate && bestMinDiversity >= minDiversity) {
        selected.push(bestCandidate);
      } else {
        break; // Can't find more diverse variations
      }
    }

    return selected;
  }
}

export const variationDiversityScorer = new VariationDiversityScorer();
