import { streamText as _streamText, convertToCoreMessages } from 'ai';
import { getAPIKey } from '~/lib/.server/llm/api-key';
import { getAnthropicModel } from '~/lib/.server/llm/model';
import { MAX_TOKENS } from './constants';
import { getSystemPrompt } from './prompts';

interface ToolResult<Name extends string, Args, Result> {
  toolCallId: string;
  toolName: Name;
  args: Args;
  result: Result;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolInvocations?: ToolResult<string, unknown, unknown>[];
}

export type Messages = Message[];

export type StreamingOptions = Omit<Parameters<typeof _streamText>[0], 'model'>;

// extend the result type to include response
type StreamResult = Awaited<ReturnType<typeof _streamText>> & {
  response?: { headers: Headers };
};

export async function streamText(messages: Messages, env: Env, options?: StreamingOptions) {
  const anthropicModel = getAnthropicModel(getAPIKey(env));

  const result = (await _streamText({
    model: anthropicModel,
    system: getSystemPrompt(),
    maxTokens: MAX_TOKENS,
    headers: {
      'anthropic-beta': 'max-tokens-3-5-sonnet-2024-07-15',
      'x-api-key': getAPIKey(env),
      'content-type': 'application/json',
    },
    messages: convertToCoreMessages(messages),
    ...options,
  })) as StreamResult;

  // get headers from the original response
  const headers = result.rawResponse?.headers;

  if (headers) {
    // use the headers directly since they're already in the correct format
    return Object.assign(result, {
      rawResponse: { headers },
    });
  }

  return result;
}
