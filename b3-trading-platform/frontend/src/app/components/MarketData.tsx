'use client'

import { useState, useEffect } from 'react'

interface MarketTick {
  symbol: string
  price: number
  change: number
  change_percent: number
  volume: number
  bid: number
  ask: number
  timestamp: string
}

export default function MarketData() {
  const [marketData, setMarketData] = useState<MarketTick[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/market`)
        if (!response.ok) throw new Error('Erro ao buscar dados de mercado')
        
        const data = await response.json()
        setMarketData(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMarketData()
    const interval = setInterval(fetchMarketData, 2000) // Atualizar a cada 2s

    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong>Erro:</strong> {error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Dados de Mercado em Tempo Real</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {marketData.map((tick) => (
          <div key={tick.symbol} className="bg-white p-4 rounded-lg shadow border">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg text-gray-800">{tick.symbol}</h3>
              <span className="text-xs text-gray-500">
                {new Date(tick.timestamp).toLocaleTimeString()}
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Preço:</span>
                <span className="font-mono font-bold">
                  {tick.price.toLocaleString('pt-BR', { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2 
                  })}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Variação:</span>
                <span className={`font-mono ${tick.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tick.change >= 0 ? '+' : ''}{tick.change.toFixed(2)} 
                  ({tick.change_percent.toFixed(2)}%)
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Bid/Ask:</span>
                <span className="font-mono">
                  {tick.bid.toFixed(2)} / {tick.ask.toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Volume:</span>
                <span className="font-mono">{tick.volume.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

