/**
 * Unit Tests for Multi-Objective Scorer
 */

import { describe, test, expect } from '@jest/globals';
import { multiObjectiveScorer } from '../stage-b/multi-objective-scorer';
import { FloorPlanSpecification } from '../types';
import { PlacedRoom } from '../stage-b/zone-based-placer';

describe('MultiObjectiveScorer', () => {
  const createTestSpec = (): FloorPlanSpecification => ({
    totalArea: 80,
    tolerance: 5,
    rooms: [
      { id: 'living', type: 'living', minArea: 20, maxArea: 25, aspectRatio: { min: 1.0, max: 1.6 }, zone: 'public', requiresWindow: true, requiresDoor: true, priority: 10 },
      { id: 'kitchen', type: 'kitchen', minArea: 10, maxArea: 14, aspectRatio: { min: 0.8, max: 1.5 }, zone: 'service', requiresWindow: true, requiresDoor: true, priority: 9 },
      { id: 'bedroom', type: 'bedroom', minArea: 12, maxArea: 16, aspectRatio: { min: 0.9, max: 1.4 }, zone: 'private', requiresWindow: true, requiresDoor: true, priority: 8 }
    ],
    adjacencyGraph: [
      { from: 'kitchen', to: 'living', weight: 8, type: 'should' },
      { from: 'bedroom', to: 'living', weight: 3, type: 'neutral' }
    ],
    constraints: [],
    style: 'modern',
    metadata: { floors: 1, entrance: 'north', preferences: {} }
  });

  const createTestPlacement = (): PlacedRoom[] => [
    { id: 'living', x: 0, y: 0, width: 5, height: 4.5, spec: createTestSpec().rooms[0], zone: 'public' },
    { id: 'kitchen', x: 5, y: 0, width: 3, height: 4, spec: createTestSpec().rooms[1], zone: 'service' },
    { id: 'bedroom', x: 0, y: 4.5, width: 4, height: 3.5, spec: createTestSpec().rooms[2], zone: 'private' }
  ];

  describe('score', () => {
    test('should return score object with all components', () => {
      const placed = createTestPlacement();
      const spec = createTestSpec();
      
      const score = multiObjectiveScorer.score(placed, spec, 10, 10);
      
      expect(score.total).toBeGreaterThan(0);
      expect(score.breakdown.areaCompliance).toBeDefined();
      expect(score.breakdown.adjacencySatisfaction).toBeDefined();
      expect(score.breakdown.compactness).toBeDefined();
      expect(score.breakdown.alignment).toBeDefined();
      expect(score.breakdown.naturalLight).toBeDefined();
    });

    test('should give high score for perfect area compliance', () => {
      const spec = createTestSpec();
      const placed: PlacedRoom[] = [
        { id: 'living', x: 0, y: 0, width: 5, height: 4.5, spec: spec.rooms[0], zone: 'public' }, // 22.5 m² (target: 22.5)
        { id: 'kitchen', x: 5, y: 0, width: 3, height: 4, spec: spec.rooms[1], zone: 'service' }, // 12 m² (target: 12)
        { id: 'bedroom', x: 0, y: 4.5, width: 4, height: 3.5, spec: spec.rooms[2], zone: 'private' } // 14 m² (target: 14)
      ];
      
      const score = multiObjectiveScorer.score(placed, spec, 10, 10);
      
      expect(score.breakdown.areaCompliance).toBeGreaterThan(80);
    });

    test('should give high score for satisfied adjacencies', () => {
      const spec = createTestSpec();
      const placed: PlacedRoom[] = [
        { id: 'kitchen', x: 0, y: 0, width: 3, height: 4, spec: spec.rooms[1], zone: 'service' },
        { id: 'living', x: 3, y: 0, width: 5, height: 4.5, spec: spec.rooms[0], zone: 'public' }, // Adjacent to kitchen
        { id: 'bedroom', x: 0, y: 4, width: 4, height: 3.5, spec: spec.rooms[2], zone: 'private' }
      ];
      
      const score = multiObjectiveScorer.score(placed, spec, 10, 10);
      
      expect(score.breakdown.adjacencySatisfaction).toBeGreaterThan(50);
      expect(score.details.satisfiedAdjacencies).toBeGreaterThan(0);
    });

    test('should reward compact rectangular layouts', () => {
      const spec = createTestSpec();
      const placed: PlacedRoom[] = [
        { id: 'living', x: 0, y: 0, width: 5, height: 4, spec: spec.rooms[0], zone: 'public' },
        { id: 'kitchen', x: 5, y: 0, width: 3, height: 4, spec: spec.rooms[1], zone: 'service' },
        { id: 'bedroom', x: 0, y: 4, width: 8, height: 2, spec: spec.rooms[2], zone: 'private' }
      ];
      
      const score = multiObjectiveScorer.score(placed, spec, 8, 6);
      
      expect(score.breakdown.compactness).toBeGreaterThan(0);
    });

    test('should reward natural light (exterior wall touching)', () => {
      const spec = createTestSpec();
      const placed: PlacedRoom[] = [
        { id: 'living', x: 0, y: 0, width: 5, height: 4, spec: spec.rooms[0], zone: 'public' }, // Touches left and bottom
        { id: 'kitchen', x: 5, y: 0, width: 3, height: 4, spec: spec.rooms[1], zone: 'service' }, // Touches right and bottom
        { id: 'bedroom', x: 0, y: 4, width: 5, height: 2, spec: spec.rooms[2], zone: 'private' } // Touches left and top
      ];
      
      const score = multiObjectiveScorer.score(placed, spec, 8, 6);
      
      expect(score.breakdown.naturalLight).toBeGreaterThan(80); // All rooms touch exterior
      expect(score.details.exteriorWallRooms).toBe(3);
    });

    test('should penalize poor area compliance', () => {
      const spec = createTestSpec();
      const placed: PlacedRoom[] = [
        { id: 'living', x: 0, y: 0, width: 2, height: 2, spec: spec.rooms[0], zone: 'public' }, // 4 m² (way too small)
        { id: 'kitchen', x: 2, y: 0, width: 1, height: 1, spec: spec.rooms[1], zone: 'service' }, // 1 m² (way too small)
        { id: 'bedroom', x: 0, y: 2, width: 2, height: 2, spec: spec.rooms[2], zone: 'private' } // 4 m² (way too small)
      ];
      
      const score = multiObjectiveScorer.score(placed, spec, 10, 10);
      
      expect(score.breakdown.areaCompliance).toBeLessThan(50);
    });

    test('should calculate total score as weighted sum', () => {
      const placed = createTestPlacement();
      const spec = createTestSpec();
      
      const score = multiObjectiveScorer.score(placed, spec, 10, 10);
      
      const expectedTotal = 
        score.breakdown.areaCompliance * 0.35 +
        score.breakdown.adjacencySatisfaction * 0.30 +
        score.breakdown.compactness * 0.15 +
        score.breakdown.alignment * 0.10 +
        score.breakdown.naturalLight * 0.10;
      
      expect(Math.abs(score.total - expectedTotal)).toBeLessThan(0.1);
    });
  });

  describe('details', () => {
    test('should provide area deviations for each room', () => {
      const placed = createTestPlacement();
      const spec = createTestSpec();
      
      const score = multiObjectiveScorer.score(placed, spec, 10, 10);
      
      expect(score.details.areaDeviations.size).toBe(3);
      expect(score.details.areaDeviations.has('living')).toBe(true);
      expect(score.details.areaDeviations.has('kitchen')).toBe(true);
      expect(score.details.areaDeviations.has('bedroom')).toBe(true);
    });

    test('should count satisfied and total adjacencies', () => {
      const placed = createTestPlacement();
      const spec = createTestSpec();
      
      const score = multiObjectiveScorer.score(placed, spec, 10, 10);
      
      expect(score.details.totalAdjacencies).toBe(2);
      expect(score.details.satisfiedAdjacencies).toBeGreaterThanOrEqual(0);
      expect(score.details.satisfiedAdjacencies).toBeLessThanOrEqual(2);
    });
  });
});
