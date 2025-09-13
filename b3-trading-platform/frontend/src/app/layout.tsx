import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'B3 Trading Platform',
  description: 'Plataforma de Trading Automatizado para B3',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-100">
          <header className="bg-blue-600 text-white p-4">
            <h1 className="text-2xl font-bold">🚀 B3 Trading Platform</h1>
          </header>
          <main className="container mx-auto p-4">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}

