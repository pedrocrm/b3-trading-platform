'use client'

import { useState } from 'react'
import { Search, FileText, Clock, Building } from 'lucide-react'

interface CNJSearchResult {
  numeroProcesso: string
  tribunal: string
  dataAjuizamento?: string
  classe?: {
    codigo: number
    nome: string
  }
  assuntos?: Array<{
    codigo: number
    nome: string
  }>
  orgaoJulgador?: {
    nome: string
  }
  movimentos?: Array<{
    codigo: number
    nome: string
    dataHora: string
  }>
}

interface CNJSearchResponse {
  process_number: string
  tribunal: string
  total_results: number
  results: CNJSearchResult[]
  search_time: number
}

export default function CNJSearch() {
  const [processNumber, setProcessNumber] = useState('')
  const [searchResults, setSearchResults] = useState<CNJSearchResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatProcessNumber = (value: string) => {
    // Remove tudo que não for número
    const numbers = value.replace(/\D/g, '')
    
    // Aplica máscara CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO
    if (numbers.length <= 7) {
      return numbers
    } else if (numbers.length <= 9) {
      return `${numbers.slice(0, 7)}-${numbers.slice(7)}`
    } else if (numbers.length <= 13) {
      return `${numbers.slice(0, 7)}-${numbers.slice(7, 9)}.${numbers.slice(9)}`
    } else if (numbers.length <= 14) {
      return `${numbers.slice(0, 7)}-${numbers.slice(7, 9)}.${numbers.slice(9, 13)}.${numbers.slice(13)}`
    } else if (numbers.length <= 16) {
      return `${numbers.slice(0, 7)}-${numbers.slice(7, 9)}.${numbers.slice(9, 13)}.${numbers.slice(13, 14)}.${numbers.slice(14)}`
    } else {
      return `${numbers.slice(0, 7)}-${numbers.slice(7, 9)}.${numbers.slice(9, 13)}.${numbers.slice(13, 14)}.${numbers.slice(14, 16)}.${numbers.slice(16, 20)}`
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatProcessNumber(e.target.value)
    setProcessNumber(formatted)
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!processNumber.trim()) return

    setIsLoading(true)
    setError(null)
    setSearchResults(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/legal/search-cnj`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}` // Implementar autenticação
        },
        body: JSON.stringify({
          numeroProcesso: processNumber,
          size: 10
        })
      })

      if (!response.ok) {
        throw new Error(`Erro na busca: ${response.status}`)
      }

      const data: CNJSearchResponse = await response.json()
      setSearchResults(data)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR')
    } catch {
      return dateString
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Consulta CNJ DataJus
        </h1>
        <p className="text-gray-600">
          Busque processos judiciais em todos os tribunais brasileiros
        </p>
      </div>

      {/* Formulário de Busca */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label htmlFor="processNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Número do Processo CNJ
            </label>
            <div className="relative">
              <input
                id="processNumber"
                type="text"
                value={processNumber}
                onChange={handleInputChange}
                placeholder="0000000-00.0000.0.00.0000"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength={25}
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Digite o número do processo no formato CNJ ou apenas os números
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !processNumber.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Buscando...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Buscar Processo
              </>
            )}
          </button>
        </form>
      </div>

      {/* Erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erro na Busca</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Resultados */}
      {searchResults && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Resultados da Busca</h2>
            <div className="text-sm text-gray-500 flex items-center gap-4">
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {searchResults.total_results} resultado(s)
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {searchResults.search_time.toFixed(2)}s
              </span>
              <span className="flex items-center gap-1">
                <Building className="h-4 w-4" />
                {searchResults.tribunal}
              </span>
            </div>
          </div>

          {searchResults.total_results === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum processo encontrado</h3>
              <p className="text-gray-500">
                Verifique se o número do processo está correto ou tente novamente.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {searchResults.results.map((result, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Processo: {result.numeroProcesso}
                      </h3>
                      
                      {result.classe && (
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Classe:</span> {result.classe.nome}
                        </p>
                      )}
                      
                      {result.dataAjuizamento && (
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Data de Ajuizamento:</span> {formatDate(result.dataAjuizamento)}
                        </p>
                      )}
                      
                      {result.orgaoJulgador && (
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Órgão Julgador:</span> {result.orgaoJulgador.nome}
                        </p>
                      )}
                    </div>

                    <div>
                      {result.assuntos && result.assuntos.length > 0 && (
                        <div className="mb-3">
                          <h4 className="font-medium text-gray-900 mb-1">Assuntos:</h4>
                          <div className="space-y-1">
                            {result.assuntos.slice(0, 3).map((assunto, idx) => (
                              <p key={idx} className="text-sm text-gray-600">
                                • {assunto.nome}
                              </p>
                            ))}
                            {result.assuntos.length > 3 && (
                              <p className="text-sm text-gray-500">
                                ... e mais {result.assuntos.length - 3} assunto(s)
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {result.movimentos && result.movimentos.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">Última Movimentação:</h4>
                          <p className="text-sm text-gray-600">
                            {result.movimentos[0].nome}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(result.movimentos[0].dataHora)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Informações */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Sobre a API CNJ DataJus</h3>
            <p className="text-sm text-blue-700 mt-1">
              A API CNJ DataJus fornece acesso aos metadados e movimentações processuais de todos os tribunais brasileiros, 
              abrangendo mais de 280 milhões de processos indexados. Os dados são atualizados regularmente pelos tribunais.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}