import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateInsight(summaryData: {
    totalEmission: number;
    scope1: number;
    scope2: number;
    scope3: number;
    byMonth: { month: string; total: number }[];
    byCategory: { category: string; emission: number; scope: string }[];
  }): Promise<string> {
    try {
      const prompt = `
You are a carbon footprint analyst. Analyze the following emission data and provide a concise, actionable insight (2-3 sentences). Focus on the biggest emission source and one concrete reduction recommendation.
Detect the language from the system locale and respond in Korean by default, but if the user interacts in English, respond in English.

Data:
- Total emissions: ${summaryData.totalEmission} kgCO₂e
- Scope 1: ${summaryData.scope1} kgCO₂e
- Scope 2 (electricity): ${summaryData.scope2} kgCO₂e  
- Scope 3 (supply chain): ${summaryData.scope3} kgCO₂e
- Monthly trend: ${JSON.stringify(summaryData.byMonth)}
- By category: ${JSON.stringify(summaryData.byCategory)}
`.trim();

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.7,
      });

      return (
        response.choices[0]?.message?.content ??
        '인사이트를 생성할 수 없습니다.'
      );
    } catch (error) {
      console.error('[AiService] generateInsight error:', error);
      throw new InternalServerErrorException('Failed to generate AI insight');
    }
  }

  async chat(
    userMessage: string,
    emissionContext: {
      totalEmission: number;
      scope2: number;
      scope3: number;
      byCategory: { category: string; emission: number }[];
    },
    history: { role: 'user' | 'assistant'; content: string }[],
  ): Promise<string> {
    try {
      const systemPrompt = `
You are a carbon footprint assistant for a manufacturing company.
Detect the language of the user's message and respond in that same language only.

Current emission data:
- Total: ${emissionContext.totalEmission} kgCO₂e
- Scope 2 (electricity): ${emissionContext.scope2} kgCO₂e
- Scope 3 (supply chain): ${emissionContext.scope3} kgCO₂e
- By category: ${JSON.stringify(emissionContext.byCategory)}

Be concise, data-driven, and practical. If asked something unrelated to carbon/emissions, politely redirect.
`.trim();

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-6), // last 3 turns for context
        { role: 'user', content: userMessage },
      ];

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      return (
        response.choices[0]?.message?.content ?? '답변을 생성할 수 없습니다.'
      );
    } catch (error) {
      console.error('[AiService] chat error:', error);
      throw new InternalServerErrorException(
        'Failed to generate chat response',
      );
    }
  }
}
