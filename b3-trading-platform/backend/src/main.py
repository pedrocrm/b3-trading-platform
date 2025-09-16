"""
B3 Trading Platform - API Principal
FastAPI com WebSocket, autenticação JWT e integração com MT5
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import uvicorn
import asyncio
import json
import random
import logging
import os
import tempfile
import shutil
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import redis.asyncio as redis
from contextlib import asynccontextmanager

# Importações dos módulos legais
from cnj_datajus import CNJDataJusAPI, ProcessSearchRequest, cnj_client
from legal_document_processor import (
    LegalDocumentProcessor, DocumentMetadata, DocumentType, 
    RetentionCategory, LegalRetentionPolicy, document_processor
)
from legal_rbac import (
    LegalRole, Permission, RBACManager, EthicalWallManager,
    TenantCreate, TenantUserCreate, rbac_manager, ethical_wall_manager
)

# Configuração de Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ======================== CONFIGURAÇÕES ========================

class Settings:
    """Configurações da aplicação"""
    SECRET_KEY = os.getenv("JWT_SECRET_KEY", "b3_jwt_super_secret_key_2024_very_secure")
    ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", 30))
    REDIS_URL = f"redis://:{os.getenv('REDIS_PASSWORD', '')}@{os.getenv('REDIS_HOST', 'localhost')}:{os.getenv('REDIS_PORT', 6379)}/0"
    API_VERSION = "1.0.0"
    DATABASE_URL = f"postgresql://{os.getenv('DB_USER', 'trader')}:{os.getenv('DB_PASSWORD', '')}@{os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', 5432)}/{os.getenv('DB_NAME', 'b3trading')}"
    
    # Configurações específicas para sistema jurídico
    UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/tmp/legal_documents")
    MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", 50 * 1024 * 1024))  # 50MB
    ALLOWED_FILE_TYPES = [".pdf", ".docx", ".txt", ".png", ".jpg", ".jpeg", ".tiff"]
    
settings = Settings()

# ======================== MODELOS ========================

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    username: Optional[str] = None

class User(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    disabled: Optional[bool] = False

class UserInDB(User):
    hashed_password: str

class TradeRequest(BaseModel):
    symbol: str
    side: str = Field(..., regex="^(BUY|SELL)$")
    quantity: float = Field(gt=0)
    price: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    comment: Optional[str] = None

class MarketData(BaseModel):
    symbol: str
    price: float
    change: float
    change_percent: float
    volume: int
    bid: float
    ask: float
    timestamp: str

class Position(BaseModel):
    id: int
    symbol: str
    type: str
    quantity: float
    avg_price: float
    current_price: float
    pnl: float
    pnl_percent: float
    opened_at: str

class AccountInfo(BaseModel):
    balance: float
    equity: float
    margin: float
    free_margin: float
    margin_level: float
    positions_count: int
    profit_today: float

# ======================== MODELOS JURÍDICOS ========================

class LegalCaseCreate(BaseModel):
    """Modelo para criação de caso jurídico"""
    title: str = Field(..., min_length=5, max_length=500)
    description: Optional[str] = None
    case_type: str
    client_id: Optional[str] = None
    opposing_party: Optional[str] = None
    court_date: Optional[datetime] = None
    deadline_date: Optional[datetime] = None

class LegalCaseResponse(BaseModel):
    """Resposta com dados do caso jurídico"""
    id: str
    title: str
    description: Optional[str]
    case_type: str
    status: str
    client_id: Optional[str]
    opposing_party: Optional[str]
    opened_date: datetime
    court_date: Optional[datetime]
    deadline_date: Optional[datetime]
    responsible_lawyer_id: Optional[str]

class DocumentUploadResponse(BaseModel):
    """Resposta do upload de documento"""
    document_id: str
    filename: str
    file_size: int
    document_type: DocumentType
    confidence_score: float
    processing_time: float
    extracted_entities_count: int
    success: bool
    errors: List[str] = []

class CNJSearchResponse(BaseModel):
    """Resposta da busca no CNJ DataJus"""
    process_number: str
    tribunal: str
    total_results: int
    results: List[Dict[str, Any]]
    search_time: float

class LegalAnalysisRequest(BaseModel):
    """Requisição para análise jurídica"""
    text: str = Field(..., min_length=10)
    analysis_type: str = Field(..., regex="^(entities|classification|similarity)$")
    
class LegalAnalysisResponse(BaseModel):
    """Resposta da análise jurídica"""
    analysis_type: str
    results: Dict[str, Any]
    confidence: float
    processing_time: float

# ======================== SEGURANÇA ========================

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Banco de dados fake de usuários (em produção, use um banco real)
fake_users_db = {
    "admin": {
        "username": "admin",
        "full_name": "Admin User",
        "email": "admin@b3platform.com",
        "hashed_password": pwd_context.hash("admin123"),
        "disabled": False,
    },
    "trader": {
        "username": "trader",
        "full_name": "Trader User",
        "email": "trader@b3platform.com",
        "hashed_password": pwd_context.hash("trader123"),
        "disabled": False,
    }
}

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user(db, username: str):
    if username in db:
        user_dict = db[username]
        return UserInDB(**user_dict)

def authenticate_user(fake_db, username: str, password: str):
    user = get_user(fake_db, username)
    if not user or not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = get_user(fake_users_db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

# ======================== GERENCIADORES ========================

class MarketDataSimulator:
    """Simulador de dados de mercado"""
    def __init__(self):
        self.symbols = {
            "WINFUT": {"price": 118500, "change": 0, "volume": 0},
            "WDOFUT": {"price": 5.45, "change": 0, "volume": 0},
            "PETR4": {"price": 32.50, "change": 0, "volume": 0},
            "VALE3": {"price": 65.80, "change": 0, "volume": 0},
            "ITUB4": {"price": 28.90, "change": 0, "volume": 0},
        }
    
    def get_tick(self, symbol: str) -> Optional[Dict]:
        """Gera um tick de mercado"""
        if symbol in self.symbols:
            variation = random.uniform(-0.5, 0.5)
            self.symbols[symbol]["price"] += variation
            self.symbols[symbol]["change"] = variation
            self.symbols[symbol]["volume"] += random.randint(100, 1000)
            
            price = self.symbols[symbol]["price"]
            return {
                "symbol": symbol,
                "price": round(price, 2),
                "change": round(variation, 2),
                "change_percent": round((variation / price) * 100, 3),
                "volume": self.symbols[symbol]["volume"],
                "bid": round(price - 0.1, 2),
                "ask": round(price + 0.1, 2),
                "timestamp": datetime.now().isoformat()
            }
        return None
    
    def get_all_ticks(self) -> List[Dict]:
        """Retorna ticks de todos os símbolos"""
        return [self.get_tick(symbol) for symbol in self.symbols.keys()]

class ConnectionManager:
    """Gerenciador de conexões WebSocket"""
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: Optional[str] = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        if client_id:
            self.user_connections[client_id] = websocket
        logger.info(f"Nova conexão WebSocket. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket, client_id: Optional[str] = None):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if client_id and client_id in self.user_connections:
            del self.user_connections[client_id]
        logger.info(f"Conexão WebSocket removida. Total: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except:
            logger.error("Erro ao enviar mensagem pessoal")

    async def broadcast(self, message: str):
        """Envia mensagem para todos os clientes conectados"""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                disconnected.append(connection)
        
        # Remove conexões mortas
        for conn in disconnected:
            self.disconnect(conn)

class TradingEngine:
    """Motor de trading simulado"""
    def __init__(self):
        self.positions: List[Position] = []
        self.trades: List[Dict] = []
        self.trade_counter = 1000
        
    async def execute_trade(self, trade: TradeRequest, user: str) -> Dict:
        """Executa uma ordem de trade"""
        self.trade_counter += 1
        
        # Simular execução
        executed_price = trade.price or (118500 + random.uniform(-100, 100))
        
        trade_result = {
            "trade_id": self.trade_counter,
            "user": user,
            "symbol": trade.symbol,
            "side": trade.side,
            "quantity": trade.quantity,
            "requested_price": trade.price,
            "executed_price": executed_price,
            "stop_loss": trade.stop_loss,
            "take_profit": trade.take_profit,
            "status": "FILLED",
            "commission": round(trade.quantity * 0.0001 * executed_price, 2),
            "timestamp": datetime.now().isoformat(),
            "comment": trade.comment
        }
        
        self.trades.append(trade_result)
        
        return trade_result
    
    def get_positions(self, user: str) -> List[Position]:
        """Retorna posições abertas do usuário"""
        # Simular posições
        return [
            Position(
                id=1,
                symbol="WINFUT",
                type="BUY",
                quantity=2,
                avg_price=118450,
                current_price=118500,
                pnl=100,
                pnl_percent=0.08,
                opened_at=datetime.now().isoformat()
            )
        ]
    
    def get_account_info(self, user: str) -> AccountInfo:
        """Retorna informações da conta"""
        return AccountInfo(
            balance=50000.00,
            equity=52500.00,
            margin=5000.00,
            free_margin=47500.00,
            margin_level=1050.00,
            positions_count=len(self.positions),
            profit_today=2500.00
        )

# ======================== APLICAÇÃO ========================

# Contexto de vida da aplicação
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 Iniciando B3 Trading Platform API...")
    try:
        app.state.redis = await redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
        await app.state.redis.ping()
        logger.info("✅ Conexão com Redis estabelecida")
    except Exception as e:
        logger.error(f"❌ Erro ao conectar com Redis: {e}")
        app.state.redis = None
    
    yield
    
    # Shutdown
    logger.info("🛑 Encerrando B3 Trading Platform API...")
    if hasattr(app.state, 'redis') and app.state.redis:
        await app.state.redis.close()

# Criar aplicação FastAPI
app = FastAPI(
    title="B3 Trading Platform API",
    description="API completa para trading na B3 com integração MetaTrader 5",
    version=settings.API_VERSION,
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instanciar gerenciadores
market_simulator = MarketDataSimulator()
connection_manager = ConnectionManager()
trading_engine = TradingEngine()

# ======================== ROTAS ========================

@app.get("/")
async def root():
    """Endpoint raiz"""
    return {
        "message": "🚀 B3 Trading Platform API",
        "version": settings.API_VERSION,
        "status": "online",
        "timestamp": datetime.now().isoformat(),
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "ws": "/ws"
        }
    }

@app.get("/health")
async def health_check():
    """Health check do sistema"""
    redis_status = "healthy"
    try:
        if hasattr(app.state, 'redis') and app.state.redis:
            await app.state.redis.ping()
        else:
            redis_status = "disconnected"
    except:
        redis_status = "unhealthy"
    
    return {
        "status": "healthy",
        "service": "b3-trading-api",
        "version": settings.API_VERSION,
        "timestamp": datetime.now().isoformat(),
        "connections": len(connection_manager.active_connections),
        "redis": redis_status
    }

@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Autenticação e geração de token JWT"""
    user = authenticate_user(fake_users_db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/v1/user/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Retorna informações do usuário atual"""
    return current_user

@app.get("/api/v1/market", response_model=List[MarketData])
async def get_all_market_data():
    """Retorna dados de todos os símbolos"""
    return market_simulator.get_all_ticks()

@app.get("/api/v1/market/{symbol}", response_model=MarketData)
async def get_market_data(symbol: str):
    """Retorna dados de mercado de um símbolo"""
    tick = market_simulator.get_tick(symbol.upper())
    if tick:
        return tick
    raise HTTPException(status_code=404, detail="Symbol not found")

@app.post("/api/v1/trade")
async def execute_trade(
    trade: TradeRequest,
    current_user: User = Depends(get_current_user)
):
    """Executa uma ordem de trade"""
    result = await trading_engine.execute_trade(trade, current_user.username)
    
    # Broadcast via WebSocket
    await connection_manager.broadcast(json.dumps({
        "type": "trade_executed",
        "data": result
    }))
    
    logger.info(f"Trade executado: {result}")
    return result

@app.get("/api/v1/positions", response_model=List[Position])
async def get_positions(current_user: User = Depends(get_current_user)):
    """Retorna posições abertas do usuário"""
    return trading_engine.get_positions(current_user.username)

@app.get("/api/v1/account", response_model=AccountInfo)
async def get_account(current_user: User = Depends(get_current_user)):
    """Retorna informações da conta do usuário"""
    return trading_engine.get_account_info(current_user.username)

@app.get("/api/v1/trades")
async def get_trades(
    limit: int = 100,
    current_user: User = Depends(get_current_user)
):
    """Retorna histórico de trades"""
    user_trades = [t for t in trading_engine.trades if t.get("user") == current_user.username]
    return user_trades[-limit:]

@app.post("/api/v1/mt5/signal")
async def receive_mt5_signal(signal_data: dict):
    """Recebe sinais do MetaTrader 5"""
    logger.info(f"Sinal MT5 recebido: {signal_data}")
    
    # Processar sinal
    if signal_data.get("action") in ["BUY", "SELL"]:
        trade = TradeRequest(
            symbol=signal_data.get("symbol", "WINFUT"),
            side=signal_data.get("action"),
            quantity=signal_data.get("volume", 1),
            price=signal_data.get("price"),
            stop_loss=signal_data.get("stop_loss"),
            take_profit=signal_data.get("take_profit"),
            comment="MT5 Signal"
        )
        
        # Executar trade com usuário do sistema
        result = await trading_engine.execute_trade(trade, "mt5_system")
        
        # Broadcast
        await connection_manager.broadcast(json.dumps({
            "type": "mt5_signal",
            "data": result
        }))
        
        return result
    
    return {"status": "signal_received", "message": "Signal processed"}

# ======================== WEBSOCKET ========================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket para dados em tempo real"""
    await connection_manager.connect(websocket)
    
    try:
        # Enviar mensagem de boas-vindas
        await websocket.send_text(json.dumps({
            "type": "connection",
            "message": "Connected to B3 Trading Platform",
            "timestamp": datetime.now().isoformat()
        }))
        
        # Loop de envio de dados
        while True:
            # Enviar dados de mercado
            for symbol in market_simulator.symbols.keys():
                tick = market_simulator.get_tick(symbol)
                message = {
                    "type": "market_data",
                    "data": tick
                }
                await websocket.send_text(json.dumps(message))
            
            # Aguardar antes do próximo envio
            await asyncio.sleep(1)
            
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket)
        logger.info("Cliente WebSocket desconectado")
    except Exception as e:
        logger.error(f"Erro no WebSocket: {e}")
        connection_manager.disconnect(websocket)

@app.websocket("/ws/user/{user_id}")
async def user_websocket(websocket: WebSocket, user_id: str):
    """WebSocket específico do usuário para notificações pessoais"""
    await connection_manager.connect(websocket, user_id)
    
    try:
        while True:
            # Receber mensagens do cliente
            data = await websocket.receive_text()
            
            # Processar comandos
            try:
                command = json.loads(data)
                
                if command.get("type") == "subscribe":
                    # Subscrever a símbolos específicos
                    symbols = command.get("symbols", [])
                    await websocket.send_text(json.dumps({
                        "type": "subscribed",
                        "symbols": symbols
                    }))
                
                elif command.get("type") == "ping":
                    # Responder ping
                    await websocket.send_text(json.dumps({
                        "type": "pong",
                        "timestamp": datetime.now().isoformat()
                    }))
                    
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Invalid JSON"
                }))
                
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket, user_id)
    except Exception as e:
        logger.error(f"Erro no WebSocket do usuário {user_id}: {e}")
        connection_manager.disconnect(websocket, user_id)

# ======================== ROTAS JURÍDICAS ========================

@app.post("/api/v1/legal/search-cnj", response_model=CNJSearchResponse)
async def search_cnj_process(
    search_request: ProcessSearchRequest,
    current_user: User = Depends(get_current_user)
):
    """Buscar processo no CNJ DataJus"""
    try:
        start_time = datetime.now()
        
        # Verificar permissão
        # if not rbac_manager.has_permission(current_user.role, Permission.SEARCH_CNJ):
        #     raise HTTPException(status_code=403, detail="Permissão negada para busca CNJ")
        
        result = await cnj_client.search_process(search_request)
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        hits = result.get("hits", {})
        total = hits.get("total", {}).get("value", 0)
        processes = hits.get("hits", [])
        
        # Extrair tribunal do primeiro resultado ou usar o número do processo
        tribunal = "CNJ"
        if processes:
            first_process = processes[0].get("_source", {})
            tribunal = first_process.get("tribunal", "CNJ")
        
        return CNJSearchResponse(
            process_number=search_request.numeroProcesso,
            tribunal=tribunal,
            total_results=total,
            results=[hit.get("_source", {}) for hit in processes],
            search_time=processing_time
        )
        
    except Exception as e:
        logger.error(f"Erro na busca CNJ: {e}")
        raise HTTPException(status_code=500, detail=f"Erro na busca CNJ: {str(e)}")

@app.post("/api/v1/legal/upload-document", response_model=DocumentUploadResponse)
async def upload_legal_document(
    file: UploadFile = File(...),
    tenant_id: str = "default",
    client_id: Optional[str] = None,
    case_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Upload e processamento de documento jurídico"""
    try:
        # Verificar permissões
        # if not rbac_manager.has_permission(current_user.role, Permission.UPLOAD_DOCUMENTS):
        #     raise HTTPException(status_code=403, detail="Permissão negada para upload de documentos")
        
        # Verificar tipo de arquivo
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in settings.ALLOWED_FILE_TYPES:
            raise HTTPException(
                status_code=400, 
                detail=f"Tipo de arquivo não permitido. Tipos aceitos: {settings.ALLOWED_FILE_TYPES}"
            )
        
        # Verificar tamanho do arquivo
        file.file.seek(0, 2)  # Mover para o final do arquivo
        file_size = file.file.tell()
        file.file.seek(0)  # Voltar para o início
        
        if file_size > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"Arquivo muito grande. Tamanho máximo: {settings.MAX_FILE_SIZE / (1024*1024):.1f}MB"
            )
        
        # Criar diretório de upload se não existir
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        
        # Salvar arquivo temporariamente
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp_file:
            shutil.copyfileobj(file.file, tmp_file)
            tmp_file_path = tmp_file.name
        
        try:
            # Processar documento
            result = await document_processor.process_document(
                tmp_file_path, tenant_id, client_id, case_id
            )
            
            return DocumentUploadResponse(
                document_id=result.document_id,
                filename=file.filename,
                file_size=file_size,
                document_type=result.document_type,
                confidence_score=result.confidence_score,
                processing_time=result.processing_time,
                extracted_entities_count=len(result.entities),
                success=result.success,
                errors=result.errors
            )
            
        finally:
            # Limpar arquivo temporário
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro no upload de documento: {e}")
        raise HTTPException(status_code=500, detail=f"Erro no processamento: {str(e)}")

@app.post("/api/v1/legal/analyze-text", response_model=LegalAnalysisResponse)
async def analyze_legal_text(
    request: LegalAnalysisRequest,
    current_user: User = Depends(get_current_user)
):
    """Análise de texto jurídico"""
    try:
        start_time = datetime.now()
        
        if request.analysis_type == "entities":
            # Extrair entidades jurídicas
            entities = document_processor.extract_legal_entities(request.text)
            results = {
                "entities": [entity.dict() for entity in entities],
                "total_entities": len(entities)
            }
            confidence = 0.85
            
        elif request.analysis_type == "classification":
            # Classificar tipo de documento
            doc_type, confidence = document_processor.classify_document_type(request.text)
            results = {
                "document_type": doc_type.value,
                "confidence": confidence
            }
            
        elif request.analysis_type == "similarity":
            # Gerar embedding para análise de similaridade
            embedding = document_processor.generate_embedding(request.text)
            results = {
                "embedding_size": len(embedding),
                "preview": embedding[:10] if embedding else []
            }
            confidence = 0.9
            
        else:
            raise HTTPException(status_code=400, detail="Tipo de análise inválido")
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return LegalAnalysisResponse(
            analysis_type=request.analysis_type,
            results=results,
            confidence=confidence,
            processing_time=processing_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro na análise de texto: {e}")
        raise HTTPException(status_code=500, detail=f"Erro na análise: {str(e)}")

@app.post("/api/v1/legal/cases", response_model=LegalCaseResponse)
async def create_legal_case(
    case_data: LegalCaseCreate,
    tenant_id: str = "default",
    current_user: User = Depends(get_current_user)
):
    """Criar novo caso jurídico"""
    try:
        # Verificar permissões
        # if not rbac_manager.has_permission(current_user.role, Permission.CREATE_CASES):
        #     raise HTTPException(status_code=403, detail="Permissão negada para criar casos")
        
        # Simular criação de caso (em produção, salvar no banco de dados)
        case_id = f"case_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        return LegalCaseResponse(
            id=case_id,
            title=case_data.title,
            description=case_data.description,
            case_type=case_data.case_type,
            status="active",
            client_id=case_data.client_id,
            opposing_party=case_data.opposing_party,
            opened_date=datetime.now(),
            court_date=case_data.court_date,
            deadline_date=case_data.deadline_date,
            responsible_lawyer_id=current_user.username
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao criar caso: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao criar caso: {str(e)}")

@app.get("/api/v1/legal/cases")
async def list_legal_cases(
    tenant_id: str = "default",
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    """Listar casos jurídicos"""
    try:
        # Verificar permissões
        # if not rbac_manager.has_permission(current_user.role, Permission.VIEW_CASES):
        #     raise HTTPException(status_code=403, detail="Permissão negada para visualizar casos")
        
        # Simular lista de casos (em produção, buscar do banco de dados)
        sample_cases = [
            {
                "id": "case_20241216_001",
                "title": "Ação de Cobrança - Cliente ABC",
                "case_type": "civil",
                "status": "active",
                "opened_date": "2024-12-01T10:00:00",
                "deadline_date": "2024-12-30T23:59:59",
                "responsible_lawyer": current_user.username
            },
            {
                "id": "case_20241216_002",
                "title": "Revisão Contratual - Empresa XYZ",
                "case_type": "commercial",
                "status": "pending",
                "opened_date": "2024-12-10T14:30:00",
                "deadline_date": "2024-12-25T23:59:59",
                "responsible_lawyer": current_user.username
            }
        ]
        
        return {
            "cases": sample_cases[:limit],
            "total": len(sample_cases),
            "tenant_id": tenant_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao listar casos: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao listar casos: {str(e)}")

@app.get("/api/v1/legal/retention-policy")
async def get_retention_policy(current_user: User = Depends(get_current_user)):
    """Obter política de retenção LGPD"""
    try:
        return {
            "retention_categories": {
                "CATEGORY_1": {
                    "name": "Documentos Permanentes",
                    "description": "Testamentos, escrituras - retenção indefinida",
                    "period": None,
                    "document_types": ["testament", "deed"]
                },
                "CATEGORY_2": {
                    "name": "Arquivos de Clientes",
                    "description": "Processos e documentos de clientes - 7 anos",
                    "period": "7 years",
                    "document_types": ["contract", "petition", "judgment"]
                },
                "CATEGORY_3": {
                    "name": "Documentos Administrativos",
                    "description": "Regulamentos e normas - 5 anos",
                    "period": "5 years",
                    "document_types": ["regulation"]
                },
                "CATEGORY_4": {
                    "name": "Correspondências",
                    "description": "Comunicações gerais - 3 anos",
                    "period": "3 years",
                    "document_types": ["correspondence"]
                }
            },
            "compliance_info": {
                "framework": "LGPD (Lei Geral de Proteção de Dados)",
                "automatic_deletion": True,
                "audit_trail": True,
                "data_subject_rights": ["access", "correction", "deletion", "portability"]
            }
        }
        
    except Exception as e:
        logger.error(f"Erro ao obter política de retenção: {e}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

# ======================== MAIN ========================

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

