"""
CNJ DataJus API Integration Module
Integração com a API pública do CNJ DataJus para acesso a dados judiciais brasileiros
"""

import requests
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# Configurações da API CNJ DataJus
API_BASE_URL = "https://api-publica.datajud.cnj.jus.br"
API_KEY = "MWM2ZDVjNzgtMGVlNy00ZGIzLTk3YjMtNWY4NDg5OGExOTBh"  # Chave pública oficial do CNJ

class CNJDataJusConfig:
    """Configurações para a API CNJ DataJus"""
    def __init__(self):
        self.api_key = API_KEY
        self.base_url = API_BASE_URL
        self.timeout = 30
        
    def get_headers(self) -> Dict[str, str]:
        """Retorna headers para requisições à API"""
        return {
            'Content-Type': 'application/json',
            'Authorization': f'APIKey {self.api_key}'
        }

class ProcessSearchRequest(BaseModel):
    """Modelo para requisição de busca de processo"""
    numeroProcesso: str = Field(..., description="Número do processo CNJ")
    size: int = Field(default=100, ge=1, le=10000, description="Quantidade de registros")
    tribunal: Optional[str] = Field(None, description="Tribunal específico")

class ProcessSearchResponse(BaseModel):
    """Modelo para resposta de busca de processo"""
    numeroProcesso: str
    tribunal: str
    dataAjuizamento: Optional[str]
    classe: Optional[Dict[str, Any]]
    assuntos: Optional[List[Dict[str, Any]]]
    orgaoJulgador: Optional[Dict[str, Any]]
    movimentos: Optional[List[Dict[str, Any]]]

class CNJDataJusAPI:
    """Cliente para integração com a API CNJ DataJus"""
    
    def __init__(self):
        self.config = CNJDataJusConfig()
        
    def get_endpoint_for_process(self, process_number: str) -> Optional[str]:
        """
        Determinar endpoint correto baseado no número CNJ
        Formato: NNNNNNN-DD.AAAA.J.TR.OOOO
        """
        try:
            clean_number = process_number.replace('-', '').replace('.', '')
            if len(clean_number) < 16:
                logger.error(f"Número de processo inválido: {process_number}")
                return None
                
            jurisdiction = clean_number[13]  # Campo J
            tribunal = clean_number[14:16]   # Campo TR
            
            # Mapeamento de tribunais
            court_mapping = {
                '1': {  # Supremo Tribunal Federal
                    '01': 'api_publica_stf'
                },
                '2': {  # Conselho Nacional de Justiça
                    '01': 'api_publica_cnj'
                },
                '3': {  # Superior Tribunal de Justiça
                    '01': 'api_publica_stj'
                },
                '4': {  # Justiça Federal
                    '01': 'api_publica_trf1',
                    '02': 'api_publica_trf2',
                    '03': 'api_publica_trf3',
                    '04': 'api_publica_trf4',
                    '05': 'api_publica_trf5',
                    '06': 'api_publica_trf6'
                },
                '5': {  # Justiça do Trabalho
                    '01': 'api_publica_trt1',
                    '02': 'api_publica_trt2',
                    '03': 'api_publica_trt3',
                    '04': 'api_publica_trt4',
                    '05': 'api_publica_trt5',
                    '06': 'api_publica_trt6',
                    '07': 'api_publica_trt7',
                    '08': 'api_publica_trt8',
                    '09': 'api_publica_trt9',
                    '10': 'api_publica_trt10',
                    '11': 'api_publica_trt11',
                    '12': 'api_publica_trt12',
                    '13': 'api_publica_trt13',
                    '14': 'api_publica_trt14',
                    '15': 'api_publica_trt15',
                    '16': 'api_publica_trt16',
                    '17': 'api_publica_trt17',
                    '18': 'api_publica_trt18',
                    '19': 'api_publica_trt19',
                    '20': 'api_publica_trt20',
                    '21': 'api_publica_trt21',
                    '22': 'api_publica_trt22',
                    '23': 'api_publica_trt23',
                    '24': 'api_publica_trt24'
                },
                '6': {  # Justiça Eleitoral
                    '03': 'api_publica_tre_tse'
                },
                '7': {  # Justiça Militar da União
                    '01': 'api_publica_stm'
                },
                '8': {  # Justiça Estadual
                    '26': 'api_publica_tjsp',  # São Paulo
                    '19': 'api_publica_tjrj',  # Rio de Janeiro
                    '13': 'api_publica_tjmg',  # Minas Gerais
                    '16': 'api_publica_tjpr',  # Paraná
                    '04': 'api_publica_tjrs',  # Rio Grande do Sul
                    '02': 'api_publica_tjal',  # Alagoas
                    # Adicionar outros TJs conforme necessário
                }
            }
            
            return court_mapping.get(jurisdiction, {}).get(tribunal)
            
        except Exception as e:
            logger.error(f"Erro ao determinar endpoint para processo {process_number}: {e}")
            return None
    
    async def search_process(self, search_request: ProcessSearchRequest) -> Dict[str, Any]:
        """
        Buscar processo na API CNJ DataJus
        """
        try:
            endpoint_alias = self.get_endpoint_for_process(search_request.numeroProcesso)
            if not endpoint_alias:
                raise ValueError("Não foi possível determinar o tribunal para este processo")
            
            endpoint_url = f"{self.config.base_url}/{endpoint_alias}/_search"
            
            # Limpar número do processo
            clean_number = search_request.numeroProcesso.replace('-', '').replace('.', '')
            
            search_payload = {
                "query": {
                    "match": {
                        "numeroProcesso": clean_number
                    }
                },
                "size": search_request.size
            }
            
            response = requests.post(
                endpoint_url,
                headers=self.config.get_headers(),
                json=search_payload,
                timeout=self.config.timeout
            )
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"Processo encontrado: {search_request.numeroProcesso}")
                return data
            elif response.status_code == 404:
                logger.warning(f"Processo não encontrado: {search_request.numeroProcesso}")
                return {"hits": {"total": {"value": 0}, "hits": []}}
            else:
                logger.error(f"Erro na API CNJ: {response.status_code} - {response.text}")
                response.raise_for_status()
                
        except requests.RequestException as e:
            logger.error(f"Erro de conexão com API CNJ: {e}")
            raise
        except Exception as e:
            logger.error(f"Erro inesperado na busca de processo: {e}")
            raise
    
    async def advanced_search(self, query_params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Busca avançada com parâmetros customizados
        """
        try:
            # Buscar em múltiplos tribunais se não especificado
            tribunals = query_params.get('tribunals', ['api_publica_tjsp'])  # Default TJSP
            
            all_results = []
            
            for tribunal in tribunals:
                endpoint_url = f"{self.config.base_url}/{tribunal}/_search"
                
                search_payload = {
                    "query": query_params.get('query', {"match_all": {}}),
                    "size": query_params.get('size', 100),
                    "sort": query_params.get('sort', [{"dataAjuizamento": {"order": "desc"}}])
                }
                
                # Adicionar filtros de data se especificados
                if 'date_from' in query_params or 'date_to' in query_params:
                    search_payload["query"] = {
                        "bool": {
                            "must": [search_payload["query"]],
                            "filter": []
                        }
                    }
                    
                    date_filter = {"range": {"dataAjuizamento": {}}}
                    if 'date_from' in query_params:
                        date_filter["range"]["dataAjuizamento"]["gte"] = query_params['date_from']
                    if 'date_to' in query_params:
                        date_filter["range"]["dataAjuizamento"]["lte"] = query_params['date_to']
                    
                    search_payload["query"]["bool"]["filter"].append(date_filter)
                
                response = requests.post(
                    endpoint_url,
                    headers=self.config.get_headers(),
                    json=search_payload,
                    timeout=self.config.timeout
                )
                
                if response.status_code == 200:
                    tribunal_results = response.json()
                    if tribunal_results.get('hits', {}).get('hits'):
                        all_results.extend(tribunal_results['hits']['hits'])
                
            return {
                "hits": {
                    "total": {"value": len(all_results)},
                    "hits": all_results
                }
            }
            
        except Exception as e:
            logger.error(f"Erro na busca avançada: {e}")
            raise

# Instância global do cliente CNJ DataJus
cnj_client = CNJDataJusAPI()