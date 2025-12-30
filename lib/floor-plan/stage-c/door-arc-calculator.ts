/**
 * Door Arc Calculator - Precise Quarter-Circle Arc Generation
 * Implements trigonometric calculations for perfect door swing arcs
 * matching Maket.ai's professional CAD-style rendering
 */

import { Point2D, Wall, Opening } from '../types';

export interface DoorArcGeometry {
  startPoint: Point2D;
  endPoint: Point2D;
  radius: number;
  sweepClockwise: boolean;
  hingeSide: 'start' | 'end';
  centerPoint: Point2D;
  startAngle: number;
  endAngle: number;
}

export interface DoorOpeningPosition {
  start: Point2D;
  end: Point2D;
  center: Point2D;
}

/**
 * Calculate precise door arc geometry using trigonometry
 */
export class DoorArcCalculator {
  /**
   * Calculate door opening position on wall
   */
  calculateDoorOpeningPosition(
    wall: Wall,
    positionOnWall: number,
    doorWidth: number
  ): DoorOpeningPosition {
    const { start, end } = wall.geometry;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    // Center point of door along wall
    const centerX = start.x + dx * positionOnWall;
    const centerY = start.y + dy * positionOnWall;

    // Half-width offset along wall direction
    const halfWidth = doorWidth / 2;
    const dirX = dx / length;
    const dirY = dy / length;

    return {
      center: { x: centerX, y: centerY },
      start: {
        x: centerX - dirX * halfWidth,
        y: centerY - dirY * halfWidth,
      },
      end: {
        x: centerX + dirX * halfWidth,
        y: centerY + dirY * halfWidth,
      },
    };
  }

  /**
   * Determine hinge side based on room adjacency and entry logic
   */
  determineHingeSide(
    door: Opening,
    wall: Wall,
    adjacentRoomTypes?: { room1Type?: string; room2Type?: string }
  ): 'start' | 'end' {
    // Entry door: Default to 'start' (conventional right-hand swing)
    if (door.properties.isEntry) {
      return 'start';
    }

    // Interior doors: Determine based on room hierarchy if available
    if (adjacentRoomTypes) {
      const publicRooms = ['living', 'dining', 'hallway', 'kitchen'];
      const privateRooms = ['bedroom', 'bathroom', 'study'];

      const room1Public = adjacentRoomTypes.room1Type
        ? publicRooms.includes(adjacentRoomTypes.room1Type)
        : false;
      const room2Public = adjacentRoomTypes.room2Type
        ? publicRooms.includes(adjacentRoomTypes.room2Type)
        : false;

      // Swing from public to private
      if (room1Public && !room2Public) {
        return 'end'; // Swing toward room 2 (private)
      }
      if (!room1Public && room2Public) {
        return 'start'; // Swing toward room 1 (private)
      }
    }

    // Default: clockwise from wall start (standard convention)
    return 'start';
  }

  /**
   * Calculate precise quarter-circle arc geometry
   */
  calculateArcGeometry(
    doorOpening: DoorOpeningPosition,
    wall: Wall,
    doorWidth: number,
    hingeSide: 'start' | 'end'
  ): DoorArcGeometry {
    const { start, end } = wall.geometry;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    // Normalized wall direction
    const wallDirX = dx / length;
    const wallDirY = dy / length;

    // Perpendicular direction (90° rotation)
    const perpDirX = -wallDirY;
    const perpDirY = wallDirX;

    // Hinge point
    const hingePoint = hingeSide === 'start' ? doorOpening.start : doorOpening.end;

    // Arc endpoint: perpendicular to wall at door width distance
    const arcEndpoint: Point2D = {
      x: hingePoint.x + perpDirX * doorWidth,
      y: hingePoint.y + perpDirY * doorWidth,
    };

    // Calculate angles for Konva Arc
    const wallAngle = Math.atan2(dy, dx) * (180 / Math.PI);
    const perpAngle = wallAngle + 90;

    const startAngle = perpAngle;
    const endAngle = perpAngle + 90;

    // Determine sweep direction
    const sweepClockwise = hingeSide === 'start';

    return {
      startPoint: hingePoint,
      endPoint: arcEndpoint,
      radius: doorWidth,
      sweepClockwise,
      hingeSide,
      centerPoint: hingePoint, // Arc center is at hinge
      startAngle,
      endAngle,
    };
  }

  /**
   * Generate SVG arc path command
   */
  generateSVGArcPath(arcGeometry: DoorArcGeometry, scale: number = 15): string {
    const { startPoint, endPoint, radius, sweepClockwise } = arcGeometry;

    const scaledRadius = radius * scale;
    const startX = startPoint.x * scale;
    const startY = startPoint.y * scale;
    const endX = endPoint.x * scale;
    const endY = endPoint.y * scale;

    // SVG arc flags
    const largeArcFlag = 0; // Quarter circle is always small arc
    const sweepFlag = sweepClockwise ? 1 : 0;

    return `M ${startX} ${startY} A ${scaledRadius} ${scaledRadius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`;
  }

  /**
   * Calculate arc endpoint for Konva rendering
   */
  calculateKonvaArcPoints(
    arcGeometry: DoorArcGeometry,
    scale: number = 15
  ): {
    centerX: number;
    centerY: number;
    radius: number;
    startAngle: number;
    endAngle: number;
  } {
    const { centerPoint, radius, startAngle, endAngle } = arcGeometry;

    return {
      centerX: centerPoint.x * scale,
      centerY: centerPoint.y * scale,
      radius: radius * scale,
      startAngle,
      endAngle,
    };
  }
}

export const doorArcCalculator = new DoorArcCalculator();
