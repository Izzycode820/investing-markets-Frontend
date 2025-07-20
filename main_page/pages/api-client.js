class InvestingMarketsAPI {
    constructor() {
        const config = window.InvestingMarketsConfig;
        this.baseURL = config.api.baseURL;
        this.wsURL = config.api.websocketURL;
        this.endpoints = config.api.endpoints;
        
        this.token = localStorage.getItem('auth_token');
        this.websocket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = config.realtime.maxReconnectAttempts;
        
        // Initialize connection
        this.connectWebSocket();
    }

    // WebSocket Management
    connectWebSocket() {
        try {
            this.websocket = new WebSocket(this.wsURL);
            
            this.websocket.onopen = () => {
                console.log('🟢 Connected to Investing Markets API');
                this.reconnectAttempts = 0;
                this.sendHeartbeat();
                this.subscribeToDefaultSymbols();
                this.updateConnectionStatus(true);
            };

            this.websocket.onmessage = (event) => {
                this.handleMessage(JSON.parse(event.data));
            };

            this.websocket.onclose = () => {
                console.log('🔴 Disconnected from API');
                this.updateConnectionStatus(false);
                this.scheduleReconnect();
            };

            this.websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

        } catch (error) {
            console.error('Failed to connect to WebSocket:', error);
            this.scheduleReconnect();
        }
    }

    scheduleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * this.reconnectAttempts, 30000);
            console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
            setTimeout(() => this.connectWebSocket(), delay);
        }
    }

    // Replace all the original API calls
    async getMarketOverview() {
        return this.makeRequest(this.endpoints.marketOverview);
    }

    async getSymbol(ticker) {
        return this.makeRequest(`${this.endpoints.symbols}/${ticker}`);
    }

    async searchSymbols(query, assetClass = null) {
        let url = `${this.endpoints.symbols}?search=${encodeURIComponent(query)}&limit=20`;
        if (assetClass) {
            url += `&asset_class=${assetClass}`;
        }
        return this.makeRequest(url);
    }

    // Enhanced search across multiple asset classes
    async performAdvancedSearch(query) {
        if (query.length < 2) return;
        
        try {
            // Search across multiple asset classes
            const [stocks, crypto, forex, commodities] = await Promise.all([
                this.searchSymbols(query, 'equity'),
                this.searchSymbols(query, 'crypto'),
                this.searchSymbols(query, 'currency'),
                this.searchSymbols(query, 'commodity')
            ]);
            
            return {
                stocks: stocks.slice(0, 5),
                crypto: crypto.slice(0, 3),
                forex: forex.slice(0, 3),
                commodities: commodities.slice(0, 3)
            };
            
        } catch (error) {
            console.error('Advanced search failed:', error);
            throw error;
        }
    }

    async getNews(category = null, limit = 20) {
        let url = `${this.endpoints.news}?limit=${limit}`;
        if (category) url += `&category=${encodeURIComponent(category)}`;
        return this.makeRequest(url);
    }

    async getBrokers(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return this.makeRequest(`${this.endpoints.brokers}?${params}`);
    }

    // New enhanced API methods
    async getMarketStatus() {
        return this.makeRequest('/api/market/status');
    }

    async getIntradayData(ticker, interval = '5min') {
        return this.makeRequest(`/api/symbols/${ticker}/intraday?interval=${interval}`);
    }

    async getMarketScreener(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return this.makeRequest(`/api/market/screener?${params}`);
    }

    async createPriceAlert(symbolTicker, targetPrice, condition) {
        return this.makeRequest('/api/alerts/create', {
            method: 'POST',
            body: JSON.stringify({
                symbol_ticker: symbolTicker,
                target_price: targetPrice,
                condition: condition
            })
        });
    }

    async getCacheStats() {
        return this.makeRequest('/api/cache/stats');
    }

    // Handle real-time updates
    handleMessage(data) {
        switch(data.type) {
            case 'price_update':
                this.updatePriceDisplays(data.data);
                break;
            case 'news_update':
                this.updateNewsSection(data.data);
                break;
            case 'market_status':
                this.updateMarketStatus(data.data);
                break;
        }
    }

    // Update market status
    updateMarketStatus(statusData) {
        console.log('📊 Market status update:', statusData);
        // Add market status update logic here if needed
    }

    // Update news section
    updateNewsSection(newsData) {
        console.log('📰 News update:', newsData);
        // Add news update logic here if needed
    }

    // Update DOM elements with real-time data
    updatePriceDisplays(priceData) {
        for (const [symbol, data] of Object.entries(priceData)) {
            const elements = document.querySelectorAll(`[data-symbol="${symbol}"]`);
            elements.forEach(element => {
                this.updateSymbolElement(element, data);
            });
        }
    }

    updateSymbolElement(element, data) {
        // Price with animation
        const priceEl = element.querySelector('[data-field="price"]');
        if (priceEl && data.current_price) {
            const oldPrice = parseFloat(priceEl.textContent);
            const newPrice = data.current_price;
            
            priceEl.textContent = newPrice.toFixed(2);
            
            // Add price movement animation
            if (newPrice > oldPrice) {
                priceEl.classList.add('price-up');
            } else if (newPrice < oldPrice) {
                priceEl.classList.add('price-down');
            }
            
            setTimeout(() => {
                priceEl.classList.remove('price-up', 'price-down');
            }, 1000);
        }
        
        // Volume with abbreviation
        const volumeEl = element.querySelector('[data-field="volume"]');
        if (volumeEl && data.volume) {
            volumeEl.textContent = this.abbreviateNumber(data.volume);
        }
        
        // Market status indicator
        const statusEl = element.querySelector('[data-field="status"]');
        if (statusEl) {
            statusEl.className = `status ${data.is_market_open ? 'open' : 'closed'}`;
            statusEl.textContent = data.is_market_open ? 'LIVE' : 'CLOSED';
        }

        // Update change with enhanced styling
        const changeEl = element.querySelector('.change, [data-field="change"]');
        if (changeEl && data.change_percent !== null) {
            const isPositive = data.change_percent >= 0;
            changeEl.textContent = `${isPositive ? '+' : ''}${data.change_percent.toFixed(2)}%`;
            changeEl.className = `change ${isPositive ? 'positive' : 'negative'}`;
        }
        
        // Update change amount
        const changeAmountEl = element.querySelector('[data-field="change_amount"]');
        if (changeAmountEl && data.change !== undefined) {
            const isPositive = data.change >= 0;
            changeAmountEl.textContent = `${isPositive ? '+' : ''}${data.change.toFixed(2)}`;
            changeAmountEl.className = `change-amount ${isPositive ? 'positive' : 'negative'}`;
        }
    }

    // Add number abbreviation utility
    abbreviateNumber(num) {
        if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return num.toString();
    }

    // Connection status indicator
    updateConnectionStatus(connected) {
        let indicator = document.getElementById('connection-status');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'connection-status';
            indicator.className = 'connection-status';
            document.body.appendChild(indicator);
        }
        
        indicator.className = `connection-status ${connected ? 'connected' : 'disconnected'}`;
        indicator.textContent = connected ? '🟢 Live Data' : '🔴 Reconnecting...';
    }

    // Utility methods
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    subscribeToDefaultSymbols() {
        const config = window.InvestingMarketsConfig.symbols;
        const allSymbols = [
            ...config.majorIndices,
            ...config.currencies,
            ...config.commodities,
            ...config.crypto
        ];

        if (this.websocket?.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify({
                type: 'subscribe',
                symbols: allSymbols
            }));
        }
    }

    sendHeartbeat() {
        if (this.websocket?.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify({ type: 'ping' }));
        }
        setTimeout(() => this.sendHeartbeat(), 30000);
    }
}

// Initialize global API instance
window.API = new InvestingMarketsAPI();