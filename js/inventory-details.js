(function () {
  'use strict';

  const InventoryDetails = {
    currentPage: 1,
    perPage: 25,
    searchQuery: '',
    categoryFilter: 'all',
    statusFilter: 'all',

    async render() {
      const mc = document.getElementById('main-content');
      const S = POS.Store;
      const H = POS.Helpers;

      mc.innerHTML = `
        <style>
          .inv-pagination-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background: #fff;
            border-top: 1px solid #edf2f7;
            font-size: 13px;
          }
        </style>

        <div class="page-header fade-in">
          <div>
            <h2 class="page-title">Inventory Details</h2>
            <p class="page-subtitle">Track real-time stock levels, view valuation metrics, filter low-stock alerts, and perform searches.</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-secondary btn-sm" id="btn-export-inventory" style="display:inline-flex; align-items:center; gap:6px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Export CSV
            </button>
          </div>
        </div>

        <!-- Inventory Stats -->
        <div class="stats-grid fade-in" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:20px; margin-bottom:20px;">
          <div class="stat-card blue" style="padding: 15px;">
            <div class="stat-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            </div>
            <div class="stat-info">
              <div class="stat-label">Total Unique Medicines</div>
              <div class="stat-value" id="inv-total-items">0</div>
            </div>
          </div>
          <div class="stat-card green" style="padding: 15px;">
            <div class="stat-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </div>
            <div class="stat-info">
              <div class="stat-label">Total Stock Valuation</div>
              <div class="stat-value" id="inv-total-valuation">৳0.00</div>
            </div>
          </div>
          <div class="stat-card orange" style="padding: 15px;">
            <div class="stat-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </div>
            <div class="stat-info">
              <div class="stat-label">Low Stock Alerts</div>
              <div class="stat-value" id="inv-low-alerts">0</div>
            </div>
          </div>
          <div class="stat-card red" style="padding: 15px;">
            <div class="stat-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
            </div>
            <div class="stat-info">
              <div class="stat-label">Out of Stock Items</div>
              <div class="stat-value" id="inv-out-alerts">0</div>
            </div>
          </div>
        </div>

        <!-- Filters Bar -->
        <div class="filter-bar fade-in" style="display:flex; flex-wrap:wrap; gap:16px; align-items:center;">
          <div class="search-box" style="flex:2; min-width:240px;">
            <input type="text" id="inv-search" placeholder="Search by medicine name, SKU or barcode..." value="${H.esc(this.searchQuery)}">
          </div>
          <div class="form-group" style="margin-bottom:0; flex:1; min-width:140px;">
            <label class="form-label">Generic Name</label>
            <select class="form-select" id="inv-category-filter">
              <option value="all">All Generics</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom:0; flex:1; min-width:140px;">
            <label class="form-label">Stock Status</label>
            <select class="form-select" id="inv-status-filter">
              <option value="all">All Statuses</option>
              <option value="low">Low Stock Alert</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom:0; width:110px;">
            <label class="form-label">Per Page</label>
            <select class="form-select" id="inv-per-page">
              <option value="10" ${this.perPage === 10 ? 'selected' : ''}>10</option>
              <option value="25" ${this.perPage === 25 ? 'selected' : ''}>25</option>
              <option value="50" ${this.perPage === 50 ? 'selected' : ''}>50</option>
              <option value="100" ${this.perPage === 100 ? 'selected' : ''}>100</option>
              <option value="all" ${this.perPage === 999999 ? 'selected' : ''}>All</option>
            </select>
          </div>
        </div>

        <!-- Inventory List Card -->
        <div class="card fade-in" style="margin-top:20px;">
          <div class="card-body" style="padding:0;">
            <div class="table-wrapper">
              <table class="data-table">
                <thead>
                  <tr style="background:#f8fafc; border-bottom:1px solid #edf2f7;">
                    <th style="padding:12px 16px; text-align:left;">Medicine Name</th>
                    <th style="padding:12px 16px; text-align:left;">Generic</th>
                    <th style="padding:12px 16px; text-align:left;">SKU Code</th>
                    <th style="padding:12px 16px; text-align:left;">Barcode</th>
                    <th style="padding:12px 16px; text-align:right;">Cost Price</th>
                    <th style="padding:12px 16px; text-align:right;">Selling Price</th>
                    <th style="padding:12px 16px; text-align:center;">Current Stock (Pcs)</th>
                    <th style="padding:12px 16px; text-align:center;">Alert Qty</th>
                    <th style="padding:12px 16px; text-align:right;">Stock Valuation</th>
                  </tr>
                </thead>
                <tbody id="inventory-tbody">
                  <tr>
                    <td colspan="9" style="padding:30px; text-align:center; color:#64748b; font-style:italic;">
                      Loading inventory records...
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination Bar -->
            <div class="inv-pagination-bar" id="inv-pagination"></div>
          </div>
        </div>
      `;

      // Load Generics filter list
      const products = await S.getAll('products');
      const generics = Array.from(new Set(products.map(p => p.generic).filter(g => g && g.trim() !== ''))).sort();
      const genSelect = document.getElementById('inv-category-filter');
      generics.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g;
        opt.textContent = g;
        if (this.categoryFilter === g) opt.selected = true;
        genSelect.appendChild(opt);
      });

      // Bind Filter Handlers
      document.getElementById('inv-search').oninput = H.debounce(async (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.currentPage = 1;
        await this.updateList();
      }, 200);

      document.getElementById('inv-category-filter').onchange = async (e) => {
        this.categoryFilter = e.target.value;
        this.currentPage = 1;
        await this.updateList();
      };

      document.getElementById('inv-status-filter').onchange = async (e) => {
        this.statusFilter = e.target.value;
        this.currentPage = 1;
        await this.updateList();
      };

      document.getElementById('inv-per-page').onchange = async (e) => {
        const val = e.target.value;
        this.perPage = val === 'all' ? 999999 : parseInt(val);
        this.currentPage = 1;
        await this.updateList();
      };

      document.getElementById('btn-export-inventory').onclick = async () => {
        const list = await this.getFilteredInventory();
        const csvData = list.map(item => ({
          'Medicine Name': item.fullName,
          'Generic': item.generic || '—',
          'SKU': item.sku || 'N/A',
          'Barcode': item.barcode || 'N/A',
          'Cost Price': item.costPrice,
          'Selling Price': item.sellingPrice,
          'Current Stock (Pcs)': item.stock,
          'Alert Qty': item.alertQty || 0,
          'Valuation (Cost)': item.stock * item.costPrice,
          'Valuation (Selling)': item.stock * item.sellingPrice
        }));
        H.exportCSV(csvData, 'inventory_details');
      };

      // Load items
      await this.updateList();
    },

    async getFilteredInventory() {
      const S = POS.Store;
      const products = await S.getAll('products');

      // Only main products (pieces inventory), not unit variations
      const inventoryList = [];

      products.forEach(p => {
        if (p.deletedAt && p.deletedAt !== '0000-00-00 00:00:00') return;
        inventoryList.push({
          id: p.id,
          name: p.name,
          fullName: p.name,
          generic: p.generic || '',
          brand: p.brand || '',
          sku: p.sku,
          barcode: p.barcode,
          costPrice: parseFloat(p.costPrice) || 0,
          sellingPrice: parseFloat(p.sellingPrice) || 0,
          stock: parseInt(p.stock) || 0,
          alertQty: parseInt(p.alertQty) || 0
        });
      });

      return inventoryList.filter(item => {
        // Search filter
        if (this.searchQuery) {
          const s = this.searchQuery;
          const nameMatch = item.fullName.toLowerCase().includes(s);
          const genMatch = item.generic.toLowerCase().includes(s);
          const brandMatch = item.brand.toLowerCase().includes(s);
          const skuMatch = item.sku ? item.sku.toLowerCase().includes(s) : false;
          const barcodeMatch = item.barcode ? item.barcode.toLowerCase().includes(s) : false;
          if (!nameMatch && !genMatch && !brandMatch && !skuMatch && !barcodeMatch) return false;
        }

        // Generic filter
        if (this.categoryFilter !== 'all' && item.generic !== this.categoryFilter) return false;

        // Status filter
        if (this.statusFilter === 'low' && item.stock > item.alertQty) return false;
        if (this.statusFilter === 'out' && item.stock > 0) return false;

        return true;
      });
    },

    async updateList() {
      const H = POS.Helpers;
      const list = await this.getFilteredInventory();

      const totalValuation = list.reduce((sum, item) => sum + (item.stock * item.sellingPrice), 0);
      const lowStockCount = list.filter(item => item.stock <= item.alertQty && item.stock > 0).length;
      const outOfStockCount = list.filter(item => item.stock === 0).length;

      const totalItemsEl = document.getElementById('inv-total-items');
      const valEl = document.getElementById('inv-total-valuation');
      const lowEl = document.getElementById('inv-low-alerts');
      const outEl = document.getElementById('inv-out-alerts');

      if (totalItemsEl) totalItemsEl.textContent = list.length;
      if (valEl) valEl.textContent = H.formatCurrency(totalValuation);
      if (lowEl) lowEl.textContent = lowStockCount;
      if (outEl) outEl.textContent = outOfStockCount;

      const totalItems = list.length;
      const totalPages = Math.ceil(totalItems / this.perPage) || 1;

      if (this.currentPage > totalPages) this.currentPage = totalPages;
      if (this.currentPage < 1) this.currentPage = 1;

      const startIndex = (this.currentPage - 1) * this.perPage;
      const pageItems = list.slice(startIndex, startIndex + this.perPage);

      const tbody = document.getElementById('inventory-tbody');
      if (!tbody) return;
      tbody.innerHTML = '';

      if (pageItems.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="9" style="padding:40px; text-align:center; color:#94a3b8; font-style:italic;">
              No matching inventory items found.
            </td>
          </tr>
        `;
        const pagEl = document.getElementById('inv-pagination');
        if (pagEl) pagEl.innerHTML = '';
        return;
      }

      pageItems.forEach(item => {
        let stockBadge = `<span style="color:#16a34a; font-weight:700;">${item.stock} pcs</span>`;
        let rowStyle = '';
        if (item.stock === 0) {
          stockBadge = `<span style="color:#ef4444; font-weight:700; background:#fef2f2; padding:3px 8px; border-radius:4px; border:1px solid #fecaca;">0 pcs (Out of Stock)</span>`;
          rowStyle = 'background:#fffbfb;';
        } else if (item.stock <= item.alertQty) {
          stockBadge = `<span style="color:#ea580c; font-weight:700; background:#fff7ed; padding:3px 8px; border-radius:4px; border:1px solid #fed7aa;">${item.stock} pcs (Low Stock)</span>`;
        }

        tbody.innerHTML += `
          <tr style="border-bottom:1px solid #edf2f7; ${rowStyle}">
            <td style="padding:12px 16px; font-weight:600; color:#1e293b;">${H.esc(item.fullName)}</td>
            <td style="padding:12px 16px; color:#475569; font-weight:500;">${H.esc(item.generic || '—')}</td>
            <td style="padding:12px 16px; font-family:monospace; color:#475569;">${H.esc(item.sku || 'N/A')}</td>
            <td style="padding:12px 16px; font-family:monospace; color:#475569;">${H.esc(item.barcode || 'N/A')}</td>
            <td style="padding:12px 16px; text-align:right; color:#64748b;">${H.formatCurrency(item.costPrice)}</td>
            <td style="padding:12px 16px; text-align:right; color:#1e293b; font-weight:500;">${H.formatCurrency(item.sellingPrice)}</td>
            <td style="padding:12px 16px; text-align:center;">${stockBadge}</td>
            <td style="padding:12px 16px; text-align:center; color:#94a3b8;">${item.alertQty} pcs</td>
            <td style="padding:12px 16px; text-align:right; font-weight:600; color:#0f172a;">${H.formatCurrency(item.stock * item.sellingPrice)}</td>
          </tr>
        `;
      });

      // Render pagination
      const pagEl = document.getElementById('inv-pagination');
      if (pagEl) {
        if (this.perPage >= 999999 || totalItems <= this.perPage) {
          pagEl.innerHTML = `<div style="font-size:12px; color:#64748b;">Showing all ${totalItems} items</div>`;
        } else {
          pagEl.innerHTML = `
            <div style="font-size:12px; color:#64748b; font-weight:600;">
              Showing ${startIndex + 1} - ${Math.min(startIndex + this.perPage, totalItems)} of ${totalItems} medicines
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
              <button class="btn btn-secondary btn-sm" id="btn-inv-prev" ${this.currentPage <= 1 ? 'disabled' : ''} style="padding:4px 10px;">&larr; Prev</button>
              <span style="font-size:13px; font-weight:700; color:#475569; margin:0 8px;">Page ${this.currentPage} of ${totalPages}</span>
              <button class="btn btn-secondary btn-sm" id="btn-inv-next" ${this.currentPage >= totalPages ? 'disabled' : ''} style="padding:4px 10px;">Next &rarr;</button>
            </div>
          `;

          const btnPrev = document.getElementById('btn-inv-prev');
          if (btnPrev && this.currentPage > 1) {
            btnPrev.onclick = async () => {
              this.currentPage--;
              await this.updateList();
            };
          }

          const btnNext = document.getElementById('btn-inv-next');
          if (btnNext && this.currentPage < totalPages) {
            btnNext.onclick = async () => {
              this.currentPage++;
              await this.updateList();
            };
          }
        }
      }
    }
  };

  window.POS = window.POS || {};
  window.POS.InventoryDetails = InventoryDetails;
})();
