// Rounds closing logic - every 5 minutes
import { sql } from './db';

// Close a round and determine winner
export async function closeRound(): Promise<any> {
  // Get current balances
  const stats = await sql`
    SELECT 
      ai_name,
      COUNT(*) as total_calls,
      ROUND(AVG(CASE WHEN entry_mcap > 0 THEN current_mcap / entry_mcap ELSE 1 END)::numeric, 4) as avg_multiplier
    FROM calls
    GROUP BY ai_name
  `;
  
  const opusStats = stats.find((s: any) => s.ai_name === 'opus');
  const codexStats = stats.find((s: any) => s.ai_name === 'codex');
  
  if (!opusStats || !codexStats) {
    console.log('[Rounds] Not enough data to close round');
    return null;
  }
  
  // Calculate balances
  const STARTING = 1000;
  const opusBalance = STARTING * parseFloat(opusStats.avg_multiplier);
  const codexBalance = STARTING * parseFloat(codexStats.avg_multiplier);
  
  // Determine winner
  const winner = opusBalance > codexBalance ? 'opus' : codexBalance > opusBalance ? 'codex' : 'draw';
  const action = winner === 'opus' ? 'buyback_burn' : winner === 'codex' ? 'airdrop' : 'none';
  
  // Save result
  const result = await sql`
    INSERT INTO rounds_result (winner, opus_balance, codex_balance, action)
    VALUES (${winner}, ${opusBalance.toFixed(2)}, ${codexBalance.toFixed(2)}, ${action})
    RETURNING *
  `;
  
  console.log('[Rounds] Round closed:', { winner, action, opusBalance: opusBalance.toFixed(2), codexBalance: codexBalance.toFixed(2) });
  
  return result[0];
}

// Get recent round results
export async function getRecentRounds(limit = 20): Promise<any[]> {
  const result = await sql`
    SELECT * FROM rounds_result
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return result;
}

// Get round stats
export async function getRoundStats() {
  const result = await sql`
    SELECT 
      COUNT(*) as total_rounds,
      SUM(CASE WHEN winner = 'opus' THEN 1 ELSE 0 END) as opus_wins,
      SUM(CASE WHEN winner = 'codex' THEN 1 ELSE 0 END) as codex_wins,
      SUM(CASE WHEN action = 'buyback_burn' THEN 1 ELSE 0 END) as buybacks,
      SUM(CASE WHEN action = 'airdrop' THEN 1 ELSE 0 END) as airdrops
    FROM rounds_result
  `;
  return result[0];
}
