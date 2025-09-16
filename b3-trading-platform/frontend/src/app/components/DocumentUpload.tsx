'use client'

import { useState, useCallback } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, X, Eye, Clock } from 'lucide-react'

interface DocumentUploadResponse {
  document_id: string
  filename: string
  file_size: number
  document_type: string
  confidence_score: number
  processing_time: number
  extracted_entities_count: number
  success: boolean
  errors: string[]
}

interface UploadedFile {
  file: File
  id: string
  status: 'uploading' | 'processing' | 'success' | 'error'
  result?: DocumentUploadResponse
  error?: string
  progress: number
}

const DOCUMENT_TYPES = {
  contract: 'Contrato',
  petition: 'Petição',
  judgment: 'Sentença/Acórdão',
  correspondence: 'Correspondência',
  regulation: 'Regulamento/Norma',
  testament: 'Testamento',
  deed: 'Escritura',
  other: 'Outros'
}

const ALLOWED_TYPES = ['.pdf', '.docx', '.txt', '.png', '.jpg', '.jpeg', '.tiff']
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export default function DocumentUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)

  const generateId = () => Math.random().toString(36).substr(2, 9)

  const validateFile = (file: File): string | null => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    
    if (!ALLOWED_TYPES.includes(extension)) {
      return `Tipo de arquivo não permitido. Tipos aceitos: ${ALLOWED_TYPES.join(', ')}`
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `Arquivo muito grande. Tamanho máximo: ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(1)}MB`
    }
    
    return null
  }

  const uploadFile = async (file: File): Promise<DocumentUploadResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('tenant_id', 'default')

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/legal/upload-document`, {
      method: 'POST',
      body: formData,
      // headers: {
      //   'Authorization': `Bearer ${token}` // Implementar autenticação
      // }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Erro ${response.status}`)
    }

    return response.json()
  }

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    
    for (const file of fileArray) {
      const validationError = validateFile(file)
      
      if (validationError) {
        const errorFile: UploadedFile = {
          file,
          id: generateId(),
          status: 'error',
          error: validationError,
          progress: 0
        }
        setUploadedFiles(prev => [...prev, errorFile])
        continue
      }

      const uploadingFile: UploadedFile = {
        file,
        id: generateId(),
        status: 'uploading',
        progress: 0
      }

      setUploadedFiles(prev => [...prev, uploadingFile])

      try {
        // Simular progresso de upload
        const fileId = uploadingFile.id
        
        // Progresso de upload
        for (let progress = 0; progress <= 100; progress += 20) {
          await new Promise(resolve => setTimeout(resolve, 100))
          setUploadedFiles(prev => 
            prev.map(f => f.id === fileId ? { ...f, progress } : f)
          )
        }

        // Processar arquivo
        setUploadedFiles(prev => 
          prev.map(f => f.id === fileId ? { ...f, status: 'processing' } : f)
        )

        const result = await uploadFile(file)

        setUploadedFiles(prev => 
          prev.map(f => f.id === fileId ? { 
            ...f, 
            status: result.success ? 'success' : 'error',
            result: result.success ? result : undefined,
            error: result.success ? undefined : result.errors.join(', ')
          } : f)
        )

      } catch (error) {
        setUploadedFiles(prev => 
          prev.map(f => f.id === uploadingFile.id ? { 
            ...f, 
            status: 'error',
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          } : f)
        )
      }
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    handleFiles(files)
  }, [handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }, [handleFiles])

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusText = (file: UploadedFile) => {
    switch (file.status) {
      case 'uploading':
        return `Enviando... ${file.progress}%`
      case 'processing':
        return 'Processando documento...'
      case 'success':
        return 'Processado com sucesso'
      case 'error':
        return file.error || 'Erro no processamento'
      default:
        return ''
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Upload de Documentos Jurídicos
        </h1>
        <p className="text-gray-600">
          Faça upload e processamento automático de documentos com IA jurídica
        </p>
      </div>

      {/* Área de Upload */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Arraste arquivos aqui ou clique para selecionar
        </h3>
        <p className="text-gray-500 mb-4">
          Tipos aceitos: {ALLOWED_TYPES.join(', ')} | Máximo: {(MAX_FILE_SIZE / (1024 * 1024)).toFixed(1)}MB
        </p>
        
        <input
          type="file"
          multiple
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
        >
          <Upload className="h-4 w-4 mr-2" />
          Selecionar Arquivos
        </label>
      </div>

      {/* Lista de Arquivos */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Arquivos ({uploadedFiles.length})
          </h2>
          
          <div className="space-y-4">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(file.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {file.file.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.file.size)}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {getStatusText(file)}
                      </p>
                      
                      {/* Progresso de Upload */}
                      {file.status === 'uploading' && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${file.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Resultados do Processamento */}
                      {file.status === 'success' && file.result && (
                        <div className="mt-3 p-3 bg-green-50 rounded-md">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-green-800">Tipo Identificado:</span>
                              <p className="text-green-700">
                                {DOCUMENT_TYPES[file.result.document_type as keyof typeof DOCUMENT_TYPES] || file.result.document_type}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-green-800">Confiança:</span>
                              <p className="text-green-700">
                                {(file.result.confidence_score * 100).toFixed(1)}%
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-green-800">Entidades Extraídas:</span>
                              <p className="text-green-700">
                                {file.result.extracted_entities_count}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-green-800">Tempo de Processamento:</span>
                              <p className="text-green-700 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {file.result.processing_time.toFixed(2)}s
                              </p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <span className="font-medium text-green-800">ID do Documento:</span>
                            <p className="text-green-700 font-mono text-xs">
                              {file.result.document_id}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Erros */}
                      {file.status === 'error' && file.error && (
                        <div className="mt-3 p-3 bg-red-50 rounded-md">
                          <p className="text-sm text-red-700">{file.error}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Botões de Ação */}
                  <div className="flex items-center space-x-2 ml-4">
                    {file.status === 'success' && (
                      <button
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                        title="Visualizar detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      title="Remover"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Informações sobre Processamento */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Processamento Automático</h3>
            <p className="text-sm text-blue-700 mt-1">
              Os documentos são processados automaticamente com IA para extração de texto, classificação de tipo, 
              identificação de entidades jurídicas e geração de embeddings para busca semântica. O sistema também 
              aplica políticas de retenção LGPD automaticamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}