'use client'

import { useState, useEffect } from 'react'

interface AccountData {
  balance: number
  equity: number
  margin: number
  free_margin: number
  margin_level: number
  positions_count: number
  profit_today: number
}

interface Position {
  id: number
  symbol: string
  type: string
  quantity: number
  avg_price: number
  current_price: number
  pnl: number
  pnl_percent: number
  opened_at: string
}

export default function AccountInfo() {
  const [accountData, setAccountData] = useState<AccountData | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        // Aqui você implementaria a autenticação JWT
        const [accountResponse, positionsResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/account`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/positions`)
        ])

        if (!accountResponse.ok || !positionsResponse.ok) {
          throw new Error('Erro ao buscar dados da conta')
        }

        const account = await accountResponse.json()
        const positionsData = await positionsResponse.json()

        setAccountData(account)
        setPositions(positionsData)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAccountData()
    const interval = setInterval(fetchAccountData, 5000) // Atualizar a cada 5s

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

  if (!accountData) {
    return (
      <div className="text-center text-gray-500">
        Nenhum dado de conta disponível
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Informações da Conta</h2>

      {/* Resumo da Conta */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Saldo</h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(accountData.balance)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Patrimônio</h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(accountData.equity)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Margem Livre</h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(accountData.free_margin)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Lucro Hoje</h3>
          <p className={`text-2xl font-bold ${
            accountData.profit_today >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(accountData.profit_today)}
          </p>
        </div>
      </div>

      {/* Detalhes Adicionais */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalhes da Conta</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span className="text-gray-600">Margem Utilizada:</span>
            <span className="ml-2 font-mono">{formatCurrency(accountData.margin)}</span>
          </div>
          <div>
            <span className="text-gray-600">Nível de Margem:</span>
            <span className="ml-2 font-mono">{accountData.margin_level.toFixed(2)}%</span>
          </div>
          <div>
            <span className="text-gray-600">Posições Abertas:</span>
            <span className="ml-2 font-mono">{accountData.positions_count}</span>
          </div>
        </div>
      </div>

      {/* Posições Abertas */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Posições Abertas</h3>
        </div>
        
        {positions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Nenhuma posição aberta
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Símbolo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço Médio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço Atual
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    P&L
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aberta em
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {positions.map((position) => (
                  <tr key={position.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {position.symbol}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 text-xs rounded ${
                        position.type === 'BUY' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {position.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {position.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {position.avg_price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {position.current_price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                      <span className={position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(position.pnl)} ({position.pnl_percent.toFixed(2)}%)
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(position.opened_at).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded">
        <div className="flex">
          <span className="text-blue-400 mr-2">ℹ️</span>
          <div>
            <h3 className="font-medium text-blue-800">Informação</h3>
            <p className="text-blue-700 text-sm mt-1">
              Os dados exibidos são simulados para demonstração. Para dados reais, 
              configure a integração com sua corretora.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

