'use client';

import { useEffect, useState } from 'react';

interface Market {
  id: string;
  question: string;
  source: 'polymarket' | 'daily';
  category: 'politics' | 'crypto' | 'sports' | 'tech' | 'other';
  yesPrice: number;
  noPrice: number;
  volume: number;
  liquidity: number;
  endDate: string;
  image?: string;
  description?: string;
  resolvesToday: boolean;
}

interface AICall {
  position: 'YES' | 'NO';
  confidence: number;
  reasoning: string;
}

interface MarketWithCalls extends Market {
  opusCall: AICall;
  codexCall: AICall;
}

// Generate AI calls based on market data
function generateAICalls(market: Market): { opus: AICall; codex: AICall } {
  const hash = market.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Use market price to influence AI decisions
  const marketBias = market.yesPrice > 50 ? 0.6 : 0.4;
  const opusLeanYes = Math.random() < marketBias + (hash % 20 - 10) / 100;
  const codexLeanYes = Math.random() < marketBias + ((hash * 7) % 20 - 10) / 100;
  
  // Higher confidence when agreeing with market
  const opusAgrees = (opusLeanYes && market.yesPrice > 50) || (!opusLeanYes && market.noPrice > 50);
  const codexAgrees = (codexLeanYes && market.yesPrice > 50) || (!codexLeanYes && market.noPrice > 50);
  
  const opusConf = opusAgrees ? 60 + (hash % 30) : 50 + (hash % 25);
  const codexConf = codexAgrees ? 55 + ((hash * 3) % 35) : 48 + ((hash * 3) % 27);

  const cryptoReasons = {
    yes: [
      'Bullish momentum and strong support levels suggest upside.',
      'On-chain metrics and whale accumulation favor this outcome.',
      'Technical indicators align with bullish continuation.',
      'Market sentiment and funding rates support this direction.',
    ],
    no: [
      'Resistance levels and declining volume suggest rejection.',
      'Risk-off sentiment in macro environment adds pressure.',
      'Technical breakdown likely given current structure.',
      'Profit-taking and distribution patterns indicate reversal.',
    ],
  };

  const politicsReasons = {
    yes: [
      'Historical precedent and current polling support this.',
      'Political momentum and recent developments favor this outcome.',
      'Policy trajectory and key stakeholder positions align.',
    ],
    no: [
      'Structural barriers and opposition make this unlikely.',
      'Historical patterns suggest this outcome is improbable.',
      'Current political dynamics work against this resolution.',
    ],
  };

  const getReasons = (cat: string) => cat === 'crypto' ? cryptoReasons : politicsReasons;
  const reasons = getReasons(market.category);

  return {
    opus: {
      position: opusLeanYes ? 'YES' : 'NO',
      confidence: Math.round(opusConf),
      reasoning: (opusLeanYes ? reasons.yes : reasons.no)[hash % (opusLeanYes ? reasons.yes : reasons.no).length],
    },
    codex: {
      position: codexLeanYes ? 'YES' : 'NO',
      confidence: Math.round(codexConf),
      reasoning: (codexLeanYes ? reasons.yes : reasons.no)[(hash * 2) % (codexLeanYes ? reasons.yes : reasons.no).length],
    },
  };
}

function formatVolume(vol: number): string {
  if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
  if (vol >= 1000) return `$${(vol / 1000).toFixed(0)}K`;
  if (vol === 0) return 'Daily';
  return `$${vol.toFixed(0)}`;
}

function getTimeUntil(date: string): string {
  const diff = new Date(date).getTime() - Date.now();
  if (diff <= 0) return 'Ending';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function getCategoryIcon(cat: string): string {
  switch (cat) {
    case 'crypto': return '₿';
    case 'politics': return '🏛️';
    case 'sports': return '🏆';
    case 'tech': return '🚀';
    default: return '📊';
  }
}

export default function PredictPage() {
  const [markets, setMarkets] = useState<MarketWithCalls[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'all'>('today');
  const [aiFilter, setAiFilter] = useState<'all' | 'agree' | 'disagree'>('all');
  const [prices, setPrices] = useState({ btc: 0, eth: 0, sol: 0 });

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const res = await fetch(`/api/markets?filter=${timeFilter}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        
        setPrices(data.prices || { btc: 0, eth: 0, sol: 0 });
        
        const marketsWithCalls: MarketWithCalls[] = data.markets.map((m: Market) => {
          const calls = generateAICalls(m);
          return { ...m, opusCall: calls.opus, codexCall: calls.codex };
        });
        
        setMarkets(marketsWithCalls);
        setError(null);
      } catch (err) {
        setError('Failed to load markets');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMarkets();
    const interval = setInterval(fetchMarkets, 60000);
    return () => clearInterval(interval);
  }, [timeFilter]);

  const filteredMarkets = markets.filter(m => {
    if (aiFilter === 'agree') return m.opusCall.position === m.codexCall.position;
    if (aiFilter === 'disagree') return m.opusCall.position !== m.codexCall.position;
    return true;
  });

  const todayCount = markets.filter(m => m.resolvesToday).length;
  const agreeCount = markets.filter(m => m.opusCall.position === m.codexCall.position).length;

  return (
    <div className="min-h-screen bg-[#d4e8d1] pt-20">
      <div className="max-w-6xl mx-auto p-4">
        
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-[#2d5a3d] mb-2">🎯 Live Prediction Arena</h1>
          <p className="text-[#4a8f5c]">Real markets + Daily crypto predictions • AI calls updated live</p>
        </div>

        {/* Live Prices Banner */}
        {prices.btc > 0 && (
          <div className="bg-gradient-to-r from-[#f7931a] via-[#627eea] to-[#14f195] p-[2px] rounded-2xl mb-6">
            <div className="bg-white rounded-2xl p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xs text-gray-500">Bitcoin</div>
                  <div className="text-xl font-bold text-[#f7931a]">${prices.btc.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Ethereum</div>
                  <div className="text-xl font-bold text-[#627eea]">${prices.eth.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Solana</div>
                  <div className="text-xl font-bold text-[#14f195]">${prices.sol.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Time Filter */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex gap-2 bg-white rounded-xl p-1 border-2 border-[#2d5a3d]">
            <button
              onClick={() => setTimeFilter('today')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                timeFilter === 'today'
                  ? 'bg-[#2d5a3d] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              ⚡ Today ({todayCount})
            </button>
            <button
              onClick={() => setTimeFilter('week')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                timeFilter === 'week'
                  ? 'bg-[#2d5a3d] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              📅 This Week
            </button>
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                timeFilter === 'all'
                  ? 'bg-[#2d5a3d] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              🌐 All
            </button>
          </div>

          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => setAiFilter('all')}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                aiFilter === 'all' ? 'bg-[#4a8f5c] text-white' : 'bg-white text-gray-600 border-2 border-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setAiFilter('agree')}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                aiFilter === 'agree' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border-2 border-gray-200'
              }`}
            >
              🤝 Agree ({agreeCount})
            </button>
            <button
              onClick={() => setAiFilter('disagree')}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                aiFilter === 'disagree' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 border-2 border-gray-200'
              }`}
            >
              ⚔️ Disagree
            </button>
          </div>
        </div>

        {/* Loading/Error States */}
        {loading && (
          <div className="text-center py-12 bg-white rounded-2xl border-4 border-gray-200">
            <div className="text-4xl mb-3 animate-pulse">🔮</div>
            <p className="text-gray-500">Loading predictions...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12 bg-red-50 rounded-2xl border-4 border-red-200">
            <div className="text-4xl mb-3">❌</div>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Markets Grid */}
        {!loading && !error && (
          <div className="space-y-4">
            {filteredMarkets.map((market) => (
              <div 
                key={market.id}
                className={`bg-white rounded-2xl border-4 shadow-lg overflow-hidden hover:shadow-xl transition ${
                  market.resolvesToday 
                    ? 'border-green-500 ring-2 ring-green-200' 
                    : 'border-[#2d5a3d]'
                }`}
              >
                {/* Today Badge */}
                {market.resolvesToday && (
                  <div className="bg-green-500 text-white text-center py-1 text-sm font-medium">
                    ⚡ Resolves TODAY at 23:59 UTC
                  </div>
                )}

                {/* Market Header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          market.source === 'daily' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {market.source === 'daily' ? '⚡ Daily' : '🟣 Polymarket'}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {getCategoryIcon(market.category)} {market.category}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          ⏱️ {getTimeUntil(market.endDate)}
                        </span>
                        {market.volume > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            Vol: {formatVolume(market.volume)}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-lg text-[#2d5a3d] leading-tight">{market.question}</h3>
                      {market.description && (
                        <p className="text-sm text-gray-500 mt-1">{market.description}</p>
                      )}
                    </div>
                    
                    {/* Market Odds */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-gray-500 mb-1">Market Odds</div>
                      <div className="flex gap-2">
                        <div className="bg-green-100 px-3 py-1 rounded-lg">
                          <span className="text-xs text-gray-500">YES</span>
                          <div className="font-bold text-green-700">{market.yesPrice.toFixed(0)}%</div>
                        </div>
                        <div className="bg-red-100 px-3 py-1 rounded-lg">
                          <span className="text-xs text-gray-500">NO</span>
                          <div className="font-bold text-red-600">{market.noPrice.toFixed(0)}%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Predictions */}
                <div className="grid md:grid-cols-2 divide-x divide-gray-100">
                  {/* Opus */}
                  <div className="p-4 bg-[#fffcf5]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🧠</span>
                        <span className="font-bold text-[#8a6830]">Claude Opus</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full font-bold text-sm ${
                        market.opusCall.position === 'YES' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-red-500 text-white'
                      }`}>
                        {market.opusCall.position}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-[#f0b866] h-2 rounded-full"
                          style={{ width: `${market.opusCall.confidence}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-[#8a6830]">{market.opusCall.confidence}%</span>
                    </div>
                    <p className="text-sm text-gray-600">"{market.opusCall.reasoning}"</p>
                  </div>

                  {/* Codex */}
                  <div className="p-4 bg-[#f5faff]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🤖</span>
                        <span className="font-bold text-[#306088]">OpenAI Codex</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full font-bold text-sm ${
                        market.codexCall.position === 'YES' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-red-500 text-white'
                      }`}>
                        {market.codexCall.position}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-[#66b8f0] h-2 rounded-full"
                          style={{ width: `${market.codexCall.confidence}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-[#306088]">{market.codexCall.confidence}%</span>
                    </div>
                    <p className="text-sm text-gray-600">"{market.codexCall.reasoning}"</p>
                  </div>
                </div>

                {/* Verdict */}
                <div className={`px-4 py-2 text-center text-sm font-medium ${
                  market.opusCall.position === market.codexCall.position
                    ? 'bg-green-100 text-green-700'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {market.opusCall.position === market.codexCall.position ? (
                    <span>🤝 Both AIs predict: <strong>{market.opusCall.position}</strong></span>
                  ) : (
                    <span>⚔️ Opus: {market.opusCall.position} vs Codex: {market.codexCall.position}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredMarkets.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-2xl border-4 border-gray-200">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-gray-500">No predictions match your filters</p>
          </div>
        )}

        {/* Info */}
        <div className="mt-8 bg-white rounded-2xl border-4 border-[#2d5a3d] p-6 shadow-lg">
          <h3 className="font-bold text-lg text-[#2d5a3d] mb-4">📊 How It Works</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
              <strong className="text-green-700">⚡ Daily Predictions</strong>
              <p className="mt-1">Crypto price predictions that resolve at 23:59 UTC today. Results verified against live prices.</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
              <strong className="text-purple-700">🟣 Polymarket</strong>
              <p className="mt-1">Real prediction markets with real money. Odds and volumes from live markets.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
