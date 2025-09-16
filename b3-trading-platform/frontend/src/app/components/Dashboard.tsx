'use client'

import { useState, useEffect } from 'react'
import MarketData from './MarketData'
import TradingPanel from './TradingPanel'
import AccountInfo from './AccountInfo'
import CNJSearch from './CNJSearch'
import DocumentUpload from './DocumentUpload'
import CaseManagement from './CaseManagement'

interface DashboardProps {}

export default function Dashboard({}: DashboardProps) {
  const [activeTab, setActiveTab] = useState('cases')

  const tabs = [
    { id: 'cases', name: 'Gestão de Casos', icon: '⚖️' },
    { id: 'cnj', name: 'Consulta CNJ', icon: '🔍' },
    { id: 'documents', name: 'Documentos', icon: '📄' },
    { id: 'market', name: 'Dados de Mercado', icon: '📊' },
    { id: 'trading', name: 'Trading', icon: '💹' },
    { id: 'account', name: 'Conta', icon: '👤' },
  ]

  return (
    <div className="space-y-6">
      {/* Navegação por abas */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Conteúdo das abas */}
      <div className="mt-6">
        {activeTab === 'cases' && <CaseManagement />}
        {activeTab === 'cnj' && <CNJSearch />}
        {activeTab === 'documents' && <DocumentUpload />}
        {activeTab === 'market' && <MarketData />}
        {activeTab === 'trading' && <TradingPanel />}
        {activeTab === 'account' && <AccountInfo />}
      </div>
    </div>
  )
}

