/**
 * Furniture Symbol Library - Maket.ai Style
 * Professional geometric furniture representations for floor plans
 */

import { RoomType, Point2D } from '../types';

export interface FurnitureSymbol {
  id: string;
  type: FurnitureType;
  dimensions: {
    width: number;   // meters
    depth: number;   // meters
    height?: number; // meters (for 3D)
  };
  clearance: {
    front: number;   // meters of clearance in front
    sides: number;   // meters of clearance on sides
    back: number;    // meters of clearance at back
  };
  wallPlacement: boolean; // Should be placed against wall
  shape: 'rectangle' | 'circle' | 'l-shape' | 'composite';
}

export type FurnitureType =
  // Bedroom
  | 'bed-single'
  | 'bed-double'
  | 'bed-queen'
  | 'bed-king'
  | 'wardrobe'
  | 'nightstand'
  | 'dresser'
  // Living Room
  | 'sofa-2seat'
  | 'sofa-3seat'
  | 'armchair'
  | 'coffee-table'
  | 'tv-stand'
  | 'bookshelf'
  // Dining Room
  | 'dining-table-4'
  | 'dining-table-6'
  | 'dining-table-8'
  | 'dining-chair'
  // Kitchen
  | 'stove'
  | 'refrigerator'
  | 'sink-kitchen'
  | 'counter-l'
  | 'counter-straight'
  | 'dishwasher'
  // Bathroom
  | 'toilet'
  | 'sink-bathroom'
  | 'bathtub'
  | 'shower'
  | 'vanity'
  // Study
  | 'desk'
  | 'office-chair'
  | 'filing-cabinet';

/**
 * Furniture database with Maket.ai-style dimensions
 */
export const FURNITURE_LIBRARY: Record<FurnitureType, FurnitureSymbol> = {
  // BEDROOM FURNITURE
  'bed-single': {
    id: 'bed-single',
    type: 'bed-single',
    dimensions: { width: 1.0, depth: 2.0 },
    clearance: { front: 0.6, sides: 0.5, back: 0.1 },
    wallPlacement: true,
    shape: 'rectangle',
  },
  'bed-double': {
    id: 'bed-double',
    type: 'bed-double',
    dimensions: { width: 1.4, depth: 2.0 },
    clearance: { front: 0.6, sides: 0.5, back: 0.1 },
    wallPlacement: true,
    shape: 'rectangle',
  },
  'bed-queen': {
    id: 'bed-queen',
    type: 'bed-queen',
    dimensions: { width: 1.6, depth: 2.0 },
    clearance: { front: 0.6, sides: 0.5, back: 0.1 },
    wallPlacement: true,
    shape: 'rectangle',
  },
  'bed-king': {
    id: 'bed-king',
    type: 'bed-king',
    dimensions: { width: 1.8, depth: 2.0 },
    clearance: { front: 0.6, sides: 0.5, back: 0.1 },
    wallPlacement: true,
    shape: 'rectangle',
  },
  'wardrobe': {
    id: 'wardrobe',
    type: 'wardrobe',
    dimensions: { width: 1.2, depth: 0.6 },
    clearance: { front: 0.7, sides: 0.1, back: 0.1 },
    wallPlacement: true,
    shape: 'rectangle',
  },
  'nightstand': {
    id: 'nightstand',
    type: 'nightstand',
    dimensions: { width: 0.5, depth: 0.4 },
    clearance: { front: 0.3, sides: 0.1, back: 0.1 },
    wallPlacement: true,
    shape: 'rectangle',
  },
  'dresser': {
    id: 'dresser',
    type: 'dresser',
    dimensions: { width: 1.2, depth: 0.5 },
    clearance: { front: 0.7, sides: 0.1, back: 0.1 },
    wallPlacement: true,
    shape: 'rectangle',
  },

  // LIVING ROOM FURNITURE
  'sofa-2seat': {
    id: 'sofa-2seat',
    type: 'sofa-2seat',
    dimensions: { width: 1.5, depth: 0.9 },
    clearance: { front: 0.8, sides: 0.3, back: 0.1 },
    wallPlacement: true,
    shape: 'rectangle',
  },
  'sofa-3seat': {
    id: 'sofa-3seat',
    type: 'sofa-3seat',
    dimensions: { width: 2.0, depth: 0.9 },
    clearance: { front: 0.8, sides: 0.3, back: 0.1 },
    wallPlacement: true,
    shape: 'rectangle',
  },
  'armchair': {
    id: 'armchair',
    type: 'armchair',
    dimensions: { width: 0.8, depth: 0.8 },
    clearance: { front: 0.6, sides: 0.3, back: 0.1 },
    wallPlacement: false,
    shape: 'rectangle',
  },
  'coffee-table': {
    id: 'coffee-table',
    type: 'coffee-table',
    dimensions: { width: 1.2, depth: 0.6 },
    clearance: { front: 0.5, sides: 0.5, back: 0.5 },
    wallPlacement: false,
    shape: 'rectangle',
  },
  'tv-stand': {
    id: 'tv-stand',
    type: 'tv-stand',
    dimensions: { width: 1.5, depth: 0.4 },
    clearance: { front: 1.5, sides: 0.2, back: 0.1 },
    wallPlacement: true,
    shape: 'rectangle',
  },
  'bookshelf': {
    id: 'bookshelf',
    type: 'bookshelf',
    dimensions: { width: 1.0, depth: 0.3 },
    clearance: { front: 0.5, sides: 0.1, back: 0.1 },
    wallPlacement: true,
    shape: 'rectangle',
  },

  // DINING ROOM FURNITURE
  'dining-table-4': {
    id: 'dining-table-4',
    type: 'dining-table-4',
    dimensions: { width: 1.2, depth: 1.2 },
    clearance: { front: 0.8, sides: 0.8, back: 0.8 },
    wallPlacement: false,
    shape: 'circle',
  },
  'dining-table-6': {
    id: 'dining-table-6',
    type: 'dining-table-6',
    dimensions: { width: 1.8, depth: 1.0 },
    clearance: { front: 0.8, sides: 0.8, back: 0.8 },
    wallPlacement: false,
    shape: 'rectangle',
  },
  'dining-table-8': {
    id: 'dining-table-8',
    type: 'dining-table-8',
    dimensions: { width: 2.4, depth: 1.0 },
    clearance: { front: 0.8, sides: 0.8, back: 0.8 },
    wallPlacement: false,
    shape: 'rectangle',
  },
  'dining-chair': {
    id: 'dining-chair',
    type: 'dining-chair',
    dimensions: { width: 0.5, depth: 0.5 },
    clearance: { front: 0.3, sides: 0.2, back: 0.2 },
    wallPlacement: false,
    shape: 'rectangle',
  },

  // KITCHEN FURNITURE
  'stove': {
    id: 'stove',
    type: 'stove',
    dimensions: { width: 0.6, depth: 0.6 },
    clearance: { front: 0.9, sides: 0.15, back: 0.0 },
    wallPlacement: true,
    shape: 'rectangle',
  },
  'refrigerator': {
    id: 'refrigerator',
    type: 'refrigerator',
    dimensions: { width: 0.7, depth: 0.7 },
    clearance: { front: 0.9, sides: 0.1, back: 0.0 },
    wallPlacement: true,
    shape: 'rectangle',
  },
  'sink-kitchen': {
    id: 'sink-kitchen',
    type: 'sink-kitchen',
    dimensions: { width: 0.8, depth: 0.6 },
    clearance: { front: 0.9, sides: 0.15, back: 0.0 },
    wallPlacement: true,
    shape: 'rectangle',
  },
  'counter-l': {
    id: 'counter-l',
    type: 'counter-l',
    dimensions: { width: 2.4, depth: 0.6 },
    clearance: { front: 0.9, sides: 0.1, back: 0.0 },
    wallPlacement: true,
    shape: 'l-shape',
  },
  'counter-straight': {
    id: 'counter-straight',
    type: 'counter-straight',
    dimensions: { width: 1.8, depth: 0.6 },
    clearance: { front: 0.9, sides: 0.1, back: 0.0 },
    wallPlacement: true,
    shape: 'rectangle',
  },
  'dishwasher': {
    id: 'dishwasher',
    type: 'dishwasher',
    dimensions: { width: 0.6, depth: 0.6 },
    clearance: { front: 0.9, sides: 0.1, back: 0.0 },
    wallPlacement: true,
    shape: 'rectangle',
  },

  // BATHROOM FURNITURE
  'toilet': {
    id: 'toilet',
    type: 'toilet',
    dimensions: { width: 0.4, depth: 0.6 },
    clearance: { front: 0.6, sides: 0.2, back: 0.1 },
    wallPlacement: true,
    shape: 'composite',
  },
  'sink-bathroom': {
    id: 'sink-bathroom',
    type: 'sink-bathroom',
    dimensions: { width: 0.6, depth: 0.5 },
    clearance: { front: 0.7, sides: 0.2, back: 0.0 },
    wallPlacement: true,
    shape: 'circle',
  },
  'bathtub': {
    id: 'bathtub',
    type: 'bathtub',
    dimensions: { width: 1.7, depth: 0.8 },
    clearance: { front: 0.7, sides: 0.1, back: 0.0 },
    wallPlacement: true,
    shape: 'rectangle',
  },
  'shower': {
    id: 'shower',
    type: 'shower',
    dimensions: { width: 0.9, depth: 0.9 },
    clearance: { front: 0.7, sides: 0.1, back: 0.0 },
    wallPlacement: true,
    shape: 'rectangle',
  },
  'vanity': {
    id: 'vanity',
    type: 'vanity',
    dimensions: { width: 1.2, depth: 0.5 },
    clearance: { front: 0.7, sides: 0.1, back: 0.0 },
    wallPlacement: true,
    shape: 'rectangle',
  },

  // STUDY FURNITURE
  'desk': {
    id: 'desk',
    type: 'desk',
    dimensions: { width: 1.4, depth: 0.7 },
    clearance: { front: 0.8, sides: 0.3, back: 0.1 },
    wallPlacement: true,
    shape: 'rectangle',
  },
  'office-chair': {
    id: 'office-chair',
    type: 'office-chair',
    dimensions: { width: 0.6, depth: 0.6 },
    clearance: { front: 0.5, sides: 0.2, back: 0.2 },
    wallPlacement: false,
    shape: 'circle',
  },
  'filing-cabinet': {
    id: 'filing-cabinet',
    type: 'filing-cabinet',
    dimensions: { width: 0.5, depth: 0.6 },
    clearance: { front: 0.6, sides: 0.1, back: 0.1 },
    wallPlacement: true,
    shape: 'rectangle',
  },
};

/**
 * Room-type to furniture mapping (Maket.ai style)
 */
export const ROOM_FURNITURE_MAPPING: Record<RoomType, FurnitureType[]> = {
  bedroom: ['bed-queen', 'nightstand', 'wardrobe', 'dresser'],
  bathroom: ['toilet', 'sink-bathroom', 'bathtub', 'vanity'],
  kitchen: ['stove', 'refrigerator', 'sink-kitchen', 'counter-l'],
  living: ['sofa-3seat', 'coffee-table', 'tv-stand', 'armchair'],
  dining: ['dining-table-6', 'dining-chair'],
  study: ['desk', 'office-chair', 'bookshelf', 'filing-cabinet'],
  hallway: [], // No furniture in hallways
  utility: [], // Minimal furniture
  garage: [], // No furniture
  balcony: [], // No indoor furniture
};

/**
 * Get furniture items for a specific room type
 */
export function getFurnitureForRoom(
  roomType: RoomType,
  roomArea: number
): FurnitureType[] {
  const baseFurniture = ROOM_FURNITURE_MAPPING[roomType] || [];

  // Filter by room size
  const selectedFurniture: FurnitureType[] = [];

  for (const furnitureType of baseFurniture) {
    const furniture = FURNITURE_LIBRARY[furnitureType];
    const furnitureArea =
      furniture.dimensions.width * furniture.dimensions.depth;
    const clearanceArea =
      (furniture.dimensions.width + furniture.clearance.sides * 2) *
      (furniture.dimensions.depth + furniture.clearance.front + furniture.clearance.back);

    // Only add furniture if it fits with clearance (max 60% room occupancy)
    if (selectedFurniture.length === 0 || clearanceArea < roomArea * 0.6) {
      selectedFurniture.push(furnitureType);
    }

    // Limit furniture items based on room size
    const maxItems = Math.floor(roomArea / 5) + 1; // 1 item per 5 m²
    if (selectedFurniture.length >= maxItems) {
      break;
    }
  }

  return selectedFurniture;
}

/**
 * Calculate minimum room size required for furniture set
 */
export function calculateMinimumRoomSize(furnitureTypes: FurnitureType[]): {
  width: number;
  depth: number;
  area: number;
} {
  let maxWidth = 0;
  let maxDepth = 0;

  for (const type of furnitureTypes) {
    const furniture = FURNITURE_LIBRARY[type];
    const totalWidth =
      furniture.dimensions.width + furniture.clearance.sides * 2;
    const totalDepth =
      furniture.dimensions.depth +
      furniture.clearance.front +
      furniture.clearance.back;

    maxWidth = Math.max(maxWidth, totalWidth);
    maxDepth = Math.max(maxDepth, totalDepth);
  }

  return {
    width: maxWidth,
    depth: maxDepth,
    area: maxWidth * maxDepth,
  };
}
