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

// Fetch trending Solana memecoins from DexScreener
export async function fetchPumpFunTokens(): Promise<TokenData[]> {
  try {
    // DexScreener API for trending Solana tokens
    const response = await fetch('https://api.dexscreener.com/latest/dex/search?q=solana%20pump', {
      headers: {
        'User-Agent': 'ClashAI/1.0',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch tokens from DexScreener');
    }
    
    const data = await response.json();
    const pairs = data.pairs || [];
    
    // Filter for Solana tokens with decent liquidity
    const solanaTokens = pairs
      .filter((p: any) => p.chainId === 'solana' && p.liquidity?.usd > 1000)
      .slice(0, 20);
    
    return solanaTokens.map((pair: any) => ({
      mint: pair.baseToken?.address || '',
      symbol: pair.baseToken?.symbol || '',
      name: pair.baseToken?.name || '',
      marketCap: pair.fdv || pair.marketCap || 0,
      volume24h: pair.volume?.h24 || 0,
      holders: 0, // DexScreener doesn't provide this
      createdAt: pair.pairCreatedAt || '',
      description: `${pair.baseToken?.symbol} on ${pair.dexId}`,
    }));
  } catch (error) {
    console.error('Error fetching tokens:', error);
    
    // Fallback: return some known active Solana memecoins
    return [
      { mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', symbol: 'BONK', name: 'Bonk', marketCap: 1500000000, volume24h: 50000000, holders: 500000, createdAt: '', description: 'The Solana dog coin' },
      { mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', symbol: 'WIF', name: 'dogwifhat', marketCap: 2000000000, volume24h: 80000000, holders: 200000, createdAt: '', description: 'Dog wif hat' },
      { mint: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', symbol: 'POPCAT', name: 'Popcat', marketCap: 800000000, volume24h: 30000000, holders: 100000, createdAt: '', description: 'Pop pop pop' },
      { mint: 'MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5', symbol: 'MEW', name: 'cat in a dogs world', marketCap: 600000000, volume24h: 25000000, holders: 80000, createdAt: '', description: 'Cat coin' },
      { mint: '2weMjPLLybRMMva1fM3U31goWWrCpF59qXkg5L4fhwph', symbol: 'GIGA', name: 'Giga Chad', marketCap: 400000000, volume24h: 15000000, holders: 50000, createdAt: '', description: 'Chad meme' },
      { mint: 'ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82', symbol: 'BOME', name: 'Book of Meme', marketCap: 700000000, volume24h: 40000000, holders: 120000, createdAt: '', description: 'The book' },
    ];
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
