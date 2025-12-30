/**
 * Zone-Based Hierarchical Room Placement
 * Implements zone allocation and clustering strategy for optimal spatial organization
 */

import { FloorPlanSpecification, RoomSpec, Point2D, ZoneType } from '../types';
import { ZONE_CLASSIFICATION } from '../stage-a/architectural-rules';

export interface ZoneAllocation {
  zone: ZoneType;
  targetPercentage: number;
  targetArea: number;
  rooms: RoomSpec[];
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface PlacedRoom {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  spec: RoomSpec;
  zone: ZoneType;
}

export interface PlacementCandidate {
  x: number;
  y: number;
  score: number;
  adjacentTo?: string; // Room ID
}

export class ZoneBasedPlacer {
  
  /**
   * Allocate zones based on room requirements
   */
  allocateZones(spec: FloorPlanSpecification, buildingWidth: number, buildingHeight: number): ZoneAllocation[] {
    // Calculate zone requirements
    const zoneRooms = new Map<ZoneType, RoomSpec[]>();
    zoneRooms.set('public', []);
    zoneRooms.set('private', []);
    zoneRooms.set('service', []);

    for (const room of spec.rooms) {
      const zone = room.zone;
      const list = zoneRooms.get(zone) || [];
      list.push(room);
      zoneRooms.set(zone, list);
    }

    // Calculate target areas for each zone
    const totalRoomArea = spec.rooms.reduce((sum, r) => sum + (r.minArea + r.maxArea) / 2, 0);
    const allocations: ZoneAllocation[] = [];

    for (const [zone, rooms] of zoneRooms.entries()) {
      if (rooms.length === 0) continue;

      const zoneArea = rooms.reduce((sum, r) => sum + (r.minArea + r.maxArea) / 2, 0);
      const percentage = zoneArea / totalRoomArea;

      allocations.push({
        zone,
        targetPercentage: percentage,
        targetArea: zoneArea,
        rooms
      });
    }

    // Allocate spatial zones
    // Strategy: Public zone at entrance (bottom), Private zone opposite, Service zone adjacent to public
    const totalArea = buildingWidth * buildingHeight;
    
    allocations.forEach(allocation => {
      switch (allocation.zone) {
        case 'public':
          // Bottom 40% of building (entrance side)
          allocation.bounds = {
            x: 0,
            y: 0,
            width: buildingWidth,
            height: buildingHeight * 0.4
          };
          break;
        
        case 'private':
          // Top 45% of building (quiet side)
          allocation.bounds = {
            x: 0,
            y: buildingHeight * 0.55,
            width: buildingWidth,
            height: buildingHeight * 0.45
          };
          break;
        
        case 'service':
          // Side 15% (or integrated with public)
          allocation.bounds = {
            x: buildingWidth * 0.7,
            y: 0,
            width: buildingWidth * 0.3,
            height: buildingHeight * 0.5
          };
          break;
      }
    });

    return allocations;
  }

  /**
   * Place rooms hierarchically within zones
   */
  placeRoomsInZones(
    zoneAllocations: ZoneAllocation[],
    spec: FloorPlanSpecification,
    buildingWidth: number,
    buildingHeight: number
  ): PlacedRoom[] {
    const placed: PlacedRoom[] = [];

    // Sort allocations: public first (entrance), then service, then private
    const sortedZones = [...zoneAllocations].sort((a, b) => {
      const order: Record<ZoneType, number> = { public: 1, service: 2, private: 3 };
      return order[a.zone] - order[b.zone];
    });

    for (const allocation of sortedZones) {
      // Sort rooms by priority within zone
      const sortedRooms = [...allocation.rooms].sort((a, b) => 
        (b.priority || 5) - (a.priority || 5)
      );

      // Place anchor room first
      const anchorRoom = sortedRooms[0];
      if (anchorRoom && allocation.bounds) {
        const placedAnchor = this.placeAnchorRoom(anchorRoom, allocation, placed);
        placed.push(placedAnchor);

        // Place remaining rooms in cluster
        for (let i = 1; i < sortedRooms.length; i++) {
          const room = sortedRooms[i];
          const placedRoom = this.placeRoomInCluster(
            room,
            allocation,
            placed,
            spec,
            buildingWidth,
            buildingHeight
          );
          if (placedRoom) {
            placed.push(placedRoom);
          }
        }
      }
    }

    return placed;
  }

  /**
   * Place anchor room (first room in zone)
   */
  private placeAnchorRoom(
    room: RoomSpec,
    allocation: ZoneAllocation,
    existingPlacements: PlacedRoom[]
  ): PlacedRoom {
    const bounds = allocation.bounds!;
    
    // Calculate room dimensions
    const targetArea = (room.minArea + room.maxArea) / 2;
    const aspectRatio = (room.aspectRatio.min + room.aspectRatio.max) / 2;
    
    let width = Math.sqrt(targetArea * aspectRatio);
    let height = targetArea / width;

    // Constrain to zone bounds
    width = Math.min(width, bounds.width * 0.9);
    height = Math.min(height, bounds.height * 0.9);

    // Adjust to maintain area
    const actualArea = width * height;
    if (actualArea < room.minArea) {
      const scale = Math.sqrt(room.minArea / actualArea);
      width *= scale;
      height *= scale;
    }

    // Position: center of zone for anchor
    const x = bounds.x + (bounds.width - width) / 2;
    const y = bounds.y + (bounds.height - height) / 2;

    return {
      id: room.id,
      x,
      y,
      width,
      height,
      spec: room,
      zone: allocation.zone
    };
  }

  /**
   * Place room in cluster with adjacency consideration
   */
  private placeRoomInCluster(
    room: RoomSpec,
    allocation: ZoneAllocation,
    placed: PlacedRoom[],
    spec: FloorPlanSpecification,
    maxWidth: number,
    maxHeight: number
  ): PlacedRoom | null {
    const bounds = allocation.bounds!;
    
    // Calculate dimensions
    const targetArea = (room.minArea + room.maxArea) / 2;
    const aspectRatio = (room.aspectRatio.min + room.aspectRatio.max) / 2;
    
    let width = Math.sqrt(targetArea * aspectRatio);
    let height = targetArea / width;

    // Constrain to zone
    width = Math.min(width, bounds.width * 0.6);
    height = Math.min(height, bounds.height * 0.6);

    // Find best placement based on adjacency
    const candidates = this.generateCandidatePositions(
      room,
      width,
      height,
      placed,
      spec,
      bounds
    );

    // Try each candidate
    for (const candidate of candidates) {
      const testRoom: PlacedRoom = {
        id: room.id,
        x: candidate.x,
        y: candidate.y,
        width,
        height,
        spec: room,
        zone: allocation.zone
      };

      if (!this.hasOverlap(testRoom, placed) && this.isWithinBounds(testRoom, maxWidth, maxHeight)) {
        return testRoom;
      }
    }

    // Fallback: find any valid position in zone
    return this.findAnyValidPosition(room, width, height, placed, bounds, maxWidth, maxHeight);
  }

  /**
   * Generate candidate positions based on adjacency
   */
  private generateCandidatePositions(
    room: RoomSpec,
    width: number,
    height: number,
    placed: PlacedRoom[],
    spec: FloorPlanSpecification,
    zoneBounds: { x: number; y: number; width: number; height: number }
  ): PlacementCandidate[] {
    const candidates: PlacementCandidate[] = [];

    // Find rooms this room should be adjacent to
    const adjacencies = spec.adjacencyGraph.filter(
      e => e.from === room.id || e.to === room.id
    );

    for (const adj of adjacencies) {
      const adjacentRoomId = adj.from === room.id ? adj.to : adj.from;
      const adjacentRoom = placed.find(p => p.id === adjacentRoomId);

      if (adjacentRoom) {
        // Generate positions around adjacent room
        const positions = [
          { x: adjacentRoom.x + adjacentRoom.width, y: adjacentRoom.y }, // Right
          { x: adjacentRoom.x - width, y: adjacentRoom.y }, // Left
          { x: adjacentRoom.x, y: adjacentRoom.y + adjacentRoom.height }, // Below
          { x: adjacentRoom.x, y: adjacentRoom.y - height } // Above
        ];

        for (const pos of positions) {
          if (this.isInZone(pos, width, height, zoneBounds)) {
            candidates.push({
              x: pos.x,
              y: pos.y,
              score: adj.weight * 10,
              adjacentTo: adjacentRoomId
            });
          }
        }
      }
    }

    // Add zone-centered fallback
    candidates.push({
      x: zoneBounds.x + (zoneBounds.width - width) / 2,
      y: zoneBounds.y + (zoneBounds.height - height) / 2,
      score: 1
    });

    // Sort by score
    return candidates.sort((a, b) => b.score - a.score);
  }

  /**
   * Check if position is within zone
   */
  private isInZone(
    pos: { x: number; y: number },
    width: number,
    height: number,
    zone: { x: number; y: number; width: number; height: number }
  ): boolean {
    return (
      pos.x >= zone.x &&
      pos.y >= zone.y &&
      pos.x + width <= zone.x + zone.width &&
      pos.y + height <= zone.y + zone.height
    );
  }

  /**
   * Find any valid position in zone
   */
  private findAnyValidPosition(
    room: RoomSpec,
    width: number,
    height: number,
    placed: PlacedRoom[],
    zoneBounds: { x: number; y: number; width: number; height: number },
    maxWidth: number,
    maxHeight: number
  ): PlacedRoom | null {
    const gridSize = 0.5;
    
    for (let y = zoneBounds.y; y < zoneBounds.y + zoneBounds.height - height; y += gridSize) {
      for (let x = zoneBounds.x; x < zoneBounds.x + zoneBounds.width - width; x += gridSize) {
        const testRoom: PlacedRoom = {
          id: room.id,
          x, y, width, height,
          spec: room,
          zone: room.zone
        };

        if (!this.hasOverlap(testRoom, placed) && this.isWithinBounds(testRoom, maxWidth, maxHeight)) {
          return testRoom;
        }
      }
    }

    return null;
  }

  /**
   * Check for overlaps
   */
  private hasOverlap(room: PlacedRoom, placed: PlacedRoom[]): boolean {
    const margin = 0.1;
    
    for (const other of placed) {
      if (this.rectanglesOverlap(
        { x: room.x - margin, y: room.y - margin, width: room.width + 2 * margin, height: room.height + 2 * margin },
        { x: other.x, y: other.y, width: other.width, height: other.height }
      )) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check rectangle overlap
   */
  private rectanglesOverlap(
    r1: { x: number; y: number; width: number; height: number },
    r2: { x: number; y: number; width: number; height: number }
  ): boolean {
    return !(
      r1.x + r1.width < r2.x ||
      r2.x + r2.width < r1.x ||
      r1.y + r1.height < r2.y ||
      r2.y + r2.height < r1.y
    );
  }

  /**
   * Check if within building bounds
   */
  private isWithinBounds(room: PlacedRoom, maxWidth: number, maxHeight: number): boolean {
    return (
      room.x >= 0 &&
      room.y >= 0 &&
      room.x + room.width <= maxWidth &&
      room.y + room.height <= maxHeight
    );
  }
}

export const zoneBasedPlacer = new ZoneBasedPlacer();
