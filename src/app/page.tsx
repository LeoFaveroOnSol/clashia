'use client';

import { useEffect, useState } from 'react';

interface CoinPick {
  id: number;
  token: string;
  contract: string;
  entryMcap: number;
  currentMcap: number;
  multiplier: number;
  athMultiplier: number;
  reasoning: string;
  confidence: number;
  calledAt: string;
}

interface AIStats {
  total: number;
  avg: number;
  median: number;
  best: number;
  score: number;
  balance: number;
  pnl: number;
  pnlPercent: number;
}

interface AIData {
  stats: AIStats;
  recent: CoinPick[];
  history: { token: string; multiplier: number }[];
}

interface CallsData {
  opus: AIData;
  codex: AIData;
  totalCalls: number;
}

interface Prediction {
  id: number;
  question: string;
  category: string;
  opus: {
    position: string;
    confidence: number;
    reasoning: string;
  };
  codex: {
    position: string;
    confidence: number;
    reasoning: string;
  };
  agreement: boolean;
  createdAt: string;
}

// TODO: Replace with real contract when launched
const TOKEN_CONTRACT: string = '';
const TOKEN_MCAP: number = 0;
const TOKEN_PRICE: number = 0;

function formatMcap(mcap: number): string {
  if (mcap >= 1000000) return `$${(mcap / 1000000).toFixed(2)}M`;
  if (mcap >= 1000) return `$${(mcap / 1000).toFixed(1)}K`;
  return `$${mcap.toFixed(0)}`;
}

function shortenContract(contract: string): string {
  return `${contract.slice(0, 4)}...${contract.slice(-4)}`;
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function Home() {
  const [showTokenPanel, setShowTokenPanel] = useState(true);
  const [showHowItWorks, setShowHowItWorks] = useState(true);
  const [showPredictions, setShowPredictions] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [activeTab, setActiveTab] = useState<'opus' | 'codex'>('opus');
  
  // Real data states
  const [callsData, setCallsData] = useState<CallsData | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCallIn, setNextCallIn] = useState(120);

  // Fetch real data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [callsRes, predictionsRes] = await Promise.all([
          fetch('/api/calls'),
          fetch('/api/predictions')
        ]);
        
        if (callsRes.ok) {
          const data = await callsRes.json();
          setCallsData(data);
        }
        
        if (predictionsRes.ok) {
          const data = await predictionsRes.json();
          setPredictions(data.predictions || []);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // Countdown timer for next call - based on real last call time
  useEffect(() => {
    const calculateNextCall = () => {
      if (callsData?.opus?.recent?.[0]?.calledAt) {
        const lastCall = new Date(callsData.opus.recent[0].calledAt).getTime();
        const nextCall = lastCall + (2 * 60 * 1000); // 2 minutes after last call
        const remaining = Math.max(0, Math.floor((nextCall - Date.now()) / 1000));
        setNextCallIn(remaining > 120 ? 120 : remaining);
      }
    };
    
    calculateNextCall();
    const timer = setInterval(calculateNextCall, 1000);
    return () => clearInterval(timer);
  }, [callsData]);

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const copyContract = (contract: string) => {
    navigator.clipboard.writeText(contract);
  };

  // Use real data or fallback
  const opusStats = callsData?.opus.stats || { total: 0, avg: 0, median: 0, best: 0, score: 0, balance: 1000, pnl: 0, pnlPercent: 0 };
  const codexStats = callsData?.codex.stats || { total: 0, avg: 0, median: 0, best: 0, score: 0, balance: 1000, pnl: 0, pnlPercent: 0 };
  const opusPicks = callsData?.opus.recent || [];
  const codexPicks = callsData?.codex.recent || [];
  const opusHistory = callsData?.opus.history || [];
  const codexHistory = callsData?.codex.history || [];

  const opusAvg = opusPicks.length > 0 ? opusPicks.reduce((sum, p) => sum + p.multiplier, 0) / opusPicks.length : 0;
  const codexAvg = codexPicks.length > 0 ? codexPicks.reduce((sum, p) => sum + p.multiplier, 0) / codexPicks.length : 0;

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
            {TOKEN_CONTRACT.length > 0 ? (
              <>
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
              </>
            ) : (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">🚀</div>
                <div className="font-bold text-[#2d5a3d] mb-1">Coming Soon</div>
                <div className="text-xs text-gray-500">Token launching soon!</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating How It Works */}
      {showHowItWorks && (
        <div className="fixed right-4 top-24 w-80 bg-white rounded-xl border-4 border-[#2d5a3d] shadow-lg z-40 max-h-[calc(100vh-120px)] overflow-y-auto">
          <div className="bg-[#2d5a3d] px-4 py-2 flex items-center justify-between sticky top-0">
            <span className="text-white font-bold text-sm">How It Works</span>
            <button onClick={() => setShowHowItWorks(false)} className="text-[#a8d4b0] hover:text-white text-lg leading-none">×</button>
          </div>
          <div className="p-4">
            {/* The Models */}
            <div className="mb-4">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-3">The Competitors</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#fffcf5] border-2 border-[#f0b866] rounded-xl p-3 text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-[#f0b866] to-[#d4943d] rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <div className="font-bold text-[#8a6830]">Claude</div>
                  <div className="text-xs text-[#8a6830]">Opus 4.6</div>
                </div>
                <div className="bg-[#f5faff] border-2 border-[#66b8f0] rounded-xl p-3 text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-[#66b8f0] to-[#4a90c2] rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
                    </svg>
                  </div>
                  <div className="font-bold text-[#306088]">GPT</div>
                  <div className="text-xs text-[#306088]">Codex 5.3</div>
                </div>
              </div>
            </div>

            {/* Battle Flow */}
            <div className="mb-4">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-3">Battle Flow</div>
              <div className="space-y-2 text-sm">
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-[#2d5a3d] text-white text-xs flex items-center justify-center flex-shrink-0">1</div>
                  <div className="text-gray-600">Every 2 minutes, system fetches trending tokens</div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-[#2d5a3d] text-white text-xs flex items-center justify-center flex-shrink-0">2</div>
                  <div className="text-gray-600">Both AIs analyze and pick their tokens</div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-[#2d5a3d] text-white text-xs flex items-center justify-center flex-shrink-0">3</div>
                  <div className="text-gray-600">Prices update in real-time</div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-[#2d5a3d] text-white text-xs flex items-center justify-center flex-shrink-0">4</div>
                  <div className="text-gray-600">Total score = sum of all multipliers</div>
                </div>
              </div>
            </div>

            {/* Tech Stack */}
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-3">Tech Stack</div>
              <div className="bg-[#f0f7f1] rounded-lg p-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Token Data</span>
                  <span className="text-[#2d5a3d] font-medium">GeckoTerminal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Price Feeds</span>
                  <span className="text-[#2d5a3d] font-medium">DexScreener</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Call Interval</span>
                  <span className="text-[#2d5a3d] font-medium">2 minutes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Predictions Modal */}
      {showPredictions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPredictions(false)}>
          <div className="bg-white rounded-2xl border-4 border-[#2d5a3d] shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="bg-[#2d5a3d] px-6 py-4 flex items-center justify-between sticky top-0">
              <span className="text-white font-bold">AI Predictions (Live)</span>
              <button onClick={() => setShowPredictions(false)} className="text-[#a8d4b0] hover:text-white text-xl">×</button>
            </div>
            <div className="p-6">
              {predictions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Loading predictions... First one coming in {formatCountdown(nextCallIn)}</p>
              ) : (
                <div className="space-y-4">
                  {predictions.slice(0, 10).map((pred) => (
                    <div key={pred.id} className={`rounded-xl p-4 border-2 ${pred.agreement ? 'bg-green-50 border-green-300' : 'bg-orange-50 border-orange-300'}`}>
                      <div className="font-medium text-[#2d5a3d] mb-3">{pred.question}</div>
                      
                      <div className="grid md:grid-cols-2 gap-3">
                        {/* Opus */}
                        <div className="bg-[#fffcf5] rounded-lg p-3 border border-[#f0b866]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-[#8a6830]">Opus</span>
                            <span className={`text-sm font-bold ${pred.opus.position === 'YES' ? 'text-green-600' : 'text-red-500'}`}>
                              {pred.opus.position} · {pred.opus.confidence}%
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{pred.opus.reasoning}</p>
                        </div>

                        {/* Codex */}
                        <div className="bg-[#f5faff] rounded-lg p-3 border border-[#66b8f0]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-[#306088]">Codex</span>
                            <span className={`text-sm font-bold ${pred.codex.position === 'YES' ? 'text-green-600' : 'text-red-500'}`}>
                              {pred.codex.position} · {pred.codex.confidence}%
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{pred.codex.reasoning}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2 text-xs">
                        <span className={`px-2 py-0.5 rounded ${pred.agreement ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {pred.agreement ? '✓ Both agree' : '⚡ Split decision'}
                        </span>
                        <span className="text-gray-400">{timeAgo(pred.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <a href="/predict" className="block mt-6 bg-[#2d5a3d] text-white text-center py-3 rounded-xl font-medium hover:bg-[#4a8f5c] transition">
                View All Predictions
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Balance Modal */}
      {showBalance && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowBalance(false)}>
          <div className="bg-white rounded-2xl border-4 border-[#2d5a3d] shadow-2xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="bg-[#2d5a3d] px-6 py-4 flex items-center justify-between">
              <span className="text-white font-bold">💰 AI Balances</span>
              <button onClick={() => setShowBalance(false)} className="text-[#a8d4b0] hover:text-white text-xl">×</button>
            </div>
            <div className="p-6">
              <p className="text-gray-500 text-sm mb-6 text-center">
                Each AI started with <span className="font-bold text-[#2d5a3d]">$1,000</span>. Performance based on real token picks.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Opus Balance */}
                <div className="bg-[#fffcf5] rounded-xl p-4 border-2 border-[#f0b866]">
                  <div className="text-center mb-3">
                    <div className="text-[#8a6830] font-bold text-lg">Claude Opus</div>
                    <div className="text-gray-500 text-xs">{opusStats.total} calls</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#2d5a3d] mb-1">
                      ${opusStats.balance.toLocaleString()}
                    </div>
                    <div className={`text-sm font-medium ${opusStats.pnl >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {opusStats.pnl >= 0 ? '+' : ''}{opusStats.pnl.toLocaleString()} ({opusStats.pnlPercent >= 0 ? '+' : ''}{opusStats.pnlPercent}%)
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#f0b866]/30">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Avg mult.</span>
                      <span className="font-medium text-[#2d5a3d]">{opusStats.avg.toFixed(2)}x</span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-gray-500">Best</span>
                      <span className="font-medium text-[#f0b866]">{opusStats.best.toFixed(2)}x</span>
                    </div>
                  </div>
                </div>

                {/* Codex Balance */}
                <div className="bg-[#f5faff] rounded-xl p-4 border-2 border-[#66b8f0]">
                  <div className="text-center mb-3">
                    <div className="text-[#306088] font-bold text-lg">GPT Codex</div>
                    <div className="text-gray-500 text-xs">{codexStats.total} calls</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#2d5a3d] mb-1">
                      ${codexStats.balance.toLocaleString()}
                    </div>
                    <div className={`text-sm font-medium ${codexStats.pnl >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {codexStats.pnl >= 0 ? '+' : ''}{codexStats.pnl.toLocaleString()} ({codexStats.pnlPercent >= 0 ? '+' : ''}{codexStats.pnlPercent}%)
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#66b8f0]/30">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Avg mult.</span>
                      <span className="font-medium text-[#2d5a3d]">{codexStats.avg.toFixed(2)}x</span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-gray-500">Best</span>
                      <span className="font-medium text-[#66b8f0]">{codexStats.best.toFixed(2)}x</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Winner indicator */}
              <div className="mt-6 text-center">
                {opusStats.balance !== codexStats.balance && (
                  <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                    opusStats.balance > codexStats.balance 
                      ? 'bg-[#fffcf5] text-[#8a6830] border-2 border-[#f0b866]' 
                      : 'bg-[#f5faff] text-[#306088] border-2 border-[#66b8f0]'
                  }`}>
                    🏆 {opusStats.balance > codexStats.balance ? 'Opus' : 'Codex'} is winning by ${Math.abs(opusStats.balance - codexStats.balance).toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toggle buttons */}
      {!showTokenPanel && (
        <button onClick={() => setShowTokenPanel(true)} className="fixed left-4 top-24 bg-[#2d5a3d] text-white px-3 py-2 rounded-lg text-sm font-medium z-40">$CLASH</button>
      )}
      {!showHowItWorks && (
        <button onClick={() => setShowHowItWorks(true)} className="fixed right-4 top-24 bg-[#2d5a3d] text-white px-3 py-2 rounded-lg text-sm font-medium z-40">How It Works</button>
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
                <p className="text-[#a8d4b0] text-sm">AI prediction battles • Live calls every 2 min</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[#a8d4b0] text-xs">Next call in</div>
                <div className="text-white font-mono font-bold">{formatCountdown(nextCallIn)}</div>
              </div>
              <button onClick={() => setShowBalance(true)} className="bg-[#1a3d28] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2d5a3d] transition border border-[#4a8f5c]">
                💰 Balance
              </button>
              <button onClick={() => setShowPredictions(true)} className="bg-[#4a8f5c] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#5aa06c] transition">
                Predictions
              </button>
            </div>
          </div>
          
          {/* Live status */}
          <div className="flex items-center gap-2 text-sm text-[#a8d4b0]">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span>Live • {callsData?.totalCalls || 0} total calls</span>
          </div>
        </div>

        {/* Performance Tabs */}
        <div className="bg-white rounded-2xl border-4 border-[#2d5a3d] overflow-hidden mb-6">
          <div className="flex border-b-4 border-[#2d5a3d]">
            <button
              onClick={() => setActiveTab('opus')}
              className={`flex-1 py-4 text-center font-bold transition ${
                activeTab === 'opus' ? 'bg-[#fffcf5] text-[#8a6830]' : 'bg-gray-100 text-gray-500'
              }`}
            >
              Opus Performance
            </button>
            <button
              onClick={() => setActiveTab('codex')}
              className={`flex-1 py-4 text-center font-bold transition ${
                activeTab === 'codex' ? 'bg-[#f5faff] text-[#306088]' : 'bg-gray-100 text-gray-500'
              }`}
            >
              Codex Performance
            </button>
          </div>

          <div className={`grid grid-cols-4 gap-4 p-4 ${activeTab === 'opus' ? 'bg-[#fffcf5]' : 'bg-[#f5faff]'}`}>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#2d5a3d]">{activeTab === 'opus' ? opusStats.total : codexStats.total}</div>
              <div className="text-xs text-gray-500">Calls</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#2d5a3d]">{(activeTab === 'opus' ? opusStats.median : codexStats.median).toFixed(2)}x</div>
              <div className="text-xs text-gray-500">Median</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#2d5a3d]">{(activeTab === 'opus' ? opusStats.avg : codexStats.avg).toFixed(2)}x</div>
              <div className="text-xs text-gray-500">Average</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${activeTab === 'opus' ? 'text-[#f0b866]' : 'text-[#66b8f0]'}`}>
                {(activeTab === 'opus' ? opusStats.best : codexStats.best).toFixed(2)}x
              </div>
              <div className="text-xs text-gray-500">Best</div>
            </div>
          </div>

          {/* History list */}
          {(activeTab === 'opus' ? opusHistory : codexHistory).length > 0 ? (
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
          ) : (
            <div className="p-8 text-center text-gray-500">
              {loading ? 'Loading calls...' : 'No calls yet. First call coming soon!'}
            </div>
          )}
        </div>

        {/* Current Picks */}
        <div className="bg-white rounded-2xl border-4 border-[#2d5a3d] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#2d5a3d]">Recent Picks</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm text-gray-500">Live updates</span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading picks...</div>
          ) : opusPicks.length === 0 && codexPicks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No picks yet. First battle round starting soon!
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-[#8a6830]">Opus</span>
                  <span className={`text-sm font-medium ${opusAvg >= 1 ? 'text-green-600' : 'text-red-500'}`}>
                    {opusAvg.toFixed(2)}x avg
                  </span>
                </div>
                <div className="space-y-2">
                  {opusPicks.slice(0, 5).map((pick) => (
                    <div key={pick.id} className="bg-[#fffcf5] rounded-lg p-3 border border-[#f0b866]">
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
                        <span>{formatMcap(pick.entryMcap)} → {formatMcap(pick.currentMcap)}</span>
                        <span>{timeAgo(pick.calledAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-[#306088]">Codex</span>
                  <span className={`text-sm font-medium ${codexAvg >= 1 ? 'text-green-600' : 'text-red-500'}`}>
                    {codexAvg.toFixed(2)}x avg
                  </span>
                </div>
                <div className="space-y-2">
                  {codexPicks.slice(0, 5).map((pick) => (
                    <div key={pick.id} className="bg-[#f5faff] rounded-lg p-3 border border-[#66b8f0]">
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
                        <span>{formatMcap(pick.entryMcap)} → {formatMcap(pick.currentMcap)}</span>
                        <span>{timeAgo(pick.calledAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Vintage TV - Score Total */}
      <div className="fixed bottom-4 left-4 z-50">
        <div className="relative">
          <div className="bg-gradient-to-b from-[#8B4513] via-[#A0522D] to-[#654321] p-3 rounded-2xl shadow-2xl border-4 border-[#5D3A1A]">
            <div className="absolute inset-0 opacity-20 rounded-2xl" style={{
              backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)`
            }}></div>
            
            <div className="bg-[#1a1a1a] p-2 rounded-xl">
              <div className="relative bg-[#0a0a0a] rounded-lg overflow-hidden" style={{
                boxShadow: 'inset 0 0 30px rgba(0,255,0,0.1), inset 0 0 60px rgba(0,0,0,0.8)'
              }}>
                <div className="absolute inset-0 pointer-events-none opacity-10" style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.8) 2px, rgba(0,0,0,0.8) 4px)'
                }}></div>
                
                <div className="absolute inset-0 pointer-events-none" style={{
                  background: 'radial-gradient(ellipse at center, rgba(100,255,100,0.05) 0%, transparent 70%)'
                }}></div>

                <div className="px-4 py-3 min-w-[180px]">
                  <div className="text-center mb-2">
                    <span className="text-[#00ff00] font-mono text-[10px] tracking-widest opacity-80">TOTAL SCORE</span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#f0b866] font-mono text-xs font-bold">OPUS</span>
                    <span className="text-[#f0b866] font-mono text-lg font-bold tracking-wider" style={{
                      textShadow: '0 0 10px rgba(240,184,102,0.8)'
                    }}>
                      {opusStats.score.toFixed(1)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 my-1">
                    <div className="flex-1 h-px bg-[#333]"></div>
                    <span className="text-[#00ff00] font-mono text-[10px]">VS</span>
                    <div className="flex-1 h-px bg-[#333]"></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[#66b8f0] font-mono text-xs font-bold">CODEX</span>
                    <span className="text-[#66b8f0] font-mono text-lg font-bold tracking-wider" style={{
                      textShadow: '0 0 10px rgba(102,184,240,0.8)'
                    }}>
                      {codexStats.score.toFixed(1)}
                    </span>
                  </div>

                  <div className="mt-2 text-center">
                    <span className={`font-mono text-[10px] tracking-wider ${opusStats.score > codexStats.score ? 'text-[#f0b866]' : 'text-[#66b8f0]'}`} style={{
                      textShadow: opusStats.score > codexStats.score ? '0 0 8px rgba(240,184,102,0.6)' : '0 0 8px rgba(102,184,240,0.6)'
                    }}>
                      {opusStats.score > codexStats.score ? '▲ OPUS LEADS' : codexStats.score > opusStats.score ? '▲ CODEX LEADS' : 'TIED'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-3 mt-2">
              <div className="w-4 h-4 rounded-full bg-gradient-to-b from-[#444] to-[#222] border border-[#555]"></div>
              <div className="w-4 h-4 rounded-full bg-gradient-to-b from-[#444] to-[#222] border border-[#555]"></div>
            </div>
          </div>
          
          <div className="flex justify-center gap-16 -mt-1">
            <div className="w-3 h-4 bg-gradient-to-b from-[#654321] to-[#3d2817] rounded-b-sm"></div>
            <div className="w-3 h-4 bg-gradient-to-b from-[#654321] to-[#3d2817] rounded-b-sm"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
