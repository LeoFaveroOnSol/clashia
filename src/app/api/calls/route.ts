import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get all calls with calculated multipliers
    const calls = await sql`
      SELECT 
        c.id,
        c.ai_name,
        c.token_address,
        c.token_symbol,
        c.token_name,
        c.entry_mcap,
        c.current_mcap,
        c.ath_mcap,
        c.reasoning,
        c.confidence,
        c.called_at,
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
      LIMIT 100
    `;

    // Separate by AI
    const opusCalls = calls.filter((c: any) => c.ai_name === 'opus');
    const codexCalls = calls.filter((c: any) => c.ai_name === 'codex');

    // Calculate stats with simulated balance
    const STARTING_BALANCE = 1000;
    const calculateStats = (callList: any[]) => {
      if (callList.length === 0) return { total: 0, avg: 0, median: 0, best: 0, score: 0, balance: STARTING_BALANCE, pnl: 0, pnlPercent: 0 };
      
      const multipliers = callList.map(c => parseFloat(c.current_multiplier) || 1);
      const sorted = [...multipliers].sort((a, b) => b - a);
      const sum = multipliers.reduce((a, b) => a + b, 0);
      
      // Simulate balance: each call uses equal portion of initial balance
      // Final balance = sum of (initial_per_call * multiplier) for each call
      const perCall = STARTING_BALANCE / callList.length;
      const balance = multipliers.reduce((acc, mult) => acc + (perCall * mult), 0);
      const pnl = balance - STARTING_BALANCE;
      const pnlPercent = (pnl / STARTING_BALANCE) * 100;
      
      return {
        total: callList.length,
        avg: sum / callList.length,
        median: sorted[Math.floor(sorted.length / 2)] || 0,
        best: sorted[0] || 0,
        score: sum,
        balance: Math.round(balance * 100) / 100,
        pnl: Math.round(pnl * 100) / 100,
        pnlPercent: Math.round(pnlPercent * 100) / 100
      };
    };

    const opusStats = calculateStats(opusCalls);
    const codexStats = calculateStats(codexCalls);

    // Get recent calls (last 10 for display)
    const recentOpus = opusCalls.slice(0, 10).map((c: any) => ({
      id: c.id,
      token: c.token_symbol,
      contract: c.token_address,
      entryMcap: parseFloat(c.entry_mcap) || 0,
      currentMcap: parseFloat(c.current_mcap) || 0,
      multiplier: parseFloat(c.current_multiplier) || 1,
      athMultiplier: parseFloat(c.ath_multiplier) || 1,
      reasoning: c.reasoning,
      confidence: c.confidence,
      calledAt: c.called_at
    }));

    const recentCodex = codexCalls.slice(0, 10).map((c: any) => ({
      id: c.id,
      token: c.token_symbol,
      contract: c.token_address,
      entryMcap: parseFloat(c.entry_mcap) || 0,
      currentMcap: parseFloat(c.current_mcap) || 0,
      multiplier: parseFloat(c.current_multiplier) || 1,
      athMultiplier: parseFloat(c.ath_multiplier) || 1,
      reasoning: c.reasoning,
      confidence: c.confidence,
      calledAt: c.called_at
    }));

    // Full history for performance tabs
    const opusHistory = opusCalls.map((c: any) => ({
      token: c.token_symbol.startsWith('$') ? c.token_symbol : '$' + c.token_symbol,
      multiplier: parseFloat(c.current_multiplier) || 1
    }));

    const codexHistory = codexCalls.map((c: any) => ({
      token: c.token_symbol.startsWith('$') ? c.token_symbol : '$' + c.token_symbol,
      multiplier: parseFloat(c.current_multiplier) || 1
    }));

    return NextResponse.json({
      success: true,
      opus: {
        stats: opusStats,
        recent: recentOpus,
        history: opusHistory.slice(0, 20)
      },
      codex: {
        stats: codexStats,
        recent: recentCodex,
        history: codexHistory.slice(0, 20)
      },
      totalCalls: calls.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Calls API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      opus: { stats: { total: 0, avg: 0, median: 0, best: 0, score: 0 }, recent: [], history: [] },
      codex: { stats: { total: 0, avg: 0, median: 0, best: 0, score: 0 }, recent: [], history: [] }
    }, { status: 500 });
  }
}
