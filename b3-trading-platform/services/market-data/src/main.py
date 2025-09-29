#!/usr/bin/env python3
"""
Market Data Service - B3 Trading Platform
Basic service structure for CI build compatibility
"""

import asyncio
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def main():
    """Main entry point for market data service"""
    print("Market Data Service starting...")
    print("Service configured for B3 Trading Platform")
    
    # Basic service loop
    while True:
        await asyncio.sleep(60)
        print("Market Data Service running...")

if __name__ == "__main__":
    asyncio.run(main())