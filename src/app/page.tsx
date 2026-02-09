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

// Mock multiple coin picks per AI
interface CoinPick {
  token: string;
  contract: string;
  entryMcap: number;
  currentMcap: number;
  multiplier: number;
  reasoning: string;
}

const mockOpusPicks: CoinPick[] = [
  { token: 'PEPE2', contract: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', entryMcap: 45000, currentMcap: 52000, multiplier: 1.15, reasoning: 'Strong community momentum, healthy holder distribution' },
  { token: 'WOJAK', contract: '5z3EqYQo9HiCEs3R84RCDMu2n7anpDMxRhdK8PSWmrRC', entryMcap: 28000, currentMcap: 31000, multiplier: 1.11, reasoning: 'Meme narrative gaining traction on CT' },
  { token: 'BONK2', contract: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', entryMcap: 120000, currentMcap: 115000, multiplier: 0.96, reasoning: 'Follow-up on BONK success, solid dev team' },
];

const mockCodexPicks: CoinPick[] = [
  { token: 'GROK', contract: '8wXtPeU6557ETkp9WHFY1n1EcU6NxDvbAggHGsMYiHsB', entryMcap: 85000, currentMcap: 98000, multiplier: 1.15, reasoning: 'AI narrative + Elon connection driving volume' },
  { token: 'MOCHI', contract: '45EgCwcPXYagBC7KqBin4nCFgEZWN7f3Y6nACwxqMCWX', entryMcap: 15000, currentMcap: 19000, multiplier: 1.27, reasoning: 'Cute cat meta performing well this cycle' },
  { token: 'SAMO', contract: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', entryMcap: 95000, currentMcap: 89000, multiplier: 0.94, reasoning: 'Dog coins showing relative strength' },
];

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

function shortenContract(contract: string): string {
  return `${contract.slice(0, 4)}...${contract.slice(-4)}`;
}

const TOKEN_CONTRACT = 'CLASHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const TOKEN_MCAP = 125000;
const TOKEN_PRICE = 0.000125;

export default function Home() {
  const [data, setData] = useState<BattleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState('--:--:--');
  const [showTokenPanel, setShowTokenPanel] = useState(true);
  const [showHowItWorks, setShowHowItWorks] = useState(true);
  const [showPredictions, setShowPredictions] = useState(false);

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

  const copyContract = (contract: string) => {
    navigator.clipboard.writeText(contract);
  };

  // Calculate portfolio performance
  const opusTotal = mockOpusPicks.reduce((sum, p) => sum + p.multiplier, 0) / mockOpusPicks.length;
  const codexTotal = mockCodexPicks.reduce((sum, p) => sum + p.multiplier, 0) / mockCodexPicks.length;

  return (
    <div className="min-h-screen bg-[#d4e8d1] pt-20">
      
      {/* Floating Token Panel - Left */}
      {showTokenPanel && (
        <div className="fixed left-4 top-24 w-64 bg-white rounded-xl border-4 border-[#2d5a3d] shadow-lg z-40">
          <div className="bg-[#2d5a3d] px-4 py-2 flex items-center justify-between">
            <span className="text-white font-bold text-sm">$CLASH Token</span>
            <button onClick={() => setShowTokenPanel(false)} className="text-[#a8d4b0] hover:text-white text-lg leading-none">×</button>
          </div>
          <div className="p-4">
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-1">Contract</div>
              <div 
                onClick={() => copyContract(TOKEN_CONTRACT)}
                className="bg-[#f0f7f1] rounded-lg p-2 text-xs font-mono text-[#2d5a3d] cursor-pointer hover:bg-[#e0efe0] transition break-all"
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
            <button onClick={() => setShowHowItWorks(false)} className="text-[#a8d4b0] hover:text-white text-lg leading-none">×</button>
          </div>
          <div className="p-4 text-sm">
            <p className="text-gray-600 mb-4">
              $CLASH tokenomics tied to AI battle outcomes.
            </p>

            <div className="bg-[#fffcf5] border-2 border-[#f0b866] rounded-lg p-3 mb-3">
              <div className="font-bold text-[#8a6830] mb-1">Claude Wins</div>
              <p className="text-xs text-gray-600">
                Creator fees trigger <span className="font-medium text-[#8a6830]">buyback and burn</span>. Tokens removed from supply.
              </p>
            </div>

            <div className="bg-[#f5faff] border-2 border-[#66b8f0] rounded-lg p-3 mb-3">
              <div className="font-bold text-[#306088] mb-1">OpenAI Wins</div>
              <p className="text-xs text-gray-600">
                Creator fees fund <span className="font-medium text-[#306088]">airdrop to holders</span>. Proportional distribution.
              </p>
            </div>

            <div className="bg-[#f0f7f1] rounded-lg p-3">
              <div className="font-bold text-[#2d5a3d] mb-1">Tech</div>
              <p className="text-xs text-gray-600">
                pump.fun API, Birdeye, Anthropic & OpenAI APIs. On-chain verified.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Predictions Modal */}
      {showPredictions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPredictions(false)}>
          <div className="bg-white rounded-2xl border-4 border-[#2d5a3d] shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="bg-[#2d5a3d] px-6 py-4 flex items-center justify-between sticky top-0">
              <span className="text-white font-bold">Prediction Markets</span>
              <button onClick={() => setShowPredictions(false)} className="text-[#a8d4b0] hover:text-white text-xl leading-none">×</button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6">
                Daily predictions from Polymarket and crypto price targets. Both AIs analyze and give their calls.
              </p>
              
              <div className="space-y-4">
                {[
                  { q: 'Bitcoin closes above $97,000 today?', opus: 'YES', codex: 'NO', odds: 52 },
                  { q: 'Solana stays above $190 at close?', opus: 'YES', codex: 'YES', odds: 65 },
                  { q: 'ETH outperforms BTC today?', opus: 'NO', codex: 'YES', odds: 42 },
                  { q: 'Fed cuts rates in March?', opus: 'NO', codex: 'NO', odds: 28 },
                ].map((p, i) => (
                  <div key={i} className="bg-[#f0f7f1] rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-medium text-[#2d5a3d] mb-2">{p.q}</div>
                        <div className="flex gap-4 text-sm">
                          <span className="text-[#8a6830]">Opus: <span className={p.opus === 'YES' ? 'text-green-600' : 'text-red-500'}>{p.opus}</span></span>
                          <span className="text-[#306088]">Codex: <span className={p.codex === 'YES' ? 'text-green-600' : 'text-red-500'}>{p.codex}</span></span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Market</div>
                        <div className="font-bold text-[#2d5a3d]">{p.odds}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <a 
                href="/predict" 
                className="block mt-6 bg-[#2d5a3d] text-white text-center py-3 rounded-xl font-medium hover:bg-[#4a8f5c] transition"
              >
                View All Predictions
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Toggle buttons */}
      {!showTokenPanel && (
        <button onClick={() => setShowTokenPanel(true)} className="fixed left-4 top-24 bg-[#2d5a3d] text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#4a8f5c] transition z-40">
          $CLASH
        </button>
      )}
      {!showHowItWorks && (
        <button onClick={() => setShowHowItWorks(true)} className="fixed right-4 top-24 bg-[#2d5a3d] text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#4a8f5c] transition z-40">
          How It Works
        </button>
      )}

      <div className="max-w-4xl mx-auto p-4">
        
        {/* Header Card */}
        <div className="bg-[#2d5a3d] rounded-2xl p-6 mb-6 border-4 border-[#1a3d28]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#1a3d28] rounded-xl flex items-center justify-center border-2 border-[#4a8f5c]">
                <span className="text-2xl font-bold text-white">vs</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">ClashAI</h1>
                <p className="text-[#a8d4b0] text-sm">AI prediction battles</p>
              </div>
            </div>
            <button
              onClick={() => setShowPredictions(true)}
              className="bg-[#4a8f5c] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#5aa06c] transition"
            >
              Predictions
            </button>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="bg-[#1a3d28] rounded-lg p-3 text-center border border-[#4a8f5c]">
              <div className="text-[#a8d4b0] text-xs mb-1">Rounds</div>
              <div className="text-white font-bold">{opusWins + codexWins}</div>
            </div>
            <div className="bg-[#1a3d28] rounded-lg p-3 text-center border border-[#4a8f5c]">
              <div className="text-[#a8d4b0] text-xs mb-1">Opus</div>
              <div className="text-[#f0b866] font-bold">{opusWinRate.toFixed(0)}%</div>
            </div>
            <div className="bg-[#1a3d28] rounded-lg p-3 text-center border border-[#4a8f5c]">
              <div className="text-[#a8d4b0] text-xs mb-1">Codex</div>
              <div className="text-[#66d4f0] font-bold">{codexWinRate.toFixed(0)}%</div>
            </div>
            <div className="bg-[#1a3d28] rounded-lg p-3 text-center border border-[#4a8f5c]">
              <div className="text-[#a8d4b0] text-xs mb-1">Status</div>
              <div className="text-[#66f084] font-bold">Live</div>
            </div>
          </div>
        </div>

        {/* Score */}
        <div className="bg-white rounded-2xl border-4 border-[#2d5a3d] p-6 mb-6">
          <div className="flex justify-center items-center gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#8a6830] mb-1">{loading ? '-' : opusWins}</div>
              <div className="text-gray-600 text-sm">Opus</div>
              <div className="text-xs text-gray-400">buyback & burn</div>
            </div>
            <div className="text-gray-400 text-2xl">vs</div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#306088] mb-1">{loading ? '-' : codexWins}</div>
              <div className="text-gray-600 text-sm">Codex</div>
              <div className="text-xs text-gray-400">holder airdrop</div>
            </div>
          </div>
        </div>

        {/* Current Round - Multiple Coins */}
        <div className="bg-white rounded-2xl border-4 border-[#2d5a3d] p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#2d5a3d]">Current Round #42</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <span className="font-mono text-[#2d5a3d]">{countdown}</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Opus Picks */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-[#8a6830]">Opus Portfolio</span>
                <span className={`text-sm font-medium ${opusTotal >= 1 ? 'text-green-600' : 'text-red-500'}`}>
                  Avg: {formatMultiplier(opusTotal)}
                </span>
              </div>
              <div className="space-y-2">
                {mockOpusPicks.map((pick, i) => (
                  <div key={i} className="bg-[#fffcf5] rounded-lg p-3 border border-[#f0b866]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-medium text-[#2d5a3d]">${pick.token}</span>
                      <span className={`text-sm font-medium ${pick.multiplier >= 1 ? 'text-green-600' : 'text-red-500'}`}>
                        {formatMultiplier(pick.multiplier)}
                      </span>
                    </div>
                    <div 
                      className="text-xs text-gray-400 font-mono cursor-pointer hover:text-[#2d5a3d]"
                      onClick={() => copyContract(pick.contract)}
                      title="Click to copy"
                    >
                      {shortenContract(pick.contract)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{pick.reasoning}</p>
                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                      <span>Entry: {formatMcap(pick.entryMcap)}</span>
                      <span>Now: {formatMcap(pick.currentMcap)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Codex Picks */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-[#306088]">Codex Portfolio</span>
                <span className={`text-sm font-medium ${codexTotal >= 1 ? 'text-green-600' : 'text-red-500'}`}>
                  Avg: {formatMultiplier(codexTotal)}
                </span>
              </div>
              <div className="space-y-2">
                {mockCodexPicks.map((pick, i) => (
                  <div key={i} className="bg-[#f5faff] rounded-lg p-3 border border-[#66b8f0]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-medium text-[#2d5a3d]">${pick.token}</span>
                      <span className={`text-sm font-medium ${pick.multiplier >= 1 ? 'text-green-600' : 'text-red-500'}`}>
                        {formatMultiplier(pick.multiplier)}
                      </span>
                    </div>
                    <div 
                      className="text-xs text-gray-400 font-mono cursor-pointer hover:text-[#2d5a3d]"
                      onClick={() => copyContract(pick.contract)}
                      title="Click to copy"
                    >
                      {shortenContract(pick.contract)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{pick.reasoning}</p>
                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                      <span>Entry: {formatMcap(pick.entryMcap)}</span>
                      <span>Now: {formatMcap(pick.currentMcap)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
