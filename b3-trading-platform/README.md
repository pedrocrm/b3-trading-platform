# ⚖️ Legal Tech Platform

**Sistema Jurídico Avançado com Integração CNJ DataJus API e IA**

Plataforma completa para escritórios de advocacia com busca de processos, processamento de documentos, gestão de casos e conformidade LGPD.

![Legal Tech Platform](https://github.com/user-attachments/assets/b5a1eaf6-ec27-480f-94d1-fe0f290461b2)

## 🚀 Funcionalidades Principais

### 🔍 Consulta CNJ DataJus
- Busca em **91 tribunais brasileiros** em tempo real
- Cobertura nacional: STJ, TST, TSE, TRFs, TJs, TRTs, TREs, TJMs
- Mapeamento automático de tribunal por número CNJ
- API oficial com chave pública do CNJ

### 📄 Processamento Inteligente de Documentos
- **OCR Avançado**: PDF, DOCX, imagens com IA
- **Classificação Automática**: Contratos, petições, sentenças
- **Extração de Entidades**: Números de processo, artigos de lei
- **Busca Semântica**: Embeddings para similaridade

### ⚖️ Gestão de Casos Jurídicos
- Dashboard moderno para advogados
- Controle de prazos com alertas automáticos
- Organização por status, tipo e responsável
- Identificação de casos urgentes

### 🏢 Multi-tenancy para Escritórios
- Isolamento completo entre escritórios
- RBAC com 6 papéis jurídicos específicos
- Murallas éticas para conflitos de interesse
- Auditoria completa para conformidade

### 📋 Conformidade LGPD
- Políticas de retenção automáticas
- 4 categorias: indefinida, 7 anos, 5 anos, 3 anos
- Direitos do titular implementados
- Exclusão automática por categoria

## 📋 Características

- ✅ **API REST Completa** com FastAPI
- ✅ **Interface Web Moderna** com Next.js
- ✅ **Integração CNJ DataJus** oficial
- ✅ **Processamento de Documentos** com IA
- ✅ **Multi-tenancy** para escritórios
- ✅ **RBAC Jurídico** com 6 papéis
- ✅ **Conformidade LGPD** automática
- ✅ **Auditoria Completa** para compliance
- ✅ **Docker Compose** para deploy
- ✅ **Autenticação JWT** segura

## 🛠 Tecnologias

### Backend
- **Python 3.11** + **FastAPI** - API moderna e rápida
- **PostgreSQL 15** - Banco multi-tenant robusto
- **Redis 7** - Cache e sessões
- **CNJ DataJus API** - Integração oficial

### Frontend
- **Next.js 14** + **React 18** - Interface moderna
- **TypeScript** - Tipagem forte
- **TailwindCSS** - Design responsivo
- **Lucide React** - Ícones profissionais

### Legal Tech Stack
- **pytesseract** - OCR para documentos
- **spaCy** - NLP e extração de entidades
- **sentence-transformers** - Embeddings semânticos
- **scikit-learn** - Classificação ML

## 🚀 Instalação Rápida

### Pré-requisitos

- Docker e Docker Compose instalados
- Git
- 8GB RAM mínimo (16GB recomendado)
- 10GB espaço em disco disponível
- Portas livres: 3000, 3001, 5432, 6379, 8000, 9090

### Passo a Passo

1. **Clone ou baixe o projeto**
   ```bash
   # Se você tem o projeto em um repositório Git
   git clone https://github.com/seu-usuario/b3-trading-platform.git
   cd b3-trading-platform
   
   # Ou se você já tem os arquivos, navegue até o diretório
   cd b3-trading-platform
   ```

2. **Configure as variáveis de ambiente**
   ```bash
   # O arquivo .env já está configurado com valores padrão
   # Edite conforme necessário para suas credenciais
   nano .env
   ```

3. **Inicie a plataforma**
   ```bash
   # Usando Make (recomendado)
   make up
   
   # Ou usando Docker Compose diretamente
   docker-compose up -d
   
   # Ou usando o script interativo
   ./scripts/start.sh
   ```

4. **Acesse os serviços**
   - 📊 **Dashboard**: http://localhost:3000
   - 🚀 **API**: http://localhost:8000
   - 📝 **API Docs**: http://localhost:8000/docs
   - 📈 **Grafana**: http://localhost:3001 (admin/grafana_admin_2024)

## 📖 Uso

### Comandos Make

```bash
make help      # Mostra todos os comandos disponíveis
make build     # Constrói as imagens Docker
make up        # Inicia todos os serviços
make down      # Para todos os serviços
make logs      # Visualiza logs
make clean     # Remove containers e volumes
make reset     # Reset completo
make status    # Status dos serviços
make backup    # Backup do banco de dados
```

### API Endpoints

- `GET /` - Status da API
- `GET /health` - Health check
- `GET /api/v1/market` - Dados de mercado
- `GET /api/v1/market/{symbol}` - Dados de um símbolo específico
- `POST /api/v1/trade` - Executar trade
- `GET /api/v1/positions` - Posições abertas
- `GET /api/v1/account` - Informações da conta
- `WS /ws` - WebSocket para dados em tempo real

### Autenticação

A API usa autenticação JWT. Usuários padrão:

- **Admin**: `admin` / `admin123`
- **Trader**: `trader` / `trader123`

Para obter um token:

```bash
curl -X POST http://localhost:8000/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"
```

## 🔧 Configuração

### Variáveis de Ambiente (.env)

```env
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=b3trading
DB_USER=trader
DB_PASSWORD=b3_secure_pass_2024

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_b3_pass_2024

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
JWT_SECRET_KEY=b3_jwt_super_secret_key_2024_very_secure

# Trading Configuration
MAX_POSITION_SIZE=100000
MAX_DAILY_LOSS=5000
RISK_PERCENT=2.0

# B3 API (Configure com suas credenciais)
B3_API_KEY=YOUR_B3_API_KEY_HERE
B3_API_SECRET=YOUR_B3_API_SECRET_HERE

# MetaTrader 5 (Configure com suas credenciais)
MT5_LOGIN=YOUR_MT5_LOGIN
MT5_PASSWORD=YOUR_MT5_PASSWORD
MT5_SERVER=YOUR_BROKER_SERVER
```

## 🏗 Estrutura do Projeto

```
b3-trading-platform/
├── backend/                 # API FastAPI
│   ├── src/
│   │   ├── main.py         # Aplicação principal
│   │   └── routers/        # Rotas da API
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/               # Interface Next.js
│   ├── src/
│   │   └── app/
│   │       ├── components/ # Componentes React
│   │       ├── layout.tsx
│   │       └── page.tsx
│   ├── Dockerfile
│   └── package.json
├── database/               # Scripts do banco
│   └── init.sql
├── scripts/                # Scripts utilitários
│   └── start.sh
├── monitoring/             # Configurações de monitoramento
├── docker-compose.yml      # Orquestração dos serviços
├── Makefile               # Comandos automatizados
└── .env                   # Variáveis de ambiente
```

## 🧪 Testes

```bash
# Testes unitários do backend
make test

# Teste manual da API
curl http://localhost:8000/health

# Teste do WebSocket
# Abra o console do navegador em http://localhost:3000 e execute:
const ws = new WebSocket('ws://localhost:8000/ws');
ws.onmessage = (event) => console.log(JSON.parse(event.data));
```

## 🚨 Solução de Problemas

### Porta já em uso

```bash
# Verificar quem está usando a porta
lsof -i :3000
lsof -i :8000

# Matar processo
kill -9 [PID]
```

### Container não inicia

```bash
# Ver logs detalhados
docker-compose logs [service_name]

# Reconstruir imagem
docker-compose build --no-cache [service_name]

# Reset completo
make reset
```

### Problemas de permissão (Linux)

```bash
# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker
```

## 📊 Monitoramento

Acesse o Grafana em http://localhost:3001 para visualizar:

- Métricas de trading
- Performance do sistema
- Análise de P&L
- Logs e alertas

**Credenciais do Grafana**: admin / grafana_admin_2024

## 🤖 MetaTrader 5 Integration

1. Instale o MetaTrader 5
2. Copie o EA de `mt5-ea/` para o diretório de EAs do MT5
3. Configure as URLs permitidas no MT5
4. Compile e execute o EA
5. Configure suas credenciais no arquivo `.env`

## 🔒 Segurança

- Autenticação JWT
- Senhas criptografadas com bcrypt
- HTTPS em produção (configure certificados)
- Rate limiting (implementar em produção)
- Validação de entrada rigorosa

## 🚀 Deploy em Produção

### Preparação

1. Configure certificados SSL
2. Use banco de dados gerenciado (AWS RDS, etc.)
3. Configure backup automático
4. Implemente monitoramento avançado
5. Configure domínio personalizado

### Variáveis de Produção

```env
ENVIRONMENT=production
DEBUG=false
# Configure URLs de produção
NEXT_PUBLIC_API_URL=https://api.seudominio.com
NEXT_PUBLIC_WS_URL=wss://api.seudominio.com
```

## ⚠ Aviso Legal

Esta plataforma é para fins educacionais e de demonstração. Trading envolve riscos significativos de perda financeira. Sempre:

- Teste em conta demo primeiro
- Use gestão de risco adequada
- Consulte um consultor financeiro
- Entenda os riscos envolvidos

## 📧 Suporte

Para suporte técnico:

1. Verifique os logs: `make logs`
2. Consulte a documentação da API: http://localhost:8000/docs
3. Abra uma issue no repositório do projeto

## 🎉 Começando

Execute estes comandos para iniciar:

```bash
# 1. Navegue até o diretório do projeto
cd b3-trading-platform

# 2. Inicie todos os serviços
make up

# 3. Acesse o dashboard
# http://localhost:3000
```

**Pronto! Sua plataforma de trading está rodando!** 🚀

---

**Desenvolvido com ❤️ para a comunidade de trading brasileira**

