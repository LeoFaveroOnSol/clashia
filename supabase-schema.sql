-- ClashAI Database Schema
-- Supabase PostgreSQL

-- ============================================
-- ROUNDS - Cada batalha entre Opus vs Codex
-- ============================================
CREATE TABLE rounds (
  id SERIAL PRIMARY KEY,
  status VARCHAR(20) DEFAULT 'active', -- active, completed, cancelled
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  winner VARCHAR(20), -- opus, codex, draw
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para buscar rounds ativos
CREATE INDEX idx_rounds_status ON rounds(status);
CREATE INDEX idx_rounds_started ON rounds(started_at DESC);

-- ============================================
-- CALLS - Cada call feita por uma IA
-- ============================================
CREATE TABLE calls (
  id SERIAL PRIMARY KEY,
  round_id INTEGER REFERENCES rounds(id) ON DELETE CASCADE,
  ai_name VARCHAR(20) NOT NULL, -- opus, codex
  
  -- Token info
  token_address VARCHAR(100) NOT NULL,
  token_symbol VARCHAR(20) NOT NULL,
  token_name VARCHAR(100),
  chain VARCHAR(20) DEFAULT 'solana', -- solana, base
  
  -- Preços
  entry_price DECIMAL(30, 18),
  entry_mcap DECIMAL(20, 2),
  current_price DECIMAL(30, 18),
  current_mcap DECIMAL(20, 2),
  ath_price DECIMAL(30, 18),
  ath_mcap DECIMAL(20, 2),
  
  -- Performance
  current_multiplier DECIMAL(10, 4) DEFAULT 1.0,
  ath_multiplier DECIMAL(10, 4) DEFAULT 1.0,
  
  -- Reasoning
  reasoning TEXT, -- Por que a IA escolheu essa coin
  confidence INTEGER, -- 1-100
  
  -- Timestamps
  called_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_calls_round ON calls(round_id);
CREATE INDEX idx_calls_ai ON calls(ai_name);
CREATE INDEX idx_calls_token ON calls(token_address);

-- ============================================
-- STATS - Estatísticas agregadas
-- ============================================
CREATE TABLE stats (
  id SERIAL PRIMARY KEY,
  ai_name VARCHAR(20) UNIQUE NOT NULL,
  total_rounds INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  win_rate DECIMAL(5, 2) DEFAULT 0,
  avg_multiplier DECIMAL(10, 4) DEFAULT 1.0,
  best_call_multiplier DECIMAL(10, 4) DEFAULT 1.0,
  best_call_token VARCHAR(20),
  total_calls INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial stats
INSERT INTO stats (ai_name) VALUES ('opus'), ('codex');

-- ============================================
-- PRICE_HISTORY - Histórico de preços (opcional)
-- ============================================
CREATE TABLE price_history (
  id SERIAL PRIMARY KEY,
  call_id INTEGER REFERENCES calls(id) ON DELETE CASCADE,
  price DECIMAL(30, 18),
  mcap DECIMAL(20, 2),
  multiplier DECIMAL(10, 4),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_price_history_call ON price_history(call_id);
CREATE INDEX idx_price_history_time ON price_history(recorded_at DESC);

-- ============================================
-- VIEWS para facilitar queries
-- ============================================

-- View: Round atual com calls
CREATE OR REPLACE VIEW current_battle AS
SELECT 
  r.id as round_id,
  r.status,
  r.started_at,
  r.ends_at,
  opus.token_symbol as opus_token,
  opus.entry_mcap as opus_entry_mcap,
  opus.current_mcap as opus_current_mcap,
  opus.current_multiplier as opus_multiplier,
  opus.reasoning as opus_reasoning,
  codex.token_symbol as codex_token,
  codex.entry_mcap as codex_entry_mcap,
  codex.current_mcap as codex_current_mcap,
  codex.current_multiplier as codex_multiplier,
  codex.reasoning as codex_reasoning
FROM rounds r
LEFT JOIN calls opus ON r.id = opus.round_id AND opus.ai_name = 'opus'
LEFT JOIN calls codex ON r.id = codex.round_id AND codex.ai_name = 'codex'
WHERE r.status = 'active'
ORDER BY r.started_at DESC
LIMIT 1;

-- View: Leaderboard
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  ai_name,
  wins,
  losses,
  draws,
  total_rounds,
  win_rate,
  avg_multiplier,
  best_call_multiplier,
  best_call_token
FROM stats
ORDER BY wins DESC;

-- View: Recent battles
CREATE OR REPLACE VIEW recent_battles AS
SELECT 
  r.id as round_id,
  r.winner,
  r.completed_at,
  opus.token_symbol as opus_token,
  opus.ath_multiplier as opus_result,
  codex.token_symbol as codex_token,
  codex.ath_multiplier as codex_result
FROM rounds r
LEFT JOIN calls opus ON r.id = opus.round_id AND opus.ai_name = 'opus'
LEFT JOIN calls codex ON r.id = codex.round_id AND codex.ai_name = 'codex'
WHERE r.status = 'completed'
ORDER BY r.completed_at DESC
LIMIT 20;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Atualizar stats quando round termina
CREATE OR REPLACE FUNCTION update_stats_on_round_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status = 'active' THEN
    -- Update winner stats
    IF NEW.winner = 'opus' THEN
      UPDATE stats SET 
        wins = wins + 1,
        total_rounds = total_rounds + 1,
        win_rate = (wins + 1)::decimal / (total_rounds + 1) * 100,
        updated_at = NOW()
      WHERE ai_name = 'opus';
      
      UPDATE stats SET 
        losses = losses + 1,
        total_rounds = total_rounds + 1,
        win_rate = wins::decimal / (total_rounds + 1) * 100,
        updated_at = NOW()
      WHERE ai_name = 'codex';
    ELSIF NEW.winner = 'codex' THEN
      UPDATE stats SET 
        wins = wins + 1,
        total_rounds = total_rounds + 1,
        win_rate = (wins + 1)::decimal / (total_rounds + 1) * 100,
        updated_at = NOW()
      WHERE ai_name = 'codex';
      
      UPDATE stats SET 
        losses = losses + 1,
        total_rounds = total_rounds + 1,
        win_rate = wins::decimal / (total_rounds + 1) * 100,
        updated_at = NOW()
      WHERE ai_name = 'opus';
    ELSE -- draw
      UPDATE stats SET 
        draws = draws + 1,
        total_rounds = total_rounds + 1,
        win_rate = wins::decimal / (total_rounds + 1) * 100,
        updated_at = NOW()
      WHERE ai_name IN ('opus', 'codex');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER trigger_update_stats
AFTER UPDATE ON rounds
FOR EACH ROW
EXECUTE FUNCTION update_stats_on_round_complete();

-- ============================================
-- RLS (Row Level Security) - Opcional
-- ============================================

-- Habilitar RLS
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Policies públicas (leitura)
CREATE POLICY "Rounds are viewable by everyone" ON rounds FOR SELECT USING (true);
CREATE POLICY "Calls are viewable by everyone" ON calls FOR SELECT USING (true);
CREATE POLICY "Stats are viewable by everyone" ON stats FOR SELECT USING (true);
CREATE POLICY "Price history is viewable by everyone" ON price_history FOR SELECT USING (true);

-- Policies para insert/update (apenas service role)
CREATE POLICY "Only service role can insert rounds" ON rounds FOR INSERT WITH CHECK (true);
CREATE POLICY "Only service role can update rounds" ON rounds FOR UPDATE USING (true);
CREATE POLICY "Only service role can insert calls" ON calls FOR INSERT WITH CHECK (true);
CREATE POLICY "Only service role can update calls" ON calls FOR UPDATE USING (true);
CREATE POLICY "Only service role can update stats" ON stats FOR UPDATE USING (true);
CREATE POLICY "Only service role can insert price history" ON price_history FOR INSERT WITH CHECK (true);

-- ============================================
-- REALTIME (habilitar pra live updates)
-- ============================================
-- No Supabase Dashboard: Database > Replication > Enable para:
-- - rounds
-- - calls
-- - stats
