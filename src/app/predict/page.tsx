'use client';

import { useEffect, useState } from 'react';

interface BattleData {
  currentBattle: {
    roundId: number;
    status: string;
    startedAt: string;
    endsAt: string;
    opus: { token: string; entryMcap: number; currentMcap: number; multiplier: number; reasoning: string } | null;
    codex: { token: string; entryMcap: number; currentMcap: number; multiplier: number; reasoning: string } | null;
  } | null;
  stats: {
    opus: { wins: number; winRate: number };
    codex: { wins: number; winRate: number };
  };
}

interface Prediction {
  odid: string;
  roundId: number;
  choice: 'opus' | 'codex';
  timestamp: number;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  streak: number;
  predictions: number;
  winRate: number;
}

function getTimeRemaining(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return '00:00:00';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function PredictPage() {
  const [data, setData] = useState<BattleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState('--:--:--');
  const [myPrediction, setMyPrediction] = useState<Prediction | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<'opus' | 'codex' | null>(null);
  
  // Mock leaderboard (in real app, this comes from API/DB)
  const [leaderboard] = useState<LeaderboardEntry[]>([
    { id: '1', name: 'CryptoKing', score: 2450, streak: 5, predictions: 23, winRate: 67.4 },
    { id: '2', name: 'DegenMaster', score: 2180, streak: 3, predictions: 31, winRate: 58.1 },
    { id: '3', name: 'AIWhisperer', score: 1920, streak: 0, predictions: 18, winRate: 72.2 },
    { id: '4', name: 'PumpHunter', score: 1650, streak: 2, predictions: 27, winRate: 51.9 },
    { id: '5', name: 'SolanaSniper', score: 1420, streak: 1, predictions: 15, winRate: 60.0 },
  ]);

  // Live predictions count (mock)
  const [livePredictions, setLivePredictions] = useState({ opus: 47, codex: 53 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/battle');
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error('Failed to fetch:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!data?.currentBattle?.endsAt) return;
    const updateCountdown = () => setCountdown(getTimeRemaining(data.currentBattle!.endsAt));
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [data?.currentBattle?.endsAt]);

  // Load saved prediction and name
  useEffect(() => {
    const saved = localStorage.getItem('clash_prediction');
    const savedName = localStorage.getItem('clash_player_name');
    if (saved) setMyPrediction(JSON.parse(saved));
    if (savedName) setPlayerName(savedName);
  }, []);

  const handlePrediction = (choice: 'opus' | 'codex') => {
    if (!playerName) {
      setSelectedChoice(choice);
      setShowNameInput(true);
      return;
    }

    submitPrediction(choice);
  };

  const submitPrediction = (choice: 'opus' | 'codex') => {
    if (!data?.currentBattle) return;

    const prediction: Prediction = {
      odid: Math.random().toString(36).substr(2, 9),
      roundId: data.currentBattle.roundId,
      choice,
      timestamp: Date.now(),
    };

    setMyPrediction(prediction);
    localStorage.setItem('clash_prediction', JSON.stringify(prediction));
    localStorage.setItem('clash_player_name', playerName);
    setShowNameInput(false);

    // Update live predictions (mock)
    setLivePredictions(prev => ({
      ...prev,
      [choice]: prev[choice] + 1
    }));
  };

  const battle = data?.currentBattle;
  const stats = data?.stats;
  const opusPercent = (livePredictions.opus / (livePredictions.opus + livePredictions.codex) * 100);
  const codexPercent = 100 - opusPercent;

  const alreadyPredicted = myPrediction && battle && myPrediction.roundId === battle.roundId;

  return (
    <div className="min-h-screen bg-[#d4e8d1] pt-20">
      <div className="max-w-6xl mx-auto p-4">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#2d5a3d] mb-2">🎯 Prediction Arena</h1>
          <p className="text-[#4a8f5c]">Predict which AI wins and climb the leaderboard!</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Main Prediction Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Current Battle Card */}
            <div className="bg-white rounded-2xl border-4 border-[#2d5a3d] shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                  <span className="font-bold text-[#2d5a3d]">LIVE ROUND #{battle?.roundId || '...'}</span>
                </div>
                <div className="bg-[#2d5a3d] text-white px-4 py-2 rounded-xl font-mono">
                  ⏱️ {countdown}
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12 text-gray-500">Loading battle...</div>
              ) : battle ? (
                <>
                  {/* VS Display */}
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    {/* Opus Side */}
                    <div 
                      onClick={() => !alreadyPredicted && handlePrediction('opus')}
                      className={`relative rounded-xl p-5 border-3 transition-all cursor-pointer ${
                        alreadyPredicted && myPrediction?.choice === 'opus'
                          ? 'bg-[#f0b866] border-[#d4a050] ring-4 ring-[#f0b866]/50'
                          : alreadyPredicted
                          ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                          : 'bg-gradient-to-br from-[#fff8e8] to-[#fff0d0] border-[#f0b866] hover:scale-[1.02] hover:shadow-lg'
                      }`}
                    >
                      {alreadyPredicted && myPrediction?.choice === 'opus' && (
                        <div className="absolute -top-3 -right-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                          ✓ Your Pick
                        </div>
                      )}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-14 h-14 bg-[#f0b866] rounded-xl flex items-center justify-center text-3xl">
                          🧠
                        </div>
                        <div>
                          <div className="font-bold text-lg text-[#8a6830]">Claude Opus</div>
                          <div className="text-sm text-[#b89860]">{(stats?.opus?.winRate || 0).toFixed(1)}% historical W/R</div>
                        </div>
                      </div>
                      {battle.opus && (
                        <div className="bg-white/60 rounded-lg p-3">
                          <div className="font-mono font-bold text-[#2d5a3d]">${battle.opus.token}</div>
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2">"{battle.opus.reasoning}"</div>
                        </div>
                      )}
                    </div>

                    {/* Codex Side */}
                    <div 
                      onClick={() => !alreadyPredicted && handlePrediction('codex')}
                      className={`relative rounded-xl p-5 border-3 transition-all cursor-pointer ${
                        alreadyPredicted && myPrediction?.choice === 'codex'
                          ? 'bg-[#66b8f0] border-[#5090c0] ring-4 ring-[#66b8f0]/50'
                          : alreadyPredicted
                          ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                          : 'bg-gradient-to-br from-[#e8f4ff] to-[#d0e8ff] border-[#66b8f0] hover:scale-[1.02] hover:shadow-lg'
                      }`}
                    >
                      {alreadyPredicted && myPrediction?.choice === 'codex' && (
                        <div className="absolute -top-3 -right-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                          ✓ Your Pick
                        </div>
                      )}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-14 h-14 bg-[#66b8f0] rounded-xl flex items-center justify-center text-3xl">
                          🤖
                        </div>
                        <div>
                          <div className="font-bold text-lg text-[#306088]">OpenAI Codex</div>
                          <div className="text-sm text-[#6098b8]">{(stats?.codex?.winRate || 0).toFixed(1)}% historical W/R</div>
                        </div>
                      </div>
                      {battle.codex && (
                        <div className="bg-white/60 rounded-lg p-3">
                          <div className="font-mono font-bold text-[#2d5a3d]">${battle.codex.token}</div>
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2">"{battle.codex.reasoning}"</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Live Prediction Bar */}
                  <div className="bg-[#f0f7f1] rounded-xl p-4 border-2 border-[#d4e8d1]">
                    <div className="text-sm text-gray-500 mb-2 text-center">
                      Community Predictions ({livePredictions.opus + livePredictions.codex} total)
                    </div>
                    <div className="h-8 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-[#f0b866] flex items-center justify-center text-sm font-bold text-white transition-all duration-500"
                        style={{ width: `${opusPercent}%` }}
                      >
                        {opusPercent.toFixed(0)}%
                      </div>
                      <div 
                        className="bg-[#66b8f0] flex items-center justify-center text-sm font-bold text-white transition-all duration-500"
                        style={{ width: `${codexPercent}%` }}
                      >
                        {codexPercent.toFixed(0)}%
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>🧠 Opus ({livePredictions.opus})</span>
                      <span>Codex ({livePredictions.codex}) 🤖</span>
                    </div>
                  </div>

                  {!alreadyPredicted && (
                    <div className="text-center text-sm text-gray-500 mt-4">
                      👆 Click on an AI to make your prediction
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">⏳</div>
                  <div className="text-gray-500">Waiting for next battle...</div>
                </div>
              )}
            </div>

            {/* Rewards Info */}
            <div className="bg-white rounded-2xl border-4 border-[#2d5a3d] shadow-lg p-6">
              <h3 className="font-bold text-lg text-[#2d5a3d] mb-4">🏆 How Scoring Works</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-[#f0f7f1] rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">✅</div>
                  <div className="font-bold text-[#2d5a3d]">+100 pts</div>
                  <div className="text-sm text-gray-500">Correct prediction</div>
                </div>
                <div className="bg-[#f0f7f1] rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">🔥</div>
                  <div className="font-bold text-[#2d5a3d]">+50 bonus</div>
                  <div className="text-sm text-gray-500">Win streak (3+)</div>
                </div>
                <div className="bg-[#f0f7f1] rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">🎯</div>
                  <div className="font-bold text-[#2d5a3d]">+25 bonus</div>
                  <div className="text-sm text-gray-500">Underdog pick wins</div>
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboard Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border-4 border-[#2d5a3d] shadow-lg p-6">
              <h3 className="font-bold text-lg text-[#2d5a3d] mb-4 flex items-center gap-2">
                <span>🏅</span> Top Predictors
              </h3>
              <div className="space-y-3">
                {leaderboard.map((player, index) => (
                  <div 
                    key={player.id}
                    className={`flex items-center gap-3 p-3 rounded-xl ${
                      index === 0 ? 'bg-yellow-50 border-2 border-yellow-200' :
                      index === 1 ? 'bg-gray-50 border-2 border-gray-200' :
                      index === 2 ? 'bg-orange-50 border-2 border-orange-200' :
                      'bg-[#f0f7f1]'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-400 text-yellow-900' :
                      index === 1 ? 'bg-gray-300 text-gray-700' :
                      index === 2 ? 'bg-orange-400 text-orange-900' :
                      'bg-[#4a8f5c] text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{player.name}</div>
                      <div className="text-xs text-gray-500">
                        {player.winRate.toFixed(1)}% W/R • {player.streak > 0 ? `🔥${player.streak}` : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#2d5a3d]">{player.score.toLocaleString()}</div>
                      <div className="text-xs text-gray-400">pts</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-4 bg-[#2d5a3d] text-white py-2 rounded-xl font-medium hover:bg-[#4a8f5c] transition">
                View Full Leaderboard
              </button>
            </div>

            {/* Your Stats */}
            {playerName && (
              <div className="bg-white rounded-2xl border-4 border-[#2d5a3d] shadow-lg p-6">
                <h3 className="font-bold text-lg text-[#2d5a3d] mb-4">📊 Your Stats</h3>
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-[#2d5a3d]">{playerName}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#f0f7f1] rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-[#2d5a3d]">0</div>
                    <div className="text-xs text-gray-500">Score</div>
                  </div>
                  <div className="bg-[#f0f7f1] rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-[#2d5a3d]">0</div>
                    <div className="text-xs text-gray-500">Predictions</div>
                  </div>
                  <div className="bg-[#f0f7f1] rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-[#2d5a3d]">0%</div>
                    <div className="text-xs text-gray-500">Win Rate</div>
                  </div>
                  <div className="bg-[#f0f7f1] rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-[#2d5a3d]">0 🔥</div>
                    <div className="text-xs text-gray-500">Streak</div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Results */}
            <div className="bg-white rounded-2xl border-4 border-[#2d5a3d] shadow-lg p-6">
              <h3 className="font-bold text-lg text-[#2d5a3d] mb-4">📜 Recent Results</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-[#fff8e8] rounded-lg">
                  <span>#42 - 🧠 Opus Won</span>
                  <span className="text-green-600 font-bold">+127%</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-[#e8f4ff] rounded-lg">
                  <span>#41 - 🤖 Codex Won</span>
                  <span className="text-green-600 font-bold">+89%</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-[#fff8e8] rounded-lg">
                  <span>#40 - 🧠 Opus Won</span>
                  <span className="text-green-600 font-bold">+203%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Name Input Modal */}
        {showNameInput && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full border-4 border-[#2d5a3d]">
              <h3 className="text-xl font-bold text-[#2d5a3d] mb-4">Enter Your Name</h3>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Your display name..."
                className="w-full px-4 py-3 rounded-xl border-2 border-[#d4e8d1] focus:border-[#4a8f5c] outline-none mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowNameInput(false)}
                  className="flex-1 py-2 rounded-xl border-2 border-gray-200 text-gray-500 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => selectedChoice && submitPrediction(selectedChoice)}
                  disabled={!playerName.trim()}
                  className="flex-1 py-2 rounded-xl bg-[#2d5a3d] text-white font-medium hover:bg-[#4a8f5c] disabled:opacity-50"
                >
                  Confirm Pick
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
