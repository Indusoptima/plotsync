/**
 * Unit Tests for Multi-Pass Validator
 */

import { describe, test, expect } from '@jest/globals';
import { multiPassValidator } from '../stage-a/multi-pass-validator';
import { FloorPlanSpecification } from '../types';

describe('MultiPassValidator', () => {
  const createValidSpec = (): FloorPlanSpecification => ({
    totalArea: 80,
    tolerance: 5,
    rooms: [
      {
        id: 'living',
        type: 'living',
        minArea: 20,
        maxArea: 25,
        aspectRatio: { min: 1.0, max: 1.6 },
        zone: 'public',
        requiresWindow: true,
        requiresDoor: true,
        priority: 10
      },
      {
        id: 'kitchen',
        type: 'kitchen',
        minArea: 10,
        maxArea: 14,
        aspectRatio: { min: 0.8, max: 1.5 },
        zone: 'service',
        requiresWindow: true,
        requiresDoor: true,
        priority: 9
      },
      {
        id: 'bedroom',
        type: 'bedroom',
        minArea: 12,
        maxArea: 16,
        aspectRatio: { min: 0.9, max: 1.4 },
        zone: 'private',
        requiresWindow: true,
        requiresDoor: true,
        priority: 8
      },
      {
        id: 'bathroom',
        type: 'bathroom',
        minArea: 4,
        maxArea: 6,
        aspectRatio: { min: 0.7, max: 1.5 },
        zone: 'private',
        requiresWindow: false,
        requiresDoor: true,
        priority: 7
      }
    ],
    adjacencyGraph: [
      { from: 'kitchen', to: 'living', weight: 8, type: 'should' },
      { from: 'bedroom', to: 'bathroom', weight: 7, type: 'should' }
    ],
    constraints: [],
    style: 'modern',
    metadata: {
      floors: 1,
      entrance: 'north',
      preferences: {}
    }
  });

  describe('validate', () => {
    test('should pass validation for valid specification', () => {
      const spec = createValidSpec();
      const result = multiPassValidator.validate(spec);
      
      expect(result.finalValid).toBe(true);
      expect(result.totalIssues.errors).toBe(0);
    });

    test('should detect total area overflow', () => {
      const spec = createValidSpec();
      spec.rooms[0].minArea = 50;
      spec.rooms[0].maxArea = 60;
      
      const result = multiPassValidator.validate(spec);
      
      expect(result.finalValid).toBe(false);
      expect(result.totalIssues.errors).toBeGreaterThan(0);
    });

    test('should detect invalid aspect ratios', () => {
      const spec = createValidSpec();
      spec.rooms[0].aspectRatio = { min: 3.5, max: 4.0 };
      
      const result = multiPassValidator.validate(spec);
      
      const issues = result.passResults.flatMap(r => r.issues);
      expect(issues.some(i => i.rule === 'INVALID_ASPECT_RATIO' || i.rule === 'ASPECT_RATIO')).toBe(true);
    });

    test('should detect invalid adjacency references', () => {
      const spec = createValidSpec();
      spec.adjacencyGraph.push({ from: 'nonexistent', to: 'living', weight: 8, type: 'should' });
      
      const result = multiPassValidator.validate(spec);
      
      expect(result.finalValid).toBe(false);
      const issues = result.passResults.flatMap(r => r.issues);
      expect(issues.some(i => i.rule === 'INVALID_ADJACENCY_REFERENCE')).toBe(true);
    });

    test('should detect excess must-adjacencies', () => {
      const spec = createValidSpec();
      spec.adjacencyGraph = [
        { from: 'living', to: 'kitchen', weight: 10, type: 'must' },
        { from: 'living', to: 'bedroom', weight: 10, type: 'must' },
        { from: 'living', to: 'bathroom', weight: 10, type: 'must' },
        { from: 'kitchen', to: 'bedroom', weight: 10, type: 'must' }
      ];
      
      const result = multiPassValidator.validate(spec);
      
      const issues = result.passResults.flatMap(r => r.issues);
      expect(issues.some(i => i.rule === 'EXCESS_MUST_ADJACENCIES')).toBe(true);
    });

    test('should warn about missing hallway for large layouts', () => {
      const spec = createValidSpec();
      // Add more rooms but no hallway
      spec.rooms.push(
        { id: 'bedroom2', type: 'bedroom', minArea: 10, maxArea: 14, aspectRatio: { min: 0.9, max: 1.4 }, zone: 'private', requiresWindow: true, requiresDoor: true },
        { id: 'bedroom3', type: 'bedroom', minArea: 10, maxArea: 14, aspectRatio: { min: 0.9, max: 1.4 }, zone: 'private', requiresWindow: true, requiresDoor: true }
      );
      spec.totalArea = 120;
      
      const result = multiPassValidator.validate(spec);
      
      const issues = result.passResults.flatMap(r => r.issues);
      expect(issues.some(i => i.rule === 'MISSING_HALLWAY')).toBe(true);
    });

    test('should warn about bathroom-kitchen adjacency', () => {
      const spec = createValidSpec();
      spec.adjacencyGraph.push({ from: 'bathroom', to: 'kitchen', weight: 8, type: 'should' });
      
      const result = multiPassValidator.validate(spec);
      
      const issues = result.passResults.flatMap(r => r.issues);
      expect(issues.some(i => i.rule === 'BATHROOM_KITCHEN_ADJACENCY')).toBe(true);
    });

    test('should provide corrected specification when auto-corrections applied', () => {
      const spec = createValidSpec();
      spec.rooms[0].aspectRatio = { min: 0.2, max: 4.0 }; // Invalid
      
      const result = multiPassValidator.validate(spec);
      
      if (result.correctedSpec) {
        expect(result.correctedSpec.rooms[0].aspectRatio.min).toBeGreaterThanOrEqual(0.3);
        expect(result.correctedSpec.rooms[0].aspectRatio.max).toBeLessThanOrEqual(3.0);
      }
    });
  });

  describe('generateReport', () => {
    test('should generate readable validation report', () => {
      const spec = createValidSpec();
      const result = multiPassValidator.validate(spec);
      const report = multiPassValidator.generateReport(result);
      
      expect(report).toContain('Floor Plan Specification Validation Report');
      expect(report).toContain('Overall Status');
      expect(report).toContain('Total Issues');
    });

    test('should include pass results in report', () => {
      const spec = createValidSpec();
      const result = multiPassValidator.validate(spec);
      const report = multiPassValidator.generateReport(result);
      
      expect(report).toContain('Total Area Compliance');
      expect(report).toContain('Room Proportion Check');
      expect(report).toContain('Adjacency Feasibility Check');
    });

    test('should show errors and warnings in report', () => {
      const spec = createValidSpec();
      spec.rooms[0].minArea = 100; // Overflow
      
      const result = multiPassValidator.validate(spec);
      const report = multiPassValidator.generateReport(result);
      
      expect(report).toContain('[ERROR]');
    });
  });
});
