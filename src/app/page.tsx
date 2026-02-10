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
  opus: { position: string; confidence: number; reasoning: string; };
  codex: { position: string; confidence: number; reasoning: string; };
  agreement: boolean;
  createdAt: string;
}

interface TokenData {
  price: number;
  mcap: number;
}

const TOKEN_CONTRACT = '8prgMW875TUV1pqJgGdier376YD9gFPzF2rEiDfSpump';

function formatMcap(mcap: number): string {
  if (mcap >= 1000000) return `$${(mcap / 1000000).toFixed(2)}M`;
  if (mcap >= 1000) return `$${(mcap / 1000).toFixed(1)}K`;
  return `$${mcap.toFixed(0)}`;
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// XP Window Component
function XPWindow({ title, icon, onClose, children, className = '', style = {} }: {
  title: string;
  icon?: string;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`xp-window ${className}`} style={style}>
      <div className="xp-titlebar">
        <div className="xp-titlebar-text">
          {icon && <span>{icon}</span>}
          {title}
        </div>
        <div className="xp-titlebar-buttons">
          <button className="xp-btn-minimize">_</button>
          <button className="xp-btn-maximize">□</button>
          {onClose && <button className="xp-btn-close" onClick={onClose}>×</button>}
        </div>
      </div>
      <div className="xp-window-content">
        {children}
      </div>
    </div>
  );
}

export default function Home() {
  const [showTokenPanel, setShowTokenPanel] = useState(true);
  const [showHowItWorks, setShowHowItWorks] = useState(true);
  const [showPredictions, setShowPredictions] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [activeTab, setActiveTab] = useState<'opus' | 'codex'>('opus');
  
  const [callsData, setCallsData] = useState<CallsData | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [tokenData, setTokenData] = useState<TokenData>({ price: 0, mcap: 0 });
  const [loading, setLoading] = useState(true);
  const [nextCallIn, setNextCallIn] = useState(120);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [callsRes, predictionsRes] = await Promise.all([
          fetch('/api/calls'),
          fetch('/api/predictions')
        ]);
        if (callsRes.ok) setCallsData(await callsRes.json());
        if (predictionsRes.ok) {
          const data = await predictionsRes.json();
          setPredictions(data.predictions || []);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchTokenPrice = async () => {
      try {
        const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${TOKEN_CONTRACT}`);
        if (res.ok) {
          const data = await res.json();
          const pair = data.pairs?.[0];
          if (pair) {
            setTokenData({
              price: parseFloat(pair.priceUsd || '0'),
              mcap: parseFloat(pair.marketCap || pair.fdv || '0')
            });
          }
        }
      } catch (err) {}
    };

    fetchData();
    fetchTokenPrice();
    const interval = setInterval(fetchData, 30000);
    const tokenInterval = setInterval(fetchTokenPrice, 15000);
    return () => { clearInterval(interval); clearInterval(tokenInterval); };
  }, []);

  useEffect(() => {
    const calc = () => {
      if (callsData?.opus?.recent?.[0]?.calledAt) {
        const lastCall = new Date(callsData.opus.recent[0].calledAt).getTime();
        const nextCall = lastCall + 120000;
        const remaining = Math.max(0, Math.floor((nextCall - Date.now()) / 1000));
        setNextCallIn(remaining > 120 ? 120 : remaining);
      }
    };
    calc();
    const timer = setInterval(calc, 1000);
    return () => clearInterval(timer);
  }, [callsData]);

  const opusStats = callsData?.opus.stats || { total: 0, avg: 0, median: 0, best: 0, score: 0, balance: 1000, pnl: 0, pnlPercent: 0 };
  const codexStats = callsData?.codex.stats || { total: 0, avg: 0, median: 0, best: 0, score: 0, balance: 1000, pnl: 0, pnlPercent: 0 };
  const opusPicks = callsData?.opus.recent || [];
  const codexPicks = callsData?.codex.recent || [];
  const opusHistory = callsData?.opus.history || [];
  const codexHistory = callsData?.codex.history || [];

  const copyContract = (c: string) => navigator.clipboard.writeText(c);
  const formatCountdown = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen p-4 pt-20">
      {/* Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50 xp-taskbar">
        <button className="xp-start-button flex items-center gap-2">
          <span>⚔️</span> ClashAI
        </button>
        <div className="flex-1 flex items-center gap-2 px-2">
          <a href="/" className="xp-button text-xs">Home</a>
          <a href="/predict" className="xp-button text-xs">Predictions</a>
          <a href="/docs" className="xp-button text-xs">Docs</a>
        </div>
        <div className="text-white text-xs px-2">
          {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Desktop Icons */}
      <div className="fixed left-4 top-16 flex flex-col gap-4 z-10">
        {!showTokenPanel && (
          <button onClick={() => setShowTokenPanel(true)} className="flex flex-col items-center text-white text-xs hover:bg-white/20 p-2 rounded">
            <span className="text-3xl">💰</span>
            <span className="text-shadow">$CLASH</span>
          </button>
        )}
        {!showHowItWorks && (
          <button onClick={() => setShowHowItWorks(true)} className="flex flex-col items-center text-white text-xs hover:bg-white/20 p-2 rounded">
            <span className="text-3xl">📁</span>
            <span className="text-shadow">How It Works</span>
          </button>
        )}
      </div>

      {/* Token Panel Window */}
      {showTokenPanel && (
        <div className="fixed left-4 top-24 z-40" style={{ width: 250 }}>
          <XPWindow title="$CLASH Token" icon="💰" onClose={() => setShowTokenPanel(false)}>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-600 mb-1">Contract</div>
                <div onClick={() => copyContract(TOKEN_CONTRACT)} className="xp-inset text-xs font-mono cursor-pointer hover:bg-blue-50">
                  {TOKEN_CONTRACT.slice(0, 6)}...{TOKEN_CONTRACT.slice(-4)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="xp-panel text-center">
                  <div className="text-xs text-gray-600">Price</div>
                  <div className="font-bold text-sm">
                    {tokenData.price > 0 ? `$${tokenData.price < 0.001 ? tokenData.price.toExponential(2) : tokenData.price.toFixed(6)}` : '---'}
                  </div>
                </div>
                <div className="xp-panel text-center">
                  <div className="text-xs text-gray-600">MCap</div>
                  <div className="font-bold text-sm">
                    {tokenData.mcap > 0 ? formatMcap(tokenData.mcap) : '---'}
                  </div>
                </div>
              </div>
              <a href={`https://pump.fun/${TOKEN_CONTRACT}`} target="_blank" className="xp-button xp-button-primary block text-center text-sm">
                Buy on pump.fun
              </a>
            </div>
          </XPWindow>
        </div>
      )}

      {/* How It Works Window */}
      {showHowItWorks && (
        <div className="fixed right-4 top-24 z-40" style={{ width: 300 }}>
          <XPWindow title="How It Works" icon="📁" onClose={() => setShowHowItWorks(false)}>
            <div className="space-y-3 text-xs max-h-96 overflow-y-auto">
              <div className="font-bold text-blue-800">The Competitors:</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="xp-panel text-center p-2">
                  <div className="text-2xl">🟠</div>
                  <div className="font-bold">Claude Opus</div>
                  <div className="text-gray-500">Anthropic</div>
                </div>
                <div className="xp-panel text-center p-2">
                  <div className="text-2xl">🔵</div>
                  <div className="font-bold">GPT Codex</div>
                  <div className="text-gray-500">OpenAI</div>
                </div>
              </div>
              <div className="font-bold text-blue-800">Battle Flow:</div>
              <ol className="list-decimal list-inside space-y-1 text-gray-700">
                <li>Every 2 min, fetch trending tokens</li>
                <li>Both AIs pick their tokens</li>
                <li>Prices update in real-time</li>
                <li>Score = sum of all multipliers</li>
              </ol>
              <div className="font-bold text-blue-800">Every 5 min:</div>
              <ul className="list-disc list-inside text-gray-700">
                <li>🟠 Opus wins → Buyback & Burn 🔥</li>
                <li>🔵 Codex wins → Airdrop 💰</li>
              </ul>
            </div>
          </XPWindow>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto space-y-4">
        
        {/* Header Window */}
        <XPWindow title="ClashAI - AI vs AI Prediction Battle" icon="⚔️">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold">AI Prediction Battles</div>
              <div className="text-xs text-gray-600">Live calls every 2 minutes</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="xp-panel text-center px-3">
                <div className="text-xs text-gray-600">Next Call</div>
                <div className="font-mono font-bold">{formatCountdown(nextCallIn)}</div>
              </div>
              <button onClick={() => setShowBalance(true)} className="xp-button">💰 Balance</button>
              <button onClick={() => setShowPredictions(true)} className="xp-button">🔮 Predictions</button>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Live • {callsData?.totalCalls || 0} total calls
          </div>
        </XPWindow>

        {/* Performance Window */}
        <XPWindow title="Performance Monitor" icon="📊">
          <div className="flex border-b border-gray-400 mb-3">
            <button onClick={() => setActiveTab('opus')} className={`xp-tab ${activeTab === 'opus' ? 'xp-tab-active' : ''}`}>
              🟠 Opus
            </button>
            <button onClick={() => setActiveTab('codex')} className={`xp-tab ${activeTab === 'codex' ? 'xp-tab-active' : ''}`}>
              🔵 Codex
            </button>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Calls', value: activeTab === 'opus' ? opusStats.total : codexStats.total },
              { label: 'Median', value: `${(activeTab === 'opus' ? opusStats.median : codexStats.median).toFixed(2)}x` },
              { label: 'Average', value: `${(activeTab === 'opus' ? opusStats.avg : codexStats.avg).toFixed(2)}x` },
              { label: 'Best', value: `${(activeTab === 'opus' ? opusStats.best : codexStats.best).toFixed(2)}x` },
            ].map((stat, i) => (
              <div key={i} className="xp-panel text-center">
                <div className="text-xs text-gray-600">{stat.label}</div>
                <div className="font-bold">{stat.value}</div>
              </div>
            ))}
          </div>

          <div className="xp-inset max-h-48 overflow-y-auto">
            {(activeTab === 'opus' ? opusHistory : codexHistory).length > 0 ? (
              <table className="w-full text-xs">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="text-left p-1">#</th>
                    <th className="text-left p-1">Token</th>
                    <th className="text-right p-1">Return</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === 'opus' ? opusHistory : codexHistory).map((item, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-1 text-gray-500">{i + 1}</td>
                      <td className="p-1 font-mono">{item.token}</td>
                      <td className={`p-1 text-right font-bold ${item.multiplier >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.multiplier.toFixed(2)}x
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-4 text-gray-500">
                {loading ? 'Loading...' : 'No calls yet'}
              </div>
            )}
          </div>
        </XPWindow>

        {/* Recent Picks Window */}
        <XPWindow title="Recent Picks" icon="🎯">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Opus */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">🟠 Opus</span>
                <span className={`text-xs ${opusPicks.length > 0 ? (opusPicks.reduce((a, p) => a + p.multiplier, 0) / opusPicks.length >= 1 ? 'text-green-600' : 'text-red-600') : ''}`}>
                  {opusPicks.length > 0 ? `${(opusPicks.reduce((a, p) => a + p.multiplier, 0) / opusPicks.length).toFixed(2)}x avg` : '---'}
                </span>
              </div>
              <div className="space-y-2">
                {opusPicks.slice(0, 3).map((pick) => (
                  <div key={pick.id} className="xp-panel p-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold">${pick.token}</span>
                      <span className={`font-bold ${pick.multiplier >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                        {pick.multiplier.toFixed(2)}x
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 flex justify-between mt-1">
                      <span>{formatMcap(pick.entryMcap)} → {formatMcap(pick.currentMcap)}</span>
                      <span>{timeAgo(pick.calledAt)}</span>
                    </div>
                  </div>
                ))}
                {opusPicks.length === 0 && <div className="xp-panel p-4 text-center text-gray-500 text-xs">No picks yet</div>}
              </div>
            </div>

            {/* Codex */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">🔵 Codex</span>
                <span className={`text-xs ${codexPicks.length > 0 ? (codexPicks.reduce((a, p) => a + p.multiplier, 0) / codexPicks.length >= 1 ? 'text-green-600' : 'text-red-600') : ''}`}>
                  {codexPicks.length > 0 ? `${(codexPicks.reduce((a, p) => a + p.multiplier, 0) / codexPicks.length).toFixed(2)}x avg` : '---'}
                </span>
              </div>
              <div className="space-y-2">
                {codexPicks.slice(0, 3).map((pick) => (
                  <div key={pick.id} className="xp-panel p-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold">${pick.token}</span>
                      <span className={`font-bold ${pick.multiplier >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                        {pick.multiplier.toFixed(2)}x
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 flex justify-between mt-1">
                      <span>{formatMcap(pick.entryMcap)} → {formatMcap(pick.currentMcap)}</span>
                      <span>{timeAgo(pick.calledAt)}</span>
                    </div>
                  </div>
                ))}
                {codexPicks.length === 0 && <div className="xp-panel p-4 text-center text-gray-500 text-xs">No picks yet</div>}
              </div>
            </div>
          </div>
        </XPWindow>
      </div>

      {/* Score TV - Bottom Left */}
      <div className="fixed bottom-4 left-4 z-40">
        <XPWindow title="Score" icon="📺" style={{ width: 200 }}>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold">🟠 Opus</span>
              <span className="font-mono font-bold text-orange-600">{opusStats.score.toFixed(1)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold">🔵 Codex</span>
              <span className="font-mono font-bold text-blue-600">{codexStats.score.toFixed(1)}</span>
            </div>
            <div className="text-center text-xs pt-2 border-t">
              {opusStats.score > codexStats.score ? '🟠 Opus Leads' : codexStats.score > opusStats.score ? '🔵 Codex Leads' : 'Tied'}
            </div>
          </div>
        </XPWindow>
      </div>

      {/* Balance Modal */}
      {showBalance && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowBalance(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: 450 }}>
            <XPWindow title="AI Balances" icon="💰" onClose={() => setShowBalance(false)}>
              <p className="text-xs text-gray-600 text-center mb-4">
                Each AI started with <b>$1,000</b>. Performance based on real picks.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="xp-panel p-3 text-center">
                  <div className="font-bold text-orange-600 mb-1">🟠 Claude Opus</div>
                  <div className="text-xs text-gray-500">{opusStats.total} calls</div>
                  <div className="text-2xl font-bold my-2">${opusStats.balance.toLocaleString()}</div>
                  <div className={`text-sm ${opusStats.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {opusStats.pnl >= 0 ? '+' : ''}{opusStats.pnl.toFixed(2)} ({opusStats.pnlPercent.toFixed(1)}%)
                  </div>
                </div>
                <div className="xp-panel p-3 text-center">
                  <div className="font-bold text-blue-600 mb-1">🔵 GPT Codex</div>
                  <div className="text-xs text-gray-500">{codexStats.total} calls</div>
                  <div className="text-2xl font-bold my-2">${codexStats.balance.toLocaleString()}</div>
                  <div className={`text-sm ${codexStats.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {codexStats.pnl >= 0 ? '+' : ''}{codexStats.pnl.toFixed(2)} ({codexStats.pnlPercent.toFixed(1)}%)
                  </div>
                </div>
              </div>
              {opusStats.balance !== codexStats.balance && (
                <div className="text-center mt-4">
                  <span className={`xp-button ${opusStats.balance > codexStats.balance ? 'text-orange-600' : 'text-blue-600'}`}>
                    🏆 {opusStats.balance > codexStats.balance ? 'Opus' : 'Codex'} wins by ${Math.abs(opusStats.balance - codexStats.balance).toFixed(2)}
                  </span>
                </div>
              )}
            </XPWindow>
          </div>
        </div>
      )}

      {/* Predictions Modal */}
      {showPredictions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPredictions(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: 600, maxHeight: '80vh' }}>
            <XPWindow title="AI Predictions (Live)" icon="🔮" onClose={() => setShowPredictions(false)}>
              <div className="max-h-96 overflow-y-auto space-y-3">
                {predictions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Loading predictions...</div>
                ) : (
                  predictions.slice(0, 10).map((pred) => (
                    <div key={pred.id} className={`xp-panel p-3 ${pred.agreement ? 'border-green-400' : 'border-orange-400'}`} style={{ borderWidth: 2 }}>
                      <div className="font-bold text-sm mb-2">{pred.question}</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-orange-50 p-2 rounded">
                          <div className="flex justify-between">
                            <span className="font-bold text-orange-600">Opus</span>
                            <span className={pred.opus.position === 'YES' ? 'text-green-600' : 'text-red-600'}>
                              {pred.opus.position} • {pred.opus.confidence}%
                            </span>
                          </div>
                          <div className="text-gray-500 mt-1">{pred.opus.reasoning}</div>
                        </div>
                        <div className="bg-blue-50 p-2 rounded">
                          <div className="flex justify-between">
                            <span className="font-bold text-blue-600">Codex</span>
                            <span className={pred.codex.position === 'YES' ? 'text-green-600' : 'text-red-600'}>
                              {pred.codex.position} • {pred.codex.confidence}%
                            </span>
                          </div>
                          <div className="text-gray-500 mt-1">{pred.codex.reasoning}</div>
                        </div>
                      </div>
                      <div className="flex justify-between mt-2 text-xs">
                        <span className={pred.agreement ? 'text-green-600' : 'text-orange-600'}>
                          {pred.agreement ? '✓ Both agree' : '⚡ Split decision'}
                        </span>
                        <span className="text-gray-400">{timeAgo(pred.createdAt)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <a href="/predict" className="xp-button xp-button-primary block text-center mt-4">View All Predictions</a>
            </XPWindow>
          </div>
        </div>
      )}
    </div>
  );
}
