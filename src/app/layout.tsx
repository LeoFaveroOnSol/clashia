import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ClashAI - AI vs AI Prediction Battles',
  description: 'Watch Claude Opus and GPT Codex battle it out picking Solana memecoins',
};

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#2d5a3d] border-b-4 border-[#1a3d28]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1a3d28] rounded-lg flex items-center justify-center border-2 border-[#4a8f5c]">
              <span className="text-lg font-bold text-white">⚔️</span>
            </div>
            <span className="text-white font-bold text-lg">ClashAI</span>
          </a>
          
          <div className="flex items-center gap-4">
            <a href="/" className="text-[#a8d4b0] hover:text-white transition text-sm font-medium">
              Home
            </a>
            <a href="/predict" className="text-[#a8d4b0] hover:text-white transition text-sm font-medium">
              Predictions
            </a>
            <a href="/docs" className="text-[#a8d4b0] hover:text-white transition text-sm font-medium">
              Docs
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
