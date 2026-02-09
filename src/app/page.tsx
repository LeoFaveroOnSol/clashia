'use client';

import { useEffect, useState } from 'react';

interface BattleData {
  stats: {
    opus: { wins: number; losses: number; winRate: number; bestMultiplier: number };
    codex: { wins: number; losses: number; winRate: number; bestMultiplier: number };
  };
  currentBattle: {
    roundId: number;
    status: string;
    startedAt: string;
    endsAt: string;
    opus: {
      token: string;
      entryMcap: number;
      currentMcap: number;
      multiplier: number;
      reasoning: string;
      calledAt: string;
    } | null;
    codex: {
      token: string;
      entryMcap: number;
      currentMcap: number;
      multiplier: number;
      reasoning: string;
      calledAt: string;
    } | null;
  } | null;
  recentBattles: Array<{
    round_id: number;
    winner: string;
    opus_token: string;
    opus_result: number;
    codex_token: string;
    codex_result: number;
  }>;
  timestamp: string;
}

function formatMcap(mcap: number): string {
  if (mcap >= 1000000) return `$${(mcap / 1000000).toFixed(2)}M`;
  if (mcap >= 1000) return `$${(mcap / 1000).toFixed(1)}K`;
  return `$${mcap.toFixed(0)}`;
}

function formatMultiplier(mult: number): string {
  if (mult >= 1) return `+${((mult - 1) * 100).toFixed(0)}%`;
  return `${((mult - 1) * 100).toFixed(0)}%`;
}

function getTimeRemaining(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return '00:00:00';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function getTimeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / (1000 * 60));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function Home() {
  const [data, setData] = useState<BattleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState('--:--:--');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/battle');
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error('Failed to fetch:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!data?.currentBattle?.endsAt) return;
    const updateCountdown = () => setCountdown(getTimeRemaining(data.currentBattle!.endsAt));
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [data?.currentBattle?.endsAt]);

  const stats = data?.stats;
  const battle = data?.currentBattle;
  const recent = data?.recentBattles || [];

  const opusWins = stats?.opus?.wins ?? 0;
  const codexWins = stats?.codex?.wins ?? 0;
  const opusWinRate = Number(stats?.opus?.winRate) || 0;
  const codexWinRate = Number(stats?.codex?.winRate) || 0;

  return (
    <div className="min-h-screen bg-[#d4e8d1] pt-20">
      <div className="max-w-5xl mx-auto p-4">
        
        {/* Header Card */}
        <div className="bg-[#2d5a3d] rounded-2xl p-6 mb-6 border-4 border-[#1a3d28]">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-[#1a3d28] rounded-xl flex items-center justify-center border-2 border-[#4a8f5c]">
              <span className="text-2xl font-bold text-white">vs</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">ClashAI</h1>
              <p className="text-[#a8d4b0] text-sm">AI prediction battles on real markets</p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-[#1a3d28] rounded-lg p-3 text-center border border-[#4a8f5c]">
              <div className="text-[#a8d4b0] text-xs mb-1">Rounds</div>
              <div className="text-white font-bold">{opusWins + codexWins}</div>
            </div>
            <div className="bg-[#1a3d28] rounded-lg p-3 text-center border border-[#4a8f5c]">
              <div className="text-[#a8d4b0] text-xs mb-1">Opus W/R</div>
              <div className="text-[#f0b866] font-bold">{opusWinRate.toFixed(0)}%</div>
            </div>
            <div className="bg-[#1a3d28] rounded-lg p-3 text-center border border-[#4a8f5c]">
              <div className="text-[#a8d4b0] text-xs mb-1">Codex W/R</div>
              <div className="text-[#66d4f0] font-bold">{codexWinRate.toFixed(0)}%</div>
            </div>
            <div className="bg-[#1a3d28] rounded-lg p-3 text-center border border-[#4a8f5c]">
              <div className="text-[#a8d4b0] text-xs mb-1">Status</div>
              <div className="text-[#66f084] font-bold">{battle ? 'Live' : 'Idle'}</div>
            </div>
          </div>
        </div>

        {/* Score */}
        <div className="bg-white rounded-2xl border-4 border-[#2d5a3d] p-6 mb-6">
          <div className="flex justify-center items-center gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#8a6830] mb-1">
                {loading ? '-' : opusWins}
              </div>
              <div className="text-gray-600 text-sm">Opus</div>
            </div>
            <div className="text-gray-400 text-2xl">vs</div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#306088] mb-1">
                {loading ? '-' : codexWins}
              </div>
              <div className="text-gray-600 text-sm">Codex</div>
            </div>
          </div>
        </div>

        {/* Current Battle */}
        <div className="bg-white rounded-2xl border-4 border-[#2d5a3d] p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#2d5a3d]">Current Round</h2>
            {battle && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                <span className="text-sm text-gray-500">#{battle.roundId}</span>
              </div>
            )}
          </div>

          {battle ? (
            <>
              <div className="text-center mb-6">
                <div className="text-sm text-gray-500 mb-1">Ends in</div>
                <div className="font-mono text-2xl font-bold text-[#2d5a3d]">{countdown}</div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Opus */}
                {battle.opus && (
                  <div className="bg-[#fffcf5] rounded-xl p-4 border-2 border-[#f0b866]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-[#8a6830]">Opus</span>
                      <span className="text-xs text-gray-500">{getTimeAgo(battle.opus.calledAt)}</span>
                    </div>
                    <div className="font-mono text-lg text-[#2d5a3d] mb-2">${battle.opus.token}</div>
                    <p className="text-gray-500 text-sm mb-3">{battle.opus.reasoning}</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Entry: {formatMcap(battle.opus.entryMcap)}</span>
                      <span className={battle.opus.multiplier >= 1 ? 'text-green-600 font-medium' : 'text-red-500'}>
                        {formatMultiplier(battle.opus.multiplier)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Codex */}
                {battle.codex && (
                  <div className="bg-[#f5faff] rounded-xl p-4 border-2 border-[#66b8f0]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-[#306088]">Codex</span>
                      <span className="text-xs text-gray-500">{getTimeAgo(battle.codex.calledAt)}</span>
                    </div>
                    <div className="font-mono text-lg text-[#2d5a3d] mb-2">${battle.codex.token}</div>
                    <p className="text-gray-500 text-sm mb-3">{battle.codex.reasoning}</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Entry: {formatMcap(battle.codex.entryMcap)}</span>
                      <span className={battle.codex.multiplier >= 1 ? 'text-green-600 font-medium' : 'text-red-500'}>
                        {formatMultiplier(battle.codex.multiplier)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                {loading ? 'Loading...' : 'No active battle'}
              </p>
              {!loading && (
                <button 
                  onClick={async () => {
                    await fetch('/api/cron?action=start');
                    window.location.reload();
                  }}
                  className="bg-[#2d5a3d] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#4a8f5c] transition"
                >
                  Start Battle
                </button>
              )}
            </div>
          )}
        </div>

        {/* Recent Rounds */}
        {recent.length > 0 && (
          <div className="bg-white rounded-2xl border-4 border-[#2d5a3d] p-6 mb-6">
            <h2 className="font-bold text-[#2d5a3d] mb-4">Recent Rounds</h2>
            <div className="space-y-2">
              {recent.map((b) => (
                <div key={b.round_id} className="bg-[#f0f7f1] rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-sm">#{b.round_id}</span>
                    <span className={`text-sm font-medium ${b.winner === 'opus' ? 'text-[#8a6830]' : 'text-[#306088]'}`}>
                      {b.winner === 'opus' ? 'Opus' : 'Codex'}
                    </span>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-gray-600">
                      ${b.opus_token} <span className={b.winner === 'opus' ? 'text-green-600' : 'text-gray-400'}>{formatMultiplier(b.opus_result)}</span>
                    </span>
                    <span className="text-gray-600">
                      ${b.codex_token} <span className={b.winner === 'codex' ? 'text-green-600' : 'text-gray-400'}>{formatMultiplier(b.codex_result)}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="bg-white rounded-2xl border-4 border-[#2d5a3d] p-6">
          <h2 className="font-bold text-[#2d5a3d] mb-4">How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-[#f0f7f1] rounded-xl p-4">
              <div className="text-[#2d5a3d] font-bold mb-2">1. Data Collection</div>
              <p className="text-gray-600 text-sm">
                Every round, our system fetches trending tokens from pump.fun via API. We collect market cap, volume, holder count, and social metrics.
              </p>
            </div>
            <div className="bg-[#f0f7f1] rounded-xl p-4">
              <div className="text-[#2d5a3d] font-bold mb-2">2. AI Analysis</div>
              <p className="text-gray-600 text-sm">
                Both Claude Opus and OpenAI Codex receive the same data through their APIs. Each model analyzes and picks one token with reasoning.
              </p>
            </div>
            <div className="bg-[#f0f7f1] rounded-xl p-4">
              <div className="text-[#2d5a3d] font-bold mb-2">3. Resolution</div>
              <p className="text-gray-600 text-sm">
                After the timer ends, we fetch final market caps via Birdeye API. The model with better percentage gain wins the round.
              </p>
            </div>
          </div>

          <div className="bg-[#2d5a3d] rounded-xl p-4 text-white">
            <div className="font-bold mb-2">Technical Stack</div>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-[#a8d4b0]">
              <div>
                <span className="text-white">Data Sources:</span> pump.fun API, Birdeye API, CoinGecko
              </div>
              <div>
                <span className="text-white">AI Models:</span> Anthropic Claude Opus, OpenAI Codex
              </div>
              <div>
                <span className="text-white">Backend:</span> Next.js API routes, Supabase
              </div>
              <div>
                <span className="text-white">Updates:</span> Real-time via polling, 30s intervals
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
