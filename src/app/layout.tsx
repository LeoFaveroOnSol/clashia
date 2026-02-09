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
    <html lang="en">
      <body className="min-h-screen bg-black">
        <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-sm fixed w-full z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚔️</span>
              <span className="font-bold text-xl bg-gradient-to-r from-opus to-codex bg-clip-text text-transparent">
                ClashAI
              </span>
            </div>
            <div className="flex gap-6 text-sm">
              <a href="/" className="hover:text-clash transition">Arena</a>
              <a href="/leaderboard" className="hover:text-clash transition">Leaderboard</a>
              <a href="/history" className="hover:text-clash transition">History</a>
              <a href="/token" className="hover:text-clash transition">$CLASH</a>
            </div>
          </div>
        </nav>
        <main className="pt-20">
          {children}
        </main>
      </body>
    </html>
  )
}
