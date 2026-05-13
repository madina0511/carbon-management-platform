import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';

class InsightDto {
  totalEmission: number;
  scope1: number;
  scope2: number;
  scope3: number;
  byMonth: { month: string; total: number }[];
  byCategory: { category: string; emission: number; scope: string }[];
}

class ChatDto {
  message: string;
  context: {
    totalEmission: number;
    scope2: number;
    scope3: number;
    byCategory: { category: string; emission: number }[];
  };
  history: { role: 'user' | 'assistant'; content: string }[];
}

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('insight')
  async getInsight(@Body() dto: InsightDto) {
    const insight = await this.aiService.generateInsight(dto);
    return { insight };
  }

  @Post('chat')
  async chat(@Body() dto: ChatDto) {
    const reply = await this.aiService.chat(
      dto.message,
      dto.context,
      dto.history ?? [],
    );
    return { reply };
  }
}
