import { NextResponse } from 'next/server';
import { getStats, getActiveRound, getRoundCalls, getRecentBattles } from '@/lib/db';
import { getTokenPrices } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Get stats
    const stats = await getStats();
    const opusStats = stats.find(s => s.ai_name === 'opus');
    const codexStats = stats.find(s => s.ai_name === 'codex');
    
    // Get active round
    const round = await getActiveRound();
    let currentBattle = null;
    
    if (round) {
      const calls = await getRoundCalls(round.id);
      const opusCall = calls.find(c => c.ai_name === 'opus');
      const codexCall = calls.find(c => c.ai_name === 'codex');
      
      // Get current prices
      const addresses = calls.map(c => c.token_address);
      const prices = await getTokenPrices(addresses);
      
      currentBattle = {
        roundId: round.id,
        status: round.status,
        startedAt: round.started_at,
        endsAt: round.ends_at,
        opus: opusCall ? {
          token: opusCall.token_symbol,
          entryMcap: opusCall.entry_mcap,
          currentMcap: prices.get(opusCall.token_address)?.mcap || opusCall.current_mcap,
          multiplier: prices.get(opusCall.token_address)?.mcap 
            ? prices.get(opusCall.token_address)!.mcap / opusCall.entry_mcap 
            : opusCall.current_multiplier,
          reasoning: opusCall.reasoning,
          calledAt: opusCall.called_at
        } : null,
        codex: codexCall ? {
          token: codexCall.token_symbol,
          entryMcap: codexCall.entry_mcap,
          currentMcap: prices.get(codexCall.token_address)?.mcap || codexCall.current_mcap,
          multiplier: prices.get(codexCall.token_address)?.mcap 
            ? prices.get(codexCall.token_address)!.mcap / codexCall.entry_mcap 
            : codexCall.current_multiplier,
          reasoning: codexCall.reasoning,
          calledAt: codexCall.called_at
        } : null
      };
    }
    
    // Get recent battles
    const recentBattles = await getRecentBattles(5);
    
    return NextResponse.json({
      stats: {
        opus: {
          wins: opusStats?.wins || 0,
          losses: opusStats?.losses || 0,
          winRate: opusStats?.win_rate || 0,
          bestMultiplier: opusStats?.best_call_multiplier || 1
        },
        codex: {
          wins: codexStats?.wins || 0,
          losses: codexStats?.losses || 0,
          winRate: codexStats?.win_rate || 0,
          bestMultiplier: codexStats?.best_call_multiplier || 1
        }
      },
      currentBattle,
      recentBattles,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Battle API error:', error);
    return NextResponse.json({ error: 'Failed to fetch battle data' }, { status: 500 });
  }
}
