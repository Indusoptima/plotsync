/**
 * Enhanced SVG Exporter with Maket.ai Style and Professional Features
 * Generates publication-ready floor plans with intelligent labeling and dimension annotations
 */

import { FloorPlanGeometry, SVGExportOptions, Point2D } from '../types';
import { formatArea, formatDimension } from '../utils';
import { intelligentLabelPlacer, LabelPlacement } from './intelligent-label-placer';
import { doorArcCalculator } from './door-arc-calculator';
import { ADAPTIVE_SCALE } from '../config';

export interface EnhancedSVGOptions extends SVGExportOptions {
  maketAiStyle?: boolean;
  includeDimensionLines?: boolean;
  includeRoomDimensions?: boolean;
  includeTotalArea?: boolean;
  includeAreaLabels?: boolean; // NEW: Control area label rendering (m² annotations)
}

export class EnhancedSVGExporter {
  private scale: number;
  private padding: number;

  constructor(scale?: number) {
    // Use adaptive scale calculation if geometry is available
    // Default to ADAPTIVE_SCALE.defaultScale for initialization
    this.scale = scale || ADAPTIVE_SCALE.defaultScale;
    this.padding = 15;
  }

  /**
   * Export floor plan to SVG with enhanced styling
   */
  export(geometry: FloorPlanGeometry, options: Partial<EnhancedSVGOptions> = {}): string {
    const opts: EnhancedSVGOptions = {
      includeLabels: true,
      includeDimensions: false,
      includeFurniture: false,
      layerSeparation: true,
      scale: this.scale,
      maketAiStyle: true,
      includeDimensionLines: false,
      includeRoomDimensions: false, // Maket.ai excludes room dimensions
      includeTotalArea: false,      // Maket.ai excludes total area
      includeAreaLabels: false,      // NEW: Maket.ai excludes area labels by default
      ...options
    };

    // Calculate bounds and determine adaptive scale if not explicitly provided
    const bounds = this.calculateBounds(geometry);
    const planWidth = bounds.maxX - bounds.minX;
    const planHeight = bounds.maxY - bounds.minY;
    
    // Apply adaptive scaling if scale not explicitly provided in options
    if (!options.scale) {
      const scaleX = ADAPTIVE_SCALE.minDisplayWidth / planWidth;
      const scaleY = ADAPTIVE_SCALE.minDisplayHeight / planHeight;
      const minRequiredScale = Math.max(scaleX, scaleY);
      
      opts.scale = Math.max(
        ADAPTIVE_SCALE.minScale,
        Math.min(minRequiredScale, ADAPTIVE_SCALE.maxScale)
      );
    }
    
    const scaledWidth = planWidth * opts.scale;
    const scaledHeight = planHeight * opts.scale;
    
    const viewWidth = scaledWidth + 2 * this.padding;
    const viewHeight = scaledHeight + 2 * this.padding;
    
    // Calculate offset for centering
    const offsetX = (viewWidth - scaledWidth) / 2 - bounds.minX * opts.scale;
    const offsetY = (viewHeight - scaledHeight) / 2 - bounds.minY * opts.scale;

    let svg = this.generateSVGHeader(viewWidth, viewHeight, opts);
    
    if (opts.layerSeparation) {
      svg += this.generateLayeredContent(geometry, opts, offsetX, offsetY);
    } else {
      svg += this.generateFlatContent(geometry, opts, offsetX, offsetY);
    }
    
    svg += '</svg>';
    return svg;
  }

  /**
   * Generate SVG header with styles
   */
  private generateSVGHeader(width: number, height: number, opts: EnhancedSVGOptions): string {
    const maketStyles = opts.maketAiStyle ? this.getMaketAiStyles() : this.getDefaultStyles();
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     width="${width}" 
     height="${height}"
     viewBox="0 0 ${width} ${height}">
  <defs>
    <style>
      ${maketStyles}
    </style>
  </defs>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="#FFFFFF"/>
  
`;
  }

  /**
   * Maket.ai style definitions
   */
  private getMaketAiStyles(): string {
    return `
      .wall { stroke: #000000; stroke-width: 6; fill: none; stroke-linecap: square; }
      .room-fill { fill: #FFFFFF; stroke: none; }
      .door { stroke: #000000; stroke-width: 2; fill: none; stroke-dasharray: 3,3; }
      .door-arc { stroke: #000000; stroke-width: 2; fill: none; stroke-dasharray: 3,3; }
      .window { stroke: #000000; stroke-width: 6; fill: none; }
      .furniture { stroke: #000000; stroke-width: 1.5; fill: none; }
      .label-primary { 
        font-family: Arial, sans-serif; 
        font-size: 13px; 
        font-weight: bold;
        fill: #1a1a1a; 
        text-anchor: middle;
        dominant-baseline: middle;
      }
      .label-secondary { 
        font-family: Arial, sans-serif; 
        font-size: 10px; 
        fill: #666666; 
        text-anchor: middle;
        dominant-baseline: middle;
      }
      .dimension { 
        font-family: Arial, sans-serif; 
        font-size: 9px; 
        fill: #888888;
        text-anchor: middle;
      }
      .dimension-bg {
        fill: #FFFFFF;
        fill-opacity: 0.8;
        stroke: none;
      }
      .dimension-line {
        stroke: #CCCCCC;
        stroke-width: 0.5;
        stroke-dasharray: 2,2;
      }
    `;
  }

  /**
   * Default style definitions
   */
  private getDefaultStyles(): string {
    return `
      .wall { stroke: #000; stroke-width: 3; fill: none; }
      .room-fill { fill: #f5f5f5; stroke: none; opacity: 0.5; }
      .door { stroke: #8B4513; stroke-width: 2; fill: none; }
      .window { stroke: #4169E1; stroke-width: 2; fill: #87CEEB; opacity: 0.5; }
      .label-primary { font-family: Arial, sans-serif; font-size: 12px; fill: #333; text-anchor: middle; }
      .label-secondary { font-family: Arial, sans-serif; font-size: 10px; fill: #666; text-anchor: middle; }
      .dimension { font-family: Arial, sans-serif; font-size: 10px; fill: #666; }
    `;
  }

  /**
   * Generate layered SVG content
   */
  private generateLayeredContent(
    geometry: FloorPlanGeometry,
    opts: EnhancedSVGOptions,
    offsetX: number,
    offsetY: number
  ): string {
    let svg = '';
    
    // Layer 1: Room fills
    svg += '  <!-- Layer: Room Fills -->\n';
    svg += '  <g id="layer-room-fills">\n';
    svg += this.generateRoomFills(geometry, opts, offsetX, offsetY);
    svg += '  </g>\n\n';
    
    // Layer 2: Walls
    svg += '  <!-- Layer: Walls -->\n';
    svg += '  <g id="layer-walls">\n';
    svg += this.generateWalls(geometry, opts, offsetX, offsetY);
    svg += '  </g>\n\n';
    
    // Layer 3: Doors
    svg += '  <!-- Layer: Doors -->\n';
    svg += '  <g id="layer-doors">\n';
    svg += this.generateDoors(geometry, opts, offsetX, offsetY);
    svg += '  </g>\n\n';
    
    // Layer 4: Windows
    svg += '  <!-- Layer: Windows -->\n';
    svg += '  <g id="layer-windows">\n';
    svg += this.generateWindows(geometry, opts, offsetX, offsetY);
    svg += '  </g>\n\n';
    
    // Layer 5: Furniture (if enabled)
    if (opts.includeFurniture) {
      svg += '  <!-- Layer: Furniture -->\n';
      svg += '  <g id="layer-furniture">\n';
      svg += this.generateFurniture(geometry, opts, offsetX, offsetY);
      svg += '  </g>\n\n';
    }
    
    // Layer 6: Labels
    if (opts.includeLabels) {
      svg += '  <!-- Layer: Labels -->\n';
      svg += '  <g id="layer-labels">\n';
      svg += this.generateIntelligentLabels(geometry, opts, offsetX, offsetY);
      svg += '  </g>\n\n';
    }
    
    // Layer 7: Dimensions
    if (opts.includeDimensions || opts.includeRoomDimensions) {
      svg += '  <!-- Layer: Dimensions -->\n';
      svg += '  <g id="layer-dimensions">\n';
      svg += this.generateDimensionAnnotations(geometry, opts, offsetX, offsetY);
      svg += '  </g>\n\n';
    }
    
    return svg;
  }

  /**
   * Generate flat (non-layered) content
   */
  private generateFlatContent(
    geometry: FloorPlanGeometry,
    opts: EnhancedSVGOptions,
    offsetX: number,
    offsetY: number
  ): string {
    let svg = '';
    svg += this.generateRoomFills(geometry, opts, offsetX, offsetY);
    svg += this.generateWalls(geometry, opts, offsetX, offsetY);
    svg += this.generateDoors(geometry, opts, offsetX, offsetY);
    svg += this.generateWindows(geometry, opts, offsetX, offsetY);
    
    if (opts.includeFurniture) {
      svg += this.generateFurniture(geometry, opts, offsetX, offsetY);
    }
    
    if (opts.includeLabels) {
      svg += this.generateIntelligentLabels(geometry, opts, offsetX, offsetY);
    }
    
    if (opts.includeDimensions || opts.includeRoomDimensions) {
      svg += this.generateDimensionAnnotations(geometry, opts, offsetX, offsetY);
    }
    
    return svg;
  }

  /**
   * Calculate bounds from geometry
   */
  private calculateBounds(geometry: FloorPlanGeometry): { minX: number; minY: number; maxX: number; maxY: number } {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    for (const room of geometry.rooms) {
      const bounds = room.geometry.bounds;
      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + bounds.width);
      maxY = Math.max(maxY, bounds.y + bounds.height);
    }
    
    return { minX, minY, maxX, maxY };
  }

  /**
   * Generate room fill polygons
   */
  private generateRoomFills(
    geometry: FloorPlanGeometry,
    opts: EnhancedSVGOptions,
    offsetX: number,
    offsetY: number
  ): string {
    let svg = '';
    
    for (const room of geometry.rooms) {
      const points = room.geometry.vertices
        .map(v => `${this.toSVGX(v.x, offsetX, opts.scale)},${this.toSVGY(v.y, offsetY, opts.scale)}`)
        .join(' ');
      
      svg += `    <polygon points="${points}" class="room-fill" data-room-id="${room.id}" />\n`;
    }
    
    return svg;
  }

  /**
   * Generate wall lines
   */
  private generateWalls(
    geometry: FloorPlanGeometry,
    opts: EnhancedSVGOptions,
    offsetX: number,
    offsetY: number
  ): string {
    let svg = '';
    
    for (const wall of geometry.walls) {
      const x1 = this.toSVGX(wall.geometry.start.x, offsetX, opts.scale);
      const y1 = this.toSVGY(wall.geometry.start.y, offsetY, opts.scale);
      const x2 = this.toSVGX(wall.geometry.end.x, offsetX, opts.scale);
      const y2 = this.toSVGY(wall.geometry.end.y, offsetY, opts.scale);
      
      svg += `    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="wall" data-wall-id="${wall.id}" />\n`;
    }
    
    return svg;
  }

  /**
   * Generate door symbols with precise quarter-circle arcs
   * Maket.ai style: Perfect arc geometry with 3,3 dash pattern
   */
  private generateDoors(
    geometry: FloorPlanGeometry,
    opts: EnhancedSVGOptions,
    offsetX: number,
    offsetY: number
  ): string {
    let svg = '';
    
    const doors = geometry.openings.filter(o => o.type === 'door');
    
    for (const door of doors) {
      const wall = geometry.walls.find(w => w.id === door.wallId);
      if (!wall) continue;
      
      // Calculate door opening position
      const doorOpening = doorArcCalculator.calculateDoorOpeningPosition(
        wall,
        door.position,
        door.width
      );
      
      // Determine hinge side
      const hingeSide = doorArcCalculator.determineHingeSide(door, wall);
      
      // Calculate precise arc geometry
      const arcGeometry = doorArcCalculator.calculateArcGeometry(
        doorOpening,
        wall,
        door.width,
        hingeSide
      );
      
      // Door gap (white line in wall)
      svg += `    <line x1="${this.toSVGX(doorOpening.start.x, offsetX, opts.scale)}" y1="${this.toSVGY(doorOpening.start.y, offsetY, opts.scale)}" `;
      svg += `x2="${this.toSVGX(doorOpening.end.x, offsetX, opts.scale)}" y2="${this.toSVGY(doorOpening.end.y, offsetY, opts.scale)}" `;
      svg += `stroke="#FFFFFF" stroke-width="8" stroke-linecap="butt" data-opening-id="${door.id}" />\n`;
      
      // Door arc (precise quarter-circle using SVG arc command)
      const arcPath = doorArcCalculator.generateSVGArcPath(arcGeometry, opts.scale);
      const offsetArcPath = this.offsetSVGPath(arcPath, offsetX, offsetY, opts.scale);
      
      svg += `    <path d="${offsetArcPath}" `;
      svg += `class="door-arc" fill="none" data-opening-id="${door.id}-arc" />\n`;
    }
    
    return svg;
  }

  /**
   * Generate window symbols
   * Maket.ai style: 6px black lines matching wall thickness
   */
  private generateWindows(
    geometry: FloorPlanGeometry,
    opts: EnhancedSVGOptions,
    offsetX: number,
    offsetY: number
  ): string {
    let svg = '';
    
    const windows = geometry.openings.filter(o => o.type === 'window');
    
    for (const window of windows) {
      const wall = geometry.walls.find(w => w.id === window.wallId);
      if (!wall) continue;
      
      // Calculate window position using door arc calculator
      const windowOpening = doorArcCalculator.calculateDoorOpeningPosition(
        wall,
        window.position,
        window.width
      );
      
      // Window rendered as thick black line (6px to match walls)
      svg += `    <line x1="${this.toSVGX(windowOpening.start.x, offsetX, opts.scale)}" y1="${this.toSVGY(windowOpening.start.y, offsetY, opts.scale)}" `;
      svg += `x2="${this.toSVGX(windowOpening.end.x, offsetX, opts.scale)}" y2="${this.toSVGY(windowOpening.end.y, offsetY, opts.scale)}" `;
      svg += `class="window" data-opening-id="${window.id}" />\n`;
    }
    
    return svg;
  }

  /**
   * Generate furniture (placeholder - geometric symbols)
   */
  private generateFurniture(
    geometry: FloorPlanGeometry,
    opts: EnhancedSVGOptions,
    offsetX: number,
    offsetY: number
  ): string {
    // Placeholder for furniture - would need furniture data in geometry
    return '    <!-- Furniture symbols would go here -->\n';
  }

  /**
   * Generate intelligent labels with collision avoidance
   * Maket.ai style: Only room names, no area labels
   */
  private generateIntelligentLabels(
    geometry: FloorPlanGeometry,
    opts: EnhancedSVGOptions,
    offsetX: number,
    offsetY: number
  ): string {
    let svg = '';
    
    const labelPlacements = intelligentLabelPlacer.placeLabels(geometry.rooms, opts.scale);
    
    for (const placement of labelPlacements) {
      const x = this.toSVGX(placement.position.x, offsetX, opts.scale);
      const y = this.toSVGY(placement.position.y, offsetY, opts.scale);
      
      // Primary label (room name) - always render
      svg += `    <text x="${x}" y="${y}" class="label-primary" style="font-size:${placement.fontSize}px">${placement.text}</text>\n`;
      
      // Secondary label (area) - only render if includeAreaLabels is true
      if (opts.includeAreaLabels && placement.secondaryText && placement.secondaryPosition) {
        const secX = this.toSVGX(placement.secondaryPosition.x, offsetX, opts.scale);
        const secY = this.toSVGY(placement.secondaryPosition.y, offsetY, opts.scale);
        svg += `    <text x="${secX}" y="${secY}" class="label-secondary">${placement.secondaryText}</text>\n`;
      }
    }
    
    return svg;
  }

  /**
   * Generate dimension annotations
   * Maket.ai style: Excludes room dimensions and total area by default
   */
  private generateDimensionAnnotations(
    geometry: FloorPlanGeometry,
    opts: EnhancedSVGOptions,
    offsetX: number,
    offsetY: number
  ): string {
    let svg = '';
    
    // Room dimensions (bottom-left corner) - only if explicitly enabled
    if (opts.includeRoomDimensions) {
      for (const room of geometry.rooms) {
        const bounds = room.geometry.bounds;
        const x = this.toSVGX(bounds.x + 0.2, offsetX, opts.scale);
        const y = this.toSVGY(bounds.y + bounds.height - 0.2, offsetY, opts.scale);
        
        const dimText = `${formatDimension(bounds.width, 'metric')} × ${formatDimension(bounds.height, 'metric')}`;
        
        // Background rectangle
        const textWidth = dimText.length * 5.5;
        svg += `    <rect x="${x - textWidth / 2}" y="${y - 7}" width="${textWidth}" height="14" class="dimension-bg" rx="2" />\n`;
        svg += `    <text x="${x}" y="${y}" class="dimension">${dimText}</text>\n`;
      }
    }
    
    // Total area (bottom-right corner) - only if explicitly enabled
    if (opts.includeTotalArea) {
      const bounds = this.calculateBounds(geometry);
      const x = this.toSVGX(bounds.maxX - 1, offsetX, opts.scale);
      const y = this.toSVGY(bounds.maxY - 0.5, offsetY, opts.scale);
      
      const totalAreaText = `Total: ${formatArea(geometry.metadata.totalArea, 'metric')}`;
      const textWidth = totalAreaText.length * 5.5;
      
      svg += `    <rect x="${x - textWidth}" y="${y - 7}" width="${textWidth + 10}" height="14" class="dimension-bg" rx="2" />\n`;
      svg += `    <text x="${x - 5}" y="${y}" class="dimension" text-anchor="end">${totalAreaText}</text>\n`;
    }
    
    return svg;
  }

  /**
   * Offset SVG path coordinates
   */
  private offsetSVGPath(path: string, offsetX: number, offsetY: number, scale: number): string {
    // Apply offset to path coordinates
    // Path format: M x1 y1 A r r 0 flag1 flag2 x2 y2
    const pathRegex = /M ([\d.]+) ([\d.]+) A ([\d.]+) ([\d.]+) (\d) (\d) (\d) ([\d.]+) ([\d.]+)/;
    const match = path.match(pathRegex);
    
    if (!match) return path;
    
    const x1 = parseFloat(match[1]) + offsetX;
    const y1 = parseFloat(match[2]) + offsetY;
    const r1 = parseFloat(match[3]);
    const r2 = parseFloat(match[4]);
    const rotation = match[5];
    const largeArc = match[6];
    const sweep = match[7];
    const x2 = parseFloat(match[8]) + offsetX;
    const y2 = parseFloat(match[9]) + offsetY;
    
    return `M ${x1} ${y1} A ${r1} ${r2} ${rotation} ${largeArc} ${sweep} ${x2} ${y2}`;
  }

  /**
   * Convert world X to SVG X
   */
  private toSVGX(x: number, offsetX: number, scale: number): number {
    return x * scale + offsetX;
  }

  /**
   * Convert world Y to SVG Y
   */
  private toSVGY(y: number, offsetY: number, scale: number): number {
    return y * scale + offsetY;
  }

  /**
   * Convert world point to SVG point
   */
  private toSVGPoint(p: Point2D, offsetX: number, offsetY: number, scale: number): { x: number; y: number } {
    return {
      x: this.toSVGX(p.x, offsetX, scale),
      y: this.toSVGY(p.y, offsetY, scale)
    };
  }

  /**
   * Export as data URL
   */
  exportAsDataURL(geometry: FloorPlanGeometry, options?: Partial<EnhancedSVGOptions>): string {
    const svg = this.export(geometry, options);
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }
}

export const enhancedSVGExporter = new EnhancedSVGExporter();
