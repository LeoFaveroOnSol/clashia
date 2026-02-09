// AI Battle Logic
import { getTrendingSolana, TrendingPool, getTokenPrice } from './api';
import { sql, createRound, createCall, updateCallPrice, completeRound, getActiveRound, getRoundCalls } from './db';

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

// Start a new battle round
export async function startNewRound(durationHours = 24) {
  // Check if there's already an active round
  const active = await getActiveRound();
  if (active) {
    console.log('Round already active:', active.id);
    return null;
  }
  
  // Fetch trending tokens
  const trending = await getTrendingSolana();
  if (trending.length < 2) {
    console.error('Not enough trending tokens');
    return null;
  }
  
  // Create round
  const endsAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);
  const round = await createRound(endsAt);
  
  // Opus picks first
  const opusToken = selectToken('opus', trending);
  if (!opusToken) {
    console.error('Opus could not select a token');
    return null;
  }
  
  // Codex picks (excluding Opus's pick)
  const codexToken = selectToken('codex', trending, [opusToken.address]);
  if (!codexToken) {
    console.error('Codex could not select a token');
    return null;
  }
  
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
  
  console.log('New round started:', {
    roundId: round.id,
    opus: opusToken.symbol,
    codex: codexToken.symbol,
    endsAt
  });
  
  return { round, opusCall, codexCall };
}

// Update prices for active round
export async function updatePrices() {
  const round = await getActiveRound();
  if (!round) return null;
  
  const calls = await getRoundCalls(round.id);
  
  for (const call of calls) {
    const price = await getTokenPrice(call.token_address);
    if (price) {
      await updateCallPrice(call.id, price.mcap, price.mcap);
    }
  }
  
  return calls.length;
}

// Check if round should end and determine winner
export async function checkAndEndRound() {
  const round = await getActiveRound();
  if (!round || !round.ends_at) return null;
  
  const endsAt = new Date(round.ends_at);
  if (new Date() < endsAt) return null; // Not time yet
  
  // Update final prices
  await updatePrices();
  
  // Get final calls
  const calls = await getRoundCalls(round.id);
  const opusCall = calls.find(c => c.ai_name === 'opus');
  const codexCall = calls.find(c => c.ai_name === 'codex');
  
  if (!opusCall || !codexCall) return null;
  
  // Determine winner based on ATH multiplier
  let winner: 'opus' | 'codex' | 'draw';
  if (opusCall.ath_multiplier > codexCall.ath_multiplier) {
    winner = 'opus';
  } else if (codexCall.ath_multiplier > opusCall.ath_multiplier) {
    winner = 'codex';
  } else {
    winner = 'draw';
  }
  
  // Complete round
  await completeRound(round.id, winner);
  
  console.log('Round completed:', {
    roundId: round.id,
    winner,
    opusMultiplier: opusCall.ath_multiplier,
    codexMultiplier: codexCall.ath_multiplier
  });
  
  return { round, winner, opusCall, codexCall };
}

// Main battle loop (for cron)
export async function runBattleLoop() {
  // Check if current round should end
  const ended = await checkAndEndRound();
  if (ended) {
    console.log('Round ended, winner:', ended.winner);
  }
  
  // Check if we need to start a new round
  const active = await getActiveRound();
  if (!active) {
    console.log('Starting new round...');
    await startNewRound(24); // 24 hour rounds
  }
  
  // Update prices
  await updatePrices();
}
