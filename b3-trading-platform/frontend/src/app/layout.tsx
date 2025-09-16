import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Legal Tech Platform - B3 Trading & CNJ DataJus',
  description: 'Plataforma jurídica integrada com CNJ DataJus API, processamento de documentos e gestão de casos',
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
            <div className="container mx-auto flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">⚖️ Legal Tech Platform</h1>
                <p className="text-blue-100 text-sm">Sistema Jurídico com CNJ DataJus & IA</p>
              </div>
              <div className="text-right text-sm text-blue-100">
                <p>Integração CNJ DataJus</p>
                <p>Processamento de Documentos</p>
              </div>
            </div>
          </header>
          <main className="container mx-auto p-4">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}

