/**
 * Multi-Pass Validation Framework
 * Iteratively validates and refines specifications through multiple passes
 */

import { FloorPlanSpecification, SpecificationValidationResult, RoomSpec } from '../types';
import { architecturalRules, ValidationIssue } from './architectural-rules';
import { CIRCULATION_STANDARDS } from './architectural-rules';

export interface ValidationPass {
  name: string;
  order: number;
  validate: (spec: FloorPlanSpecification) => ValidationPassResult;
}

export interface ValidationPassResult {
  passed: boolean;
  issues: ValidationIssue[];
  suggestions: string[];
  autoCorrections?: Partial<FloorPlanSpecification>;
}

export interface MultiPassValidationResult {
  finalValid: boolean;
  passResults: Array<{
    passName: string;
    passed: boolean;
    issues: ValidationIssue[];
  }>;
  totalIssues: {
    errors: number;
    warnings: number;
    info: number;
  };
  correctedSpec?: FloorPlanSpecification;
}

export class MultiPassValidator {
  private passes: ValidationPass[] = [];

  constructor() {
    this.initializePasses();
  }

  /**
   * Initialize validation passes in order
   */
  private initializePasses() {
    // Pass 1: Total Area Check
    this.passes.push({
      name: 'Total Area Compliance',
      order: 1,
      validate: (spec) => this.validateTotalAreaCompliance(spec)
    });

    // Pass 2: Individual Room Proportions
    this.passes.push({
      name: 'Room Proportion Check',
      order: 2,
      validate: (spec) => this.validateRoomProportions(spec)
    });

    // Pass 3: Adjacency Feasibility
    this.passes.push({
      name: 'Adjacency Feasibility Check',
      order: 3,
      validate: (spec) => this.validateAdjacencyFeasibility(spec)
    });

    // Pass 4: Circulation Requirements
    this.passes.push({
      name: 'Circulation Check',
      order: 4,
      validate: (spec) => this.validateCirculation(spec)
    });

    // Pass 5: Zone Separation
    this.passes.push({
      name: 'Zone Separation Check',
      order: 5,
      validate: (spec) => this.validateZoneSeparation(spec)
    });
  }

  /**
   * Execute multi-pass validation
   */
  validate(spec: FloorPlanSpecification): MultiPassValidationResult {
    const passResults: Array<{ passName: string; passed: boolean; issues: ValidationIssue[] }> = [];
    let currentSpec = { ...spec };
    let allPassed = true;

    // Execute each pass
    for (const pass of this.passes) {
      const result = pass.validate(currentSpec);
      
      passResults.push({
        passName: pass.name,
        passed: result.passed,
        issues: result.issues
      });

      if (!result.passed) {
        allPassed = false;
        
        // Apply auto-corrections if available
        if (result.autoCorrections) {
          currentSpec = { ...currentSpec, ...result.autoCorrections };
        }
      }
    }

    // Calculate total issues
    const allIssues = passResults.flatMap(r => r.issues);
    const totalIssues = {
      errors: allIssues.filter(i => i.severity === 'error').length,
      warnings: allIssues.filter(i => i.severity === 'warning').length,
      info: allIssues.filter(i => i.severity === 'info').length
    };

    return {
      finalValid: totalIssues.errors === 0,
      passResults,
      totalIssues,
      correctedSpec: allPassed ? undefined : currentSpec
    };
  }

  /**
   * Pass 1: Validate total area compliance
   */
  private validateTotalAreaCompliance(spec: FloorPlanSpecification): ValidationPassResult {
    const issues: ValidationIssue[] = [];
    const suggestions: string[] = [];

    // Calculate total room area
    const totalRoomArea = spec.rooms.reduce((sum, room) => {
      // Use midpoint of min/max
      return sum + (room.minArea + room.maxArea) / 2;
    }, 0);

    const circulationArea = spec.totalArea * CIRCULATION_STANDARDS.circulationPercentage;
    const effectiveArea = spec.totalArea - circulationArea;
    const tolerance = spec.totalArea * (spec.tolerance / 100);

    // Check if room areas fit within total area
    if (totalRoomArea > spec.totalArea + tolerance) {
      issues.push({
        severity: 'error',
        rule: 'TOTAL_AREA_OVERFLOW',
        message: `Sum of room areas (${totalRoomArea.toFixed(1)}m²) exceeds total area (${spec.totalArea}m²) + tolerance`,
        suggestion: `Reduce room areas by ${(totalRoomArea - spec.totalArea).toFixed(1)}m² or increase total area`
      });
    } else if (totalRoomArea > effectiveArea * 1.1) {
      issues.push({
        severity: 'warning',
        rule: 'TIGHT_AREA_FIT',
        message: `Room areas leave minimal space for circulation (${((totalRoomArea / spec.totalArea) * 100).toFixed(0)}% utilization)`,
        suggestion: 'Consider increasing total area by 10-15% for comfortable circulation'
      });
      suggestions.push(`Recommended total area: ${(totalRoomArea / 0.85).toFixed(0)}m²`);
    }

    // Check for area underutilization
    if (totalRoomArea < effectiveArea * 0.6) {
      issues.push({
        severity: 'warning',
        rule: 'AREA_UNDERUTILIZATION',
        message: `Room areas only use ${((totalRoomArea / effectiveArea) * 100).toFixed(0)}% of available space`,
        suggestion: 'Consider adding more rooms or increasing room sizes'
      });
    }

    return {
      passed: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      suggestions
    };
  }

  /**
   * Pass 2: Validate room proportions
   */
  private validateRoomProportions(spec: FloorPlanSpecification): ValidationPassResult {
    const issues: ValidationIssue[] = [];
    const suggestions: string[] = [];
    const autoCorrections: Partial<FloorPlanSpecification> = {};

    const correctedRooms: RoomSpec[] = [];
    let hadCorrections = false;

    for (const room of spec.rooms) {
      // Validate room against architectural standards
      const avgArea = (room.minArea + room.maxArea) / 2;
      const roomIssues = architecturalRules.validateRoom(room.type, avgArea);
      
      issues.push(...roomIssues);

      // Check aspect ratio
      const aspectRatioValid = 
        room.aspectRatio.min > 0 &&
        room.aspectRatio.max > room.aspectRatio.min &&
        room.aspectRatio.max <= 3.0;

      if (!aspectRatioValid) {
        issues.push({
          severity: 'error',
          rule: 'INVALID_ASPECT_RATIO',
          message: `Room ${room.id} has invalid aspect ratio range [${room.aspectRatio.min}, ${room.aspectRatio.max}]`,
          suggestion: 'Aspect ratio must be positive and max should not exceed 3.0'
        });
      }

      // Auto-correct if needed
      let correctedRoom = { ...room };
      
      // Correct extreme aspect ratios
      if (room.aspectRatio.max > 3.0) {
        correctedRoom.aspectRatio = { ...correctedRoom.aspectRatio, max: 2.5 };
        hadCorrections = true;
      }
      if (room.aspectRatio.min < 0.3) {
        correctedRoom.aspectRatio = { ...correctedRoom.aspectRatio, min: 0.4 };
        hadCorrections = true;
      }

      correctedRooms.push(correctedRoom);
    }

    if (hadCorrections) {
      autoCorrections.rooms = correctedRooms;
    }

    return {
      passed: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      suggestions,
      autoCorrections: hadCorrections ? autoCorrections : undefined
    };
  }

  /**
   * Pass 3: Validate adjacency feasibility
   */
  private validateAdjacencyFeasibility(spec: FloorPlanSpecification): ValidationPassResult {
    const issues: ValidationIssue[] = [];
    const suggestions: string[] = [];

    // Validate room references
    const roomIds = new Set(spec.rooms.map(r => r.id));
    const invalidReferences: string[] = [];

    for (const edge of spec.adjacencyGraph) {
      if (!roomIds.has(edge.from)) {
        invalidReferences.push(edge.from);
      }
      if (!roomIds.has(edge.to)) {
        invalidReferences.push(edge.to);
      }
    }

    if (invalidReferences.length > 0) {
      issues.push({
        severity: 'error',
        rule: 'INVALID_ADJACENCY_REFERENCE',
        message: `Adjacency graph references non-existent rooms: ${[...new Set(invalidReferences)].join(', ')}`,
        suggestion: 'Remove invalid adjacency edges or add missing rooms'
      });
    }

    // Use architectural rule engine to validate
    const feasibilityIssues = architecturalRules.validateAdjacencyFeasibility(
      spec.adjacencyGraph
    );
    issues.push(...feasibilityIssues);

    // Check for circular must-adjacencies
    const mustEdges = spec.adjacencyGraph.filter(e => e.weight >= 9);
    if (mustEdges.length > spec.rooms.length - 1) {
      issues.push({
        severity: 'warning',
        rule: 'EXCESS_MUST_ADJACENCIES',
        message: `${mustEdges.length} must-adjacencies for ${spec.rooms.length} rooms may create unsolvable constraints`,
        suggestion: 'Convert some high-weight adjacencies to should-adjacent (weight 7-8)'
      });
    }

    // Check for isolated rooms
    const connectedRooms = new Set<string>();
    spec.adjacencyGraph.forEach(edge => {
      connectedRooms.add(edge.from);
      connectedRooms.add(edge.to);
    });

    const isolatedRooms = spec.rooms.filter(
      r => !connectedRooms.has(r.id) && r.type !== 'hallway' && r.type !== 'balcony'
    );

    if (isolatedRooms.length > 0) {
      issues.push({
        severity: 'info',
        rule: 'ISOLATED_ROOMS',
        message: `Rooms without adjacency preferences: ${isolatedRooms.map(r => r.id).join(', ')}`,
        suggestion: 'Add adjacency preferences for better spatial relationships'
      });
    }

    return {
      passed: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      suggestions
    };
  }

  /**
   * Pass 4: Validate circulation requirements
   */
  private validateCirculation(spec: FloorPlanSpecification): ValidationPassResult {
    const issues: ValidationIssue[] = [];
    const suggestions: string[] = [];

    const roomCount = spec.rooms.filter(r => r.type !== 'hallway').length;
    const hallwayCount = spec.rooms.filter(r => r.type === 'hallway').length;

    // For layouts with 4+ rooms, hallway is recommended
    if (roomCount >= 4 && hallwayCount === 0) {
      issues.push({
        severity: 'warning',
        rule: 'MISSING_HALLWAY',
        message: `Layout with ${roomCount} rooms lacks hallway for circulation`,
        suggestion: 'Add a hallway to improve accessibility and privacy'
      });
      suggestions.push(`Allocate ${(spec.totalArea * 0.08).toFixed(0)}m² for hallway space`);
    }

    // Check if hallways are reasonably sized
    const hallways = spec.rooms.filter(r => r.type === 'hallway');
    for (const hallway of hallways) {
      const avgArea = (hallway.minArea + hallway.maxArea) / 2;
      const avgWidth = Math.sqrt(avgArea * hallway.aspectRatio.min);
      
      if (avgWidth < CIRCULATION_STANDARDS.minCorridorWidth) {
        issues.push({
          severity: 'warning',
          rule: 'NARROW_HALLWAY',
          message: `Hallway ${hallway.id} may be too narrow (estimated ${avgWidth.toFixed(2)}m)`,
          suggestion: `Ensure hallway width is at least ${CIRCULATION_STANDARDS.minCorridorWidth}m`
        });
      }
    }

    return {
      passed: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      suggestions
    };
  }

  /**
   * Pass 5: Validate zone separation
   */
  private validateZoneSeparation(spec: FloorPlanSpecification): ValidationPassResult {
    const issues: ValidationIssue[] = [];
    const suggestions: string[] = [];

    // Check for private-to-entrance direct connections
    const entranceAdjacentRooms = spec.adjacencyGraph
      .filter(e => e.from === 'entrance' || e.to === 'entrance')
      .map(e => e.from === 'entrance' ? e.to : e.from);

    const privateRoomsAtEntrance = spec.rooms.filter(
      r => (r.zone === 'private' && entranceAdjacentRooms.includes(r.id))
    );

    if (privateRoomsAtEntrance.length > 0) {
      issues.push({
        severity: 'warning',
        rule: 'PRIVATE_ZONE_EXPOSURE',
        message: `Private rooms directly connected to entrance: ${privateRoomsAtEntrance.map(r => r.id).join(', ')}`,
        suggestion: 'Add hallway buffer between entrance and private zones for privacy'
      });
    }

    // Check for bathroom-kitchen adjacency
    const bathroomKitchenAdjacent = spec.adjacencyGraph.some(
      e => (e.from === 'bathroom' && e.to === 'kitchen') || 
           (e.from === 'kitchen' && e.to === 'bathroom')
    );

    if (bathroomKitchenAdjacent) {
      issues.push({
        severity: 'warning',
        rule: 'BATHROOM_KITCHEN_ADJACENCY',
        message: 'Bathroom directly adjacent to kitchen violates hygiene best practices',
        suggestion: 'Separate bathroom and kitchen with hallway or other room'
      });
    }

    return {
      passed: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      suggestions
    };
  }

  /**
   * Generate validation report
   */
  generateReport(result: MultiPassValidationResult): string {
    let report = '=== Floor Plan Specification Validation Report ===\n\n';
    
    report += `Overall Status: ${result.finalValid ? '✓ PASSED' : '✗ FAILED'}\n`;
    report += `Total Issues: ${result.totalIssues.errors} errors, ${result.totalIssues.warnings} warnings, ${result.totalIssues.info} info\n\n`;

    for (const passResult of result.passResults) {
      report += `--- ${passResult.passName} ---\n`;
      report += `Status: ${passResult.passed ? '✓ Passed' : '✗ Failed'}\n`;
      
      if (passResult.issues.length > 0) {
        report += `Issues:\n`;
        for (const issue of passResult.issues) {
          report += `  [${issue.severity.toUpperCase()}] ${issue.rule}: ${issue.message}\n`;
          if (issue.suggestion) {
            report += `    → ${issue.suggestion}\n`;
          }
        }
      }
      report += '\n';
    }

    return report;
  }
}

export const multiPassValidator = new MultiPassValidator();
