# Legal Tech Platform - Implementação CNJ DataJus API

## Visão Geral

Este projeto transforma a plataforma B3 Trading em um sistema jurídico completo integrado com a API CNJ DataJus, processamento de documentos com IA e gestão de casos jurídicos. A implementação segue as melhores práticas de 2024-2025 para legal tech.

## Funcionalidades Implementadas

### 🔍 Integração CNJ DataJus API
- **Busca de Processos**: Consulta direta aos tribunais brasileiros através da API oficial
- **Cobertura Nacional**: 91 tribunais (STJ, TST, TSE, TRFs, TJs, TRTs, TREs, TJMs)
- **Mapeamento Automático**: Determinação automática do tribunal baseado no número CNJ
- **Autenticação**: Chave pública oficial do CNJ configurada

### 📄 Processamento de Documentos
- **OCR Inteligente**: Extração de texto de PDFs, DOCX, imagens
- **Classificação Automática**: IA identifica tipos de documentos (contratos, petições, sentenças)
- **Extração de Entidades**: Reconhecimento de números de processo, artigos de lei, pessoas
- **Embeddings Semânticos**: Geração de vetores para busca por similaridade

### ⚖️ Gestão de Casos Jurídicos
- **Dashboard Completo**: Interface moderna para gestão de casos
- **Controle de Prazos**: Alertas automáticos para deadlines
- **Organização**: Filtros por status, tipo, responsável
- **Urgência**: Identificação automática de casos com prazo vencendo

### 🏢 Multi-tenancy para Escritórios
- **Isolamento de Dados**: Separação completa entre escritórios
- **RBAC Jurídico**: Papéis específicos (Sócio, Associado, Paralegal, Cliente)
- **Murallas Éticas**: Controle automático de conflitos de interesse
- **Auditoria**: Logs completos para conformidade

### 📋 Conformidade LGPD
- **Retenção Automática**: Políticas baseadas no tipo de documento
- **Categorização**: 4 categorias de retenção (indefinida a 3 anos)
- **Direitos do Titular**: Implementação dos direitos LGPD
- **Exclusão Automática**: Remoção conforme políticas de retenção

## Arquitetura Técnica

### Backend (FastAPI)
```
backend/src/
├── main.py                     # API principal com endpoints legais
├── cnj_datajus.py             # Integração CNJ DataJus
├── legal_document_processor.py # Processamento de documentos
└── legal_rbac.py              # Multi-tenancy e RBAC
```

### Frontend (Next.js + React)
```
frontend/src/app/components/
├── Dashboard.tsx              # Dashboard principal
├── CNJSearch.tsx             # Busca CNJ DataJus
├── DocumentUpload.tsx        # Upload e processamento
└── CaseManagement.tsx        # Gestão de casos
```

### Principais Endpoints API

- `POST /api/v1/legal/search-cnj` - Busca processos CNJ
- `POST /api/v1/legal/upload-document` - Upload de documentos
- `POST /api/v1/legal/analyze-text` - Análise de texto jurídico
- `POST /api/v1/legal/cases` - Gestão de casos
- `GET /api/v1/legal/retention-policy` - Políticas LGPD

## Tecnologias Utilizadas

### Core Stack
- **Backend**: Python 3.11, FastAPI, SQLAlchemy
- **Frontend**: Next.js 14, React 18, TypeScript, TailwindCSS
- **Database**: PostgreSQL 15 (multi-tenant)
- **Cache**: Redis 7

### Legal Tech Específico
- **CNJ API**: Integração oficial com chave pública
- **OCR**: pytesseract para documentos digitalizados
- **NLP**: spaCy para extração de entidades jurídicas
- **ML**: scikit-learn para classificação de documentos
- **Embeddings**: sentence-transformers para busca semântica

## Recursos de Segurança

### Autenticação e Autorização
- **JWT**: Tokens seguros com expiração configurável
- **RBAC**: 6 papéis hierárquicos específicos do jurídico
- **Multi-tenant**: Isolamento completo entre escritórios
- **API Keys**: Autenticação por chaves para integração

### Proteção de Dados
- **Criptografia**: AES-256 para dados sensíveis
- **Headers de Segurança**: CSP, HSTS, X-Frame-Options
- **CORS**: Configuração restritiva para origens permitidas
- **Rate Limiting**: Proteção contra abuso de API

## Interface do Usuário

A plataforma apresenta uma interface moderna e intuitiva:

![Legal Tech Platform](https://github.com/user-attachments/assets/b5a1eaf6-ec27-480f-94d1-fe0f290461b2)

### Características da UI
- **Design Responsivo**: Adaptável a desktop, tablet e mobile
- **Tema Legal**: Cores e ícones específicos para área jurídica
- **Navegação por Abas**: Organização clara das funcionalidades
- **Feedback Visual**: Estados de loading, erro e sucesso
- **Acessibilidade**: Suporte a leitores de tela

## Instalação e Configuração

### Pré-requisitos
```bash
- Docker e Docker Compose
- Node.js 18+ (para desenvolvimento)
- Python 3.11+ (para desenvolvimento)
```

### Configuração Rápida
```bash
# 1. Clone o repositório
git clone https://github.com/pedrocrm/b3-trading-platform.git
cd b3-trading-platform

# 2. Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas configurações

# 3. Inicie com Docker
docker-compose up -d

# 4. Acesse a aplicação
# Frontend: http://localhost:3000
# API: http://localhost:8000
# Documentação: http://localhost:8000/docs
```

### Variáveis de Ambiente Importantes
```env
# CNJ DataJus
CNJ_API_KEY=MWM2ZDVjNzgtMGVlNy00ZGIzLTk3YjMtNWY4NDg5OGExOTBh

# Upload de Documentos
UPLOAD_DIR=/app/uploads/legal_documents
MAX_FILE_SIZE=52428800

# LGPD Compliance
LGPD_COMPLIANCE=true
DEFAULT_RETENTION_YEARS=7
```

## Conformidade e Auditoria

### LGPD (Lei Geral de Proteção de Dados)
- ✅ **Privacy by Design**: Proteção desde a concepção
- ✅ **Minimização de Dados**: Coleta apenas dados necessários
- ✅ **Consentimento**: Registro de consentimentos explícitos
- ✅ **Direitos do Titular**: Acesso, correção, exclusão, portabilidade
- ✅ **DPO**: Suporte para Encarregado de Dados

### Auditoria
- **Logs de Acesso**: Registro de todas as ações sensíveis
- **Trilha de Auditoria**: Histórico completo de modificações
- **Relatórios**: Dashboards para conformidade
- **Backup Seguro**: Rotinas automatizadas com criptografia

## Roadmap e Melhorias Futuras

### Curto Prazo
- [ ] Integração com sistemas de cartório
- [ ] OCR avançado com IA (Azure Document Intelligence)
- [ ] Assinatura digital com certificado A1/A3
- [ ] Relatórios avançados e BI

### Médio Prazo
- [ ] Machine Learning para previsão de resultados
- [ ] Integração com PJe (Processo Judicial Eletrônico)
- [ ] App mobile para advogados
- [ ] API para integração com outros sistemas

### Longo Prazo
- [ ] IA conversacional para consultas jurídicas
- [ ] Blockchain para documentos imutáveis
- [ ] Análise preditiva de jurisprudência
- [ ] Marketplace de serviços jurídicos

## Suporte e Manutenção

### Monitoramento
- **Saúde da API**: Endpoint `/health` com métricas
- **Logs Estruturados**: JSON com contexto completo
- **Métricas**: Prometheus + Grafana configurados
- **Alertas**: Notificação automática de problemas

### Performance
- **Cache Inteligente**: Redis para dados frequentes
- **CDN**: Distribuição de conteúdo estático
- **Otimização**: Queries SQL otimizadas
- **Scaling**: Suporte a múltiplas instâncias

---

## Contato e Suporte

Para questões técnicas, suporte ou contribuições:

- 📧 Email: suporte@legaltechplatform.com
- 📖 Documentação: http://localhost:8000/docs
- 🐛 Issues: GitHub Issues
- 💬 Discord: [Legal Tech Community]

---

*Última atualização: Dezembro 2024*