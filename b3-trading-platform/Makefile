.PHONY: help build up down logs clean reset test dev prod status backup restore

help:
	@echo "B3 Trading Platform - Comandos Disponíveis"
	@echo "==========================================="
	@echo "make build    - Constrói todas as imagens Docker"
	@echo "make up       - Inicia todos os serviços"
	@echo "make down     - Para todos os serviços"
	@echo "make logs     - Mostra logs de todos os serviços"
	@echo "make clean    - Remove containers e volumes"
	@echo "make reset    - Reset completo do ambiente"
	@echo "make test     - Executa testes"
	@echo "make dev      - Inicia em modo desenvolvimento"
	@echo "make prod     - Inicia em modo produção"
	@echo "make status   - Mostra status dos serviços"
	@echo "make backup   - Backup do banco de dados"
	@echo "make restore  - Restaura backup do banco"

build:
	docker-compose build

up:
	docker-compose up -d
	@echo "✅ B3 Trading Platform está rodando!"
	@echo "📊 Dashboard: http://localhost:3000"
	@echo "🚀 API: http://localhost:8000"
	@echo "📝 API Docs: http://localhost:8000/docs"
	@echo "📈 Grafana: http://localhost:3001"

down:
	docker-compose down

logs:
	docker-compose logs -f

clean:
	docker-compose down -v
	docker system prune -f

reset: clean
	rm -rf logs/*
	docker-compose build --no-cache
	docker-compose up -d

test:
	docker-compose exec api pytest

dev:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

prod:
	docker-compose -f docker-compose.yml up -d

status:
	@echo "🔍 Status dos Serviços:"
	@docker-compose ps

backup:
	@echo "💾 Fazendo backup do banco de dados..."
	@docker-compose exec postgres pg_dump -U ${DB_USER} ${DB_NAME} > backup_$(shell date +%Y%m%d_%H%M%S).sql

restore:
	@echo "📥 Restaurando banco de dados..."
	@docker-compose exec -T postgres psql -U ${DB_USER} ${DB_NAME} < $(BACKUP_FILE)

