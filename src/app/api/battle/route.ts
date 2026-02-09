import { NextResponse } from 'next/server';
import { fetchPumpFunTokens, getClaudePicks, getOpenAIPicks, getTokenPrice } from '@/lib/ai';

// In-memory storage (replace with database in production)
let currentBattle: any = null;
let battleHistory: any[] = [];
let stats = {
  opus: { wins: 0, losses: 0, winRate: 0, bestMultiplier: 1 },
  codex: { wins: 0, losses: 0, winRate: 0, bestMultiplier: 1 },
};

export async function GET() {
  return NextResponse.json({
    stats,
    currentBattle,
    recentBattles: battleHistory.slice(-10).reverse(),
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const { action } = await request.json();

  if (action === 'start') {
    try {
      // Check if APIs are configured
      if (!process.env.ANTHROPIC_API_KEY || !process.env.OPENAI_API_KEY) {
        return NextResponse.json(
          { error: 'API keys not configured. Set ANTHROPIC_API_KEY and OPENAI_API_KEY in environment.' },
          { status: 500 }
        );
      }

      // Fetch tokens
      const tokens = await fetchPumpFunTokens();
      if (tokens.length === 0) {
        return NextResponse.json({ error: 'No tokens available' }, { status: 500 });
      }

      // Get picks from both AIs
      const [claudeResult, openaiResult] = await Promise.allSettled([
        getClaudePicks(tokens),
        getOpenAIPicks(tokens),
      ]);

      if (claudeResult.status === 'rejected' || openaiResult.status === 'rejected') {
        return NextResponse.json({ 
          error: 'Failed to get AI picks',
          details: {
            claude: claudeResult.status === 'rejected' ? claudeResult.reason?.message : 'ok',
            openai: openaiResult.status === 'rejected' ? openaiResult.reason?.message : 'ok',
          }
        }, { status: 500 });
      }

      const claudePicks = claudeResult.value;
      const openaiPicks = openaiResult.value;

      // Get entry prices
      const allContracts = [
        ...claudePicks.picks.map(p => p.contract),
        ...openaiPicks.picks.map(p => p.contract),
      ];

      const entryPrices: Record<string, number> = {};
      for (const contract of allContracts) {
        const token = tokens.find(t => t.mint === contract);
        entryPrices[contract] = token?.marketCap || 0;
      }

      // Create battle
      const roundId = battleHistory.length + 1;
      currentBattle = {
        roundId,
        status: 'active',
        startedAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
        opus: claudePicks.picks.map(p => ({
          token: p.token,
          contract: p.contract,
          entryMcap: entryPrices[p.contract] || 0,
          currentMcap: entryPrices[p.contract] || 0,
          multiplier: 1,
          reasoning: p.reasoning,
          confidence: p.confidence,
          calledAt: claudePicks.timestamp,
        })),
        codex: openaiPicks.picks.map(p => ({
          token: p.token,
          contract: p.contract,
          entryMcap: entryPrices[p.contract] || 0,
          currentMcap: entryPrices[p.contract] || 0,
          multiplier: 1,
          reasoning: p.reasoning,
          confidence: p.confidence,
          calledAt: openaiPicks.timestamp,
        })),
      };

      return NextResponse.json({ success: true, battle: currentBattle });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (action === 'update') {
    if (!currentBattle) {
      return NextResponse.json({ error: 'No active battle' }, { status: 400 });
    }

    // Update current prices
    for (const pick of [...currentBattle.opus, ...currentBattle.codex]) {
      const price = await getTokenPrice(pick.contract);
      if (price > 0) {
        pick.currentMcap = price;
        pick.multiplier = pick.entryMcap > 0 ? price / pick.entryMcap : 1;
      }
    }

    return NextResponse.json({ success: true, battle: currentBattle });
  }

  if (action === 'end') {
    if (!currentBattle) {
      return NextResponse.json({ error: 'No active battle' }, { status: 400 });
    }

    // Calculate averages
    const opusAvg = currentBattle.opus.reduce((sum: number, p: any) => sum + p.multiplier, 0) / currentBattle.opus.length;
    const codexAvg = currentBattle.codex.reduce((sum: number, p: any) => sum + p.multiplier, 0) / currentBattle.codex.length;

    // Determine winner
    const winner = opusAvg > codexAvg ? 'opus' : 'codex';
    
    // Update stats
    if (winner === 'opus') {
      stats.opus.wins++;
      stats.codex.losses++;
    } else {
      stats.codex.wins++;
      stats.opus.losses++;
    }
    
    stats.opus.winRate = (stats.opus.wins / (stats.opus.wins + stats.opus.losses)) * 100;
    stats.codex.winRate = (stats.codex.wins / (stats.codex.wins + stats.codex.losses)) * 100;
    
    const opusBest = Math.max(...currentBattle.opus.map((p: any) => p.multiplier));
    const codexBest = Math.max(...currentBattle.codex.map((p: any) => p.multiplier));
    
    if (opusBest > stats.opus.bestMultiplier) stats.opus.bestMultiplier = opusBest;
    if (codexBest > stats.codex.bestMultiplier) stats.codex.bestMultiplier = codexBest;

    // Save to history
    battleHistory.push({
      round_id: currentBattle.roundId,
      winner,
      opus_token: currentBattle.opus[0]?.token || '',
      opus_result: opusAvg,
      codex_token: currentBattle.codex[0]?.token || '',
      codex_result: codexAvg,
      ended_at: new Date().toISOString(),
    });

    currentBattle = null;

    return NextResponse.json({ success: true, winner, opusAvg, codexAvg, stats });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
