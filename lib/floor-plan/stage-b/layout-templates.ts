/**
 * Layout Template Library
 * Provides 20+ architectural layout patterns for floor plan generation
 */

import { RoomSpec, ZoneType } from '../types';

export type LayoutPattern = 
  | 'linear' 
  | 'clustered' 
  | 'l_shaped' 
  | 'u_shaped'
  | 'courtyard'
  | 'split_level'
  | 'gallery'
  | 'radial'
  | 'compact'
  | 'elongated';

export interface LayoutTemplate {
  id: string;
  name: string;
  pattern: LayoutPattern;
  description: string;
  suitableFor: {
    minRooms: number;
    maxRooms: number;
    minArea: number;
    maxArea: number;
    typologies: string[];
  };
  zoneStrategy: {
    publicZone: { x: number; y: number; width: number; height: number };
    privateZone: { x: number; y: number; width: number; height: number };
    serviceZone: { x: number; y: number; width: number; height: number };
  };
  entranceLocation: 'north' | 'south' | 'east' | 'west';
  circulationPattern: 'single_corridor' | 'double_corridor' | 'central_hall' | 'radial' | 'open_plan';
  aspectRatio: { min: number; max: number };
  characteristics: string[];
}

/**
 * Comprehensive template library with 20+ patterns
 */
export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  // ========== LINEAR PATTERNS ==========
  {
    id: 'linear_single_corridor',
    name: 'Single Corridor Linear',
    pattern: 'linear',
    description: 'Rooms arranged along a single corridor with clear separation',
    suitableFor: {
      minRooms: 3,
      maxRooms: 6,
      minArea: 50,
      maxArea: 120,
      typologies: ['apartment', 'townhouse']
    },
    zoneStrategy: {
      publicZone: { x: 0, y: 0, width: 1.0, height: 0.35 },
      privateZone: { x: 0, y: 0.65, width: 1.0, height: 0.35 },
      serviceZone: { x: 0.7, y: 0.35, width: 0.3, height: 0.3 }
    },
    entranceLocation: 'south',
    circulationPattern: 'single_corridor',
    aspectRatio: { min: 0.4, max: 0.7 },
    characteristics: ['efficient', 'compact', 'clear_zones']
  },
  {
    id: 'linear_elongated',
    name: 'Elongated Linear',
    pattern: 'elongated',
    description: 'Long narrow layout optimized for narrow lots',
    suitableFor: {
      minRooms: 4,
      maxRooms: 8,
      minArea: 60,
      maxArea: 150,
      typologies: ['townhouse']
    },
    zoneStrategy: {
      publicZone: { x: 0, y: 0, width: 0.4, height: 1.0 },
      privateZone: { x: 0.6, y: 0, width: 0.4, height: 1.0 },
      serviceZone: { x: 0.4, y: 0, width: 0.2, height: 0.5 }
    },
    entranceLocation: 'west',
    circulationPattern: 'single_corridor',
    aspectRatio: { min: 0.3, max: 0.5 },
    characteristics: ['narrow_lot', 'vertical_circulation', 'zone_separation']
  },

  // ========== CLUSTERED PATTERNS ==========
  {
    id: 'clustered_functional',
    name: 'Functional Cluster',
    pattern: 'clustered',
    description: 'Rooms grouped by function with central circulation',
    suitableFor: {
      minRooms: 5,
      maxRooms: 10,
      minArea: 80,
      maxArea: 200,
      typologies: ['apartment', 'villa']
    },
    zoneStrategy: {
      publicZone: { x: 0.2, y: 0, width: 0.6, height: 0.5 },
      privateZone: { x: 0, y: 0.5, width: 0.7, height: 0.5 },
      serviceZone: { x: 0.7, y: 0, width: 0.3, height: 0.5 }
    },
    entranceLocation: 'south',
    circulationPattern: 'central_hall',
    aspectRatio: { min: 0.8, max: 1.2 },
    characteristics: ['functional_grouping', 'central_access', 'flexible']
  },
  {
    id: 'clustered_compact',
    name: 'Compact Cluster',
    pattern: 'compact',
    description: 'Tightly organized rooms for maximum space efficiency',
    suitableFor: {
      minRooms: 3,
      maxRooms: 6,
      minArea: 40,
      maxArea: 80,
      typologies: ['studio', 'apartment']
    },
    zoneStrategy: {
      publicZone: { x: 0, y: 0, width: 0.6, height: 0.5 },
      privateZone: { x: 0.6, y: 0, width: 0.4, height: 0.6 },
      serviceZone: { x: 0, y: 0.5, width: 0.4, height: 0.5 }
    },
    entranceLocation: 'south',
    circulationPattern: 'open_plan',
    aspectRatio: { min: 0.9, max: 1.1 },
    characteristics: ['space_efficient', 'minimal_circulation', 'compact']
  },

  // ========== L-SHAPED PATTERNS ==========
  {
    id: 'l_shaped_corner',
    name: 'L-Shaped Corner',
    pattern: 'l_shaped',
    description: 'Two wings at 90 degrees, ideal for corner lots',
    suitableFor: {
      minRooms: 5,
      maxRooms: 10,
      minArea: 100,
      maxArea: 250,
      typologies: ['villa', 'townhouse']
    },
    zoneStrategy: {
      publicZone: { x: 0, y: 0, width: 0.6, height: 0.5 },
      privateZone: { x: 0, y: 0.5, width: 0.5, height: 0.5 },
      serviceZone: { x: 0.6, y: 0, width: 0.4, height: 0.4 }
    },
    entranceLocation: 'south',
    circulationPattern: 'central_hall',
    aspectRatio: { min: 0.7, max: 1.3 },
    characteristics: ['two_wings', 'outdoor_space', 'privacy_zones']
  },
  {
    id: 'l_shaped_privacy',
    name: 'L-Shaped Privacy',
    pattern: 'l_shaped',
    description: 'L-configuration for public/private separation',
    suitableFor: {
      minRooms: 6,
      maxRooms: 12,
      minArea: 120,
      maxArea: 300,
      typologies: ['villa', 'mansion']
    },
    zoneStrategy: {
      publicZone: { x: 0, y: 0, width: 0.7, height: 0.4 },
      privateZone: { x: 0.7, y: 0, width: 0.3, height: 1.0 },
      serviceZone: { x: 0, y: 0.4, width: 0.3, height: 0.3 }
    },
    entranceLocation: 'west',
    circulationPattern: 'double_corridor',
    aspectRatio: { min: 0.6, max: 1.0 },
    characteristics: ['strong_separation', 'two_wings', 'natural_light']
  },

  // ========== U-SHAPED PATTERNS ==========
  {
    id: 'u_shaped_courtyard',
    name: 'U-Shaped Courtyard',
    pattern: 'u_shaped',
    description: 'Three wings around central outdoor space',
    suitableFor: {
      minRooms: 7,
      maxRooms: 15,
      minArea: 150,
      maxArea: 400,
      typologies: ['villa', 'mansion']
    },
    zoneStrategy: {
      publicZone: { x: 0, y: 0, width: 1.0, height: 0.3 },
      privateZone: { x: 0, y: 0.3, width: 0.3, height: 0.7 },
      serviceZone: { x: 0.7, y: 0.3, width: 0.3, height: 0.7 }
    },
    entranceLocation: 'south',
    circulationPattern: 'radial',
    aspectRatio: { min: 0.8, max: 1.2 },
    characteristics: ['courtyard', 'outdoor_access', 'luxury']
  },

  // ========== COURTYARD PATTERNS ==========
  {
    id: 'courtyard_central',
    name: 'Central Courtyard',
    pattern: 'courtyard',
    description: 'Rooms arranged around central open space',
    suitableFor: {
      minRooms: 6,
      maxRooms: 12,
      minArea: 120,
      maxArea: 300,
      typologies: ['villa', 'mansion']
    },
    zoneStrategy: {
      publicZone: { x: 0, y: 0, width: 0.5, height: 0.4 },
      privateZone: { x: 0.5, y: 0, width: 0.5, height: 0.5 },
      serviceZone: { x: 0, y: 0.6, width: 0.4, height: 0.4 }
    },
    entranceLocation: 'south',
    circulationPattern: 'radial',
    aspectRatio: { min: 0.9, max: 1.1 },
    characteristics: ['central_court', 'natural_light', 'ventilation']
  },

  // ========== SPLIT-LEVEL PATTERNS ==========
  {
    id: 'split_level_duplex',
    name: 'Split-Level Duplex',
    pattern: 'split_level',
    description: 'Vertical separation of public and private zones',
    suitableFor: {
      minRooms: 5,
      maxRooms: 9,
      minArea: 90,
      maxArea: 180,
      typologies: ['townhouse', 'villa']
    },
    zoneStrategy: {
      publicZone: { x: 0, y: 0, width: 1.0, height: 0.5 },
      privateZone: { x: 0, y: 0.5, width: 1.0, height: 0.5 },
      serviceZone: { x: 0.7, y: 0, width: 0.3, height: 0.3 }
    },
    entranceLocation: 'south',
    circulationPattern: 'single_corridor',
    aspectRatio: { min: 0.7, max: 1.0 },
    characteristics: ['vertical_zoning', 'stairs', 'clear_separation']
  },

  // ========== GALLERY PATTERNS ==========
  {
    id: 'gallery_double_sided',
    name: 'Double-Sided Gallery',
    pattern: 'gallery',
    description: 'Central corridor with rooms on both sides',
    suitableFor: {
      minRooms: 6,
      maxRooms: 12,
      minArea: 100,
      maxArea: 250,
      typologies: ['apartment', 'villa']
    },
    zoneStrategy: {
      publicZone: { x: 0, y: 0, width: 0.5, height: 0.4 },
      privateZone: { x: 0.5, y: 0, width: 0.5, height: 0.6 },
      serviceZone: { x: 0, y: 0.7, width: 0.3, height: 0.3 }
    },
    entranceLocation: 'south',
    circulationPattern: 'double_corridor',
    aspectRatio: { min: 0.5, max: 0.8 },
    characteristics: ['efficient_corridor', 'symmetry', 'cross_ventilation']
  },

  // ========== RADIAL PATTERNS ==========
  {
    id: 'radial_hub',
    name: 'Radial Hub',
    pattern: 'radial',
    description: 'Central living space with rooms radiating outward',
    suitableFor: {
      minRooms: 5,
      maxRooms: 10,
      minArea: 100,
      maxArea: 250,
      typologies: ['villa', 'mansion']
    },
    zoneStrategy: {
      publicZone: { x: 0.3, y: 0.3, width: 0.4, height: 0.4 },
      privateZone: { x: 0, y: 0, width: 0.3, height: 1.0 },
      serviceZone: { x: 0.7, y: 0, width: 0.3, height: 0.5 }
    },
    entranceLocation: 'south',
    circulationPattern: 'radial',
    aspectRatio: { min: 0.9, max: 1.1 },
    characteristics: ['central_hub', 'radial_access', 'open_plan']
  },

  // ========== OPEN PLAN PATTERNS ==========
  {
    id: 'open_plan_loft',
    name: 'Open Plan Loft',
    pattern: 'compact',
    description: 'Minimal walls with open living areas',
    suitableFor: {
      minRooms: 2,
      maxRooms: 5,
      minArea: 50,
      maxArea: 120,
      typologies: ['studio', 'apartment']
    },
    zoneStrategy: {
      publicZone: { x: 0, y: 0, width: 0.7, height: 0.6 },
      privateZone: { x: 0.7, y: 0, width: 0.3, height: 0.5 },
      serviceZone: { x: 0, y: 0.6, width: 0.4, height: 0.4 }
    },
    entranceLocation: 'south',
    circulationPattern: 'open_plan',
    aspectRatio: { min: 0.7, max: 1.3 },
    characteristics: ['open_concept', 'minimal_walls', 'flexible']
  },

  // ========== ADDITIONAL SPECIALIZED PATTERNS ==========
  {
    id: 'compact_studio',
    name: 'Compact Studio',
    pattern: 'compact',
    description: 'Ultra-efficient layout for small spaces',
    suitableFor: {
      minRooms: 2,
      maxRooms: 4,
      minArea: 30,
      maxArea: 60,
      typologies: ['studio']
    },
    zoneStrategy: {
      publicZone: { x: 0, y: 0, width: 0.6, height: 0.6 },
      privateZone: { x: 0.6, y: 0, width: 0.4, height: 0.5 },
      serviceZone: { x: 0, y: 0.6, width: 0.5, height: 0.4 }
    },
    entranceLocation: 'south',
    circulationPattern: 'open_plan',
    aspectRatio: { min: 0.9, max: 1.1 },
    characteristics: ['ultra_compact', 'space_saving', 'efficient']
  },
  {
    id: 'symmetrical_balanced',
    name: 'Symmetrical Balanced',
    pattern: 'clustered',
    description: 'Symmetrical layout with balanced proportions',
    suitableFor: {
      minRooms: 6,
      maxRooms: 10,
      minArea: 100,
      maxArea: 200,
      typologies: ['villa', 'townhouse']
    },
    zoneStrategy: {
      publicZone: { x: 0.2, y: 0, width: 0.6, height: 0.4 },
      privateZone: { x: 0, y: 0.5, width: 0.5, height: 0.5 },
      serviceZone: { x: 0.5, y: 0.5, width: 0.5, height: 0.5 }
    },
    entranceLocation: 'south',
    circulationPattern: 'central_hall',
    aspectRatio: { min: 0.9, max: 1.1 },
    characteristics: ['symmetrical', 'balanced', 'traditional']
  },
  {
    id: 'modern_asymmetric',
    name: 'Modern Asymmetric',
    pattern: 'clustered',
    description: 'Contemporary asymmetric design',
    suitableFor: {
      minRooms: 5,
      maxRooms: 9,
      minArea: 90,
      maxArea: 220,
      typologies: ['villa', 'townhouse']
    },
    zoneStrategy: {
      publicZone: { x: 0, y: 0, width: 0.7, height: 0.5 },
      privateZone: { x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
      serviceZone: { x: 0, y: 0.5, width: 0.4, height: 0.5 }
    },
    entranceLocation: 'west',
    circulationPattern: 'open_plan',
    aspectRatio: { min: 0.7, max: 1.3 },
    characteristics: ['modern', 'asymmetric', 'dynamic']
  },
  {
    id: 'traditional_central_hall',
    name: 'Traditional Central Hall',
    pattern: 'gallery',
    description: 'Classic layout with grand central hallway',
    suitableFor: {
      minRooms: 7,
      maxRooms: 14,
      minArea: 150,
      maxArea: 400,
      typologies: ['villa', 'mansion']
    },
    zoneStrategy: {
      publicZone: { x: 0.2, y: 0, width: 0.6, height: 0.4 },
      privateZone: { x: 0, y: 0.5, width: 1.0, height: 0.5 },
      serviceZone: { x: 0, y: 0, width: 0.2, height: 0.4 }
    },
    entranceLocation: 'south',
    circulationPattern: 'central_hall',
    aspectRatio: { min: 0.6, max: 0.9 },
    characteristics: ['traditional', 'grand_entrance', 'formal']
  },
  {
    id: 'efficiency_apartment',
    name: 'Efficiency Apartment',
    pattern: 'linear',
    description: 'Optimized for small urban apartments',
    suitableFor: {
      minRooms: 3,
      maxRooms: 5,
      minArea: 45,
      maxArea: 85,
      typologies: ['apartment']
    },
    zoneStrategy: {
      publicZone: { x: 0, y: 0, width: 0.5, height: 0.5 },
      privateZone: { x: 0.5, y: 0, width: 0.5, height: 0.6 },
      serviceZone: { x: 0, y: 0.5, width: 0.4, height: 0.5 }
    },
    entranceLocation: 'south',
    circulationPattern: 'single_corridor',
    aspectRatio: { min: 0.7, max: 1.0 },
    characteristics: ['urban', 'efficient', 'compact']
  },
  {
    id: 'family_home',
    name: 'Family Home',
    pattern: 'clustered',
    description: 'Practical layout for family living',
    suitableFor: {
      minRooms: 6,
      maxRooms: 11,
      minArea: 120,
      maxArea: 280,
      typologies: ['villa', 'townhouse']
    },
    zoneStrategy: {
      publicZone: { x: 0, y: 0, width: 0.6, height: 0.5 },
      privateZone: { x: 0, y: 0.5, width: 0.7, height: 0.5 },
      serviceZone: { x: 0.6, y: 0, width: 0.4, height: 0.4 }
    },
    entranceLocation: 'south',
    circulationPattern: 'central_hall',
    aspectRatio: { min: 0.8, max: 1.2 },
    characteristics: ['family_friendly', 'practical', 'flexible']
  },
  {
    id: 'luxury_estate',
    name: 'Luxury Estate',
    pattern: 'courtyard',
    description: 'Expansive layout with premium features',
    suitableFor: {
      minRooms: 10,
      maxRooms: 20,
      minArea: 300,
      maxArea: 800,
      typologies: ['mansion']
    },
    zoneStrategy: {
      publicZone: { x: 0.2, y: 0, width: 0.6, height: 0.4 },
      privateZone: { x: 0, y: 0.5, width: 0.6, height: 0.5 },
      serviceZone: { x: 0.6, y: 0.5, width: 0.4, height: 0.5 }
    },
    entranceLocation: 'south',
    circulationPattern: 'radial',
    aspectRatio: { min: 0.8, max: 1.2 },
    characteristics: ['luxury', 'spacious', 'multiple_zones']
  }
];

/**
 * Template Selection Engine
 */
export class TemplateSelector {
  /**
   * Select best matching templates for given requirements
   */
  selectTemplates(
    roomCount: number,
    totalArea: number,
    typology: string,
    topN: number = 5
  ): LayoutTemplate[] {
    const scored = LAYOUT_TEMPLATES.map(template => ({
      template,
      score: this.scoreTemplate(template, roomCount, totalArea, typology)
    }));

    // Sort by score and return top N
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topN)
      .map(s => s.template);
  }

  /**
   * Score template suitability
   */
  private scoreTemplate(
    template: LayoutTemplate,
    roomCount: number,
    totalArea: number,
    typology: string
  ): number {
    let score = 0;

    // Room count match (40%)
    if (roomCount >= template.suitableFor.minRooms && 
        roomCount <= template.suitableFor.maxRooms) {
      const midRoom = (template.suitableFor.minRooms + template.suitableFor.maxRooms) / 2;
      const roomDeviation = Math.abs(roomCount - midRoom) / midRoom;
      score += 40 * (1 - roomDeviation);
    }

    // Area match (40%)
    if (totalArea >= template.suitableFor.minArea && 
        totalArea <= template.suitableFor.maxArea) {
      const midArea = (template.suitableFor.minArea + template.suitableFor.maxArea) / 2;
      const areaDeviation = Math.abs(totalArea - midArea) / midArea;
      score += 40 * (1 - areaDeviation);
    }

    // Typology match (20%)
    if (template.suitableFor.typologies.includes(typology)) {
      score += 20;
    }

    return score;
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): LayoutTemplate | undefined {
    return LAYOUT_TEMPLATES.find(t => t.id === id);
  }
}

export const templateSelector = new TemplateSelector();
