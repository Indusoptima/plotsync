/**
 * Stage A: Specification Parser
 * Parses and repairs LLM-generated JSON specifications
 */

import { FloorPlanSpecification, FloorPlanError, RoomSpec } from '../types';
import { ROOM_AREA_RANGES, ROOM_ASPECT_RATIOS, ROOM_ZONES } from '../config';

export class SpecificationParser {
  
  /**
   * Parse LLM response into FloorPlanSpecification
   */
  parse(llmResponse: string): FloorPlanSpecification {
    // Step 1: Extract JSON from response (handle markdown code blocks)
    const jsonString = this.extractJSON(llmResponse);
    
    // Step 2: Parse JSON with error handling
    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch (error) {
      // Attempt to repair common JSON issues
      const repaired = this.repairJSON(jsonString);
      try {
        parsed = JSON.parse(repaired);
      } catch (repairError) {
        throw new FloorPlanError(
          `Failed to parse LLM response as JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'A',
          true,
          { original: llmResponse, extracted: jsonString }
        );
      }
    }
    
    // Step 3: Validate and transform to typed specification
    return this.validateAndTransform(parsed);
  }

  /**
   * Extract JSON from LLM response (remove markdown, explanations, etc.)
   */
  private extractJSON(response: string): string {
    // Remove markdown code blocks
    let cleaned = response.trim();
    
    // Remove ```json or ``` blocks
    cleaned = cleaned.replace(/^```json?\s*/i, '');
    cleaned = cleaned.replace(/\s*```\s*$/i, '');
    
    // Find first { and last }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('No JSON object found in response');
    }
    
    return cleaned.substring(firstBrace, lastBrace + 1);
  }

  /**
   * Attempt to repair common JSON errors
   */
  private repairJSON(jsonString: string): string {
    let repaired = jsonString;
    
    // Fix trailing commas in arrays and objects
    repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
    
    // Fix single quotes to double quotes (be careful with content)
    repaired = repaired.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":');
    
    // Fix unquoted string values (simple heuristic)
    repaired = repaired.replace(/:\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*([,}\]])/g, (match, value, suffix) => {
      // Don't quote booleans, numbers, null
      if (['true', 'false', 'null'].includes(value) || !isNaN(Number(value))) {
        return match;
      }
      return `: "${value}"${suffix}`;
    });
    
    return repaired;
  }

  /**
   * Validate and transform parsed JSON to typed specification
   */
  private validateAndTransform(parsed: any): FloorPlanSpecification {
    // Validate required fields
    if (typeof parsed.totalArea !== 'number' || parsed.totalArea <= 0) {
      throw new FloorPlanError(
        'Invalid or missing totalArea',
        'A',
        false,
        { parsed }
      );
    }

    if (!Array.isArray(parsed.rooms) || parsed.rooms.length === 0) {
      throw new FloorPlanError(
        'Invalid or missing rooms array',
        'A',
        false,
        { parsed }
      );
    }

    // Transform rooms
    const rooms: RoomSpec[] = parsed.rooms.map((room: any, index: number) => {
      return this.validateRoom(room, index);
    });

    // Transform adjacency graph (with defaults)
    const adjacencyGraph = Array.isArray(parsed.adjacencyGraph) 
      ? parsed.adjacencyGraph.map((edge: any) => ({
          from: String(edge.from),
          to: String(edge.to),
          weight: typeof edge.weight === 'number' ? edge.weight : 5,
          type: edge.type || 'should'
        }))
      : [];

    // Transform constraints (with defaults)
    const constraints = Array.isArray(parsed.constraints)
      ? parsed.constraints.map((constraint: any) => ({
          type: constraint.type,
          room: constraint.room,
          rooms: constraint.rooms,
          value: constraint.value,
          priority: constraint.priority || 'medium'
        }))
      : [];

    return {
      totalArea: parsed.totalArea,
      tolerance: typeof parsed.tolerance === 'number' ? parsed.tolerance : 5,
      rooms,
      adjacencyGraph,
      constraints,
      style: parsed.style || 'modern',
      metadata: {
        floors: parsed.metadata?.floors || 1,
        entrance: parsed.metadata?.entrance || 'north',
        preferences: {
          openPlan: parsed.metadata?.preferences?.openPlan || false,
          ensuites: parsed.metadata?.preferences?.ensuites || false,
          gardenAccess: parsed.metadata?.preferences?.gardenAccess || false
        }
      }
    };
  }

  /**
   * Validate individual room specification
   */
  private validateRoom(room: any, index: number): RoomSpec {
    if (!room.id || typeof room.id !== 'string') {
      throw new FloorPlanError(
        `Room at index ${index} missing valid id`,
        'A',
        false,
        { room }
      );
    }

    if (!room.type || typeof room.type !== 'string') {
      throw new FloorPlanError(
        `Room ${room.id} missing valid type`,
        'A',
        false,
        { room }
      );
    }

    // Apply defaults from ROOM_AREA_RANGES if not provided
    const areaRange = ROOM_AREA_RANGES[room.type as keyof typeof ROOM_AREA_RANGES];
    const aspectRange = ROOM_ASPECT_RATIOS[room.type as keyof typeof ROOM_ASPECT_RATIOS];
    const zone = ROOM_ZONES[room.type as keyof typeof ROOM_ZONES];

    const minArea = typeof room.minArea === 'number' ? room.minArea : areaRange?.min || 5;
    const maxArea = typeof room.maxArea === 'number' ? room.maxArea : areaRange?.max || 20;

    if (minArea > maxArea) {
      throw new FloorPlanError(
        `Room ${room.id} has minArea > maxArea`,
        'A',
        false,
        { room }
      );
    }

    return {
      id: room.id,
      type: room.type,
      minArea,
      maxArea,
      aspectRatio: {
        min: room.aspectRatio?.min ?? aspectRange?.min ?? 0.7,
        max: room.aspectRatio?.max ?? aspectRange?.max ?? 1.5
      },
      zone: room.zone || zone || 'public',
      requiresWindow: typeof room.requiresWindow === 'boolean' 
        ? room.requiresWindow 
        : ['bedroom', 'living', 'kitchen'].includes(room.type),
      requiresDoor: typeof room.requiresDoor === 'boolean'
        ? room.requiresDoor
        : room.type !== 'hallway',
      priority: typeof room.priority === 'number' ? room.priority : 5
    };
  }

  /**
   * Merge specification with user overrides
   */
  merge(spec: FloorPlanSpecification, overrides: Partial<FloorPlanSpecification>): FloorPlanSpecification {
    return {
      ...spec,
      ...overrides,
      rooms: overrides.rooms || spec.rooms,
      adjacencyGraph: overrides.adjacencyGraph || spec.adjacencyGraph,
      constraints: overrides.constraints || spec.constraints,
      metadata: {
        ...spec.metadata,
        ...overrides.metadata
      }
    };
  }
}
