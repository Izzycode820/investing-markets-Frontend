// Investing Markets Configuration
window.InvestingMarketsConfig = {
    // Backend API Configuration
    api: {
        baseURL: 'http://localhost:8001/api',
        websocketURL: 'ws://localhost:8001/ws/prices',
        endpoints: {
            marketOverview: '/market-overview',
            symbols: '/symbols',
            news: '/news',
            brokers: '/brokers',
            search: '/symbols/search',
            alerts: '/alerts',
            watchlist: '/watchlist'
        }
    },
    
    // Real-time data configuration
    realtime: {
        reconnectInterval: 5000,
        heartbeatInterval: 30000,
        maxReconnectAttempts: 10
    },
    
    // UI Configuration
    ui: {
        refreshInterval: 300000, // 5 minutes
        animationDuration: 1000,
        enableNotifications: true
    },
    
    // Market data symbols to track - matches our dynamic table symbols
    symbols: {
        majorIndices: ['SPY', 'QQQ', 'DIA', 'IWM', 'VIX'], // Fixed VIX (was VXX)
        leadingStocks: ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'META', 'AMZN', 'NVDA', 'XOM', 'BABA'], // Added missing stocks
        currencies: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD'], // Keep existing forex
        commodities: ['GOLD', 'SILVER', 'OIL', 'NATGAS'], // Keep existing commodities  
        crypto: ['BTCUSD', 'ETHUSD', 'XRPUSD', 'USDTUSD', 'BNBUSD', 'DOTUSD', 'ADAUSD', 'SOLUSD', 'DOGEUSD', 'LTCUSD'] // All 10 crypto symbols
    }
};