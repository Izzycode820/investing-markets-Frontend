class ChartManager {
    constructor() {
        this.charts = new Map();
        this.isLibraryLoaded = false;
        this.loadingPromise = null;
        this.loadTradingViewLibrary();
    }
    
    async loadTradingViewLibrary() {
        if (this.loadingPromise) {
            return this.loadingPromise;
        }
        
        this.loadingPromise = new Promise((resolve, reject) => {
            // Check if TradingView library is already loaded
            if (window.TradingView && window.TradingView.widget) {
                this.isLibraryLoaded = true;
                resolve();
                return;
            }
            
            // Load lightweight charts library (free alternative)
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js';
            script.onload = () => {
                this.isLibraryLoaded = true;
                console.log('📈 Chart library loaded successfully');
                resolve();
            };
            script.onerror = () => {
                console.error('Failed to load chart library');
                reject(new Error('Chart library failed to load'));
            };
            document.head.appendChild(script);
        });
        
        return this.loadingPromise;
    }
    
    async createChart(containerId, symbol, timeframe = '1D') {
        try {
            await this.loadTradingViewLibrary();
            
            const container = document.getElementById(containerId);
            if (!container) {
                throw new Error(`Container ${containerId} not found`);
            }
            
            // Show loading state
            container.innerHTML = '<div class="chart-loading">Loading chart...</div>';
            
            // Create chart with lightweight-charts
            const chart = window.LightweightCharts.createChart(container, {
                width: container.clientWidth,
                height: 400,
                layout: {
                    backgroundColor: '#ffffff',
                    textColor: '#333',
                    fontFamily: 'Arial, sans-serif',
                },
                grid: {
                    vertLines: { color: '#e1e1e1' },
                    horzLines: { color: '#e1e1e1' },
                },
                crosshair: {
                    mode: window.LightweightCharts.CrosshairMode.Normal,
                },
                timeScale: {
                    borderColor: '#485c7b',
                },
                watermark: {
                    color: 'rgba(11, 94, 29, 0.4)',
                    visible: true,
                    text: symbol,
                    fontSize: 24,
                    horzAlign: 'left',
                    vertAlign: 'bottom',
                },
            });
            
            // Create candlestick series
            const candlestickSeries = chart.addCandlestickSeries({
                upColor: '#22C55E',
                downColor: '#EF4444',
                borderDownColor: '#EF4444',
                borderUpColor: '#22C55E',
                wickDownColor: '#EF4444',
                wickUpColor: '#22C55E',
            });
            
            // Create volume series
            const volumeSeries = chart.addHistogramSeries({
                color: '#26a69a',
                priceFormat: {
                    type: 'volume',
                },
                priceScaleId: '',
                scaleMargins: {
                    top: 0.8,
                    bottom: 0,
                },
            });
            
            // Store chart reference
            this.charts.set(containerId, {
                chart,
                candlestickSeries,
                volumeSeries,
                symbol,
                timeframe,
                lastUpdate: Date.now()
            });
            
            // Load initial data
            await this.loadChartData(containerId, symbol, timeframe);
            
            // Handle resize
            const resizeObserver = new ResizeObserver(entries => {
                const { width, height } = entries[0].contentRect;
                chart.applyOptions({ width, height: Math.max(height, 400) });
            });
            resizeObserver.observe(container);
            
            console.log(`📊 Chart created for ${symbol} in ${containerId}`);
            return chart;
            
        } catch (error) {
            console.error(`Failed to create chart for ${symbol}:`, error);
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `<div class="chart-error">Chart loading failed: ${error.message}</div>`;
            }
            throw error;
        }
    }
    
    async loadChartData(containerId, symbol, timeframe) {
        try {
            const chartData = this.charts.get(containerId);
            if (!chartData) {
                throw new Error('Chart not found');
            }
            
            // Get intraday data from API
            const data = await window.API.getIntradayData(symbol, this.convertTimeframe(timeframe));
            
            if (data && data.data) {
                // Convert API data to chart format
                const candlestickData = data.data.map(item => ({
                    time: this.parseTime(item.timestamp),
                    open: item.open,
                    high: item.high,
                    low: item.low,
                    close: item.close
                }));
                
                const volumeData = data.data.map(item => ({
                    time: this.parseTime(item.timestamp),
                    value: item.volume || 0,
                    color: item.close > item.open ? '#22C55E' : '#EF4444'
                }));
                
                // Update chart series
                chartData.candlestickSeries.setData(candlestickData);
                chartData.volumeSeries.setData(volumeData);
                chartData.lastUpdate = Date.now();
                
                console.log(`📈 Chart data loaded for ${symbol}: ${candlestickData.length} points`);
            }
            
        } catch (error) {
            console.error(`Failed to load chart data for ${symbol}:`, error);
            
            // Generate sample data for demo
            const sampleData = this.generateSampleData(symbol);
            const chartData = this.charts.get(containerId);
            if (chartData) {
                chartData.candlestickSeries.setData(sampleData.candlestick);
                chartData.volumeSeries.setData(sampleData.volume);
            }
        }
    }
    
    updateChartData(symbol, newData) {
        // Find charts displaying this symbol
        for (const [containerId, chartData] of this.charts.entries()) {
            if (chartData.symbol === symbol) {
                try {
                    // Update with real-time price
                    const time = Math.floor(Date.now() / 1000);
                    const price = newData.current_price || newData.price;
                    
                    if (price) {
                        // Add new real-time point
                        chartData.candlestickSeries.update({
                            time,
                            open: price,
                            high: price * 1.001,
                            low: price * 0.999,
                            close: price
                        });
                        
                        chartData.volumeSeries.update({
                            time,
                            value: newData.volume || 100000,
                            color: newData.change >= 0 ? '#22C55E' : '#EF4444'
                        });
                    }
                } catch (error) {
                    console.error(`Failed to update chart for ${symbol}:`, error);
                }
            }
        }
    }
    
    convertTimeframe(timeframe) {
        const mapping = {
            '1m': '1min',
            '5m': '5min',
            '15m': '15min',
            '30m': '30min',
            '1h': '60min',
            '1D': '5min',
            '1W': '60min'
        };
        return mapping[timeframe] || '5min';
    }
    
    parseTime(timestamp) {
        const date = new Date(timestamp);
        return Math.floor(date.getTime() / 1000);
    }
    
    generateSampleData(symbol) {
        const data = [];
        const volumeData = [];
        const basePrice = 100;
        let currentPrice = basePrice;
        
        for (let i = 0; i < 100; i++) {
            const time = Math.floor((Date.now() - (100 - i) * 60000) / 1000);
            const change = (Math.random() - 0.5) * 2; // Random change between -1 and 1
            
            const open = currentPrice;
            const close = currentPrice + change;
            const high = Math.max(open, close) + Math.random() * 0.5;
            const low = Math.min(open, close) - Math.random() * 0.5;
            
            data.push({
                time,
                open: parseFloat(open.toFixed(2)),
                high: parseFloat(high.toFixed(2)),
                low: parseFloat(low.toFixed(2)),
                close: parseFloat(close.toFixed(2))
            });
            
            volumeData.push({
                time,
                value: Math.floor(Math.random() * 1000000) + 100000,
                color: close > open ? '#22C55E' : '#EF4444'
            });
            
            currentPrice = close;
        }
        
        return { candlestick: data, volume: volumeData };
    }
    
    removeChart(containerId) {
        const chartData = this.charts.get(containerId);
        if (chartData) {
            chartData.chart.remove();
            this.charts.delete(containerId);
            console.log(`📊 Chart removed from ${containerId}`);
        }
    }
    
    resizeChart(containerId, width, height) {
        const chartData = this.charts.get(containerId);
        if (chartData) {
            chartData.chart.applyOptions({ width, height });
        }
    }
    
    setTimeframe(containerId, timeframe) {
        const chartData = this.charts.get(containerId);
        if (chartData) {
            chartData.timeframe = timeframe;
            this.loadChartData(containerId, chartData.symbol, timeframe);
        }
    }
    
    getChartInfo(containerId) {
        return this.charts.get(containerId);
    }
    
    getAllCharts() {
        return Array.from(this.charts.keys());
    }
    
    // Subscribe to real-time updates for all active charts
    subscribeToRealtimeUpdates() {
        if (window.API && window.API.websocket) {
            const symbols = Array.from(this.charts.values()).map(chart => chart.symbol);
            const uniqueSymbols = [...new Set(symbols)];
            
            if (uniqueSymbols.length > 0 && window.API.websocket.readyState === WebSocket.OPEN) {
                window.API.websocket.send(JSON.stringify({
                    type: 'subscribe',
                    symbols: uniqueSymbols
                }));
                console.log('📊 Subscribed to real-time updates for chart symbols:', uniqueSymbols);
            }
        }
    }
}

// Initialize global chart manager
window.ChartManager = new ChartManager();

// Auto-subscribe to real-time updates when API is ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.API) {
        setTimeout(() => {
            window.ChartManager.subscribeToRealtimeUpdates();
        }, 2000);
    }
});

// Listen for price updates to update charts
if (window.API) {
    const originalHandleMessage = window.API.handleMessage;
    window.API.handleMessage = function(data) {
        // Call original handler
        originalHandleMessage.call(this, data);
        
        // Update charts if price data
        if (data.type === 'price_update' && data.data) {
            for (const [symbol, priceData] of Object.entries(data.data)) {
                window.ChartManager.updateChartData(symbol, priceData);
            }
        }
    };
}