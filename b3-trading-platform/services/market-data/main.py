#!/usr/bin/env python3
"""
B3 Trading Platform - Market Data Service
Coleta e distribui dados de mercado em tempo real
"""
import asyncio
import json
import logging
import os
from datetime import datetime
from typing import Dict, List

import redis
import uvicorn
from fastapi import FastAPI, WebSocket
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="B3 Market Data Service",
    description="Serviço de dados de mercado em tempo real",
    version="1.0.0"
)

# Redis connection
redis_client = redis.Redis(
    host=os.getenv('REDIS_HOST', 'redis'),
    port=int(os.getenv('REDIS_PORT', 6379)),
    password=os.getenv('REDIS_PASSWORD', ''),
    decode_responses=True
)

# Global variables for market data
market_data: Dict[str, Dict] = {}
connected_clients: List[WebSocket] = []

@app.on_event("startup")
async def startup_event():
    """Initialize market data service"""
    logger.info("🚀 Market Data Service iniciando...")
    
    # Start market data simulation
    asyncio.create_task(simulate_market_data())
    
    logger.info("✅ Market Data Service iniciado com sucesso!")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "B3 Market Data Service",
        "status": "running",
        "timestamp": datetime.now().isoformat(),
        "symbols_count": len(market_data)
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    try:
        # Test Redis connection
        redis_client.ping()
        redis_status = "healthy"
    except Exception as e:
        redis_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "redis": redis_status,
        "market_data_symbols": len(market_data),
        "connected_clients": len(connected_clients),
        "timestamp": datetime.now().isoformat()
    }

@app.get("/symbols")
async def get_symbols():
    """Get available symbols"""
    return {
        "symbols": list(market_data.keys()),
        "count": len(market_data)
    }

@app.get("/market/{symbol}")
async def get_market_data(symbol: str):
    """Get market data for specific symbol"""
    if symbol.upper() in market_data:
        return market_data[symbol.upper()]
    return {"error": "Symbol not found"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time market data"""
    await websocket.accept()
    connected_clients.append(websocket)
    logger.info(f"📡 Cliente WebSocket conectado. Total: {len(connected_clients)}")
    
    try:
        while True:
            # Send current market data
            await websocket.send_text(json.dumps({
                "type": "market_data",
                "data": market_data,
                "timestamp": datetime.now().isoformat()
            }))
            
            # Wait for next update
            await asyncio.sleep(1)
            
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        if websocket in connected_clients:
            connected_clients.remove(websocket)
        logger.info(f"📡 Cliente WebSocket desconectado. Total: {len(connected_clients)}")

async def simulate_market_data():
    """Simulate market data for demo purposes"""
    import random
    
    # B3 symbols for simulation
    symbols = ["PETR4", "VALE3", "ITUB4", "BBDC4", "ABEV3", "WEGE3", "MGLU3", "RENT3"]
    
    # Initialize with base prices
    base_prices = {
        "PETR4": 35.50,
        "VALE3": 65.20,
        "ITUB4": 32.80,
        "BBDC4": 28.90,
        "ABEV3": 14.75,
        "WEGE3": 42.30,
        "MGLU3": 8.90,
        "RENT3": 28.40
    }
    
    while True:
        try:
            for symbol in symbols:
                # Simulate price movement
                base_price = base_prices[symbol]
                change_percent = random.uniform(-2.0, 2.0)
                current_price = base_price * (1 + change_percent / 100)
                
                # Update market data
                market_data[symbol] = {
                    "symbol": symbol,
                    "price": round(current_price, 2),
                    "change": round(current_price - base_price, 2),
                    "change_percent": round(change_percent, 2),
                    "volume": random.randint(1000000, 10000000),
                    "timestamp": datetime.now().isoformat(),
                    "bid": round(current_price - 0.01, 2),
                    "ask": round(current_price + 0.01, 2)
                }
                
                # Store in Redis
                redis_client.setex(
                    f"market:{symbol}",
                    60,  # TTL 60 seconds
                    json.dumps(market_data[symbol])
                )
            
            logger.info(f"📊 Market data atualizado para {len(symbols)} símbolos")
            
        except Exception as e:
            logger.error(f"Erro na simulação de dados: {e}")
        
        # Wait before next update
        await asyncio.sleep(5)

if __name__ == "__main__":
    port = int(os.getenv('MARKET_DATA_PORT', 8001))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )