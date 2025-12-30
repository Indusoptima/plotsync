import { FloorPlanGeometry, RoomGeometry, Wall, Opening } from '@/lib/floor-plan/types';
import { 
  polygonsIntersect, 
  polygonArea, 
  validateMinArea, 
  validateAspectRatio,
  calculateClearanceDistance,
  pointInBoundingBox
} from './geometry-utils';

// ============================================================================
// CONSTRAINT VALIDATION TYPES
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  elementId: string;
  severity: 'error';
  fix?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  elementId: string;
  severity: 'warning';
  fix?: string;
}

export interface ConstraintConfig {
  room: {
    minArea: number; // m²
    maxArea: number; // m²
    minWidth: number; // m
    minHeight: number; // m
    maxWidth: number; // m
    maxHeight: number; // m
    aspectRatio: {
      min: number; // 1:3 = 0.333
      max: number; // 3:1 = 3.0
    };
  };
  wall: {
    minLength: number; // m
    maxLength: number; // m
    interiorThickness: number; // m
    exteriorThickness: number; // m
  };
  opening: {
    door: {
      minWidth: number; // m
      maxWidth: number; // m
      minClearance: number; // m from wall endpoints
    };
    window: {
      minWidth: number; // m
      maxWidth: number; // m
      minClearance: number; // m from wall endpoints
      sillHeight: {
        min: number; // m
        max: number; // m
      };
    };
  };
  buildingCode: {
    minCorridorWidth: number; // m
    minDoorClearance: number; // m
    minWindowPerBedroom: number;
    minExitDoors: number;
  };
}

// Default constraint configuration
export const DEFAULT_CONSTRAINTS: ConstraintConfig = {
  room: {
    minArea: 4, // 4m² minimum
    maxArea: 200, // 200m² maximum
    minWidth: 2, // 2m minimum
    minHeight: 2, // 2m minimum
    maxWidth: 15, // 15m maximum
    maxHeight: 10, // 10m maximum
    aspectRatio: {
      min: 1 / 3, // 1:3
      max: 3, // 3:1
    },
  },
  wall: {
    minLength: 1.5, // 1.5m minimum
    maxLength: 20, // 20m maximum
    interiorThickness: 0.2, // 0.2m (20cm)
    exteriorThickness: 0.3, // 0.3m (30cm)
  },
  opening: {
    door: {
      minWidth: 0.7, // 0.7m (70cm)
      maxWidth: 1.2, // 1.2m (120cm)
      minClearance: 0.3, // 0.3m from corners
    },
    window: {
      minWidth: 0.6, // 0.6m (60cm)
      maxWidth: 3.0, // 3.0m (300cm)
      minClearance: 0.5, // 0.5m from corners
      sillHeight: {
        min: 0.7, // 0.7m (70cm)
        max: 1.2, // 1.2m (120cm)
      },
    },
  },
  buildingCode: {
    minCorridorWidth: 1.0, // 1.0m minimum
    minDoorClearance: 0.9, // 0.9m for accessibility
    minWindowPerBedroom: 1,
    minExitDoors: 1,
  },
};

// ============================================================================
// ROOM VALIDATION
// ============================================================================

/**
 * Validate a single room against constraints
 */
export function validateRoom(
  room: RoomGeometry,
  constraints: ConstraintConfig = DEFAULT_CONSTRAINTS
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const { width, height, area } = room.geometry.bounds;

  // Check minimum area
  if (area < constraints.room.minArea) {
    errors.push({
      code: 'ROOM_TOO_SMALL',
      message: `Room area ${area.toFixed(1)}m² is below minimum ${constraints.room.minArea}m²`,
      elementId: room.id,
      severity: 'error',
      fix: `Increase room size to at least ${constraints.room.minArea}m²`,
    });
  }

  // Check maximum area
  if (area > constraints.room.maxArea) {
    warnings.push({
      code: 'ROOM_TOO_LARGE',
      message: `Room area ${area.toFixed(1)}m² exceeds recommended maximum ${constraints.room.maxArea}m²`,
      elementId: room.id,
      severity: 'warning',
      fix: 'Consider splitting into multiple rooms',
    });
  }

  // Check minimum dimensions
  if (width < constraints.room.minWidth) {
    errors.push({
      code: 'ROOM_WIDTH_TOO_SMALL',
      message: `Room width ${width.toFixed(1)}m is below minimum ${constraints.room.minWidth}m`,
      elementId: room.id,
      severity: 'error',
      fix: `Increase width to at least ${constraints.room.minWidth}m`,
    });
  }

  if (height < constraints.room.minHeight) {
    errors.push({
      code: 'ROOM_HEIGHT_TOO_SMALL',
      message: `Room height ${height.toFixed(1)}m is below minimum ${constraints.room.minHeight}m`,
      elementId: room.id,
      severity: 'error',
      fix: `Increase height to at least ${constraints.room.minHeight}m`,
    });
  }

  // Check maximum dimensions
  if (width > constraints.room.maxWidth) {
    warnings.push({
      code: 'ROOM_WIDTH_TOO_LARGE',
      message: `Room width ${width.toFixed(1)}m exceeds recommended maximum ${constraints.room.maxWidth}m`,
      elementId: room.id,
      severity: 'warning',
    });
  }

  if (height > constraints.room.maxHeight) {
    warnings.push({
      code: 'ROOM_HEIGHT_TOO_LARGE',
      message: `Room height ${height.toFixed(1)}m exceeds recommended maximum ${constraints.room.maxHeight}m`,
      elementId: room.id,
      severity: 'warning',
    });
  }

  // Check aspect ratio
  const ratio = Math.max(width, height) / Math.min(width, height);
  if (ratio < constraints.room.aspectRatio.min || ratio > constraints.room.aspectRatio.max) {
    warnings.push({
      code: 'ROOM_ASPECT_RATIO',
      message: `Room aspect ratio ${ratio.toFixed(1)}:1 may be impractical (recommended ${constraints.room.aspectRatio.min.toFixed(1)}-${constraints.room.aspectRatio.max.toFixed(1)}:1)`,
      elementId: room.id,
      severity: 'warning',
      fix: 'Adjust room proportions for better usability',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if two rooms overlap
 */
export function validateRoomOverlap(
  room1: RoomGeometry,
  room2: RoomGeometry
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const overlaps = polygonsIntersect(
    room1.geometry.vertices,
    room2.geometry.vertices
  );

  if (overlaps) {
    errors.push({
      code: 'ROOM_OVERLAP',
      message: `Room "${room1.labels.name}" overlaps with "${room2.labels.name}"`,
      elementId: room1.id,
      severity: 'error',
      fix: 'Move or resize rooms to eliminate overlap',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate all rooms in a floor plan
 */
export function validateAllRooms(
  plan: FloorPlanGeometry,
  constraints: ConstraintConfig = DEFAULT_CONSTRAINTS
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate each room individually
  plan.rooms.forEach((room) => {
    const result = validateRoom(room, constraints);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  });

  // Check for overlaps between rooms
  for (let i = 0; i < plan.rooms.length; i++) {
    for (let j = i + 1; j < plan.rooms.length; j++) {
      const result = validateRoomOverlap(plan.rooms[i], plan.rooms[j]);
      errors.push(...result.errors);
      warnings.push(...result.warnings);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// WALL VALIDATION
// ============================================================================

/**
 * Validate a wall
 */
export function validateWall(
  wall: Wall,
  constraints: ConstraintConfig = DEFAULT_CONSTRAINTS
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check wall length
  if (wall.length < constraints.wall.minLength) {
    errors.push({
      code: 'WALL_TOO_SHORT',
      message: `Wall length ${wall.length.toFixed(1)}m is below minimum ${constraints.wall.minLength}m`,
      elementId: wall.id,
      severity: 'error',
      fix: `Extend wall to at least ${constraints.wall.minLength}m`,
    });
  }

  if (wall.length > constraints.wall.maxLength) {
    warnings.push({
      code: 'WALL_TOO_LONG',
      message: `Wall length ${wall.length.toFixed(1)}m exceeds recommended maximum ${constraints.wall.maxLength}m`,
      elementId: wall.id,
      severity: 'warning',
      fix: 'Consider adding structural support',
    });
  }

  // Check wall thickness
  const expectedThickness =
    wall.type === 'exterior'
      ? constraints.wall.exteriorThickness
      : constraints.wall.interiorThickness;

  if (Math.abs(wall.thickness - expectedThickness) > 0.05) {
    warnings.push({
      code: 'WALL_THICKNESS',
      message: `Wall thickness ${wall.thickness.toFixed(2)}m differs from standard ${expectedThickness.toFixed(2)}m`,
      elementId: wall.id,
      severity: 'warning',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// OPENING VALIDATION
// ============================================================================

/**
 * Validate a door or window opening
 */
export function validateOpening(
  opening: Opening,
  wall: Wall,
  constraints: ConstraintConfig = DEFAULT_CONSTRAINTS
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const isDoor = opening.type === 'door';
  const config = isDoor
    ? constraints.opening.door
    : constraints.opening.window;

  // Check width
  if (opening.width < config.minWidth) {
    errors.push({
      code: `${opening.type.toUpperCase()}_TOO_NARROW`,
      message: `${opening.type} width ${opening.width.toFixed(2)}m is below minimum ${config.minWidth}m`,
      elementId: opening.id,
      severity: 'error',
      fix: `Increase ${opening.type} width to at least ${config.minWidth}m`,
    });
  }

  if (opening.width > config.maxWidth) {
    errors.push({
      code: `${opening.type.toUpperCase()}_TOO_WIDE`,
      message: `${opening.type} width ${opening.width.toFixed(2)}m exceeds maximum ${config.maxWidth}m`,
      elementId: opening.id,
      severity: 'error',
      fix: `Reduce ${opening.type} width to at most ${config.maxWidth}m`,
    });
  }

  // Check clearance from wall endpoints
  const clearance = calculateClearanceDistance(
    opening.position,
    wall.length,
    opening.width
  );

  if (clearance.startClearance < config.minClearance) {
    errors.push({
      code: `${opening.type.toUpperCase()}_CLEARANCE_START`,
      message: `${opening.type} is too close to wall start (${clearance.startClearance.toFixed(2)}m, min ${config.minClearance}m)`,
      elementId: opening.id,
      severity: 'error',
      fix: 'Move away from wall corner',
    });
  }

  if (clearance.endClearance < config.minClearance) {
    errors.push({
      code: `${opening.type.toUpperCase()}_CLEARANCE_END`,
      message: `${opening.type} is too close to wall end (${clearance.endClearance.toFixed(2)}m, min ${config.minClearance}m)`,
      elementId: opening.id,
      severity: 'error',
      fix: 'Move away from wall corner',
    });
  }

  // Window-specific validation
  if (!isDoor && opening.properties.sillHeight) {
    const sillHeight = opening.properties.sillHeight;
    const sillConfig = (config as typeof constraints.opening.window).sillHeight;

    if (sillHeight < sillConfig.min || sillHeight > sillConfig.max) {
      warnings.push({
        code: 'WINDOW_SILL_HEIGHT',
        message: `Window sill height ${sillHeight.toFixed(2)}m is outside recommended range ${sillConfig.min}-${sillConfig.max}m`,
        elementId: opening.id,
        severity: 'warning',
      });
    }
  }

  // Door-specific validation
  if (isDoor && opening.properties.isEntry) {
    if (opening.width < constraints.buildingCode.minDoorClearance) {
      warnings.push({
        code: 'ENTRY_DOOR_WIDTH',
        message: `Entry door width ${opening.width.toFixed(2)}m is below accessibility minimum ${constraints.buildingCode.minDoorClearance}m`,
        elementId: opening.id,
        severity: 'warning',
        fix: 'Increase door width for better accessibility',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// BUILDING CODE VALIDATION
// ============================================================================

/**
 * Validate building code compliance for entire floor plan
 */
export function validateBuildingCode(
  plan: FloorPlanGeometry,
  constraints: ConstraintConfig = DEFAULT_CONSTRAINTS
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check minimum exit doors
  const exitDoors = plan.openings.filter(
    (o) => o.type === 'door' && o.properties.isEntry
  );

  if (exitDoors.length < constraints.buildingCode.minExitDoors) {
    errors.push({
      code: 'INSUFFICIENT_EXIT_DOORS',
      message: `Floor plan has ${exitDoors.length} exit door(s), minimum ${constraints.buildingCode.minExitDoors} required`,
      elementId: 'floor-plan',
      severity: 'error',
      fix: 'Add entry door to exterior wall',
    });
  }

  // Check bedrooms have windows
  const bedrooms = plan.rooms.filter((r) => r.type === 'bedroom');
  bedrooms.forEach((bedroom) => {
    const bedroomWindows = plan.openings.filter(
      (o) =>
        o.type === 'window' &&
        plan.walls
          .find((w) => w.id === o.wallId)
          ?.adjacentRooms.includes(bedroom.id)
    );

    if (bedroomWindows.length < constraints.buildingCode.minWindowPerBedroom) {
      warnings.push({
        code: 'BEDROOM_WINDOW',
        message: `Bedroom "${bedroom.labels.name}" requires natural light source`,
        elementId: bedroom.id,
        severity: 'warning',
        fix: 'Add window to exterior wall',
      });
    }
  });

  // Check bathroom privacy
  const bathrooms = plan.rooms.filter((r) => r.type === 'bathroom');
  bathrooms.forEach((bathroom) => {
    const bathroomDoors = plan.openings.filter(
      (o) =>
        o.type === 'door' &&
        plan.walls
          .find((w) => w.id === o.wallId)
          ?.adjacentRooms.includes(bathroom.id)
    );

    if (bathroomDoors.length === 0) {
      warnings.push({
        code: 'BATHROOM_DOOR',
        message: `Bathroom "${bathroom.labels.name}" should have a door for privacy`,
        elementId: bathroom.id,
        severity: 'warning',
        fix: 'Add door to bathroom entrance',
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// COMPREHENSIVE VALIDATION
// ============================================================================

/**
 * Run all validation checks on a floor plan
 */
export function validateFloorPlan(
  plan: FloorPlanGeometry,
  constraints: ConstraintConfig = DEFAULT_CONSTRAINTS
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate rooms
  const roomValidation = validateAllRooms(plan, constraints);
  errors.push(...roomValidation.errors);
  warnings.push(...roomValidation.warnings);

  // Validate walls
  plan.walls.forEach((wall) => {
    const result = validateWall(wall, constraints);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  });

  // Validate openings
  plan.openings.forEach((opening) => {
    const wall = plan.walls.find((w) => w.id === opening.wallId);
    if (wall) {
      const result = validateOpening(opening, wall, constraints);
      errors.push(...result.errors);
      warnings.push(...result.warnings);
    }
  });

  // Validate building code
  const codeValidation = validateBuildingCode(plan, constraints);
  errors.push(...codeValidation.errors);
  warnings.push(...codeValidation.warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get user-friendly validation summary
 */
export function getValidationSummary(result: ValidationResult): string {
  if (result.valid && result.warnings.length === 0) {
    return '✓ Floor plan is valid and complies with all constraints';
  }

  const parts: string[] = [];

  if (result.errors.length > 0) {
    parts.push(`✗ ${result.errors.length} error(s) found`);
  }

  if (result.warnings.length > 0) {
    parts.push(`⚠ ${result.warnings.length} warning(s)`);
  }

  return parts.join(', ');
}
