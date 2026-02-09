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

// Token contract (placeholder - replace with actual)
const TOKEN_CONTRACT = 'CLASHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const TOKEN_MCAP = 125000;
const TOKEN_PRICE = 0.000125;

export default function Home() {
  const [data, setData] = useState<BattleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState('--:--:--');
  const [showTokenPanel, setShowTokenPanel] = useState(true);
  const [showHowItWorks, setShowHowItWorks] = useState(true);

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

  const copyContract = () => {
    navigator.clipboard.writeText(TOKEN_CONTRACT);
  };

  return (
    <div className="min-h-screen bg-[#d4e8d1] pt-20">
      
      {/* Floating Token Panel - Left */}
      {showTokenPanel && (
        <div className="fixed left-4 top-24 w-64 bg-white rounded-xl border-4 border-[#2d5a3d] shadow-lg z-40">
          <div className="bg-[#2d5a3d] px-4 py-2 flex items-center justify-between">
            <span className="text-white font-bold text-sm">$CLASH Token</span>
            <button 
              onClick={() => setShowTokenPanel(false)}
              className="text-[#a8d4b0] hover:text-white text-lg leading-none"
            >
              ×
            </button>
          </div>
          <div className="p-4">
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-1">Contract</div>
              <div 
                onClick={copyContract}
                className="bg-[#f0f7f1] rounded-lg p-2 text-xs font-mono text-[#2d5a3d] cursor-pointer hover:bg-[#e0efe0] transition break-all"
                title="Click to copy"
              >
                {TOKEN_CONTRACT.slice(0, 20)}...
              </div>
              <div className="text-xs text-gray-400 mt-1">Click to copy</div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#f0f7f1] rounded-lg p-2 text-center">
                <div className="text-xs text-gray-500">Price</div>
                <div className="font-bold text-[#2d5a3d]">${TOKEN_PRICE}</div>
              </div>
              <div className="bg-[#f0f7f1] rounded-lg p-2 text-center">
                <div className="text-xs text-gray-500">MCap</div>
                <div className="font-bold text-[#2d5a3d]">${(TOKEN_MCAP / 1000).toFixed(0)}K</div>
              </div>
            </div>

            <a 
              href={`https://pump.fun/${TOKEN_CONTRACT}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-4 bg-[#2d5a3d] text-white text-center py-2 rounded-lg text-sm font-medium hover:bg-[#4a8f5c] transition"
            >
              Buy on pump.fun
            </a>
          </div>
        </div>
      )}

      {/* Floating How It Works Panel - Right */}
      {showHowItWorks && (
        <div className="fixed right-4 top-24 w-72 bg-white rounded-xl border-4 border-[#2d5a3d] shadow-lg z-40">
          <div className="bg-[#2d5a3d] px-4 py-2 flex items-center justify-between">
            <span className="text-white font-bold text-sm">How It Works</span>
            <button 
              onClick={() => setShowHowItWorks(false)}
              className="text-[#a8d4b0] hover:text-white text-lg leading-none"
            >
              ×
            </button>
          </div>
          <div className="p-4 text-sm">
            <p className="text-gray-600 mb-4">
              $CLASH tokenomics are tied directly to AI battle outcomes. The winning model determines what happens next.
            </p>

            <div className="bg-[#fffcf5] border-2 border-[#f0b866] rounded-lg p-3 mb-3">
              <div className="font-bold text-[#8a6830] mb-1">Claude Wins</div>
              <p className="text-xs text-gray-600">
                Creator fees trigger an automatic <span className="font-medium text-[#8a6830]">buyback and burn</span>. Tokens are purchased from the market and permanently removed from supply.
              </p>
            </div>

            <div className="bg-[#f5faff] border-2 border-[#66b8f0] rounded-lg p-3 mb-3">
              <div className="font-bold text-[#306088] mb-1">OpenAI Wins</div>
              <p className="text-xs text-gray-600">
                Creator fees fund an <span className="font-medium text-[#306088]">airdrop to holders</span>. Rewards distributed proportionally based on wallet balance at snapshot.
              </p>
            </div>

            <div className="bg-[#f0f7f1] rounded-lg p-3">
              <div className="font-bold text-[#2d5a3d] mb-1">Tech Stack</div>
              <p className="text-xs text-gray-600">
                Battles run via API: pump.fun for token data, Birdeye for prices, Anthropic and OpenAI for AI calls. Results verified on-chain.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Toggle buttons when panels are closed */}
      {!showTokenPanel && (
        <button
          onClick={() => setShowTokenPanel(true)}
          className="fixed left-4 top-24 bg-[#2d5a3d] text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#4a8f5c] transition z-40"
        >
          $CLASH
        </button>
      )}
      {!showHowItWorks && (
        <button
          onClick={() => setShowHowItWorks(true)}
          className="fixed right-4 top-24 bg-[#2d5a3d] text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#4a8f5c] transition z-40"
        >
          How It Works
        </button>
      )}

      <div className="max-w-3xl mx-auto p-4">
        
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
              <div className="text-xs text-gray-400">buyback & burn</div>
            </div>
            <div className="text-gray-400 text-2xl">vs</div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#306088] mb-1">
                {loading ? '-' : codexWins}
              </div>
              <div className="text-gray-600 text-sm">Codex</div>
              <div className="text-xs text-gray-400">holder airdrop</div>
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
          <div className="bg-white rounded-2xl border-4 border-[#2d5a3d] p-6">
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
      </div>
    </div>
  );
}
