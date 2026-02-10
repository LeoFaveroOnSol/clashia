'use client';

import { useEffect, useState } from 'react';

interface CoinPick {
  id: number;
  token: string;
  contract: string;
  entryMcap: number;
  currentMcap: number;
  multiplier: number;
  calledAt: string;
}

interface AIStats {
  total: number;
  avg: number;
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
  opus: { position: string; confidence: number; };
  codex: { position: string; confidence: number; };
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
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

export default function Home() {
  const [activeWindow, setActiveWindow] = useState<string | null>('main');
  const [callsData, setCallsData] = useState<CallsData | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [tokenData, setTokenData] = useState<TokenData>({ price: 0, mcap: 0 });
  const [loading, setLoading] = useState(true);
  const [nextCallIn, setNextCallIn] = useState(120);
  const [activeTab, setActiveTab] = useState<'opus' | 'codex'>('opus');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [callsRes, predictionsRes] = await Promise.all([
          fetch('/api/calls'),
          fetch('/api/predictions')
        ]);
        if (callsRes.ok) setCallsData(await callsRes.json());
        if (predictionsRes.ok) setPredictions((await predictionsRes.json()).predictions || []);
      } catch (err) {} 
      finally { setLoading(false); }
    };

    const fetchToken = async () => {
      try {
        const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${TOKEN_CONTRACT}`);
        if (res.ok) {
          const data = await res.json();
          const pair = data.pairs?.[0];
          if (pair) setTokenData({ price: parseFloat(pair.priceUsd || '0'), mcap: parseFloat(pair.marketCap || pair.fdv || '0') });
        }
      } catch {}
    };

    fetchData();
    fetchToken();
    const i1 = setInterval(fetchData, 30000);
    const i2 = setInterval(fetchToken, 15000);
    return () => { clearInterval(i1); clearInterval(i2); };
  }, []);

  useEffect(() => {
    const calc = () => {
      if (callsData?.opus?.recent?.[0]?.calledAt) {
        const last = new Date(callsData.opus.recent[0].calledAt).getTime();
        const remaining = Math.max(0, Math.floor((last + 120000 - Date.now()) / 1000));
        setNextCallIn(remaining > 120 ? 120 : remaining);
      }
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [callsData]);

  const stats = {
    opus: callsData?.opus.stats || { total: 0, avg: 0, best: 0, score: 0, balance: 1000, pnl: 0, pnlPercent: 0 },
    codex: callsData?.codex.stats || { total: 0, avg: 0, best: 0, score: 0, balance: 1000, pnl: 0, pnlPercent: 0 }
  };
  const picks = { opus: callsData?.opus.recent || [], codex: callsData?.codex.recent || [] };
  
  const copy = () => navigator.clipboard.writeText(TOKEN_CONTRACT);
  const fmt = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  return (
    <div className="h-screen w-screen overflow-hidden" style={{ background: 'linear-gradient(180deg, #1e5799 0%, #207cca 30%, #2989d8 50%, #7db9e8 100%)' }}>
      
      {/* Desktop Icons */}
      <div className="absolute left-4 top-4 flex flex-col gap-6">
        {[
          { icon: '⚔️', label: 'ClashAI', id: 'main' },
          { icon: '📊', label: 'Calls', id: 'calls' },
          { icon: '🔮', label: 'Predictions', id: 'predictions' },
          { icon: '💰', label: 'Balance', id: 'balance' },
          { icon: '📖', label: 'Docs', id: 'docs' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveWindow(item.id)}
            className="flex flex-col items-center w-20 p-2 rounded hover:bg-white/10 transition"
          >
            <span className="text-5xl drop-shadow-lg">{item.icon}</span>
            <span className="text-white text-xs mt-1 font-medium" style={{ textShadow: '1px 1px 2px #000' }}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Floating CA */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
        <button onClick={copy} className="bg-black/70 hover:bg-black/80 text-green-400 font-mono px-4 py-2 rounded-lg text-sm border border-green-500/30 transition">
          CA: clash...pump 📋
        </button>
      </div>

      {/* Main Window */}
      {activeWindow === 'main' && (
        <div className="absolute top-16 right-8 w-[380px] bg-[#ece9d8] rounded-t-lg shadow-2xl border border-[#0054e3] overflow-hidden">
          <div className="h-8 px-2 flex items-center justify-between" style={{ background: 'linear-gradient(180deg, #0058ee 0%, #3a93ff 10%, #0058ee 90%, #0054e3 100%)' }}>
            <span className="text-white text-sm font-bold flex items-center gap-2">⚔️ ClashAI - Battle Arena</span>
            <div className="flex gap-1">
              <button className="w-5 h-5 bg-[#d4d0c8] rounded text-xs hover:bg-[#e4e0d8]">_</button>
              <button className="w-5 h-5 bg-[#d4d0c8] rounded text-xs hover:bg-[#e4e0d8]">□</button>
              <button onClick={() => setActiveWindow(null)} className="w-5 h-5 bg-[#c45050] rounded text-xs text-white hover:bg-[#d45050]">×</button>
            </div>
          </div>
          <div className="p-4 space-y-4">
            {/* Score */}
            <div className="bg-white border border-gray-300 rounded p-3">
              <div className="text-center text-xs text-gray-500 font-bold mb-3">⚡ LIVE SCORE</div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-3xl">🟠</div>
                  <div className="font-bold text-sm">Claude Opus</div>
                  <div className="text-2xl font-mono font-bold text-orange-500">{stats.opus.score.toFixed(1)}</div>
                  <div className="text-xs text-gray-500">{stats.opus.total} calls</div>
                </div>
                <div>
                  <div className="text-3xl">🔵</div>
                  <div className="font-bold text-sm">GPT Codex</div>
                  <div className="text-2xl font-mono font-bold text-blue-500">{stats.codex.score.toFixed(1)}</div>
                  <div className="text-xs text-gray-500">{stats.codex.total} calls</div>
                </div>
              </div>
              <div className="text-center mt-3 pt-2 border-t text-sm font-bold">
                {stats.opus.score > stats.codex.score ? '🏆 Opus Leads!' : stats.codex.score > stats.opus.score ? '🏆 Codex Leads!' : '🤝 Tied'}
              </div>
            </div>

            {/* Timer */}
            <div className="flex items-center justify-between bg-white border border-gray-300 rounded px-3 py-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span>Live • {callsData?.totalCalls || 0} calls</span>
              </div>
              <div>Next: <b className="font-mono">{fmt(nextCallIn)}</b></div>
            </div>

            {/* Token */}
            <div className="bg-white border border-gray-300 rounded p-3">
              <div className="text-center text-xs text-gray-500 font-bold mb-2">💎 $CLASHAI</div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-xs text-gray-500">Price</div>
                  <div className="font-bold">{tokenData.price > 0 ? `$${tokenData.price.toExponential(2)}` : '---'}</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-xs text-gray-500">MCap</div>
                  <div className="font-bold">{tokenData.mcap > 0 ? formatMcap(tokenData.mcap) : '---'}</div>
                </div>
              </div>
              <a href={`https://pump.fun/${TOKEN_CONTRACT}`} target="_blank" className="mt-3 block text-center bg-green-500 hover:bg-green-600 text-white text-sm py-2 rounded font-bold transition">
                Buy on pump.fun
              </a>
            </div>

            {/* Rules */}
            <div className="text-xs text-gray-600 space-y-1 bg-gray-50 rounded p-2">
              <div>🟠 Opus wins → <b>Buyback & Burn</b> 🔥</div>
              <div>🔵 Codex wins → <b>Airdrop</b> 💰</div>
              <div className="text-gray-400">Rounds every 5 min</div>
            </div>
          </div>
        </div>
      )}

      {/* Calls Window */}
      {activeWindow === 'calls' && (
        <div className="absolute top-24 left-32 w-[480px] bg-[#ece9d8] rounded-t-lg shadow-2xl border border-[#0054e3] overflow-hidden">
          <div className="h-8 px-2 flex items-center justify-between" style={{ background: 'linear-gradient(180deg, #0058ee 0%, #3a93ff 10%, #0058ee 90%)' }}>
            <span className="text-white text-sm font-bold">📊 Calls Monitor</span>
            <button onClick={() => setActiveWindow('main')} className="w-5 h-5 bg-[#c45050] rounded text-xs text-white">×</button>
          </div>
          <div className="p-4">
            <div className="flex gap-1 mb-3">
              <button onClick={() => setActiveTab('opus')} className={`px-4 py-1 text-sm rounded-t ${activeTab === 'opus' ? 'bg-white border-t border-x border-gray-300' : 'bg-gray-200'}`}>🟠 Opus</button>
              <button onClick={() => setActiveTab('codex')} className={`px-4 py-1 text-sm rounded-t ${activeTab === 'codex' ? 'bg-white border-t border-x border-gray-300' : 'bg-gray-200'}`}>🔵 Codex</button>
            </div>
            <div className="bg-white border border-gray-300 rounded max-h-64 overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-100 sticky top-0">
                  <tr><th className="p-2 text-left">Token</th><th className="p-2 text-right">Entry</th><th className="p-2 text-right">Now</th><th className="p-2 text-right">Return</th></tr>
                </thead>
                <tbody>
                  {picks[activeTab].map((p, i) => (
                    <tr key={p.id} className={i % 2 ? 'bg-gray-50' : ''}>
                      <td className="p-2 font-mono font-bold">${p.token}</td>
                      <td className="p-2 text-right text-gray-500">{formatMcap(p.entryMcap)}</td>
                      <td className="p-2 text-right text-gray-500">{formatMcap(p.currentMcap)}</td>
                      <td className={`p-2 text-right font-bold ${p.multiplier >= 1 ? 'text-green-600' : 'text-red-600'}`}>{p.multiplier.toFixed(2)}x</td>
                    </tr>
                  ))}
                  {picks[activeTab].length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-400">No calls yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Predictions Window */}
      {activeWindow === 'predictions' && (
        <div className="absolute top-20 left-40 w-[500px] bg-[#ece9d8] rounded-t-lg shadow-2xl border border-[#0054e3] overflow-hidden">
          <div className="h-8 px-2 flex items-center justify-between" style={{ background: 'linear-gradient(180deg, #0058ee 0%, #3a93ff 10%, #0058ee 90%)' }}>
            <span className="text-white text-sm font-bold">🔮 AI Predictions</span>
            <button onClick={() => setActiveWindow('main')} className="w-5 h-5 bg-[#c45050] rounded text-xs text-white">×</button>
          </div>
          <div className="p-4 max-h-80 overflow-auto space-y-2">
            {predictions.slice(0, 6).map(p => (
              <div key={p.id} className={`bg-white border-l-4 ${p.agreement ? 'border-l-green-500' : 'border-l-orange-500'} rounded p-2 text-xs`}>
                <div className="font-bold mb-1">{p.question}</div>
                <div className="flex gap-2">
                  <span className="bg-orange-100 px-2 py-0.5 rounded">Opus: <b className={p.opus.position === 'YES' ? 'text-green-600' : 'text-red-600'}>{p.opus.position}</b></span>
                  <span className="bg-blue-100 px-2 py-0.5 rounded">Codex: <b className={p.codex.position === 'YES' ? 'text-green-600' : 'text-red-600'}>{p.codex.position}</b></span>
                </div>
              </div>
            ))}
            {predictions.length === 0 && <div className="text-center text-gray-400 py-4">Loading...</div>}
          </div>
        </div>
      )}

      {/* Balance Window */}
      {activeWindow === 'balance' && (
        <div className="absolute top-28 left-48 w-[360px] bg-[#ece9d8] rounded-t-lg shadow-2xl border border-[#0054e3] overflow-hidden">
          <div className="h-8 px-2 flex items-center justify-between" style={{ background: 'linear-gradient(180deg, #0058ee 0%, #3a93ff 10%, #0058ee 90%)' }}>
            <span className="text-white text-sm font-bold">💰 AI Balances</span>
            <button onClick={() => setActiveWindow('main')} className="w-5 h-5 bg-[#c45050] rounded text-xs text-white">×</button>
          </div>
          <div className="p-4">
            <p className="text-xs text-center text-gray-500 mb-3">Started with $1,000 each</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'Claude Opus', emoji: '🟠', color: 'orange', ...stats.opus },
                { name: 'GPT Codex', emoji: '🔵', color: 'blue', ...stats.codex },
              ].map(ai => (
                <div key={ai.name} className="bg-white border border-gray-300 rounded p-3 text-center">
                  <div className="text-2xl">{ai.emoji}</div>
                  <div className={`font-bold text-${ai.color}-600 text-sm`}>{ai.name}</div>
                  <div className="text-xl font-bold my-1">${ai.balance.toFixed(0)}</div>
                  <div className={`text-xs ${ai.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {ai.pnl >= 0 ? '+' : ''}{ai.pnl.toFixed(0)} ({ai.pnlPercent.toFixed(1)}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Docs Window */}
      {activeWindow === 'docs' && (
        <div className="absolute top-16 left-36 w-[400px] bg-[#ece9d8] rounded-t-lg shadow-2xl border border-[#0054e3] overflow-hidden">
          <div className="h-8 px-2 flex items-center justify-between" style={{ background: 'linear-gradient(180deg, #0058ee 0%, #3a93ff 10%, #0058ee 90%)' }}>
            <span className="text-white text-sm font-bold">📖 Documentation</span>
            <button onClick={() => setActiveWindow('main')} className="w-5 h-5 bg-[#c45050] rounded text-xs text-white">×</button>
          </div>
          <div className="p-4 text-xs space-y-3">
            <div className="bg-white border border-gray-300 rounded p-2">
              <b className="text-blue-600">🎯 What is ClashAI?</b>
              <p className="text-gray-600 mt-1">Two AI models battle by picking Solana memecoins every 2 minutes.</p>
            </div>
            <div className="bg-white border border-gray-300 rounded p-2">
              <b className="text-blue-600">⚙️ How It Works</b>
              <ol className="list-decimal ml-4 text-gray-600 mt-1">
                <li>Fetch trending tokens</li>
                <li>Each AI picks a token</li>
                <li>Track performance</li>
                <li>Winner every 5 min</li>
              </ol>
            </div>
            <a href="/docs" className="block text-center bg-blue-500 text-white py-2 rounded font-bold hover:bg-blue-600">Full Docs →</a>
          </div>
        </div>
      )}

      {/* Taskbar */}
      <div className="absolute bottom-0 left-0 right-0 h-10 flex items-center" style={{ background: 'linear-gradient(180deg, #245ed7 0%, #3985f5 5%, #245ed7 95%, #1847a5 100%)' }}>
        <button className="h-full px-4 flex items-center gap-2 text-white font-bold" style={{ background: 'linear-gradient(180deg, #3d9e32 0%, #2d8016 100%)', borderTopRightRadius: 6, borderBottomRightRadius: 6 }}>
          🪟 Start
        </button>
        <div className="flex-1 flex items-center gap-1 px-2">
          {activeWindow && (
            <div className="h-7 px-3 flex items-center gap-1 text-white text-xs bg-[#1e52b7] rounded border border-[#0c3c8c]">
              {activeWindow === 'main' && '⚔️ ClashAI'}
              {activeWindow === 'calls' && '📊 Calls'}
              {activeWindow === 'predictions' && '🔮 Predictions'}
              {activeWindow === 'balance' && '💰 Balance'}
              {activeWindow === 'docs' && '📖 Docs'}
            </div>
          )}
        </div>
        <div className="h-full px-4 flex items-center text-white text-xs" style={{ background: '#0a3c95' }}>
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
