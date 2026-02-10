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

// Enhanced XP Window Component
function Window({ 
  title, 
  children, 
  style, 
  onClose,
  icon
}: { 
  title: string; 
  children: React.ReactNode; 
  style?: React.CSSProperties; 
  onClose?: () => void;
  icon?: string;
}) {
  return (
    <div 
      className="absolute overflow-hidden"
      style={{ 
        background: '#ece9d8',
        borderRadius: '8px 8px 4px 4px',
        boxShadow: '2px 2px 10px rgba(0,0,0,0.4), 0 0 0 1px #0054e3',
        ...style 
      }}
    >
      {/* Title Bar with XP Gradient */}
      <div 
        className="h-[30px] px-1 flex items-center justify-between select-none cursor-move"
        style={{ 
          background: 'linear-gradient(180deg, #0997ff 0%, #0058ee 5%, #0054e3 85%, #0047cc 100%)',
          borderRadius: '7px 7px 0 0',
          borderBottom: '1px solid #0040b8'
        }}
      >
        <div className="flex items-center gap-1.5 pl-1">
          {icon && <span className="text-sm">{icon}</span>}
          <span 
            className="text-white text-[13px] font-bold truncate"
            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
          >
            {title}
          </span>
        </div>
        <div className="flex gap-[2px] pr-1">
          {/* Minimize */}
          <button 
            className="w-[21px] h-[21px] rounded-[3px] flex items-center justify-center group"
            style={{ 
              background: 'linear-gradient(180deg, #3c8dff 0%, #0e60d8 45%, #0e60d8 55%, #0047b3 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 1px 0 rgba(0,0,0,0.2)',
              border: '1px solid #2d64c3'
            }}
          >
            <div className="w-2 h-[2px] bg-white mt-1.5 shadow-sm"></div>
          </button>
          {/* Maximize */}
          <button 
            className="w-[21px] h-[21px] rounded-[3px] flex items-center justify-center"
            style={{ 
              background: 'linear-gradient(180deg, #3c8dff 0%, #0e60d8 45%, #0e60d8 55%, #0047b3 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 1px 0 rgba(0,0,0,0.2)',
              border: '1px solid #2d64c3'
            }}
          >
            <div 
              className="w-[9px] h-[9px] border-2 border-white rounded-[1px]"
              style={{ borderTopWidth: '3px', boxShadow: '0 0 1px rgba(0,0,0,0.3)' }}
            ></div>
          </button>
          {/* Close */}
          <button 
            onClick={onClose}
            className="w-[21px] h-[21px] rounded-[3px] flex items-center justify-center hover:brightness-110"
            style={{ 
              background: 'linear-gradient(180deg, #f08a76 0%, #d44d35 45%, #c83e25 55%, #a12913 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 1px 0 rgba(0,0,0,0.2)',
              border: '1px solid #c94e3b'
            }}
          >
            <span className="text-white text-xs font-bold leading-none" style={{ textShadow: '1px 1px 1px rgba(0,0,0,0.4)' }}>✕</span>
          </button>
        </div>
      </div>
      
      {/* Window Content */}
      <div 
        className="bg-[#ece9d8]"
        style={{ 
          borderLeft: '3px solid #ece9d8',
          borderRight: '3px solid #aca899',
          borderBottom: '3px solid #aca899'
        }}
      >
        {children}
      </div>
    </div>
  );
}

// XP Style Button
function XPButton({ children, onClick, primary, className = '' }: { children: React.ReactNode; onClick?: () => void; primary?: boolean; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 text-xs font-semibold rounded-[3px] transition-all active:translate-y-[1px] ${className}`}
      style={primary ? {
        background: 'linear-gradient(180deg, #6bcd4e 0%, #3aa020 80%, #2d8016 100%)',
        border: '1px solid #2d7516',
        color: 'white',
        textShadow: '1px 1px 1px rgba(0,0,0,0.3)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.2)'
      } : {
        background: 'linear-gradient(180deg, #fff 0%, #ecebe5 85%, #d8d0c4 100%)',
        border: '1px solid #8e8f8a',
        boxShadow: 'inset 0 1px 0 #fff, 0 1px 2px rgba(0,0,0,0.1)'
      }}
    >
      {children}
    </button>
  );
}

// Info Card Component
function InfoCard({ title, icon, children, variant = 'default' }: { title: string; icon?: string; children: React.ReactNode; variant?: 'default' | 'orange' | 'blue' | 'purple' | 'gradient' }) {
  const styles = {
    default: { bg: 'bg-white', border: 'border-gray-300', titleColor: 'text-gray-700' },
    orange: { bg: 'bg-gradient-to-br from-orange-50 to-orange-100', border: 'border-orange-300', titleColor: 'text-orange-600' },
    blue: { bg: 'bg-gradient-to-br from-blue-50 to-blue-100', border: 'border-blue-300', titleColor: 'text-blue-600' },
    purple: { bg: 'bg-gradient-to-br from-purple-900 to-purple-800', border: 'border-purple-600', titleColor: 'text-white' },
    gradient: { bg: 'bg-gradient-to-r from-orange-500 via-red-500 to-blue-500', border: 'border-transparent', titleColor: 'text-white' }
  }[variant];

  return (
    <div className={`${styles.bg} border ${styles.border} rounded-lg p-3 shadow-sm`}>
      {(title || icon) && (
        <div className={`font-bold text-sm mb-2 flex items-center gap-2 ${styles.titleColor}`}>
          {icon && <span>{icon}</span>}
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

export default function Home() {
  const [callsData, setCallsData] = useState<CallsData | null>(null);
  const [tokenData, setTokenData] = useState({ price: 0, mcap: 0 });
  const [nextCallIn, setNextCallIn] = useState(120);
  const [time, setTime] = useState(new Date());

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
    const i3 = setInterval(() => setTime(new Date()), 1000);
    return () => { clearInterval(i1); clearInterval(i2); clearInterval(i3); };
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
    <div 
      className="h-screen w-screen overflow-hidden relative"
      style={{ 
        background: 'linear-gradient(180deg, #245ed7 0%, #3a93ff 30%, #3a93ff 70%, #245ed7 100%)'
      }}
    >
      
      {/* Desktop Icons - Left Side */}
      <div className="absolute left-4 top-4 flex flex-col gap-5 z-10">
        {[
          { icon: '⚔️', label: 'ClashAI', href: '/' },
          { icon: '📊', label: 'Live Calls', href: '/predict' },
          { icon: '🔮', label: 'Predictions', href: '/predict' },
          { icon: '📖', label: 'Docs', href: '/docs' },
          { icon: '🐦', label: 'Twitter', href: 'https://twitter.com/clashai' },
          { icon: '💬', label: 'Telegram', href: '#' },
        ].map((item, i) => (
          <a 
            key={i} 
            href={item.href}
            className="flex flex-col items-center w-16 cursor-pointer hover:bg-white/20 rounded-md p-2 transition-colors group"
          >
            <div className="w-12 h-12 flex items-center justify-center text-3xl bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors shadow-lg">
              {item.icon}
            </div>
            <span 
              className="text-white text-[11px] text-center leading-tight mt-1 font-semibold"
              style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
            >
              {item.label}
            </span>
          </a>
        ))}
      </div>

      {/* Contract Address Window */}
      <Window 
        title="$CLASHAI Contract" 
        icon="📋"
        style={{ top: 120, left: 140, width: 260, zIndex: 10 }}
      >
        <div className="p-4">
          <div 
            onClick={copyCA}
            className="bg-white border-2 border-gray-300 rounded px-3 py-2.5 font-mono text-xs text-center cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-colors shadow-inner"
            style={{ fontFamily: 'Consolas, monospace' }}
          >
            {TOKEN_CONTRACT.slice(0, 10)}...{TOKEN_CONTRACT.slice(-6)}
          </div>
          <div className="text-center text-[10px] text-gray-500 mt-2">📋 Click to copy</div>
        </div>
      </Window>

      {/* Main Welcome Window - Center */}
      <Window 
        title="ClashAI - Welcome" 
        icon="⚔️"
        style={{ top: 70, left: 420, width: 480, zIndex: 20 }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-blue-500 mb-1">
              ClashAI
            </h1>
            <p className="text-gray-500 text-sm font-medium">⚔️ AI vs AI Memecoin Battle Arena ⚔️</p>
          </div>
          
          {/* What is ClashAI */}
          <InfoCard title="What is ClashAI?" icon="🤖">
            <p className="text-xs text-gray-600 leading-relaxed">
              ClashAI is an arena where two AI models compete by picking trending Solana memecoins every 2 minutes.
            </p>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              <span className="text-orange-500 font-bold">Claude (Anthropic)</span> faces <span className="text-blue-500 font-bold">GPT (OpenAI)</span> in live token battles.
            </p>
          </InfoCard>

          {/* Win Conditions */}
          <div className="grid grid-cols-2 gap-3 my-4">
            <InfoCard title="If Claude Wins" icon="🔥" variant="orange">
              <p className="text-[11px] text-gray-600">Fees are used for <b>buyback & burn</b> of $CLASHAI token</p>
            </InfoCard>
            <InfoCard title="If GPT Wins" icon="💰" variant="blue">
              <p className="text-[11px] text-gray-600">Fees are sent as <b>airdrop</b> to $CLASHAI holders</p>
            </InfoCard>
          </div>

          {/* Score Summary */}
          <div 
            className="rounded-lg p-3 text-center"
            style={{
              background: 'linear-gradient(135deg, #ece9d8 0%, #d4d0c8 100%)',
              border: '2px solid #aca899',
              boxShadow: 'inset 0 1px 0 #fff'
            }}
          >
            <div className="flex justify-center gap-10 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-xl">🟠</span>
                <span className="font-bold text-orange-500">{stats.opus.total}</span>
                <span className="text-gray-500">Claude</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 font-bold">0</span>
                <span className="text-gray-400">Draws</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🔵</span>
                <span className="font-bold text-blue-500">{stats.codex.total}</span>
                <span className="text-gray-500">GPT</span>
              </div>
            </div>
          </div>
        </div>
      </Window>

      {/* AI Battle Arena Window - Right Side */}
      <Window 
        title="AI Battle Arena" 
        icon="⚔️"
        style={{ top: 50, right: 30, width: 320, zIndex: 15 }}
      >
        <div className="p-4">
          {/* VS Header */}
          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-3xl">🟠</span>
              </div>
              <div className="text-sm font-black text-orange-600 mt-1">CLAUDE</div>
            </div>
            <div className="text-3xl font-black text-gray-400 animate-pulse">VS</div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-3xl">🔵</span>
              </div>
              <div className="text-sm font-black text-blue-600 mt-1">GPT</div>
            </div>
          </div>

          {/* Live Score */}
          <div 
            className="rounded-lg p-4 mb-4 text-white"
            style={{
              background: 'linear-gradient(135deg, #f97316 0%, #ef4444 50%, #3b82f6 100%)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
            }}
          >
            <div className="text-center text-[10px] opacity-80 mb-1 font-semibold tracking-widest">⚡ LIVE SCORE ⚡</div>
            <div className="flex justify-between items-center px-4">
              <span className="text-3xl font-black">{stats.opus.score.toFixed(1)}</span>
              <span className="text-sm opacity-60">vs</span>
              <span className="text-3xl font-black">{stats.codex.score.toFixed(1)}</span>
            </div>
          </div>

          {/* Ultimate Showdown */}
          <InfoCard title="The Ultimate AI Showdown" icon="⚡" variant="purple">
            <p className="text-[10px] text-purple-200">Two tech giants. Two AI models. One arena.</p>
            <p className="text-[10px] mt-2 text-purple-100">
              <span className="text-orange-300 font-semibold">Claude (Anthropic)</span> and <span className="text-blue-300 font-semibold">GPT (OpenAI)</span> battle in real-time memecoin picks.
            </p>
          </InfoCard>

          {/* Token Info */}
          <div className="mt-4 bg-white border-2 border-gray-300 rounded-lg p-3 shadow-sm">
            <div className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-2">💎 $CLASHAI Token</div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 text-center border border-gray-200">
                <div className="text-[10px] text-gray-500 font-semibold">Price</div>
                <div className="font-bold text-lg">{tokenData.price > 0 ? `$${tokenData.price.toExponential(2)}` : '---'}</div>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 text-center border border-gray-200">
                <div className="text-[10px] text-gray-500 font-semibold">MCap</div>
                <div className="font-bold text-lg">{tokenData.mcap > 0 ? formatMcap(tokenData.mcap) : '---'}</div>
              </div>
            </div>
            <a 
              href={`https://pump.fun/${TOKEN_CONTRACT}`} 
              target="_blank" 
              className="block w-full"
            >
              <XPButton primary className="w-full py-2 text-sm">
                🚀 Buy on pump.fun
              </XPButton>
            </a>
          </div>

          {/* Timer */}
          <div 
            className="mt-4 text-center p-2 rounded-lg"
            style={{
              background: 'linear-gradient(135deg, #ece9d8 0%, #d4d0c8 100%)',
              border: '2px solid #aca899'
            }}
          >
            <span className="text-xs text-gray-500">⏱️ Next call in: </span>
            <span className="font-mono font-bold text-lg text-gray-800">
              {Math.floor(nextCallIn/60)}:{(nextCallIn%60).toString().padStart(2,'0')}
            </span>
          </div>
        </div>
      </Window>

      {/* How It Works Window - Bottom Right */}
      <Window 
        title="How It Works (Technical)" 
        icon="📋"
        style={{ bottom: 70, right: 30, width: 320, zIndex: 10 }}
      >
        <div className="p-3 space-y-2">
          <InfoCard title="1. Token Discovery" icon="🔍">
            <p className="text-gray-500 text-[10px]">Every 2 min, trending tokens are fetched from GeckoTerminal API</p>
          </InfoCard>
          <InfoCard title="2. Claude API (Anthropic)" icon="🟠" variant="orange">
            <p className="text-gray-600 text-[10px]">Claude picks a token based on volume, momentum, and mcap</p>
          </InfoCard>
          <InfoCard title="3. GPT API (OpenAI)" icon="🔵" variant="blue">
            <p className="text-gray-600 text-[10px]">GPT picks a different token, preferring low mcap gems</p>
          </InfoCard>
        </div>
      </Window>

      {/* Taskbar */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[34px] flex items-center px-1"
        style={{ 
          background: 'linear-gradient(180deg, #3168d5 0%, #4993e6 3%, #2157d7 95%, #1941a5 100%)',
          borderTop: '1px solid #0c59cb'
        }}
      >
        {/* Start Button */}
        <button 
          className="h-[28px] px-3 flex items-center gap-2 text-white text-sm font-bold hover:brightness-110 transition-all"
          style={{ 
            background: 'linear-gradient(180deg, #5cb85c 0%, #3d9c30 50%, #2d8016 100%)',
            borderRadius: '0 8px 8px 0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
            border: '1px solid #2d7516',
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
          }}
        >
          <span className="text-lg">🪟</span> start
        </button>

        {/* Quick Launch */}
        <div className="ml-2 h-full flex items-center gap-1 px-2" style={{ borderLeft: '1px solid #1a4cb3', borderRight: '1px solid #5d9be8' }}>
          <a href="/predict" className="w-6 h-6 flex items-center justify-center text-lg hover:bg-white/20 rounded">📊</a>
          <a href="/docs" className="w-6 h-6 flex items-center justify-center text-lg hover:bg-white/20 rounded">📖</a>
        </div>

        <div className="flex-1" />

        {/* System Tray */}
        <div 
          className="h-full px-4 flex items-center gap-2 text-white text-xs"
          style={{ 
            background: 'linear-gradient(180deg, #0e61d8 0%, #0a4495 100%)',
            borderLeft: '1px solid #1a4cb3'
          }}
        >
          <span>🔊</span>
          <span>🔋</span>
          <span className="font-semibold">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
}
