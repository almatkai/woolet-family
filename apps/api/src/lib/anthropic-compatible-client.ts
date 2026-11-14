import type OpenAI from 'openai';

type OpenAiParams = OpenAI.Chat.Completions.ChatCompletionCreateParams;

class AnthropicCompatibleError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'AnthropicCompatibleError';
    this.status = status;
  }
}

function contentToText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .filter((part) => part && typeof part === 'object' && (part as { type?: string }).type === 'text')
    .map((part) => String((part as { text?: unknown }).text || ''))
    .join('\n');
}

function toAnthropicUserContent(content: unknown) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return contentToText(content);

  const blocks: any[] = [];
  for (const part of content) {
    if (!part || typeof part !== 'object') continue;
    const typedPart = part as Record<string, any>;
    if (typedPart.type === 'text') {
      blocks.push({ type: 'text', text: String(typedPart.text || '') });
      continue;
    }
    if (typedPart.type !== 'image_url') continue;

    const imageUrl = typeof typedPart.image_url === 'string'
      ? typedPart.image_url
      : typedPart.image_url?.url;
    if (typeof imageUrl !== 'string') continue;

    const dataUrl = imageUrl.match(/^data:([^;,]+);base64,(.+)$/s);
    if (dataUrl) {
      blocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: dataUrl[1],
          data: dataUrl[2],
        },
      });
      continue;
    }

    blocks.push({ type: 'image', source: { type: 'url', url: imageUrl } });
  }
  return blocks;
}

function toAnthropicRequest(params: OpenAiParams) {
  const systemParts: string[] = [];
  const messages: Array<{ role: 'user' | 'assistant'; content: any }> = [];

  const appendMessage = (role: 'user' | 'assistant', content: any) => {
    const previous = messages.at(-1);
    if (previous?.role === role && Array.isArray(previous.content) && Array.isArray(content)) {
      previous.content.push(...content);
      return;
    }
    messages.push({ role, content });
  };

  for (const message of params.messages) {
    if (message.role === 'system' || message.role === 'developer') {
      const text = contentToText(message.content);
      if (text) systemParts.push(text);
      continue;
    }

    if (message.role === 'tool') {
      appendMessage('user', [{
        type: 'tool_result',
        tool_use_id: message.tool_call_id,
        content: contentToText(message.content),
      }]);
      continue;
    }

    if (message.role === 'assistant') {
      const blocks: any[] = [];
      const text = contentToText(message.content);
      if (text) blocks.push({ type: 'text', text });
      for (const toolCall of message.tool_calls || []) {
        if (toolCall.type !== 'function') continue;
        let input: unknown = {};
        try {
          input = JSON.parse(toolCall.function.arguments || '{}');
        } catch {
          input = {};
        }
        blocks.push({
          type: 'tool_use',
          id: toolCall.id,
          name: toolCall.function.name,
          input,
        });
      }
      appendMessage('assistant', blocks.length ? blocks : [{ type: 'text', text: '' }]);
      continue;
    }

    appendMessage('user', toAnthropicUserContent(message.content));
  }

  const tools = params.tools
    ?.filter((tool) => tool.type === 'function')
    .map((tool) => ({
      name: tool.function.name,
      description: tool.function.description,
      input_schema: tool.function.parameters || { type: 'object', properties: {} },
    }));

  let toolChoice: Record<string, unknown> | undefined;
  if (params.tool_choice === 'auto') toolChoice = { type: 'auto' };
  else if (params.tool_choice === 'required') toolChoice = { type: 'any' };
  else if (params.tool_choice && typeof params.tool_choice === 'object' && params.tool_choice.type === 'function') {
    toolChoice = { type: 'tool', name: params.tool_choice.function.name };
  }

  return {
    model: params.model,
    max_tokens: params.max_tokens ?? 2048,
    messages,
    ...(systemParts.length ? { system: systemParts.join('\n\n') } : {}),
    ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
    ...(params.top_p !== undefined ? { top_p: params.top_p } : {}),
    ...(params.stop !== undefined ? { stop_sequences: Array.isArray(params.stop) ? params.stop : [params.stop] } : {}),
    ...(tools?.length ? { tools } : {}),
    ...(toolChoice ? { tool_choice: toolChoice } : {}),
  };
}

function mapStopReason(reason: string | null | undefined) {
  if (reason === 'tool_use') return 'tool_calls' as const;
  if (reason === 'max_tokens') return 'length' as const;
  if (reason === 'stop_sequence' || reason === 'end_turn') return 'stop' as const;
  return null;
}

function toOpenAiCompletion(response: any, model: string): OpenAI.Chat.Completions.ChatCompletion {
  const text = Array.isArray(response.content)
    ? response.content
      .filter((block: any) => block?.type === 'text')
      .map((block: any) => String(block.text || ''))
      .join('')
    : '';
  const toolCalls = Array.isArray(response.content)
    ? response.content
      .filter((block: any) => block?.type === 'tool_use')
      .map((block: any) => ({
        id: String(block.id),
        type: 'function' as const,
        function: {
          name: String(block.name),
          arguments: JSON.stringify(block.input || {}),
        },
      }))
    : [];

  return {
    id: String(response.id || `anthropic-${Date.now()}`),
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: String(response.model || model),
    choices: [{
      index: 0,
      finish_reason: mapStopReason(response.stop_reason) || 'stop',
      logprobs: null,
      message: {
        role: 'assistant',
        content: text || null,
        refusal: null,
        ...(toolCalls.length ? { tool_calls: toolCalls } : {}),
      },
    }],
    usage: {
      prompt_tokens: Number(response.usage?.input_tokens || 0),
      completion_tokens: Number(response.usage?.output_tokens || 0),
      total_tokens: Number(response.usage?.input_tokens || 0) + Number(response.usage?.output_tokens || 0),
    },
  };
}

function completionAsStream(completion: OpenAI.Chat.Completions.ChatCompletion) {
  return (async function* () {
    const message = completion.choices[0]?.message;
    yield {
      id: completion.id,
      object: 'chat.completion.chunk' as const,
      created: completion.created,
      model: completion.model,
      choices: [{
        index: 0,
        finish_reason: completion.choices[0]?.finish_reason || null,
        logprobs: null,
        delta: {
          role: 'assistant' as const,
          ...(message?.content ? { content: message.content } : {}),
          ...(message?.tool_calls?.length
            ? {
              tool_calls: message.tool_calls.map((toolCall, index) => ({
                index,
                id: toolCall.id,
                type: 'function' as const,
                function: {
                  name: toolCall.type === 'function' ? toolCall.function.name : '',
                  arguments: toolCall.type === 'function' ? toolCall.function.arguments : '',
                },
              })),
            }
            : {}),
        },
      }],
    } satisfies OpenAI.Chat.Completions.ChatCompletionChunk;
  })();
}

function normalizeMessagesEndpoint(baseUrl: string) {
  const normalized = baseUrl.replace(/\/$/, '');
  return normalized.endsWith('/messages') ? normalized : `${normalized}/messages`;
}

export function createAnthropicCompatibleClient(baseUrl: string, apiKey: string) {
  return {
    chat: {
      completions: {
        create: async (params: OpenAiParams) => {
          const response = await fetch(normalizeMessagesEndpoint(baseUrl), {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify(toAnthropicRequest(params)),
            signal: AbortSignal.timeout(60_000),
          });

          if (!response.ok) {
            let providerMessage = response.statusText;
            try {
              const body = await response.json() as any;
              providerMessage = String(body?.error?.message || body?.message || providerMessage);
            } catch {
              // Keep the status text when the provider did not return JSON.
            }
            throw new AnthropicCompatibleError(response.status, providerMessage);
          }

          const completion = toOpenAiCompletion(await response.json(), params.model);
          return params.stream ? completionAsStream(completion) : completion;
        },
      },
    },
  };
}
