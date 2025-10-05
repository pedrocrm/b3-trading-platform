"""
Legal Document Processing Module (Simplified)
Módulo para processamento de documentos jurídicos - versão simplificada
"""

import os
import json
import logging
import hashlib
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path

from pydantic import BaseModel, Field
import PyPDF2
import docx
# Removed PIL, pytesseract, sentence-transformers, spacy, sklearn imports for now

logger = logging.getLogger(__name__)

class DocumentType(str, Enum):
    """Tipos de documentos jurídicos"""
    CONTRACT = "contract"
    PETITION = "petition"
    JUDGMENT = "judgment"
    CORRESPONDENCE = "correspondence"
    REGULATION = "regulation"
    TESTAMENT = "testament"
    DEED = "deed"
    OTHER = "other"

class RetentionCategory(str, Enum):
    """Categorias de retenção LGPD"""
    CATEGORY_1 = "indefinite"  # Testamentos, escrituras
    CATEGORY_2 = "7_years"     # Arquivos de clientes
    CATEGORY_3 = "5_years"     # Documentos administrativos
    CATEGORY_4 = "3_years"     # Correspondências

class DocumentMetadata(BaseModel):
    """Metadados do documento"""
    id: str
    filename: str
    document_type: DocumentType
    retention_category: RetentionCategory
    upload_date: datetime
    retention_date: Optional[datetime]
    file_size: int
    file_hash: str
    content_preview: str = Field(max_length=500)
    extracted_entities: List[Dict[str, Any]] = []
    tenant_id: str
    client_id: Optional[str] = None
    case_id: Optional[str] = None
    is_confidential: bool = True
    access_log: List[Dict[str, Any]] = []

class LegalEntity(BaseModel):
    """Entidade jurídica extraída do documento"""
    entity_type: str  # PERSON, ORG, DATE, MONEY, LAW_REFERENCE, etc.
    text: str
    start_pos: int
    end_pos: int
    confidence: float
    context: str

class DocumentProcessingResult(BaseModel):
    """Resultado do processamento de documento"""
    document_id: str
    success: bool
    extracted_text: str
    entities: List[LegalEntity]
    embedding: List[float]
    document_type: DocumentType
    confidence_score: float
    processing_time: float
    errors: List[str] = []

class LegalRetentionPolicy:
    """Política de retenção de documentos para conformidade LGPD"""
    
    RETENTION_RULES = {
        DocumentType.TESTAMENT: RetentionCategory.CATEGORY_1,
        DocumentType.DEED: RetentionCategory.CATEGORY_1,
        DocumentType.CONTRACT: RetentionCategory.CATEGORY_2,
        DocumentType.PETITION: RetentionCategory.CATEGORY_2,
        DocumentType.JUDGMENT: RetentionCategory.CATEGORY_2,
        DocumentType.CORRESPONDENCE: RetentionCategory.CATEGORY_4,
        DocumentType.REGULATION: RetentionCategory.CATEGORY_3,
        DocumentType.OTHER: RetentionCategory.CATEGORY_2
    }
    
    RETENTION_PERIODS = {
        RetentionCategory.CATEGORY_1: None,  # Indefinido
        RetentionCategory.CATEGORY_2: timedelta(days=7*365),  # 7 anos
        RetentionCategory.CATEGORY_3: timedelta(days=5*365),  # 5 anos
        RetentionCategory.CATEGORY_4: timedelta(days=3*365)   # 3 anos
    }
    
    @classmethod
    def get_retention_date(cls, document_type: DocumentType, upload_date: datetime) -> Optional[datetime]:
        """Calcular data de retenção baseada no tipo de documento"""
        category = cls.RETENTION_RULES.get(document_type, RetentionCategory.CATEGORY_2)
        period = cls.RETENTION_PERIODS.get(category)
        
        if period is None:
            return None  # Retenção indefinida
        
        return upload_date + period
    
    @classmethod
    def should_delete(cls, document: DocumentMetadata) -> bool:
        """Verificar se documento deve ser excluído"""
        if document.retention_date is None:
            return False
        
        return datetime.now() > document.retention_date

class LegalDocumentProcessor:
    """Processador principal de documentos jurídicos - versão simplificada"""
    
    def __init__(self):
        # Simplified initialization without ML models
        logger.info("Inicializando processador de documentos (versão simplificada)")
        
    def _get_portuguese_stopwords(self) -> List[str]:
        """Retorna lista de stopwords em português"""
        return [
            'a', 'ao', 'aos', 'aquela', 'aquelas', 'aquele', 'aqueles', 'aquilo',
            'as', 'até', 'com', 'como', 'da', 'das', 'de', 'dela', 'delas', 'dele',
            'deles', 'depois', 'do', 'dos', 'e', 'ela', 'elas', 'ele', 'eles', 'em',
            'entre', 'essa', 'essas', 'esse', 'esses', 'esta', 'estas', 'este',
            'estes', 'eu', 'isto', 'já', 'mais', 'mas', 'me', 'mesmo', 'meu', 'meus',
            'minha', 'minhas', 'muito', 'na', 'nas', 'não', 'no', 'nos', 'nós', 'o',
            'os', 'ou', 'para', 'pela', 'pelas', 'pelo', 'pelos', 'que', 'se', 'seu',
            'seus', 'sua', 'suas', 'também', 'te', 'tem', 'uma', 'um', 'você', 'vocês'
        ]
    
    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extrair texto de arquivo PDF"""
        try:
            text = ""
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
            return text.strip()
        except Exception as e:
            logger.error(f"Erro ao extrair texto de PDF {file_path}: {e}")
            raise
    
    def extract_text_from_docx(self, file_path: str) -> str:
        """Extrair texto de arquivo DOCX"""
        try:
            doc = docx.Document(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text.strip()
        except Exception as e:
            logger.error(f"Erro ao extrair texto de DOCX {file_path}: {e}")
            raise
    
    def extract_text_from_image(self, file_path: str) -> str:
        """Extrair texto de imagem usando OCR - versão simplificada"""
        logger.warning("OCR não disponível na versão simplificada")
        return "OCR não disponível - instale pytesseract e Pillow para funcionalidade completa"
    
    def extract_legal_entities(self, text: str) -> List[LegalEntity]:
        """Extrair entidades jurídicas do texto - versão simplificada"""
        entities = []
        
        try:
            # Padrões simples para entidades específicas do contexto jurídico
            entities.extend(self._extract_legal_specific_entities(text))
            
        except Exception as e:
            logger.error(f"Erro ao extrair entidades: {e}")
        
        return entities
    
    def _extract_legal_specific_entities(self, text: str) -> List[LegalEntity]:
        """Extrair entidades específicas do contexto jurídico"""
        entities = []
        
        # Padrões para números de processo
        import re
        
        # Padrão CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO
        cnj_pattern = r'\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}'
        
        for match in re.finditer(cnj_pattern, text):
            entity = LegalEntity(
                entity_type='PROCESS_NUMBER',
                text=match.group(),
                start_pos=match.start(),
                end_pos=match.end(),
                confidence=0.95,
                context=self._get_entity_context(text, match.start(), match.end())
            )
            entities.append(entity)
        
        # Padrões para artigos de lei
        law_pattern = r'[Aa]rt\.?\s*\d+[º°]?'
        
        for match in re.finditer(law_pattern, text):
            entity = LegalEntity(
                entity_type='LAW_ARTICLE',
                text=match.group(),
                start_pos=match.start(),
                end_pos=match.end(),
                confidence=0.9,
                context=self._get_entity_context(text, match.start(), match.end())
            )
            entities.append(entity)
        
        return entities
    
    def _get_entity_context(self, text: str, start: int, end: int, window: int = 50) -> str:
        """Obter contexto ao redor de uma entidade"""
        context_start = max(0, start - window)
        context_end = min(len(text), end + window)
        return text[context_start:context_end].strip()
    
    def classify_document_type(self, text: str) -> Tuple[DocumentType, float]:
        """Classificar tipo de documento baseado no conteúdo"""
        # Palavras-chave para cada tipo de documento
        keywords = {
            DocumentType.CONTRACT: ['contrato', 'contratar', 'cláusula', 'partes', 'acordo'],
            DocumentType.PETITION: ['petição', 'requer', 'solicita', 'requerente', 'inicial'],
            DocumentType.JUDGMENT: ['sentença', 'julgo', 'decisão', 'tribunal', 'acórdão'],
            DocumentType.CORRESPONDENCE: ['carta', 'ofício', 'email', 'comunicação'],
            DocumentType.REGULATION: ['regulamento', 'norma', 'portaria', 'resolução'],
            DocumentType.TESTAMENT: ['testamento', 'testador', 'herança', 'legado'],
            DocumentType.DEED: ['escritura', 'cartório', 'tabelião', 'registro']
        }
        
        text_lower = text.lower()
        scores = {}
        
        for doc_type, words in keywords.items():
            score = sum(text_lower.count(word) for word in words)
            scores[doc_type] = score
        
        if not scores or max(scores.values()) == 0:
            return DocumentType.OTHER, 0.5
        
        best_type = max(scores, key=scores.get)
        confidence = min(scores[best_type] / 10, 1.0)  # Normalizar confiança
        
        return best_type, confidence
    
    def generate_embedding(self, text: str) -> List[float]:
        """Gerar embedding semântico do texto - versão simplificada"""
        try:
            # Simplified embedding - just return a hash-based representation
            import hashlib
            hash_digest = hashlib.md5(text.encode()).hexdigest()
            # Convert hex to list of floats (simplified)
            embedding = [float(int(hash_digest[i:i+2], 16)) / 255.0 for i in range(0, len(hash_digest), 2)]
            return embedding[:384]  # Pad or truncate to 384 dimensions
        except Exception as e:
            logger.error(f"Erro ao gerar embedding: {e}")
            # Return zero embedding in case of error
            return [0.0] * 384
    
    def calculate_file_hash(self, file_path: str) -> str:
        """Calcular hash SHA-256 do arquivo"""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    
    async def process_document(self, file_path: str, tenant_id: str, 
                             client_id: Optional[str] = None, 
                             case_id: Optional[str] = None) -> DocumentProcessingResult:
        """Processar documento completo"""
        start_time = datetime.now()
        errors = []
        
        try:
            # Verificar se arquivo existe
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"Arquivo não encontrado: {file_path}")
            
            file_extension = Path(file_path).suffix.lower()
            filename = Path(file_path).name
            
            # Extrair texto baseado no tipo de arquivo
            if file_extension == '.pdf':
                extracted_text = self.extract_text_from_pdf(file_path)
            elif file_extension == '.docx':
                extracted_text = self.extract_text_from_docx(file_path)
            elif file_extension in ['.png', '.jpg', '.jpeg', '.tiff']:
                extracted_text = self.extract_text_from_image(file_path)
                errors.append("OCR limitado na versão simplificada")
            elif file_extension == '.txt':
                with open(file_path, 'r', encoding='utf-8') as f:
                    extracted_text = f.read()
            else:
                raise ValueError(f"Tipo de arquivo não suportado: {file_extension}")
            
            if not extracted_text.strip():
                errors.append("Nenhum texto foi extraído do documento")
                extracted_text = ""
            
            # Extrair entidades jurídicas
            entities = self.extract_legal_entities(extracted_text)
            
            # Classificar tipo de documento
            document_type, confidence_score = self.classify_document_type(extracted_text)
            
            # Gerar embedding
            embedding = self.generate_embedding(extracted_text)
            
            # Calcular hash do arquivo
            file_hash = self.calculate_file_hash(file_path)
            
            # Calcular tempo de processamento
            processing_time = (datetime.now() - start_time).total_seconds()
            
            # Gerar ID único para o documento
            document_id = hashlib.md5(f"{file_hash}_{tenant_id}_{datetime.now().isoformat()}".encode()).hexdigest()
            
            return DocumentProcessingResult(
                document_id=document_id,
                success=len(errors) == 0,
                extracted_text=extracted_text,
                entities=entities,
                embedding=embedding,
                document_type=document_type,
                confidence_score=confidence_score,
                processing_time=processing_time,
                errors=errors
            )
            
        except Exception as e:
            logger.error(f"Erro no processamento do documento {file_path}: {e}")
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return DocumentProcessingResult(
                document_id="error",
                success=False,
                extracted_text="",
                entities=[],
                embedding=[],
                document_type=DocumentType.OTHER,
                confidence_score=0.0,
                processing_time=processing_time,
                errors=[str(e)]
            )

# Instância global do processador
document_processor = LegalDocumentProcessor()