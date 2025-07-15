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
    
    // Market data symbols to track
    symbols: {
        majorIndices: ['SPY', 'QQQ', 'DIA', 'IWM', 'VXX'],
        currencies: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD'],
        commodities: ['GOLD', 'SILVER', 'OIL', 'NATGAS'],
        crypto: ['BTCUSD', 'ETHUSD', 'ADAUSD']
    }
};