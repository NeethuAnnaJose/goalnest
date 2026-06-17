import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OpenAiService } from './openai.service';

describe('OpenAiService', () => {
  let service: OpenAiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenAiService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, def?: string) => {
              if (key === 'OPENAI_API_KEY') return '';
              if (key === 'OPENAI_MODEL') return 'gpt-4o-mini';
              return def;
            }),
          },
        },
      ],
    }).compile();
    service = module.get(OpenAiService);
  });

  it('reports not configured without API key', () => {
    expect(service.isConfigured()).toBe(false);
  });

  it('parses valid OpenAI JSON response', () => {
    const raw = JSON.stringify({
      summary: 'Good week',
      insights: [
        {
          title: 'Food spending up',
          content: 'You spent 30% more on food.',
          category: 'overspending',
          severity: 'warning',
        },
      ],
    });
    const result = service.parseResponse(raw);
    expect(result.insights).toHaveLength(1);
    expect(result.insights[0].title).toBe('Food spending up');
    expect(result.insights[0].severity).toBe('warning');
  });

  it('throws on invalid response structure', () => {
    expect(() => service.parseResponse('{"foo": "bar"}')).toThrow();
  });

  it('normalizes invalid severity to info', () => {
    const raw = JSON.stringify({
      insights: [{ title: 'Test', content: 'Body', category: 'insight', severity: 'invalid' }],
    });
    const result = service.parseResponse(raw);
    expect(result.insights[0].severity).toBe('info');
  });
});
