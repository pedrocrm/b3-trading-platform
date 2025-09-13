#!/bin/bash

# ========================================
# B3 Trading Platform - Script de Validação
# ========================================

set -e

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
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Banner
clear
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║           🔍 B3 TRADING PLATFORM VALIDATOR 🔍            ║"
echo "║                                                          ║"
echo "║         Validação de Configuração e Ambiente            ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

log "Iniciando validação do ambiente..."

# Contador de erros
ERRORS=0

# 1. Verificar estrutura de diretórios
log "1. Verificando estrutura de diretórios..."

REQUIRED_DIRS=(
    "backend/src"
    "frontend/src/app"
    "database"
    "scripts"
    "monitoring"
    "logs"
    "data"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        success "✓ Diretório $dir existe"
    else
        error "✗ Diretório $dir não encontrado"
        ((ERRORS++))
    fi
done

# 2. Verificar arquivos essenciais
log "2. Verificando arquivos essenciais..."

REQUIRED_FILES=(
    ".env"
    "docker-compose.yml"
    "Makefile"
    "README.md"
    "backend/Dockerfile"
    "backend/requirements.txt"
    "backend/src/main.py"
    "frontend/Dockerfile"
    "frontend/package.json"
    "frontend/src/app/layout.tsx"
    "frontend/src/app/page.tsx"
    "database/init.sql"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        success "✓ Arquivo $file existe"
    else
        error "✗ Arquivo $file não encontrado"
        ((ERRORS++))
    fi
done

# 3. Verificar configurações do .env
log "3. Verificando configurações do .env..."

if [ -f ".env" ]; then
    REQUIRED_VARS=(
        "DB_HOST"
        "DB_PORT"
        "DB_NAME"
        "DB_USER"
        "DB_PASSWORD"
        "REDIS_HOST"
        "REDIS_PORT"
        "API_HOST"
        "API_PORT"
        "JWT_SECRET_KEY"
    )
    
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${var}=" .env; then
            success "✓ Variável $var configurada"
        else
            error "✗ Variável $var não encontrada no .env"
            ((ERRORS++))
        fi
    done
else
    error "✗ Arquivo .env não encontrado"
    ((ERRORS++))
fi

# 4. Verificar dependências do sistema
log "4. Verificando dependências do sistema..."

# Docker
if command -v docker &> /dev/null; then
    success "✓ Docker instalado: $(docker --version)"
else
    warning "⚠ Docker não encontrado - necessário para executar a plataforma"
    info "  Instale o Docker: https://docs.docker.com/get-docker/"
fi

# Docker Compose
if command -v docker-compose &> /dev/null; then
    success "✓ Docker Compose instalado: $(docker-compose --version)"
elif docker compose version &> /dev/null 2>&1; then
    success "✓ Docker Compose (plugin) instalado: $(docker compose version)"
else
    warning "⚠ Docker Compose não encontrado - necessário para executar a plataforma"
    info "  Instale o Docker Compose: https://docs.docker.com/compose/install/"
fi

# Git (opcional)
if command -v git &> /dev/null; then
    success "✓ Git instalado: $(git --version)"
else
    info "ℹ Git não encontrado (opcional)"
fi

# 5. Verificar sintaxe dos arquivos de configuração
log "5. Verificando sintaxe dos arquivos..."

# Verificar docker-compose.yml
if command -v docker-compose &> /dev/null; then
    if docker-compose config &> /dev/null; then
        success "✓ docker-compose.yml válido"
    else
        error "✗ docker-compose.yml contém erros de sintaxe"
        ((ERRORS++))
    fi
elif docker compose version &> /dev/null 2>&1; then
    if docker compose config &> /dev/null; then
        success "✓ docker-compose.yml válido"
    else
        error "✗ docker-compose.yml contém erros de sintaxe"
        ((ERRORS++))
    fi
else
    warning "⚠ Não foi possível validar docker-compose.yml (Docker não disponível)"
fi

# Verificar package.json do frontend
if [ -f "frontend/package.json" ]; then
    if python3 -m json.tool frontend/package.json > /dev/null 2>&1; then
        success "✓ frontend/package.json válido"
    else
        error "✗ frontend/package.json contém erros de sintaxe JSON"
        ((ERRORS++))
    fi
fi

# 6. Verificar portas disponíveis
log "6. Verificando disponibilidade de portas..."

REQUIRED_PORTS=(3000 3001 5432 6379 8000 9090)

for port in "${REQUIRED_PORTS[@]}"; do
    if command -v lsof &> /dev/null; then
        if lsof -i :$port &> /dev/null; then
            warning "⚠ Porta $port está em uso"
            info "  Use: lsof -i :$port para ver qual processo está usando"
        else
            success "✓ Porta $port disponível"
        fi
    elif command -v netstat &> /dev/null; then
        if netstat -ln | grep ":$port " &> /dev/null; then
            warning "⚠ Porta $port está em uso"
        else
            success "✓ Porta $port disponível"
        fi
    else
        info "ℹ Não foi possível verificar porta $port (lsof/netstat não disponível)"
    fi
done

# 7. Verificar permissões dos scripts
log "7. Verificando permissões dos scripts..."

SCRIPT_FILES=(
    "scripts/start.sh"
    "scripts/validate.sh"
)

for script in "${SCRIPT_FILES[@]}"; do
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            success "✓ Script $script é executável"
        else
            warning "⚠ Script $script não é executável"
            info "  Execute: chmod +x $script"
        fi
    fi
done

# 8. Verificar espaço em disco
log "8. Verificando espaço em disco..."

AVAILABLE_SPACE=$(df . | awk 'NR==2 {print $4}')
REQUIRED_SPACE=10485760  # 10GB em KB

if [ "$AVAILABLE_SPACE" -gt "$REQUIRED_SPACE" ]; then
    success "✓ Espaço em disco suficiente ($(($AVAILABLE_SPACE / 1024 / 1024))GB disponível)"
else
    warning "⚠ Pouco espaço em disco ($(($AVAILABLE_SPACE / 1024 / 1024))GB disponível, recomendado: 10GB)"
fi

# 9. Verificar memória RAM
log "9. Verificando memória RAM..."

if command -v free &> /dev/null; then
    TOTAL_RAM=$(free -m | awk 'NR==2{print $2}')
    if [ "$TOTAL_RAM" -gt 8192 ]; then
        success "✓ Memória RAM suficiente (${TOTAL_RAM}MB)"
    elif [ "$TOTAL_RAM" -gt 4096 ]; then
        warning "⚠ Memória RAM limitada (${TOTAL_RAM}MB, recomendado: 8GB)"
    else
        error "✗ Memória RAM insuficiente (${TOTAL_RAM}MB, mínimo: 4GB)"
        ((ERRORS++))
    fi
else
    info "ℹ Não foi possível verificar memória RAM"
fi

# Resumo final
echo ""
echo "=========================================="
echo "           RESUMO DA VALIDAÇÃO"
echo "=========================================="

if [ $ERRORS -eq 0 ]; then
    success "🎉 Validação concluída com sucesso!"
    success "✅ Todos os requisitos foram atendidos"
    echo ""
    info "Próximos passos:"
    info "1. Execute: make up (ou docker-compose up -d)"
    info "2. Acesse: http://localhost:3000"
    info "3. Monitore: make logs"
else
    error "❌ Validação concluída com $ERRORS erro(s)"
    error "⚠️  Corrija os erros antes de executar a plataforma"
    echo ""
    info "Para obter ajuda:"
    info "1. Consulte o README.md"
    info "2. Verifique os logs de erro acima"
    info "3. Execute novamente após as correções"
fi

echo ""
log "Validação finalizada."

exit $ERRORS

