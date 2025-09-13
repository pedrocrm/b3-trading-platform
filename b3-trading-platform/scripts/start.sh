#!/bin/bash

# ========================================
# B3 Trading Platform - Script de Inicialização
# ========================================

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função de log
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Banner
clear
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║           🚀 B3 TRADING PLATFORM v1.0.0 🚀              ║"
echo "║                                                          ║"
echo "║         Plataforma de Trading Automatizado B3           ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Verificar pré-requisitos
log "Verificando pré-requisitos..."

# Verificar Docker
if ! command -v docker &> /dev/null; then
    error "Docker não está instalado. Por favor, instale o Docker primeiro."
fi

# Verificar Docker Compose
if ! command -v docker-compose &> /dev/null; then
    # Tentar docker compose (novo comando)
    if ! docker compose version &> /dev/null; then
        error "Docker Compose não está instalado. Por favor, instale o Docker Compose."
    else
        DOCKER_COMPOSE="docker compose"
    fi
else
    DOCKER_COMPOSE="docker-compose"
fi

info "Docker e Docker Compose detectados ✓"

# Verificar se .env existe
if [ ! -f .env ]; then
    warning "Arquivo .env não encontrado. Criando a partir do exemplo..."
    if [ -f .env.example ]; then
        cp .env.example .env
        info "Arquivo .env criado. Por favor, configure suas credenciais."
        info "Editando .env automaticamente..."
        ${EDITOR:-nano} .env
    else
        error "Arquivo .env.example não encontrado!"
    fi
fi

# Menu de opções
echo ""
echo "Selecione o modo de inicialização:"
echo "1) Desenvolvimento (com hot-reload)"
echo "2) Produção"
echo "3) Build apenas"
echo "4) Reset completo (limpa tudo e reconstrói)"
echo "5) Verificar status"
echo "6) Parar serviços"
echo "7) Ver logs"
echo "8) Backup do banco de dados"
echo "9) Sair"
echo ""
read -p "Opção: " option

case $option in
    1)
        log "Iniciando em modo DESENVOLVIMENTO..."
        
        # Criar diretórios necessários
        mkdir -p logs
        mkdir -p data
        
        # Build das imagens
        log "Construindo imagens Docker..."
        $DOCKER_COMPOSE build
        
        # Iniciar serviços
        log "Iniciando serviços..."
        $DOCKER_COMPOSE up -d
        
        # Aguardar serviços iniciarem
        log "Aguardando serviços iniciarem..."
        sleep 10
        
        # Verificar saúde dos serviços
        log "Verificando saúde dos serviços..."
        
        # Verificar PostgreSQL
        if docker exec b3_postgres pg_isready -U trader -d b3trading &> /dev/null; then
            info "PostgreSQL: OK ✓"
        else
            warning "PostgreSQL: Iniciando..."
        fi
        
        # Verificar Redis
        if docker exec b3_redis redis-cli ping &> /dev/null; then
            info "Redis: OK ✓"
        else
            warning "Redis: Iniciando..."
        fi
        
        # Verificar API
        if curl -s http://localhost:8000/health > /dev/null; then
            info "API Backend: OK ✓"
        else
            warning "API Backend: Iniciando..."
        fi
        
        # Verificar Frontend
        if curl -s http://localhost:3000 > /dev/null; then
            info "Frontend: OK ✓"
        else
            warning "Frontend: Iniciando..."
        fi
        
        echo ""
        log "${GREEN}✅ B3 Trading Platform iniciada com sucesso!${NC}"
        echo ""
        echo "📊 Dashboard: ${BLUE}http://localhost:3000${NC}"
        echo "🚀 API: ${BLUE}http://localhost:8000${NC}"
        echo "📝 API Docs: ${BLUE}http://localhost:8000/docs${NC}"
        echo "📈 Grafana: ${BLUE}http://localhost:3001${NC} (admin/grafana_admin_2024)"
        echo ""
        echo "Para ver os logs: ${YELLOW}docker-compose logs -f${NC}"
        echo "Para parar: ${YELLOW}docker-compose down${NC}"
        ;;
        
    2)
        log "Iniciando em modo PRODUÇÃO..."
        
        # Desabilitar debug no .env
        sed -i 's/DEBUG=true/DEBUG=false/g' .env
        
        # Build otimizado
        log "Build otimizado para produção..."
        $DOCKER_COMPOSE -f docker-compose.yml build --no-cache
        
        # Iniciar em modo daemon
        $DOCKER_COMPOSE -f docker-compose.yml up -d
        
        log "${GREEN}✅ Produção iniciada!${NC}"
        ;;
        
    3)
        log "Construindo imagens..."
        $DOCKER_COMPOSE build --no-cache
        log "${GREEN}✅ Build concluído!${NC}"
        ;;
        
    4)
        warning "RESET COMPLETO - Isso irá apagar todos os dados!"
        read -p "Tem certeza? (y/N): " confirm
        
        if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
            log "Executando reset completo..."
            
            # Parar todos os containers
            $DOCKER_COMPOSE down -v
            
            # Limpar Docker
            docker system prune -af
            
            # Remover dados
            rm -rf logs/* data/*
            
            # Reconstruir
            $DOCKER_COMPOSE build --no-cache
            
            # Iniciar
            $DOCKER_COMPOSE up -d
            
            log "${GREEN}✅ Reset completo realizado!${NC}"
        else
            info "Reset cancelado."
        fi
        ;;
        
    5)
        log "Verificando status dos serviços..."
        echo ""
        $DOCKER_COMPOSE ps
        echo ""
        
        # Verificar saúde individual
        echo "Status detalhado:"
        
        # PostgreSQL
        if docker exec b3_postgres pg_isready -U trader -d b3trading &> /dev/null 2>&1; then
            echo "✅ PostgreSQL: Rodando"
        else
            echo "❌ PostgreSQL: Parado ou com problemas"
        fi
        
        # Redis
        if docker exec b3_redis redis-cli ping &> /dev/null 2>&1; then
            echo "✅ Redis: Rodando"
        else
            echo "❌ Redis: Parado ou com problemas"
        fi
        
        # API
        if curl -s http://localhost:8000/health > /dev/null 2>&1; then
            echo "✅ API Backend: Rodando"
            API_HEALTH=$(curl -s http://localhost:8000/health)
            echo "   └─ Conexões WebSocket: $(echo $API_HEALTH | grep -o '"connections":[0-9]*' | grep -o '[0-9]*')"
        else
            echo "❌ API Backend: Parado ou com problemas"
        fi
        
        # Frontend
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo "✅ Frontend: Rodando"
        else
            echo "❌ Frontend: Parado ou com problemas"
        fi
        
        # Grafana
        if curl -s http://localhost:3001 > /dev/null 2>&1; then
            echo "✅ Grafana: Rodando"
        else
            echo "❌ Grafana: Parado ou com problemas"
        fi
        ;;
        
    6)
        log "Parando todos os serviços..."
        $DOCKER_COMPOSE down
        log "${GREEN}✅ Serviços parados!${NC}"
        ;;
        
    7)
        echo "Selecione o serviço para ver logs:"
        echo "1) Todos"
        echo "2) API Backend"
        echo "3) Frontend"
        echo "4) PostgreSQL"
        echo "5) Redis"
        echo "6) Market Data"
        echo "7) Grafana"
        read -p "Opção: " log_option
        
        case $log_option in
            1) $DOCKER_COMPOSE logs -f ;;
            2) $DOCKER_COMPOSE logs -f api ;;
            3) $DOCKER_COMPOSE logs -f web ;;
            4) $DOCKER_COMPOSE logs -f postgres ;;
            5) $DOCKER_COMPOSE logs -f redis ;;
            6) $DOCKER_COMPOSE logs -f market-data ;;
            7) $DOCKER_COMPOSE logs -f grafana ;;
            *) warning "Opção inválida" ;;
        esac
        ;;
        
    8)
        log "Fazendo backup do banco de dados..."
        
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        BACKUP_FILE="backup_${TIMESTAMP}.sql"
        
        docker exec b3_postgres pg_dump -U trader b3trading > $BACKUP_FILE
        
        if [ -f $BACKUP_FILE ]; then
            log "${GREEN}✅ Backup salvo em: $BACKUP_FILE${NC}"
        else
            error "Falha ao criar backup"
        fi
        ;;
        
    9)
        info "Saindo..."
        exit 0
        ;;
        
    *)
        error "Opção inválida!"
        ;;
esac

echo ""
log "Script finalizado."