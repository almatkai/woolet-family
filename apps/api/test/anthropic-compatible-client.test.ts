import { afterEach, describe, expect, it } from 'bun:test';

import { createAnthropicCompatibleClient } from '../src/lib/anthropic-compatible-client';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('Anthropic-compatible client', () => {
  it('translates OpenAI messages and tool calls to the Messages API and back', async () => {
    let requestBody: any;
    let apiKeyHeader: string | null = null;
    let requestPath = '';

    globalThis.fetch = (async (
      input: Parameters<typeof globalThis.fetch>[0],
      init?: Parameters<typeof globalThis.fetch>[1]
    ) => {
      requestPath = new URL(String(input)).pathname;
      apiKeyHeader = new Headers(init?.headers).get('x-api-key');
      requestBody = JSON.parse(String(init?.body));
      return Response.json({
        id: 'msg_test',
        model: 'claude-test',
        stop_reason: 'tool_use',
        content: [
          { type: 'text', text: 'I will check that.' },
          { type: 'tool_use', id: 'tool_1', name: 'lookup_balance', input: { accountId: 'a1' } },
        ],
        usage: { input_tokens: 12, output_tokens: 8 },
      });
    }) as unknown as typeof globalThis.fetch;

    const client = createAnthropicCompatibleClient(
      'https://api.example.com/v1',
      'sk-test-provider-key'
    );
    const completion = await client.chat.completions.create({
      model: 'claude-test',
      messages: [
        { role: 'system', content: 'Be concise.' },
        { role: 'user', content: 'What is my balance?' },
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'lookup_balance',
          description: 'Looks up an account balance',
          parameters: {
            type: 'object',
            properties: { accountId: { type: 'string' } },
            required: ['accountId'],
          },
        },
      }],
      tool_choice: 'auto',
    } as any) as any;

    expect(requestPath).toBe('/v1/messages');
    expect(String(apiKeyHeader)).toBe('sk-test-provider-key');
    expect(requestBody.system).toBe('Be concise.');
    expect(requestBody.messages[0]).toEqual({ role: 'user', content: 'What is my balance?' });
    expect(requestBody.tools[0].name).toBe('lookup_balance');
    expect(completion.choices[0].finish_reason).toBe('tool_calls');
    expect(completion.choices[0].message.tool_calls[0].function).toEqual({
      name: 'lookup_balance',
      arguments: '{"accountId":"a1"}',
    });
  });
});
