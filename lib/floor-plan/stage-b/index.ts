/**
 * Stage B: Specification to 2D Geometric Layout
 * Main orchestrator for Stage B
 */

import { FloorPlanSpecification, FloorPlanGeometry, FloorPlanError, RoomGeometry } from '../types';
import { Timer, polygonArea, polygonCentroid, boundingBox, generateId } from '../utils';
import { ConstraintSolver } from './constraint-solver';
import { WallSynthesizer } from './wall-synthesizer';
import { OpeningPlacer } from './opening-placer';
import { GeometricValidator } from './geometric-validator';

export interface StageBResult {
  geometry: FloorPlanGeometry;
  metadata: {
    generationTime: number;
    iterations: number;
    relaxedConstraints: string[];
    validationWarnings: string[];
  };
}

export class StageBOrchestrator {
  private solver: ConstraintSolver;
  private wallSynthesizer: WallSynthesizer;
  private openingPlacer: OpeningPlacer;
  private validator: GeometricValidator;

  constructor() {
    this.solver = new ConstraintSolver();
    this.wallSynthesizer = new WallSynthesizer();
    this.openingPlacer = new OpeningPlacer();
    this.validator = new GeometricValidator();
  }

  /**
   * Generate 2D geometric layout from specification
   */
  async generate(spec: FloorPlanSpecification): Promise<StageBResult> {
    const timer = new Timer();
    timer.start();

    try {
      // Step 1: Solve room placement constraints
      const solution = this.solver.solve(spec);
      
      if (!solution.solved && solution.relaxedConstraints.length > 5) {
        throw new FloorPlanError(
          'Could not find valid room placement',
          'B',
          true,
          { relaxedConstraints: solution.relaxedConstraints }
        );
      }

      // Step 2: Convert room placements to geometry
      const rooms = this.convertToRoomGeometry(solution.rooms, spec);

      // Step 3: Generate walls
      const walls = this.wallSynthesizer.synthesize(solution.rooms);

      // Step 4: Place doors and windows
      const openings = this.openingPlacer.placeOpenings(
        solution.rooms.map(r => ({
          ...r,
          spec: spec.rooms.find(sr => sr.id === r.id)!
        })),
        walls,
        spec
      );

      // Step 5: Calculate building dimensions
      const allVertices = rooms.flatMap(r => r.geometry.vertices);
      const buildingBounds = boundingBox(allVertices);

      // Step 6: Build adjacency graph from actual layout
      const adjacencyGraph = this.buildAdjacencyGraph(rooms, walls, openings);

      // Step 7: Assemble geometry
      const geometry: FloorPlanGeometry = {
        metadata: {
          totalArea: spec.totalArea,
          buildingDimensions: {
            width: buildingBounds.width,
            height: buildingBounds.height
          },
          generatedAt: new Date().toISOString(),
          algorithmVersion: '1.0.0',
          confidence: this.calculateConfidence(solution, spec),
          relaxedConstraints: solution.relaxedConstraints
        },
        rooms,
        walls,
        openings,
        adjacencyGraph
      };

      // Step 8: Validate geometry
      const validationResult = this.validator.validate(geometry);
      
      if (!validationResult.valid) {
        const criticalErrors = validationResult.errors;
        if (criticalErrors.length > 2) {
          throw new FloorPlanError(
            `Geometry validation failed: ${criticalErrors.join('; ')}`,
            'B',
            true,
            { validation: validationResult }
          );
        }
      }

      const generationTime = timer.stop();

      return {
        geometry,
        metadata: {
          generationTime,
          iterations: solution.iterations,
          relaxedConstraints: solution.relaxedConstraints,
          validationWarnings: validationResult.warnings
        }
      };

    } catch (error) {
      if (error instanceof FloorPlanError) {
        throw error;
      }
      throw new FloorPlanError(
        `Stage B failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'B',
        false,
        error
      );
    }
  }

  /**
   * Convert solver output to room geometry
   */
  private convertToRoomGeometry(
    placedRooms: Array<{ id: string; x: number; y: number; width: number; height: number }>,
    spec: FloorPlanSpecification
  ): RoomGeometry[] {
    return placedRooms.map(room => {
      const roomSpec = spec.rooms.find(r => r.id === room.id);
      
      // Create rectangle vertices (clockwise from bottom-left)
      const vertices = [
        { x: room.x, y: room.y },
        { x: room.x + room.width, y: room.y },
        { x: room.x + room.width, y: room.y + room.height },
        { x: room.x, y: room.y + room.height }
      ];

      const area = polygonArea(vertices);
      const centroid = polygonCentroid(vertices);

      return {
        id: room.id,
        type: roomSpec?.type || 'bedroom',
        geometry: {
          vertices,
          centroid,
          area,
          bounds: {
            x: room.x,
            y: room.y,
            width: room.width,
            height: room.height
          }
        },
        labels: {
          name: this.formatRoomName(room.id, roomSpec?.type),
          area: `${area.toFixed(1)} m²`,
          dimensions: `${room.width.toFixed(2)} × ${room.height.toFixed(2)} m`
        }
      };
    });
  }

  /**
   * Build adjacency graph from actual layout
   */
  private buildAdjacencyGraph(
    rooms: RoomGeometry[],
    walls: any[],
    openings: any[]
  ) {
    const nodes = rooms.map(r => ({
      roomId: r.id,
      zone: 'public' as const // Simplified - would use room spec
    }));

    const edges: Array<{ from: string; to: string; type: 'door' | 'open' | 'hallway' }> = [];

    // Find connections through doors
    for (const opening of openings) {
      if (opening.type === 'door') {
        const wall = walls.find(w => w.id === opening.wallId);
        if (wall && wall.adjacentRooms.length === 2) {
          edges.push({
            from: wall.adjacentRooms[0],
            to: wall.adjacentRooms[1],
            type: 'door'
          });
        }
      }
    }

    return { nodes, edges };
  }

  /**
   * Format room name for display
   */
  private formatRoomName(id: string, type?: string): string {
    if (!type) return id;
    
    const typeNames: Record<string, string> = {
      bedroom: 'Bedroom',
      bathroom: 'Bathroom',
      kitchen: 'Kitchen',
      living: 'Living Room',
      dining: 'Dining Room',
      hallway: 'Hallway',
      study: 'Study',
      utility: 'Utility',
      garage: 'Garage',
      balcony: 'Balcony'
    };

    return typeNames[type] || type.charAt(0).toUpperCase() + type.slice(1);
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(solution: any, spec: FloorPlanSpecification): number {
    let confidence = 100;

    // Reduce for relaxed constraints
    confidence -= solution.relaxedConstraints.length * 5;

    // Reduce if many iterations needed
    if (solution.iterations > 500) confidence -= 10;

    return Math.max(0, Math.min(100, confidence));
  }
}

// Export all Stage B components
export { ConstraintSolver } from './constraint-solver';
export { WallSynthesizer } from './wall-synthesizer';
export { OpeningPlacer } from './opening-placer';
export { GeometricValidator } from './geometric-validator';
