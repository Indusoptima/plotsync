/**
 * Stage B: Enhanced Constraint-based Room Placement Solver
 * Integrates zone-based placement, template-based layout, multi-objective scoring, and simulated annealing
 */

import { FloorPlanSpecification, RoomSpec, ConstraintSolution, FloorPlanError } from '../types';
import { DEFAULT_CONFIG, CIRCULATION_FACTOR } from '../config';
import { rectanglesOverlap, clamp } from '../utils';
import { zoneBasedPlacer, PlacedRoom } from './zone-based-placer';
import { templateBasedPlacer } from './template-based-placer';
import { multiObjectiveScorer } from './multi-objective-scorer';
import { simulatedAnnealingOptimizer } from './simulated-annealing';
import { variationDiversityScorer } from './variation-diversity';

export class ConstraintSolver {
  private config = DEFAULT_CONFIG.stageB;
  private maxIterations: number;
  private useTemplates: boolean;
  private previousVariations: PlacedRoom[][] = [];

  constructor(maxIterations?: number, useTemplates: boolean = true) {
    this.maxIterations = maxIterations || this.config.solver.maxIterations;
    this.useTemplates = useTemplates;
  }

  /**
   * Solve room placement with enhanced template-based or zone-based approach
   */
  solve(spec: FloorPlanSpecification, variationSeed?: number): ConstraintSolution {
    const relaxedConstraints: string[] = [];
    
    // Calculate available area (accounting for circulation)
    const effectiveArea = spec.totalArea * (1 - CIRCULATION_FACTOR);
    
    // Estimate building dimensions (try to keep square-ish)
    const buildingSide = Math.sqrt(spec.totalArea);
    const buildingWidth = buildingSide * 1.2; // Slightly rectangular
    const buildingHeight = spec.totalArea / buildingWidth;

    console.log(`[ConstraintSolver] Building dimensions: ${buildingWidth.toFixed(2)}m x ${buildingHeight.toFixed(2)}m`);
    console.log(`[ConstraintSolver] Using ${this.useTemplates ? 'template-based' : 'zone-based'} placement`);

    let placed: PlacedRoom[];
    let placementMethod: string;

    // Try template-based placement first if enabled
    if (this.useTemplates) {
      try {
        console.log('[ConstraintSolver] Attempting template-based placement');
        const templateResult = templateBasedPlacer.placeWithTemplate(
          spec,
          buildingWidth,
          buildingHeight,
          variationSeed
        );
        
        placed = templateResult.placed;
        placementMethod = `template: ${templateResult.template.name}`;
        console.log(`[ConstraintSolver] Template placement confidence: ${templateResult.confidence.toFixed(1)}%`);
        
        if (templateResult.confidence < 50) {
          console.log('[ConstraintSolver] Low confidence, falling back to zone-based placement');
          throw new Error('Low template confidence');
        }
      } catch (error) {
        console.log(`[ConstraintSolver] Template placement failed: ${error}, using zone-based fallback`);
        placed = this.zoneBasedPlacement(spec, buildingWidth, buildingHeight);
        placementMethod = 'zone-based (fallback)';
      }
    } else {
      // Use zone-based placement
      placed = this.zoneBasedPlacement(spec, buildingWidth, buildingHeight);
      placementMethod = 'zone-based';
    }

    // Check for missing rooms
    if (placed.length < spec.rooms.length) {
      relaxedConstraints.push(`Could not place all rooms: ${spec.rooms.length - placed.length} rooms missing`);
      
      // Try fallback placement for missing rooms
      const placedIds = new Set(placed.map(p => p.id));
      const missingRooms = spec.rooms.filter(r => !placedIds.has(r.id));
      
      for (const room of missingRooms) {
        const fallback = this.forcePlacement(room, placed, buildingWidth, buildingHeight);
        placed.push(fallback);
      }
    }

    // Phase 2: Score initial placement
    console.log('[ConstraintSolver] Phase 2: Scoring initial placement');
    const initialScore = multiObjectiveScorer.score(placed, spec, buildingWidth, buildingHeight);
    console.log(`[ConstraintSolver] Initial score: ${initialScore.total.toFixed(2)}`);

    // Phase 3: Simulated annealing optimization
    console.log('[ConstraintSolver] Phase 3: Simulated annealing optimization');
    const complexityFactor = spec.rooms.length <= 4 ? 0.5 : spec.rooms.length <= 8 ? 1.0 : 1.5;
    const optimizationResult = simulatedAnnealingOptimizer.optimize(
      placed,
      spec,
      buildingWidth,
      buildingHeight
    );

    console.log(`[ConstraintSolver] Optimized score: ${optimizationResult.bestScore.total.toFixed(2)} (${optimizationResult.iterations} iterations)`);
    console.log(`[ConstraintSolver] Score breakdown:`, optimizationResult.bestScore.breakdown);
    console.log(`[ConstraintSolver] Placement method: ${placementMethod}`);

    placed = optimizationResult.bestPlacement;

    // Check diversity if multiple variations
    if (this.previousVariations.length > 0) {
      const diversityCheck = variationDiversityScorer.checkVariationSetDiversity(
        [...this.previousVariations, placed],
        25 // Minimum 25% diversity
      );
      console.log(`[ConstraintSolver] Variation diversity: ${diversityCheck.averageDiversity.toFixed(1)}%`);
      
      if (!diversityCheck.hasSufficientDiversity) {
        relaxedConstraints.push('Low diversity compared to previous variations');
      }
    }

    // Store this variation
    this.previousVariations.push([...placed]);

    // Check for remaining issues
    if (this.hasAnyOverlap(placed)) {
      relaxedConstraints.push('Some room overlaps remain after optimization');
    }

    const unsatisfiedHighWeightAdj = this.checkUnsatisfiedAdjacencies(placed, spec);
    if (unsatisfiedHighWeightAdj > 0) {
      relaxedConstraints.push(`${unsatisfiedHighWeightAdj} high-priority adjacencies not satisfied`);
    }

    // Convert to solution format
    const rooms = placed.map(p => ({
      id: p.id,
      x: p.x,
      y: p.y,
      width: p.width,
      height: p.height
    }));

    return {
      rooms,
      solved: relaxedConstraints.length === 0,
      iterations: optimizationResult.iterations,
      relaxedConstraints
    };
  }

  /**
   * Zone-based placement fallback
   */
  private zoneBasedPlacement(
    spec: FloorPlanSpecification,
    buildingWidth: number,
    buildingHeight: number
  ): PlacedRoom[] {
    console.log('[ConstraintSolver] Phase 1: Zone allocation and hierarchical placement');
    const zoneAllocations = zoneBasedPlacer.allocateZones(spec, buildingWidth, buildingHeight);
    return zoneBasedPlacer.placeRoomsInZones(zoneAllocations, spec, buildingWidth, buildingHeight);
  }

  /**
   * Reset previous variations (call between different generation requests)
   */
  resetVariations(): void {
    this.previousVariations = [];
  }

  /**
   * Check for unsatisfied high-weight adjacencies
   */
  private checkUnsatisfiedAdjacencies(placed: PlacedRoom[], spec: FloorPlanSpecification): number {
    let unsatisfied = 0;
    
    for (const edge of spec.adjacencyGraph) {
      if (edge.weight >= 8) { // High priority
        const room1 = placed.find(p => p.id === edge.from);
        const room2 = placed.find(p => p.id === edge.to);
        
        if (room1 && room2 && !this.areAdjacent(room1, room2)) {
          unsatisfied++;
        }
      }
    }
    
    return unsatisfied;
  }

  /**
   * Check if any rooms overlap
   */
  private hasAnyOverlap(placed: PlacedRoom[]): boolean {
    const margin = 0.05;
    
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const r1 = placed[i];
        const r2 = placed[j];
        
        if (rectanglesOverlap(
          { x: r1.x - margin, y: r1.y - margin, width: r1.width + 2 * margin, height: r1.height + 2 * margin },
          { x: r2.x, y: r2.y, width: r2.width, height: r2.height }
        )) {
          return true;
        }
      }
    }
    
    return false;
  }

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
          spec: room,
          zone: room.zone
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
      spec: room,
      zone: room.zone
    };
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
