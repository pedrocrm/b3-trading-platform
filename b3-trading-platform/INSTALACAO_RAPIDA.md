# 🚀 Instalação Rápida - B3 Trading Platform

## ⚡ Início Rápido (5 minutos)

### 1. Pré-requisitos
- Docker e Docker Compose instalados
- 8GB RAM (mínimo 4GB)
- 10GB espaço livre em disco
- Portas 3000, 8000, 5432, 6379 livres

### 2. Instalação do Docker

#### Windows
```powershell
# Baixe e instale Docker Desktop
# https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe
```

#### macOS
```bash
# Via Homebrew
brew install --cask docker
```

#### Linux (Ubuntu/Debian)
```bash
# Instalação rápida
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

### 3. Executar a Plataforma

```bash
# 1. Navegue até o diretório do projeto
cd b3-trading-platform

# 2. Valide a configuração (opcional)
./scripts/validate.sh

# 3. Inicie todos os serviços
make up
# OU
docker-compose up -d
# OU
./scripts/start.sh
```

### 4. Acessar os Serviços

- **Dashboard**: http://localhost:3000
- **API**: http://localhost:8000
- **Documentação**: http://localhost:8000/docs
- **Grafana**: http://localhost:3001 (admin/grafana_admin_2024)

## 🔧 Comandos Úteis

```bash
# Ver status dos serviços
make status
docker-compose ps

# Ver logs
make logs
docker-compose logs -f

# Parar serviços
make down
docker-compose down

# Reset completo
make reset

# Backup do banco
make backup
```

## 🧪 Teste Rápido

```bash
# Testar API
curl http://localhost:8000/health

# Testar dados de mercado
curl http://localhost:8000/api/v1/market
```

## 🚨 Solução de Problemas

### Porta em uso
```bash
# Verificar porta
lsof -i :3000
# Matar processo
kill -9 [PID]
```

### Container não inicia
```bash
# Ver logs detalhados
docker-compose logs [service_name]
# Reconstruir
docker-compose build --no-cache
```

### Permissão negada (Linux)
```bash
sudo usermod -aG docker $USER
newgrp docker
```

## ✅ Checklist de Verificação

- [ ] Docker instalado e rodando
- [ ] Portas 3000, 8000, 5432, 6379 livres
- [ ] Arquivo .env configurado
- [ ] Scripts executáveis (`chmod +x scripts/*.sh`)
- [ ] Containers rodando (`docker-compose ps`)
- [ ] Dashboard acessível (http://localhost:3000)
- [ ] API respondendo (http://localhost:8000/health)

## 🎯 Próximos Passos

1. **Configurar credenciais reais** no arquivo `.env`
2. **Instalar MetaTrader 5** e configurar EA
3. **Testar em conta demo** antes de usar conta real
4. **Configurar monitoramento** no Grafana
5. **Implementar estratégias** personalizadas

## 📞 Suporte

- Consulte o `README.md` para documentação completa
- Execute `./scripts/validate.sh` para diagnóstico
- Verifique logs com `make logs`

---

**🎉 Pronto! Sua plataforma está rodando em http://localhost:3000**

