'use client';

import { useEffect, useState } from 'react';

interface DailyPrediction {
  id: string;
  question: string;
  category: 'crypto' | 'sports' | 'markets' | 'other';
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  resolvesAt: string; // ISO datetime
  resolved: boolean;
  outcome?: boolean;
  opusCall: {
    position: 'YES' | 'NO';
    confidence: number;
    reasoning: string;
  };
  codexCall: {
    position: 'YES' | 'NO';
    confidence: number;
    reasoning: string;
  };
}

function getTimeUntil(date: string): string {
  const diff = new Date(date).getTime() - Date.now();
  if (diff <= 0) return 'Resolving...';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatValue(value: number, unit?: string): string {
  if (unit === '$') return `$${value.toLocaleString()}`;
  if (unit === '%') return `${value}%`;
  return value.toLocaleString();
}

// Get today's date string
const today = new Date().toISOString().split('T')[0];
const endOfDay = `${today}T23:59:59Z`;

// Mock daily predictions - these would come from an API
const generateDailyPredictions = (): DailyPrediction[] => [
  {
    id: 'btc-daily',
    question: 'Bitcoin closes above $97,000 today?',
    category: 'crypto',
    targetValue: 97000,
    currentValue: 96450,
    unit: '$',
    resolvesAt: endOfDay,
    resolved: false,
    opusCall: {
      position: 'YES',
      confidence: 68,
      reasoning: 'Bullish momentum from Asia session. Support at $96k holding strong. Expect push to $97.5k.',
    },
    codexCall: {
      position: 'NO',
      confidence: 55,
      reasoning: 'Resistance at $97k tested 3x this week. Volume declining. Likely rejection.',
    },
  },
  {
    id: 'sol-daily',
    question: 'Solana stays above $190 at close?',
    category: 'crypto',
    targetValue: 190,
    currentValue: 193.5,
    unit: '$',
    resolvesAt: endOfDay,
    resolved: false,
    opusCall: {
      position: 'YES',
      confidence: 75,
      reasoning: 'Strong DEX volume. Memecoin activity keeping demand high. $190 is solid support.',
    },
    codexCall: {
      position: 'YES',
      confidence: 82,
      reasoning: 'Currently $3.50 above target with stable price action. High probability hold.',
    },
  },
  {
    id: 'eth-btc',
    question: 'ETH/BTC ratio increases today?',
    category: 'crypto',
    targetValue: 0.0342,
    currentValue: 0.0338,
    resolvesAt: endOfDay,
    resolved: false,
    opusCall: {
      position: 'NO',
      confidence: 70,
      reasoning: 'BTC dominance trending up. ETH underperforming in current cycle. Ratio likely flat or down.',
    },
    codexCall: {
      position: 'YES',
      confidence: 45,
      reasoning: 'Oversold on daily. Mean reversion play. Small bounce possible.',
    },
  },
  {
    id: 'sp500-daily',
    question: 'S&P 500 closes green today?',
    category: 'markets',
    currentValue: 0.15,
    unit: '%',
    resolvesAt: endOfDay,
    resolved: false,
    opusCall: {
      position: 'YES',
      confidence: 62,
      reasoning: 'Futures up pre-market. No major economic data today. Path of least resistance is up.',
    },
    codexCall: {
      position: 'YES',
      confidence: 58,
      reasoning: 'Positive sentiment from tech earnings. Likely modest gains.',
    },
  },
  {
    id: 'nba-lakers',
    question: 'Lakers beat Celtics tonight?',
    category: 'sports',
    resolvesAt: `${today}T03:30:00Z`, // Game time
    resolved: false,
    opusCall: {
      position: 'NO',
      confidence: 72,
      reasoning: 'Celtics home court + better record. Lakers missing key rotation player. Celtics -5.5 spread.',
    },
    codexCall: {
      position: 'NO',
      confidence: 78,
      reasoning: 'Historical H2H favors Celtics. Lakers 2-8 in last 10 road games vs top teams.',
    },
  },
  {
    id: 'gas-eth',
    question: 'ETH gas stays below 20 gwei average?',
    category: 'crypto',
    targetValue: 20,
    currentValue: 15,
    unit: 'gwei',
    resolvesAt: endOfDay,
    resolved: false,
    opusCall: {
      position: 'YES',
      confidence: 80,
      reasoning: 'L2 adoption reducing mainnet congestion. No major mints scheduled. Should stay low.',
    },
    codexCall: {
      position: 'YES',
      confidence: 85,
      reasoning: 'Current average well below target. No catalysts for spike. Easy YES.',
    },
  },
  // Yesterday's resolved predictions
  {
    id: 'btc-yesterday',
    question: 'Bitcoin closed above $96,000 yesterday?',
    category: 'crypto',
    targetValue: 96000,
    currentValue: 96780,
    unit: '$',
    resolvesAt: new Date(Date.now() - 86400000).toISOString(),
    resolved: true,
    outcome: true,
    opusCall: {
      position: 'YES',
      confidence: 71,
      reasoning: 'Held support, expected close above target.',
    },
    codexCall: {
      position: 'YES',
      confidence: 65,
      reasoning: 'Trend continuation likely.',
    },
  },
  {
    id: 'spy-yesterday',
    question: 'S&P 500 closed red yesterday?',
    category: 'markets',
    resolvesAt: new Date(Date.now() - 86400000).toISOString(),
    resolved: true,
    outcome: false, // It closed green
    opusCall: {
      position: 'YES',
      confidence: 55,
      reasoning: 'Overbought conditions suggested pullback.',
    },
    codexCall: {
      position: 'NO',
      confidence: 60,
      reasoning: 'Momentum too strong for red day.',
    },
  },
];

export default function PredictPage() {
  const [predictions, setPredictions] = useState<DailyPrediction[]>([]);
  const [filter, setFilter] = useState<'today' | 'resolved'>('today');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [timeNow, setTimeNow] = useState(new Date());

  useEffect(() => {
    setPredictions(generateDailyPredictions());
    const interval = setInterval(() => setTimeNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const todayPredictions = predictions.filter(p => !p.resolved);
  const resolvedPredictions = predictions.filter(p => p.resolved);
  const displayPredictions = filter === 'today' ? todayPredictions : resolvedPredictions;

  const filteredPredictions = displayPredictions.filter(p => 
    categoryFilter === 'all' || p.category === categoryFilter
  );

  // Calculate stats
  const calculateStats = (ai: 'opus' | 'codex') => {
    const resolved = predictions.filter(p => p.resolved);
    let correct = 0;
    resolved.forEach(p => {
      const call = ai === 'opus' ? p.opusCall : p.codexCall;
      const wasCorrect = (call.position === 'YES' && p.outcome) || (call.position === 'NO' && !p.outcome);
      if (wasCorrect) correct++;
    });
    return { correct, total: resolved.length, rate: resolved.length > 0 ? (correct / resolved.length * 100) : 0 };
  };

  const opusStats = calculateStats('opus');
  const codexStats = calculateStats('codex');

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'crypto': return '₿';
      case 'sports': return '🏀';
      case 'markets': return '📈';
      default: return '🎯';
    }
  };

  const getResultBadge = (pred: DailyPrediction, ai: 'opus' | 'codex') => {
    if (!pred.resolved) return null;
    const call = ai === 'opus' ? pred.opusCall : pred.codexCall;
    const wasCorrect = (call.position === 'YES' && pred.outcome) || (call.position === 'NO' && !pred.outcome);
    return wasCorrect ? '✅' : '❌';
  };

  return (
    <div className="min-h-screen bg-[#d4e8d1] pt-20">
      <div className="max-w-6xl mx-auto p-4">
        
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-[#2d5a3d] mb-2">🎯 Daily Predictions</h1>
          <p className="text-[#4a8f5c]">AI calls that resolve TODAY — see results in real-time</p>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {timeNow.toLocaleTimeString()} • Resolves at 23:59 UTC
          </p>
        </div>

        {/* Live Stats Banner */}
        <div className="bg-white rounded-2xl border-4 border-[#2d5a3d] p-4 mb-6 shadow-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-sm text-gray-500">Today's Predictions</div>
              <div className="text-2xl font-bold text-[#2d5a3d]">{todayPredictions.length}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">🧠 Opus Record</div>
              <div className="text-2xl font-bold text-[#f0b866]">{opusStats.correct}/{opusStats.total}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">🤖 Codex Record</div>
              <div className="text-2xl font-bold text-[#66b8f0]">{codexStats.correct}/{codexStats.total}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Leader</div>
              <div className="text-2xl font-bold text-[#2d5a3d]">
                {opusStats.rate > codexStats.rate ? '🧠 Opus' : opusStats.rate < codexStats.rate ? '🤖 Codex' : '🤝 Tied'}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('today')}
              className={`px-5 py-2 rounded-xl font-medium transition flex items-center gap-2 ${
                filter === 'today'
                  ? 'bg-[#2d5a3d] text-white'
                  : 'bg-white text-gray-600 border-2 border-gray-200'
              }`}
            >
              ⚡ Today's Calls
            </button>
            <button
              onClick={() => setFilter('resolved')}
              className={`px-5 py-2 rounded-xl font-medium transition flex items-center gap-2 ${
                filter === 'resolved'
                  ? 'bg-[#2d5a3d] text-white'
                  : 'bg-white text-gray-600 border-2 border-gray-200'
              }`}
            >
              ✅ Resolved
            </button>
          </div>
          
          <div className="flex gap-2 ml-auto">
            {['all', 'crypto', 'sports', 'markets'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                  categoryFilter === cat
                    ? 'bg-[#4a8f5c] text-white'
                    : 'bg-white text-gray-600 border-2 border-gray-200'
                }`}
              >
                {cat === 'all' ? '🌐 All' : `${getCategoryIcon(cat)} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`}
              </button>
            ))}
          </div>
        </div>

        {/* Predictions Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {filteredPredictions.map((pred) => (
            <div 
              key={pred.id}
              className={`bg-white rounded-2xl border-4 shadow-lg overflow-hidden ${
                pred.resolved 
                  ? 'border-gray-300 opacity-90' 
                  : 'border-[#2d5a3d]'
              }`}
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{getCategoryIcon(pred.category)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    pred.category === 'crypto' ? 'bg-orange-100 text-orange-700' :
                    pred.category === 'sports' ? 'bg-green-100 text-green-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {pred.category.toUpperCase()}
                  </span>
                  {!pred.resolved && (
                    <span className="ml-auto text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full animate-pulse">
                      ⏱️ {getTimeUntil(pred.resolvesAt)}
                    </span>
                  )}
                  {pred.resolved && (
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                      pred.outcome ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      Result: {pred.outcome ? 'YES ✓' : 'NO ✗'}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-[#2d5a3d]">{pred.question}</h3>
                
                {/* Current Value Display */}
                {pred.currentValue !== undefined && pred.targetValue !== undefined && (
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          pred.currentValue >= pred.targetValue ? 'bg-green-500' : 'bg-orange-400'
                        }`}
                        style={{ 
                          width: `${Math.min(100, (pred.currentValue / pred.targetValue) * 100)}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-mono">
                      <span className={pred.currentValue >= pred.targetValue ? 'text-green-600' : 'text-orange-500'}>
                        {formatValue(pred.currentValue, pred.unit)}
                      </span>
                      <span className="text-gray-400"> / {formatValue(pred.targetValue, pred.unit)}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* AI Calls Side by Side */}
              <div className="grid grid-cols-2 divide-x divide-gray-100">
                {/* Opus */}
                <div className="p-3 bg-[#fffcf5]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-[#8a6830]">🧠 Opus</span>
                    <div className="flex items-center gap-1">
                      {getResultBadge(pred, 'opus')}
                      <span className={`font-bold ${
                        pred.opusCall.position === 'YES' ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {pred.opusCall.position}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mb-1">{pred.opusCall.confidence}% confident</div>
                  <p className="text-xs text-gray-600 line-clamp-2">"{pred.opusCall.reasoning}"</p>
                </div>

                {/* Codex */}
                <div className="p-3 bg-[#f5faff]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-[#306088]">🤖 Codex</span>
                    <div className="flex items-center gap-1">
                      {getResultBadge(pred, 'codex')}
                      <span className={`font-bold ${
                        pred.codexCall.position === 'YES' ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {pred.codexCall.position}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mb-1">{pred.codexCall.confidence}% confident</div>
                  <p className="text-xs text-gray-600 line-clamp-2">"{pred.codexCall.reasoning}"</p>
                </div>
              </div>

              {/* Agreement Footer */}
              <div className="px-3 py-2 bg-gray-50 text-center text-xs">
                {pred.opusCall.position === pred.codexCall.position ? (
                  <span className="text-green-600">🤝 Both say {pred.opusCall.position}</span>
                ) : (
                  <span className="text-orange-600">⚔️ Disagree!</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredPredictions.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border-4 border-gray-200">
            <div className="text-4xl mb-3">🔮</div>
            <p className="text-gray-500">No predictions in this category</p>
          </div>
        )}

        {/* How It Works */}
        <div className="mt-8 bg-white rounded-2xl border-4 border-[#2d5a3d] p-6 shadow-lg">
          <h3 className="font-bold text-lg text-[#2d5a3d] mb-4">⚡ Daily Prediction Rules</h3>
          <div className="grid md:grid-cols-4 gap-4 text-sm text-gray-600">
            <div className="bg-[#f0f7f1] rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">🌅</div>
              <p><strong>Morning:</strong> New predictions posted at 00:00 UTC</p>
            </div>
            <div className="bg-[#f0f7f1] rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">📊</div>
              <p><strong>Live:</strong> Values update every minute</p>
            </div>
            <div className="bg-[#f0f7f1] rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">🌙</div>
              <p><strong>Resolution:</strong> Markets close at 23:59 UTC</p>
            </div>
            <div className="bg-[#f0f7f1] rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">🏆</div>
              <p><strong>Results:</strong> Winners announced instantly</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
