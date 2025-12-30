/**
 * Core TypeScript interfaces for the Multi-Stage AI Floor Plan Generation System
 */

// ============================================================================
// COMMON TYPES
// ============================================================================

export type RoomType = 
  | 'bedroom' 
  | 'bathroom' 
  | 'kitchen' 
  | 'living' 
  | 'dining' 
  | 'hallway'
  | 'study'
  | 'utility'
  | 'garage'
  | 'balcony';

export type ZoneType = 'public' | 'private' | 'service';

export type ArchitecturalStyle = 'modern' | 'traditional' | 'minimalist' | 'industrial';

export type UnitSystem = 'metric' | 'imperial';

export interface Point2D {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface AspectRatio {
  min: number;
  max: number;
}

// ============================================================================
// STAGE A: SPECIFICATION TYPES
// ============================================================================

export interface RoomSpec {
  id: string;
  type: RoomType;
  minArea: number;
  maxArea: number;
  aspectRatio: AspectRatio;
  zone: ZoneType;
  requiresWindow: boolean;
  requiresDoor: boolean;
  priority?: number; // For placement order
  
  // Enhanced fields for better specification
  dimensionalConstraints?: {
    minWidth?: number;
    minLength?: number;
    optimalDimensions?: { width: number; height: number };
  };
  functionalRequirements?: {
    naturalLight: 'required' | 'preferred' | 'optional';
    ventilation: 'required' | 'preferred' | 'optional';
    furnitureZones?: Array<{
      type: string;
      clearance: number;
      wallPlacement?: boolean;
    }>;
  };
  spatialPreferences?: {
    exteriorWall?: boolean;
    cornerLocation?: boolean;
    quietZone?: boolean;
  };
}

export interface AdjacencyEdge {
  from: string; // Room ID
  to: string;   // Room ID
  weight: number; // 0-10, higher means stronger preference
  type?: 'must' | 'should' | 'neutral' | 'avoid';
  justification?: string; // Why this adjacency is important
}

export interface Constraint {
  type: 'minDimension' | 'maxDimension' | 'aspectRatio' | 'adjacency' | 'separation' | 'alignment';
  room?: string;
  rooms?: string[];
  value: number | {min: number; max: number};
  priority: 'required' | 'strong' | 'medium' | 'weak';
}

export interface FloorPlanSpecification {
  totalArea: number;
  tolerance: number; // Percentage
  rooms: RoomSpec[];
  adjacencyGraph: AdjacencyEdge[];
  constraints: Constraint[];
  style: ArchitecturalStyle;
  metadata?: {
    floors?: number;
    entrance?: 'north' | 'south' | 'east' | 'west';
    preferences?: {
      openPlan?: boolean;
      ensuites?: boolean;
      gardenAccess?: boolean;
    };
  };
}

export interface SpecificationValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  suggestions?: string[];
}

// ============================================================================
// STAGE B: GEOMETRIC LAYOUT TYPES
// ============================================================================

export interface RoomGeometry {
  id: string;
  type: RoomType;
  geometry: {
    vertices: Point2D[]; // Polygon vertices
    centroid: Point2D;
    area: number;
    bounds: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
  labels: {
    name: string;
    area: string;
    dimensions: string;
  };
}

export interface Wall {
  id: string;
  type: 'exterior' | 'interior';
  thickness: number;
  geometry: {
    start: Point2D;
    end: Point2D;
  };
  length: number;
  structuralLoad: boolean;
  adjacentRooms: string[]; // Room IDs
}

export interface Opening {
  id: string;
  type: 'door' | 'window';
  width: number;
  height?: number;
  wallId: string;
  position: number; // 0-1 along wall length
  properties: {
    swingDirection?: number; // Degrees for doors
    sillHeight?: number;     // Meters for windows
    isEntry?: boolean;       // Main entrance door
  };
}

export interface CirculationPath {
  id: string;
  type: 'hallway' | 'corridor';
  geometry: {
    vertices: Point2D[];
    width: number;
  };
  connectsRooms: string[];
}

export interface FloorPlanGeometry {
  metadata: {
    totalArea: number;
    buildingDimensions: Dimensions;
    generatedAt: string;
    algorithmVersion: string;
    confidence: number; // 0-100
    relaxedConstraints: string[];
  };
  rooms: RoomGeometry[];
  walls: Wall[];
  openings: Opening[];
  circulation?: CirculationPath[];
  adjacencyGraph: {
    nodes: Array<{roomId: string; zone: ZoneType}>;
    edges: Array<{from: string; to: string; type: 'door' | 'open' | 'hallway'}>;
  };
}

export interface ConstraintSolution {
  rooms: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  solved: boolean;
  iterations: number;
  relaxedConstraints: string[];
}

export interface GeometricValidationResult {
  valid: boolean;
  checks: {
    nonOverlap: boolean;
    wallClosure: boolean;
    doorAccessibility: boolean;
    windowExposure: boolean;
    areaAccuracy: boolean;
    codeCompliance: boolean;
  };
  errors: string[];
  warnings: string[];
}

// ============================================================================
// STAGE C: 3D VISUALIZATION TYPES
// ============================================================================

export interface Material3D {
  name: string;
  type: 'wall' | 'floor' | 'ceiling' | 'door' | 'window' | 'furniture';
  properties: {
    color?: string;
    roughness?: number;
    metalness?: number;
    transmission?: number; // For glass
    textureUrl?: string;
    normalMapUrl?: string;
  };
}

export interface FurnitureItem {
  id: string;
  type: 'bed' | 'sofa' | 'table' | 'chair' | 'wardrobe' | 'sink' | 'toilet' | 'stove' | 'refrigerator';
  roomId: string;
  position: {x: number; y: number; z: number};
  rotation: number; // Degrees
  dimensions: {width: number; height: number; depth: number};
  material?: string;
}

export interface LightSource {
  type: 'directional' | 'ambient' | 'point' | 'hemisphere';
  position?: {x: number; y: number; z: number};
  intensity: number;
  color: string;
  castShadow?: boolean;
}

export interface FloorPlan3DScene {
  geometry: FloorPlanGeometry; // Reference to 2D geometry
  materials: Material3D[];
  furniture: FurnitureItem[];
  lighting: LightSource[];
  camera: {
    position: {x: number; y: number; z: number};
    target: {x: number; y: number; z: number};
    fov: number;
  };
  metadata: {
    renderQuality: 'low' | 'medium' | 'high';
    extrusionHeight: {
      exteriorWalls: number;
      interiorWalls: number;
      floor: number;
    };
  };
}

// ============================================================================
// EXPORT FORMATS
// ============================================================================

export interface SVGExportOptions {
  includeLabels: boolean;
  includeDimensions: boolean;
  includeFurniture: boolean;
  layerSeparation: boolean;
  scale: number; // pixels per meter
}

export interface GLTFExportOptions {
  includeTextures: boolean;
  optimizeGeometry: boolean;
  compression: 'none' | 'draco';
}

export interface DXFExportOptions {
  layerSeparation: boolean;
  includeDimensions: boolean;
  units: UnitSystem;
}

export interface ExportBundle {
  svg?: string;
  gltf?: Blob;
  dxf?: string;
  json: string; // Always include JSON
  metadata: {
    exportedAt: string;
    formats: string[];
  };
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface GenerateFloorPlanRequest {
  userInput: string;
  parameters: {
    totalArea?: number;
    unit: UnitSystem;
    floors: number;
    rooms: {
      bedroom?: number;
      bathroom?: number;
      kitchen?: number;
      livingRoom?: number;
      diningRoom?: number;
      study?: number;
      utility?: number;
    };
    style?: ArchitecturalStyle;
    preferences?: {
      openPlan?: boolean;
      ensuites?: boolean;
      gardenAccess?: boolean;
    };
  };
  variationCount: number;
}

export interface FloorPlanVariation {
  id: string;
  specification: FloorPlanSpecification;
  geometry: FloorPlanGeometry;
  scene3D?: FloorPlan3DScene;
  preview: {
    svg: string;
    thumbnail: string; // Base64 PNG
  };
  metadata: {
    confidence: number;
    generationTime: number;
    relaxedConstraints: string[];
  };
}

export interface GenerateFloorPlanResponse {
  variations: FloorPlanVariation[];
  errors?: Array<{
    stage: 'A' | 'B' | 'C';
    message: string;
    recoverable: boolean;
  }>;
  metadata: {
    totalGenerationTime: number;
    timestamp: string;
  };
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class FloorPlanError extends Error {
  constructor(
    message: string,
    public stage: 'A' | 'B' | 'C',
    public recoverable: boolean = false,
    public details?: any
  ) {
    super(message);
    this.name = 'FloorPlanError';
  }
}

export interface RetryStrategy {
  maxAttempts: number;
  currentAttempt: number;
  delayMs: number;
  backoffMultiplier: number;
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface StageAConfig {
  llm: {
    model: string;
    temperature: number;
    maxTokens: number;
    apiKey: string;
    baseUrl: string;
  };
  validation: {
    minTotalArea: number;
    maxTotalArea: number;
    minRoomCount: number;
    maxRoomCount: number;
  };
}

export interface StageBConfig {
  solver: {
    maxIterations: number;
    convergenceThreshold: number;
    constraintRelaxationFactor: number;
  };
  walls: {
    exteriorThickness: number;
    interiorThickness: number;
    minLength: number;
  };
  openings: {
    doorWidth: {
      standard: number;
      entrance: number;
    };
    windowSizePercent: {
      min: number;
      max: number;
      default: number;
    };
    minClearance: number;
  };
  circulation: {
    minCorridorWidth: number;
    minDoorClearance: number;
  };
}

export interface StageCConfig {
  rendering: {
    antialiasing: boolean;
    shadowMapping: boolean;
    pixelRatio: number;
  };
  extrusion: {
    wallHeight: {
      exterior: number;
      interior: number;
    };
    floorThickness: number;
    bevelSize: number;
  };
  furniture: {
    autoPlace: boolean;
    density: 'minimal' | 'moderate' | 'maximal';
    scaleToRoom: boolean;
  };
}

export interface PipelineConfig {
  stageA: StageAConfig;
  stageB: StageBConfig;
  stageC: StageCConfig;
  performance: {
    parallelVariations: boolean;
    cacheEnabled: boolean;
    timeoutMs: number;
  };
}
