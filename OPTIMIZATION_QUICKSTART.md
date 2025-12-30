# Quick Start Guide: Enhanced Floor Plan Generation System

## Overview

This guide explains how to use the newly implemented quality optimizations in the floor plan generation system.

## Core Components

### 1. Architectural Rule Engine

```typescript
import { architecturalRules, ROOM_STANDARDS } from '@/lib/floor-plan/stage-a/architectural-rules';

// Validate a room against standards
const issues = architecturalRules.validateRoom('bedroom', 12.5, { width: 3.5, height: 3.6 });
// Returns: ValidationIssue[] (errors, warnings, info)

// Get recommended adjacency weight
const weight = architecturalRules.getAdjacencyWeight('kitchen', 'dining');
// Returns: 10 (must-adjacent)

// Check area distribution
const areaIssues = architecturalRules.validateAreaDistribution(
  totalArea,
  new Map([['bedroom1', 14], ['kitchen', 12], ...])
);
```

### 2. Multi-Pass Validator

```typescript
import { multiPassValidator } from '@/lib/floor-plan/stage-a/multi-pass-validator';

// Validate specification with multiple passes
const result = multiPassValidator.validate(specification);

console.log(result.finalValid); // true/false
console.log(result.totalIssues); // { errors: 0, warnings: 2, info: 1 }

// Get corrected spec if auto-corrections were applied
if (result.correctedSpec) {
  specification = result.correctedSpec;
}

// Generate human-readable report
const report = multiPassValidator.generateReport(result);
console.log(report);
```

### 3. Enhanced Prompt Builder

```typescript
import { buildSpecificationPrompt } from '@/lib/floor-plan/stage-a/prompt-builder';

const prompt = buildSpecificationPrompt({
  userInput: "I need a 2 bedroom apartment with open kitchen",
  parameters: {
    totalArea: 80,
    unit: 'metric',
    floors: 1,
    rooms: {
      bedroom: 2,
      bathroom: 1,
      kitchen: 1,
      livingRoom: 1
    },
    style: 'modern'
  },
  variationCount: 3
});

// Prompt now includes:
// - Building typology context (apartment)
// - Architectural rules for each room
// - Mandatory adjacency preferences
// - Functional requirements
// - Circulation standards
```

### 4. Zone-Based Constraint Solver

```typescript
import { ConstraintSolver } from '@/lib/floor-plan/stage-b/constraint-solver';

const solver = new ConstraintSolver();
const solution = solver.solve(specification);

// Solution includes:
// - Zero-overlap room placements
// - Optimized adjacency satisfaction
// - Zone-based spatial organization
// - Multi-objective score maximization

console.log(solution.solved); // true/false
console.log(solution.iterations); // e.g., 347
console.log(solution.relaxedConstraints); // Any constraints that couldn't be satisfied
```

### 5. Multi-Objective Scoring

```typescript
import { multiObjectiveScorer } from '@/lib/floor-plan/stage-b/multi-objective-scorer';

const score = multiObjectiveScorer.score(
  placedRooms,
  specification,
  buildingWidth,
  buildingHeight
);

console.log(score.total); // 0-100
console.log(score.breakdown);
// {
//   areaCompliance: 92.5,
//   adjacencySatisfaction: 88.3,
//   compactness: 76.2,
//   alignment: 84.1,
//   naturalLight: 95.0
// }

console.log(score.details);
// {
//   satisfiedAdjacencies: 8,
//   totalAdjacencies: 9,
//   exteriorWallRooms: 6,
//   ...
// }
```

### 6. Enhanced SVG Exporter

```typescript
import { enhancedSVGExporter } from '@/lib/floor-plan/stage-c/enhanced-svg-exporter';

const svg = enhancedSVGExporter.export(geometry, {
  maketAiStyle: true,
  includeLabels: true,
  includeRoomDimensions: true,
  includeTotalArea: true,
  layerSeparation: true,
  scale: 15 // pixels per meter
});

// SVG features:
// - Maket.ai styling (bold walls, clean labels)
// - Intelligent label placement (zero overlaps)
// - Dimension annotations
// - Organized layers for editing
```

## Complete Workflow Example

```typescript
import { buildSpecificationPrompt } from '@/lib/floor-plan/stage-a/prompt-builder';
import { multiPassValidator } from '@/lib/floor-plan/stage-a/multi-pass-validator';
import { ConstraintSolver } from '@/lib/floor-plan/stage-b/constraint-solver';
import { enhancedSVGExporter } from '@/lib/floor-plan/stage-c/enhanced-svg-exporter';
import { llmClient } from '@/lib/floor-plan/stage-a/llm-client';

async function generateFloorPlan(userRequest) {
  // Stage A: Generate specification with enhanced prompt
  const prompt = buildSpecificationPrompt(userRequest);
  const specJson = await llmClient.generate(prompt);
  let specification = JSON.parse(specJson);
  
  // Validate with multi-pass validator
  const validation = multiPassValidator.validate(specification);
  
  if (!validation.finalValid) {
    console.warn('Validation issues:', validation.totalIssues);
    
    // Use corrected spec if available
    if (validation.correctedSpec) {
      specification = validation.correctedSpec;
    } else {
      throw new Error('Specification failed validation');
    }
  }
  
  // Stage B: Solve constraints with optimization
  const solver = new ConstraintSolver();
  const solution = solver.solve(specification);
  
  if (!solution.solved) {
    console.warn('Relaxed constraints:', solution.relaxedConstraints);
  }
  
  // Convert solution to geometry (existing wall synthesizer, etc.)
  const geometry = await synthesizeGeometry(solution, specification);
  
  // Stage C: Export with professional styling
  const svg = enhancedSVGExporter.export(geometry, {
    maketAiStyle: true,
    includeLabels: true,
    includeRoomDimensions: true,
    includeTotalArea: true,
    layerSeparation: true
  });
  
  return {
    specification,
    geometry,
    svg,
    validationReport: multiPassValidator.generateReport(validation),
    score: multiObjectiveScorer.score(
      solution.rooms,
      specification,
      geometry.metadata.buildingDimensions.width,
      geometry.metadata.buildingDimensions.height
    )
  };
}
```

## Configuration Options

### Solver Configuration

```typescript
import { ConstraintSolver } from '@/lib/floor-plan/stage-b/constraint-solver';

// Default configuration
const solver = new ConstraintSolver(); // maxIterations: 1000

// Custom configuration
const customSolver = new ConstraintSolver(500); // Faster but lower quality
```

### Simulated Annealing Tuning

```typescript
import { SimulatedAnnealingOptimizer } from '@/lib/floor-plan/stage-b/simulated-annealing';

const optimizer = new SimulatedAnnealingOptimizer({
  initialTemperature: 100,
  coolingRate: 0.95,
  minTemperature: 0.1,
  maxIterations: 500,
  perturbationsPerIteration: 8
});

// For faster generation (lower quality):
const fastOptimizer = new SimulatedAnnealingOptimizer({
  maxIterations: 200,
  perturbationsPerIteration: 5
});

// For highest quality (slower):
const highQualityOptimizer = new SimulatedAnnealingOptimizer({
  maxIterations: 1000,
  perturbationsPerIteration: 12,
  coolingRate: 0.98
});
```

### SVG Export Options

```typescript
// Minimal SVG (fastest)
const minimalSvg = enhancedSVGExporter.export(geometry, {
  maketAiStyle: false,
  includeLabels: true,
  includeRoomDimensions: false,
  includeTotalArea: false,
  layerSeparation: false
});

// Professional SVG (recommended)
const professionalSvg = enhancedSVGExporter.export(geometry, {
  maketAiStyle: true,
  includeLabels: true,
  includeRoomDimensions: true,
  includeTotalArea: true,
  layerSeparation: true,
  scale: 15
});

// Export as data URL for embedding
const dataUrl = enhancedSVGExporter.exportAsDataURL(geometry, {
  maketAiStyle: true
});
```

## Performance Tips

### 1. Adaptive Iteration Counts

```typescript
function getOptimalIterations(roomCount: number): number {
  if (roomCount <= 4) return 200;  // Simple layouts
  if (roomCount <= 8) return 500;  // Medium complexity
  return 1000;                      // Complex layouts
}

const solver = new ConstraintSolver(getOptimalIterations(spec.rooms.length));
```

### 2. Parallel Variation Generation

```typescript
// Generate multiple variations in parallel
const variations = await Promise.all(
  [1, 2, 3, 4, 5].map(async (variationId) => {
    const modifiedSpec = applyVariation(baseSpec, variationId);
    const solution = solver.solve(modifiedSpec);
    return { variationId, solution };
  })
);

// Select best variation
const best = variations.reduce((best, current) => {
  const currentScore = multiObjectiveScorer.score(...).total;
  const bestScore = multiObjectiveScorer.score(...).total;
  return currentScore > bestScore ? current : best;
});
```

### 3. Early Termination

```typescript
// Monitor optimization progress
const optimizer = new SimulatedAnnealingOptimizer({
  maxIterations: 1000,
  perturbationsPerIteration: 8
});

const result = optimizer.optimize(placed, spec, width, height);

// Check if target quality reached
if (result.bestScore.total >= 85) {
  console.log('Target quality achieved early!');
}
```

## Debugging and Logging

### Enable Detailed Logging

```typescript
// The constraint solver includes console.log statements:
// [ConstraintSolver] Building dimensions: 10.95m x 7.30m
// [ConstraintSolver] Phase 1: Zone allocation and hierarchical placement
// [ConstraintSolver] Phase 2: Scoring initial placement
// [ConstraintSolver] Initial score: 67.42
// [ConstraintSolver] Phase 3: Simulated annealing optimization
// [ConstraintSolver] Optimized score: 84.16 (347 iterations)
// [ConstraintSolver] Score breakdown: { areaCompliance: 92.5, ... }
```

### Validation Reports

```typescript
const validation = multiPassValidator.validate(spec);
const report = multiPassValidator.generateReport(validation);

console.log(report);
// Output:
// === Floor Plan Specification Validation Report ===
//
// Overall Status: ✓ PASSED
// Total Issues: 0 errors, 2 warnings, 1 info
//
// --- Total Area Compliance ---
// Status: ✓ Passed
//
// --- Room Proportion Check ---
// Status: ✗ Failed
// Issues:
//   [WARNING] ASPECT_RATIO: bedroom1 aspect ratio 2.8 outside optimal range 0.9-1.5
//     → Adjust proportions closer to 1.2
//   ...
```

## Migration from Old System

### Before (Old API)

```typescript
import { ConstraintSolver } from '@/lib/floor-plan/stage-b/constraint-solver';
import { SVGExporter } from '@/lib/floor-plan/stage-c/svg-exporter';

const solver = new ConstraintSolver();
const solution = solver.solve(spec); // Basic placement

const exporter = new SVGExporter(50);
const svg = exporter.export(geometry); // Basic SVG
```

### After (Enhanced System)

```typescript
import { multiPassValidator } from '@/lib/floor-plan/stage-a/multi-pass-validator';
import { ConstraintSolver } from '@/lib/floor-plan/stage-b/constraint-solver';
import { enhancedSVGExporter } from '@/lib/floor-plan/stage-c/enhanced-svg-exporter';

// Validate first
const validation = multiPassValidator.validate(spec);
if (validation.correctedSpec) spec = validation.correctedSpec;

// Optimized solving
const solver = new ConstraintSolver();
const solution = solver.solve(spec); // Zone-based + optimization

// Professional export
const svg = enhancedSVGExporter.export(geometry, {
  maketAiStyle: true,
  includeLabels: true,
  includeRoomDimensions: true
});
```

## Common Issues and Solutions

### Issue: "Too many must-adjacencies"

```typescript
// Problem: Specification has too many weight-10 adjacencies
// Solution: Convert some to "should" (weight 7-8)

specification.adjacencyGraph = specification.adjacencyGraph.map(edge => {
  if (edge.weight === 10 && edge.from !== 'kitchen' && edge.to !== 'dining') {
    return { ...edge, weight: 8 }; // Downgrade to "should"
  }
  return edge;
});
```

### Issue: "Rooms too small after optimization"

```typescript
// Problem: Optimization shrinks rooms below minimum
// Solution: Increase minimum area constraints

specification.rooms = specification.rooms.map(room => ({
  ...room,
  minArea: room.minArea * 1.1 // 10% buffer
}));
```

### Issue: "Label overlaps still occurring"

```typescript
// Problem: Very small rooms or long names
// Solution: Use shorter room names or disable secondary labels

// Option 1: Shorten names
room.labels.name = room.labels.name.substring(0, 10);

// Option 2: Skip secondary labels for small rooms
const svg = enhancedSVGExporter.export(geometry, {
  includeRoomDimensions: false // Disable dimension labels
});
```

## Best Practices

1. **Always validate specifications** before solving
2. **Use multi-pass validator** to catch issues early
3. **Monitor optimization scores** to ensure quality
4. **Generate multiple variations** and select the best
5. **Enable Maket.ai styling** for professional output
6. **Use layered SVG** for client editability
7. **Adjust iteration counts** based on complexity

## Support

For issues or questions:
- Check validation reports for specification errors
- Review console logs for solver progress
- Examine score breakdowns for quality metrics
- Consult `FLOOR_PLAN_OPTIMIZATION_IMPLEMENTATION.md` for details
