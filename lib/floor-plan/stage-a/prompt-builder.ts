/**
 * Stage A: Dynamic LLM Prompt Builder
 * Constructs optimized prompts for floor plan specification generation
 */

import { GenerateFloorPlanRequest } from '../types';
import { ROOM_AREA_RANGES, ROOM_ASPECT_RATIOS, ROOM_ZONES, DEFAULT_ADJACENCIES } from '../config';

export function buildSpecificationPrompt(request: GenerateFloorPlanRequest): string {
  const { userInput, parameters } = request;
  
  const systemRole = `You are an expert architectural specification analyst. Your task is to convert natural language floor plan descriptions into precise, structured JSON specifications that will be used by a geometric layout engine.

CRITICAL RULES:
1. Output ONLY valid JSON - no markdown, no explanations, no code blocks
2. All measurements must be in METERS (m²)
3. Every room must have realistic dimensions based on architectural standards
4. Total room areas + 15% circulation should not exceed the total area
5. Include strong adjacency preferences for functionally related rooms
6. Ensure all constraints are mathematically solvable`;

  const userPrompt = buildUserPrompt(userInput, parameters);
  
  const schemaDefinition = buildSchemaDefinition();
  
  const examples = buildExamples();
  
  return `${systemRole}

${userPrompt}

${schemaDefinition}

${examples}

Now generate the specification in pure JSON format (no markdown, no code blocks):`;
}

function buildUserPrompt(userInput: string, parameters: GenerateFloorPlanRequest['parameters']): string {
  let prompt = `REQUIREMENT:
User Description: "${userInput}"

`;

  if (parameters.totalArea) {
    prompt += `Total Floor Area: ${parameters.totalArea} m²\n`;
  }
  
  prompt += `Floors: ${parameters.floors}\n`;
  
  // Room counts
  const roomCounts: string[] = [];
  if (parameters.rooms.bedroom) roomCounts.push(`${parameters.rooms.bedroom} bedroom(s)`);
  if (parameters.rooms.bathroom) roomCounts.push(`${parameters.rooms.bathroom} bathroom(s)`);
  if (parameters.rooms.kitchen) roomCounts.push(`${parameters.rooms.kitchen} kitchen(s)`);
  if (parameters.rooms.livingRoom) roomCounts.push(`${parameters.rooms.livingRoom} living room(s)`);
  if (parameters.rooms.diningRoom) roomCounts.push(`${parameters.rooms.diningRoom} dining room(s)`);
  if (parameters.rooms.study) roomCounts.push(`${parameters.rooms.study} study(ies)`);
  if (parameters.rooms.utility) roomCounts.push(`${parameters.rooms.utility} utility room(s)`);
  
  if (roomCounts.length > 0) {
    prompt += `Required Rooms: ${roomCounts.join(', ')}\n`;
  }
  
  if (parameters.style) {
    prompt += `Architectural Style: ${parameters.style}\n`;
  }
  
  if (parameters.preferences) {
    prompt += `\nPreferences:\n`;
    if (parameters.preferences.openPlan) prompt += `- Open plan layout (kitchen + living + dining)\n`;
    if (parameters.preferences.ensuites) prompt += `- Ensuite bathrooms for bedrooms\n`;
    if (parameters.preferences.gardenAccess) prompt += `- Garden/outdoor access\n`;
  }
  
  return prompt;
}

function buildSchemaDefinition(): string {
  return `
OUTPUT SCHEMA:
{
  "totalArea": <number>,           // Target total floor area in m²
  "tolerance": <number>,            // Acceptable deviation % (typically 5)
  "rooms": [                        // Array of room specifications
    {
      "id": <string>,               // Unique room identifier (e.g., "bedroom1", "kitchen")
      "type": <string>,             // One of: bedroom, bathroom, kitchen, living, dining, hallway, study, utility, garage, balcony
      "minArea": <number>,          // Minimum area in m²
      "maxArea": <number>,          // Maximum area in m²
      "aspectRatio": {
        "min": <number>,            // Minimum width/height ratio
        "max": <number>             // Maximum width/height ratio
      },
      "zone": <string>,             // One of: public, private, service
      "requiresWindow": <boolean>,  // True if room needs natural light
      "requiresDoor": <boolean>,    // True if room needs door
      "priority": <number>          // Placement priority (1-10, higher = place first)
    }
  ],
  "adjacencyGraph": [               // Room connection preferences
    {
      "from": <string>,             // Room ID
      "to": <string>,               // Room ID
      "weight": <number>,           // Preference strength (0-10, 10 = must be adjacent)
      "type": <string>              // One of: must, should, avoid
    }
  ],
  "constraints": [                  // Additional hard/soft constraints
    {
      "type": <string>,             // One of: minDimension, maxDimension, aspectRatio, adjacency, separation, alignment
      "room": <string>,             // Room ID (if applicable)
      "rooms": [<string>],          // Room IDs (if applicable)
      "value": <number or object>,  // Constraint value
      "priority": <string>          // One of: required, strong, medium, weak
    }
  ],
  "style": <string>,                // Architectural style
  "metadata": {
    "floors": <number>,
    "entrance": <string>,           // One of: north, south, east, west
    "preferences": {
      "openPlan": <boolean>,
      "ensuites": <boolean>,
      "gardenAccess": <boolean>
    }
  }
}

ROOM AREA GUIDELINES (m²):
${Object.entries(ROOM_AREA_RANGES).map(([type, range]) => 
  `- ${type}: ${range.min}-${range.max} m² (optimal: ${range.optimal} m²)`
).join('\n')}

ASPECT RATIO GUIDELINES:
${Object.entries(ROOM_ASPECT_RATIOS).map(([type, ratio]) => 
  `- ${type}: ${ratio.min}-${ratio.max}`
).join('\n')}

ZONE CLASSIFICATION:
${Object.entries(ROOM_ZONES).map(([type, zone]) => 
  `- ${type}: ${zone}`
).join('\n')}

COMMON ADJACENCY PREFERENCES:
${DEFAULT_ADJACENCIES.map(adj => 
  `- ${adj.from} ↔ ${adj.to}: weight ${adj.weight}`
).join('\n')}`;
}

function buildExamples(): string {
  return `
EXAMPLES:

Example 1: "2 bedroom apartment, 80 sqm"
{
  "totalArea": 80,
  "tolerance": 5,
  "rooms": [
    {"id": "living", "type": "living", "minArea": 20, "maxArea": 28, "aspectRatio": {"min": 0.7, "max": 1.5}, "zone": "public", "requiresWindow": true, "requiresDoor": true, "priority": 10},
    {"id": "kitchen", "type": "kitchen", "minArea": 10, "maxArea": 14, "aspectRatio": {"min": 0.6, "max": 1.8}, "zone": "service", "requiresWindow": true, "requiresDoor": true, "priority": 9},
    {"id": "bedroom1", "type": "bedroom", "minArea": 12, "maxArea": 16, "aspectRatio": {"min": 0.7, "max": 1.4}, "zone": "private", "requiresWindow": true, "requiresDoor": true, "priority": 8},
    {"id": "bedroom2", "type": "bedroom", "minArea": 10, "maxArea": 14, "aspectRatio": {"min": 0.7, "max": 1.4}, "zone": "private", "requiresWindow": true, "requiresDoor": true, "priority": 7},
    {"id": "bathroom", "type": "bathroom", "minArea": 4, "maxArea": 6, "aspectRatio": {"min": 0.6, "max": 1.5}, "zone": "private", "requiresWindow": false, "requiresDoor": true, "priority": 6},
    {"id": "hallway", "type": "hallway", "minArea": 4, "maxArea": 6, "aspectRatio": {"min": 0.3, "max": 0.7}, "zone": "public", "requiresWindow": false, "requiresDoor": false, "priority": 5}
  ],
  "adjacencyGraph": [
    {"from": "kitchen", "to": "living", "weight": 9, "type": "should"},
    {"from": "bedroom1", "to": "bathroom", "weight": 7, "type": "should"},
    {"from": "hallway", "to": "living", "weight": 8, "type": "must"},
    {"from": "hallway", "to": "bedroom1", "weight": 8, "type": "must"},
    {"from": "hallway", "to": "bedroom2", "weight": 8, "type": "must"}
  ],
  "constraints": [
    {"type": "minDimension", "room": "bedroom1", "value": 3.0, "priority": "strong"},
    {"type": "minDimension", "room": "kitchen", "value": 2.5, "priority": "strong"}
  ],
  "style": "modern",
  "metadata": {
    "floors": 1,
    "entrance": "north",
    "preferences": {"openPlan": false, "ensuites": false, "gardenAccess": false}
  }
}

Example 2: "3BR villa with ensuite, open plan"
{
  "totalArea": 150,
  "tolerance": 5,
  "rooms": [
    {"id": "living_dining", "type": "living", "minArea": 35, "maxArea": 45, "aspectRatio": {"min": 1.2, "max": 2.0}, "zone": "public", "requiresWindow": true, "requiresDoor": true, "priority": 10},
    {"id": "kitchen", "type": "kitchen", "minArea": 15, "maxArea": 20, "aspectRatio": {"min": 0.7, "max": 1.5}, "zone": "service", "requiresWindow": true, "requiresDoor": false, "priority": 9},
    {"id": "master_bedroom", "type": "bedroom", "minArea": 18, "maxArea": 25, "aspectRatio": {"min": 0.8, "max": 1.4}, "zone": "private", "requiresWindow": true, "requiresDoor": true, "priority": 8},
    {"id": "master_ensuite", "type": "bathroom", "minArea": 6, "maxArea": 9, "aspectRatio": {"min": 0.7, "max": 1.3}, "zone": "private", "requiresWindow": true, "requiresDoor": true, "priority": 7},
    {"id": "bedroom2", "type": "bedroom", "minArea": 12, "maxArea": 16, "aspectRatio": {"min": 0.7, "max": 1.4}, "zone": "private", "requiresWindow": true, "requiresDoor": true, "priority": 6},
    {"id": "bedroom3", "type": "bedroom", "minArea": 12, "maxArea": 16, "aspectRatio": {"min": 0.7, "max": 1.4}, "zone": "private", "requiresWindow": true, "requiresDoor": true, "priority": 5},
    {"id": "bathroom", "type": "bathroom", "minArea": 5, "maxArea": 7, "aspectRatio": {"min": 0.7, "max": 1.3}, "zone": "private", "requiresWindow": false, "requiresDoor": true, "priority": 4},
    {"id": "hallway", "type": "hallway", "minArea": 6, "maxArea": 10, "aspectRatio": {"min": 0.3, "max": 0.6}, "zone": "public", "requiresWindow": false, "requiresDoor": false, "priority": 3}
  ],
  "adjacencyGraph": [
    {"from": "kitchen", "to": "living_dining", "weight": 10, "type": "must"},
    {"from": "master_bedroom", "to": "master_ensuite", "weight": 10, "type": "must"},
    {"from": "hallway", "to": "living_dining", "weight": 8, "type": "must"},
    {"from": "hallway", "to": "master_bedroom", "weight": 8, "type": "must"},
    {"from": "hallway", "to": "bedroom2", "weight": 8, "type": "must"},
    {"from": "hallway", "to": "bedroom3", "weight": 8, "type": "must"},
    {"from": "hallway", "to": "bathroom", "weight": 7, "type": "should"}
  ],
  "constraints": [
    {"type": "adjacency", "rooms": ["living_dining", "kitchen"], "value": 1.0, "priority": "required"}
  ],
  "style": "modern",
  "metadata": {
    "floors": 1,
    "entrance": "south",
    "preferences": {"openPlan": true, "ensuites": true, "gardenAccess": true}
  }
}`;
}

/**
 * Build prompt for variation generation
 * Creates variations by adjusting room sizes and adjacencies
 */
export function buildVariationPrompt(baseSpec: any, variationNumber: number): string {
  return `Based on this floor plan specification, create a variation by:
1. Adjusting room sizes within their min/max ranges (±10%)
2. Modifying adjacency weights slightly (±1 point)
3. Keeping the same rooms and overall structure
4. Ensuring total area compliance

Base Specification:
${JSON.stringify(baseSpec, null, 2)}

Variation ${variationNumber}: Generate a JSON specification with these subtle changes.
Output ONLY the JSON (no markdown, no explanations):`;
}
