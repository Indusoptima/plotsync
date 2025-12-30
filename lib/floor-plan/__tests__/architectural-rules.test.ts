/**
 * Unit Tests for Architectural Rule Engine
 */

import { describe, test, expect } from '@jest/globals';
import { 
  architecturalRules, 
  ROOM_STANDARDS,
  MANDATORY_ADJACENCIES,
  classifyBuildingTypology 
} from '../stage-a/architectural-rules';

describe('ArchitecturalRuleEngine', () => {
  describe('validateRoom', () => {
    test('should pass validation for valid bedroom', () => {
      const issues = architecturalRules.validateRoom('bedroom', 14, { width: 4.0, height: 3.5 });
      const errors = issues.filter(i => i.severity === 'error');
      expect(errors.length).toBe(0);
    });

    test('should fail validation for bedroom below minimum area', () => {
      const issues = architecturalRules.validateRoom('bedroom', 6, { width: 3.0, height: 2.0 });
      const errors = issues.filter(i => i.severity === 'error');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].rule).toBe('MIN_AREA');
    });

    test('should warn for bedroom above maximum area', () => {
      const issues = architecturalRules.validateRoom('bedroom', 30, { width: 6.0, height: 5.0 });
      const warnings = issues.filter(i => i.severity === 'warning');
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].rule).toBe('MAX_AREA');
    });

    test('should fail validation for bathroom below minimum dimension', () => {
      const issues = architecturalRules.validateRoom('bathroom', 4, { width: 1.5, height: 2.67 });
      const errors = issues.filter(i => i.severity === 'error');
      expect(errors.some(e => e.rule === 'MIN_DIMENSION')).toBe(true);
    });

    test('should warn for poor aspect ratio', () => {
      const issues = architecturalRules.validateRoom('living', 25, { width: 10.0, height: 2.5 });
      const warnings = issues.filter(i => i.severity === 'warning');
      expect(warnings.some(w => w.rule === 'ASPECT_RATIO')).toBe(true);
    });
  });

  describe('validateAreaDistribution', () => {
    test('should pass for balanced area distribution', () => {
      const totalArea = 80;
      const roomAreas = new Map([
        ['living', 22],
        ['kitchen', 12],
        ['bedroom1', 14],
        ['bedroom2', 12],
        ['bathroom', 5]
      ]);
      
      const issues = architecturalRules.validateAreaDistribution(totalArea, roomAreas);
      const errors = issues.filter(i => i.severity === 'error');
      expect(errors.length).toBe(0);
    });

    test('should fail when room areas exceed total area', () => {
      const totalArea = 50;
      const roomAreas = new Map([
        ['living', 30],
        ['bedroom', 25],
        ['bathroom', 10]
      ]);
      
      const issues = architecturalRules.validateAreaDistribution(totalArea, roomAreas);
      const errors = issues.filter(i => i.severity === 'error');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].rule).toBe('AREA_OVERFLOW');
    });

    test('should warn for underutilized space', () => {
      const totalArea = 100;
      const roomAreas = new Map([
        ['bedroom', 12],
        ['bathroom', 5]
      ]);
      
      const issues = architecturalRules.validateAreaDistribution(totalArea, roomAreas);
      const warnings = issues.filter(i => i.severity === 'warning');
      expect(warnings.some(w => w.rule === 'AREA_UNDERUTILIZATION')).toBe(true);
    });
  });

  describe('getAdjacencyWeight', () => {
    test('should return weight 10 for kitchen-dining adjacency', () => {
      const weight = architecturalRules.getAdjacencyWeight('kitchen', 'dining');
      expect(weight).toBe(10);
    });

    test('should return weight 10 for bedroom-bathroom adjacency', () => {
      const weight = architecturalRules.getAdjacencyWeight('bedroom', 'bathroom');
      expect(weight).toBe(10);
    });

    test('should return default weight 3 for unspecified adjacency', () => {
      const weight = architecturalRules.getAdjacencyWeight('study', 'garage');
      expect(weight).toBe(3);
    });

    test('should be symmetric', () => {
      const weight1 = architecturalRules.getAdjacencyWeight('kitchen', 'dining');
      const weight2 = architecturalRules.getAdjacencyWeight('dining', 'kitchen');
      expect(weight1).toBe(weight2);
    });
  });

  describe('validateAdjacencyFeasibility', () => {
    test('should pass for reasonable adjacency graph', () => {
      const adjacencies = [
        { from: 'kitchen', to: 'dining', weight: 10 },
        { from: 'living', to: 'kitchen', weight: 7 },
        { from: 'bedroom', to: 'bathroom', weight: 8 }
      ];
      
      const issues = architecturalRules.validateAdjacencyFeasibility(adjacencies);
      const errors = issues.filter(i => i.severity === 'error');
      expect(errors.length).toBe(0);
    });

    test('should fail when room has too many must-adjacencies', () => {
      const adjacencies = [
        { from: 'kitchen', to: 'dining', weight: 10 },
        { from: 'kitchen', to: 'living', weight: 10 },
        { from: 'kitchen', to: 'utility', weight: 10 },
        { from: 'kitchen', to: 'hallway', weight: 10 },
        { from: 'kitchen', to: 'bedroom', weight: 10 }
      ];
      
      const issues = architecturalRules.validateAdjacencyFeasibility(adjacencies);
      const errors = issues.filter(i => i.severity === 'error');
      expect(errors.some(e => e.rule === 'EXCESS_MUST_ADJACENCIES')).toBe(true);
    });
  });
});

describe('classifyBuildingTypology', () => {
  test('should classify as studio for small area', () => {
    expect(classifyBuildingTypology(30, 1)).toBe('studio');
  });

  test('should classify as apartment for medium area and few rooms', () => {
    expect(classifyBuildingTypology(80, 5)).toBe('apartment');
  });

  test('should classify as townhouse for larger area', () => {
    expect(classifyBuildingTypology(150, 7)).toBe('townhouse');
  });

  test('should classify as villa for very large area', () => {
    expect(classifyBuildingTypology(300, 9)).toBe('villa');
  });

  test('should classify as mansion for huge area', () => {
    expect(classifyBuildingTypology(450, 12)).toBe('mansion');
  });
});

describe('ROOM_STANDARDS', () => {
  test('should have standards for all room types', () => {
    const roomTypes = ['bedroom', 'bathroom', 'kitchen', 'living', 'dining', 'hallway', 'study', 'utility', 'garage', 'balcony'];
    
    roomTypes.forEach(type => {
      expect(ROOM_STANDARDS[type as keyof typeof ROOM_STANDARDS]).toBeDefined();
      expect(ROOM_STANDARDS[type as keyof typeof ROOM_STANDARDS].minArea).toBeGreaterThan(0);
      expect(ROOM_STANDARDS[type as keyof typeof ROOM_STANDARDS].maxArea).toBeGreaterThan(0);
    });
  });

  test('bedroom standards should be reasonable', () => {
    const bedroom = ROOM_STANDARDS.bedroom;
    expect(bedroom.minArea).toBe(9);
    expect(bedroom.maxArea).toBe(25);
    expect(bedroom.minDimension).toBe(3.0);
  });

  test('bathroom standards should be reasonable', () => {
    const bathroom = ROOM_STANDARDS.bathroom;
    expect(bathroom.minArea).toBe(3.5);
    expect(bathroom.minDimension).toBe(1.8);
  });
});

describe('MANDATORY_ADJACENCIES', () => {
  test('should include kitchen-dining adjacency', () => {
    const kitchenDining = MANDATORY_ADJACENCIES.find(
      a => (a.from === 'kitchen' && a.to === 'dining') || (a.from === 'dining' && a.to === 'kitchen')
    );
    expect(kitchenDining).toBeDefined();
    expect(kitchenDining?.weight).toBe(10);
    expect(kitchenDining?.type).toBe('must');
  });

  test('should include avoid adjacencies', () => {
    const avoidAdjacencies = MANDATORY_ADJACENCIES.filter(a => a.type === 'avoid');
    expect(avoidAdjacencies.length).toBeGreaterThan(0);
  });

  test('all adjacencies should have valid weights', () => {
    MANDATORY_ADJACENCIES.forEach(adj => {
      expect(adj.weight).toBeGreaterThanOrEqual(0);
      expect(adj.weight).toBeLessThanOrEqual(10);
    });
  });
});
