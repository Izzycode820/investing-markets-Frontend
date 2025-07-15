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

    async searchSymbols(query) {
        return this.makeRequest(`${this.endpoints.search}?q=${encodeURIComponent(query)}`);
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
        // Update price
        const priceEl = element.querySelector('.price, [data-field="price"]');
        if (priceEl && data.current_price) {
            priceEl.textContent = data.current_price.toFixed(2);
            priceEl.classList.add('price-update');
            setTimeout(() => priceEl.classList.remove('price-update'), 1000);
        }

        // Update change
        const changeEl = element.querySelector('.change, [data-field="change"]');
        if (changeEl && data.change_percent !== null) {
            const isPositive = data.change_percent >= 0;
            changeEl.textContent = `${isPositive ? '+' : ''}${data.change_percent.toFixed(2)}%`;
            changeEl.className = `change ${isPositive ? 'positive' : 'negative'}`;
        }
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