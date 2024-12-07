import { type ActionFunctionArgs, json } from '@remix-run/cloudflare';

export const action = async ({ request: _request }: ActionFunctionArgs) => {
  console.log('Token client API called');

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'anthropic-beta': 'max-tokens-3-5-sonnet-2024-10-22',
        'x-api-key': window.env.ANTHROPIC_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-latest',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 1,
      }),
    });

    if (!response.ok) {
      console.error('Anthropic API error:', response.status, response.statusText);

      if (response.status === 401) {
        throw new Response('Invalid API key', { status: 401 });
      }

      if (response.status === 429) {
        throw new Response('Rate limit exceeded', { status: 429 });
      }

      throw new Response(null, { status: response.status });
    }

    const headers = Object.fromEntries(response.headers.entries());
    console.log('Anthropic API response headers:', headers);

    return json({ headers });
  } catch (error) {
    console.error('Failed to fetch token info:', error);
    throw new Response(null, {
      status: 500,
      statusText: error instanceof Error ? error.message : 'Internal Server Error',
    });
  }
};
