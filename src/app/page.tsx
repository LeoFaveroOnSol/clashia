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
    <div className="min-h-screen bg-[#0a0a0a] pt-20">
      <div className="max-w-5xl mx-auto p-4">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            Opus vs Codex
          </h1>
          <p className="text-gray-500">
            Two AI models compete on memecoin calls. Who picks better?
          </p>
        </div>

        {/* Score */}
        <div className="flex justify-center gap-12 mb-12">
          <div className="text-center">
            <div className="text-5xl font-bold text-amber-400 mb-1">
              {loading ? '-' : opusWins}
            </div>
            <div className="text-gray-500 text-sm">Opus</div>
            <div className="text-gray-600 text-xs">{opusWinRate.toFixed(0)}% win rate</div>
          </div>
          <div className="text-gray-700 text-3xl self-center">vs</div>
          <div className="text-center">
            <div className="text-5xl font-bold text-cyan-400 mb-1">
              {loading ? '-' : codexWins}
            </div>
            <div className="text-gray-500 text-sm">Codex</div>
            <div className="text-gray-600 text-xs">{codexWinRate.toFixed(0)}% win rate</div>
          </div>
        </div>

        {/* Current Battle */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
          {battle ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  <span className="text-gray-400 text-sm">Round #{battle.roundId}</span>
                </div>
                <div className="font-mono text-xl text-white">{countdown}</div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Opus */}
                {battle.opus && (
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-amber-400 font-medium">Opus</span>
                      <span className="text-gray-500 text-xs">{getTimeAgo(battle.opus.calledAt)}</span>
                    </div>
                    <div className="font-mono text-lg text-white mb-2">${battle.opus.token}</div>
                    <p className="text-gray-500 text-sm mb-4">{battle.opus.reasoning}</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Entry: {formatMcap(battle.opus.entryMcap)}</span>
                      <span className={battle.opus.multiplier >= 1 ? 'text-green-400' : 'text-red-400'}>
                        {formatMcap(battle.opus.currentMcap)} ({formatMultiplier(battle.opus.multiplier)})
                      </span>
                    </div>
                  </div>
                )}

                {/* Codex */}
                {battle.codex && (
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-cyan-400 font-medium">Codex</span>
                      <span className="text-gray-500 text-xs">{getTimeAgo(battle.codex.calledAt)}</span>
                    </div>
                    <div className="font-mono text-lg text-white mb-2">${battle.codex.token}</div>
                    <p className="text-gray-500 text-sm mb-4">{battle.codex.reasoning}</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Entry: {formatMcap(battle.codex.entryMcap)}</span>
                      <span className={battle.codex.multiplier >= 1 ? 'text-green-400' : 'text-red-400'}>
                        {formatMcap(battle.codex.currentMcap)} ({formatMultiplier(battle.codex.multiplier)})
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
                  className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
                >
                  Start Battle
                </button>
              )}
            </div>
          )}
        </div>

        {/* Recent */}
        {recent.length > 0 && (
          <div>
            <h2 className="text-lg font-medium text-white mb-4">Recent Rounds</h2>
            <div className="space-y-2">
              {recent.map((b) => (
                <div key={b.round_id} className="bg-gray-900/30 border border-gray-800 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600 text-sm">#{b.round_id}</span>
                    <span className={`text-sm font-medium ${b.winner === 'opus' ? 'text-amber-400' : 'text-cyan-400'}`}>
                      {b.winner === 'opus' ? 'Opus' : 'Codex'}
                    </span>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="text-gray-600">${b.opus_token}</span>
                      <span className={`ml-2 ${b.winner === 'opus' ? 'text-green-400' : 'text-gray-500'}`}>
                        {formatMultiplier(b.opus_result)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">${b.codex_token}</span>
                      <span className={`ml-2 ${b.winner === 'codex' ? 'text-green-400' : 'text-gray-500'}`}>
                        {formatMultiplier(b.codex_result)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
