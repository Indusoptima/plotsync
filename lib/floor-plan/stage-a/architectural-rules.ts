/**
 * Architectural Rule Engine
 * Defines and validates architectural standards for floor plans
 */

import { RoomType, ZoneType } from '../types';

// ============================================================================
// ROOM PROPORTION STANDARDS
// ============================================================================

export interface RoomStandard {
  minArea: number;
  maxArea: number;
  optimalArea: number;
  minDimension: number;
  optimalRatio: number;
  aspectRatioRange: { min: number; max: number };
}

export const ROOM_STANDARDS: Record<RoomType, RoomStandard> = {
  bedroom: {
    minArea: 9,
    maxArea: 25,
    optimalArea: 14,
    minDimension: 3.0,
    optimalRatio: 1.2,
    aspectRatioRange: { min: 0.9, max: 1.5 }
  },
  bathroom: {
    minArea: 3.5,
    maxArea: 8,
    optimalArea: 5,
    minDimension: 1.8,
    optimalRatio: 1.2,
    aspectRatioRange: { min: 0.7, max: 1.6 }
  },
  kitchen: {
    minArea: 8,
    maxArea: 18,
    optimalArea: 12,
    minDimension: 2.5,
    optimalRatio: 1.4,
    aspectRatioRange: { min: 0.8, max: 2.0 }
  },
  living: {
    minArea: 18,
    maxArea: 40,
    optimalArea: 25,
    minDimension: 4.0,
    optimalRatio: 1.5,
    aspectRatioRange: { min: 1.0, max: 1.8 }
  },
  dining: {
    minArea: 10,
    maxArea: 25,
    optimalArea: 15,
    minDimension: 3.0,
    optimalRatio: 1.3,
    aspectRatioRange: { min: 0.9, max: 1.6 }
  },
  hallway: {
    minArea: 2,
    maxArea: 8,
    optimalArea: 5,
    minDimension: 1.2,
    optimalRatio: 0.4,
    aspectRatioRange: { min: 0.3, max: 0.8 }
  },
  study: {
    minArea: 8,
    maxArea: 15,
    optimalArea: 10,
    minDimension: 2.5,
    optimalRatio: 1.2,
    aspectRatioRange: { min: 0.8, max: 1.5 }
  },
  utility: {
    minArea: 3,
    maxArea: 8,
    optimalArea: 5,
    minDimension: 1.8,
    optimalRatio: 1.1,
    aspectRatioRange: { min: 0.7, max: 1.5 }
  },
  garage: {
    minArea: 15,
    maxArea: 40,
    optimalArea: 25,
    minDimension: 3.5,
    optimalRatio: 1.3,
    aspectRatioRange: { min: 0.9, max: 1.6 }
  },
  balcony: {
    minArea: 4,
    maxArea: 15,
    optimalArea: 8,
    minDimension: 2.0,
    optimalRatio: 1.5,
    aspectRatioRange: { min: 0.7, max: 2.5 }
  }
};

// ============================================================================
// ADJACENCY RULES
// ============================================================================

export interface AdjacencyRule {
  from: RoomType | string;
  to: RoomType | string;
  weight: number; // 0-10
  type: 'must' | 'should' | 'neutral' | 'avoid';
  justification: string;
}

export const MANDATORY_ADJACENCIES: AdjacencyRule[] = [
  {
    from: 'kitchen',
    to: 'dining',
    weight: 10,
    type: 'must',
    justification: 'Functional workflow for food service'
  },
  {
    from: 'bedroom',
    to: 'bathroom',
    weight: 10,
    type: 'must',
    justification: 'Ensuite connection (when specified)'
  },
  {
    from: 'living',
    to: 'entrance',
    weight: 9,
    type: 'should',
    justification: 'Primary access to main living space'
  },
  {
    from: 'bathroom',
    to: 'hallway',
    weight: 8,
    type: 'should',
    justification: 'Privacy buffer from direct room access'
  },
  {
    from: 'kitchen',
    to: 'living',
    weight: 7,
    type: 'should',
    justification: 'Visual connection and social interaction'
  },
  {
    from: 'utility',
    to: 'kitchen',
    weight: 7,
    type: 'should',
    justification: 'Service zone efficiency'
  },
  {
    from: 'bedroom',
    to: 'living',
    weight: 2,
    type: 'avoid',
    justification: 'Privacy zoning separation'
  },
  {
    from: 'bathroom',
    to: 'kitchen',
    weight: 1,
    type: 'avoid',
    justification: 'Hygiene and building code separation'
  }
];

// ============================================================================
// ZONE CLASSIFICATION
// ============================================================================

export const ZONE_CLASSIFICATION: Record<RoomType, ZoneType> = {
  bedroom: 'private',
  bathroom: 'private',
  study: 'private',
  kitchen: 'service',
  utility: 'service',
  garage: 'service',
  living: 'public',
  dining: 'public',
  hallway: 'public',
  balcony: 'public'
};

// ============================================================================
// CIRCULATION REQUIREMENTS
// ============================================================================

export interface CirculationRequirements {
  minCorridorWidth: number;
  minDoorClearance: number;
  circulationPercentage: number; // Percentage of total area
}

export const CIRCULATION_STANDARDS: CirculationRequirements = {
  minCorridorWidth: 1.2,
  minDoorClearance: 1.0,
  circulationPercentage: 0.15 // 15% of total area
};

// ============================================================================
// BUILDING TYPOLOGY
// ============================================================================

export type BuildingTypology = 'studio' | 'apartment' | 'townhouse' | 'villa' | 'mansion';

export function classifyBuildingTypology(totalArea: number, roomCount: number): BuildingTypology {
  if (totalArea < 35) return 'studio';
  if (totalArea < 100 && roomCount <= 5) return 'apartment';
  if (totalArea < 200 && roomCount <= 8) return 'townhouse';
  if (totalArea < 400) return 'villa';
  return 'mansion';
}

// ============================================================================
// FUNCTIONAL REQUIREMENTS
// ============================================================================

export interface FunctionalRequirement {
  type: 'naturalLight' | 'ventilation' | 'furnitureClearance' | 'accessibility';
  description: string;
  minValue?: number;
  required: boolean;
}

export const FUNCTIONAL_REQUIREMENTS: Record<RoomType, FunctionalRequirement[]> = {
  bedroom: [
    { type: 'naturalLight', description: 'Window required for natural light', required: true },
    { type: 'ventilation', description: 'Cross-ventilation preferred', required: false },
    { type: 'furnitureClearance', description: 'Bed clearance 0.6m on sides', minValue: 0.6, required: true }
  ],
  living: [
    { type: 'naturalLight', description: 'Window required for natural light', required: true },
    { type: 'ventilation', description: 'Cross-ventilation preferred', required: false },
    { type: 'furnitureClearance', description: 'Seating clearance 0.8m', minValue: 0.8, required: true }
  ],
  kitchen: [
    { type: 'naturalLight', description: 'Window preferred', required: false },
    { type: 'ventilation', description: 'Ventilation required for cooking', required: true },
    { type: 'furnitureClearance', description: 'Work triangle clearance 0.9m', minValue: 0.9, required: true }
  ],
  bathroom: [
    { type: 'ventilation', description: 'Ventilation required (window or exhaust)', required: true },
    { type: 'accessibility', description: 'Door clearance 0.8m minimum', minValue: 0.8, required: true }
  ],
  dining: [
    { type: 'naturalLight', description: 'Window preferred', required: false },
    { type: 'furnitureClearance', description: 'Chair pullout clearance 0.8m', minValue: 0.8, required: true }
  ],
  study: [
    { type: 'naturalLight', description: 'Window required for workspace', required: true },
    { type: 'ventilation', description: 'Ventilation preferred', required: false }
  ],
  hallway: [
    { type: 'accessibility', description: 'Minimum width 1.2m', minValue: 1.2, required: true }
  ],
  utility: [
    { type: 'ventilation', description: 'Ventilation required', required: true }
  ],
  garage: [
    { type: 'accessibility', description: 'Vehicle clearance 3.0m width', minValue: 3.0, required: true }
  ],
  balcony: [
    { type: 'accessibility', description: 'Minimum width 1.5m for usability', minValue: 1.5, required: false }
  ]
};

// ============================================================================
// ENTRANCE STRATEGY
// ============================================================================

export interface EntranceStrategy {
  location: 'north' | 'south' | 'east' | 'west';
  type: 'direct_to_living' | 'foyer' | 'hallway' | 'mudroom';
  preferredAdjacentRooms: RoomType[];
  clearanceRequired: number;
}

export function determineEntranceStrategy(
  totalArea: number,
  roomTypes: RoomType[],
  typology: BuildingTypology
): EntranceStrategy {
  const hasLiving = roomTypes.includes('living');
  const hasHallway = roomTypes.includes('hallway');
  const hasUtility = roomTypes.includes('utility');

  // Determine entrance type based on building size and typology
  let type: EntranceStrategy['type'];
  if (typology === 'studio' || totalArea < 50) {
    type = 'direct_to_living';
  } else if (typology === 'mansion' || totalArea > 300) {
    type = 'foyer';
  } else if (hasUtility || typology === 'townhouse') {
    type = 'mudroom';
  } else {
    type = hasHallway ? 'hallway' : 'direct_to_living';
  }

  // Determine preferred adjacent rooms
  const preferredAdjacentRooms: RoomType[] = [];
  if (type === 'direct_to_living' && hasLiving) {
    preferredAdjacentRooms.push('living');
  }
  if (type === 'hallway' && hasHallway) {
    preferredAdjacentRooms.push('hallway');
  }
  if (type === 'mudroom' && hasUtility) {
    preferredAdjacentRooms.push('utility');
  }
  
  // Add living or dining as secondary options
  if (hasLiving && !preferredAdjacentRooms.includes('living')) {
    preferredAdjacentRooms.push('living');
  }
  if (roomTypes.includes('dining')) {
    preferredAdjacentRooms.push('dining');
  }

  // Default entrance location (south for most residential)
  const location = 'south';

  // Clearance based on building size
  const clearanceRequired = typology === 'mansion' ? 2.5 : 
                           typology === 'villa' ? 2.0 : 1.5;

  return {
    location,
    type,
    preferredAdjacentRooms,
    clearanceRequired
  };
}

// ============================================================================
// ARCHITECTURAL VALIDATION
// ============================================================================

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
  suggestion?: string;
}

export class ArchitecturalRuleEngine {
  
  /**
   * Validate room against architectural standards
   */
  validateRoom(
    roomType: RoomType,
    area: number,
    dimensions?: { width: number; height: number }
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const standard = ROOM_STANDARDS[roomType];

    // Area validation
    if (area < standard.minArea) {
      issues.push({
        severity: 'error',
        rule: 'MIN_AREA',
        message: `${roomType} area ${area.toFixed(1)}m² is below minimum ${standard.minArea}m²`,
        suggestion: `Increase area to at least ${standard.minArea}m²`
      });
    }

    if (area > standard.maxArea) {
      issues.push({
        severity: 'warning',
        rule: 'MAX_AREA',
        message: `${roomType} area ${area.toFixed(1)}m² exceeds typical maximum ${standard.maxArea}m²`,
        suggestion: `Consider reducing to ${standard.maxArea}m² or splitting into multiple rooms`
      });
    }

    // Dimensional validation
    if (dimensions) {
      const minDim = Math.min(dimensions.width, dimensions.height);
      if (minDim < standard.minDimension) {
        issues.push({
          severity: 'error',
          rule: 'MIN_DIMENSION',
          message: `${roomType} minimum dimension ${minDim.toFixed(2)}m is below required ${standard.minDimension}m`,
          suggestion: `Ensure at least one dimension is ≥ ${standard.minDimension}m`
        });
      }

      const aspectRatio = dimensions.width / dimensions.height;
      if (aspectRatio < standard.aspectRatioRange.min || aspectRatio > standard.aspectRatioRange.max) {
        issues.push({
          severity: 'warning',
          rule: 'ASPECT_RATIO',
          message: `${roomType} aspect ratio ${aspectRatio.toFixed(2)} outside optimal range ${standard.aspectRatioRange.min}-${standard.aspectRatioRange.max}`,
          suggestion: `Adjust proportions closer to ${standard.optimalRatio}`
        });
      }
    }

    return issues;
  }

  /**
   * Validate total area distribution
   */
  validateAreaDistribution(totalArea: number, roomAreas: Map<string, number>): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    const sumRoomAreas = Array.from(roomAreas.values()).reduce((sum, area) => sum + area, 0);
    const circulationArea = totalArea * CIRCULATION_STANDARDS.circulationPercentage;
    const effectiveArea = totalArea - circulationArea;
    
    if (sumRoomAreas > effectiveArea * 1.1) {
      issues.push({
        severity: 'error',
        rule: 'AREA_OVERFLOW',
        message: `Room areas (${sumRoomAreas.toFixed(1)}m²) exceed available space (${effectiveArea.toFixed(1)}m²)`,
        suggestion: `Reduce total room area by ${(sumRoomAreas - effectiveArea).toFixed(1)}m² or increase total area`
      });
    }

    if (sumRoomAreas < effectiveArea * 0.7) {
      issues.push({
        severity: 'warning',
        rule: 'AREA_UNDERUTILIZATION',
        message: `Room areas only use ${(sumRoomAreas / effectiveArea * 100).toFixed(0)}% of available space`,
        suggestion: 'Consider larger rooms or additional spaces'
      });
    }

    return issues;
  }

  /**
   * Get recommended adjacency weight for room pair
   */
  getAdjacencyWeight(room1: RoomType | string, room2: RoomType | string): number {
    const rule = MANDATORY_ADJACENCIES.find(
      r => (r.from === room1 && r.to === room2) || (r.from === room2 && r.to === room1)
    );
    
    return rule ? rule.weight : 3; // Default neutral weight
  }

  /**
   * Get adjacency type (must/should/neutral/avoid)
   */
  getAdjacencyType(room1: RoomType | string, room2: RoomType | string): 'must' | 'should' | 'neutral' | 'avoid' {
    const rule = MANDATORY_ADJACENCIES.find(
      r => (r.from === room1 && r.to === room2) || (r.from === room2 && r.to === room1)
    );
    
    return rule ? rule.type : 'neutral';
  }

  /**
   * Validate adjacency feasibility
   */
  validateAdjacencyFeasibility(adjacencies: Array<{ from: string; to: string; weight: number }>): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    // Count must-adjacencies per room
    const mustCounts = new Map<string, number>();
    adjacencies.filter(a => a.weight >= 9).forEach(a => {
      mustCounts.set(a.from, (mustCounts.get(a.from) || 0) + 1);
      mustCounts.set(a.to, (mustCounts.get(a.to) || 0) + 1);
    });

    // A room can have at most 4 must-adjacent neighbors (realistic constraint)
    mustCounts.forEach((count, roomId) => {
      if (count > 4) {
        issues.push({
          severity: 'error',
          rule: 'EXCESS_MUST_ADJACENCIES',
          message: `Room ${roomId} has ${count} must-adjacent neighbors, maximum 4 is practical`,
          suggestion: 'Convert some must adjacencies to should (weight 7-8)'
        });
      }
    });

    return issues;
  }
}

export const architecturalRules = new ArchitecturalRuleEngine();
