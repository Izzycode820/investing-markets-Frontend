/**
 * Market Data Integration for investing.com HTML
 * This script finds and updates existing static data elements without changing design
 */

class MarketDataIntegration {
    constructor() {
        this.symbolMappings = {
            // Map display names to our backend symbols
            'Dow Jones': 'DIA',
            'S&P 500': 'SPY', 
            'S &P 500': 'SPY',
            'Nasdaq': 'QQQ',
            'Russell 2000': 'IWM',
            'VIX': 'VIX',
            'Bitcoin': 'BTCUSD',
            'Ethereum': 'ETHUSD',
            'XRP': 'XRPUSD',
            'Tether': 'USDTUSD',
            'BNB': 'BNBUSD',
            'Polkadot': 'DOTUSD',
            'Cardano': 'ADAUSD',
            'Solana': 'SOLUSD',
            'Dogecoin': 'DOGEUSD',
            'Litecoin': 'LTCUSD',
            'EUR/USD': 'EURUSD',
            'GBP/USD': 'GBPUSD',
            'USD/JPY': 'USDJPY'
        };
        
        this.priceElements = new Map();
        this.lastUpdated = new Date();
        this.scanForElements();
    }
    
    scanForElements() {
        console.log('🔍 Scanning for market data elements...');
        
        // Try multiple selectors to find table rows
        const selectors = [
            'tr.datatable-v2_row__hkEus.dynamic-table-v2_row__ILVMx',
            'tr.datatable-v2_row__hkEus',
            '[data-test="dynamic-table"] tr',
            'table tr'
        ];
        
        let tableRows = [];
        for (const selector of selectors) {
            tableRows = document.querySelectorAll(selector);
            console.log(`🔎 Selector "${selector}" found ${tableRows.length} rows`);
            if (tableRows.length > 0) break;
        }
        
        if (tableRows.length === 0) {
            console.warn('⚠️ No table rows found with any selector. Page may still be loading.');
            return;
        }
        
        tableRows.forEach((row, index) => {
            this.processTableRow(row, index);
        });
        
        // Also scan for any existing price elements
        this.scanForPriceElements();
        
        console.log(`📊 Found ${this.priceElements.size} market data elements`);
        
        // Debug: Show what symbols we found
        const foundSymbols = Array.from(this.priceElements.keys());
        console.log(`🎯 Tracking symbols:`, foundSymbols);
    }
    
    processTableRow(row, index) {
        // Look for the title/name element
        const titleElement = row.querySelector('a[title]');
        if (!titleElement) {
            // Debug: Log what we found in this row
            const linkText = row.querySelector('a')?.textContent?.trim();
            if (linkText) {
                console.log(`🔍 Row ${index}: Found link without title: "${linkText}"`);
            }
            return;
        }
        
        const title = titleElement.getAttribute('title');
        const symbol = this.symbolMappings[title];
        
        if (!symbol) {
            console.log(`❓ Row ${index}: Found "${title}" but no symbol mapping`);
            return;
        }
        
        console.log(`📈 Found ${title} -> ${symbol}`);
        
        // Find cells by their CSS custom properties (more reliable than position)
        const priceCell = row.querySelector('td[style*="--cell-positions:last"]');
        const changeCell = row.querySelector('td[style*="--cell-positions:chg"]');
        const changePctCell = row.querySelector('td[style*="--cell-positions:chg-pct"]');
        const timeCell = row.querySelector('td[style*="--cell-positions:clock"]');
        
        if (!priceCell) {
            console.warn(`⚠️ No price cell found for ${title}`);
            // Debug: Show what cells we do have
            const allCells = row.querySelectorAll('td');
            console.log(`🔍 ${title} has ${allCells.length} cells:`, Array.from(allCells).map(cell => cell.textContent.trim()));
            return;
        }
        
        console.log(`🔍 ${title} found cells:`, {
            price: !!priceCell,
            change: !!changeCell,
            changePct: !!changePctCell,
            time: !!timeCell
        });
        
        // Debug: Show current values
        console.log(`📊 ${title} current values:`, {
            price: priceCell.textContent.trim(),
            change: changeCell?.textContent.trim(),
            changePct: changePctCell?.textContent.trim()
        });
        
        // Store references for updates
        this.priceElements.set(symbol, {
            row: row,
            title: title,
            priceElement: priceCell.querySelector('span') || priceCell,
            changeElement: changeCell,
            changePctElement: changePctCell,
            timeElement: timeCell,
            lastPrice: 0,
            lastChange: 0,
            lastChangePct: 0
        });
        
        // Add data attributes for our existing API client
        row.setAttribute('data-symbol', symbol);
        if (priceCell.querySelector('span')) {
            priceCell.querySelector('span').setAttribute('data-field', 'price');
        } else {
            priceCell.setAttribute('data-field', 'price');
        }
        if (changeCell) changeCell.setAttribute('data-field', 'change');
        if (changePctCell) changePctCell.setAttribute('data-field', 'change_percent');
    }
    
    scanForPriceElements() {
        // Look for any other price-like elements
        const priceSelectors = [
            'span[class*="price"]',
            'div[class*="price"]',
            'td[class*="price"]'
        ];
        
        priceSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                // Check if this looks like a price (contains numbers and decimals)
                const text = element.textContent.trim();
                if (/^\d+[\d,]*\.?\d*$/.test(text.replace(/,/g, ''))) {
                    console.log(`💰 Found potential price element: ${text}`);
                }
            });
        });
    }
    
    updateMarketData(priceData) {
        // Handle both batch updates and individual symbol updates
        if (priceData.symbol) {
            // Individual symbol update: {symbol: 'BTCUSD', price: 117861, ...}
            this.updateSymbolData(priceData.symbol, priceData);
        } else {
            // Batch update: {'BTCUSD': {price: 117861}, 'ETHUSD': {price: 3582}}
            Object.entries(priceData).forEach(([symbol, data]) => {
                this.updateSymbolData(symbol, data);
            });
        }
        
        this.lastUpdated = new Date();
    }
    
    updateSymbolData(symbol, data) {
        const elementData = this.priceElements.get(symbol);
        if (!elementData) {
            console.log(`⚠️ No element found for symbol: ${symbol}`);
            return;
        }
        
        try {
            console.log(`🔄 Updating ${symbol}:`, data);
            // Update price with animation
            const newPrice = parseFloat(data.price || data.current_price);
            const oldPrice = elementData.lastPrice;
            
            if (newPrice && elementData.priceElement) {
                // Format price appropriately (2 decimals for most, 4 for forex)
                const decimals = symbol.includes('USD') && symbol.length === 6 ? 4 : 2;
                const formattedPrice = this.formatPrice(newPrice, decimals);
                
                elementData.priceElement.textContent = formattedPrice;
                elementData.lastPrice = newPrice;
                
                // Add animation class
                if (oldPrice > 0) {
                    if (newPrice > oldPrice) {
                        elementData.priceElement.classList.add('price-up');
                    } else if (newPrice < oldPrice) {
                        elementData.priceElement.classList.add('price-down');
                    }
                    
                    // Remove animation after 1 second
                    setTimeout(() => {
                        elementData.priceElement.classList.remove('price-up', 'price-down');
                    }, 1000);
                }
            }
            
            // Update change amount
            if (data.change !== undefined && elementData.changeElement) {
                const change = parseFloat(data.change);
                const oldChange = elementData.lastChange;
                
                // Format change amount properly (crypto usually needs more precision)
                const decimals = symbol.includes('USD') && symbol.length === 6 ? 4 : 2;
                const formattedChange = change >= 0 ? `+${change.toFixed(decimals)}` : change.toFixed(decimals);
                elementData.changeElement.textContent = formattedChange;
                elementData.lastChange = change;
                
                // Update CSS classes for up/down styling (using correct class names from HTML)
                elementData.changeElement.classList.remove('datatable-v2_cell--up__lVyET', 'datatable-v2_cell--down__sYmZ4');
                if (change >= 0) {
                    elementData.changeElement.classList.add('datatable-v2_cell--up__lVyET');
                } else {
                    elementData.changeElement.classList.add('datatable-v2_cell--down__sYmZ4');
                }
                
                // Add animation for change field too
                if (oldChange !== 0 && change !== oldChange) {
                    if (change > oldChange) {
                        elementData.changeElement.classList.add('price-up');
                    } else if (change < oldChange) {
                        elementData.changeElement.classList.add('price-down');
                    }
                    
                    setTimeout(() => {
                        elementData.changeElement.classList.remove('price-up', 'price-down');
                    }, 1000);
                }
            }
            
            // Update change percentage
            if (data.change_percent !== undefined && elementData.changePctElement) {
                const changePct = parseFloat(data.change_percent);
                const oldChangePct = elementData.lastChangePct;
                
                const formattedChangePct = changePct >= 0 ? `+${changePct.toFixed(2)}%` : `${changePct.toFixed(2)}%`;
                elementData.changePctElement.textContent = formattedChangePct;
                elementData.lastChangePct = changePct;
                
                // Update CSS classes (using correct class names from HTML)
                elementData.changePctElement.classList.remove('datatable-v2_cell--up__lVyET', 'datatable-v2_cell--down__sYmZ4');
                if (changePct >= 0) {
                    elementData.changePctElement.classList.add('datatable-v2_cell--up__lVyET');
                } else {
                    elementData.changePctElement.classList.add('datatable-v2_cell--down__sYmZ4');
                }
                
                // Add animation for percentage field too
                if (oldChangePct !== 0 && changePct !== oldChangePct) {
                    if (changePct > oldChangePct) {
                        elementData.changePctElement.classList.add('price-up');
                    } else if (changePct < oldChangePct) {
                        elementData.changePctElement.classList.add('price-down');
                    }
                    
                    setTimeout(() => {
                        elementData.changePctElement.classList.remove('price-up', 'price-down');
                    }, 1000);
                }
            }
            
            // Update high/low if available
            if (data.high && elementData.highElement) {
                elementData.highElement.textContent = this.formatPrice(data.high, 2);
            }
            if (data.low && elementData.lowElement) {
                elementData.lowElement.textContent = this.formatPrice(data.low, 2);
            }
            
            // Update market status (open/closed indicator)
            if (elementData.timeElement) {
                const isOpen = data.is_market_open !== undefined ? data.is_market_open : true;
                const clockIcon = elementData.timeElement.querySelector('svg');
                if (clockIcon) {
                    // Update clock color based on market status
                    clockIcon.classList.remove('text-market-open', 'text-market-closed');
                    clockIcon.classList.add(isOpen ? 'text-market-open' : 'text-market-closed');
                }
                
                // Update time display
                const timeWrapper = elementData.timeElement.querySelector('.dynamic-table-v2_timeWrapper__oOtpE');
                if (timeWrapper) {
                    const now = new Date();
                    const timeStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
                    timeWrapper.innerHTML = `<time dateTime="${timeStr}">${timeStr}</time>`;
                }
            }
            
            console.log(`✅ Updated ${symbol}: ${formattedPrice}`);
            
        } catch (error) {
            console.error(`❌ Error updating ${symbol}:`, error);
        }
    }
    
    formatPrice(price, decimals = 2) {
        return parseFloat(price).toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }
    
    // Method to manually trigger updates for testing
    simulateUpdate() {
        console.log('🧪 Simulating price updates...');
        
        this.priceElements.forEach((elementData, symbol) => {
            const basePrice = Math.random() * 1000 + 100;
            const change = (Math.random() - 0.5) * 20;
            const changePct = (change / basePrice) * 100;
            
            this.updateSymbolData(symbol, {
                price: basePrice,
                change: change,
                change_percent: changePct,
                high: basePrice * 1.02,
                low: basePrice * 0.98,
                is_market_open: Math.random() > 0.5
            });
        });
    }
    
    getTrackedSymbols() {
        return Array.from(this.priceElements.keys());
    }
    
    getElementCount() {
        return this.priceElements.size;
    }
    
    // Manual debug function to test detection
    debugDetection() {
        console.log('🐛 MANUAL DEBUG - Testing table detection...');
        
        // Test all possible selectors
        const selectors = [
            'tr.datatable-v2_row__hkEus.dynamic-table-v2_row__ILVMx',
            'tr.datatable-v2_row__hkEus',
            '[data-test="dynamic-table"] tr',
            'table tr',
            'tr'
        ];
        
        selectors.forEach(selector => {
            const rows = document.querySelectorAll(selector);
            console.log(`🔎 "${selector}" found ${rows.length} rows`);
            
            if (rows.length > 0) {
                // Check first few rows for crypto content
                Array.from(rows).slice(0, 10).forEach((row, index) => {
                    const link = row.querySelector('a[title]');
                    const linkText = row.querySelector('a')?.textContent?.trim();
                    const cells = row.querySelectorAll('td');
                    
                    if (link || linkText) {
                        console.log(`  Row ${index}: ${link?.getAttribute('title') || linkText} (${cells.length} cells)`);
                    }
                });
            }
        });
        
        // Test direct crypto symbol search
        const cryptoSymbols = ['Bitcoin', 'Ethereum', 'XRP', 'Tether', 'BNB', 'Polkadot'];
        cryptoSymbols.forEach(crypto => {
            const element = document.querySelector(`a[title="${crypto}"]`);
            if (element) {
                console.log(`✅ Found ${crypto} link:`, element);
                const row = element.closest('tr');
                if (row) {
                    const cells = row.querySelectorAll('td');
                    console.log(`  - Row has ${cells.length} cells`);
                    const changeCell = row.querySelector('td[style*="--cell-positions:chg"]');
                    const changePctCell = row.querySelector('td[style*="--cell-positions:chg-pct"]');
                    console.log(`  - Change cell:`, changeCell?.textContent.trim());
                    console.log(`  - Change% cell:`, changePctCell?.textContent.trim());
                }
            } else {
                console.log(`❌ ${crypto} not found`);
            }
        });
        
        return {
            detectedElements: this.priceElements.size,
            trackedSymbols: Array.from(this.priceElements.keys())
        };
    }
}

// Initialize the integration when DOM is ready
let marketDataIntegration;

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Market Data Integration...');
    
    // Wait a bit for the page to fully load
    setTimeout(() => {
        marketDataIntegration = new MarketDataIntegration();
        
        // Integrate with existing API client if available
        if (window.API) {
            console.log('🔗 Connecting to existing API client...');
            
            // Override the message handler to intercept all price updates
            const originalHandleMessage = window.API.handleMessage;
            window.API.handleMessage = function(data) {
                // Call original handler first
                if (originalHandleMessage) {
                    originalHandleMessage.call(this, data);
                }
                
                // Handle our integration updates
                if (data.type === 'price_update' && data.symbol && marketDataIntegration) {
                    console.log(`📨 Intercepted price update for ${data.symbol}`);
                    marketDataIntegration.updateSymbolData(data.symbol, data.data);
                }
            };
            
            // Subscribe to the symbols we found
            const symbols = marketDataIntegration.getTrackedSymbols();
            if (symbols.length > 0 && window.API.websocket?.readyState === WebSocket.OPEN) {
                window.API.websocket.send(JSON.stringify({
                    type: 'subscribe',
                    symbols: symbols
                }));
                console.log(`📡 Subscribed to ${symbols.length} symbols:`, symbols);
            }
        } else {
            console.warn('⚠️ API client not found - integration will not receive real-time updates');
        }
        
        // For testing - you can call this manually
        window.testMarketData = () => marketDataIntegration.simulateUpdate();
        
        // Debug function for troubleshooting
        window.debugMarketData = () => marketDataIntegration.debugDetection();
        
        console.log(`✅ Market Data Integration ready - tracking ${marketDataIntegration.getElementCount()} elements`);
        
        // Auto-run debug if no elements were found
        if (marketDataIntegration.getElementCount() === 0) {
            console.warn('⚠️ No market data elements detected! Running debug...');
            window.debugMarketData();
        }
        
    }, 2000); // Wait 2 seconds for everything to load
});

// Export for global access
window.MarketDataIntegration = MarketDataIntegration;