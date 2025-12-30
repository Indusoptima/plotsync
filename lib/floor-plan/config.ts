/**
 * Configuration for the multi-stage floor plan generation pipeline
 */

import { PipelineConfig } from './types';

export const DEFAULT_CONFIG: PipelineConfig = {
  stageA: {
    llm: {
      // model: 'google/gemini-2.0-flash-001',
      model: 'x-ai/grok-code-fast-1',
      temperature: 0.3,
      maxTokens: 2000,
      apiKey: process.env.OPENROUTER_API_KEY || '',
      baseUrl: 'https://openrouter.ai/api/v1'
    },
    validation: {
      minTotalArea: 20,
      maxTotalArea: 500,
      minRoomCount: 1,
      maxRoomCount: 15
    }
  },
  stageB: {
    solver: {
      maxIterations: 1000,
      convergenceThreshold: 0.01,
      constraintRelaxationFactor: 0.1
    },
    walls: {
      exteriorThickness: 0.15,
      interiorThickness: 0.10,
      minLength: 0.3
    },
    openings: {
      doorWidth: {
        standard: 0.9,
        entrance: 1.2
      },
      windowSizePercent: {
        min: 0.10,
        max: 0.25,
        default: 0.15
      },
      minClearance: 0.3
    },
    circulation: {
      minCorridorWidth: 1.2,
      minDoorClearance: 1.0
    }
  },
  stageC: {
    rendering: {
      antialiasing: true,
      shadowMapping: true,
      pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1
    },
    extrusion: {
      wallHeight: {
        exterior: 3.0,
        interior: 2.8
      },
      floorThickness: 0.25,
      bevelSize: 0.02
    },
    furniture: {
      autoPlace: true,
      density: 'moderate',
      scaleToRoom: true
    }
  },
  performance: {
    parallelVariations: true,
    cacheEnabled: true,
    timeoutMs: 90000 // 90 seconds
  }
};

// Common room area ranges (in square meters)
export const ROOM_AREA_RANGES = {
  bedroom: { min: 9, max: 25, optimal: 14 },
  bathroom: { min: 3, max: 10, optimal: 5 },
  kitchen: { min: 8, max: 20, optimal: 12 },
  living: { min: 15, max: 40, optimal: 25 },
  dining: { min: 10, max: 25, optimal: 15 },
  hallway: { min: 3, max: 10, optimal: 5 },
  study: { min: 8, max: 15, optimal: 10 },
  utility: { min: 3, max: 8, optimal: 5 },
  garage: { min: 15, max: 40, optimal: 25 },
  balcony: { min: 4, max: 15, optimal: 8 }
};

// Aspect ratio ranges for rooms
export const ROOM_ASPECT_RATIOS = {
  bedroom: { min: 0.7, max: 1.5 },
  bathroom: { min: 0.6, max: 1.8 },
  kitchen: { min: 0.6, max: 2.0 },
  living: { min: 0.7, max: 1.8 },
  dining: { min: 0.7, max: 1.5 },
  hallway: { min: 0.3, max: 0.8 },
  study: { min: 0.7, max: 1.5 },
  utility: { min: 0.6, max: 1.5 },
  garage: { min: 0.8, max: 1.5 },
  balcony: { min: 0.5, max: 2.0 }
};

// Zone classification
export const ROOM_ZONES = {
  bedroom: 'private',
  bathroom: 'private',
  kitchen: 'service',
  living: 'public',
  dining: 'public',
  hallway: 'public',
  study: 'private',
  utility: 'service',
  garage: 'service',
  balcony: 'public'
} as const;

// Default adjacency preferences (weight 0-10)
export const DEFAULT_ADJACENCIES = [
  { from: 'kitchen', to: 'dining', weight: 9 },
  { from: 'kitchen', to: 'living', weight: 7 },
  { from: 'living', to: 'dining', weight: 8 },
  { from: 'bedroom', to: 'bathroom', weight: 7 },
  { from: 'utility', to: 'kitchen', weight: 6 }
];

// Circulation factor (percentage of total area)
export const CIRCULATION_FACTOR = 0.15;

/**
 * Stroke width configuration for rendering modes
 * 
 * SVG Mode: Used for exports - maintains Maket.ai specification (6px walls/windows)
 * Canvas Mode: Used for interactive display - calibrated for Konva rendering (4px walls/windows)
 * 
 * Canvas uses thinner strokes because Konva's anti-aliasing adds ~2px visual weight
 * compared to browser SVG rendering.
 */
export const STROKE_CONFIG = {
  svg: {
    mode: 'svg' as const,
    wallStroke: 6,        // Maket.ai specification - bold black walls
    windowStroke: 6,      // Matches wall thickness for consistency
    doorArcStroke: 2,     // Thin dashed arc for door swing
    doorGapStroke: 8,     // White gap in wall for door opening
    furnitureStroke: 1.5  // Thin lines for furniture symbols
  },
  canvas: {
    mode: 'canvas' as const,
    wallStroke: 4,        // Reduced to compensate for Konva anti-aliasing
    windowStroke: 4,      // Matches wall thickness
    doorArcStroke: 2.5,   // Increased to balance with thinner walls
    doorGapStroke: 6,     // Reduced to match thinner walls
    furnitureStroke: 1.5  // No change - already appropriate
  }
};

/**
 * Adaptive scaling configuration for floor plan display
 * 
 * Ensures all floor plans display at consistent, readable sizes regardless of actual area.
 * Small floor plans (e.g., 50 m²) are scaled up to meet minimum display thresholds.
 * Large floor plans (e.g., 2000 m²) are constrained to prevent tiny display.
 */
export const ADAPTIVE_SCALE = {
  minDisplayWidth: 500,    // Minimum floor plan width in pixels
  minDisplayHeight: 400,   // Minimum floor plan height in pixels
  maxScale: 25,            // Maximum zoom level (pixels per meter)
  minScale: 10,            // Minimum zoom level (pixels per meter)
  defaultScale: 15         // Baseline for moderate floor plans (pixels per meter)
};
