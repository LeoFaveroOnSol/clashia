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
  const [activeTab, setActiveTab] = useState<'arena' | 'history' | 'about'>('arena');

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

  const opusWins = stats?.opus?.wins ?? 0;
  const codexWins = stats?.codex?.wins ?? 0;
  const opusWinRate = Number(stats?.opus?.winRate) || 0;
  const codexWinRate = Number(stats?.codex?.winRate) || 0;
  const bestMultiplier = Math.max(Number(stats?.opus?.bestMultiplier) || 1, Number(stats?.codex?.bestMultiplier) || 1);

  return (
    <div className="min-h-screen bg-[#d4e8d1] text-gray-900">
      {/* Main Container */}
      <div className="max-w-5xl mx-auto p-4 pt-24">
        
        {/* Header Card */}
        <div className="bg-[#2d5a3d] rounded-2xl p-6 mb-6 shadow-lg border-4 border-[#1a3d28]">
          <div className="flex items-start gap-6">
            {/* Logo */}
            <div className="w-20 h-20 bg-[#1a3d28] rounded-xl flex items-center justify-center text-4xl border-2 border-[#4a8f5c]">
              ⚔️
            </div>
            
            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-white">ClashAI</h1>
                <span className="text-[#4a8f5c]">⚡</span>
              </div>
              <p className="text-[#a8d4b0] text-sm mb-3">
                AI vs AI memecoin prediction battles
              </p>
              <div className="inline-block bg-[#4a8f5c] text-white text-xs px-3 py-1 rounded-full">
                🔴 LIVE • pump.fun arena
              </div>
            </div>

            {/* Close button style */}
            <button className="w-8 h-8 bg-[#1a3d28] rounded-lg text-[#4a8f5c] hover:bg-[#4a8f5c] hover:text-white transition flex items-center justify-center">
              ✕
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-3 mt-6">
            <div className="bg-[#1a3d28] rounded-lg p-3 text-center border border-[#4a8f5c]">
              <div className="text-[#a8d4b0] text-xs mb-1">Rounds</div>
              <div className="text-white font-bold">{opusWins + codexWins}</div>
            </div>
            <div className="bg-[#1a3d28] rounded-lg p-3 text-center border border-[#4a8f5c]">
              <div className="text-[#a8d4b0] text-xs mb-1">Opus W/R</div>
              <div className="text-[#f0b866] font-bold">{opusWinRate.toFixed(1)}%</div>
            </div>
            <div className="bg-[#1a3d28] rounded-lg p-3 text-center border border-[#4a8f5c]">
              <div className="text-[#a8d4b0] text-xs mb-1">Codex W/R</div>
              <div className="text-[#66d4f0] font-bold">{codexWinRate.toFixed(1)}%</div>
            </div>
            <div className="bg-[#1a3d28] rounded-lg p-3 text-center border border-[#4a8f5c]">
              <div className="text-[#a8d4b0] text-xs mb-1">Best Call</div>
              <div className="text-[#66f084] font-bold">+{((bestMultiplier - 1) * 100).toFixed(0)}%</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('arena')}
            className={`px-5 py-2 rounded-xl font-medium transition flex items-center gap-2 ${
              activeTab === 'arena'
                ? 'bg-[#2d5a3d] text-white border-2 border-[#4a8f5c]'
                : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-[#4a8f5c]'
            }`}
          >
            ⚔️ Arena
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-5 py-2 rounded-xl font-medium transition flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-[#2d5a3d] text-white border-2 border-[#4a8f5c]'
                : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-[#4a8f5c]'
            }`}
          >
            📜 History
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`px-5 py-2 rounded-xl font-medium transition flex items-center gap-2 ${
              activeTab === 'about'
                ? 'bg-[#2d5a3d] text-white border-2 border-[#4a8f5c]'
                : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-[#4a8f5c]'
            }`}
          >
            ℹ️ About
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-2xl border-4 border-[#2d5a3d] shadow-lg overflow-hidden">
          
          {/* Arena Tab */}
          {activeTab === 'arena' && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xl">🏟️</span>
                <h2 className="font-bold text-lg">Live Battle Arena</h2>
                {battle && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                    ROUND #{battle.roundId}
                  </span>
                )}
              </div>

              {loading ? (
                <div className="text-center py-12 text-gray-500">Loading battles...</div>
              ) : battle ? (
                <>
                  {/* Countdown */}
                  <div className="text-center mb-6 p-4 bg-[#f0f7f1] rounded-xl border-2 border-[#d4e8d1]">
                    <div className="text-sm text-gray-500 mb-1">Round ends in</div>
                    <div className="text-3xl font-mono font-bold text-[#2d5a3d]">{countdown}</div>
                  </div>

                  {/* Battle Cards */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Opus Card */}
                    {battle.opus && (
                      <div className="bg-gradient-to-br from-[#fff8e8] to-[#fff0d0] rounded-xl border-3 border-[#f0b866] p-5 shadow-md hover:shadow-lg transition">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-[#f0b866] rounded-xl flex items-center justify-center text-2xl shadow-inner">
                            🧠
                          </div>
                          <div>
                            <div className="font-bold text-[#8a6830]">Claude Opus</div>
                            <div className="text-xs text-[#b89860]">{getTimeAgo(battle.opus.calledAt)}</div>
                          </div>
                        </div>
                        
                        <div className="bg-white/60 rounded-lg p-3 mb-3">
                          <div className="font-mono font-bold text-lg text-[#2d5a3d]">${battle.opus.token}</div>
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2">"{battle.opus.reasoning}"</div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Entry:</span>
                            <span className="font-medium">{formatMcap(battle.opus.entryMcap)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Current:</span>
                            <span className={`font-bold ${battle.opus.multiplier >= 1 ? 'text-green-600' : 'text-red-500'}`}>
                              {formatMcap(battle.opus.currentMcap)}
                            </span>
                          </div>
                          <div className="pt-2 border-t border-[#f0b866]/30">
                            <div className={`text-center text-xl font-bold ${battle.opus.multiplier >= 1 ? 'text-green-600' : 'text-red-500'}`}>
                              {formatMultiplier(battle.opus.multiplier)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Codex Card */}
                    {battle.codex && (
                      <div className="bg-gradient-to-br from-[#e8f4ff] to-[#d0e8ff] rounded-xl border-3 border-[#66b8f0] p-5 shadow-md hover:shadow-lg transition">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-[#66b8f0] rounded-xl flex items-center justify-center text-2xl shadow-inner">
                            🤖
                          </div>
                          <div>
                            <div className="font-bold text-[#306088]">OpenAI Codex</div>
                            <div className="text-xs text-[#6098b8]">{getTimeAgo(battle.codex.calledAt)}</div>
                          </div>
                        </div>
                        
                        <div className="bg-white/60 rounded-lg p-3 mb-3">
                          <div className="font-mono font-bold text-lg text-[#2d5a3d]">${battle.codex.token}</div>
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2">"{battle.codex.reasoning}"</div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Entry:</span>
                            <span className="font-medium">{formatMcap(battle.codex.entryMcap)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Current:</span>
                            <span className={`font-bold ${battle.codex.multiplier >= 1 ? 'text-green-600' : 'text-red-500'}`}>
                              {formatMcap(battle.codex.currentMcap)}
                            </span>
                          </div>
                          <div className="pt-2 border-t border-[#66b8f0]/30">
                            <div className={`text-center text-xl font-bold ${battle.codex.multiplier >= 1 ? 'text-green-600' : 'text-red-500'}`}>
                              {formatMultiplier(battle.codex.multiplier)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* VS Badge */}
                  <div className="flex justify-center -mt-4 relative z-10">
                    <div className="bg-[#2d5a3d] text-white px-4 py-2 rounded-full font-bold text-sm border-4 border-white shadow-lg">
                      ⚔️ VS
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏟️</div>
                  <div className="text-gray-500 mb-4">No active battle</div>
                  <button 
                    onClick={async () => {
                      await fetch('/api/cron?action=start');
                      window.location.reload();
                    }}
                    className="bg-[#2d5a3d] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#4a8f5c] transition"
                  >
                    🚀 Start New Battle
                  </button>
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xl">📜</span>
                <h2 className="font-bold text-lg">Battle History</h2>
              </div>

              {recent.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {recent.map((battle) => (
                    <div 
                      key={battle.round_id} 
                      className={`rounded-xl border-3 p-4 ${
                        battle.winner === 'opus' 
                          ? 'bg-[#fff8e8] border-[#f0b866]' 
                          : 'bg-[#e8f4ff] border-[#66b8f0]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-500">Round #{battle.round_id}</span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          battle.winner === 'opus'
                            ? 'bg-[#f0b866] text-white'
                            : 'bg-[#66b8f0] text-white'
                        }`}>
                          {battle.winner === 'opus' ? '🧠 Opus Won' : '🤖 Codex Won'}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">🧠 ${battle.opus_token}</span>
                          <span className={battle.winner === 'opus' ? 'text-green-600 font-bold' : 'text-gray-400'}>
                            {formatMultiplier(battle.opus_result)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">🤖 ${battle.codex_token}</span>
                          <span className={battle.winner === 'codex' ? 'text-green-600 font-bold' : 'text-gray-400'}>
                            {formatMultiplier(battle.codex_result)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No battles yet. Start one in the Arena!
                </div>
              )}
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xl">ℹ️</span>
                <h2 className="font-bold text-lg">About ClashAI</h2>
              </div>

              <div className="space-y-4 text-gray-600">
                <div className="bg-[#f0f7f1] rounded-xl p-4 border-2 border-[#d4e8d1]">
                  <h3 className="font-bold text-[#2d5a3d] mb-2">🎮 How it works</h3>
                  <p className="text-sm">
                    Two AI models compete in real-time memecoin prediction battles. 
                    Each round, both AIs analyze pump.fun tokens and make their picks. 
                    After the timer ends, we compare performance based on market cap changes.
                  </p>
                </div>

                <div className="bg-[#f0f7f1] rounded-xl p-4 border-2 border-[#d4e8d1]">
                  <h3 className="font-bold text-[#2d5a3d] mb-2">🧠 Claude Opus</h3>
                  <p className="text-sm">
                    Anthropic's most capable model. Known for nuanced reasoning and careful analysis.
                  </p>
                </div>

                <div className="bg-[#f0f7f1] rounded-xl p-4 border-2 border-[#d4e8d1]">
                  <h3 className="font-bold text-[#2d5a3d] mb-2">🤖 OpenAI Codex</h3>
                  <p className="text-sm">
                    OpenAI's code-specialized model. Fast pattern recognition and data analysis.
                  </p>
                </div>

                <div className="bg-[#f0f7f1] rounded-xl p-4 border-2 border-[#d4e8d1]">
                  <h3 className="font-bold text-[#2d5a3d] mb-2">⚠️ Disclaimer</h3>
                  <p className="text-sm">
                    This is entertainment only. AI predictions are not financial advice. 
                    Never invest more than you can afford to lose.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center py-6 text-sm text-[#4a8f5c]">
          Made with ⚔️ for degens who love AI
        </div>
      </div>
    </div>
  );
}
