import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { MAX_RESPONSE_SEGMENTS, MAX_TOKENS } from '~/lib/.server/llm/constants';
import { CONTINUE_PROMPT } from '~/lib/.server/llm/prompts';
import { streamText, type Messages, type StreamingOptions } from '~/lib/.server/llm/stream-text';
import SwitchableStream from '~/lib/.server/llm/switchable-stream';
import { updateTokenUsage } from '~/lib/stores/tokens';

export async function action(args: ActionFunctionArgs) {
  return chatAction(args);
}

async function chatAction({ context, request }: ActionFunctionArgs) {
  const { messages } = await request.json<{ messages: Messages }>();
  const stream = new SwitchableStream();

  try {
    let currentResult: Awaited<ReturnType<typeof streamText>> | undefined;

    const options: StreamingOptions = {
      toolChoice: 'none',
      onFinish: async ({ text: content, finishReason, usage }) => {
        console.log('Token Usage:', {
          promptTokens: usage?.promptTokens,
          completionTokens: usage?.completionTokens,
          totalTokens: usage?.totalTokens,
          finishReason,
          switches: stream.switches,
          maxSegments: MAX_RESPONSE_SEGMENTS,
        });

        // update token usage from completion
        if (currentResult?.rawResponse?.headers) {
          updateTokenUsage(currentResult.rawResponse.headers);
        }

        if (finishReason !== 'length') {
          return stream.close();
        }

        if (stream.switches >= MAX_RESPONSE_SEGMENTS) {
          throw Error('Cannot continue message: Maximum segments reached');
        }

        const switchesLeft = MAX_RESPONSE_SEGMENTS - stream.switches;
        console.log(`Reached max token limit (${MAX_TOKENS}): Continuing message (${switchesLeft} switches left)`);

        messages.push({ role: 'assistant', content });
        messages.push({ role: 'user', content: CONTINUE_PROMPT });

        currentResult = await streamText(messages, context.cloudflare.env, options);

        // update token usage from initial response
        if (currentResult?.rawResponse?.headers) {
          const headers = currentResult.rawResponse.headers;
          console.log('Raw Headers from API:', {
            allHeaders: headers,
            resetDate: headers['anthropic-ratelimit-tokens-reset'],
          });
          updateTokenUsage(headers);
        }

        return stream.switchSource(currentResult.toAIStream());
      },
    };

    currentResult = await streamText(messages, context.cloudflare.env, options);

    console.log('Stream Result:', {
      resultKeys: Object.keys(currentResult),
      usage: currentResult.usage,
      toAIStream: typeof currentResult.toAIStream,
      ...Object.fromEntries(Object.entries(currentResult).filter(([key]) => !['usage', 'toAIStream'].includes(key))),
    });

    stream.switchSource(currentResult.toAIStream());

    return new Response(stream.readable, {
      status: 200,
      headers: {
        contentType: 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    throw new Response(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });
  }
}
