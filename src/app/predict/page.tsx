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
    <div className="min-h-screen bg-[#0a0a0a] pt-20 text-white">
      <div className="max-w-5xl mx-auto p-4">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Prediction Arena</h1>
          <p className="text-gray-500 text-sm">Live markets from Polymarket + daily crypto calls</p>
        </div>

        {/* Live Prices */}
        {prices.btc > 0 && (
          <div className="flex gap-6 mb-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">BTC</span>
              <span className="font-mono font-medium">${prices.btc.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">ETH</span>
              <span className="font-mono font-medium">${prices.eth.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">SOL</span>
              <span className="font-mono font-medium">${prices.sol.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-gray-800">
          <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
            {[
              { key: 'today', label: 'Today' },
              { key: 'week', label: 'This Week' },
              { key: 'all', label: 'All' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTimeFilter(key as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  timeFilter === key
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 ml-auto text-sm">
            <button
              onClick={() => setAiFilter('all')}
              className={`px-3 py-1.5 rounded-md transition ${
                aiFilter === 'all' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setAiFilter('agree')}
              className={`px-3 py-1.5 rounded-md transition ${
                aiFilter === 'agree' ? 'bg-green-900/50 text-green-400' : 'text-gray-500 hover:text-white'
              }`}
            >
              Consensus ({agreeCount})
            </button>
            <button
              onClick={() => setAiFilter('disagree')}
              className={`px-3 py-1.5 rounded-md transition ${
                aiFilter === 'disagree' ? 'bg-orange-900/50 text-orange-400' : 'text-gray-500 hover:text-white'
              }`}
            >
              Split
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <div className="text-gray-500">Loading predictions...</div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-16">
            <div className="text-red-400">{error}</div>
          </div>
        )}

        {/* Markets */}
        {!loading && !error && (
          <div className="space-y-3">
            {filteredMarkets.map((market) => (
              <div 
                key={market.id}
                className={`bg-gray-900/50 rounded-xl border overflow-hidden ${
                  market.resolvesToday 
                    ? 'border-green-500/30' 
                    : 'border-gray-800'
                }`}
              >
                {/* Today indicator */}
                {market.resolvesToday && (
                  <div className="bg-green-500/10 text-green-400 text-xs px-4 py-1.5 border-b border-green-500/20">
                    Resolves today 23:59 UTC
                  </div>
                )}

                {/* Market info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 text-xs">
                        <span className={`px-2 py-0.5 rounded ${
                          market.source === 'daily' 
                            ? 'bg-green-500/10 text-green-400' 
                            : 'bg-purple-500/10 text-purple-400'
                        }`}>
                          {market.source === 'daily' ? 'Daily' : 'Polymarket'}
                        </span>
                        <span className="text-gray-600">{market.category}</span>
                        <span className="text-gray-600">{getTimeUntil(market.endDate)}</span>
                        {market.volume > 0 && (
                          <span className="text-gray-600">{formatVolume(market.volume)} vol</span>
                        )}
                      </div>
                      <h3 className="font-medium text-white leading-snug">{market.question}</h3>
                      {market.description && (
                        <p className="text-gray-500 text-sm mt-1">{market.description}</p>
                      )}
                    </div>
                    
                    {/* Odds */}
                    <div className="flex gap-2 text-sm">
                      <div className="text-center px-3 py-2 bg-gray-800/50 rounded-lg">
                        <div className="text-gray-500 text-xs mb-0.5">Yes</div>
                        <div className="font-mono font-medium text-green-400">{market.yesPrice.toFixed(0)}%</div>
                      </div>
                      <div className="text-center px-3 py-2 bg-gray-800/50 rounded-lg">
                        <div className="text-gray-500 text-xs mb-0.5">No</div>
                        <div className="font-mono font-medium text-red-400">{market.noPrice.toFixed(0)}%</div>
                      </div>
                    </div>
                  </div>

                  {/* AI Calls */}
                  <div className="grid md:grid-cols-2 gap-3">
                    {/* Opus */}
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Opus</span>
                        <span className={`text-sm font-medium ${
                          market.opusCall.position === 'YES' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {market.opusCall.position} · {market.opusCall.confidence}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{market.opusCall.reasoning}</p>
                    </div>

                    {/* Codex */}
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Codex</span>
                        <span className={`text-sm font-medium ${
                          market.codexCall.position === 'YES' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {market.codexCall.position} · {market.codexCall.confidence}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{market.codexCall.reasoning}</p>
                    </div>
                  </div>

                  {/* Verdict */}
                  {market.opusCall.position !== market.codexCall.position && (
                    <div className="mt-3 text-center text-xs text-orange-400/70">
                      Models disagree on this one
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredMarkets.length === 0 && !loading && (
          <div className="text-center py-16">
            <p className="text-gray-500">No predictions match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
