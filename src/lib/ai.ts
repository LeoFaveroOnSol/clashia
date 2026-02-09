// AI Battle Logic - Anthropic Claude vs OpenAI GPT

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface TokenData {
  mint: string;
  symbol: string;
  name: string;
  marketCap: number;
  volume24h: number;
  holders: number;
  createdAt: string;
  description?: string;
}

interface AIPick {
  token: string;
  contract: string;
  reasoning: string;
  confidence: number;
}

interface AIResponse {
  picks: AIPick[];
  model: string;
  timestamp: string;
}

const SYSTEM_PROMPT = `You are a memecoin analyst competing in a prediction battle. 
Analyze the provided pump.fun tokens and select your TOP 3 picks that you believe will have the best price performance in the next hour.

For each pick, provide:
1. The token symbol
2. The contract address (mint)
3. Brief reasoning (1-2 sentences)
4. Confidence level (1-100)

Focus on: market cap potential, holder distribution, volume momentum, narrative strength, and community engagement.

Respond in JSON format:
{
  "picks": [
    {"token": "SYMBOL", "contract": "address", "reasoning": "...", "confidence": 85},
    {"token": "SYMBOL", "contract": "address", "reasoning": "...", "confidence": 75},
    {"token": "SYMBOL", "contract": "address", "reasoning": "...", "confidence": 70}
  ]
}`;

// Fetch trending tokens from pump.fun
export async function fetchPumpFunTokens(): Promise<TokenData[]> {
  try {
    // pump.fun API endpoint for trending/new tokens
    const response = await fetch('https://frontend-api.pump.fun/coins?offset=0&limit=20&sort=market_cap&order=DESC&includeNsfw=false');
    
    if (!response.ok) {
      throw new Error('Failed to fetch pump.fun tokens');
    }
    
    const data = await response.json();
    
    return data.map((token: any) => ({
      mint: token.mint,
      symbol: token.symbol,
      name: token.name,
      marketCap: token.usd_market_cap || 0,
      volume24h: token.volume_24h || 0,
      holders: token.holder_count || 0,
      createdAt: token.created_timestamp,
      description: token.description,
    }));
  } catch (error) {
    console.error('Error fetching pump.fun tokens:', error);
    return [];
  }
}

// Get Claude Opus picks
export async function getClaudePicks(tokens: TokenData[]): Promise<AIResponse> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const tokenList = tokens.map(t => 
    `- ${t.symbol} (${t.mint.slice(0, 8)}...): MCap $${t.marketCap.toLocaleString()}, Vol $${t.volume24h.toLocaleString()}, ${t.holders} holders`
  ).join('\n');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Here are the current trending tokens on pump.fun:\n\n${tokenList}\n\nSelect your TOP 3 picks for the next hour.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const result = await response.json();
  const content = result.content[0].text;
  
  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse Claude response');
  }
  
  const parsed = JSON.parse(jsonMatch[0]);
  
  return {
    picks: parsed.picks,
    model: 'claude-sonnet-4-20250514',
    timestamp: new Date().toISOString(),
  };
}

// Get OpenAI GPT picks
export async function getOpenAIPicks(tokens: TokenData[]): Promise<AIResponse> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const tokenList = tokens.map(t => 
    `- ${t.symbol} (${t.mint.slice(0, 8)}...): MCap $${t.marketCap.toLocaleString()}, Vol $${t.volume24h.toLocaleString()}, ${t.holders} holders`
  ).join('\n');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Here are the current trending tokens on pump.fun:\n\n${tokenList}\n\nSelect your TOP 3 picks for the next hour.` },
      ],
      max_tokens: 1024,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const result = await response.json();
  const content = result.choices[0].message.content;
  const parsed = JSON.parse(content);
  
  return {
    picks: parsed.picks,
    model: 'gpt-4o',
    timestamp: new Date().toISOString(),
  };
}

// Get token price from Birdeye
export async function getTokenPrice(mint: string): Promise<number> {
  try {
    const response = await fetch(`https://public-api.birdeye.so/defi/price?address=${mint}`, {
      headers: {
        'X-API-KEY': process.env.BIRDEYE_API_KEY || '',
      },
    });
    
    if (!response.ok) return 0;
    
    const data = await response.json();
    return data.data?.value || 0;
  } catch {
    return 0;
  }
}

// Run a complete battle round
export async function runBattleRound() {
  // 1. Fetch tokens
  const tokens = await fetchPumpFunTokens();
  if (tokens.length === 0) {
    throw new Error('No tokens available');
  }

  // 2. Get picks from both AIs
  const [claudePicks, openaiPicks] = await Promise.all([
    getClaudePicks(tokens),
    getOpenAIPicks(tokens),
  ]);

  // 3. Record entry prices
  const allMints = [
    ...claudePicks.picks.map(p => p.contract),
    ...openaiPicks.picks.map(p => p.contract),
  ];
  
  const entryPrices: Record<string, number> = {};
  for (const mint of allMints) {
    entryPrices[mint] = await getTokenPrice(mint);
  }

  return {
    roundId: Date.now(),
    startedAt: new Date().toISOString(),
    tokens,
    claudePicks,
    openaiPicks,
    entryPrices,
  };
}
