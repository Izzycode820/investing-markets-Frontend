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
    if (query.length < 2) return;
    
    try {
        const results = await window.API.searchSymbols(query);
        displaySearchResults(results);
    } catch (error) {
        console.error('Search failed:', error);
    }
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