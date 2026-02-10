'use client';

import { useEffect, useState } from 'react';

const TOKEN_CONTRACT = '8prgMW875TUV1pqJgGdier376YD9gFPzF2rEiDfSpump';

interface CallsData {
  opus: { stats: any; recent: any[]; };
  codex: { stats: any; recent: any[]; };
  totalCalls: number;
}

function formatMcap(mcap: number): string {
  if (mcap >= 1000000) return `$${(mcap / 1000000).toFixed(2)}M`;
  if (mcap >= 1000) return `$${(mcap / 1000).toFixed(1)}K`;
  return `$${mcap.toFixed(0)}`;
}

// XP Window Component
function Window({ title, children, style, onClose }: { title: string; children: React.ReactNode; style?: React.CSSProperties; onClose?: () => void }) {
  return (
    <div className="absolute bg-[#ece9d8] rounded-t-lg shadow-xl overflow-hidden" style={{ border: '1px solid #0054e3', ...style }}>
      {/* Title Bar */}
      <div 
        className="h-7 px-2 flex items-center justify-between select-none"
        style={{ background: 'linear-gradient(180deg, #0997ff 0%, #0053ee 8%, #0050ee 92%, #0046d5 100%)' }}
      >
        <span className="text-white text-xs font-bold truncate">{title}</span>
        <div className="flex gap-[2px]">
          <button className="w-[21px] h-[21px] rounded-sm text-[10px] flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #3c8eff 0%, #1e5dcd 50%)', border: '1px solid #3169c6' }}>
            <span className="text-white">_</span>
          </button>
          <button className="w-[21px] h-[21px] rounded-sm text-[10px] flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #3c8eff 0%, #1e5dcd 50%)', border: '1px solid #3169c6' }}>
            <span className="text-white">□</span>
          </button>
          {onClose && (
            <button onClick={onClose} className="w-[21px] h-[21px] rounded-sm text-[10px] flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #e97458 0%, #c92b0e 50%)', border: '1px solid #c94e3b' }}>
              <span className="text-white font-bold">×</span>
            </button>
          )}
        </div>
      </div>
      {/* Content */}
      <div className="bg-[#f1efe2]">{children}</div>
    </div>
  );
}

export default function Home() {
  const [callsData, setCallsData] = useState<CallsData | null>(null);
  const [tokenData, setTokenData] = useState({ price: 0, mcap: 0 });
  const [nextCallIn, setNextCallIn] = useState(120);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/calls');
        if (res.ok) setCallsData(await res.json());
      } catch {}
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
    fetchData(); fetchToken();
    const i1 = setInterval(fetchData, 30000);
    const i2 = setInterval(fetchToken, 15000);
    return () => { clearInterval(i1); clearInterval(i2); };
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      if (callsData?.opus?.recent?.[0]?.calledAt) {
        const r = Math.max(0, Math.floor((new Date(callsData.opus.recent[0].calledAt).getTime() + 120000 - Date.now()) / 1000));
        setNextCallIn(r > 120 ? 120 : r);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [callsData]);

  const stats = {
    opus: callsData?.opus?.stats || { total: 0, score: 0, balance: 1000, pnl: 0, pnlPercent: 0, avg: 0, best: 0 },
    codex: callsData?.codex?.stats || { total: 0, score: 0, balance: 1000, pnl: 0, pnlPercent: 0, avg: 0, best: 0 }
  };

  const copyCA = () => navigator.clipboard.writeText(TOKEN_CONTRACT);

  return (
    <div className="h-screen w-screen overflow-hidden relative" style={{ background: 'linear-gradient(180deg, #245ed7 0%, #3d8ef7 50%, #3d8ef7 100%)' }}>
      
      {/* Desktop Icons - Left Side */}
      <div className="absolute left-3 top-3 flex flex-col gap-4 z-10">
        {[
          { icon: '⚔️', label: 'ClashAI' },
          { icon: '📊', label: 'Calls' },
          { icon: '🔮', label: 'Predictions' },
          { icon: '💰', label: 'Balance' },
          { icon: '📖', label: 'Docs' },
          { icon: '🐦', label: 'Twitter' },
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center w-16 cursor-pointer hover:bg-blue-400/30 rounded p-1">
            <div className="w-10 h-10 flex items-center justify-center text-2xl">{item.icon}</div>
            <span className="text-white text-[10px] text-center leading-tight" style={{ textShadow: '1px 1px 1px #000' }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Contract Address Window - Floating */}
      <Window title="$CLASHAI Contract Address" style={{ top: 200, left: 250, width: 280 }}>
        <div className="p-3">
          <div 
            onClick={copyCA}
            className="bg-white border border-gray-400 rounded px-3 py-2 font-mono text-xs text-center cursor-pointer hover:bg-gray-50"
          >
            {TOKEN_CONTRACT.slice(0, 8)}...{TOKEN_CONTRACT.slice(-4)}
          </div>
          <div className="text-center text-[10px] text-gray-500 mt-1">Click to copy</div>
        </div>
      </Window>

      {/* Main Welcome Window - Center */}
      <Window title="ClashAI - Welcome" style={{ top: 100, left: 380, width: 450 }}>
        <div className="p-6">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-1">ClashAI</h1>
          <p className="text-center text-gray-500 text-sm mb-6">AI vs AI Memecoin Battle Arena</p>
          
          <div className="bg-white border border-gray-300 rounded p-4 mb-4">
            <h3 className="font-bold text-sm mb-2 flex items-center gap-2">🤖 What is ClashAI?</h3>
            <p className="text-xs text-gray-600">
              ClashAI is an arena where two AI models compete by picking trending Solana memecoins every 2 minutes.
            </p>
            <p className="text-xs text-gray-600 mt-2">
              <span className="text-orange-500 font-bold">Claude (Anthropic)</span> faces <span className="text-blue-500 font-bold">GPT (OpenAI)</span> in live token battles.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-orange-50 border border-orange-200 rounded p-3">
              <div className="font-bold text-sm text-orange-600 mb-1">🔥 If Claude Wins</div>
              <p className="text-[11px] text-gray-600">Fees are used for <b>buyback & burn</b> of $CLASHAI token</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="font-bold text-sm text-blue-600 mb-1">💰 If GPT Wins</div>
              <p className="text-[11px] text-gray-600">Fees are sent as <b>airdrop</b> to $CLASHAI holders</p>
            </div>
          </div>

          <div className="flex justify-center gap-8 text-center text-xs text-gray-500 border-t pt-3">
            <div><span className="font-bold text-orange-500">{stats.opus.total}</span> Claude</div>
            <div><span className="font-bold text-gray-400">0</span> Draws</div>
            <div><span className="font-bold text-blue-500">{stats.codex.total}</span> GPT</div>
          </div>
        </div>
      </Window>

      {/* AI Battle Arena Window - Right Side */}
      <Window title="⚔️ AI Battle Arena" style={{ top: 60, right: 20, width: 300 }}>
        <div className="p-4">
          {/* VS Header */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="text-center">
              <div className="text-4xl">🟠</div>
              <div className="text-xs font-bold text-orange-600">CLAUDE</div>
            </div>
            <div className="text-2xl font-bold text-gray-400">VS</div>
            <div className="text-center">
              <div className="text-4xl">🔵</div>
              <div className="text-xs font-bold text-blue-600">GPT</div>
            </div>
          </div>

          {/* Score */}
          <div className="bg-gradient-to-r from-orange-500 to-blue-500 text-white rounded p-3 mb-4">
            <div className="text-center text-[10px] opacity-80 mb-1">LIVE SCORE</div>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold">{stats.opus.score.toFixed(1)}</span>
              <span className="text-xs opacity-80">vs</span>
              <span className="text-2xl font-bold">{stats.codex.score.toFixed(1)}</span>
            </div>
          </div>

          {/* The Ultimate AI Showdown */}
          <div className="bg-purple-900 text-white rounded p-3 mb-3">
            <div className="font-bold text-sm mb-1">⚡ The Ultimate AI Showdown</div>
            <p className="text-[10px] opacity-80">Two tech giants. Two AI models. One arena.</p>
            <p className="text-[10px] mt-2">
              <span className="text-orange-300">Claude (Anthropic)</span> and <span className="text-blue-300">GPT (OpenAI)</span> battle in real-time memecoin picks.
            </p>
          </div>

          {/* Token Info */}
          <div className="bg-white border border-gray-300 rounded p-3 mb-3">
            <div className="text-xs font-bold text-gray-600 mb-2">💎 $CLASHAI Token</div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-gray-50 rounded p-2">
                <div className="text-[10px] text-gray-500">Price</div>
                <div className="font-bold text-sm">{tokenData.price > 0 ? `$${tokenData.price.toExponential(2)}` : '---'}</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-[10px] text-gray-500">MCap</div>
                <div className="font-bold text-sm">{tokenData.mcap > 0 ? formatMcap(tokenData.mcap) : '---'}</div>
              </div>
            </div>
            <a href={`https://pump.fun/${TOKEN_CONTRACT}`} target="_blank" className="block mt-2 bg-green-500 hover:bg-green-600 text-white text-center text-xs py-2 rounded font-bold">
              Buy on pump.fun
            </a>
          </div>

          {/* Timer */}
          <div className="text-center text-xs text-gray-500">
            Next call in: <span className="font-mono font-bold">{Math.floor(nextCallIn/60)}:{(nextCallIn%60).toString().padStart(2,'0')}</span>
          </div>
        </div>
      </Window>

      {/* How It Works Window - Bottom Right */}
      <Window title="📋 How It Works (Technical)" style={{ bottom: 60, right: 20, width: 300 }}>
        <div className="p-3 text-xs space-y-2">
          <div className="bg-white border border-gray-300 rounded p-2">
            <div className="font-bold mb-1">1. Token Discovery</div>
            <p className="text-gray-500 text-[10px]">Every 2 min, trending tokens are fetched from GeckoTerminal API</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded p-2">
            <div className="font-bold text-orange-600 mb-1">2. Claude API (Anthropic)</div>
            <p className="text-gray-500 text-[10px]">Claude picks a token based on volume, momentum, and mcap</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded p-2">
            <div className="font-bold text-blue-600 mb-1">3. GPT API (OpenAI)</div>
            <p className="text-gray-500 text-[10px]">GPT picks a different token, preferring low mcap gems</p>
          </div>
        </div>
      </Window>

      {/* Taskbar */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[30px] flex items-center"
        style={{ background: 'linear-gradient(180deg, #3168d5 0%, #4993e6 3%, #2157d7 95%, #1941a5 100%)' }}
      >
        <button 
          className="h-full px-4 flex items-center gap-2 text-white text-sm font-bold"
          style={{ background: 'linear-gradient(180deg, #5cb85c 0%, #3d8b3d 100%)', borderRadius: '0 5px 0 0' }}
        >
          <span>🪟</span> start
        </button>
        <div className="flex-1" />
        <div className="h-full px-4 flex items-center text-white text-xs" style={{ background: '#0a4495' }}>
          🔊 {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
