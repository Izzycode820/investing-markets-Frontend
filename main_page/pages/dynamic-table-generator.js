/**
 * Dynamic Table Generator for Investing Markets
 * Generates market data tables dynamically from backend metadata
 * Maintains investing.com visual design while using data-driven approach
 */

class DynamicTableGenerator {
    constructor() {
        this.symbolsMetadata = null;
        this.tableTemplates = this.initializeTableTemplates();
    }

    /**
     * Initialize table templates with investing.com styling
     */
    initializeTableTemplates() {
        return {
            tableHeader: (title, href) => `
                <div class="quotes-tables_container__t940k relative w-full">
                    <a class="float-left mb-4 block w-full text-xl font-bold leading-7 hover:underline" href="${href}">
                        <h3 class="w-fit text-3xl leading-8">
                            ${title}
                            <div class="float-right mt-1.5 flex ">
                                <svg viewBox="0 0 24 24" class="mx-1.5 mt-1.5 w-3 text-[#6A707C]">
                                    <use href="/next_/icon.svg?v=1fd2d54#chevron-right-thick"></use>
                                </svg>
                            </div>
                        </h3>
                    </a>
                    <div class="hidden items-center justify-end sm:flex">
                        <div class="flex items-center gap-2"></div>
                    </div>
            `,

            tableStructure: `
                        <div class="relative dynamic-table-v2_dynamic-table-wrapper__fBEvo">
                            <table class="datatable-v2_table__93S4Y dynamic-table-v2_dynamic-table__iz42m datatable-v2_table--mobile-basic__uC0U0 datatable-v2_table--freeze-column__uGXoD datatable-v2_table--freeze-column-first__zMZNN" style="--mobile-tablet-freeze-column-width:155px;--desktop-freeze-column-width:300px">
                                <thead class="datatable-v2_head__cB_1D">
                                    <tr class="datatable-v2_row__hkEus">
                                        <th class="datatable-v2_cell__IwP1U datatable-v2_cell--align-start__beGpn dynamic-table-v2_col-name__Xhsxv dynamic-table-v2_col-name-h__gix_M dynamic-table-v2_header-cell__vhndq !py-2">
                                            <div class="datatable-v2_cell__wrapper__7O0wk">
                                                <span>Name</span>
                                            </div>
                                        </th>
                                        <th class="datatable-v2_cell__IwP1U dynamic-table-v2_header-cell__vhndq text-right rtl:text-right">
                                            <div class="datatable-v2_cell__wrapper__7O0wk">
                                                <span>Last</span>
                                            </div>
                                        </th>
                                        <th class="datatable-v2_cell__IwP1U dynamic-table-v2_header-cell__vhndq text-right rtl:text-right">
                                            <div class="datatable-v2_cell__wrapper__7O0wk">
                                                <span>Chg.</span>
                                            </div>
                                        </th>
                                        <th class="datatable-v2_cell__IwP1U dynamic-table-v2_header-cell__vhndq text-right rtl:text-right">
                                            <div class="datatable-v2_cell__wrapper__7O0wk">
                                                <span>Chg. %</span>
                                            </div>
                                        </th>
                                        <th class="datatable-v2_cell__IwP1U dynamic-table-v2_header-cell__vhndq text-right rtl:text-right">
                                            <div class="datatable-v2_cell__wrapper__7O0wk">
                                                <span>Overview</span>
                                            </div>
                                        </th>
                                        <th class="datatable-v2_cell__IwP1U dynamic-table-v2_header-cell__vhndq text-right rtl:text-right">
                                            <div class="datatable-v2_cell__wrapper__7O0wk">
                                                <span>Time</span>
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody class="datatable-v2_body__8TXQk">
                                    <!-- Rows will be inserted here -->
                                </tbody>
                            </table>
                        </div>
            `,

            tableRow: (symbol) => `
                <tr class="datatable-v2_row__hkEus dynamic-table-v2_row__ILVMx" data-symbol="${symbol.symbol}">
                    <td class="datatable-v2_cell__IwP1U !h-auto w-full mdMax:border-r dynamic-table-v2_col-name__Xhsxv !py-2">
                        <div class="flex flex-row">
                            <div class="datatable-v2_cell__wrapper__7O0wk dynamic-table-v2_desktopFreezeColumnWidth__BKzCe">
                                <a class="overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-[#181C21] hover:text-[#1256A0]" 
                                   title="${symbol.name}" href="#${symbol.symbol}">
                                    <h4 class="flex align-middle">
                                        <span class="block">
                                            <span data-test="flag-${symbol.symbol}" class="flag_flag__gUPtc dynamic-table-v2_flag-icon__Dux2D" role="img"></span>
                                        </span>
                                        <span class="block overflow-hidden text-ellipsis whitespace-nowrap">${symbol.name}</span>
                                    </h4>
                                </a>
                            </div>
                        </div>
                    </td>
                    <td class="datatable-v2_cell__IwP1U text-right" style="--cell-positions:last;">
                        <span class="price-value skeleton-loading">
                            <span class="skeleton-placeholder">Loading...</span>
                        </span>
                    </td>
                    <td class="datatable-v2_cell__IwP1U text-right" style="--cell-positions:chg;">
                        <span class="change-value skeleton-loading">
                            <span class="skeleton-placeholder">--</span>
                        </span>
                    </td>
                    <td class="datatable-v2_cell__IwP1U text-right" style="--cell-positions:chg-pct;">
                        <span class="change-percent-value skeleton-loading">
                            <span class="skeleton-placeholder">--</span>
                        </span>
                    </td>
                    <td class="datatable-v2_cell__IwP1U text-right" style="--cell-positions:overview;">
                        <div class="flex items-center justify-end gap-1">
                            <span class="text-xs text-gray-500">Vol: </span>
                            <span class="volume-value skeleton-loading text-xs">
                                <span class="skeleton-placeholder">--</span>
                            </span>
                        </div>
                    </td>
                    <td class="datatable-v2_cell__IwP1U text-right" style="--cell-positions:clock;">
                        <div class="dynamic-table-v2_timeWrapper__oOtpE">
                            <time class="skeleton-loading">
                                <span class="skeleton-placeholder">--</span>
                            </time>
                        </div>
                    </td>
                </tr>
            `
        };
    }

    /**
     * Fetch symbols metadata from backend
     */
    async fetchSymbolsMetadata() {
        try {
            console.log('📡 Fetching symbols metadata from backend...');
            
            // Try the API endpoint
            const url = 'http://localhost:8001/api/symbols/metadata';
            console.log(`🔗 Calling: ${url}`);
            
            const response = await fetch(url);
            console.log(`📊 Response status: ${response.status} ${response.statusText}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ API Error Response: ${errorText}`);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            this.symbolsMetadata = await response.json();
            console.log(`✅ Loaded metadata for ${this.symbolsMetadata.total_symbols} symbols`);
            console.log(`📋 Categories:`, Object.keys(this.symbolsMetadata.symbols_by_category));
            return this.symbolsMetadata;
            
        } catch (error) {
            console.error('❌ Error fetching symbols metadata:', error);
            console.error('🔍 Error details:', {
                message: error.message,
                stack: error.stack
            });
            
            // Provide fallback data for testing
            console.log('🔄 Using fallback metadata for testing...');
            this.symbolsMetadata = this.getFallbackMetadata();
            return this.symbolsMetadata;
        }
    }
    
    /**
     * Fallback metadata if API fails
     */
    getFallbackMetadata() {
        return {
            symbols_by_category: {
                world_indices: [
                    {"symbol": "SPY", "name": "S&P 500", "category": "index"},
                    {"symbol": "QQQ", "name": "Nasdaq", "category": "index"},
                    {"symbol": "DIA", "name": "Dow Jones", "category": "index"}
                ],
                leading_stocks: [
                    {"symbol": "AAPL", "name": "Apple", "category": "stock"},
                    {"symbol": "TSLA", "name": "Tesla", "category": "stock"},
                    {"symbol": "MSFT", "name": "Microsoft", "category": "stock"}
                ],
                cryptocurrencies: [
                    {"symbol": "BTCUSD", "name": "Bitcoin", "category": "crypto"},
                    {"symbol": "ETHUSD", "name": "Ethereum", "category": "crypto"}
                ]
            },
            all_symbols: [],
            total_symbols: 8
        };
    }

    /**
     * Generate a complete table for a specific category
     */
    generateTableContent(category) {
        if (!this.symbolsMetadata) {
            console.error('❌ No symbols metadata loaded');
            return null;
        }

        const symbols = this.symbolsMetadata.symbols_by_category[category];
        if (!symbols || symbols.length === 0) {
            console.warn(`⚠️ No symbols found for category: ${category}`);
            return null;
        }

        console.log(`🏗️ Generating table content for ${category} with ${symbols.length} symbols`);

        // Create just the table structure that goes inside [data-test="dynamic-table"]
        const tableHTML = this.tableTemplates.tableStructure;
        
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = tableHTML;
        
        // Get tbody and add rows
        const tbody = tempContainer.querySelector('tbody');
        if (!tbody) {
            console.error('❌ Could not find tbody element in generated table');
            return null;
        }
        
        symbols.forEach((symbol, index) => {
            try {
                const rowHTML = this.tableTemplates.tableRow(symbol);
                console.log(`🔍 DEBUG: Row HTML for ${symbol.symbol}:`, rowHTML.substring(0, 150));
                
                // Create a proper table structure to parse the row correctly
                const tempTable = document.createElement('table');
                const tempTbody = document.createElement('tbody');
                tempTbody.innerHTML = rowHTML;
                tempTable.appendChild(tempTbody);
                const row = tempTbody.firstElementChild;
                
                if (row) {
                    console.log(`🔍 DEBUG: Row element for ${symbol.symbol}:`, row);
                    console.log(`🔍 DEBUG: Row data-symbol attribute:`, row.getAttribute('data-symbol'));
                    tbody.appendChild(row);
                    console.log(`✅ Added row for ${symbol.symbol} (${symbol.name})`);
                } else {
                    console.error(`❌ Failed to create row for ${symbol.symbol}`);
                }
            } catch (error) {
                console.error(`❌ Error creating row for ${symbol.symbol}:`, error);
            }
        });
        
        console.log(`✅ Generated table content for ${category}: ${symbols.length} rows`);
        return tempContainer.firstElementChild; // Return the table wrapper div
    }

    /**
     * Replace existing tables with dynamically generated ones
     */
    async generateAllTables() {
        try {
            console.log('🚀 Starting dynamic table generation...');
            
            // Fetch metadata first
            await this.fetchSymbolsMetadata();
            
            // Define table configurations - target existing containers by finding them
            const tableConfigs = [
                {
                    category: 'world_indices',
                    title: 'World Indices',
                    href: 'https://www.investing-market.com/indices/major-indices',
                    selector: 'h3:contains("World Indices")', // Find existing World Indices table
                    fallbackId: 'world-indices-table'
                },
                {
                    category: 'leading_stocks', 
                    title: 'Leading Stocks',
                    href: 'https://www.investing-market.com/equities',
                    selector: 'h3:contains("Leading Stocks")', // Find existing Leading Stocks table
                    fallbackId: 'leading-stocks-table'
                },
                {
                    category: 'commodities',
                    title: 'Commodities',
                    href: 'https://www.investing-market.com/commodities',
                    selector: 'h3:contains("Commodities")', // Find existing Commodities table
                    fallbackId: 'commodities-table'
                },
                {
                    category: 'cryptocurrencies',
                    title: 'Top Cryptocurrencies', 
                    href: 'https://www.investing-market.com/crypto/currencies',
                    selector: 'h3:contains("Top Cryptocurrencies")', // Find existing crypto table
                    fallbackId: 'cryptocurrencies-table'
                }
            ];

            // Generate and insert tables
            for (const config of tableConfigs) {
                const tableContent = this.generateTableContent(config.category);
                
                if (tableContent) {
                    // Find existing table container by looking for the heading
                    let container = this.findExistingTableContainer(config.title);
                    
                    if (container) {
                        console.log(`🎯 Found existing container for ${config.title}`);
                        // Replace the existing table content with our generated one
                        const tableWrapper = container.querySelector('[data-test="dynamic-table"]');
                        if (tableWrapper) {
                            console.log(`🔍 BEFORE replacement - tableWrapper contents:`, tableWrapper.innerHTML.substring(0, 200));
                            console.log(`🔍 Pre-replacement verification: Generated table has ${tableContent.querySelectorAll('[data-symbol]').length} data-symbol rows`);
                            console.log(`🔍 Generated content preview:`, tableContent.outerHTML.substring(0, 300));
                            
                            // Simply replace the innerHTML with our generated content
                            tableWrapper.innerHTML = tableContent.outerHTML;
                            
                            console.log(`✅ Replaced ${config.title} table content`);
                            console.log(`🔍 AFTER replacement - tableWrapper contents:`, tableWrapper.innerHTML.substring(0, 200));
                            
                            // Verify data-symbol attributes are present after replacement
                            const dataSymbolRows = tableWrapper.querySelectorAll('[data-symbol]');
                            console.log(`🔍 Post-replacement verification: Found ${dataSymbolRows.length} rows with data-symbol attributes in ${config.title}`);
                        } else {
                            console.warn(`⚠️ Could not find [data-test="dynamic-table"] wrapper in existing container for ${config.title}`);
                            console.log(`🔍 Container HTML:`, container.innerHTML.substring(0, 500));
                        }
                    } else {
                        console.warn(`⚠️ Could not find existing container for ${config.title}`);
                    }
                } else {
                    console.warn(`⚠️ Could not generate table content for ${config.category}`);
                }
            }
            
            console.log('🎉 Dynamic table generation complete!');
            
            // Notify market data integration that tables are ready
            const totalDataSymbolElements = document.querySelectorAll('[data-symbol]').length;
            console.log(`📊 Total data-symbol elements after generation: ${totalDataSymbolElements}`);
            
            // Dispatch a custom event to notify other components
            const event = new CustomEvent('tablesGenerated', {
                detail: { 
                    symbolCount: totalDataSymbolElements,
                    categories: Object.keys(this.symbolsMetadata.symbols_by_category)
                }
            });
            document.dispatchEvent(event);
            return true;
            
        } catch (error) {
            console.error('❌ Error generating tables:', error);
            return false;
        }
    }

    /**
     * Find existing table container by title
     */
    findExistingTableContainer(title) {
        try {
            // Look for h3 elements containing the title
            const headings = document.querySelectorAll('h3');
            
            for (const heading of headings) {
                if (heading.textContent.trim().includes(title)) {
                    // Found the heading, now find its parent container
                    let container = heading.closest('.quotes-tables_container__t940k');
                    if (container) {
                        console.log(`🎯 Found existing container for "${title}"`);
                        return container;
                    }
                }
            }
            
            console.log(`⚠️ Could not find existing container for "${title}"`);
            return null;
            
        } catch (error) {
            console.error(`❌ Error finding container for ${title}:`, error);
            return null;
        }
    }

    /**
     * Get all symbols that should be tracked for price updates
     */
    getTrackableSymbols() {
        if (!this.symbolsMetadata) {
            return [];
        }
        
        return this.symbolsMetadata.all_symbols.map(symbol => symbol.symbol);
    }
}

// Export for global use
window.DynamicTableGenerator = DynamicTableGenerator;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎯 Initializing Dynamic Table Generator... (NEW VERSION WITH FIXES)');
    
    const generator = new DynamicTableGenerator();
    window.tableGenerator = generator; // Make available globally
    
    // Generate tables automatically
    await generator.generateAllTables();
});