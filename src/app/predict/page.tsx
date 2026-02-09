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

function generateAICalls(market: Market): { opus: AICall; codex: AICall } {
  const hash = market.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const marketBias = market.yesPrice > 50 ? 0.6 : 0.4;
  const opusLeanYes = Math.random() < marketBias + (hash % 20 - 10) / 100;
  const codexLeanYes = Math.random() < marketBias + ((hash * 7) % 20 - 10) / 100;
  
  const opusAgrees = (opusLeanYes && market.yesPrice > 50) || (!opusLeanYes && market.noPrice > 50);
  const codexAgrees = (codexLeanYes && market.yesPrice > 50) || (!codexLeanYes && market.noPrice > 50);
  
  const opusConf = opusAgrees ? 60 + (hash % 30) : 50 + (hash % 25);
  const codexConf = codexAgrees ? 55 + ((hash * 3) % 35) : 48 + ((hash * 3) % 27);

  const cryptoReasons = {
    yes: [
      'Strong support levels holding. Momentum favors continuation.',
      'Volume profile and order flow suggest upside.',
      'Key moving averages aligned bullish.',
      'Funding rates neutral, room for expansion.',
    ],
    no: [
      'Hitting resistance with declining volume.',
      'Macro pressure weighing on risk assets.',
      'Distribution pattern forming on higher timeframes.',
      'Sentiment overheated, mean reversion likely.',
    ],
  };

  const defaultReasons = {
    yes: [
      'Fundamentals and timing align with this outcome.',
      'Historical data supports this resolution.',
      'Key factors trending in this direction.',
    ],
    no: [
      'Structural headwinds make this unlikely.',
      'Data points against this outcome.',
      'Timing and conditions unfavorable.',
    ],
  };

  const reasons = market.category === 'crypto' ? cryptoReasons : defaultReasons;

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
  if (vol === 0) return '';
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
      <div className="max-w-5xl mx-auto p-4">
        
        {/* Header */}
        <div className="bg-[#2d5a3d] rounded-2xl p-6 mb-6 border-4 border-[#1a3d28]">
          <h1 className="text-xl font-bold text-white mb-1">Prediction Markets</h1>
          <p className="text-[#a8d4b0] text-sm">Live markets from Polymarket + daily crypto predictions</p>
          
          {/* Prices */}
          {prices.btc > 0 && (
            <div className="flex gap-6 mt-4 text-sm">
              <div>
                <span className="text-[#a8d4b0]">BTC</span>
                <span className="text-white font-mono ml-2">${prices.btc.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[#a8d4b0]">ETH</span>
                <span className="text-white font-mono ml-2">${prices.eth.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[#a8d4b0]">SOL</span>
                <span className="text-white font-mono ml-2">${prices.sol.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex gap-1 bg-white rounded-xl p-1 border-2 border-[#2d5a3d]">
            {[
              { key: 'today', label: 'Today' },
              { key: 'week', label: 'This Week' },
              { key: 'all', label: 'All' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTimeFilter(key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  timeFilter === key
                    ? 'bg-[#2d5a3d] text-white'
                    : 'text-gray-600 hover:bg-[#f0f7f1]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 ml-auto text-sm">
            <button
              onClick={() => setAiFilter('all')}
              className={`px-3 py-2 rounded-lg transition ${
                aiFilter === 'all' ? 'bg-[#2d5a3d] text-white' : 'bg-white text-gray-600 border-2 border-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setAiFilter('agree')}
              className={`px-3 py-2 rounded-lg transition ${
                aiFilter === 'agree' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border-2 border-gray-200'
              }`}
            >
              Consensus ({agreeCount})
            </button>
            <button
              onClick={() => setAiFilter('disagree')}
              className={`px-3 py-2 rounded-lg transition ${
                aiFilter === 'disagree' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 border-2 border-gray-200'
              }`}
            >
              Split
            </button>
          </div>
        </div>

        {/* Loading/Error */}
        {loading && (
          <div className="text-center py-16 bg-white rounded-2xl border-4 border-gray-200">
            <p className="text-gray-500">Loading predictions...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-16 bg-white rounded-2xl border-4 border-red-200">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Markets */}
        {!loading && !error && (
          <div className="space-y-4">
            {filteredMarkets.map((market) => (
              <div 
                key={market.id}
                className={`bg-white rounded-2xl border-4 overflow-hidden ${
                  market.resolvesToday 
                    ? 'border-green-500' 
                    : 'border-[#2d5a3d]'
                }`}
              >
                {/* Today indicator */}
                {market.resolvesToday && (
                  <div className="bg-green-500 text-white text-xs px-4 py-1.5 text-center">
                    Resolves today at 23:59 UTC
                  </div>
                )}

                {/* Market info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 text-xs">
                        <span className={`px-2 py-0.5 rounded ${
                          market.source === 'daily' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {market.source === 'daily' ? 'Daily' : 'Polymarket'}
                        </span>
                        <span className="text-gray-500">{market.category}</span>
                        <span className="text-gray-500">{getTimeUntil(market.endDate)}</span>
                        {market.volume > 0 && (
                          <span className="text-gray-500">{formatVolume(market.volume)} vol</span>
                        )}
                      </div>
                      <h3 className="font-medium text-[#2d5a3d] leading-snug">{market.question}</h3>
                      {market.description && (
                        <p className="text-gray-500 text-sm mt-1">{market.description}</p>
                      )}
                    </div>
                    
                    {/* Odds */}
                    <div className="flex gap-2 text-sm">
                      <div className="text-center px-3 py-2 bg-[#f0f7f1] rounded-lg">
                        <div className="text-gray-500 text-xs mb-0.5">Yes</div>
                        <div className="font-mono font-medium text-green-600">{market.yesPrice.toFixed(0)}%</div>
                      </div>
                      <div className="text-center px-3 py-2 bg-[#fff5f5] rounded-lg">
                        <div className="text-gray-500 text-xs mb-0.5">No</div>
                        <div className="font-mono font-medium text-red-500">{market.noPrice.toFixed(0)}%</div>
                      </div>
                    </div>
                  </div>

                  {/* AI Calls */}
                  <div className="grid md:grid-cols-2 gap-3">
                    {/* Opus */}
                    <div className="bg-[#fffcf5] rounded-lg p-3 border border-[#f0b866]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-[#8a6830]">Opus</span>
                        <span className={`text-sm font-medium ${
                          market.opusCall.position === 'YES' ? 'text-green-600' : 'text-red-500'
                        }`}>
                          {market.opusCall.position} · {market.opusCall.confidence}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{market.opusCall.reasoning}</p>
                    </div>

                    {/* Codex */}
                    <div className="bg-[#f5faff] rounded-lg p-3 border border-[#66b8f0]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-[#306088]">Codex</span>
                        <span className={`text-sm font-medium ${
                          market.codexCall.position === 'YES' ? 'text-green-600' : 'text-red-500'
                        }`}>
                          {market.codexCall.position} · {market.codexCall.confidence}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{market.codexCall.reasoning}</p>
                    </div>
                  </div>

                  {/* Verdict */}
                  {market.opusCall.position !== market.codexCall.position && (
                    <div className="mt-3 text-center text-xs text-orange-600 bg-orange-50 rounded-lg py-2">
                      Models disagree on this market
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredMarkets.length === 0 && !loading && (
          <div className="text-center py-16 bg-white rounded-2xl border-4 border-gray-200">
            <p className="text-gray-500">No predictions match your filters</p>
          </div>
        )}

        {/* How It Works */}
        <div className="bg-white rounded-2xl border-4 border-[#2d5a3d] p-6 mt-6">
          <h2 className="font-bold text-[#2d5a3d] mb-4">How It Works</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="bg-[#f0f7f1] rounded-xl p-4">
              <div className="text-[#2d5a3d] font-bold mb-2">Daily Predictions</div>
              <p>Crypto price targets generated from live CoinGecko data. Resolves at 23:59 UTC based on closing prices.</p>
            </div>
            <div className="bg-[#f0f7f1] rounded-xl p-4">
              <div className="text-[#2d5a3d] font-bold mb-2">Polymarket Integration</div>
              <p>Real prediction markets pulled via Polymarket API. Odds and volumes update every minute.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
