/**
 * DXCC JSON Entity Checker Component
 * JavaScript component that can be embedded in any HTML page
 * Author: BG6LH
 */

class DXCCTableWidget {
    constructor(options = {}) {
        this.options = {
            containerId: options.containerId || 'dxcc-table-container',
            jsonUrl: options.jsonUrl || './dxcc_current_deleted_2022.json',
            data: options.data || null, // Allow direct data input
            showHeader: options.showHeader !== false,
            showFilters: options.showFilters !== false,
            showFootnotes: false, // 禁用脚注功能
            theme: options.theme || 'default',
            language: options.language || 'en-US',
            ...options
        };
        
        this.data = this.options.data;
        this.container = null;
        this.sortState = {
            column: null,
            direction: 'asc' // 'asc' or 'desc'
        };
        
        // Bind methods
        this.filterTable = this.filterTable.bind(this);
        this.sortTable = this.sortTable.bind(this);
    }

    /**
     * Initialize component with data loading
     */
    async init() {
        try {
            this.container = document.getElementById(this.options.containerId);
            if (!this.container) {
                throw new Error(`Container element #${this.options.containerId} not found`);
            }
            
            if (!this.data) {
                await this.loadData();
            }
            
            this.render();
            this.bindEvents();
            
            console.log('DXCC table component initialized successfully');
        } catch (error) {
            console.error('DXCC table component initialization failed:', error);
            this.renderError(error.message);
        }
    }
    
    /**
     * Initialize component with pre-loaded data
     */
    initWithData() {
        try {
            this.container = document.getElementById(this.options.containerId);
            if (!this.container) {
                throw new Error(`Container element #${this.options.containerId} not found`);
            }
            
            if (!this.data) {
                throw new Error('No data provided for initialization');
            }
            
            this.render();
            this.bindEvents();
            
            console.log('DXCC table component initialized with provided data');
        } catch (error) {
            console.error('DXCC table component initialization failed:', error);
            this.renderError(error.message);
        }
    }

    /**
     * Load JSON data from URL
     */
    async loadData() {
        try {
            const response = await fetch(this.options.jsonUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            this.data = await response.json();
            
            // Validate loaded data
            this.validateData();
            
            console.log(`Successfully loaded ${this.data.entities.length} DXCC entity data`);
        } catch (error) {
            throw new Error(`Failed to load data: ${error.message}`);
        }
    }
    
    /**
     * Validate DXCC data structure
     */
    validateData() {
        if (!this.data || typeof this.data !== 'object') {
            throw new Error('Invalid data structure');
        }
        
        if (!this.data.metadata) {
            throw new Error('Missing metadata in DXCC data');
        }
        
        if (!this.data.entities || !Array.isArray(this.data.entities)) {
            throw new Error('Missing or invalid entities array in DXCC data');
        }
        
        // Check for required metadata fields
        const requiredMetadata = ['title', 'edition', 'generatedAt', 'totalEntities'];
        const missingMetadata = requiredMetadata.filter(field => !this.data.metadata.hasOwnProperty(field));
        
        if (missingMetadata.length > 0) {
            console.warn(`Missing metadata fields: ${missingMetadata.join(', ')}`);
        }
        
        // Check entity structure (sample first entity)
        if (this.data.entities.length > 0) {
            const sampleEntity = this.data.entities[0];
            const requiredEntityFields = ['prefix', 'entityName', 'continent', 'zoneITU', 'zoneCQ', 'entityCode'];
            const missingEntityFields = requiredEntityFields.filter(field => !sampleEntity.hasOwnProperty(field));
            
            if (missingEntityFields.length > 0) {
                console.warn(`Sample entity missing fields: ${missingEntityFields.join(', ')}`);
            }
        }
    }

    /**
     * Format notes - 格式化为无序列表形式
     */
    formatNotes(notes) {
    if (!notes || notes.length === 0) return '';
    
    const noteTexts = notes.map(note => {
        // 如果是备注代码，从metadata中获取对应的文本
        if (this.data.metadata.notes && this.data.metadata.notes[note]) {
            return this.data.metadata.notes[note];
        }
        // 否则直接返回原始文本
        return note;
    });
    
    // 统一格式化为无序列表
    const listItems = noteTexts.map(text => `<li>${text}</li>`).join('');
    return `<ul>${listItems}</ul>`;
}

    /**
     * Render the complete widget
     */
    render() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="dxcc-widget">
                ${this.options.showHeader ? this.renderHeader() : ''}
                ${this.options.showFilters ? this.renderFilters() : ''}
                ${this.renderTable()}
            </div>
        `;
    }


    /**
     * Render header
     */
    renderHeader() {
        return `
        <div class="dxcc-header">
            <h2>${this.data.metadata.title}</h2>
            <p><strong>Edition:</strong> ${this.data.metadata.edition} | <strong>Generated:</strong> ${new Date(this.data.metadata.generatedAt).toLocaleString(this.options.language)}</p>
            
            <div class="dxcc-stats">
                <div class="dxcc-stat-item">
                    <div class="dxcc-stat-label">Total Entities</div>
                    <div class="dxcc-stat-value">${this.data.metadata.totalEntities}</div>
                </div>
                <div class="dxcc-stat-item">
                    <div class="dxcc-stat-label">Current Entities</div>
                    <div class="dxcc-stat-value">${this.data.metadata.statistics.currentEntities}</div>
                </div>
                <div class="dxcc-stat-item">
                    <div class="dxcc-stat-label">Deleted Entities</div>
                    <div class="dxcc-stat-value">${this.data.metadata.statistics.deletedEntities}</div>
                </div>
                <div class="dxcc-stat-item">
                    <div class="dxcc-stat-label">Honor Roll Threshold</div>
                    <div class="dxcc-stat-value">${this.data.metadata.honorRollThreshold}</div>
                </div>
            </div>
        </div>`;
    }

    /**
     * Render filters
     */
    renderFilters() {
        return `
        <div class="dxcc-filters">
            <div class="dxcc-filter-group">
                <label><input type="checkbox" id="dxcc-show-current" checked> Show Current Entities</label>
            </div>
            <div class="dxcc-filter-group">
                <label><input type="checkbox" id="dxcc-show-deleted" checked> Show Deleted Entities</label>
            </div>
            <div class="dxcc-filter-group">
                <label>Continent:</label>
                <select id="dxcc-continent-filter">
                    <option value="">All</option>
                    <option value="AF">Africa (AF)</option>
                    <option value="AN">Antarctica (AN)</option>
                    <option value="AS">Asia (AS)</option>
                    <option value="EU">Europe (EU)</option>
                    <option value="NA">North America (NA)</option>
                    <option value="OC">Oceania (OC)</option>
                    <option value="SA">South America (SA)</option>
                </select>
            </div>
            <div class="dxcc-filter-group">
                <label>Search:</label>
                <input type="text" id="dxcc-search-input" placeholder="Enter prefix or entity name">
            </div>
        </div>`;
    }

    /**
     * Format Zone - 将备注代码替换为具体数值（适用于 ITU Zone 和 CQ Zone）
     */
    formatZone(zone) {
        if (!zone) return '';
        
        let formattedZone = zone.toString();
        
        // 检查数据结构并获取zoneNotes
        const zoneNotes = this.data?.metadata?.zoneNotes;
        
        if (zoneNotes) {
            // 匹配括号中的字母，如 (A), (B), (C) 等
            formattedZone = formattedZone.replace(/\(([A-Z])\)/g, (match, letter) => {
                const replacement = zoneNotes[letter];
                return replacement ? replacement : match;
            });
        }
        
        return formattedZone;
    }

    /**
     * Render table
     */
    renderTable() {
        let html = `
        <div class="dxcc-table-container">
            <table class="dxcc-table" id="dxcc-table">
                <thead>
                    <tr>
                        <th data-sort="prefix">Prefix <span class="sort-indicator"></span></th>
                        <th data-sort="entityName">Entity Name <span class="sort-indicator"></span></th>
                        <th data-sort="continent">Continent <span class="sort-indicator"></span></th>
                        <th data-sort="zoneITU">ITU Zone <span class="sort-indicator"></span></th>
                        <th data-sort="zoneCQ">CQ Zone <span class="sort-indicator"></span></th>
                        <th data-sort="entityCode">Entity Code <span class="sort-indicator"></span></th>
                        <th data-sort="status">Status <span class="sort-indicator"></span></th>
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody>`;

        this.data.entities.forEach(entity => {
            const statusClass = entity.isCurrent ? 'current' : 'deleted';
            const statusText = entity.isCurrent ? 'Current' : 'Deleted';
            const notesText = this.formatNotes(entity.notes);
            const zoneItuText = this.formatZone(entity.zoneITU);
            const zoneCqText = this.formatZone(entity.zoneCQ);
            
            html += `
                <tr class="${statusClass}" data-continent="${entity.continent}" data-current="${entity.isCurrent}">
                    <td>${entity.prefix}</td>
                    <td>${entity.entityName || entity.entity}</td>
                    <td>${entity.continent}</td>
                    <td>${zoneItuText}</td>
                    <td>${zoneCqText}</td>
                    <td>${entity.entityCode}</td>
                    <td>${statusText}</td>
                    <td class="notes-cell">${notesText}</td>
                </tr>`;
        });

        html += `
                </tbody>
            </table>
        </div>`;

        return html;
    }

    /**
     * Render error message
     */
    renderError(message) {
        this.container.innerHTML = `
        <div class="dxcc-error">
            <h3>Loading Failed</h3>
            <p>${message}</p>
        </div>`;
    }

    /**
     * Bind events
     */
    bindEvents() {
        // Filter events
        if (this.options.showFilters) {
            const showCurrent = document.getElementById('dxcc-show-current');
            const showDeleted = document.getElementById('dxcc-show-deleted');
            const continentFilter = document.getElementById('dxcc-continent-filter');
            const searchInput = document.getElementById('dxcc-search-input');
            
            if (showCurrent) showCurrent.addEventListener('change', this.filterTable);
            if (showDeleted) showDeleted.addEventListener('change', this.filterTable);
            if (continentFilter) continentFilter.addEventListener('change', this.filterTable);
            if (searchInput) searchInput.addEventListener('input', this.filterTable);
        }
        
        // Sort events
        const table = document.getElementById('dxcc-table');
        if (table) {
            const headers = table.querySelectorAll('th[data-sort]');
            headers.forEach(header => {
                header.style.cursor = 'pointer';
                header.addEventListener('click', () => {
                    const column = header.dataset.sort;
                    this.sortTable(column);
                });
            });
        }
    }

    /**
     * Sort table by column
     */
    sortTable(column) {
        // Toggle sort direction if same column, otherwise default to ascending
        if (this.sortState.column === column) {
            this.sortState.direction = this.sortState.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortState.column = column;
            this.sortState.direction = 'asc';
        }
        
        // Sort the data
        this.data.entities.sort((a, b) => {
            let valueA, valueB;
            
            switch (column) {
                case 'prefix':
                    valueA = a.prefix || '';
                    valueB = b.prefix || '';
                    break;
                case 'entityName':
                    valueA = a.entityName || a.entity || '';
                    valueB = b.entityName || b.entity || '';
                    break;
                case 'continent':
                    valueA = a.continent || '';
                    valueB = b.continent || '';
                    break;
                case 'zoneITU':
                    valueA = parseInt(a.zoneITU || '0');
                    valueB = parseInt(b.zoneITU || '0');
                    break;
                case 'zoneCQ':
                    valueA = parseInt(a.zoneCQ || '0');
                    valueB = parseInt(b.zoneCQ || '0');
                    break;
                case 'entityCode':
                    valueA = parseInt(a.entityCode || '0');
                    valueB = parseInt(b.entityCode || '0');
                    break;
                case 'status':
                    valueA = a.isCurrent ? 1 : 0;
                    valueB = b.isCurrent ? 1 : 0;
                    break;
                default:
                    return 0;
            }
            
            let comparison = 0;
            if (typeof valueA === 'string' && typeof valueB === 'string') {
                comparison = valueA.localeCompare(valueB);
            } else {
                comparison = valueA - valueB;
            }
            
            return this.sortState.direction === 'asc' ? comparison : -comparison;
        });
        
        // Update sort indicators
        this.updateSortIndicators();
        
        // Re-render table
        const tableContainer = this.container.querySelector('.dxcc-table-container');
        if (tableContainer) {
            tableContainer.innerHTML = this.renderTable().match(/<table[\s\S]*<\/table>/)[0];
            // Re-bind sort events for the new table
            this.bindSortEvents();
            // Re-apply filters
            this.filterTable();
        }
    }
    
    /**
     * Bind sort events only
     */
    bindSortEvents() {
        const table = document.getElementById('dxcc-table');
        if (table) {
            const headers = table.querySelectorAll('th[data-sort]');
            headers.forEach(header => {
                header.style.cursor = 'pointer';
                header.addEventListener('click', () => {
                    const column = header.dataset.sort;
                    this.sortTable(column);
                });
            });
        }
    }
    
    /**
     * Update sort indicators
     */
    updateSortIndicators() {
        const table = document.getElementById('dxcc-table');
        if (!table) return;
        
        // Clear all indicators
        const indicators = table.querySelectorAll('.sort-indicator');
        indicators.forEach(indicator => {
            indicator.textContent = '';
        });
        
        // Set current sort indicator
        if (this.sortState.column) {
            const currentHeader = table.querySelector(`th[data-sort="${this.sortState.column}"] .sort-indicator`);
            if (currentHeader) {
                currentHeader.textContent = this.sortState.direction === 'asc' ? ' ↑' : ' ↓';
            }
        }
    }

    /**
     * Filter table
     */
    filterTable() {
        const showCurrent = document.getElementById('dxcc-show-current')?.checked ?? true;
        const showDeleted = document.getElementById('dxcc-show-deleted')?.checked ?? true;
        const continentFilter = document.getElementById('dxcc-continent-filter')?.value ?? '';
        const searchTerm = document.getElementById('dxcc-search-input')?.value.toLowerCase() ?? '';
        
        const table = document.getElementById('dxcc-table');
        if (!table) return;
        
        const rows = table.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            const isCurrent = row.dataset.current === 'true';
            const continent = row.dataset.continent;
            const prefix = row.cells[0].textContent.toLowerCase();
            const entityName = row.cells[1].textContent.toLowerCase();
            
            let show = true;
            
            // Status filter
            if (!showCurrent && isCurrent) show = false;
            if (!showDeleted && !isCurrent) show = false;
            
            // Continent filter
            if (continentFilter && continent !== continentFilter) show = false;
            
            // Search filter
            if (searchTerm && !prefix.includes(searchTerm) && !entityName.includes(searchTerm)) {
                show = false;
            }
            
            row.style.display = show ? '' : 'none';
        });
    }
}

// Export for manual initialization
window.createDXCCTable = function(containerId, options = {}) {
    const widget = new DXCCTableWidget({
        containerId: containerId,
        ...options
    });
    widget.init();
    return widget;
};

// Modified auto-initialization (only for backward compatibility)
document.addEventListener('DOMContentLoaded', function() {
    const defaultContainer = document.getElementById('dxcc-table-container');
    // Only auto-initialize if no file upload section exists (backward compatibility)
    if (defaultContainer && !defaultContainer.dataset.initialized && !document.getElementById('fileUploadSection')) {
        defaultContainer.dataset.initialized = 'true';
        window.createDXCCTable('dxcc-table-container');
    }
});