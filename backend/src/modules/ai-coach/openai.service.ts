import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { GeneratedInsightItem, OpenAiInsightResponse } from './dto/ai-insight.dto';
import { FinancialContext } from './financial-context.service';

@Injectable()
export class OpenAiService {
  private readonly logger = new Logger(OpenAiService.name);
  private client: OpenAI | null = null;
  private readonly model: string;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    this.model = this.config.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    } else {
      this.logger.warn('OPENAI_API_KEY not set money notes will use rule-based fallback');
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async generateInsights(
    systemPrompt: string,
    userPrompt: string,
    context: FinancialContext,
  ): Promise<OpenAiInsightResponse> {
    if (!this.client) {
      throw new Error('OpenAI not configured');
    }

    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0.4,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `${userPrompt}\n\nFinancial data (amounts in major currency units):\n${JSON.stringify(context, null, 2)}`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error('Empty response from OpenAI');

    return this.parseResponse(raw);
  }

  parseResponse(raw: string): OpenAiInsightResponse {
    const parsed = JSON.parse(raw) as OpenAiInsightResponse;
    if (!parsed.insights || !Array.isArray(parsed.insights)) {
      throw new Error('Invalid OpenAI response structure');
    }
    parsed.insights = parsed.insights.map((item) => ({
      title: String(item.title).slice(0, 200),
      content: String(item.content).slice(0, 2000),
      category: item.category ?? 'insight',
      severity: this.normalizeSeverity(item.severity),
    }));
    return parsed;
  }

  private normalizeSeverity(severity: string): GeneratedInsightItem['severity'] {
    const valid = ['info', 'warning', 'success', 'critical'] as const;
    return valid.includes(severity as GeneratedInsightItem['severity'])
      ? (severity as GeneratedInsightItem['severity'])
      : 'info';
  }
}
