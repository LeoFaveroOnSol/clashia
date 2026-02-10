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
function XPWindow({ title, icon, onClose, onMinimize, children, style = {} }: {
  title: string;
  icon?: string;
  onClose?: () => void;
  onMinimize?: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div className="xp-window" style={style}>
      <div className="xp-titlebar">
        <div className="xp-titlebar-text">
          {icon && <span className="mr-1">{icon}</span>}
          {title}
        </div>
        <div className="xp-titlebar-buttons">
          {onMinimize && <button className="xp-btn-minimize" onClick={onMinimize}>_</button>}
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

// Desktop Icon Component
function DesktopIcon({ icon, label, onClick }: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center p-2 rounded hover:bg-white/20 active:bg-white/30 transition-colors"
      style={{ width: 75, background: 'transparent' }}
    >
      <div className="text-4xl" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>{icon}</div>
      <span className="text-white text-[11px] text-center mt-1 px-1" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>
        {label}
      </span>
    </button>
  );
}

export default function Home() {
  // Window states
  const [windows, setWindows] = useState({
    ai: true,      // AI Battle window - open by default
    calls: false,
    predictions: false,
    docs: false,
    balance: false,
  });

  const [callsData, setCallsData] = useState<CallsData | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [tokenData, setTokenData] = useState<TokenData>({ price: 0, mcap: 0 });
  const [loading, setLoading] = useState(true);
  const [nextCallIn, setNextCallIn] = useState(120);
  const [activeTab, setActiveTab] = useState<'opus' | 'codex'>('opus');

  const toggleWindow = (name: keyof typeof windows) => {
    setWindows(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const openWindow = (name: keyof typeof windows) => {
    setWindows(prev => ({ ...prev, [name]: true }));
  };

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

  const copyContract = () => navigator.clipboard.writeText(TOKEN_CONTRACT);
  const formatCountdown = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Desktop Background - XP Bliss style */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#245edb] via-[#3a93ff] to-[#2d9b2d]" />
      
      {/* Desktop Icons - Left Side */}
      <div className="fixed left-3 top-12 z-10 flex flex-col gap-2">
        <DesktopIcon icon="⚔️" label="ClashAI" onClick={() => openWindow('ai')} />
        <DesktopIcon icon="📊" label="Calls" onClick={() => openWindow('calls')} />
        <DesktopIcon icon="🔮" label="Predictions" onClick={() => openWindow('predictions')} />
        <DesktopIcon icon="💰" label="Balance" onClick={() => openWindow('balance')} />
        <DesktopIcon icon="📁" label="Docs" onClick={() => openWindow('docs')} />
      </div>

      {/* Floating Contract - Top Center */}
      <div 
        onClick={copyContract}
        className="fixed top-3 left-1/2 -translate-x-1/2 z-50 cursor-pointer hover:scale-105 transition"
      >
        <div className="bg-black/80 text-green-400 font-mono text-sm px-4 py-2 rounded-lg border border-green-500/50 shadow-lg shadow-green-500/20">
          <span className="text-green-300">CA:</span> clash...pump 📋
        </div>
      </div>

      {/* AI Battle Window - Main Window */}
      {windows.ai && (
        <div className="fixed z-30" style={{ top: 60, right: 20, width: 420 }}>
          <XPWindow 
            title="ClashAI - Battle Arena" 
            icon="⚔️" 
            onClose={() => toggleWindow('ai')}
            onMinimize={() => toggleWindow('ai')}
          >
            <div className="space-y-4">
              {/* Score Section */}
              <div className="xp-panel p-3">
                <div className="text-center text-xs text-gray-600 mb-2 font-bold">LIVE SCORE</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-3xl">🟠</div>
                    <div className="font-bold">Claude Opus</div>
                    <div className="text-2xl font-mono font-bold text-orange-600">{opusStats.score.toFixed(1)}</div>
                    <div className="text-xs text-gray-500">{opusStats.total} calls</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl">🔵</div>
                    <div className="font-bold">GPT Codex</div>
                    <div className="text-2xl font-mono font-bold text-blue-600">{codexStats.score.toFixed(1)}</div>
                    <div className="text-xs text-gray-500">{codexStats.total} calls</div>
                  </div>
                </div>
                <div className="text-center mt-3 pt-2 border-t">
                  <span className={`font-bold ${opusStats.score > codexStats.score ? 'text-orange-600' : 'text-blue-600'}`}>
                    {opusStats.score > codexStats.score ? '🏆 Opus Leads!' : codexStats.score > opusStats.score ? '🏆 Codex Leads!' : '🤝 Tied!'}
                  </span>
                </div>
              </div>

              {/* Next Call Timer */}
              <div className="xp-panel p-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-xs">Live • {callsData?.totalCalls || 0} total calls</span>
                </div>
                <div className="text-xs">
                  Next call: <span className="font-mono font-bold">{formatCountdown(nextCallIn)}</span>
                </div>
              </div>

              {/* $CLASHAI Token Info */}
              <div className="xp-panel p-3">
                <div className="text-center text-xs text-gray-600 mb-2 font-bold">$CLASHAI TOKEN</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="xp-inset p-2 text-center">
                    <div className="text-xs text-gray-500">Price</div>
                    <div className="font-bold">
                      {tokenData.price > 0 ? `$${tokenData.price.toExponential(2)}` : '---'}
                    </div>
                  </div>
                  <div className="xp-inset p-2 text-center">
                    <div className="text-xs text-gray-500">MCap</div>
                    <div className="font-bold">
                      {tokenData.mcap > 0 ? formatMcap(tokenData.mcap) : '---'}
                    </div>
                  </div>
                </div>
                <a 
                  href={`https://pump.fun/${TOKEN_CONTRACT}`} 
                  target="_blank" 
                  className="xp-button xp-button-primary block text-center text-xs mt-3"
                >
                  Buy on pump.fun
                </a>
              </div>

              {/* Quick Rules */}
              <div className="text-xs text-gray-600 space-y-1">
                <div>🟠 <b>Opus wins round</b> → Buyback & Burn 🔥</div>
                <div>🔵 <b>Codex wins round</b> → Airdrop to holders 💰</div>
                <div className="text-gray-400">Rounds close every 5 minutes</div>
              </div>
            </div>
          </XPWindow>
        </div>
      )}

      {/* Calls Window */}
      {windows.calls && (
        <div className="fixed z-20" style={{ top: 100, left: 120, width: 500 }}>
          <XPWindow 
            title="Calls Monitor" 
            icon="📊" 
            onClose={() => toggleWindow('calls')}
            onMinimize={() => toggleWindow('calls')}
          >
            {/* Tabs */}
            <div className="flex border-b border-gray-400 mb-3">
              <button onClick={() => setActiveTab('opus')} className={`xp-tab ${activeTab === 'opus' ? 'xp-tab-active' : ''}`}>
                🟠 Opus
              </button>
              <button onClick={() => setActiveTab('codex')} className={`xp-tab ${activeTab === 'codex' ? 'xp-tab-active' : ''}`}>
                🔵 Codex
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[
                { label: 'Calls', value: activeTab === 'opus' ? opusStats.total : codexStats.total },
                { label: 'Avg', value: `${(activeTab === 'opus' ? opusStats.avg : codexStats.avg).toFixed(2)}x` },
                { label: 'Best', value: `${(activeTab === 'opus' ? opusStats.best : codexStats.best).toFixed(2)}x` },
                { label: 'Balance', value: `$${(activeTab === 'opus' ? opusStats.balance : codexStats.balance).toFixed(0)}` },
              ].map((stat, i) => (
                <div key={i} className="xp-panel text-center p-2">
                  <div className="text-xs text-gray-600">{stat.label}</div>
                  <div className="font-bold text-sm">{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Recent Picks */}
            <div className="xp-inset max-h-64 overflow-y-auto">
              {(activeTab === 'opus' ? opusPicks : codexPicks).length > 0 ? (
                <table className="w-full text-xs">
                  <thead className="bg-gray-200 sticky top-0">
                    <tr>
                      <th className="text-left p-2">Token</th>
                      <th className="text-right p-2">Entry</th>
                      <th className="text-right p-2">Current</th>
                      <th className="text-right p-2">Return</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeTab === 'opus' ? opusPicks : codexPicks).map((pick, i) => (
                      <tr key={pick.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="p-2 font-mono font-bold">${pick.token}</td>
                        <td className="p-2 text-right text-gray-600">{formatMcap(pick.entryMcap)}</td>
                        <td className="p-2 text-right text-gray-600">{formatMcap(pick.currentMcap)}</td>
                        <td className={`p-2 text-right font-bold ${pick.multiplier >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                          {pick.multiplier.toFixed(2)}x
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-gray-500">No calls yet</div>
              )}
            </div>
          </XPWindow>
        </div>
      )}

      {/* Predictions Window */}
      {windows.predictions && (
        <div className="fixed z-20" style={{ top: 80, left: 150, width: 550 }}>
          <XPWindow 
            title="AI Predictions" 
            icon="🔮" 
            onClose={() => toggleWindow('predictions')}
            onMinimize={() => toggleWindow('predictions')}
          >
            <div className="max-h-80 overflow-y-auto space-y-2">
              {predictions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Loading predictions...</div>
              ) : (
                predictions.slice(0, 8).map((pred) => (
                  <div key={pred.id} className={`xp-panel p-2 ${pred.agreement ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-orange-500'}`}>
                    <div className="font-bold text-xs mb-2">{pred.question}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-orange-50 p-1.5 rounded">
                        <span className="font-bold text-orange-600">Opus: </span>
                        <span className={pred.opus.position === 'YES' ? 'text-green-600' : 'text-red-600'}>
                          {pred.opus.position} ({pred.opus.confidence}%)
                        </span>
                      </div>
                      <div className="bg-blue-50 p-1.5 rounded">
                        <span className="font-bold text-blue-600">Codex: </span>
                        <span className={pred.codex.position === 'YES' ? 'text-green-600' : 'text-red-600'}>
                          {pred.codex.position} ({pred.codex.confidence}%)
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <a href="/predict" className="xp-button block text-center text-xs mt-3">View All →</a>
          </XPWindow>
        </div>
      )}

      {/* Balance Window */}
      {windows.balance && (
        <div className="fixed z-20" style={{ top: 120, left: 200, width: 400 }}>
          <XPWindow 
            title="AI Balances" 
            icon="💰" 
            onClose={() => toggleWindow('balance')}
            onMinimize={() => toggleWindow('balance')}
          >
            <p className="text-xs text-gray-600 text-center mb-3">
              Each AI started with <b>$1,000</b>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="xp-panel p-3 text-center">
                <div className="text-2xl mb-1">🟠</div>
                <div className="font-bold text-orange-600">Claude Opus</div>
                <div className="text-xl font-bold my-2">${opusStats.balance.toFixed(0)}</div>
                <div className={`text-sm ${opusStats.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {opusStats.pnl >= 0 ? '+' : ''}{opusStats.pnl.toFixed(0)} ({opusStats.pnlPercent.toFixed(1)}%)
                </div>
              </div>
              <div className="xp-panel p-3 text-center">
                <div className="text-2xl mb-1">🔵</div>
                <div className="font-bold text-blue-600">GPT Codex</div>
                <div className="text-xl font-bold my-2">${codexStats.balance.toFixed(0)}</div>
                <div className={`text-sm ${codexStats.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {codexStats.pnl >= 0 ? '+' : ''}{codexStats.pnl.toFixed(0)} ({codexStats.pnlPercent.toFixed(1)}%)
                </div>
              </div>
            </div>
          </XPWindow>
        </div>
      )}

      {/* Docs Window */}
      {windows.docs && (
        <div className="fixed z-20" style={{ top: 60, left: 180, width: 450 }}>
          <XPWindow 
            title="Documentation" 
            icon="📁" 
            onClose={() => toggleWindow('docs')}
            onMinimize={() => toggleWindow('docs')}
          >
            <div className="max-h-80 overflow-y-auto text-xs space-y-3">
              <div className="xp-panel p-2">
                <div className="font-bold text-blue-800 mb-1">🎯 What is ClashAI?</div>
                <p className="text-gray-600">
                  AI vs AI prediction battle arena. Two AI models compete by picking trending Solana memecoins every 2 minutes.
                </p>
              </div>
              
              <div className="xp-panel p-2">
                <div className="font-bold text-blue-800 mb-1">⚙️ How It Works</div>
                <ol className="list-decimal list-inside text-gray-600 space-y-1">
                  <li>Every 2 min: fetch trending tokens</li>
                  <li>Each AI picks their best token</li>
                  <li>Prices update in real-time</li>
                  <li>Score = sum of multipliers</li>
                </ol>
              </div>

              <div className="xp-panel p-2">
                <div className="font-bold text-blue-800 mb-1">💎 Tokenomics</div>
                <div className="text-gray-600 space-y-1">
                  <div>🟠 <b>Opus wins</b> → Buyback & Burn 🔥</div>
                  <div>🔵 <b>Codex wins</b> → Airdrop 💰</div>
                </div>
              </div>

              <a href="/docs" className="xp-button block text-center">Full Documentation →</a>
            </div>
          </XPWindow>
        </div>
      )}

      {/* Taskbar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 h-[30px]" style={{ background: 'linear-gradient(to bottom, #3168d5 0%, #4993e6 3%, #2157d7 97%, #1941a5 100%)' }}>
        <div className="flex items-center h-full">
          {/* Start Button */}
          <button className="h-full px-3 flex items-center gap-2 text-white font-bold text-sm" style={{ background: 'linear-gradient(to bottom, #3c9c30 0%, #2d8016 100%)', borderRadius: '0 8px 8px 0' }}>
            <span>🪟</span> Start
          </button>
          
          {/* Open Windows */}
          <div className="flex-1 flex items-center gap-1 px-2 h-full">
            {windows.ai && (
              <button onClick={() => toggleWindow('ai')} className="h-6 px-2 text-xs flex items-center gap-1 bg-[#1e52b7] text-white border border-[#0c3c8c] rounded">
                ⚔️ ClashAI
              </button>
            )}
            {windows.calls && (
              <button onClick={() => toggleWindow('calls')} className="h-6 px-2 text-xs flex items-center gap-1 bg-[#3168d5] text-white border border-[#0c3c8c] rounded">
                📊 Calls
              </button>
            )}
            {windows.predictions && (
              <button onClick={() => toggleWindow('predictions')} className="h-6 px-2 text-xs flex items-center gap-1 bg-[#3168d5] text-white border border-[#0c3c8c] rounded">
                🔮 Predicts
              </button>
            )}
            {windows.balance && (
              <button onClick={() => toggleWindow('balance')} className="h-6 px-2 text-xs flex items-center gap-1 bg-[#3168d5] text-white border border-[#0c3c8c] rounded">
                💰 Balance
              </button>
            )}
            {windows.docs && (
              <button onClick={() => toggleWindow('docs')} className="h-6 px-2 text-xs flex items-center gap-1 bg-[#3168d5] text-white border border-[#0c3c8c] rounded">
                📁 Docs
              </button>
            )}
          </div>

          {/* System Tray */}
          <div className="flex items-center gap-2 px-3 h-full text-white text-xs" style={{ background: 'linear-gradient(to bottom, #0f3c9c 0%, #1854c5 100%)' }}>
            <span>🔊</span>
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
