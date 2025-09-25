"""
B3 Trading Platform - API Minimal
FastAPI básico para demonstração
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Criar aplicação FastAPI
app = FastAPI(
    title="B3 Trading Platform API",
    description="API completa para trading na B3 com integração MetaTrader 5",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Endpoint raiz"""
    return {
        "message": "🚀 B3 Trading Platform API",
        "version": "1.0.0",
        "status": "online",
        "timestamp": datetime.now().isoformat(),
        "endpoints": {
            "docs": "/docs",
            "health": "/health"
        }
    }

@app.get("/health")
async def health_check():
    """Health check do sistema"""
    return {
        "status": "healthy",
        "service": "b3-trading-api",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/v1/market")
async def get_market_data():
    """Retorna dados de mercado simulados"""
    return [
        {
            "symbol": "PETR4",
            "price": 32.50,
            "change": 0.25,
            "change_percent": 0.77,
            "volume": 1500000,
            "bid": 32.49,
            "ask": 32.51,
            "timestamp": datetime.now().isoformat()
        },
        {
            "symbol": "VALE3",
            "price": 65.80,
            "change": -0.42,
            "change_percent": -0.63,
            "volume": 2800000,
            "bid": 65.79,
            "ask": 65.81,
            "timestamp": datetime.now().isoformat()
        }
    ]

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

