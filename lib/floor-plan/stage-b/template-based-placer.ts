/**
 * Template-Based Room Placement
 * Uses architectural templates to guide room placement with interpolation support
 */

import { FloorPlanSpecification, RoomSpec } from '../types';
import { PlacedRoom } from './zone-based-placer';
import { LayoutTemplate, templateSelector } from './layout-templates';
import { classifyBuildingTypology } from '../stage-a/architectural-rules';

export interface TemplatePlacementResult {
  placed: PlacedRoom[];
  template: LayoutTemplate;
  confidence: number;
}

export class TemplateBasedPlacer {
  /**
   * Place rooms using template-guided approach
   */
  placeWithTemplate(
    spec: FloorPlanSpecification,
    buildingWidth: number,
    buildingHeight: number,
    variationSeed?: number
  ): TemplatePlacementResult {
    // Classify building typology
    const typology = classifyBuildingTypology(spec.totalArea, spec.rooms.length);

    // Select best matching template
    const templates = templateSelector.selectTemplates(
      spec.rooms.length,
      spec.totalArea,
      typology,
      5
    );

    if (templates.length === 0) {
      throw new Error('No suitable template found for specifications');
    }

    // Select template with variation
    const templateIndex = variationSeed ? variationSeed % templates.length : 0;
    const selectedTemplate = templates[templateIndex];

    // Place rooms according to template
    const placed = this.placeRoomsWithTemplate(
      selectedTemplate,
      spec,
      buildingWidth,
      buildingHeight,
      variationSeed
    );

    // Calculate confidence based on constraint satisfaction
    const confidence = this.calculatePlacementConfidence(placed, spec);

    return {
      placed,
      template: selectedTemplate,
      confidence
    };
  }

  /**
   * Place rooms following template strategy
   */
  private placeRoomsWithTemplate(
    template: LayoutTemplate,
    spec: FloorPlanSpecification,
    buildingWidth: number,
    buildingHeight: number,
    variationSeed?: number
  ): PlacedRoom[] {
    const placed: PlacedRoom[] = [];

    // Group rooms by zone
    const roomsByZone = this.groupRoomsByZone(spec.rooms);

    // Calculate actual zone bounds based on building dimensions
    const zoneBounds = this.calculateZoneBounds(
      template,
      buildingWidth,
      buildingHeight
    );

    // Place rooms in each zone
    for (const [zone, rooms] of roomsByZone.entries()) {
      const bounds = zoneBounds.get(zone);
      if (!bounds || rooms.length === 0) continue;

      // Sort rooms by priority and adjacency
      const sortedRooms = this.prioritizeRooms(rooms, spec, zone);

      // Place rooms within zone bounds
      const zonePlaced = this.placeRoomsInZone(
        sortedRooms,
        bounds,
        placed,
        spec,
        template,
        variationSeed
      );

      placed.push(...zonePlaced);
    }

    return placed;
  }

  /**
   * Group rooms by zone type
   */
  private groupRoomsByZone(rooms: RoomSpec[]): Map<string, RoomSpec[]> {
    const grouped = new Map<string, RoomSpec[]>();

    for (const room of rooms) {
      const zone = room.zone;
      if (!grouped.has(zone)) {
        grouped.set(zone, []);
      }
      grouped.get(zone)!.push(room);
    }

    return grouped;
  }

  /**
   * Calculate actual zone bounds from template and building dimensions
   */
  private calculateZoneBounds(
    template: LayoutTemplate,
    buildingWidth: number,
    buildingHeight: number
  ): Map<string, { x: number; y: number; width: number; height: number }> {
    const bounds = new Map();

    for (const [zoneName, zoneTemplate] of Object.entries(template.zoneStrategy)) {
      bounds.set(zoneName.replace('Zone', ''), {
        x: zoneTemplate.x * buildingWidth,
        y: zoneTemplate.y * buildingHeight,
        width: zoneTemplate.width * buildingWidth,
        height: zoneTemplate.height * buildingHeight
      });
    }

    return bounds;
  }

  /**
   * Prioritize rooms for placement
   */
  private prioritizeRooms(
    rooms: RoomSpec[],
    spec: FloorPlanSpecification,
    zone: string
  ): RoomSpec[] {
    return [...rooms].sort((a, b) => {
      // Priority 1: Room priority value
      const priorityDiff = (b.priority || 5) - (a.priority || 5);
      if (priorityDiff !== 0) return priorityDiff;

      // Priority 2: Adjacency count (more connections = place first)
      const adjCountA = spec.adjacencyGraph.filter(
        e => e.from === a.id || e.to === a.id
      ).length;
      const adjCountB = spec.adjacencyGraph.filter(
        e => e.from === b.id || e.to === b.id
      ).length;
      if (adjCountB !== adjCountA) return adjCountB - adjCountA;

      // Priority 3: Area (larger rooms first)
      return b.maxArea - a.maxArea;
    });
  }

  /**
   * Place rooms within a zone
   */
  private placeRoomsInZone(
    rooms: RoomSpec[],
    zoneBounds: { x: number; y: number; width: number; height: number },
    existingPlacements: PlacedRoom[],
    spec: FloorPlanSpecification,
    template: LayoutTemplate,
    variationSeed?: number
  ): PlacedRoom[] {
    const placed: PlacedRoom[] = [];

    // Calculate total area needed
    const totalNeeded = rooms.reduce((sum, r) => sum + (r.minArea + r.maxArea) / 2, 0);
    const availableArea = zoneBounds.width * zoneBounds.height;

    // Apply packing strategy based on template circulation pattern
    const packingStrategy = this.selectPackingStrategy(template.circulationPattern);

    for (const room of rooms) {
      const targetArea = (room.minArea + room.maxArea) / 2;
      const scaleFactor = Math.min(1.0, availableArea / totalNeeded);
      const adjustedArea = targetArea * scaleFactor;

      // Calculate dimensions
      const aspectRatio = (room.aspectRatio.min + room.aspectRatio.max) / 2;
      let width = Math.sqrt(adjustedArea * aspectRatio);
      let height = adjustedArea / width;

      // Apply variation if seed provided
      if (variationSeed !== undefined) {
        const variation = 0.9 + ((variationSeed * 17 + placed.length * 13) % 20) / 100;
        width *= variation;
        height = adjustedArea / width;
      }

      // Find position using packing strategy
      const position = packingStrategy(
        room,
        width,
        height,
        zoneBounds,
        placed,
        existingPlacements,
        spec
      );

      if (position) {
        placed.push({
          id: room.id,
          x: position.x,
          y: position.y,
          width: position.width,
          height: position.height,
          spec: room,
          zone: room.zone
        });
      }
    }

    return placed;
  }

  /**
   * Select packing strategy based on circulation pattern
   */
  private selectPackingStrategy(
    circulationPattern: string
  ): (
    room: RoomSpec,
    width: number,
    height: number,
    bounds: { x: number; y: number; width: number; height: number },
    zonePlaced: PlacedRoom[],
    allPlaced: PlacedRoom[],
    spec: FloorPlanSpecification
  ) => { x: number; y: number; width: number; height: number } | null {
    switch (circulationPattern) {
      case 'single_corridor':
        return this.linearPacking.bind(this);
      case 'double_corridor':
        return this.doubleSidedPacking.bind(this);
      case 'central_hall':
        return this.radialPacking.bind(this);
      case 'radial':
        return this.radialPacking.bind(this);
      case 'open_plan':
        return this.gridPacking.bind(this);
      default:
        return this.gridPacking.bind(this);
    }
  }

  /**
   * Linear packing strategy (rooms along a line)
   */
  private linearPacking(
    room: RoomSpec,
    width: number,
    height: number,
    bounds: { x: number; y: number; width: number; height: number },
    zonePlaced: PlacedRoom[],
    allPlaced: PlacedRoom[],
    spec: FloorPlanSpecification
  ): { x: number; y: number; width: number; height: number } | null {
    // Try to place along the edge
    const margin = 0.3;
    let currentX = bounds.x + margin;
    let currentY = bounds.y + margin;

    // Vertical linear arrangement
    for (const placed of zonePlaced) {
      currentY = Math.max(currentY, placed.y + placed.height + margin);
    }

    // Check if fits
    if (currentY + height <= bounds.y + bounds.height - margin &&
        currentX + width <= bounds.x + bounds.width - margin) {
      return { x: currentX, y: currentY, width, height };
    }

    // Try horizontal arrangement
    currentX = bounds.x + margin;
    currentY = bounds.y + margin;
    for (const placed of zonePlaced) {
      currentX = Math.max(currentX, placed.x + placed.width + margin);
    }

    if (currentX + width <= bounds.x + bounds.width - margin &&
        currentY + height <= bounds.y + bounds.height - margin) {
      return { x: currentX, y: currentY, width, height };
    }

    return null;
  }

  /**
   * Double-sided packing (corridor in middle)
   */
  private doubleSidedPacking(
    room: RoomSpec,
    width: number,
    height: number,
    bounds: { x: number; y: number; width: number; height: number },
    zonePlaced: PlacedRoom[],
    allPlaced: PlacedRoom[],
    spec: FloorPlanSpecification
  ): { x: number; y: number; width: number; height: number } | null {
    const corridorWidth = 1.5;
    const margin = 0.3;

    // Alternate between left and right side
    const onLeftSide = zonePlaced.length % 2 === 0;

    if (onLeftSide) {
      let currentY = bounds.y + margin;
      for (const placed of zonePlaced) {
        if (placed.x < bounds.x + bounds.width / 2) {
          currentY = Math.max(currentY, placed.y + placed.height + margin);
        }
      }

      const x = bounds.x + margin;
      if (currentY + height <= bounds.y + bounds.height - margin &&
          x + width <= bounds.x + bounds.width / 2 - corridorWidth / 2) {
        return { x, y: currentY, width, height };
      }
    } else {
      let currentY = bounds.y + margin;
      for (const placed of zonePlaced) {
        if (placed.x >= bounds.x + bounds.width / 2) {
          currentY = Math.max(currentY, placed.y + placed.height + margin);
        }
      }

      const x = bounds.x + bounds.width / 2 + corridorWidth / 2;
      if (currentY + height <= bounds.y + bounds.height - margin &&
          x + width <= bounds.x + bounds.width - margin) {
        return { x, y: currentY, width, height };
      }
    }

    return null;
  }

  /**
   * Radial packing (around central space)
   */
  private radialPacking(
    room: RoomSpec,
    width: number,
    height: number,
    bounds: { x: number; y: number; width: number; height: number },
    zonePlaced: PlacedRoom[],
    allPlaced: PlacedRoom[],
    spec: FloorPlanSpecification
  ): { x: number; y: number; width: number; height: number } | null {
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    const centralClearance = 3.0; // Clear central space

    // Place in quadrants around center
    const quadrant = zonePlaced.length % 4;
    const margin = 0.3;

    let x: number, y: number;

    switch (quadrant) {
      case 0: // Top-left
        x = bounds.x + margin;
        y = bounds.y + margin;
        break;
      case 1: // Top-right
        x = centerX + centralClearance / 2;
        y = bounds.y + margin;
        break;
      case 2: // Bottom-right
        x = centerX + centralClearance / 2;
        y = centerY + centralClearance / 2;
        break;
      case 3: // Bottom-left
        x = bounds.x + margin;
        y = centerY + centralClearance / 2;
        break;
      default:
        return this.gridPacking(room, width, height, bounds, zonePlaced, allPlaced, spec);
    }

    // Check if fits and doesn't overlap
    if (x + width <= bounds.x + bounds.width - margin &&
        y + height <= bounds.y + bounds.height - margin &&
        !this.wouldOverlap(x, y, width, height, [...zonePlaced, ...allPlaced])) {
      return { x, y, width, height };
    }

    // Fallback to grid
    return this.gridPacking(room, width, height, bounds, zonePlaced, allPlaced, spec);
  }

  /**
   * Grid packing (uniform grid)
   */
  private gridPacking(
    room: RoomSpec,
    width: number,
    height: number,
    bounds: { x: number; y: number; width: number; height: number },
    zonePlaced: PlacedRoom[],
    allPlaced: PlacedRoom[],
    spec: FloorPlanSpecification
  ): { x: number; y: number; width: number; height: number } | null {
    const gridSize = 0.5;
    const margin = 0.2;

    // Grid search for valid position
    for (let y = bounds.y + margin; y <= bounds.y + bounds.height - height - margin; y += gridSize) {
      for (let x = bounds.x + margin; x <= bounds.x + bounds.width - width - margin; x += gridSize) {
        if (!this.wouldOverlap(x, y, width, height, [...zonePlaced, ...allPlaced])) {
          return { x, y, width, height };
        }
      }
    }

    return null;
  }

  /**
   * Check if position would overlap with existing rooms
   */
  private wouldOverlap(
    x: number,
    y: number,
    width: number,
    height: number,
    placed: PlacedRoom[]
  ): boolean {
    const margin = 0.1;

    for (const room of placed) {
      if (!(
        x + width + margin < room.x ||
        room.x + room.width + margin < x ||
        y + height + margin < room.y ||
        room.y + room.height + margin < y
      )) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate placement confidence
   */
  private calculatePlacementConfidence(
    placed: PlacedRoom[],
    spec: FloorPlanSpecification
  ): number {
    let confidence = 100;

    // Penalize missing rooms
    if (placed.length < spec.rooms.length) {
      confidence -= (spec.rooms.length - placed.length) * 15;
    }

    // Check area compliance
    for (const room of placed) {
      const actualArea = room.width * room.height;
      if (actualArea < room.spec.minArea) {
        confidence -= 5;
      }
    }

    // Check adjacencies
    let satisfiedAdj = 0;
    for (const edge of spec.adjacencyGraph) {
      if (edge.weight >= 8) {
        const room1 = placed.find(r => r.id === edge.from);
        const room2 = placed.find(r => r.id === edge.to);
        if (room1 && room2 && this.areAdjacent(room1, room2)) {
          satisfiedAdj++;
        }
      }
    }

    const highPriorityAdj = spec.adjacencyGraph.filter(e => e.weight >= 8).length;
    if (highPriorityAdj > 0) {
      confidence += (satisfiedAdj / highPriorityAdj) * 20 - 10;
    }

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Check if rooms are adjacent
   */
  private areAdjacent(room1: PlacedRoom, room2: PlacedRoom): boolean {
    const tolerance = 0.3;

    const horizontalAdjacent =
      Math.abs(room1.x + room1.width - room2.x) < tolerance ||
      Math.abs(room2.x + room2.width - room1.x) < tolerance;

    const verticalAdjacent =
      Math.abs(room1.y + room1.height - room2.y) < tolerance ||
      Math.abs(room2.y + room2.height - room1.y) < tolerance;

    const xOverlap = !(room1.x + room1.width < room2.x || room2.x + room2.width < room1.x);
    const yOverlap = !(room1.y + room1.height < room2.y || room2.y + room2.height < room1.y);

    return (horizontalAdjacent && yOverlap) || (verticalAdjacent && xOverlap);
  }
}

export const templateBasedPlacer = new TemplateBasedPlacer();
