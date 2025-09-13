-- B3 Trading Platform - Database Initialization
-- PostgreSQL Database Schema

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_superuser BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de símbolos
CREATE TABLE IF NOT EXISTS symbols (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100),
    market VARCHAR(50),
    currency VARCHAR(10) DEFAULT 'BRL',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de dados de mercado
CREATE TABLE IF NOT EXISTS market_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol_id UUID REFERENCES symbols(id),
    price DECIMAL(15,5) NOT NULL,
    bid DECIMAL(15,5),
    ask DECIMAL(15,5),
    volume BIGINT DEFAULT 0,
    change_value DECIMAL(15,5) DEFAULT 0,
    change_percent DECIMAL(8,4) DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de trades
CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    symbol_id UUID REFERENCES symbols(id),
    trade_type VARCHAR(10) NOT NULL CHECK (trade_type IN ('BUY', 'SELL')),
    quantity DECIMAL(15,5) NOT NULL,
    price DECIMAL(15,5) NOT NULL,
    stop_loss DECIMAL(15,5),
    take_profit DECIMAL(15,5),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'FILLED', 'CANCELLED', 'REJECTED')),
    commission DECIMAL(15,5) DEFAULT 0,
    comment TEXT,
    executed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de posições
CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    symbol_id UUID REFERENCES symbols(id),
    position_type VARCHAR(10) NOT NULL CHECK (position_type IN ('LONG', 'SHORT')),
    quantity DECIMAL(15,5) NOT NULL,
    avg_price DECIMAL(15,5) NOT NULL,
    current_price DECIMAL(15,5),
    unrealized_pnl DECIMAL(15,5) DEFAULT 0,
    realized_pnl DECIMAL(15,5) DEFAULT 0,
    is_open BOOLEAN DEFAULT TRUE,
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de configurações de conta
CREATE TABLE IF NOT EXISTS account_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) UNIQUE,
    balance DECIMAL(15,2) DEFAULT 0,
    max_position_size DECIMAL(15,2) DEFAULT 100000,
    max_daily_loss DECIMAL(15,2) DEFAULT 5000,
    risk_percent DECIMAL(5,2) DEFAULT 2.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de sinais MT5
CREATE TABLE IF NOT EXISTS mt5_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) NOT NULL,
    signal_type VARCHAR(10) NOT NULL CHECK (signal_type IN ('BUY', 'SELL')),
    price DECIMAL(15,5),
    stop_loss DECIMAL(15,5),
    take_profit DECIMAL(15,5),
    volume DECIMAL(15,5) DEFAULT 1,
    confidence DECIMAL(5,2),
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserir dados iniciais

-- Usuários padrão
INSERT INTO users (username, email, full_name, hashed_password, is_superuser) VALUES
('admin', 'admin@b3platform.com', 'Administrator', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', TRUE),
('trader', 'trader@b3platform.com', 'Trader User', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', FALSE)
ON CONFLICT (username) DO NOTHING;

-- Símbolos padrão
INSERT INTO symbols (symbol, name, market) VALUES
('WINFUT', 'Índice Futuro', 'B3'),
('WDOFUT', 'Dólar Futuro', 'B3'),
('PETR4', 'Petrobras PN', 'B3'),
('VALE3', 'Vale ON', 'B3'),
('ITUB4', 'Itaú Unibanco PN', 'B3')
ON CONFLICT (symbol) DO NOTHING;

-- Configurações de conta padrão
INSERT INTO account_settings (user_id, balance)
SELECT id, 50000.00 FROM users WHERE username IN ('admin', 'trader')
ON CONFLICT (user_id) DO NOTHING;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_market_data_symbol_timestamp ON market_data(symbol_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_trades_user_created ON trades(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_positions_user_open ON positions(user_id, is_open);
CREATE INDEX IF NOT EXISTS idx_mt5_signals_processed ON mt5_signals(processed, created_at);

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_account_settings_updated_at BEFORE UPDATE ON account_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários nas tabelas
COMMENT ON TABLE users IS 'Tabela de usuários do sistema';
COMMENT ON TABLE symbols IS 'Tabela de símbolos negociáveis';
COMMENT ON TABLE market_data IS 'Dados de mercado em tempo real';
COMMENT ON TABLE trades IS 'Histórico de operações';
COMMENT ON TABLE positions IS 'Posições abertas e fechadas';
COMMENT ON TABLE account_settings IS 'Configurações de conta dos usuários';
COMMENT ON TABLE mt5_signals IS 'Sinais recebidos do MetaTrader 5';

-- Conceder permissões
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO trader;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO trader;

