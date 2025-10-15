/**
 * Stage A: LLM Client for OpenRouter API
 * Handles communication with LLM for specification generation
 */

import { StageAConfig, FloorPlanError } from '../types';
import { retryWithBackoff } from '../utils';

export interface LLMResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

export class LLMClient {
  private config: StageAConfig['llm'];

  constructor(config: StageAConfig['llm']) {
    this.config = config;
    
    if (!this.config.apiKey) {
      throw new FloorPlanError(
        'OpenRouter API key not configured. Set OPENROUTER_API_KEY environment variable.',
        'A',
        false
      );
    }
  }

  /**
   * Generate completion from LLM
   */
  async generate(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
    const requestBody = {
      model: this.config.model,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt }
      ],
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens
    };

    try {
      const response = await retryWithBackoff(
        async () => {
          const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.config.apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
              'X-Title': 'PlotSync Floor Plan Generator'
            },
            body: JSON.stringify(requestBody)
          });

          if (!res.ok) {
            const error = await res.text();
            throw new Error(`OpenRouter API error: ${res.status} - ${error}`);
          }

          return res.json();
        },
        3, // max attempts
        2000 // initial delay
      );

      // Parse OpenRouter response format
      const content = response.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('No content in LLM response');
      }

      return {
        content,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0
        },
        model: response.model || this.config.model
      };

    } catch (error) {
      throw new FloorPlanError(
        `LLM generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'A',
        true, // Recoverable - can retry
        error
      );
    }
  }

  /**
   * Generate with streaming (for future real-time updates)
   */
  async *generateStream(prompt: string, systemPrompt?: string): AsyncGenerator<string> {
    const requestBody = {
      model: this.config.model,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt }
      ],
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
      stream: true
    };

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'PlotSync Floor Plan Generator'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available for streaming');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (e) {
              // Skip invalid JSON
              continue;
            }
          }
        }
      }

    } catch (error) {
      throw new FloorPlanError(
        `LLM streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'A',
        true,
        error
      );
    }
  }

  /**
   * Validate API connection
   */
  async validateConnection(): Promise<boolean> {
    try {
      await this.generate('test', 'Respond with "OK"');
      return true;
    } catch (error) {
      return false;
    }
  }
}
