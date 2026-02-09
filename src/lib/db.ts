import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export { sql };

// Types
export interface Round {
  id: number;
  status: string;
  started_at: string;
  ends_at: string | null;
  completed_at: string | null;
  winner: string | null;
}

export interface Call {
  id: number;
  round_id: number;
  ai_name: 'opus' | 'codex';
  token_address: string;
  token_symbol: string;
  token_name: string | null;
  chain: string;
  entry_mcap: number;
  current_mcap: number;
  ath_mcap: number;
  current_multiplier: number;
  ath_multiplier: number;
  reasoning: string | null;
  confidence: number | null;
  called_at: string;
}

export interface Stats {
  ai_name: string;
  total_rounds: number;
  wins: number;
  losses: number;
  draws: number;
  win_rate: number;
  avg_multiplier: number;
  best_call_multiplier: number;
  best_call_token: string | null;
}

// Queries
export async function getStats() {
  const result = await sql`SELECT * FROM stats ORDER BY wins DESC`;
  return result as Stats[];
}

export async function getCurrentBattle() {
  const result = await sql`SELECT * FROM current_battle LIMIT 1`;
  return result[0] || null;
}

export async function getRecentBattles(limit = 10) {
  const result = await sql`SELECT * FROM recent_battles LIMIT ${limit}`;
  return result;
}

export async function getActiveRound() {
  const result = await sql`
    SELECT * FROM rounds 
    WHERE status = 'active' 
    ORDER BY started_at DESC 
    LIMIT 1
  `;
  return result[0] as Round | undefined;
}

export async function getRoundCalls(roundId: number) {
  const result = await sql`
    SELECT * FROM calls 
    WHERE round_id = ${roundId}
  `;
  return result as Call[];
}

// Mutations (for backend/cron)
export async function createRound(endsAt: Date) {
  const result = await sql`
    INSERT INTO rounds (status, ends_at)
    VALUES ('active', ${endsAt.toISOString()})
    RETURNING *
  `;
  return result[0] as Round;
}

export async function createCall(data: {
  round_id: number;
  ai_name: 'opus' | 'codex';
  token_address: string;
  token_symbol: string;
  token_name?: string;
  chain?: string;
  entry_mcap: number;
  reasoning?: string;
  confidence?: number;
}) {
  const result = await sql`
    INSERT INTO calls (
      round_id, ai_name, token_address, token_symbol, 
      token_name, chain, entry_mcap, current_mcap, 
      reasoning, confidence
    )
    VALUES (
      ${data.round_id}, ${data.ai_name}, ${data.token_address}, ${data.token_symbol},
      ${data.token_name || null}, ${data.chain || 'solana'}, ${data.entry_mcap}, ${data.entry_mcap},
      ${data.reasoning || null}, ${data.confidence || null}
    )
    RETURNING *
  `;
  return result[0] as Call;
}

export async function updateCallPrice(callId: number, currentMcap: number, athMcap: number) {
  const result = await sql`
    UPDATE calls SET
      current_mcap = ${currentMcap},
      ath_mcap = GREATEST(ath_mcap, ${athMcap}),
      current_multiplier = ${currentMcap} / NULLIF(entry_mcap, 0),
      ath_multiplier = GREATEST(ath_mcap, ${athMcap}) / NULLIF(entry_mcap, 0),
      last_updated = NOW()
    WHERE id = ${callId}
    RETURNING *
  `;
  return result[0] as Call;
}

export async function completeRound(roundId: number, winner: 'opus' | 'codex' | 'draw') {
  const result = await sql`
    UPDATE rounds SET
      status = 'completed',
      winner = ${winner},
      completed_at = NOW()
    WHERE id = ${roundId}
    RETURNING *
  `;
  return result[0] as Round;
}
