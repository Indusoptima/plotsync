/**
 * API Route: /api/generate-floor-plan-v2
 * Multi-stage AI floor plan generation pipeline
 */

import { NextRequest, NextResponse } from 'next/server';
import { GenerateFloorPlanRequest, GenerateFloorPlanResponse, FloorPlanVariation } from '@/lib/floor-plan/types';
import { StageAOrchestrator } from '@/lib/floor-plan/stage-a';
import { StageBOrchestrator } from '@/lib/floor-plan/stage-b';
import { SVGExporter } from '@/lib/floor-plan/stage-c/svg-exporter';
import { Timer } from '@/lib/floor-plan/utils';

export async function POST(req: NextRequest) {
  const timer = new Timer();
  timer.start();

  try {
    // Parse request
    const request: GenerateFloorPlanRequest = await req.json();

    // Validate request
    if (!request.userInput && !request.parameters) {
      return NextResponse.json(
        { error: 'Missing userInput or parameters' },
        { status: 400 }
      );
    }

    // Set defaults
    const variationCount = Math.min(request.variationCount || 5, 10);

    // Initialize pipeline stages
    const stageA = new StageAOrchestrator();
    const stageB = new StageBOrchestrator();
    const svgExporter = new SVGExporter();

    // Array to collect variations
    const variations: FloorPlanVariation[] = [];
    const errors: GenerateFloorPlanResponse['errors'] = [];

    // Generate base specification (Stage A)
    let baseSpecResult;
    try {
      baseSpecResult = await stageA.generate(request);
    } catch (error: any) {
      errors.push({
        stage: 'A',
        message: `Specification generation failed: ${error.message}`,
        recoverable: false
      });
      
      return NextResponse.json(
        { 
          variations: [],
          errors,
          metadata: {
            totalGenerationTime: timer.stop(),
            timestamp: new Date().toISOString()
          }
        } as GenerateFloorPlanResponse,
        { status: 500 }
      );
    }

    // Generate variations in parallel
    const variationPromises: Promise<void>[] = [];

    for (let i = 0; i < variationCount; i++) {
      const promise = (async () => {
        try {
          // Generate variation specification
          const specResult = i === 0 
            ? baseSpecResult 
            : await stageA.generateVariation(baseSpecResult.specification, i);

          // Generate 2D geometry (Stage B)
          const geometryResult = await stageB.generate(specResult.specification);

          // Generate SVG preview
          const svg = svgExporter.export(geometryResult.geometry, {
            includeLabels: true,
            includeDimensions: false,
            includeFurniture: false
          });

          // Generate thumbnail (simplified - just SVG for now)
          const thumbnail = svgExporter.exportAsDataURL(geometryResult.geometry, {
            includeLabels: false,
            scale: 30 // Smaller scale for thumbnail
          });

          // Calculate total generation time for this variation
          const varGenerationTime = 
            specResult.metadata.generationTime + 
            geometryResult.metadata.generationTime;

          // Create variation
          const variation: FloorPlanVariation = {
            id: `variation_${i + 1}`,
            specification: specResult.specification,
            geometry: geometryResult.geometry,
            preview: {
              svg,
              thumbnail
            },
            metadata: {
              confidence: geometryResult.geometry.metadata.confidence,
              generationTime: varGenerationTime,
              relaxedConstraints: [
                ...specResult.metadata.validationWarnings,
                ...geometryResult.metadata.relaxedConstraints
              ]
            }
          };

          variations.push(variation);

        } catch (error: any) {
          errors.push({
            stage: error.stage || 'B',
            message: `Variation ${i + 1} failed: ${error.message}`,
            recoverable: true
          });
        }
      })();

      variationPromises.push(promise);
    }

    // Wait for all variations to complete
    await Promise.all(variationPromises);

    // Sort variations by confidence
    variations.sort((a, b) => b.metadata.confidence - a.metadata.confidence);

    const totalGenerationTime = timer.stop();

    const response: GenerateFloorPlanResponse = {
      variations,
      errors: errors.length > 0 ? errors : undefined,
      metadata: {
        totalGenerationTime,
        timestamp: new Date().toISOString()
      }
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Floor plan generation error:', error);
    
    return NextResponse.json(
      {
        variations: [],
        errors: [{
          stage: 'A',
          message: `Unexpected error: ${error.message}`,
          recoverable: false
        }],
        metadata: {
          totalGenerationTime: timer.stop(),
          timestamp: new Date().toISOString()
        }
      } as GenerateFloorPlanResponse,
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: '2.0.0',
    pipeline: {
      stageA: 'Text to Specification',
      stageB: '2D Geometric Layout',
      stageC: 'SVG Export'
    }
  });
}
