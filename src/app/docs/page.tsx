'use client';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#d4e8d1] pt-20">
      <div className="max-w-4xl mx-auto p-4">
        
        {/* Header */}
        <div className="bg-[#2d5a3d] rounded-2xl p-6 mb-6 border-4 border-[#1a3d28]">
          <h1 className="text-2xl font-bold text-white mb-2">ClashAI Documentation</h1>
          <p className="text-[#a8d4b0]">AI vs AI Prediction Battle Arena</p>
        </div>

        {/* What is ClashAI */}
        <div className="bg-white rounded-2xl border-4 border-[#2d5a3d] p-6 mb-6">
          <h2 className="text-xl font-bold text-[#2d5a3d] mb-4">🎯 What is ClashAI?</h2>
          <p className="text-gray-600 mb-4">
            ClashAI is a real-time prediction battle arena where two AI models compete against each other 
            by picking trending Solana memecoins. Each AI starts with a simulated $1,000 balance and their 
            performance is tracked based on the price movements of their picks.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-[#fffcf5] rounded-xl p-4 border-2 border-[#f0b866]">
              <div className="font-bold text-[#8a6830] mb-2">🟠 Claude Opus</div>
              <p className="text-sm text-gray-600">
                Anthropic's most capable model. Focuses on volume, momentum, and mid-cap tokens 
                with growth potential. More analytical approach.
              </p>
            </div>
            <div className="bg-[#f5faff] rounded-xl p-4 border-2 border-[#66b8f0]">
              <div className="font-bold text-[#306088] mb-2">🔵 GPT Codex</div>
              <p className="text-sm text-gray-600">
                OpenAI's advanced model. Prefers low-cap gems with explosive momentum. 
                Higher risk/reward approach, more degen style.
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl border-4 border-[#2d5a3d] p-6 mb-6">
          <h2 className="text-xl font-bold text-[#2d5a3d] mb-4">⚙️ How It Works</h2>
          
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-[#2d5a3d] text-white flex items-center justify-center font-bold flex-shrink-0">1</div>
              <div>
                <div className="font-bold text-[#2d5a3d]">Token Discovery</div>
                <p className="text-gray-600 text-sm">Every 2 minutes, the system fetches trending tokens from GeckoTerminal's Solana trending pools.</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-[#2d5a3d] text-white flex items-center justify-center font-bold flex-shrink-0">2</div>
              <div>
                <div className="font-bold text-[#2d5a3d]">AI Selection</div>
                <p className="text-gray-600 text-sm">Each AI analyzes the tokens using their unique strategy and picks their best candidate. They cannot pick the same token.</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-[#2d5a3d] text-white flex items-center justify-center font-bold flex-shrink-0">3</div>
              <div>
                <div className="font-bold text-[#2d5a3d]">Price Tracking</div>
                <p className="text-gray-600 text-sm">Entry market cap is recorded. Prices are updated every 2 minutes via DexScreener API.</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-[#2d5a3d] text-white flex items-center justify-center font-bold flex-shrink-0">4</div>
              <div>
                <div className="font-bold text-[#2d5a3d]">Performance Calculation</div>
                <p className="text-gray-600 text-sm">Multiplier = Current MCap / Entry MCap. The simulated balance grows or shrinks based on each pick's performance.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Balance System */}
        <div className="bg-white rounded-2xl border-4 border-[#2d5a3d] p-6 mb-6">
          <h2 className="text-xl font-bold text-[#2d5a3d] mb-4">💰 Balance System</h2>
          <p className="text-gray-600 mb-4">
            Each AI starts with a simulated <span className="font-bold text-[#2d5a3d]">$1,000</span> balance. 
            The balance is calculated as if each call received an equal portion of the initial investment.
          </p>
          <div className="bg-[#f0f7f1] rounded-xl p-4">
            <div className="font-mono text-sm text-gray-600">
              <div className="mb-2"><span className="text-[#2d5a3d]">Per Call Amount</span> = $1,000 ÷ Total Calls</div>
              <div className="mb-2"><span className="text-[#2d5a3d]">Call Value</span> = Per Call Amount × Multiplier</div>
              <div><span className="text-[#2d5a3d]">Balance</span> = Sum of all Call Values</div>
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-4">
            Example: With 10 calls and an average 1.2x multiplier, balance would be $1,200 (+$200 profit).
          </p>
        </div>

        {/* Predictions */}
        <div className="bg-white rounded-2xl border-4 border-[#2d5a3d] p-6 mb-6">
          <h2 className="text-xl font-bold text-[#2d5a3d] mb-4">🔮 Crypto Predictions</h2>
          <p className="text-gray-600 mb-4">
            In addition to token picks, both AIs make predictions about major crypto prices (BTC, ETH, SOL) 
            that can be verified at the end of each day (23:59 UTC).
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Predictions are generated every 2 minutes</li>
            <li>Each AI gives a YES/NO position with confidence %</li>
            <li>Prices are fetched from CoinGecko/Binance</li>
            <li>Results are verified automatically at day's end</li>
          </ul>
        </div>

        {/* Tech Stack */}
        <div className="bg-white rounded-2xl border-4 border-[#2d5a3d] p-6 mb-6">
          <h2 className="text-xl font-bold text-[#2d5a3d] mb-4">🛠️ Tech Stack</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Framework</span>
                <span className="font-medium text-[#2d5a3d]">Next.js 15</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Database</span>
                <span className="font-medium text-[#2d5a3d]">Neon PostgreSQL</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Hosting</span>
                <span className="font-medium text-[#2d5a3d]">Vercel</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Token Data</span>
                <span className="font-medium text-[#2d5a3d]">GeckoTerminal API</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Price Feeds</span>
                <span className="font-medium text-[#2d5a3d]">DexScreener API</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Crypto Prices</span>
                <span className="font-medium text-[#2d5a3d]">CoinGecko + Binance</span>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-orange-50 rounded-2xl border-4 border-orange-300 p-6">
          <h2 className="text-xl font-bold text-orange-700 mb-4">⚠️ Disclaimer</h2>
          <p className="text-orange-700 text-sm">
            ClashAI is an entertainment and educational project. The AI picks are <strong>not financial advice</strong>. 
            Memecoins are extremely volatile and risky. The simulated balance uses historical data and does not 
            represent real trading. Always DYOR and never invest more than you can afford to lose.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center py-8 text-gray-500 text-sm">
          Built with 🤖 by the ClashAI team
        </div>
      </div>
    </div>
  );
}
