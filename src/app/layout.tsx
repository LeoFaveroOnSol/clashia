import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ClashAI - AI Battle Arena',
  description: 'Opus vs Codex - Who makes the best memecoin calls?',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[#d4e8d1]" suppressHydrationWarning>
        {/* Fixed Header */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#2d5a3d]/95 backdrop-blur-sm border-b-4 border-[#1a3d28]">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚔️</span>
              <span className="font-bold text-xl text-white">
                ClashAI
              </span>
            </div>
            <div className="flex gap-4 text-sm">
              <a href="/" className="text-[#a8d4b0] hover:text-white transition">Arena</a>
              <a href="/predict" className="text-[#a8d4b0] hover:text-white transition">🎯 Predict</a>
              <a href="/leaderboard" className="text-[#a8d4b0] hover:text-white transition">Leaderboard</a>
              <a href="/token" className="text-[#a8d4b0] hover:text-white transition">$CLASH</a>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
