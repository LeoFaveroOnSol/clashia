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
  if (diff <= 0) return 'Ending...';
  
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

  // Fetch data
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
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!data?.currentBattle?.endsAt) return;
    
    const updateCountdown = () => {
      setCountdown(getTimeRemaining(data.currentBattle!.endsAt));
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [data?.currentBattle?.endsAt]);

  const stats = data?.stats;
  const battle = data?.currentBattle;
  const recent = data?.recentBattles || [];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="text-opus">OPUS</span>
            <span className="text-clash mx-4">⚔️</span>
            <span className="text-codex">CODEX</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Two AIs. One arena. Who makes the best memecoin calls?
          </p>
          
          {/* Live Score */}
          <div className="flex justify-center gap-8 mb-12">
            <div className="bg-opus/20 border border-opus/50 rounded-2xl p-8 min-w-[200px]">
              <div className="text-4xl font-bold text-opus mb-2">
                {loading ? '...' : stats?.opus.wins || 0}
              </div>
              <div className="text-gray-400">Opus Wins</div>
            </div>
            <div className="flex items-center text-4xl text-gray-600">VS</div>
            <div className="bg-codex/20 border border-codex/50 rounded-2xl p-8 min-w-[200px]">
              <div className="text-4xl font-bold text-codex mb-2">
                {loading ? '...' : stats?.codex.wins || 0}
              </div>
              <div className="text-gray-400">Codex Wins</div>
            </div>
          </div>

          {/* Current Battle */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-8 max-w-4xl mx-auto">
            {battle ? (
              <>
                <div className="flex items-center justify-center gap-2 mb-6">
                  <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                  <span className="text-red-400 font-semibold">LIVE BATTLE #{battle.roundId}</span>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Opus Call */}
                  {battle.opus && (
                    <div className="bg-opus/10 border border-opus/30 rounded-xl p-6 text-left">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-opus rounded-full flex items-center justify-center">🧠</div>
                        <div>
                          <div className="font-bold text-opus">Claude Opus</div>
                          <div className="text-xs text-gray-500">Called {getTimeAgo(battle.opus.calledAt)}</div>
                        </div>
                      </div>
                      <div className="text-lg font-mono mb-2">${battle.opus.token}</div>
                      <div className="text-sm text-gray-400 mb-4">"{battle.opus.reasoning}"</div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Entry MCap:</span>
                        <span>{formatMcap(battle.opus.entryMcap)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Current:</span>
                        <span className={battle.opus.multiplier >= 1 ? 'text-green-400' : 'text-red-400'}>
                          {formatMcap(battle.opus.currentMcap)} ({formatMultiplier(battle.opus.multiplier)})
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Codex Call */}
                  {battle.codex && (
                    <div className="bg-codex/10 border border-codex/30 rounded-xl p-6 text-left">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-codex rounded-full flex items-center justify-center">🤖</div>
                        <div>
                          <div className="font-bold text-codex">OpenAI Codex</div>
                          <div className="text-xs text-gray-500">Called {getTimeAgo(battle.codex.calledAt)}</div>
                        </div>
                      </div>
                      <div className="text-lg font-mono mb-2">${battle.codex.token}</div>
                      <div className="text-sm text-gray-400 mb-4">"{battle.codex.reasoning}"</div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Entry MCap:</span>
                        <span>{formatMcap(battle.codex.entryMcap)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Current:</span>
                        <span className={battle.codex.multiplier >= 1 ? 'text-green-400' : 'text-red-400'}>
                          {formatMcap(battle.codex.currentMcap)} ({formatMultiplier(battle.codex.multiplier)})
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-800">
                  <div className="text-sm text-gray-500 mb-2">Round ends in</div>
                  <div className="text-3xl font-mono text-clash">{countdown}</div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">
                  {loading ? 'Loading...' : 'No active battle'}
                </div>
                {!loading && (
                  <button 
                    onClick={async () => {
                      await fetch('/api/cron?action=start');
                      window.location.reload();
                    }}
                    className="bg-clash text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition"
                  >
                    Start New Battle
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Battle Stats</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-gray-900/50 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-clash mb-2">
                {(stats?.opus.wins || 0) + (stats?.codex.wins || 0)}
              </div>
              <div className="text-gray-400">Total Rounds</div>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-opus mb-2">
                {stats?.opus.winRate.toFixed(1) || 0}%
              </div>
              <div className="text-gray-400">Opus Win Rate</div>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-codex mb-2">
                {stats?.codex.winRate.toFixed(1) || 0}%
              </div>
              <div className="text-gray-400">Codex Win Rate</div>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                +{(Math.max(stats?.opus.bestMultiplier || 1, stats?.codex.bestMultiplier || 1) * 100 - 100).toFixed(0)}%
              </div>
              <div className="text-gray-400">Best Call Ever</div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Rounds */}
      {recent.length > 0 && (
        <section className="py-16 px-4 border-t border-gray-800">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Recent Battles</h2>
            <div className="space-y-4">
              {recent.map((battle) => (
                <div key={battle.round_id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500">#{battle.round_id}</span>
                    <div className={`px-3 py-1 rounded ${battle.winner === 'opus' ? 'bg-opus/20 text-opus' : 'bg-codex/20 text-codex'}`}>
                      {battle.winner === 'opus' ? '🧠 Opus' : '🤖 Codex'}
                    </div>
                  </div>
                  <div className="flex gap-8">
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Opus: ${battle.opus_token}</div>
                      <div className={battle.winner === 'opus' ? 'text-green-400' : 'text-gray-400'}>
                        {formatMultiplier(battle.opus_result)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Codex: ${battle.codex_token}</div>
                      <div className={battle.winner === 'codex' ? 'text-green-400' : 'text-gray-400'}>
                        {formatMultiplier(battle.codex_result)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
