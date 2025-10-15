/**
 * Stage A: Specification Validator
 * Validates floor plan specifications against architectural rules
 */

import { FloorPlanSpecification, SpecificationValidationResult, RoomSpec } from '../types';
import { CIRCULATION_FACTOR } from '../config';

export class SpecificationValidator {
  
  /**
   * Validate complete floor plan specification
   */
  validate(spec: FloorPlanSpecification): SpecificationValidationResult {
    const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' }> = [];
    const suggestions: string[] = [];

    // Run all validation checks
    this.validateTotalArea(spec, errors);
    this.validateRooms(spec, errors);
    this.validateAreaConsistency(spec, errors, suggestions);
    this.validateAdjacencyGraph(spec, errors, suggestions);
    this.validateConstraints(spec, errors);

    return {
      valid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
      suggestions
    };
  }

  /**
   * Validate total area
   */
  private validateTotalArea(spec: FloorPlanSpecification, errors: SpecificationValidationResult['errors']) {
    if (spec.totalArea <= 0) {
      errors.push({
        field: 'totalArea',
        message: 'Total area must be positive',
        severity: 'error'
      });
    }

    if (spec.totalArea < 20) {
      errors.push({
        field: 'totalArea',
        message: 'Total area unusually small (< 20 m²)',
        severity: 'warning'
      });
    }

    if (spec.totalArea > 500) {
      errors.push({
        field: 'totalArea',
        message: 'Total area very large (> 500 m²). Consider multi-floor design.',
        severity: 'warning'
      });
    }

    if (spec.tolerance < 0 || spec.tolerance > 20) {
      errors.push({
        field: 'tolerance',
        message: 'Tolerance should be between 0-20%',
        severity: 'warning'
      });
    }
  }

  /**
   * Validate individual rooms
   */
  private validateRooms(spec: FloorPlanSpecification, errors: SpecificationValidationResult['errors']) {
    if (spec.rooms.length === 0) {
      errors.push({
        field: 'rooms',
        message: 'At least one room is required',
        severity: 'error'
      });
      return;
    }

    if (spec.rooms.length > 15) {
      errors.push({
        field: 'rooms',
        message: 'Too many rooms (> 15). Layout may be too complex.',
        severity: 'warning'
      });
    }

    // Check for duplicate room IDs
    const roomIds = spec.rooms.map(r => r.id);
    const duplicates = roomIds.filter((id, index) => roomIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      errors.push({
        field: 'rooms',
        message: `Duplicate room IDs: ${duplicates.join(', ')}`,
        severity: 'error'
      });
    }

    // Validate each room
    spec.rooms.forEach((room, index) => {
      this.validateRoom(room, index, errors);
    });
  }

  /**
   * Validate individual room
   */
  private validateRoom(room: RoomSpec, index: number, errors: SpecificationValidationResult['errors']) {
    const prefix = `rooms[${index}] (${room.id})`;

    // Area validation
    if (room.minArea <= 0) {
      errors.push({
        field: prefix,
        message: 'minArea must be positive',
        severity: 'error'
      });
    }

    if (room.maxArea <= room.minArea) {
      errors.push({
        field: prefix,
        message: 'maxArea must be greater than minArea',
        severity: 'error'
      });
    }

    // Aspect ratio validation
    if (room.aspectRatio.min <= 0 || room.aspectRatio.max <= 0) {
      errors.push({
        field: prefix,
        message: 'Aspect ratio must be positive',
        severity: 'error'
      });
    }

    if (room.aspectRatio.min > room.aspectRatio.max) {
      errors.push({
        field: prefix,
        message: 'aspectRatio.min must be <= aspectRatio.max',
        severity: 'error'
      });
    }

    if (room.aspectRatio.max > 3.0) {
      errors.push({
        field: prefix,
        message: 'Very wide aspect ratio (> 3.0) may be impractical',
        severity: 'warning'
      });
    }

    // Room-specific validations
    if (room.type === 'bathroom' && room.minArea < 2) {
      errors.push({
        field: prefix,
        message: 'Bathroom too small (< 2 m²)',
        severity: 'warning'
      });
    }

    if (room.type === 'bedroom' && room.minArea < 7) {
      errors.push({
        field: prefix,
        message: 'Bedroom may be too small (< 7 m²) for code compliance',
        severity: 'warning'
      });
    }

    if (room.type === 'kitchen' && room.minArea < 5) {
      errors.push({
        field: prefix,
        message: 'Kitchen very small (< 5 m²)',
        severity: 'warning'
      });
    }
  }

  /**
   * Validate area consistency
   */
  private validateAreaConsistency(
    spec: FloorPlanSpecification,
    errors: SpecificationValidationResult['errors'],
    suggestions: string[]
  ) {
    const minTotalRoomArea = spec.rooms.reduce((sum, room) => sum + room.minArea, 0);
    const maxTotalRoomArea = spec.rooms.reduce((sum, room) => sum + room.maxArea, 0);

    // Account for circulation space
    const effectiveArea = spec.totalArea * (1 - CIRCULATION_FACTOR);

    if (minTotalRoomArea > spec.totalArea * (1 + spec.tolerance / 100)) {
      errors.push({
        field: 'totalArea',
        message: `Sum of minimum room areas (${minTotalRoomArea.toFixed(1)} m²) exceeds total area (${spec.totalArea} m²)`,
        severity: 'error'
      });
      suggestions.push(`Increase total area to at least ${(minTotalRoomArea / (1 - CIRCULATION_FACTOR)).toFixed(0)} m²`);
    } else if (minTotalRoomArea > effectiveArea) {
      errors.push({
        field: 'totalArea',
        message: `Room areas very tight. Sum of minimums (${minTotalRoomArea.toFixed(1)} m²) leaves little space for circulation.`,
        severity: 'warning'
      });
      suggestions.push('Consider increasing total area by 10-15% for comfortable circulation');
    }

    if (maxTotalRoomArea < effectiveArea * 0.7) {
      errors.push({
        field: 'totalArea',
        message: `Room areas significantly smaller than available space. Consider larger rooms or additional rooms.`,
        severity: 'warning'
      });
    }

    // Check for unusually large variation in room sizes
    const avgArea = (minTotalRoomArea + maxTotalRoomArea) / (2 * spec.rooms.length);
    const oversizedRooms = spec.rooms.filter(r => r.maxArea > avgArea * 3);
    if (oversizedRooms.length > 0) {
      errors.push({
        field: 'rooms',
        message: `Some rooms are much larger than average: ${oversizedRooms.map(r => r.id).join(', ')}`,
        severity: 'warning'
      });
    }
  }

  /**
   * Validate adjacency graph
   */
  private validateAdjacencyGraph(
    spec: FloorPlanSpecification,
    errors: SpecificationValidationResult['errors'],
    suggestions: string[]
  ) {
    const roomIds = new Set(spec.rooms.map(r => r.id));

    // Check for invalid room references
    spec.adjacencyGraph.forEach((edge, index) => {
      if (!roomIds.has(edge.from)) {
        errors.push({
          field: `adjacencyGraph[${index}]`,
          message: `Reference to non-existent room: ${edge.from}`,
          severity: 'error'
        });
      }
      if (!roomIds.has(edge.to)) {
        errors.push({
          field: `adjacencyGraph[${index}]`,
          message: `Reference to non-existent room: ${edge.to}`,
          severity: 'error'
        });
      }

      // Validate weight
      if (edge.weight < 0 || edge.weight > 10) {
        errors.push({
          field: `adjacencyGraph[${index}]`,
          message: `Adjacency weight must be 0-10, got ${edge.weight}`,
          severity: 'warning'
        });
      }
    });

    // Check for graph connectivity (simplified check)
    if (spec.adjacencyGraph.length === 0 && spec.rooms.length > 1) {
      errors.push({
        field: 'adjacencyGraph',
        message: 'No adjacency preferences specified. Rooms will be placed without spatial relationships.',
        severity: 'warning'
      });
      suggestions.push('Add adjacency preferences for better layouts (e.g., kitchen near dining)');
    }

    // Check for isolated rooms (no adjacencies)
    const connectedRooms = new Set<string>();
    spec.adjacencyGraph.forEach(edge => {
      connectedRooms.add(edge.from);
      connectedRooms.add(edge.to);
    });

    const isolatedRooms = spec.rooms.filter(r => 
      !connectedRooms.has(r.id) && r.type !== 'hallway'
    );
    
    if (isolatedRooms.length > 0) {
      errors.push({
        field: 'adjacencyGraph',
        message: `Rooms with no adjacency preferences: ${isolatedRooms.map(r => r.id).join(', ')}`,
        severity: 'warning'
      });
    }

    // Check for circular must-adjacency chains
    const mustEdges = spec.adjacencyGraph.filter(e => e.type === 'must');
    if (mustEdges.length > spec.rooms.length) {
      errors.push({
        field: 'adjacencyGraph',
        message: 'Too many "must" adjacencies may create unsolvable constraints',
        severity: 'warning'
      });
    }
  }

  /**
   * Validate constraints
   */
  private validateConstraints(
    spec: FloorPlanSpecification,
    errors: SpecificationValidationResult['errors']
  ) {
    const roomIds = new Set(spec.rooms.map(r => r.id));

    spec.constraints.forEach((constraint, index) => {
      const prefix = `constraints[${index}]`;

      // Validate room references
      if (constraint.room && !roomIds.has(constraint.room)) {
        errors.push({
          field: prefix,
          message: `Reference to non-existent room: ${constraint.room}`,
          severity: 'error'
        });
      }

      if (constraint.rooms) {
        const invalid = constraint.rooms.filter(id => !roomIds.has(id));
        if (invalid.length > 0) {
          errors.push({
            field: prefix,
            message: `Reference to non-existent rooms: ${invalid.join(', ')}`,
            severity: 'error'
          });
        }
      }

      // Validate constraint values
      if (constraint.type === 'minDimension' || constraint.type === 'maxDimension') {
        if (typeof constraint.value !== 'number' || constraint.value <= 0) {
          errors.push({
            field: prefix,
            message: 'Dimension constraint must have positive numeric value',
            severity: 'error'
          });
        }
      }
    });

    // Check for contradictory constraints
    const dimensionConstraints = spec.constraints.filter(c => 
      c.type === 'minDimension' || c.type === 'maxDimension'
    );
    
    const byRoom = new Map<string, { min?: number; max?: number }>();
    dimensionConstraints.forEach(c => {
      if (c.room && typeof c.value === 'number') {
        const existing = byRoom.get(c.room) || {};
        if (c.type === 'minDimension') existing.min = c.value;
        if (c.type === 'maxDimension') existing.max = c.value;
        byRoom.set(c.room, existing);
      }
    });

    byRoom.forEach((dims, roomId) => {
      if (dims.min !== undefined && dims.max !== undefined && dims.min > dims.max) {
        errors.push({
          field: 'constraints',
          message: `Room ${roomId} has contradictory dimension constraints (min > max)`,
          severity: 'error'
        });
      }
    });
  }

  /**
   * Quick validation (basic checks only)
   */
  quickValidate(spec: FloorPlanSpecification): boolean {
    return (
      spec.totalArea > 0 &&
      spec.rooms.length > 0 &&
      spec.rooms.every(r => r.minArea > 0 && r.maxArea > r.minArea)
    );
  }
}
