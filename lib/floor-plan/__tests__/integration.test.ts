/**
 * Integration Tests for Complete Floor Plan Generation Pipeline
 */

import { describe, test, expect } from '@jest/globals';
import { multiPassValidator } from '../stage-a/multi-pass-validator';
import { ConstraintSolver } from '../stage-b/constraint-solver';
import { multiObjectiveScorer } from '../stage-b/multi-objective-scorer';
import { FloorPlanSpecification } from '../types';

describe('Integration Tests - Complete Pipeline', () => {
  
  describe('Scenario 1: Simple Studio (1 room, 30m²)', () => {
    const studioSpec: FloorPlanSpecification = {
      totalArea: 30,
      tolerance: 5,
      rooms: [
        {
          id: 'studio',
          type: 'living',
          minArea: 22,
          maxArea: 26,
          aspectRatio: { min: 1.0, max: 1.5 },
          zone: 'public',
          requiresWindow: true,
          requiresDoor: true,
          priority: 10
        }
      ],
      adjacencyGraph: [],
      constraints: [],
      style: 'modern',
      metadata: { floors: 1, entrance: 'north', preferences: { openPlan: true } }
    };

    test('should validate studio specification', () => {
      const validation = multiPassValidator.validate(studioSpec);
      expect(validation.finalValid).toBe(true);
      expect(validation.totalIssues.errors).toBe(0);
    });

    test('should solve studio layout without errors', () => {
      const solver = new ConstraintSolver();
      const solution = solver.solve(studioSpec);
      
      expect(solution.rooms.length).toBe(1);
      expect(solution.solved).toBe(true);
      expect(solution.relaxedConstraints.length).toBe(0);
    });

    test('should achieve high quality score for studio', () => {
      const solver = new ConstraintSolver();
      const solution = solver.solve(studioSpec);
      
      const buildingWidth = 6;
      const buildingHeight = 5;
      
      const placedRooms = solution.rooms.map(r => ({
        ...r,
        spec: studioSpec.rooms.find(s => s.id === r.id)!,
        zone: studioSpec.rooms.find(s => s.id === r.id)!.zone
      }));
      
      const score = multiObjectiveScorer.score(placedRooms, studioSpec, buildingWidth, buildingHeight);
      
      expect(score.total).toBeGreaterThan(60);
      expect(score.breakdown.areaCompliance).toBeGreaterThan(70);
    });
  });

  describe('Scenario 2: 2-Bedroom Apartment (5 rooms, 80m²)', () => {
    const apartmentSpec: FloorPlanSpecification = {
      totalArea: 80,
      tolerance: 5,
      rooms: [
        { id: 'living', type: 'living', minArea: 20, maxArea: 25, aspectRatio: { min: 1.0, max: 1.6 }, zone: 'public', requiresWindow: true, requiresDoor: true, priority: 10 },
        { id: 'kitchen', type: 'kitchen', minArea: 10, maxArea: 14, aspectRatio: { min: 0.8, max: 1.5 }, zone: 'service', requiresWindow: true, requiresDoor: true, priority: 9 },
        { id: 'bedroom1', type: 'bedroom', minArea: 12, maxArea: 16, aspectRatio: { min: 0.9, max: 1.4 }, zone: 'private', requiresWindow: true, requiresDoor: true, priority: 8 },
        { id: 'bedroom2', type: 'bedroom', minArea: 10, maxArea: 14, aspectRatio: { min: 0.9, max: 1.4 }, zone: 'private', requiresWindow: true, requiresDoor: true, priority: 7 },
        { id: 'bathroom', type: 'bathroom', minArea: 4, maxArea: 6, aspectRatio: { min: 0.7, max: 1.5 }, zone: 'private', requiresWindow: false, requiresDoor: true, priority: 6 },
        { id: 'hallway', type: 'hallway', minArea: 4, maxArea: 6, aspectRatio: { min: 0.3, max: 0.7 }, zone: 'public', requiresWindow: false, requiresDoor: false, priority: 5 }
      ],
      adjacencyGraph: [
        { from: 'kitchen', to: 'living', weight: 9, type: 'should' },
        { from: 'bedroom1', to: 'bathroom', weight: 7, type: 'should' },
        { from: 'hallway', to: 'living', weight: 8, type: 'must' },
        { from: 'hallway', to: 'bedroom1', weight: 8, type: 'must' },
        { from: 'hallway', to: 'bedroom2', weight: 8, type: 'must' }
      ],
      constraints: [
        { type: 'minDimension', room: 'bedroom1', value: 3.0, priority: 'strong' },
        { type: 'minDimension', room: 'kitchen', value: 2.5, priority: 'strong' }
      ],
      style: 'modern',
      metadata: { floors: 1, entrance: 'north', preferences: { openPlan: false } }
    };

    test('should validate 2BR apartment specification', () => {
      const validation = multiPassValidator.validate(apartmentSpec);
      expect(validation.finalValid).toBe(true);
      expect(validation.totalIssues.errors).toBe(0);
    });

    test('should solve 2BR apartment layout', () => {
      const solver = new ConstraintSolver();
      const solution = solver.solve(apartmentSpec);
      
      expect(solution.rooms.length).toBe(6);
      expect(solution.solved).toBe(true);
    });

    test('should place all rooms without overlaps', () => {
      const solver = new ConstraintSolver();
      const solution = solver.solve(apartmentSpec);
      
      // Check for overlaps
      for (let i = 0; i < solution.rooms.length; i++) {
        for (let j = i + 1; j < solution.rooms.length; j++) {
          const r1 = solution.rooms[i];
          const r2 = solution.rooms[j];
          
          const overlap = !(
            r1.x + r1.width <= r2.x ||
            r2.x + r2.width <= r1.x ||
            r1.y + r1.height <= r2.y ||
            r2.y + r2.height <= r1.y
          );
          
          expect(overlap).toBe(false);
        }
      }
    });

    test('should achieve high adjacency satisfaction', () => {
      const solver = new ConstraintSolver();
      const solution = solver.solve(apartmentSpec);
      
      const buildingWidth = 11;
      const buildingHeight = 7.3;
      
      const placedRooms = solution.rooms.map(r => ({
        ...r,
        spec: apartmentSpec.rooms.find(s => s.id === r.id)!,
        zone: apartmentSpec.rooms.find(s => s.id === r.id)!.zone
      }));
      
      const score = multiObjectiveScorer.score(placedRooms, apartmentSpec, buildingWidth, buildingHeight);
      
      expect(score.breakdown.adjacencySatisfaction).toBeGreaterThan(50);
      expect(score.details.satisfiedAdjacencies).toBeGreaterThan(2);
    });
  });

  describe('Scenario 3: 3-Bedroom Villa with Ensuite (8 rooms, 150m²)', () => {
    const villaSpec: FloorPlanSpecification = {
      totalArea: 150,
      tolerance: 5,
      rooms: [
        { id: 'living_dining', type: 'living', minArea: 35, maxArea: 45, aspectRatio: { min: 1.2, max: 2.0 }, zone: 'public', requiresWindow: true, requiresDoor: true, priority: 10 },
        { id: 'kitchen', type: 'kitchen', minArea: 15, maxArea: 20, aspectRatio: { min: 0.7, max: 1.5 }, zone: 'service', requiresWindow: true, requiresDoor: false, priority: 9 },
        { id: 'master_bedroom', type: 'bedroom', minArea: 18, maxArea: 25, aspectRatio: { min: 0.8, max: 1.4 }, zone: 'private', requiresWindow: true, requiresDoor: true, priority: 8 },
        { id: 'master_ensuite', type: 'bathroom', minArea: 6, maxArea: 9, aspectRatio: { min: 0.7, max: 1.3 }, zone: 'private', requiresWindow: true, requiresDoor: true, priority: 7 },
        { id: 'bedroom2', type: 'bedroom', minArea: 12, maxArea: 16, aspectRatio: { min: 0.7, max: 1.4 }, zone: 'private', requiresWindow: true, requiresDoor: true, priority: 6 },
        { id: 'bedroom3', type: 'bedroom', minArea: 12, maxArea: 16, aspectRatio: { min: 0.7, max: 1.4 }, zone: 'private', requiresWindow: true, requiresDoor: true, priority: 5 },
        { id: 'bathroom', type: 'bathroom', minArea: 5, maxArea: 7, aspectRatio: { min: 0.7, max: 1.3 }, zone: 'private', requiresWindow: false, requiresDoor: true, priority: 4 },
        { id: 'hallway', type: 'hallway', minArea: 6, maxArea: 10, aspectRatio: { min: 0.3, max: 0.6 }, zone: 'public', requiresWindow: false, requiresDoor: false, priority: 3 }
      ],
      adjacencyGraph: [
        { from: 'kitchen', to: 'living_dining', weight: 10, type: 'must' },
        { from: 'master_bedroom', to: 'master_ensuite', weight: 10, type: 'must' },
        { from: 'hallway', to: 'living_dining', weight: 8, type: 'must' },
        { from: 'hallway', to: 'master_bedroom', weight: 8, type: 'must' },
        { from: 'hallway', to: 'bedroom2', weight: 8, type: 'must' },
        { from: 'hallway', to: 'bedroom3', weight: 8, type: 'must' },
        { from: 'hallway', to: 'bathroom', weight: 7, type: 'should' }
      ],
      constraints: [
        { type: 'adjacency', rooms: ['living_dining', 'kitchen'], value: 1.0, priority: 'required' }
      ],
      style: 'modern',
      metadata: { floors: 1, entrance: 'south', preferences: { openPlan: true, ensuites: true, gardenAccess: true } }
    };

    test('should validate 3BR villa specification', () => {
      const validation = multiPassValidator.validate(villaSpec);
      
      // May have warnings but should be valid
      expect(validation.totalIssues.errors).toBe(0);
    });

    test('should solve 3BR villa layout', () => {
      const solver = new ConstraintSolver();
      const solution = solver.solve(villaSpec);
      
      expect(solution.rooms.length).toBe(8);
    });

    test('should satisfy must-adjacent constraints', () => {
      const solver = new ConstraintSolver();
      const solution = solver.solve(villaSpec);
      
      const buildingWidth = 14;
      const buildingHeight = 10.7;
      
      const placedRooms = solution.rooms.map(r => ({
        ...r,
        spec: villaSpec.rooms.find(s => s.id === r.id)!,
        zone: villaSpec.rooms.find(s => s.id === r.id)!.zone
      }));
      
      const score = multiObjectiveScorer.score(placedRooms, villaSpec, buildingWidth, buildingHeight);
      
      // Should have high adjacency score due to must-adjacencies
      expect(score.details.satisfiedAdjacencies).toBeGreaterThan(4);
    });
  });

  describe('Scenario 4: Edge Cases', () => {
    test('should handle tiny area (20m²)', () => {
      const tinySpec: FloorPlanSpecification = {
        totalArea: 20,
        tolerance: 10,
        rooms: [
          { id: 'studio', type: 'living', minArea: 15, maxArea: 18, aspectRatio: { min: 1.0, max: 1.5 }, zone: 'public', requiresWindow: true, requiresDoor: true, priority: 10 }
        ],
        adjacencyGraph: [],
        constraints: [],
        style: 'minimalist',
        metadata: { floors: 1, entrance: 'north', preferences: {} }
      };

      const solver = new ConstraintSolver();
      const solution = solver.solve(tinySpec);
      
      expect(solution.rooms.length).toBe(1);
      expect(solution.rooms[0].width * solution.rooms[0].height).toBeGreaterThanOrEqual(15);
    });

    test('should handle large area (400m²)', () => {
      const largeSpec: FloorPlanSpecification = {
        totalArea: 400,
        tolerance: 5,
        rooms: [
          { id: 'living', type: 'living', minArea: 50, maxArea: 70, aspectRatio: { min: 1.2, max: 2.0 }, zone: 'public', requiresWindow: true, requiresDoor: true, priority: 10 },
          { id: 'kitchen', type: 'kitchen', minArea: 25, maxArea: 35, aspectRatio: { min: 1.0, max: 1.8 }, zone: 'service', requiresWindow: true, requiresDoor: true, priority: 9 },
          { id: 'master', type: 'bedroom', minArea: 30, maxArea: 40, aspectRatio: { min: 1.0, max: 1.5 }, zone: 'private', requiresWindow: true, requiresDoor: true, priority: 8 }
        ],
        adjacencyGraph: [
          { from: 'kitchen', to: 'living', weight: 8, type: 'should' }
        ],
        constraints: [],
        style: 'modern',
        metadata: { floors: 1, entrance: 'north', preferences: {} }
      };

      const solver = new ConstraintSolver();
      const solution = solver.solve(largeSpec);
      
      expect(solution.rooms.length).toBe(3);
      expect(solution.solved).toBe(true);
    });

    test('should handle extreme aspect ratio room', () => {
      const extremeSpec: FloorPlanSpecification = {
        totalArea: 50,
        tolerance: 5,
        rooms: [
          { id: 'hallway', type: 'hallway', minArea: 15, maxArea: 20, aspectRatio: { min: 0.3, max: 0.5 }, zone: 'public', requiresWindow: false, requiresDoor: false, priority: 10 },
          { id: 'living', type: 'living', minArea: 25, maxArea: 30, aspectRatio: { min: 1.0, max: 1.5 }, zone: 'public', requiresWindow: true, requiresDoor: true, priority: 9 }
        ],
        adjacencyGraph: [],
        constraints: [],
        style: 'modern',
        metadata: { floors: 1, entrance: 'north', preferences: {} }
      };

      const solver = new ConstraintSolver();
      const solution = solver.solve(extremeSpec);
      
      expect(solution.rooms.length).toBe(2);
      
      // Check hallway has extreme aspect ratio
      const hallway = solution.rooms.find(r => r.id === 'hallway')!;
      const aspectRatio = hallway.width / hallway.height;
      expect(aspectRatio).toBeLessThan(1.0); // Long and narrow
    });
  });

  describe('Quality Metrics', () => {
    test('should achieve zero overlaps consistently', () => {
      const specs = [
        { totalArea: 30, rooms: 1 },
        { totalArea: 80, rooms: 5 },
        { totalArea: 150, rooms: 8 }
      ];

      specs.forEach(({ totalArea, rooms: roomCount }) => {
        const spec: FloorPlanSpecification = {
          totalArea,
          tolerance: 5,
          rooms: Array.from({ length: roomCount }, (_, i) => ({
            id: `room${i}`,
            type: i === 0 ? 'living' as const : 'bedroom' as const,
            minArea: totalArea / (roomCount * 1.5),
            maxArea: totalArea / (roomCount * 1.2),
            aspectRatio: { min: 0.8, max: 1.5 },
            zone: i === 0 ? 'public' as const : 'private' as const,
            requiresWindow: true,
            requiresDoor: true,
            priority: 10 - i
          })),
          adjacencyGraph: [],
          constraints: [],
          style: 'modern',
          metadata: { floors: 1, entrance: 'north', preferences: {} }
        };

        const solver = new ConstraintSolver();
        const solution = solver.solve(spec);

        // Verify zero overlaps
        let overlapCount = 0;
        for (let i = 0; i < solution.rooms.length; i++) {
          for (let j = i + 1; j < solution.rooms.length; j++) {
            const r1 = solution.rooms[i];
            const r2 = solution.rooms[j];
            
            const overlap = !(
              r1.x + r1.width <= r2.x ||
              r2.x + r2.width <= r1.x ||
              r1.y + r1.height <= r2.y ||
              r2.y + r2.height <= r1.y
            );
            
            if (overlap) overlapCount++;
          }
        }

        expect(overlapCount).toBe(0);
      });
    });
  });
});
