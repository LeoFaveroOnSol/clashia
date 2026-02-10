// AI Battle Logic - Calls every 2 minutes
import { getTrendingSolana, TrendingPool, getTokenPrice } from './api';
import { sql, createCall, updateCallPrice, getActiveRound, getRoundCalls } from './db';
import { generatePrediction } from './predictions';

// AI Personalities - different strategies
const AI_STRATEGIES = {
  opus: {
    name: 'Claude Opus',
    // Opus prefers: high volume, moderate mcap, positive momentum
    scoreToken: (token: TrendingPool) => {
      let score = 0;
      
      // Volume score (prefers high volume)
      if (token.volume24h > 1000000) score += 30;
      else if (token.volume24h > 500000) score += 20;
      else if (token.volume24h > 100000) score += 10;
      
      // Mcap score (prefers mid-cap for growth potential)
      const mcap = token.mcap || 0;
      if (mcap > 100000 && mcap < 5000000) score += 25;
      else if (mcap > 50000 && mcap < 10000000) score += 15;
      
      // Momentum score
      if (token.priceChange24h > 50) score += 20;
      else if (token.priceChange24h > 20) score += 15;
      else if (token.priceChange24h > 0) score += 5;
      
      // Activity score
      if (token.txns24h > 5000) score += 15;
      else if (token.txns24h > 1000) score += 10;
      
      // Random factor for variety
      score += Math.random() * 10;
      
      return score;
    },
    generateReasoning: (token: TrendingPool) => {
      const reasons = [];
      if (token.volume24h > 500000) reasons.push('Strong volume');
      if (token.priceChange24h > 20) reasons.push('Positive momentum');
      if (token.txns24h > 1000) reasons.push('High activity');
      if ((token.mcap || 0) < 5000000) reasons.push('Growth potential');
      return reasons.join('. ') + '.';
    }
  },
  codex: {
    name: 'OpenAI Codex',
    // Codex prefers: explosive gains, lower mcap, higher risk
    scoreToken: (token: TrendingPool) => {
      let score = 0;
      
      // Prefers lower mcap (higher upside)
      const mcap = token.mcap || 0;
      if (mcap < 500000 && mcap > 50000) score += 30;
      else if (mcap < 1000000) score += 20;
      else if (mcap < 3000000) score += 10;
      
      // Loves explosive pumps
      if (token.priceChange24h > 100) score += 30;
      else if (token.priceChange24h > 50) score += 20;
      else if (token.priceChange24h > 20) score += 10;
      
      // Volume matters but not as much
      if (token.volume24h > 500000) score += 15;
      else if (token.volume24h > 100000) score += 10;
      
      // Fresh activity
      if (token.txns24h > 3000) score += 15;
      
      // Random factor
      score += Math.random() * 15;
      
      return score;
    },
    generateReasoning: (token: TrendingPool) => {
      const reasons = [];
      if ((token.mcap || 0) < 1000000) reasons.push('Low mcap gem');
      if (token.priceChange24h > 50) reasons.push('Explosive momentum');
      if (token.txns24h > 2000) reasons.push('Organic interest');
      reasons.push('High risk/reward setup');
      return reasons.join('. ') + '.';
    }
  }
};

// Select best token for an AI
function selectToken(ai: 'opus' | 'codex', tokens: TrendingPool[], exclude: string[] = []): TrendingPool | null {
  const strategy = AI_STRATEGIES[ai];
  const available = tokens.filter(t => !exclude.includes(t.address) && t.mcap && t.mcap > 10000);
  
  if (available.length === 0) return null;
  
  // Score all tokens
  const scored = available.map(t => ({
    token: t,
    score: strategy.scoreToken(t)
  }));
  
  // Sort by score and pick top one
  scored.sort((a, b) => b.score - a.score);
  
  return scored[0]?.token || null;
}

// Get or create active round
async function ensureActiveRound(): Promise<{ id: number }> {
  const active = await getActiveRound();
  if (active) return active;
  
  // Create a continuous round (no end time - runs forever)
  const result = await sql`
    INSERT INTO rounds (status, ends_at)
    VALUES ('active', NULL)
    RETURNING *
  `;
  return result[0] as { id: number };
}

// Get recent calls to avoid duplicates (last 5 minutes)
async function getRecentCalls(roundId: number): Promise<string[]> {
  const result = await sql`
    SELECT DISTINCT token_address FROM calls 
    WHERE round_id = ${roundId} 
    AND called_at > NOW() - INTERVAL '5 minutes'
  `;
  return result.map((r: any) => r.token_address);
}

// Make a new call for each AI (called every 2 minutes)
export async function makeNewCalls() {
  console.log('[Battle] Making new calls...');
  
  // Ensure we have an active round
  const round = await ensureActiveRound();
  console.log('[Battle] Active round:', round.id);
  
  // Get recent calls to exclude (avoid picking same tokens)
  const recentCalls = await getRecentCalls(round.id);
  console.log('[Battle] Recent calls to exclude:', recentCalls.length);
  
  // Fetch trending tokens
  const trending = await getTrendingSolana();
  console.log('[Battle] Trending tokens found:', trending.length);
  
  if (trending.length < 2) {
    console.error('[Battle] Not enough trending tokens');
    return null;
  }
  
  // Opus picks first
  const opusToken = selectToken('opus', trending, recentCalls);
  if (!opusToken) {
    console.error('[Battle] Opus could not select a token');
    return null;
  }
  console.log('[Battle] Opus picked:', opusToken.symbol, 'mcap:', opusToken.mcap);
  
  // Codex picks (excluding Opus's pick and recent calls)
  const codexToken = selectToken('codex', trending, [...recentCalls, opusToken.address]);
  if (!codexToken) {
    console.error('[Battle] Codex could not select a token');
    return null;
  }
  console.log('[Battle] Codex picked:', codexToken.symbol, 'mcap:', codexToken.mcap);
  
  // Create calls
  const opusCall = await createCall({
    round_id: round.id,
    ai_name: 'opus',
    token_address: opusToken.address,
    token_symbol: opusToken.symbol,
    token_name: opusToken.name,
    chain: 'solana',
    entry_mcap: opusToken.mcap || 0,
    reasoning: AI_STRATEGIES.opus.generateReasoning(opusToken),
    confidence: Math.floor(60 + Math.random() * 30)
  });
  
  const codexCall = await createCall({
    round_id: round.id,
    ai_name: 'codex',
    token_address: codexToken.address,
    token_symbol: codexToken.symbol,
    token_name: codexToken.name,
    chain: 'solana',
    entry_mcap: codexToken.mcap || 0,
    reasoning: AI_STRATEGIES.codex.generateReasoning(codexToken),
    confidence: Math.floor(55 + Math.random() * 35)
  });
  
  console.log('[Battle] New calls created:', {
    opus: opusToken.symbol,
    codex: codexToken.symbol
  });
  
  // Generate a new verifiable crypto prediction
  try {
    await generatePrediction();
  } catch (err) {
    console.error('[Battle] Error generating prediction:', err);
  }
  
  return { round, opusCall, codexCall };
}

// Update prices for all calls in active round
export async function updateAllPrices() {
  const round = await getActiveRound();
  if (!round) {
    console.log('[Battle] No active round');
    return 0;
  }
  
  const calls = await getRoundCalls(round.id);
  console.log('[Battle] Updating prices for', calls.length, 'calls');
  
  let updated = 0;
  for (const call of calls) {
    try {
      const price = await getTokenPrice(call.token_address);
      if (price && price.mcap > 0) {
        await updateCallPrice(call.id, price.mcap, price.mcap);
        updated++;
      }
    } catch (err) {
      console.error('[Battle] Error updating price for', call.token_symbol, err);
    }
  }
  
  console.log('[Battle] Updated', updated, 'prices');
  return updated;
}

// Get all calls with performance data
export async function getAllCalls(limit = 50) {
  const result = await sql`
    SELECT 
      c.*,
      CASE 
        WHEN c.entry_mcap > 0 THEN ROUND((c.current_mcap / c.entry_mcap)::numeric, 4)
        ELSE 1
      END as current_multiplier,
      CASE 
        WHEN c.entry_mcap > 0 THEN ROUND((c.ath_mcap / c.entry_mcap)::numeric, 4)
        ELSE 1
      END as ath_multiplier
    FROM calls c
    ORDER BY c.called_at DESC
    LIMIT ${limit}
  `;
  return result;
}

// Get stats per AI
export async function getAIStats() {
  const result = await sql`
    SELECT 
      ai_name,
      COUNT(*) as total_calls,
      ROUND(AVG(CASE WHEN entry_mcap > 0 THEN current_mcap / entry_mcap ELSE 1 END)::numeric, 2) as avg_multiplier,
      ROUND(MAX(CASE WHEN entry_mcap > 0 THEN ath_mcap / entry_mcap ELSE 1 END)::numeric, 2) as best_multiplier,
      SUM(CASE WHEN current_mcap > entry_mcap THEN 1 ELSE 0 END) as winning_calls
    FROM calls
    GROUP BY ai_name
  `;
  return result;
}

// Main battle loop (for cron - called every 2 minutes)
export async function runBattleLoop() {
  console.log('[Battle] Running battle loop at', new Date().toISOString());
  
  // Make new calls
  await makeNewCalls();
  
  // Update all existing prices
  await updateAllPrices();
  
  console.log('[Battle] Battle loop complete');
}

// Legacy functions for compatibility
export async function startNewRound(durationHours = 24) {
  return makeNewCalls();
}

export async function updatePrices() {
  return updateAllPrices();
}

export async function checkAndEndRound() {
  // No-op - rounds don't end anymore
  return null;
}
