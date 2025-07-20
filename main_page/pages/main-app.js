document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Investing Markets - Starting Application...');
    
    // Initialize UI
    initializeUI();
    
    // Load initial data
    loadInitialData();
    
    // Set up periodic refresh
    setInterval(refreshData, window.InvestingMarketsConfig.ui.refreshInterval);
});

async function initializeUI() {
    // Add loading indicators
    addLoadingStates();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize search functionality
    initializeSearch();
}

async function loadInitialData() {
    try {
        // Load market overview
        const marketData = await window.API.getMarketOverview();
        displayMarketOverview(marketData);
        
        // Load latest news
        const news = await window.API.getNews(null, 10);
        displayNews(news);
        
    } catch (error) {
        console.error('Failed to load initial data:', error);
        showErrorMessage('Failed to load market data. Please refresh the page.');
    }
}

function displayMarketOverview(data) {
    // Update major indices
    updateSection('major-indices', data.major_indices);
    updateSection('top-gainers', data.top_gainers);
    updateSection('top-losers', data.top_losers);
    updateSection('currencies', data.major_currencies);
    updateSection('commodities', data.commodities);
}

function updateSection(sectionId, items) {
    const section = document.getElementById(sectionId);
    if (!section || !items) return;
    
    items.forEach(item => {
        const element = section.querySelector(`[data-symbol="${item.ticker}"]`);
        if (element) {
            window.API.updateSymbolElement(element, item);
        }
    });
}

function setupEventListeners() {
    // Search functionality
    const searchInput = document.querySelector('#search-input, [data-search="input"]');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performSearch(e.target.value);
            }, 300);
        });
    }
    
    // Navigation clicks
    document.addEventListener('click', (e) => {
        if (e.target.matches('[data-nav]')) {
            handleNavigation(e.target.dataset.nav);
        }
    });
}

async function performSearch(query) {
    if (query.length < 2) {
        hideSearchResults();
        return;
    }
    
    try {
        // Show loading state
        showSearchLoading();
        
        // Use advanced search for categorized results
        const results = await window.API.performAdvancedSearch(query);
        displayCategorizedSearchResults(results);
    } catch (error) {
        console.error('Search failed:', error);
        showSearchError('Search failed. Please try again.');
    }
}

async function performAdvancedSearch(query) {
    if (query.length < 2) return;
    
    try {
        // Search across multiple asset classes
        const [stocks, crypto, forex, commodities] = await Promise.all([
            window.API.searchSymbols(query, 'equity'),
            window.API.searchSymbols(query, 'crypto'),
            window.API.searchSymbols(query, 'currency'),
            window.API.searchSymbols(query, 'commodity')
        ]);
        
        const results = {
            stocks: stocks.slice(0, 5),
            crypto: crypto.slice(0, 3),
            forex: forex.slice(0, 3),
            commodities: commodities.slice(0, 3)
        };
        
        displayCategorizedSearchResults(results);
    } catch (error) {
        console.error('Advanced search failed:', error);
    }
}

function displayCategorizedSearchResults(results) {
    const searchContainer = getOrCreateSearchContainer();
    
    if (!results || Object.values(results).every(arr => arr.length === 0)) {
        searchContainer.innerHTML = '<div class="search-no-results">No results found</div>';
        return;
    }
    
    let html = '<div class="search-results">';
    
    // Display each category
    const categories = [
        { key: 'stocks', label: 'Stocks', icon: '📈' },
        { key: 'crypto', label: 'Crypto', icon: '₿' },
        { key: 'forex', label: 'Forex', icon: '💱' },
        { key: 'commodities', label: 'Commodities', icon: '🥇' }
    ];
    
    categories.forEach(category => {
        const items = results[category.key];
        if (items && items.length > 0) {
            html += `
                <div class="search-category">
                    <h4>${category.icon} ${category.label}</h4>
                    <ul class="search-category-results">
            `;
            
            items.forEach(item => {
                const changeClass = item.change_percent >= 0 ? 'positive' : 'negative';
                const changeIcon = item.change_percent >= 0 ? '↗' : '↘';
                
                html += `
                    <li class="search-result-item" data-symbol="${item.ticker}">
                        <div class="result-info">
                            <span class="result-symbol">${item.ticker}</span>
                            <span class="result-name">${item.name}</span>
                        </div>
                        <div class="result-price">
                            <span class="price" data-field="price">${item.current_price ? item.current_price.toFixed(2) : '--'}</span>
                            <span class="change ${changeClass}">
                                ${changeIcon} ${item.change_percent ? item.change_percent.toFixed(2) : '0.00'}%
                            </span>
                        </div>
                    </li>
                `;
            });
            
            html += '</ul></div>';
        }
    });
    
    html += '</div>';
    searchContainer.innerHTML = html;
    
    // Add click handlers for search results
    searchContainer.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
            const symbol = item.dataset.symbol;
            handleSymbolSelection(symbol);
        });
    });
}

function getOrCreateSearchContainer() {
    let container = document.getElementById('search-results-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'search-results-container';
        container.className = 'search-results-container';
        
        // Position it below the search input
        const searchInput = document.querySelector('#search-input, [data-search="input"]');
        if (searchInput) {
            searchInput.parentNode.appendChild(container);
        } else {
            document.body.appendChild(container);
        }
    }
    return container;
}

function showSearchLoading() {
    const container = getOrCreateSearchContainer();
    container.innerHTML = '<div class="search-loading loading-shimmer">Searching...</div>';
}

function showSearchError(message) {
    const container = getOrCreateSearchContainer();
    container.innerHTML = `<div class="search-error">${message}</div>`;
}

function hideSearchResults() {
    const container = document.getElementById('search-results-container');
    if (container) {
        container.innerHTML = '';
    }
}

function handleSymbolSelection(symbol) {
    console.log(`Selected symbol: ${symbol}`);
    
    // Hide search results
    hideSearchResults();
    
    // You could navigate to a detailed view or open a chart
    // For now, just log and potentially open a chart
    openSymbolChart(symbol);
}

function openSymbolChart(symbol) {
    // Create a modal or dedicated chart area
    const chartModal = createChartModal(symbol);
    document.body.appendChild(chartModal);
    
    // Initialize chart
    setTimeout(() => {
        if (window.ChartManager) {
            window.ChartManager.createChart(`chart-${symbol}`, symbol, '1D');
        }
    }, 100);
}

function createChartModal(symbol) {
    const modal = document.createElement('div');
    modal.className = 'chart-modal';
    modal.innerHTML = `
        <div class="chart-modal-content">
            <div class="chart-modal-header">
                <h3>${symbol} Chart</h3>
                <button class="chart-modal-close">&times;</button>
            </div>
            <div class="chart-container">
                <div id="chart-${symbol}" style="width: 100%; height: 400px;"></div>
            </div>
        </div>
        <div class="chart-modal-backdrop"></div>
    `;
    
    // Add close functionality
    modal.querySelector('.chart-modal-close').addEventListener('click', () => {
        if (window.ChartManager) {
            window.ChartManager.removeChart(`chart-${symbol}`);
        }
        modal.remove();
    });
    
    modal.querySelector('.chart-modal-backdrop').addEventListener('click', () => {
        if (window.ChartManager) {
            window.ChartManager.removeChart(`chart-${symbol}`);
        }
        modal.remove();
    });
    
    return modal;
}

function refreshData() {
    console.log('🔄 Refreshing market data...');
    loadInitialData();
}

// Error handling
function showErrorMessage(message) {
    console.error(message);
    // You can implement a toast notification or error banner here
}