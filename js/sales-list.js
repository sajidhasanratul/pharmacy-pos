(function () {
  'use strict';

  const SalesList = {
    filters: {
      search: '',
      dateFrom: '',
      dateTo: '',
      minTotal: null,
      maxTotal: null,
      paymentMethod: 'all'
    },

    async render() {
      const mc = document.getElementById('main-content');
      const H = POS.Helpers;

      mc.innerHTML = `
        <style>
          .btn-col-filter {
            background: none;
            border: none;
            padding: 3px;
            border-radius: 4px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: background 0.15s, color 0.15s;
          }
          .btn-col-filter:hover {
            background: #e2e8f0;
          }
          .filter-dropdown {
            position: absolute;
            top: calc(100% + 4px);
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.12), 0 8px 10px -6px rgba(0,0,0,0.08);
            padding: 12px;
            z-index: 1000;
            text-transform: none;
            font-weight: normal;
            font-size: 12px;
            color: #1e293b;
          }
          .filter-dropdown label {
            display: block;
            font-size: 11px;
            font-weight: 600;
            color: #64748b;
            margin-bottom: 3px;
          }
          .filter-dropdown input, .filter-dropdown select {
            width: 100%;
            height: 30px;
            padding: 4px 8px;
            font-size: 12px;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            outline: none;
            box-sizing: border-box;
          }
          .filter-dropdown input:focus, .filter-dropdown select:focus {
            border-color: #0d9488;
          }
          #sales-clear-filter-bar {
            display: none;
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 999;
            background: #0f172a;
            color: #fff;
            padding: 8px 16px;
            border-radius: 30px;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
            align-items: center;
            gap: 12px;
            font-size: 13px;
            font-weight: 600;
          }
        </style>

        <div class="page-header fade-in">
          <div>
            <h2 class="page-title">Sales List</h2>
            <p class="page-subtitle">View, filter, inspect and export all completed customer sales orders.</p>
          </div>
          <div class="page-actions" style="display:flex; gap:8px; align-items:center;">
            <a href="/new-order" class="btn btn-primary btn-sm" style="display:inline-flex; align-items:center; gap:6px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              New Order
            </a>
            <button class="btn btn-secondary btn-sm" id="btn-export-csv" style="display:inline-flex; align-items:center; gap:6px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Export CSV
            </button>
          </div>
        </div>

        <div class="filter-bar fade-in" style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
          <div class="search-box" style="flex:1; max-width:480px;">
            <input type="text" id="sales-search" placeholder="Search by Invoice ID, customer name or phone..." value="${H.esc(this.filters.search)}">
          </div>
        </div>

        <div class="stats-grid fade-in" style="grid-template-columns: 1fr 1fr; margin-bottom: 20px;">
          <div class="stat-card green" style="padding: 15px;">
            <div class="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </div>
            <div class="stat-info">
              <div class="stat-label">Filtered Sales Total</div>
              <div class="stat-value" id="stats-total-amount">৳0.00</div>
            </div>
          </div>
          <div class="stat-card blue" style="padding: 15px;">
            <div class="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            </div>
            <div class="stat-info">
              <div class="stat-label">Today's Sales</div>
              <div class="stat-value" id="stats-today-amount">৳0.00</div>
            </div>
          </div>
        </div>

        <div class="card fade-in">
          <div class="card-body" style="padding:0;">
            <div class="table-wrapper" style="overflow-x:visible;">
              <table class="data-table" style="position:relative;">
                <thead>
                  <tr>
                    <th style="width:110px;">Invoice ID</th>
                    <th>Customer</th>
                    <th style="position:relative; min-width:140px;">
                      <div style="display:flex; align-items:center; gap:6px;">
                        <span>Sales Date</span>
                        <button class="btn-col-filter" id="btn-toggle-filter-date" title="Filter by date">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                        </button>
                      </div>
                      <div class="filter-dropdown" id="dropdown-filter-date" style="display:none; left:0; width:220px;">
                        <div style="font-weight:700; margin-bottom:8px;">Filter by Date Range</div>
                        <div style="margin-bottom:6px;">
                          <label>From Date:</label>
                          <input type="date" id="input-filter-date-from" value="${this.filters.dateFrom}">
                        </div>
                        <div style="margin-bottom:10px;">
                          <label>To Date:</label>
                          <input type="date" id="input-filter-date-to" value="${this.filters.dateTo}">
                        </div>
                        <div style="display:flex; gap:6px;">
                          <button type="button" class="btn btn-secondary btn-sm" id="btn-reset-date-filter" style="flex:1;">Reset</button>
                          <button type="button" class="btn btn-primary btn-sm" id="btn-apply-date-filter" style="flex:1;">Apply</button>
                        </div>
                      </div>
                    </th>
                    <th class="text-right">Subtotal</th>
                    <th class="text-right">Discount</th>
                    <th class="text-right">Tax</th>
                    <th class="text-right" style="position:relative; min-width:130px;">
                      <div style="display:flex; align-items:center; justify-content:flex-end; gap:6px;">
                        <span>Grand Total</span>
                        <button class="btn-col-filter" id="btn-toggle-filter-total" title="Filter by total amount">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                        </button>
                      </div>
                      <div class="filter-dropdown" id="dropdown-filter-total" style="display:none; right:0; width:200px; text-align:left;">
                        <div style="font-weight:700; margin-bottom:8px;">Filter by Amount (৳)</div>
                        <div style="margin-bottom:6px;">
                          <label>Min (৳):</label>
                          <input type="number" id="input-filter-min-total" placeholder="Min" value="${this.filters.minTotal !== null ? this.filters.minTotal : ''}">
                        </div>
                        <div style="margin-bottom:10px;">
                          <label>Max (৳):</label>
                          <input type="number" id="input-filter-max-total" placeholder="Max" value="${this.filters.maxTotal !== null ? this.filters.maxTotal : ''}">
                        </div>
                        <div style="display:flex; gap:6px;">
                          <button type="button" class="btn btn-secondary btn-sm" id="btn-reset-total-filter" style="flex:1;">Reset</button>
                          <button type="button" class="btn btn-primary btn-sm" id="btn-apply-total-filter" style="flex:1;">Apply</button>
                        </div>
                      </div>
                    </th>
                    <th style="position:relative; min-width:160px;">
                      <div style="display:flex; align-items:center; gap:6px;">
                        <span>Payment Method</span>
                        <button class="btn-col-filter" id="btn-toggle-filter-payment" title="Filter by payment channel">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                        </button>
                      </div>
                      <div class="filter-dropdown" id="dropdown-filter-payment" style="display:none; left:0; width:190px;">
                        <div style="font-weight:700; margin-bottom:8px;">Payment Channel</div>
                        <div style="margin-bottom:10px;">
                          <select id="select-filter-payment">
                            <option value="all" ${this.filters.paymentMethod === 'all' ? 'selected' : ''}>All Methods</option>
                            <option value="Cash" ${this.filters.paymentMethod === 'Cash' ? 'selected' : ''}>Cash</option>
                            <option value="Card" ${this.filters.paymentMethod === 'Card' ? 'selected' : ''}>Card</option>
                            <option value="bKash" ${this.filters.paymentMethod === 'bKash' ? 'selected' : ''}>bKash</option>
                            <option value="Nagad" ${this.filters.paymentMethod === 'Nagad' ? 'selected' : ''}>Nagad</option>
                            <option value="Rocket" ${this.filters.paymentMethod === 'Rocket' ? 'selected' : ''}>Rocket</option>
                            <option value="Bank Transfer" ${this.filters.paymentMethod === 'Bank Transfer' ? 'selected' : ''}>Bank Transfer</option>
                            <option value="Other" ${this.filters.paymentMethod === 'Other' ? 'selected' : ''}>Other</option>
                          </select>
                        </div>
                        <div style="display:flex; gap:6px;">
                          <button type="button" class="btn btn-secondary btn-sm" id="btn-reset-payment-filter" style="flex:1;">Reset</button>
                          <button type="button" class="btn btn-primary btn-sm" id="btn-apply-payment-filter" style="flex:1;">Apply</button>
                        </div>
                      </div>
                    </th>
                    <th class="text-center" style="width:120px;">Actions</th>
                  </tr>
                </thead>
                <tbody id="sales-tbody"></tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Floating Clear Filter Popup Pill -->
        <div id="sales-clear-filter-bar">
          <span id="sales-filter-badge-text">Filtered (1)</span>
          <button id="btn-clear-all-sales-filters" type="button" style="background:#ef4444; color:#fff; border:none; padding:4px 10px; border-radius:15px; font-size:11px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:4px;">
            Clear Filters &times;
          </button>
        </div>

        <div class="modal-overlay" id="sales-modal-overlay"></div>
      `;

      // Wire search box
      document.getElementById('sales-search').oninput = H.debounce(async (e) => {
        this.filters.search = e.target.value.toLowerCase().trim();
        await this.updateList();
      }, 200);

      // Wire export CSV
      document.getElementById('btn-export-csv').onclick = async () => {
        const { list, paymentsByOrder } = await this.getFilteredOrders();
        const csvData = list.map(o => {
          const pmts = (paymentsByOrder[o.id] || []).map(p => {
            const l4 = p.lastFour || p.lastfour ? ` (${p.lastFour || p.lastfour})` : '';
            return `${p.method}${l4}`;
          }).join(', ') || o.paymentMethod || '—';

          return {
            'Invoice ID': o.invoiceId,
            'Customer Name': o.customerName,
            'Customer Phone': o.customerPhone,
            'Date': H.formatDateTime(o.date),
            'Subtotal': o.subtotal,
            'Discount Amount': o.discountAmount,
            'Tax Amount': o.taxAmount,
            'Grand Total': o.grandTotal,
            'Payment Method': pmts,
            'Paid': o.paidAmount,
            'Due': o.dueAmount,
            'Returned': o.returnedAmount
          };
        });
        H.exportCSV(csvData, 'sales_list');
      };

      // Filter toggles
      const closeAllDropdowns = () => {
        document.querySelectorAll('.filter-dropdown').forEach(d => d.style.display = 'none');
      };

      const setupToggle = (btnId, dropdownId) => {
        const btn = document.getElementById(btnId);
        const dd = document.getElementById(dropdownId);
        if (!btn || !dd) return;
        btn.onclick = (e) => {
          e.stopPropagation();
          const isOpen = dd.style.display === 'block';
          closeAllDropdowns();
          if (!isOpen) dd.style.display = 'block';
        };
        dd.onclick = (e) => e.stopPropagation();
      };

      setupToggle('btn-toggle-filter-date', 'dropdown-filter-date');
      setupToggle('btn-toggle-filter-total', 'dropdown-filter-total');
      setupToggle('btn-toggle-filter-payment', 'dropdown-filter-payment');

      document.addEventListener('click', () => closeAllDropdowns());

      // Date Filter Actions
      document.getElementById('btn-apply-date-filter').onclick = async () => {
        this.filters.dateFrom = document.getElementById('input-filter-date-from').value;
        this.filters.dateTo = document.getElementById('input-filter-date-to').value;
        closeAllDropdowns();
        await this.updateList();
      };
      document.getElementById('btn-reset-date-filter').onclick = async () => {
        this.filters.dateFrom = '';
        this.filters.dateTo = '';
        document.getElementById('input-filter-date-from').value = '';
        document.getElementById('input-filter-date-to').value = '';
        closeAllDropdowns();
        await this.updateList();
      };

      // Total Filter Actions
      document.getElementById('btn-apply-total-filter').onclick = async () => {
        const minVal = document.getElementById('input-filter-min-total').value;
        const maxVal = document.getElementById('input-filter-max-total').value;
        this.filters.minTotal = minVal !== '' ? parseFloat(minVal) : null;
        this.filters.maxTotal = maxVal !== '' ? parseFloat(maxVal) : null;
        closeAllDropdowns();
        await this.updateList();
      };
      document.getElementById('btn-reset-total-filter').onclick = async () => {
        this.filters.minTotal = null;
        this.filters.maxTotal = null;
        document.getElementById('input-filter-min-total').value = '';
        document.getElementById('input-filter-max-total').value = '';
        closeAllDropdowns();
        await this.updateList();
      };

      // Payment Filter Actions
      document.getElementById('btn-apply-payment-filter').onclick = async () => {
        this.filters.paymentMethod = document.getElementById('select-filter-payment').value;
        closeAllDropdowns();
        await this.updateList();
      };
      document.getElementById('btn-reset-payment-filter').onclick = async () => {
        this.filters.paymentMethod = 'all';
        document.getElementById('select-filter-payment').value = 'all';
        closeAllDropdowns();
        await this.updateList();
      };

      // Clear all filters floating button
      document.getElementById('btn-clear-all-sales-filters').onclick = async () => {
        this.filters.dateFrom = '';
        this.filters.dateTo = '';
        this.filters.minTotal = null;
        this.filters.maxTotal = null;
        this.filters.paymentMethod = 'all';

        const dFrom = document.getElementById('input-filter-date-from');
        const dTo = document.getElementById('input-filter-date-to');
        const tMin = document.getElementById('input-filter-min-total');
        const tMax = document.getElementById('input-filter-max-total');
        const pSel = document.getElementById('select-filter-payment');

        if (dFrom) dFrom.value = '';
        if (dTo) dTo.value = '';
        if (tMin) tMin.value = '';
        if (tMax) tMax.value = '';
        if (pSel) pSel.value = 'all';

        closeAllDropdowns();
        await this.updateList();
      };

      // Initial load
      await this.updateList();
    },

    getActiveFilterCount() {
      let count = 0;
      if (this.filters.dateFrom || this.filters.dateTo) count++;
      if (this.filters.minTotal !== null || this.filters.maxTotal !== null) count++;
      if (this.filters.paymentMethod && this.filters.paymentMethod !== 'all') count++;
      return count;
    },

    updateFilterStyles() {
      const btnDate = document.getElementById('btn-toggle-filter-date');
      const btnTotal = document.getElementById('btn-toggle-filter-total');
      const btnPayment = document.getElementById('btn-toggle-filter-payment');
      const clearBar = document.getElementById('sales-clear-filter-bar');
      const badgeText = document.getElementById('sales-filter-badge-text');

      const dateActive = !!(this.filters.dateFrom || this.filters.dateTo);
      const totalActive = this.filters.minTotal !== null || this.filters.maxTotal !== null;
      const paymentActive = this.filters.paymentMethod && this.filters.paymentMethod !== 'all';

      if (btnDate) btnDate.style.color = dateActive ? '#0d9488' : '#94a3b8';
      if (btnTotal) btnTotal.style.color = totalActive ? '#0d9488' : '#94a3b8';
      if (btnPayment) btnPayment.style.color = paymentActive ? '#0d9488' : '#94a3b8';

      const count = this.getActiveFilterCount();
      if (clearBar) {
        if (count > 0) {
          clearBar.style.display = 'flex';
          if (badgeText) badgeText.textContent = `Filtered (${count} active)`;
        } else {
          clearBar.style.display = 'none';
        }
      }
    },

    async getFilteredOrders() {
      const S = POS.Store;
      const H = POS.Helpers;

      const allOrders = await S.getAll('orders');
      const allPayments = await S.getAll('payments');

      const paymentsByOrder = {};
      allPayments.forEach(p => {
        if (!paymentsByOrder[p.orderId]) paymentsByOrder[p.orderId] = [];
        paymentsByOrder[p.orderId].push(p);
      });

      const filtered = allOrders.filter(o => {
        // Search filter
        if (this.filters.search) {
          const s = this.filters.search;
          const invMatch = (o.invoiceId || '').toLowerCase().includes(s);
          const custNameMatch = (o.customerName || '').toLowerCase().includes(s);
          const custPhoneMatch = (o.customerPhone || '').includes(s);
          if (!invMatch && !custNameMatch && !custPhoneMatch) return false;
        }

        // Date filter
        if (this.filters.dateFrom || this.filters.dateTo) {
          if (!H.isDateInRange(o.date, this.filters.dateFrom, this.filters.dateTo)) return false;
        }

        // Grand total range filter
        const gTotal = parseFloat(o.grandTotal) || 0;
        if (this.filters.minTotal !== null && gTotal < this.filters.minTotal) return false;
        if (this.filters.maxTotal !== null && gTotal > this.filters.maxTotal) return false;

        // Payment method filter
        if (this.filters.paymentMethod && this.filters.paymentMethod !== 'all') {
          const filterMethod = this.filters.paymentMethod.toLowerCase();
          const pList = paymentsByOrder[o.id] || [];
          const matchesPmt = pList.some(p => (p.method || '').toLowerCase() === filterMethod);
          const matchesOrderMethod = (o.paymentMethod || '').toLowerCase() === filterMethod;
          if (!matchesPmt && !matchesOrderMethod) return false;
        }

        return true;
      });

      return { list: filtered, paymentsByOrder };
    },

    async updateList() {
      const S = POS.Store;
      const H = POS.Helpers;

      this.updateFilterStyles();

      const { list, paymentsByOrder } = await this.getFilteredOrders();
      const today = H.today();
      const todaySales = await S.query('orders', o => H.isDateInRange(o.date, today, today));

      const totalToday = todaySales.reduce((s, o) => s + (parseFloat(o.grandTotal) || 0), 0);
      const totalFiltered = list.reduce((s, o) => s + (parseFloat(o.grandTotal) || 0), 0);

      const totalEl = document.getElementById('stats-total-amount');
      const todayEl = document.getElementById('stats-today-amount');
      if (totalEl) totalEl.textContent = H.formatCurrency(totalFiltered);
      if (todayEl) todayEl.textContent = H.formatCurrency(totalToday);

      const tbody = document.getElementById('sales-tbody');
      if (!tbody) return;
      tbody.innerHTML = '';

      if (list.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="9" class="text-center text-muted" style="padding:32px;">
              <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <span>No sales orders found matching current filters.</span>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      let groupSub = 0, groupDisc = 0, groupTax = 0, groupTotal = 0;
      const currentUser = S.getCurrentUser();
      const isAdmin = currentUser && currentUser.role === 'admin';

      list.forEach(o => {
        groupSub += parseFloat(o.subtotal) || 0;
        groupDisc += parseFloat(o.discountAmount) || 0;
        groupTax += parseFloat(o.taxAmount) || 0;
        groupTotal += parseFloat(o.grandTotal) || 0;

        // Payment Method column
        const pList = paymentsByOrder[o.id] || [];
        let pmtHtml = '';
        if (pList.length > 0) {
          pmtHtml = pList.map(p => {
            const l4 = p.lastFour || p.lastfour ? ` (${p.lastFour || p.lastfour})` : '';
            const icon = H.getPaymentMethodIcon(p.method, 14);
            return `
              <div style="display:flex; align-items:center; gap:5px; font-size:12px; margin-bottom:2px;">
                ${icon}
                <span style="font-weight:600; color:#334155;">${H.esc(p.method)}</span>
                <span style="color:#64748b; font-size:11px;">${H.esc(l4)}</span>
              </div>
            `;
          }).join('');
        } else if (o.paymentMethod) {
          const icon = H.getPaymentMethodIcon(o.paymentMethod, 14);
          pmtHtml = `
            <div style="display:flex; align-items:center; gap:5px; font-size:12px;">
              ${icon}
              <span style="font-weight:600; color:#334155;">${H.esc(o.paymentMethod)}</span>
            </div>
          `;
        } else {
          pmtHtml = `<span class="text-muted" style="font-size:12px;">—</span>`;
        }

        tbody.innerHTML += `
          <tr class="sales-row" data-id="${o.id}">
            <td style="font-weight:700; color:#0f172a;">${o.invoiceId}</td>
            <td>
              <div style="font-weight:600; color:#1e293b;">${H.esc(o.customerName)}</div>
              <div class="text-muted text-sm">${H.esc(o.customerPhone)}</div>
            </td>
            <td style="font-size:12px; color:#475569;">${H.formatDateTime(o.date)}</td>
            <td class="text-right">${H.formatCurrency(o.subtotal)}</td>
            <td class="text-right text-danger">${o.discountAmount > 0 ? '-' : ''}${H.formatCurrency(o.discountAmount)}</td>
            <td class="text-right">${H.formatCurrency(o.taxAmount)}</td>
            <td class="text-right" style="font-weight:700; color:var(--primary);">${H.formatCurrency(o.grandTotal)}</td>
            <td>${pmtHtml}</td>
            <td class="text-center">
              <div style="display:flex; justify-content:center; gap:4px;">
                <button class="btn btn-secondary btn-sm btn-view-invoice" title="View Details" style="padding:4px 6px;">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>
                <button class="btn btn-secondary btn-sm btn-print-invoice" title="Print Receipt" style="padding:4px 6px;">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                </button>
                <button class="btn btn-secondary btn-sm btn-return-invoice" title="Return Items" style="padding:4px 6px; color:var(--warning);">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
                </button>
                ${isAdmin ? `
                  <button class="btn btn-secondary btn-sm btn-delete-invoice" title="Delete Order" style="padding:4px 6px; color:var(--danger);">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                ` : ''}
              </div>
            </td>
          </tr>
        `;
      });

      // Group totals row
      tbody.innerHTML += `
        <tr class="total-row" style="background:#f8fafc; font-weight:700;">
          <td colspan="3" style="font-weight:800; color:#1e293b;">Group Total (${list.length} orders)</td>
          <td class="text-right">${H.formatCurrency(groupSub)}</td>
          <td class="text-right text-danger">-${H.formatCurrency(groupDisc)}</td>
          <td class="text-right">${H.formatCurrency(groupTax)}</td>
          <td class="text-right" style="color:var(--primary); font-weight:800;">${H.formatCurrency(groupTotal)}</td>
          <td colspan="2"></td>
        </tr>
      `;

      // Button handlers
      tbody.querySelectorAll('.sales-row').forEach(row => {
        const id = row.dataset.id;
        const order = list.find(o => o.id === id);
        if (!order) return;

        const viewBtn = row.querySelector('.btn-view-invoice');
        if (viewBtn) viewBtn.onclick = () => this.showDetailsModal(order);

        const printBtn = row.querySelector('.btn-print-invoice');
        if (printBtn) printBtn.onclick = () => this.printReceipt(order);

        const returnBtn = row.querySelector('.btn-return-invoice');
        if (returnBtn) {
          returnBtn.onclick = () => {
            localStorage.setItem('return_search_invoice', order.invoiceId);
            POS.Router.navigate('/sales-return');
          };
        }

        if (isAdmin) {
          const deleteBtn = row.querySelector('.btn-delete-invoice');
          if (deleteBtn) {
            deleteBtn.onclick = async () => {
              if (await H.confirm(`WARNING: Deleting this order will RESTORE stock inventory levels and permanently remove this transaction.\n\nAre you sure you want to delete order ${order.invoiceId}?`)) {
                deleteBtn.disabled = true;
                const success = await S.delete('orders', order.id);
                if (success) {
                  H.showToast(`Order ${order.invoiceId} deleted successfully.`);
                  await this.updateList();
                } else {
                  H.showToast('Failed to delete order', 'error');
                  deleteBtn.disabled = false;
                }
              }
            };
          }
        }
      });
    },

    async showDetailsModal(order) {
      const S = POS.Store;
      const H = POS.Helpers;
      const user = S.getCurrentUser();
      const overlay = document.getElementById('sales-modal-overlay');

      const items = await S.query('orderItems', i => i.orderId === order.id);
      const payments = await S.query('payments', p => p.orderId === order.id);

      let itemsHtml = '';
      items.forEach(i => {
        itemsHtml += `
          <tr>
            <td>
              <div style="font-weight:600;">${H.esc(i.productName)}</div>
              ${i.variationName ? `<div class="text-muted text-sm">${H.esc(i.variationName)}</div>` : ''}
            </td>
            <td class="text-center">${i.qty}</td>
            <td class="text-right">${H.formatCurrency(i.unitPrice)}</td>
            <td class="text-right" style="font-weight:600;">${H.formatCurrency(i.total)}</td>
          </tr>
        `;
      });

      let paymentsHtml = '';
      payments.forEach(p => {
        const suffix = (p.lastFour || p.lastfour) ? ` (xxxx-${p.lastFour || p.lastfour})` : '';
        const icon = H.getPaymentMethodIcon(p.method, 14);
        paymentsHtml += `
          <div class="flex justify-between text-sm" style="border-bottom:1px solid var(--border-light); padding:6px 0; align-items:center;">
            <div style="display:flex; align-items:center; gap:6px;">
              ${icon}
              <span class="text-muted">${H.esc(p.method)}${suffix}</span>
            </div>
            <span style="font-weight:600;">${H.formatCurrency(p.amount)}</span>
          </div>
        `;
      });

      overlay.innerHTML = `
        <div class="modal" style="max-width:650px;">
          <div class="modal-header">
            <h3>Invoice Details: ${order.invoiceId}</h3>
            <button class="modal-close" id="modal-close-invoice">&times;</button>
          </div>
          <div class="modal-body">
            <div class="grid-2 mb-2">
              <div>
                <h4 style="margin-bottom:4px;">Customer Info</h4>
                <p><strong>Name:</strong> ${H.esc(order.customerName)}</p>
                <p><strong>Phone:</strong> ${H.esc(order.customerPhone)}</p>
              </div>
              <div class="text-right">
                <h4 style="margin-bottom:4px;">Order Info</h4>
                <p><strong>Date:</strong> ${H.formatDateTime(order.date)}</p>
                <p><strong>Status:</strong> <span class="badge badge-success">${order.status}</span></p>
              </div>
            </div>

            <div class="table-wrapper mb-2">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th class="text-center" style="width:60px;">Qty</th>
                    <th class="text-right" style="width:100px;">Price</th>
                    <th class="text-right" style="width:100px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </div>

            <div class="grid-2">
              <div>
                <h4 style="margin-bottom:8px;">Payments Received</h4>
                ${paymentsHtml || '<p class="text-muted text-sm">No payment records found.</p>'}
              </div>
              <div class="flex flex-col gap-1 text-right">
                <div class="flex justify-between">
                  <span class="text-muted">Sub Total:</span>
                  <span style="font-weight:600;">${H.formatCurrency(order.subtotal)}</span>
                </div>
                ${order.discountAmount > 0 ? `
                  <div class="flex justify-between text-danger">
                    <span>Discount:</span>
                    <span>-${H.formatCurrency(order.discountAmount)}</span>
                  </div>
                ` : ''}
                ${order.taxAmount > 0 ? `
                  <div class="flex justify-between">
                    <span>Tax (${order.taxPercent}%):</span>
                    <span>${H.formatCurrency(order.taxAmount)}</span>
                  </div>
                ` : ''}
                <div class="flex justify-between" style="border-top:1px solid var(--border); padding-top:4px; margin-top:4px;">
                  <span style="font-weight:700;">Grand Total:</span>
                  <span style="font-weight:800; color:var(--primary);">${H.formatCurrency(order.grandTotal)}</span>
                </div>
                <div class="flex justify-between text-success">
                  <span>Paid Amount:</span>
                  <span style="font-weight:700;">${H.formatCurrency(order.paidAmount)}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            ${user && (user.role === 'admin' || user.role === 'manager') ? `
              <button class="btn btn-warning" id="btn-edit-inv-modal" style="margin-right:auto; display:inline-flex; align-items:center; gap:6px;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                Edit Order
              </button>
            ` : ''}
            <button class="btn btn-secondary" id="btn-close-inv-footer">Close</button>
            <button class="btn btn-primary" id="btn-print-inv-modal" style="display:inline-flex; align-items:center; gap:6px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              Print Receipt
            </button>
          </div>
        </div>
      `;

      overlay.classList.add('active');

      const close = () => overlay.classList.remove('active');
      overlay.querySelector('#modal-close-invoice').onclick = close;
      overlay.querySelector('#btn-close-inv-footer').onclick = close;

      const editBtn = overlay.querySelector('#btn-edit-inv-modal');
      if (editBtn) {
        editBtn.onclick = () => {
          close();
          POS.Router.navigate('/edit-order/' + order.id);
        };
      }

      overlay.querySelector('#btn-print-inv-modal').onclick = async () => {
        const items = await S.query('orderItems', i => i.orderId === order.id);
        H.printOrder(order, items);
      };
    },

    async printReceipt(order) {
      const S = POS.Store;
      const H = POS.Helpers;
      const items = await S.query('orderItems', i => i.orderId === order.id);
      H.printOrder(order, items);
    }
  };

  window.POS = window.POS || {};
  window.POS.SalesList = SalesList;
})();
