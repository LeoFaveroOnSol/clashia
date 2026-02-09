import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ClashAI - Prediction Arena',
  description: 'AI vs AI prediction battles on real markets',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[#0a0a0a] text-white" suppressHydrationWarning>
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-sm border-b border-gray-800">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <a href="/" className="font-bold text-lg text-white">
              ClashAI
            </a>
            <div className="flex gap-6 text-sm">
              <a href="/" className="text-gray-400 hover:text-white transition">Arena</a>
              <a href="/predict" className="text-gray-400 hover:text-white transition">Predictions</a>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
