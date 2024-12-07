import { map } from 'nanostores';

interface TokenUsage {
  inputTokensLimit: number;
  inputTokensRemaining: number;
  outputTokensLimit: number;
  outputTokensRemaining: number;
  totalTokensLimit: number;
  totalTokensRemaining: number;
  requestsLimit: number;
  requestsRemaining: number;
  resetDate?: string;
}

export const tokenStore = map<TokenUsage>({
  inputTokensLimit: 0,
  inputTokensRemaining: 0,
  outputTokensLimit: 0,
  outputTokensRemaining: 0,
  totalTokensLimit: 0,
  totalTokensRemaining: 0,
  requestsLimit: 0,
  requestsRemaining: 0,
});

export function updateTokenUsage(headers: Record<string, string>) {
  if (!headers) {
    console.error('updateTokenUsage: No headers provided');
    return;
  }

  const usage = {
    inputTokensLimit: Number(headers['anthropic-ratelimit-input-tokens-limit']),
    inputTokensRemaining: Number(headers['anthropic-ratelimit-input-tokens-remaining']),
    outputTokensLimit: Number(headers['anthropic-ratelimit-output-tokens-limit']),
    outputTokensRemaining: Number(headers['anthropic-ratelimit-output-tokens-remaining']),
    totalTokensLimit: Number(headers['anthropic-ratelimit-tokens-limit']),
    totalTokensRemaining: Number(headers['anthropic-ratelimit-tokens-remaining']),
    requestsLimit: Number(headers['anthropic-ratelimit-requests-limit']),
    requestsRemaining: Number(headers['anthropic-ratelimit-requests-remaining']),
    resetDate: headers['anthropic-ratelimit-tokens-reset'],
  };

  // check for invalid values
  const hasInvalidValues = Object.entries(usage).some(([key, value]) => {
    if (key === 'resetDate') {
      return false;
    }

    // allow zero for remaining values, but not for limits
    if (key.endsWith('Remaining')) {
      return isNaN(value as number);
    }

    return isNaN(value as number) || value === 0;
  });

  if (hasInvalidValues) {
    console.error('updateTokenUsage: Invalid values detected', { headers, usage });
    return;
  }

  console.log('Setting token store with valid usage data:', usage);
  tokenStore.set(usage);
}

declare global {
  interface Window {
    env: Env;
  }
  let env: Env;
}

export async function fetchTokenInfo() {
  console.log('Fetching token info...');

  try {
    const response = await fetch('/api/tokens', { method: 'POST' });

    if (!response.ok) {
      console.error('Token fetch failed:', response.status, response.statusText);
      return;
    }

    const data = (await response.json()) as { headers?: Record<string, string> };
    console.log('Token response data:', data);

    if (!data.headers) {
      console.error('No headers in response data');
      return;
    }

    updateTokenUsage(data.headers);
  } catch (error) {
    console.error('Failed to fetch token info:', error);
  }
}
