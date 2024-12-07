import { type ActionFunctionArgs, json } from '@remix-run/cloudflare';
import { getAPIKey } from '~/lib/.server/llm/api-key';

export async function action({ context }: ActionFunctionArgs) {
  try {
    const apiKey = getAPIKey(context.cloudflare.env);

    console.log('Making Anthropic API request...');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'anthropic-version': '2023-06-01',
        'x-api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-latest',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 1,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Response(errorText, { status: response.status });
    }

    const headers = Object.fromEntries(response.headers.entries());

    // extract only the rate limit headers
    const rateLimitHeaders = {
      'anthropic-ratelimit-tokens-reset': headers['anthropic-ratelimit-tokens-reset'],
      'anthropic-ratelimit-tokens-limit': headers['anthropic-ratelimit-tokens-limit'],
      'anthropic-ratelimit-tokens-remaining': headers['anthropic-ratelimit-tokens-remaining'],
      'anthropic-ratelimit-requests-limit': headers['anthropic-ratelimit-requests-limit'],
      'anthropic-ratelimit-requests-remaining': headers['anthropic-ratelimit-requests-remaining'],
      'anthropic-ratelimit-input-tokens-limit': headers['anthropic-ratelimit-input-tokens-limit'],
      'anthropic-ratelimit-input-tokens-remaining': headers['anthropic-ratelimit-input-tokens-remaining'],
      'anthropic-ratelimit-output-tokens-limit': headers['anthropic-ratelimit-output-tokens-limit'],
      'anthropic-ratelimit-output-tokens-remaining': headers['anthropic-ratelimit-output-tokens-remaining'],
    };

    return json({ headers: rateLimitHeaders });
  } catch (error) {
    console.error('Failed to fetch token info:', error);
    throw new Response(null, { status: 500 });
  }
}
