'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Calendar, Clock, User, FileText, AlertTriangle } from 'lucide-react'

interface LegalCase {
  id: string
  title: string
  case_type: string
  status: string
  opened_date: string
  deadline_date?: string
  court_date?: string
  responsible_lawyer: string
  client_id?: string
  opposing_party?: string
}

interface NewCaseForm {
  title: string
  description: string
  case_type: string
  client_id: string
  opposing_party: string
  court_date: string
  deadline_date: string
}

const CASE_TYPES = {
  civil: 'Cível',
  criminal: 'Criminal',
  commercial: 'Comercial',
  labor: 'Trabalhista',
  family: 'Família',
  tax: 'Tributário',
  administrative: 'Administrativo',
  constitutional: 'Constitucional',
  other: 'Outros'
}

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  suspended: 'bg-gray-100 text-gray-800',
  closed: 'bg-blue-100 text-blue-800',
  archived: 'bg-purple-100 text-purple-800'
}

const STATUS_LABELS = {
  active: 'Ativo',
  pending: 'Pendente',
  suspended: 'Suspenso',
  closed: 'Fechado',
  archived: 'Arquivado'
}

export default function CaseManagement() {
  const [cases, setCases] = useState<LegalCase[]>([])
  const [filteredCases, setFilteredCases] = useState<LegalCase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [showNewCaseForm, setShowNewCaseForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [newCase, setNewCase] = useState<NewCaseForm>({
    title: '',
    description: '',
    case_type: 'civil',
    client_id: '',
    opposing_party: '',
    court_date: '',
    deadline_date: ''
  })

  useEffect(() => {
    fetchCases()
  }, [])

  useEffect(() => {
    filterCases()
  }, [cases, searchTerm, selectedStatus, selectedType])

  const fetchCases = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/legal/cases`, {
        headers: {
          // 'Authorization': `Bearer ${token}` // Implementar autenticação
        }
      })

      if (!response.ok) {
        throw new Error(`Erro ao carregar casos: ${response.status}`)
      }

      const data = await response.json()
      setCases(data.cases || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setIsLoading(false)
    }
  }

  const filterCases = () => {
    let filtered = cases

    // Filtro por texto de busca
    if (searchTerm) {
      filtered = filtered.filter(case_ =>
        case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.opposing_party?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(case_ => case_.status === selectedStatus)
    }

    // Filtro por tipo
    if (selectedType !== 'all') {
      filtered = filtered.filter(case_ => case_.case_type === selectedType)
    }

    setFilteredCases(filtered)
  }

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/legal/cases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}` // Implementar autenticação
        },
        body: JSON.stringify({
          title: newCase.title,
          description: newCase.description,
          case_type: newCase.case_type,
          client_id: newCase.client_id || null,
          opposing_party: newCase.opposing_party || null,
          court_date: newCase.court_date ? new Date(newCase.court_date).toISOString() : null,
          deadline_date: newCase.deadline_date ? new Date(newCase.deadline_date).toISOString() : null
        })
      })

      if (!response.ok) {
        throw new Error(`Erro ao criar caso: ${response.status}`)
      }

      const createdCase = await response.json()
      setCases(prev => [createdCase, ...prev])
      setShowNewCaseForm(false)
      setNewCase({
        title: '',
        description: '',
        case_type: 'civil',
        client_id: '',
        opposing_party: '',
        court_date: '',
        deadline_date: ''
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar caso')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR')
    } catch {
      return dateString
    }
  }

  const getDaysUntilDeadline = (deadlineString: string): number => {
    try {
      const deadline = new Date(deadlineString)
      const now = new Date()
      const diff = deadline.getTime() - now.getTime()
      return Math.ceil(diff / (1000 * 60 * 60 * 24))
    } catch {
      return 0
    }
  }

  const isUrgent = (case_: LegalCase): boolean => {
    if (!case_.deadline_date) return false
    const days = getDaysUntilDeadline(case_.deadline_date)
    return days <= 7 && days >= 0
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Casos</h1>
          <p className="text-gray-600 mt-1">Gerencie casos jurídicos e acompanhe prazos</p>
        </div>
        <button
          onClick={() => setShowNewCaseForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Caso
        </button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Casos</p>
              <p className="text-2xl font-bold text-gray-900">{cases.length}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Casos Ativos</p>
              <p className="text-2xl font-bold text-green-600">
                {cases.filter(c => c.status === 'active').length}
              </p>
            </div>
            <User className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Casos Urgentes</p>
              <p className="text-2xl font-bold text-red-600">
                {cases.filter(isUrgent).length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Casos Pendentes</p>
              <p className="text-2xl font-bold text-yellow-600">
                {cases.filter(c => c.status === 'pending').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar casos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos os Status</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos os Tipos</option>
            {Object.entries(CASE_TYPES).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Casos */}
      <div className="bg-white rounded-lg shadow-md">
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-400">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {filteredCases.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum caso encontrado</h3>
            <p className="text-gray-500">
              {cases.length === 0 
                ? 'Crie seu primeiro caso para começar' 
                : 'Tente ajustar os filtros de busca'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredCases.map((case_) => (
              <div key={case_.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {case_.title}
                      </h3>
                      {isUrgent(case_) && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Urgente
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Tipo:</span>
                        <p>{CASE_TYPES[case_.case_type as keyof typeof CASE_TYPES] || case_.case_type}</p>
                      </div>
                      
                      <div>
                        <span className="font-medium">Responsável:</span>
                        <p>{case_.responsible_lawyer}</p>
                      </div>
                      
                      <div>
                        <span className="font-medium">Abertura:</span>
                        <p>{formatDate(case_.opened_date)}</p>
                      </div>
                      
                      {case_.deadline_date && (
                        <div>
                          <span className="font-medium">Prazo:</span>
                          <p className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(case_.deadline_date)}
                            <span className={`text-xs ${getDaysUntilDeadline(case_.deadline_date) <= 7 ? 'text-red-600' : 'text-gray-500'}`}>
                              ({getDaysUntilDeadline(case_.deadline_date)} dias)
                            </span>
                          </p>
                        </div>
                      )}
                      
                      {case_.opposing_party && (
                        <div className="md:col-span-2">
                          <span className="font-medium">Parte Contrária:</span>
                          <p>{case_.opposing_party}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 ml-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[case_.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'}`}>
                      {STATUS_LABELS[case_.status as keyof typeof STATUS_LABELS] || case_.status}
                    </span>
                    
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Novo Caso */}
      {showNewCaseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Criar Novo Caso</h2>
              
              <form onSubmit={handleCreateCase} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título do Caso *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCase.title}
                    onChange={(e) => setNewCase(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Ação de Cobrança - Cliente ABC"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={newCase.description}
                    onChange={(e) => setNewCase(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Descrição detalhada do caso..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Caso *
                    </label>
                    <select
                      required
                      value={newCase.case_type}
                      onChange={(e) => setNewCase(prev => ({ ...prev, case_type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {Object.entries(CASE_TYPES).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ID do Cliente
                    </label>
                    <input
                      type="text"
                      value={newCase.client_id}
                      onChange={(e) => setNewCase(prev => ({ ...prev, client_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ID ou nome do cliente"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parte Contrária
                  </label>
                  <input
                    type="text"
                    value={newCase.opposing_party}
                    onChange={(e) => setNewCase(prev => ({ ...prev, opposing_party: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nome da parte contrária"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data da Audiência
                    </label>
                    <input
                      type="datetime-local"
                      value={newCase.court_date}
                      onChange={(e) => setNewCase(prev => ({ ...prev, court_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prazo Final
                    </label>
                    <input
                      type="datetime-local"
                      value={newCase.deadline_date}
                      onChange={(e) => setNewCase(prev => ({ ...prev, deadline_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewCaseForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Criando...
                      </>
                    ) : (
                      'Criar Caso'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}