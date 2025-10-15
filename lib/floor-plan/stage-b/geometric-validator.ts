/**
 * Stage B: Geometric Validator
 * Validates floor plan geometry using turf.js
 */

import * as turf from '@turf/turf';
import { GeometricValidationResult, FloorPlanGeometry, RoomGeometry, Wall } from '../types';
import { polygonArea } from '../utils';

export class GeometricValidator {
  
  /**
   * Validate complete floor plan geometry
   */
  validate(geometry: FloorPlanGeometry): GeometricValidationResult {
    const checks = {
      nonOverlap: this.checkNonOverlap(geometry.rooms),
      wallClosure: this.checkWallClosure(geometry.rooms, geometry.walls),
      doorAccessibility: this.checkDoorAccessibility(geometry),
      windowExposure: this.checkWindowExposure(geometry),
      areaAccuracy: this.checkAreaAccuracy(geometry),
      codeCompliance: this.checkCodeCompliance(geometry)
    };

    const errors: string[] = [];
    const warnings: string[] = [];

    if (!checks.nonOverlap) {
      errors.push('Rooms overlap detected');
    }
    if (!checks.wallClosure) {
      warnings.push('Some rooms may not have complete wall boundaries');
    }
    if (!checks.doorAccessibility) {
      errors.push('Some rooms are not accessible from the entrance');
    }
    if (!checks.windowExposure) {
      warnings.push('Some rooms requiring windows lack exterior wall access');
    }
    if (!checks.areaAccuracy) {
      warnings.push('Total area deviates from target specification');
    }
    if (!checks.codeCompliance) {
      warnings.push('Layout may not meet building code requirements');
    }

    return {
      valid: errors.length === 0,
      checks,
      errors,
      warnings
    };
  }

  /**
   * Check that rooms don't overlap
   */
  private checkNonOverlap(rooms: RoomGeometry[]): boolean {
    for (let i = 0; i < rooms.length; i++) {
      for (let j = i + 1; j < rooms.length; j++) {
        const room1 = rooms[i];
        const room2 = rooms[j];

        try {
          // Convert to turf polygons
          const poly1 = turf.polygon([this.verticesToCoords(room1.geometry.vertices)]);
          const poly2 = turf.polygon([this.verticesToCoords(room2.geometry.vertices)]);

          // Check for intersection using booleanIntersects
          const hasIntersection = turf.booleanIntersects(poly1, poly2);
          
          if (hasIntersection) {
            // Calculate overlap area using difference
            try {
              const diff1 = turf.difference(turf.featureCollection([poly1, poly2]));
              if (diff1) {
                const areaOverlap = turf.area(poly1) - turf.area(diff1);
                if (areaOverlap > 0.1) {
                  return false;
                }
              }
            } catch {
              // If complex polygon operations fail, assume overlap
              return false;
            }
          }
        } catch (error) {
          // If turf fails, do simple bounds check
          const bounds1 = room1.geometry.bounds;
          const bounds2 = room2.geometry.bounds;
          
          const overlap = !(
            bounds1.x + bounds1.width < bounds2.x ||
            bounds2.x + bounds2.width < bounds1.x ||
            bounds1.y + bounds1.height < bounds2.y ||
            bounds2.y + bounds2.height < bounds1.y
          );
          
          if (overlap) return false;
        }
      }
    }
    return true;
  }

  /**
   * Check that all rooms have closed wall boundaries
   */
  private checkWallClosure(rooms: RoomGeometry[], walls: Wall[]): boolean {
    // Simplified check: verify each room has at least 3 walls (minimum for closure)
    for (const room of rooms) {
      const roomWalls = walls.filter(w => w.adjacentRooms.includes(room.id));
      if (roomWalls.length < 3) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check that all rooms are accessible from entrance
   * Simplified: check that there's a door for each non-hallway room
   */
  private checkDoorAccessibility(geometry: FloorPlanGeometry): boolean {
    const roomsNeedingDoors = geometry.rooms.filter(r => 
      r.type !== 'hallway' && r.type !== 'balcony'
    );

    for (const room of roomsNeedingDoors) {
      const roomWalls = geometry.walls.filter(w => w.adjacentRooms.includes(room.id));
      const wallIds = new Set(roomWalls.map(w => w.id));
      const hasDoor = geometry.openings.some(o => 
        o.type === 'door' && wallIds.has(o.wallId)
      );
      
      if (!hasDoor && room.type !== 'living') { // Living room might have open plan
        return false;
      }
    }
    
    return true;
  }

  /**
   * Check that rooms requiring windows have access to exterior walls
   */
  private checkWindowExposure(geometry: FloorPlanGeometry): boolean {
    const roomsNeedingWindows = geometry.rooms.filter(r => 
      ['bedroom', 'living', 'kitchen'].includes(r.type)
    );

    for (const room of roomsNeedingWindows) {
      const roomWalls = geometry.walls.filter(w => 
        w.adjacentRooms.includes(room.id) && w.type === 'exterior'
      );
      
      if (roomWalls.length === 0) {
        // Check if room has a window anyway
        const roomWallIds = new Set(
          geometry.walls
            .filter(w => w.adjacentRooms.includes(room.id))
            .map(w => w.id)
        );
        
        const hasWindow = geometry.openings.some(o => 
          o.type === 'window' && roomWallIds.has(o.wallId)
        );
        
        if (!hasWindow) return false;
      }
    }
    
    return true;
  }

  /**
   * Check that total area matches specification
   */
  private checkAreaAccuracy(geometry: FloorPlanGeometry): boolean {
    const calculatedArea = geometry.rooms.reduce(
      (sum, room) => sum + room.geometry.area,
      0
    );

    const targetArea = geometry.metadata.totalArea;
    const tolerance = 0.15; // 15% tolerance (includes circulation)

    const deviation = Math.abs(calculatedArea - targetArea) / targetArea;
    return deviation <= tolerance;
  }

  /**
   * Check basic code compliance
   */
  private checkCodeCompliance(geometry: FloorPlanGeometry): boolean {
    // Check for minimum room sizes
    for (const room of geometry.rooms) {
      if (room.type === 'bedroom' && room.geometry.area < 7) {
        return false; // Bedrooms typically need >= 7 m²
      }
      if (room.type === 'bathroom' && room.geometry.area < 2) {
        return false; // Bathrooms need >= 2 m²
      }
    }

    // Check for minimum dimensions
    for (const room of geometry.rooms) {
      const { width, height } = room.geometry.bounds;
      const minDim = Math.min(width, height);
      
      if (room.type === 'bedroom' && minDim < 2.5) {
        return false; // Bedrooms need >= 2.5m minimum dimension
      }
      if (room.type === 'hallway' && minDim < 0.9) {
        return false; // Hallways need >= 0.9m width
      }
    }

    return true;
  }

  /**
   * Convert vertices to turf coordinate format
   */
  private verticesToCoords(vertices: Array<{x: number; y: number}>): number[][] {
    const coords = vertices.map(v => [v.x, v.y]);
    // Close the polygon
    if (coords.length > 0) {
      coords.push(coords[0]);
    }
    return coords;
  }

  /**
   * Quick validation (basic checks only)
   */
  quickValidate(geometry: FloorPlanGeometry): boolean {
    return (
      geometry.rooms.length > 0 &&
      geometry.walls.length >= 4 && // At least building envelope
      this.checkNonOverlap(geometry.rooms)
    );
  }

  /**
   * Validate polygon is well-formed
   */
  isValidPolygon(vertices: Array<{x: number; y: number}>): boolean {
    if (vertices.length < 3) return false;

    try {
      const coords = this.verticesToCoords(vertices);
      const poly = turf.polygon([coords]);
      
      // Check if polygon is valid (no self-intersections)
      const kinks = turf.kinks(poly);
      return kinks.features.length === 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Calculate actual polygon area
   */
  calculatePolygonArea(vertices: Array<{x: number; y: number}>): number {
    return polygonArea(vertices);
  }
}
