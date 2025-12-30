/**
 * Intelligent Label Placement Algorithm
 * Collision-free positioning of room labels with optimal placement
 */

import { RoomGeometry, Point2D } from '../types';

export interface LabelPlacement {
  roomId: string;
  position: Point2D;
  fontSize: number;
  text: string;
  secondaryText?: string;
  secondaryPosition?: Point2D;
}

export interface LabelBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class IntelligentLabelPlacer {
  private readonly DEFAULT_FONT_SIZE = 13;
  private readonly SECONDARY_FONT_SIZE = 10;
  private readonly MIN_FONT_SIZE = 9;
  private readonly CLEARANCE = 5; // pixels

  /**
   * Place labels for all rooms with collision avoidance
   */
  placeLabels(rooms: RoomGeometry[], scale: number): LabelPlacement[] {
    const placements: LabelPlacement[] = [];
    
    for (const room of rooms) {
      const placement = this.placeLabelForRoom(room, placements, scale);
      if (placement) {
        placements.push(placement);
      }
    }
    
    return placements;
  }

  /**
   * Place label for a single room
   */
  private placeLabelForRoom(
    room: RoomGeometry,
    existingPlacements: LabelPlacement[],
    scale: number
  ): LabelPlacement | null {
    const roomName = room.labels.name;
    const roomArea = room.labels.area;
    
    // Calculate label dimensions
    let fontSize = this.DEFAULT_FONT_SIZE;
    const labelWidth = this.estimateLabelWidth(roomName, fontSize);
    const labelHeight = fontSize + 2;
    
    // Generate candidate positions
    const candidates = this.generateCandidatePositions(room, labelWidth, labelHeight, scale);
    
    // Test each candidate
    for (const candidate of candidates) {
      const labelBounds: LabelBounds = {
        x: candidate.x - labelWidth / 2,
        y: candidate.y - labelHeight / 2,
        width: labelWidth,
        height: labelHeight
      };
      
      // Check for collisions
      if (!this.hasCollision(labelBounds, existingPlacements, scale)) {
        // Found valid position
        const secondaryPosition = this.placeSecondaryLabel(
          { x: candidate.x, y: candidate.y + labelHeight / 2 + 3 },
          roomArea,
          this.SECONDARY_FONT_SIZE,
          existingPlacements,
          room,
          scale
        );
        
        return {
          roomId: room.id,
          position: candidate,
          fontSize,
          text: roomName,
          secondaryText: roomArea,
          secondaryPosition
        };
      }
    }
    
    // If no position found, try reducing font size
    fontSize = this.MIN_FONT_SIZE;
    const reducedLabelWidth = this.estimateLabelWidth(roomName, fontSize);
    const reducedCandidates = this.generateCandidatePositions(room, reducedLabelWidth, labelHeight, scale);
    
    for (const candidate of reducedCandidates) {
      const labelBounds: LabelBounds = {
        x: candidate.x - reducedLabelWidth / 2,
        y: candidate.y - labelHeight / 2,
        width: reducedLabelWidth,
        height: labelHeight
      };
      
      if (!this.hasCollision(labelBounds, existingPlacements, scale)) {
        return {
          roomId: room.id,
          position: candidate,
          fontSize,
          text: roomName,
          secondaryText: roomArea,
          secondaryPosition: undefined // Skip secondary if space is tight
        };
      }
    }
    
    // Last resort: place at centroid regardless of collision
    return {
      roomId: room.id,
      position: room.geometry.centroid,
      fontSize: this.MIN_FONT_SIZE,
      text: roomName
    };
  }

  /**
   * Generate candidate positions for label
   */
  private generateCandidatePositions(
    room: RoomGeometry,
    labelWidth: number,
    labelHeight: number,
    scale: number
  ): Array<{ x: number; y: number; score: number }> {
    const centroid = room.geometry.centroid;
    const bounds = room.geometry.bounds;
    
    const candidates: Array<{ x: number; y: number; score: number }> = [];
    
    // Priority 1: Centroid (preferred)
    candidates.push({
      x: centroid.x,
      y: centroid.y,
      score: 100
    });
    
    // Priority 2: Upper centroid (shifted up 15%)
    candidates.push({
      x: centroid.x,
      y: centroid.y - bounds.height * 0.15,
      score: 90
    });
    
    // Priority 3: Lower centroid (shifted down 15%)
    candidates.push({
      x: centroid.x,
      y: centroid.y + bounds.height * 0.15,
      score: 85
    });
    
    // Priority 4: Left offset
    candidates.push({
      x: centroid.x - bounds.width * 0.1,
      y: centroid.y,
      score: 75
    });
    
    // Priority 5: Right offset
    candidates.push({
      x: centroid.x + bounds.width * 0.1,
      y: centroid.y,
      score: 70
    });
    
    // Priority 6: Top-left quadrant
    candidates.push({
      x: bounds.x + bounds.width * 0.3,
      y: bounds.y + bounds.height * 0.3,
      score: 60
    });
    
    // Priority 7: Top-right quadrant
    candidates.push({
      x: bounds.x + bounds.width * 0.7,
      y: bounds.y + bounds.height * 0.3,
      score: 55
    });
    
    // Filter candidates that are within room bounds
    const validCandidates = candidates.filter(c => 
      this.isWithinRoom(c, room, labelWidth, labelHeight, scale)
    );
    
    return validCandidates.sort((a, b) => b.score - a.score);
  }

  /**
   * Place secondary label (area text)
   */
  private placeSecondaryLabel(
    preferredPosition: Point2D,
    text: string,
    fontSize: number,
    existingPlacements: LabelPlacement[],
    room: RoomGeometry,
    scale: number
  ): Point2D | undefined {
    const labelWidth = this.estimateLabelWidth(text, fontSize);
    const labelHeight = fontSize + 2;
    
    const labelBounds: LabelBounds = {
      x: preferredPosition.x - labelWidth / 2,
      y: preferredPosition.y - labelHeight / 2,
      width: labelWidth,
      height: labelHeight
    };
    
    // Check if fits
    if (
      !this.hasCollision(labelBounds, existingPlacements, scale) &&
      this.isWithinRoom(preferredPosition, room, labelWidth, labelHeight, scale)
    ) {
      return preferredPosition;
    }
    
    return undefined;
  }

  /**
   * Check if label position is within room bounds
   */
  private isWithinRoom(
    position: Point2D,
    room: RoomGeometry,
    labelWidth: number,
    labelHeight: number,
    scale: number
  ): boolean {
    const halfWidth = labelWidth / (2 * scale);
    const halfHeight = labelHeight / (2 * scale);
    const bounds = room.geometry.bounds;
    
    return (
      position.x - halfWidth >= bounds.x &&
      position.x + halfWidth <= bounds.x + bounds.width &&
      position.y - halfHeight >= bounds.y &&
      position.y + halfHeight <= bounds.y + bounds.height
    );
  }

  /**
   * Check for collision with existing labels
   */
  private hasCollision(
    bounds: LabelBounds,
    existingPlacements: LabelPlacement[],
    scale: number
  ): boolean {
    for (const placement of existingPlacements) {
      // Primary label bounds
      const existingWidth = this.estimateLabelWidth(placement.text, placement.fontSize);
      const existingHeight = placement.fontSize + 2;
      const existingBounds: LabelBounds = {
        x: (placement.position.x * scale) - existingWidth / 2,
        y: (placement.position.y * scale) - existingHeight / 2,
        width: existingWidth,
        height: existingHeight
      };
      
      if (this.boundsOverlap(bounds, existingBounds)) {
        return true;
      }
      
      // Secondary label bounds
      if (placement.secondaryPosition && placement.secondaryText) {
        const secWidth = this.estimateLabelWidth(placement.secondaryText, this.SECONDARY_FONT_SIZE);
        const secHeight = this.SECONDARY_FONT_SIZE + 2;
        const secBounds: LabelBounds = {
          x: (placement.secondaryPosition.x * scale) - secWidth / 2,
          y: (placement.secondaryPosition.y * scale) - secHeight / 2,
          width: secWidth,
          height: secHeight
        };
        
        if (this.boundsOverlap(bounds, secBounds)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Check if two bounding boxes overlap
   */
  private boundsOverlap(b1: LabelBounds, b2: LabelBounds): boolean {
    const clearance = this.CLEARANCE;
    
    return !(
      b1.x + b1.width + clearance < b2.x ||
      b2.x + b2.width + clearance < b1.x ||
      b1.y + b1.height + clearance < b2.y ||
      b2.y + b2.height + clearance < b1.y
    );
  }

  /**
   * Estimate label width in pixels
   */
  private estimateLabelWidth(text: string, fontSize: number): number {
    // Approximate: Arial bold character width is ~0.6 * fontSize
    return text.length * fontSize * 0.6;
  }
}

export const intelligentLabelPlacer = new IntelligentLabelPlacer();
