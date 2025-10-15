/**
 * Stage C: SVG Exporter
 * Generates editable SVG from floor plan geometry
 */

import { FloorPlanGeometry, SVGExportOptions } from '../types';
import { formatArea, formatDimension } from '../utils';

export class SVGExporter {
  private scale: number;
  private padding: number;

  constructor(scale: number = 50) { // 50 pixels per meter
    this.scale = scale;
    this.padding = 20;
  }

  /**
   * Export floor plan to SVG
   */
  export(geometry: FloorPlanGeometry, options: Partial<SVGExportOptions> = {}): string {
    const opts: SVGExportOptions = {
      includeLabels: true,
      includeDimensions: false,
      includeFurniture: false,
      layerSeparation: true,
      scale: this.scale,
      ...options
    };

    const { buildingDimensions } = geometry.metadata;
    const viewWidth = buildingDimensions.width * opts.scale + 2 * this.padding;
    const viewHeight = buildingDimensions.height * opts.scale + 2 * this.padding;

    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     width="${viewWidth}" 
     height="${viewHeight}"
     viewBox="0 0 ${viewWidth} ${viewHeight}">
  <defs>
    <style>
      .wall-exterior { stroke: #000; stroke-width: 3; fill: none; }
      .wall-interior { stroke: #666; stroke-width: 2; fill: none; }
      .room-fill { fill: #f5f5f5; stroke: none; opacity: 0.5; }
      .door { stroke: #8B4513; stroke-width: 2; fill: none; }
      .window { stroke: #4169E1; stroke-width: 2; fill: #87CEEB; opacity: 0.5; }
      .label { font-family: Arial, sans-serif; font-size: 12px; fill: #333; text-anchor: middle; }
      .dimension { font-family: Arial, sans-serif; font-size: 10px; fill: #666; }
    </style>
  </defs>
`;

    if (opts.layerSeparation) {
      svg += '  <!-- Layer: Room Fills -->\n';
      svg += '  <g id="layer-rooms">\n';
      svg += this.generateRoomFills(geometry, opts);
      svg += '  </g>\n\n';

      svg += '  <!-- Layer: Walls -->\n';
      svg += '  <g id="layer-walls">\n';
      svg += this.generateWalls(geometry, opts);
      svg += '  </g>\n\n';

      svg += '  <!-- Layer: Openings -->\n';
      svg += '  <g id="layer-openings">\n';
      svg += this.generateOpenings(geometry, opts);
      svg += '  </g>\n\n';

      if (opts.includeLabels) {
        svg += '  <!-- Layer: Labels -->\n';
        svg += '  <g id="layer-labels">\n';
        svg += this.generateLabels(geometry, opts);
        svg += '  </g>\n\n';
      }
    } else {
      svg += this.generateRoomFills(geometry, opts);
      svg += this.generateWalls(geometry, opts);
      svg += this.generateOpenings(geometry, opts);
      if (opts.includeLabels) {
        svg += this.generateLabels(geometry, opts);
      }
    }

    svg += '</svg>';
    return svg;
  }

  /**
   * Generate room fill polygons
   */
  private generateRoomFills(geometry: FloorPlanGeometry, opts: SVGExportOptions): string {
    let svg = '';
    
    for (const room of geometry.rooms) {
      const points = room.geometry.vertices
        .map(v => `${this.toSVGX(v.x)},${this.toSVGY(v.y)}`)
        .join(' ');
      
      svg += `    <polygon points="${points}" class="room-fill" data-room-id="${room.id}" />\n`;
    }
    
    return svg;
  }

  /**
   * Generate wall lines
   */
  private generateWalls(geometry: FloorPlanGeometry, opts: SVGExportOptions): string {
    let svg = '';
    
    for (const wall of geometry.walls) {
      const x1 = this.toSVGX(wall.geometry.start.x);
      const y1 = this.toSVGY(wall.geometry.start.y);
      const x2 = this.toSVGX(wall.geometry.end.x);
      const y2 = this.toSVGY(wall.geometry.end.y);
      
      const className = wall.type === 'exterior' ? 'wall-exterior' : 'wall-interior';
      
      svg += `    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${className}" data-wall-id="${wall.id}" />\n`;
    }
    
    return svg;
  }

  /**
   * Generate door and window symbols
   */
  private generateOpenings(geometry: FloorPlanGeometry, opts: SVGExportOptions): string {
    let svg = '';
    
    for (const opening of geometry.openings) {
      const wall = geometry.walls.find(w => w.id === opening.wallId);
      if (!wall) continue;

      const { start, end } = wall.geometry;
      const wallLength = Math.sqrt(
        Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
      );

      // Calculate position along wall
      const t = opening.position;
      const px = start.x + (end.x - start.x) * t;
      const py = start.y + (end.y - start.y) * t;

      // Calculate perpendicular offset
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const perpX = -dy / len;
      const perpY = dx / len;

      const openingHalfWidth = opening.width / 2;
      const x1 = px - (dx / len) * openingHalfWidth;
      const y1 = py - (dy / len) * openingHalfWidth;
      const x2 = px + (dx / len) * openingHalfWidth;
      const y2 = py + (dy / len) * openingHalfWidth;

      if (opening.type === 'door') {
        svg += `    <line x1="${this.toSVGX(x1)}" y1="${this.toSVGY(y1)}" x2="${this.toSVGX(x2)}" y2="${this.toSVGY(y2)}" class="door" data-opening-id="${opening.id}" />\n`;
        
        // Add door arc
        const arcRadius = opening.width * opts.scale;
        svg += `    <path d="M ${this.toSVGX(x1)} ${this.toSVGY(y1)} Q ${this.toSVGX(px)} ${this.toSVGY(py - opening.width * 0.5)} ${this.toSVGX(x2)} ${this.toSVGY(y2)}" class="door" fill="none" />\n`;
      } else {
        // Window
        svg += `    <rect x="${this.toSVGX(x1)}" y="${this.toSVGY(y1)}" width="${opening.width * opts.scale}" height="6" class="window" data-opening-id="${opening.id}" />\n`;
      }
    }
    
    return svg;
  }

  /**
   * Generate room labels
   */
  private generateLabels(geometry: FloorPlanGeometry, opts: SVGExportOptions): string {
    let svg = '';
    
    for (const room of geometry.rooms) {
      const cx = this.toSVGX(room.geometry.centroid.x);
      const cy = this.toSVGY(room.geometry.centroid.y);
      
      svg += `    <text x="${cx}" y="${cy - 5}" class="label">${room.labels.name}</text>\n`;
      svg += `    <text x="${cx}" y="${cy + 10}" class="label" style="font-size: 10px;">${room.labels.area}</text>\n`;
    }
    
    return svg;
  }

  /**
   * Convert world X to SVG X
   */
  private toSVGX(x: number): number {
    return x * this.scale + this.padding;
  }

  /**
   * Convert world Y to SVG Y (flip vertically)
   */
  private toSVGY(y: number): number {
    return this.padding + y * this.scale;
  }

  /**
   * Export as data URL
   */
  exportAsDataURL(geometry: FloorPlanGeometry, options?: Partial<SVGExportOptions>): string {
    const svg = this.export(geometry, options);
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }
}
