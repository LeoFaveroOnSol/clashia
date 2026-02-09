'use client';

import { useEffect, useState } from 'react';

interface PredictionMarket {
  id: string;
  question: string;
  source: 'polymarket' | 'kalshi';
  category: string;
  currentOdds: number; // market odds in %
  resolutionDate: string;
  resolved: boolean;
  outcome?: boolean; // true = YES won, false = NO won
  opusCall: {
    position: 'YES' | 'NO';
    confidence: number;
    reasoning: string;
    calledAt: string;
    calledOdds: number;
  };
  codexCall: {
    position: 'YES' | 'NO';
    confidence: number;
    reasoning: string;
    calledAt: string;
    calledOdds: number;
  };
}

interface AIStats {
  correct: number;
  total: number;
  winRate: number;
  avgConfidence: number;
  bestCall: string;
}

// Mock data - replace with real API
const mockMarkets: PredictionMarket[] = [
  {
    id: '1',
    question: 'Will Bitcoin hit $150k before July 2026?',
    source: 'polymarket',
    category: 'Crypto',
    currentOdds: 42,
    resolutionDate: '2026-07-01',
    resolved: false,
    opusCall: {
      position: 'YES',
      confidence: 72,
      reasoning: 'ETF inflows + halving cycle suggests continued bull run. Historical patterns support new ATH.',
      calledAt: '2026-02-08T10:00:00Z',
      calledOdds: 38,
    },
    codexCall: {
      position: 'NO',
      confidence: 65,
      reasoning: 'Macro headwinds and regulatory pressure likely to cap upside. $120k more realistic ceiling.',
      calledAt: '2026-02-08T10:05:00Z',
      calledOdds: 38,
    },
  },
  {
    id: '2',
    question: 'Fed cuts rates by 50bps+ in March 2026?',
    source: 'kalshi',
    category: 'Economics',
    currentOdds: 28,
    resolutionDate: '2026-03-20',
    resolved: false,
    opusCall: {
      position: 'NO',
      confidence: 85,
      reasoning: 'Inflation still above target. Fed will maintain hawkish stance, 25bps max.',
      calledAt: '2026-02-07T14:00:00Z',
      calledOdds: 31,
    },
    codexCall: {
      position: 'NO',
      confidence: 78,
      reasoning: 'Economic data doesn\'t support aggressive cuts. Market pricing in too much dovishness.',
      calledAt: '2026-02-07T14:02:00Z',
      calledOdds: 31,
    },
  },
  {
    id: '3',
    question: 'Solana flips Ethereum market cap in 2026?',
    source: 'polymarket',
    category: 'Crypto',
    currentOdds: 15,
    resolutionDate: '2026-12-31',
    resolved: false,
    opusCall: {
      position: 'NO',
      confidence: 90,
      reasoning: 'ETH has too much institutional backing and DeFi TVL. SOL would need 10x while ETH stagnates.',
      calledAt: '2026-02-06T09:00:00Z',
      calledOdds: 18,
    },
    codexCall: {
      position: 'YES',
      confidence: 35,
      reasoning: 'Contrarian take: SOL momentum + retail adoption could surprise. Low odds = high EV if right.',
      calledAt: '2026-02-06T09:03:00Z',
      calledOdds: 18,
    },
  },
  {
    id: '4',
    question: 'AI model beats human at StarCraft 3 by June?',
    source: 'kalshi',
    category: 'Tech',
    currentOdds: 67,
    resolutionDate: '2026-06-30',
    resolved: true,
    outcome: true,
    opusCall: {
      position: 'YES',
      confidence: 82,
      reasoning: 'DeepMind already did SC2. New architectures + more compute = inevitable.',
      calledAt: '2026-01-15T12:00:00Z',
      calledOdds: 55,
    },
    codexCall: {
      position: 'YES',
      confidence: 75,
      reasoning: 'SC3 complexity higher but AI progress exponential. Likely by Q2.',
      calledAt: '2026-01-15T12:01:00Z',
      calledOdds: 55,
    },
  },
  {
    id: '5',
    question: 'SpaceX Starship reaches orbit by April 2026?',
    source: 'polymarket',
    category: 'Tech',
    currentOdds: 78,
    resolutionDate: '2026-04-30',
    resolved: true,
    outcome: true,
    opusCall: {
      position: 'YES',
      confidence: 70,
      reasoning: 'Recent test progress promising. Musk timeline usually 2x but orbit achievable.',
      calledAt: '2026-01-20T08:00:00Z',
      calledOdds: 62,
    },
    codexCall: {
      position: 'NO',
      confidence: 55,
      reasoning: 'FAA delays + technical challenges. May slip to Q3.',
      calledAt: '2026-01-20T08:02:00Z',
      calledOdds: 62,
    },
  },
];

function calculateStats(markets: PredictionMarket[], ai: 'opus' | 'codex'): AIStats {
  const resolved = markets.filter(m => m.resolved);
  let correct = 0;
  let totalConfidence = 0;

  resolved.forEach(m => {
    const call = ai === 'opus' ? m.opusCall : m.codexCall;
    const wasCorrect = (call.position === 'YES' && m.outcome) || (call.position === 'NO' && !m.outcome);
    if (wasCorrect) correct++;
    totalConfidence += call.confidence;
  });

  const allCalls = markets.map(m => ai === 'opus' ? m.opusCall : m.codexCall);
  const avgConf = allCalls.reduce((sum, c) => sum + c.confidence, 0) / allCalls.length;

  return {
    correct,
    total: resolved.length,
    winRate: resolved.length > 0 ? (correct / resolved.length) * 100 : 0,
    avgConfidence: avgConf,
    bestCall: 'BTC $150k prediction',
  };
}

export default function PredictPage() {
  const [markets, setMarkets] = useState<PredictionMarket[]>(mockMarkets);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const opusStats = calculateStats(markets, 'opus');
  const codexStats = calculateStats(markets, 'codex');

  const categories = ['all', ...new Set(markets.map(m => m.category))];
  
  const filteredMarkets = markets.filter(m => {
    if (filter === 'active' && m.resolved) return false;
    if (filter === 'resolved' && !m.resolved) return false;
    if (categoryFilter !== 'all' && m.category !== categoryFilter) return false;
    return true;
  });

  const getResultBadge = (market: PredictionMarket, ai: 'opus' | 'codex') => {
    if (!market.resolved) return null;
    const call = ai === 'opus' ? market.opusCall : market.codexCall;
    const wasCorrect = (call.position === 'YES' && market.outcome) || (call.position === 'NO' && !market.outcome);
    return wasCorrect ? (
      <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">✓ Correct</span>
    ) : (
      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">✗ Wrong</span>
    );
  };

  return (
    <div className="min-h-screen bg-[#d4e8d1] pt-20">
      <div className="max-w-6xl mx-auto p-4">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#2d5a3d] mb-2">🎯 Prediction Markets Arena</h1>
          <p className="text-[#4a8f5c]">AI vs AI on real prediction markets (Polymarket, Kalshi)</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Opus Stats */}
          <div className="bg-gradient-to-br from-[#fff8e8] to-[#fff0d0] rounded-2xl border-4 border-[#f0b866] p-6 shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-[#f0b866] rounded-xl flex items-center justify-center text-3xl">
                🧠
              </div>
              <div>
                <h3 className="font-bold text-xl text-[#8a6830]">Claude Opus</h3>
                <p className="text-sm text-[#b89860]">Deep reasoning & analysis</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/60 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-[#2d5a3d]">{opusStats.correct}/{opusStats.total}</div>
                <div className="text-xs text-gray-500">Correct</div>
              </div>
              <div className="bg-white/60 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-[#2d5a3d]">{opusStats.winRate.toFixed(0)}%</div>
                <div className="text-xs text-gray-500">Win Rate</div>
              </div>
              <div className="bg-white/60 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-[#2d5a3d]">{opusStats.avgConfidence.toFixed(0)}%</div>
                <div className="text-xs text-gray-500">Avg Conf</div>
              </div>
            </div>
          </div>

          {/* Codex Stats */}
          <div className="bg-gradient-to-br from-[#e8f4ff] to-[#d0e8ff] rounded-2xl border-4 border-[#66b8f0] p-6 shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-[#66b8f0] rounded-xl flex items-center justify-center text-3xl">
                🤖
              </div>
              <div>
                <h3 className="font-bold text-xl text-[#306088]">OpenAI Codex</h3>
                <p className="text-sm text-[#6098b8]">Pattern recognition & data</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/60 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-[#2d5a3d]">{codexStats.correct}/{codexStats.total}</div>
                <div className="text-xs text-gray-500">Correct</div>
              </div>
              <div className="bg-white/60 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-[#2d5a3d]">{codexStats.winRate.toFixed(0)}%</div>
                <div className="text-xs text-gray-500">Win Rate</div>
              </div>
              <div className="bg-white/60 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-[#2d5a3d]">{codexStats.avgConfidence.toFixed(0)}%</div>
                <div className="text-xs text-gray-500">Avg Conf</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex gap-2">
            {['all', 'active', 'resolved'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-xl font-medium transition ${
                  filter === f
                    ? 'bg-[#2d5a3d] text-white'
                    : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-[#4a8f5c]'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex gap-2 ml-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                  categoryFilter === cat
                    ? 'bg-[#4a8f5c] text-white'
                    : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-[#4a8f5c]'
                }`}
              >
                {cat === 'all' ? '🌐 All' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Markets List */}
        <div className="space-y-4">
          {filteredMarkets.map((market) => (
            <div 
              key={market.id}
              className={`bg-white rounded-2xl border-4 shadow-lg overflow-hidden ${
                market.resolved ? 'border-gray-300' : 'border-[#2d5a3d]'
              }`}
            >
              {/* Market Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        market.source === 'polymarket' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {market.source === 'polymarket' ? '🟣 Polymarket' : '🔵 Kalshi'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {market.category}
                      </span>
                      {market.resolved && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          market.outcome ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          Resolved: {market.outcome ? 'YES ✓' : 'NO ✗'}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-lg text-[#2d5a3d]">{market.question}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Market Odds</div>
                    <div className="text-2xl font-bold text-[#2d5a3d]">{market.currentOdds}%</div>
                    <div className="text-xs text-gray-400">
                      {market.resolved ? 'Final' : `Resolves ${new Date(market.resolutionDate).toLocaleDateString()}`}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Calls */}
              <div className="grid md:grid-cols-2 divide-x divide-gray-100">
                {/* Opus Call */}
                <div className="p-4 bg-[#fffcf5]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🧠</span>
                      <span className="font-bold text-[#8a6830]">Opus</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getResultBadge(market, 'opus')}
                      <span className={`font-bold text-lg ${
                        market.opusCall.position === 'YES' ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {market.opusCall.position}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/80 rounded-lg p-3 mb-2">
                    <p className="text-sm text-gray-600">"{market.opusCall.reasoning}"</p>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Confidence: <strong>{market.opusCall.confidence}%</strong></span>
                    <span>Called at {market.opusCall.calledOdds}% odds</span>
                  </div>
                </div>

                {/* Codex Call */}
                <div className="p-4 bg-[#f5faff]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🤖</span>
                      <span className="font-bold text-[#306088]">Codex</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getResultBadge(market, 'codex')}
                      <span className={`font-bold text-lg ${
                        market.codexCall.position === 'YES' ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {market.codexCall.position}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/80 rounded-lg p-3 mb-2">
                    <p className="text-sm text-gray-600">"{market.codexCall.reasoning}"</p>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Confidence: <strong>{market.codexCall.confidence}%</strong></span>
                    <span>Called at {market.codexCall.calledOdds}% odds</span>
                  </div>
                </div>
              </div>

              {/* Agreement/Disagreement Badge */}
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-center">
                {market.opusCall.position === market.codexCall.position ? (
                  <span className="text-sm text-green-600 font-medium">
                    🤝 Both AIs agree: {market.opusCall.position}
                  </span>
                ) : (
                  <span className="text-sm text-orange-600 font-medium">
                    ⚔️ AIs disagree! Opus: {market.opusCall.position} vs Codex: {market.codexCall.position}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredMarkets.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No markets match your filters
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 bg-white rounded-2xl border-4 border-[#2d5a3d] p-6 shadow-lg">
          <h3 className="font-bold text-lg text-[#2d5a3d] mb-4">📊 How It Works</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="bg-[#f0f7f1] rounded-xl p-4">
              <div className="text-2xl mb-2">1️⃣</div>
              <p>We feed both AIs the same prediction market questions from Polymarket & Kalshi</p>
            </div>
            <div className="bg-[#f0f7f1] rounded-xl p-4">
              <div className="text-2xl mb-2">2️⃣</div>
              <p>Each AI gives their YES/NO call with confidence level and reasoning</p>
            </div>
            <div className="bg-[#f0f7f1] rounded-xl p-4">
              <div className="text-2xl mb-2">3️⃣</div>
              <p>When markets resolve, we track which AI was right and update their stats</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
