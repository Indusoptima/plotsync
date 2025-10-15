/**
 * Stage A: Text to Floor Plan Specification
 * Main orchestrator for Stage A
 */

import { GenerateFloorPlanRequest, FloorPlanSpecification, FloorPlanError } from '../types';
import { DEFAULT_CONFIG } from '../config';
import { Timer } from '../utils';
import { LLMClient } from './llm-client';
import { SpecificationParser } from './spec-parser';
import { SpecificationValidator } from './spec-validator';
import { buildSpecificationPrompt, buildVariationPrompt } from './prompt-builder';

export interface StageAResult {
  specification: FloorPlanSpecification;
  metadata: {
    generationTime: number;
    llmUsage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    validationWarnings: string[];
  };
}

export class StageAOrchestrator {
  private llmClient: LLMClient;
  private parser: SpecificationParser;
  private validator: SpecificationValidator;

  constructor() {
    this.llmClient = new LLMClient(DEFAULT_CONFIG.stageA.llm);
    this.parser = new SpecificationParser();
    this.validator = new SpecificationValidator();
  }

  /**
   * Generate floor plan specification from user request
   */
  async generate(request: GenerateFloorPlanRequest): Promise<StageAResult> {
    const timer = new Timer();
    timer.start();

    try {
      // Step 1: Build prompt
      const prompt = buildSpecificationPrompt(request);

      // Step 2: Call LLM
      const llmResponse = await this.llmClient.generate(prompt);

      // Step 3: Parse response
      const specification = this.parser.parse(llmResponse.content);

      // Step 4: Validate specification
      const validationResult = this.validator.validate(specification);

      if (!validationResult.valid) {
        const criticalErrors = validationResult.errors.filter(e => e.severity === 'error');
        if (criticalErrors.length > 0) {
          throw new FloorPlanError(
            `Specification validation failed: ${criticalErrors.map(e => e.message).join('; ')}`,
            'A',
            true,
            { errors: criticalErrors }
          );
        }
      }

      const generationTime = timer.stop();

      return {
        specification,
        metadata: {
          generationTime,
          llmUsage: llmResponse.usage,
          validationWarnings: validationResult.errors
            .filter(e => e.severity === 'warning')
            .map(e => e.message)
        }
      };

    } catch (error) {
      if (error instanceof FloorPlanError) {
        throw error;
      }
      throw new FloorPlanError(
        `Stage A failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'A',
        false,
        error
      );
    }
  }

  /**
   * Generate variation of existing specification
   */
  async generateVariation(
    baseSpec: FloorPlanSpecification,
    variationNumber: number
  ): Promise<StageAResult> {
    const timer = new Timer();
    timer.start();

    try {
      const prompt = buildVariationPrompt(baseSpec, variationNumber);
      const llmResponse = await this.llmClient.generate(prompt);
      const specification = this.parser.parse(llmResponse.content);
      
      // Validate variation
      const validationResult = this.validator.validate(specification);
      if (!validationResult.valid) {
        // For variations, fall back to base spec with minor adjustments
        return this.createFallbackVariation(baseSpec, variationNumber);
      }

      const generationTime = timer.stop();

      return {
        specification,
        metadata: {
          generationTime,
          llmUsage: llmResponse.usage,
          validationWarnings: validationResult.errors
            .filter(e => e.severity === 'warning')
            .map(e => e.message)
        }
      };

    } catch (error) {
      // Fallback to programmatic variation
      return this.createFallbackVariation(baseSpec, variationNumber);
    }
  }

  /**
   * Create programmatic variation when LLM fails
   */
  private createFallbackVariation(
    baseSpec: FloorPlanSpecification,
    variationNumber: number
  ): StageAResult {
    const factor = 0.95 + (variationNumber * 0.02); // 0.95, 0.97, 0.99, 1.01, 1.03

    const variation: FloorPlanSpecification = {
      ...baseSpec,
      rooms: baseSpec.rooms.map(room => ({
        ...room,
        minArea: room.minArea * factor,
        maxArea: room.maxArea * factor
      })),
      adjacencyGraph: baseSpec.adjacencyGraph.map(edge => ({
        ...edge,
        weight: Math.max(1, Math.min(10, edge.weight + (variationNumber % 3) - 1))
      }))
    };

    return {
      specification: variation,
      metadata: {
        generationTime: 0,
        llmUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        validationWarnings: ['Generated programmatically (LLM variation failed)']
      }
    };
  }
}

// Export all Stage A components
export { LLMClient } from './llm-client';
export { SpecificationParser } from './spec-parser';
export { SpecificationValidator } from './spec-validator';
export { buildSpecificationPrompt, buildVariationPrompt } from './prompt-builder';
