'use client'

import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'

export default function Home() {
  const [isConnected, setIsConnected] = useState(false)
  const [apiStatus, setApiStatus] = useState('checking')

  useEffect(() => {
    // Verificar status da API
    const checkApiStatus = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`)
        if (response.ok) {
          setApiStatus('connected')
          setIsConnected(true)
        } else {
          setApiStatus('error')
        }
      } catch (error) {
        setApiStatus('error')
        console.error('Erro ao conectar com a API:', error)
      }
    }

    checkApiStatus()
    const interval = setInterval(checkApiStatus, 30000) // Verificar a cada 30s

    return () => clearInterval(interval)
  }, [])

  if (apiStatus === 'checking') {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Conectando com a API...</p>
        </div>
      </div>
    )
  }

  if (apiStatus === 'error') {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Erro de Conexão</h2>
          <p className="text-gray-600 mb-4">
            Não foi possível conectar com a API do backend.
          </p>
          <p className="text-sm text-gray-500">
            Verifique se o backend está rodando em {process.env.NEXT_PUBLIC_API_URL}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <div className="flex items-center">
            <span className="text-green-500 mr-2">✅</span>
            <span>Conectado com sucesso à API do backend!</span>
          </div>
        </div>
      </div>
      
      <Dashboard />
    </div>
  )
}

