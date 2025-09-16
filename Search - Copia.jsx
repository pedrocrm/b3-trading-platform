
import React, { useState, useEffect } from "react";
import { Jurisprudencia, User } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search as SearchIcon, Filter, Calendar, Building2, FileText, Sparkles, Brain, FileSearch, User as UserIcon, UserCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import SearchFilters from "../components/search/SearchFilters";
import CaseCard from "../components/search/CaseCard";
import CaseDetail from "../components/search/CaseDetail";
import SemanticSearch from "../components/search/SemanticSearch";
import SimilarCases from "../components/search/SimilarCases";
import AddToFolderDialog from "../components/search/AddToFolderDialog";
import { consultarProcesso } from "@/api/functions";
import { searchProcessoCNJ } from "@/api/cnjDataJusIntegration";
import { consultarPorDocumento } from "@/api/functions";
import { buscarJurisprudencia } from "@/api/functions"; // Novo import
import ProcessoDetalhadoCard from "../components/search/ProcessoDetalhadoCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function Search() {
  const [searchTerm, setSearchTerm] = useState("");
  const [cases, setCases] = useState([]); // Mantido para referência de filtros (e.g., popula dropdowns), mas não mais para exibição de resultados de busca principal
  const [filteredCases, setFilteredCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchMode, setSearchMode] = useState("jurisprudencia");
  const [semanticLoading, setSemanticLoading] = useState(false);
  const [filters, setFilters] = useState({
    tribunal: "",
    dataInicio: "",
    dataFim: "",
    categoria: ""
  });
  const [user, setUser] = useState(null);
  const [showAddToFolderDialog, setShowAddToFolderDialog] = useState(false);
  const [caseToAddToFolder, setCaseToAddToFolder] = useState(null);
  const [cnjSearchTerm, setCnjSearchTerm] = useState("");
  const [processoDetalhado, setProcessoDetalhado] = useState(null);
  const [cnjLoading, setCnjLoading] = useState(false);
  const [cnjError, setCnjError] = useState(null);
  const [documentoSearchTerm, setDocumentoSearchTerm] = useState("");
  const [documentoResultados, setDocumentoResultados] = useState(null);
  const [documentoLoading, setDocumentoLoading] = useState(false);
  const [documentoError, setDocumentoError] = useState(null);

  useEffect(() => {
    // A busca inicial não é mais necessária para exibição de resultados na tela,
    // a busca é ativa (acionada pelo usuário).
    // No entanto, 'loadCases' ainda é usado para popular os filtros dinamicamente
    // (ex: lista de tribunais ou categorias para o componente SearchFilters).
    loadCases();
    getCurrentUser();
  }, []);

  // Removido: useEffect para aplicar filtros locais
  // A busca e filtragem agora são realizadas no backend pela função `buscarJurisprudencia`.

  const loadCases = async () => {
    // Esta função é usada para popular os filtros dinamicamente (e.g., lista de tribunais, categorias)
    // baseada em um conjunto de casos, não para exibir os resultados da busca principal.
    setLoading(true);
    try {
      const data = await Jurisprudencia.list("-data_julgamento", 100);
      setCases(data);
    } catch (error) {
      console.error("Error loading cases for filters:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch(e) {
      console.error("Failed to get user");
    }
  }

  // Removido: applyTraditionalFilters

  const handleBackendSearch = async () => {
    setLoading(true);
    setSelectedCase(null); // Limpa o caso selecionado ao iniciar uma nova busca
    try {
      const { data, error } = await buscarJurisprudencia({
        query: searchTerm,
        filters: filters,
      });

      if (error) {
        throw new Error(error.message || "Erro ao buscar jurisprudência.");
      }
      
      // A função de backend agora retorna um objeto com uma propriedade 'hits'
      setFilteredCases(data.hits || []); 
    } catch (e) {
      console.error("Erro na busca por jurisprudência:", e);
      setFilteredCases([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSemanticSearch = async (query, conceptualSearch = false) => {
    if (!query.trim()) return;

    setSemanticLoading(true);
    setSearchMode("semantic"); // Isso irá mudar a aba principal para semantic
    setSelectedCase(null); // Limpa o caso selecionado ao iniciar uma nova busca semântica

    try {
      const searchPrompt = conceptualSearch
        ? `Com base na consulta jurídica: "${query}", identifique casos similares considerando conceitos jurídicos relacionados, precedentes e princípios aplicáveis. Analise o contexto legal mais amplo.`
        : `Buscar jurisprudência relacionada a: "${query}". Encontre casos com contexto similar, mesmo que usem terminologia diferente.`;

      const response = await InvokeLLM({
        prompt: `${searchPrompt}

Casos disponíveis para análise:
${cases.map(caso => `
ID: ${caso.id}
Processo: ${caso.processo}
Tribunal: ${caso.tribunal}
Ementa: ${caso.ementa}
Categoria: ${caso.categoria_automatica || "Não categorizado"}
---`).join('')}

Retorne APENAS os IDs dos casos mais relevantes (máximo 10), ordenados por relevância. Formato de resposta: apenas uma lista de IDs separados por vírgula.`,
        response_json_schema: {
          type: "object",
          properties: {
            case_ids: {
              type: "array",
              items: { type: "string" }
            },
            reasoning: { type: "string" }
          }
        }
      });

      const relevantCases = cases.filter(caso =>
        response.case_ids.includes(caso.id)
      );

      // Ordenar pela ordem retornada pelo LLM
      const orderedCases = response.case_ids.map(id =>
        relevantCases.find(caso => caso.id === id)
      ).filter(Boolean);

      setFilteredCases(orderedCases);
    } catch (error) {
      console.error("Error in semantic search:", error);
      setFilteredCases([]);
    } finally {
      setSemanticLoading(false);
    }
  };

  const handleCnjSearch = async () => {
      if (!cnjSearchTerm.trim()) return;

      setCnjLoading(true);
      setCnjError(null);
      setProcessoDetalhado(null);
      setSelectedCase(null); // Limpa o caso selecionado ao iniciar uma nova busca CNJ

      try {
          // TODO: A chave da API e o alias do tribunal devem ser gerenciados de forma segura, idealmente no backend.
          // Por simplicidade, estamos usando um placeholder e um alias de exemplo.
          const CNJ_API_KEY = "SUA_CHAVE_API_AQUI"; // Substitua pela sua chave API real
          const TRIBUNAL_ALIAS = "api_publica_trf1"; // Exemplo: TRF1. Pode ser dinâmico no futuro.

          const { data, error } = await searchProcessoCNJ(TRIBUNAL_ALIAS, cnjSearchTerm, CNJ_API_KEY);
          if (error) {
              throw new Error(error.error || "Erro ao consultar processo.");
          }
          setProcessoDetalhado(data.data);
      } catch (e) {
          setCnjError(e.message);
      } finally {
          setCnjLoading(false);
      }
  };

  const handleDocumentoSearch = async () => {
    if (!documentoSearchTerm.trim()) return;

    setDocumentoLoading(true);
    setDocumentoError(null);
    setDocumentoResultados(null);
    setSelectedCase(null); // Limpa o caso selecionado ao iniciar uma nova busca por documento

    try {
      const { data, error } = await consultarPorDocumento({ documento: documentoSearchTerm });
      if (error) {
        throw new Error(error.message || "Erro ao consultar por documento.");
      }
      setDocumentoResultados(data);
    } catch (e) {
      console.error("Erro na busca por documento:", e);
      if (e.message.includes('404')) {
        setDocumentoError("Função de busca por documento não disponível no momento. Tente novamente mais tarde.");
      } else {
        setDocumentoError(e.message);
      }
    } finally {
      setDocumentoLoading(false);
    }
  };

  const handleSaveToFolder = (caso) => {
    setCaseToAddToFolder(caso);
    setShowAddToFolderDialog(true);
  };

  const clearAll = () => {
    setSearchTerm("");
    setFilters({ tribunal: "", dataInicio: "", dataFim: "", categoria: "" });
    setCnjSearchTerm("");
    setProcessoDetalhado(null);
    setCnjError(null);
    setDocumentoSearchTerm("");
    setDocumentoResultados(null);
    setDocumentoError(null);
    setFilteredCases([]); // Limpa os casos filtrados
    setSelectedCase(null); // Limpa o caso selecionado
    setShowFilters(false); // Esconde os filtros
    setSearchMode("jurisprudencia"); // Retorna para a aba padrão
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Pesquisa Jurisprudencial e Processual</h1>
          <p className="text-slate-600">
            Encontre casos, decisões e jurisprudência com busca tradicional ou semântica por IA, e consulte processos via CNJ.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <Card className="bg-white border-0 shadow-lg">
              <CardContent className="p-6">
                <Tabs value={searchMode} onValueChange={setSearchMode} className="w-full">
                  <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4 mb-6 h-auto sm:h-10">
                    <TabsTrigger value="jurisprudencia" className="flex items-center justify-center gap-1 text-xs sm:text-sm p-2 sm:p-3">
                      <SearchIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Jurisprudência</span>
                      <span className="sm:hidden">Ementas</span>
                    </TabsTrigger>
                     <TabsTrigger value="cnj" className="flex items-center justify-center gap-1 text-xs sm:text-sm p-2 sm:p-3">
                      <FileSearch className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Processo (CNJ)</span>
                      <span className="sm:hidden">CNJ</span>
                    </TabsTrigger>
                    <TabsTrigger value="documento" className="flex items-center justify-center gap-1 text-xs sm:text-sm p-2 sm:p-3">
                      <UserCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">CPF/CNPJ</span>
                      <span className="sm:hidden">Partes</span>
                    </TabsTrigger>
                    <TabsTrigger value="semantic" className="flex items-center justify-center gap-1 text-xs sm:text-sm p-2 sm:p-3">
                      <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Busca IA</span>
                      <span className="sm:hidden">IA</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="jurisprudencia" className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <Input
                          placeholder="Buscar por ementa, classe, tribunal..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleBackendSearch()}
                          className="pl-10 h-12 text-lg border-slate-300 focus:border-blue-500"
                        />
                      </div>
                      <Button
                        size="lg"
                        onClick={handleBackendSearch}
                        className="flex items-center gap-2 w-full sm:w-auto"
                        disabled={loading && searchMode === "jurisprudencia"}
                      >
                        <SearchIcon className="w-4 h-4" />
                        {loading && searchMode === "jurisprudencia" ? 'Buscando...' : 'Buscar'}
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 w-full sm:w-auto"
                      >
                        <Filter className="w-4 h-4" />
                        Filtros
                      </Button>
                    </div>

                    {showFilters && (
                      <SearchFilters
                        filters={filters}
                        setFilters={setFilters}
                        cases={cases} // 'cases' é usado para popular os filtros
                      />
                    )}
                  </TabsContent>

                  <TabsContent value="cnj" className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                          <div className="relative flex-1">
                              <Input
                                placeholder="Digite o número do processo (formato CNJ)"
                                value={cnjSearchTerm}
                                onChange={(e) => setCnjSearchTerm(e.target.value)}
                                className="h-12 text-lg border-slate-300 focus:border-blue-500"
                              />
                          </div>
                          <Button size="lg" onClick={handleCnjSearch} disabled={cnjLoading} className="w-full sm:w-auto">
                            {cnjLoading ? 'Buscando...' : 'Buscar Processo'}
                          </Button>
                      </div>
                      <p className="text-xs text-slate-500">Ex: 0000000-00.0000.8.26.0000</p>
                  </TabsContent>

                  <TabsContent value="documento" className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                          <div className="relative flex-1">
                              <Input
                                placeholder="Digite o CPF ou CNPJ (apenas números)"
                                value={documentoSearchTerm}
                                onChange={(e) => setDocumentoSearchTerm(e.target.value)}
                                className="h-12 text-lg border-slate-300 focus:border-blue-500"
                              />
                          </div>
                          <Button size="lg" onClick={handleDocumentoSearch} disabled={documentoLoading} className="w-full sm:w-auto">
                            {documentoLoading ? 'Buscando...' : 'Buscar por Documento'}
                          </Button>
                      </div>
                      <p className="text-xs text-slate-500">Ex: 12345678901 ou 12.345.678/0001-90</p>
                  </TabsContent>

                  <TabsContent value="semantic">
                    <SemanticSearch
                      onSearch={handleSemanticSearch}
                      loading={semanticLoading}
                    />
                  </TabsContent>
                </Tabs>

                <div className="flex items-center justify-between text-sm text-slate-600 mt-6 pt-4 border-t">
                  <p>
                    {
                      searchMode === "jurisprudencia" || searchMode === "semantic"
                      ? `${filteredCases.length} casos encontrados`
                      : searchMode === "cnj" && processoDetalhado
                      ? "1 processo encontrado"
                      : searchMode === "cnj" && cnjError
                      ? "Erro na consulta CNJ"
                      : searchMode === "documento" && documentoResultados
                      ? `${documentoResultados.resultados.reduce((acc, r) => acc + r.total, 0)} processos encontrados em ${documentoResultados.resultados.length} tribunais`
                      : ""
                    }
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                  >
                    Limpar busca
                  </Button>
                </div>
              </CardContent>
            </Card>

            {processoDetalhado && searchMode === "cnj" && <ProcessoDetalhadoCard processo={processoDetalhado} />}

            {cnjError && searchMode === "cnj" && (
                <Alert variant="destructive">
                    <AlertTitle>Erro na Consulta</AlertTitle>
                    <AlertDescription>{cnjError}</AlertDescription>
                </Alert>
            )}
            
            {documentoLoading && searchMode === "documento" && <p className="text-center text-slate-600">Buscando em múltiplos tribunais...</p>}
            
            {documentoError && searchMode === "documento" && (
                <Alert variant="destructive">
                    <AlertTitle>Erro na Busca por Documento</AlertTitle>
                    <AlertDescription>{documentoError}</AlertDescription>
                </Alert>
            )}

            {documentoResultados && searchMode === "documento" && (
              <Card>
                <CardHeader>
                  <CardTitle>Resultados para o documento: {documentoResultados.documento}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {documentoResultados.resultados.map((res, idx) => (
                      <AccordionItem value={`item-${idx}`} key={idx}>
                        <AccordionTrigger>
                          <div className="flex justify-between w-full pr-4">
                            <span>{res.tribunal}</span>
                            <Badge>{res.total} processos</Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="list-disc pl-5 space-y-1">
                            {res.processos.map((p, i) => <li key={i} className="text-sm">{p}</li>)}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            )}

            {searchMode !== "cnj" && searchMode !== "documento" && (loading || semanticLoading) ? (
                <div className="grid gap-4">
                  {Array(5).fill(0).map((_, i) => (
                    <Card key={i} className="p-6">
                      <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-20 bg-slate-200 rounded"></div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (searchMode === "jurisprudencia" || searchMode === "semantic") && filteredCases.length > 0 ? (
                filteredCases.map((caso) => (
                  <CaseCard
                    key={caso.id}
                    case={caso}
                    onClick={() => setSelectedCase(caso)}
                    isSelected={selectedCase?.id === caso.id}
                    searchMode={searchMode}
                    onSaveToFolder={() => handleSaveToFolder(caso)}
                  />
                ))
              ) : (searchMode === "jurisprudencia" || searchMode === "semantic") && !loading && !semanticLoading && (
                <Card className="p-8 text-center">
                  <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">
                    Nenhum caso encontrado
                  </h3>
                  <p className="text-slate-500">
                    {searchMode === "semantic"
                      ? "Tente reformular sua consulta jurídica ou use busca tradicional"
                      : "Realize uma busca ou ajuste os termos e filtros"
                    }
                  </p>
                </Card>
              )}
          </div>

          <div className="lg:col-span-1 space-y-6">
            <CaseDetail case={selectedCase} onClose={() => setSelectedCase(null)} />
            {selectedCase && (
              <SimilarCases
                currentCase={selectedCase}
                allCases={cases} // 'cases' ainda é necessário para a lógica de casos similares
                onSelectCase={setSelectedCase}
              />
            )}
          </div>
        </div>
        <AddToFolderDialog
            open={showAddToFolderDialog}
            onOpenChange={setShowAddToFolderDialog}
            caso={caseToAddToFolder}
            user={user}
        />
      </div>
    </div>
  );
}
