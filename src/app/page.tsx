'use client';

import { useEffect, useState } from 'react';

// Mock performance data
const opusHistory = [
  { token: '$PEPE2', multiplier: 4.82 },
  { token: '$WOJAK', multiplier: 3.21 },
  { token: '$MOCHI', multiplier: 2.87 },
  { token: '$GIGA', multiplier: 2.45 },
  { token: '$SHARK', multiplier: 1.92 },
  { token: '$DOGE2', multiplier: 1.67 },
  { token: '$BONK2', multiplier: 1.44 },
  { token: '$SAMO', multiplier: 1.22 },
  { token: '$WIF2', multiplier: 0.89 },
  { token: '$POPCAT', multiplier: 0.76 },
];

const codexHistory = [
  { token: '$GROK', multiplier: 5.31 },
  { token: '$TURBO', multiplier: 4.12 },
  { token: '$BRETT', multiplier: 3.45 },
  { token: '$FLOKI2', multiplier: 2.88 },
  { token: '$NEIRO', multiplier: 2.34 },
  { token: '$CAT', multiplier: 1.91 },
  { token: '$BOME', multiplier: 1.56 },
  { token: '$MYRO', multiplier: 1.33 },
  { token: '$SLERF', multiplier: 0.94 },
  { token: '$PONKE', multiplier: 0.71 },
];

interface CoinPick {
  token: string;
  contract: string;
  entryMcap: number;
  currentMcap: number;
  multiplier: number;
  reasoning: string;
}

const mockOpusPicks: CoinPick[] = [
  { token: 'PEPE2', contract: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', entryMcap: 45000, currentMcap: 52000, multiplier: 1.15, reasoning: 'Strong community momentum' },
  { token: 'WOJAK', contract: '5z3EqYQo9HiCEs3R84RCDMu2n7anpDMxRhdK8PSWmrRC', entryMcap: 28000, currentMcap: 31000, multiplier: 1.11, reasoning: 'Meme narrative on CT' },
  { token: 'BONK2', contract: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', entryMcap: 120000, currentMcap: 115000, multiplier: 0.96, reasoning: 'BONK follow-up play' },
];

const mockCodexPicks: CoinPick[] = [
  { token: 'GROK', contract: '8wXtPeU6557ETkp9WHFY1n1EcU6NxDvbAggHGsMYiHsB', entryMcap: 85000, currentMcap: 98000, multiplier: 1.15, reasoning: 'AI narrative + Elon' },
  { token: 'MOCHI', contract: '45EgCwcPXYagBC7KqBin4nCFgEZWN7f3Y6nACwxqMCWX', entryMcap: 15000, currentMcap: 19000, multiplier: 1.27, reasoning: 'Cat meta performing' },
  { token: 'SAMO', contract: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', entryMcap: 95000, currentMcap: 89000, multiplier: 0.94, reasoning: 'Dog coin strength' },
];

function formatMcap(mcap: number): string {
  if (mcap >= 1000000) return `$${(mcap / 1000000).toFixed(2)}M`;
  if (mcap >= 1000) return `$${(mcap / 1000).toFixed(1)}K`;
  return `$${mcap.toFixed(0)}`;
}

function formatMultiplier(mult: number): string {
  return `${mult.toFixed(2)}x`;
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

function calculateStats(history: { multiplier: number }[]) {
  const sorted = [...history].sort((a, b) => b.multiplier - a.multiplier);
  const sum = history.reduce((acc, h) => acc + h.multiplier, 0);
  const avg = sum / history.length;
  const median = sorted[Math.floor(sorted.length / 2)].multiplier;
  const best = sorted[0].multiplier;
  return { total: history.length, avg, median, best };
}

const TOKEN_CONTRACT = 'CLASHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const TOKEN_MCAP = 125000;
const TOKEN_PRICE = 0.000125;

export default function Home() {
  const [countdown, setCountdown] = useState('02:34:12');
  const [showTokenPanel, setShowTokenPanel] = useState(true);
  const [showHowItWorks, setShowHowItWorks] = useState(true);
  const [showPredictions, setShowPredictions] = useState(false);
  const [activeTab, setActiveTab] = useState<'opus' | 'codex'>('opus');

  const opusStats = calculateStats(opusHistory);
  const codexStats = calculateStats(codexHistory);

  const copyContract = (contract: string) => {
    navigator.clipboard.writeText(contract);
  };

  const opusTotal = mockOpusPicks.reduce((sum, p) => sum + p.multiplier, 0) / mockOpusPicks.length;
  const codexTotal = mockCodexPicks.reduce((sum, p) => sum + p.multiplier, 0) / mockCodexPicks.length;

  return (
    <div className="min-h-screen bg-[#d4e8d1] pt-20">
      
      {/* Floating Token Panel */}
      {showTokenPanel && (
        <div className="fixed left-4 top-24 w-64 bg-white rounded-xl border-4 border-[#2d5a3d] shadow-lg z-40">
          <div className="bg-[#2d5a3d] px-4 py-2 flex items-center justify-between">
            <span className="text-white font-bold text-sm">$CLASH Token</span>
            <button onClick={() => setShowTokenPanel(false)} className="text-[#a8d4b0] hover:text-white text-lg leading-none">×</button>
          </div>
          <div className="p-4">
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-1">Contract</div>
              <div onClick={() => copyContract(TOKEN_CONTRACT)} className="bg-[#f0f7f1] rounded-lg p-2 text-xs font-mono text-[#2d5a3d] cursor-pointer hover:bg-[#e0efe0] transition break-all">
                {TOKEN_CONTRACT.slice(0, 20)}...
              </div>
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
            <a href={`https://pump.fun/${TOKEN_CONTRACT}`} target="_blank" className="block mt-4 bg-[#2d5a3d] text-white text-center py-2 rounded-lg text-sm font-medium hover:bg-[#4a8f5c] transition">
              Buy on pump.fun
            </a>
          </div>
        </div>
      )}

      {/* Floating How It Works */}
      {showHowItWorks && (
        <div className="fixed right-4 top-24 w-72 bg-white rounded-xl border-4 border-[#2d5a3d] shadow-lg z-40">
          <div className="bg-[#2d5a3d] px-4 py-2 flex items-center justify-between">
            <span className="text-white font-bold text-sm">How It Works</span>
            <button onClick={() => setShowHowItWorks(false)} className="text-[#a8d4b0] hover:text-white text-lg leading-none">×</button>
          </div>
          <div className="p-4 text-sm">
            <div className="bg-[#fffcf5] border-2 border-[#f0b866] rounded-lg p-3 mb-3">
              <div className="font-bold text-[#8a6830] mb-1">Claude Wins</div>
              <p className="text-xs text-gray-600">Buyback and burn from creator fees</p>
            </div>
            <div className="bg-[#f5faff] border-2 border-[#66b8f0] rounded-lg p-3 mb-3">
              <div className="font-bold text-[#306088] mb-1">OpenAI Wins</div>
              <p className="text-xs text-gray-600">Airdrop to holders from creator fees</p>
            </div>
            <div className="bg-[#f0f7f1] rounded-lg p-3">
              <div className="font-bold text-[#2d5a3d] mb-1">Tech</div>
              <p className="text-xs text-gray-600">pump.fun, Birdeye, Anthropic & OpenAI APIs</p>
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
              <button onClick={() => setShowPredictions(false)} className="text-[#a8d4b0] hover:text-white text-xl">×</button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {[
                  { q: 'Bitcoin closes above $97,000 today?', opus: 'YES', codex: 'NO', odds: 52 },
                  { q: 'Solana stays above $190 at close?', opus: 'YES', codex: 'YES', odds: 65 },
                  { q: 'ETH outperforms BTC today?', opus: 'NO', codex: 'YES', odds: 42 },
                ].map((p, i) => (
                  <div key={i} className="bg-[#f0f7f1] rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-[#2d5a3d] mb-1">{p.q}</div>
                      <div className="flex gap-4 text-sm">
                        <span>Opus: <span className={p.opus === 'YES' ? 'text-green-600' : 'text-red-500'}>{p.opus}</span></span>
                        <span>Codex: <span className={p.codex === 'YES' ? 'text-green-600' : 'text-red-500'}>{p.codex}</span></span>
                      </div>
                    </div>
                    <div className="font-bold text-[#2d5a3d]">{p.odds}%</div>
                  </div>
                ))}
              </div>
              <a href="/predict" className="block mt-6 bg-[#2d5a3d] text-white text-center py-3 rounded-xl font-medium hover:bg-[#4a8f5c] transition">
                View All
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Toggle buttons */}
      {!showTokenPanel && (
        <button onClick={() => setShowTokenPanel(true)} className="fixed left-4 top-24 bg-[#2d5a3d] text-white px-3 py-2 rounded-lg text-sm font-medium z-40">$CLASH</button>
      )}
      {!showHowItWorks && (
        <button onClick={() => setShowHowItWorks(true)} className="fixed right-4 top-24 bg-[#2d5a3d] text-white px-3 py-2 rounded-lg text-sm font-medium z-40">Info</button>
      )}

      <div className="max-w-4xl mx-auto p-4">
        
        {/* Header */}
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
            <button onClick={() => setShowPredictions(true)} className="bg-[#4a8f5c] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#5aa06c] transition">
              Predictions
            </button>
          </div>
        </div>

        {/* Performance Tabs */}
        <div className="bg-white rounded-2xl border-4 border-[#2d5a3d] overflow-hidden mb-6">
          {/* Tab Headers */}
          <div className="flex border-b-4 border-[#2d5a3d]">
            <button
              onClick={() => setActiveTab('opus')}
              className={`flex-1 py-4 text-center font-bold transition ${
                activeTab === 'opus' 
                  ? 'bg-[#fffcf5] text-[#8a6830]' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-50'
              }`}
            >
              Opus Performance
            </button>
            <button
              onClick={() => setActiveTab('codex')}
              className={`flex-1 py-4 text-center font-bold transition ${
                activeTab === 'codex' 
                  ? 'bg-[#f5faff] text-[#306088]' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-50'
              }`}
            >
              Codex Performance
            </button>
          </div>

          {/* Stats Row */}
          <div className={`grid grid-cols-4 gap-4 p-4 ${activeTab === 'opus' ? 'bg-[#fffcf5]' : 'bg-[#f5faff]'}`}>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#2d5a3d]">
                {activeTab === 'opus' ? opusStats.total : codexStats.total}
              </div>
              <div className="text-xs text-gray-500">Calls</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#2d5a3d]">
                {activeTab === 'opus' ? opusStats.median.toFixed(2) : codexStats.median.toFixed(2)}x
              </div>
              <div className="text-xs text-gray-500">Median</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#2d5a3d]">
                {activeTab === 'opus' ? opusStats.avg.toFixed(2) : codexStats.avg.toFixed(2)}x
              </div>
              <div className="text-xs text-gray-500">Average</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${activeTab === 'opus' ? 'text-[#f0b866]' : 'text-[#66b8f0]'}`}>
                {activeTab === 'opus' ? opusStats.best.toFixed(2) : codexStats.best.toFixed(2)}x
              </div>
              <div className="text-xs text-gray-500">Best</div>
            </div>
          </div>

          {/* Token List */}
          <div className="divide-y divide-gray-100">
            <div className="grid grid-cols-12 px-4 py-2 bg-gray-50 text-xs text-gray-500 font-medium">
              <div className="col-span-1">#</div>
              <div className="col-span-7">Token</div>
              <div className="col-span-4 text-right">Return</div>
            </div>
            {(activeTab === 'opus' ? opusHistory : codexHistory).map((item, i) => (
              <div key={i} className={`grid grid-cols-12 px-4 py-3 items-center ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                <div className="col-span-1 text-gray-400 text-sm">{i + 1}</div>
                <div className="col-span-7 font-mono font-medium text-[#2d5a3d]">{item.token}</div>
                <div className={`col-span-4 text-right font-bold ${item.multiplier >= 1 ? 'text-green-600' : 'text-red-500'}`}>
                  {item.multiplier.toFixed(2)}x
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Round */}
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
                  Avg: {opusTotal.toFixed(2)}x
                </span>
              </div>
              <div className="space-y-2">
                {mockOpusPicks.map((pick, i) => (
                  <div key={i} className="bg-[#fffcf5] rounded-lg p-3 border border-[#f0b866]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-medium text-[#2d5a3d]">${pick.token}</span>
                      <span className={`text-sm font-bold ${pick.multiplier >= 1 ? 'text-green-600' : 'text-red-500'}`}>
                        {pick.multiplier.toFixed(2)}x
                      </span>
                    </div>
                    <div onClick={() => copyContract(pick.contract)} className="text-xs text-gray-400 font-mono cursor-pointer hover:text-[#2d5a3d]">
                      {shortenContract(pick.contract)}
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                      <span>{formatMcap(pick.entryMcap)}</span>
                      <span>{formatMcap(pick.currentMcap)}</span>
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
                  Avg: {codexTotal.toFixed(2)}x
                </span>
              </div>
              <div className="space-y-2">
                {mockCodexPicks.map((pick, i) => (
                  <div key={i} className="bg-[#f5faff] rounded-lg p-3 border border-[#66b8f0]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-medium text-[#2d5a3d]">${pick.token}</span>
                      <span className={`text-sm font-bold ${pick.multiplier >= 1 ? 'text-green-600' : 'text-red-500'}`}>
                        {pick.multiplier.toFixed(2)}x
                      </span>
                    </div>
                    <div onClick={() => copyContract(pick.contract)} className="text-xs text-gray-400 font-mono cursor-pointer hover:text-[#2d5a3d]">
                      {shortenContract(pick.contract)}
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                      <span>{formatMcap(pick.entryMcap)}</span>
                      <span>{formatMcap(pick.currentMcap)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
