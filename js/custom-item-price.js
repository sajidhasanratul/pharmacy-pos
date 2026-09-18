(function () {
  'use strict';

  const CustomItemPrice = {
    items: [],

    async render() {
      const mc = document.getElementById('main-content');
      const S = POS.Store;
      const H = POS.Helpers;

      mc.innerHTML = `
        <div class="page-header fade-in">
          <div>
            <h2 class="page-title">Custom Item Price</h2>
            <p class="page-subtitle">Assign or update purchase cost prices for custom items sold in specific customer orders.</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-success btn-sm" id="btn-bulk-save-costs" style="display:inline-flex; align-items:center; gap:6px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Bulk Save Cost Prices
            </button>
          </div>
        </div>

        <div class="filter-bar fade-in">
          <div class="search-box" style="flex: 1;">
            <input type="text" id="custom-items-search" placeholder="Search by Invoice ID, customer name, phone or product...">
          </div>
          <div class="form-group" style="margin-bottom:0; min-width: 170px;">
            <select class="form-select" id="custom-cost-filter">
              <option value="all">All Custom Items</option>
              <option value="missing" selected>Missing Cost Price (Blank)</option>
              <option value="set">Cost Price Assigned</option>
            </select>
          </div>
        </div>

        <div class="card fade-in">
          <div class="card-body">
            <div class="table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th style="width: 110px;">Invoice ID</th>
                    <th style="width: 140px;">Sales Date</th>
                    <th>Customer</th>
                    <th>Product Name</th>
                    <th class="text-right" style="width: 100px;">Unit Price</th>
                    <th class="text-center" style="width: 80px;">Sold Qty</th>
                    <th class="text-right" style="width: 110px;">Revenue</th>
                    <th style="width: 150px;">Cost Price (৳)</th>
                    <th class="text-center" style="width: 110px;">Action</th>
                  </tr>
                </thead>
                <tbody id="custom-items-tbody">
                  <tr>
                    <td colspan="9" class="text-center text-muted" style="padding: 30px;">
                      <div class="spinner" style="margin: 0 auto 10px;"></div>
                      Loading custom order items...
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;

      await this.loadItems();

      // Search and filter listeners
      const searchInput = document.getElementById('custom-items-search');
      const filterSelect = document.getElementById('custom-cost-filter');

      searchInput.oninput = H.debounce(() => this.filterAndRender(), 250);
      filterSelect.onchange = () => this.filterAndRender();

      // Bulk Save
      document.getElementById('btn-bulk-save-costs').onclick = () => this.bulkSaveCostPrices();
    },

    async loadItems() {
      const H = POS.Helpers;
      try {
        const res = await fetch('/api/custom-order-items', {
          headers: POS.Store.getHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch custom order items');
        this.items = await res.json();
        this.filterAndRender();
      } catch (err) {
        console.error('Error loading custom items:', err);
        const tbody = document.getElementById('custom-items-tbody');
        if (tbody) {
          tbody.innerHTML = `<tr><td colspan="9" class="text-center text-danger">Failed to load custom items: ${err.message}</td></tr>`;
        }
        H.showToast('Could not load custom order items', 'error');
      }
    },

    filterAndRender() {
      const H = POS.Helpers;
      const searchInput = document.getElementById('custom-items-search');
      const filterSelect = document.getElementById('custom-cost-filter');
      const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
      const filterType = filterSelect ? filterSelect.value : 'all';

      let filtered = this.items.filter(item => {
        if (query) {
          const invMatch = (item.invoiceId || '').toLowerCase().includes(query);
          const nameMatch = (item.productName || '').toLowerCase().includes(query);
          const custNameMatch = (item.customerName || '').toLowerCase().includes(query);
          const custPhoneMatch = (item.customerPhone || '').includes(query);
          if (!invMatch && !nameMatch && !custNameMatch && !custPhoneMatch) return false;
        }

        const hasCost = item.costPrice !== null && item.costPrice !== undefined && item.costPrice !== '' && !isNaN(parseFloat(item.costPrice)) && parseFloat(item.costPrice) > 0;
        if (filterType === 'missing' && hasCost) return false;
        if (filterType === 'set' && !hasCost) return false;

        return true;
      });

      const tbody = document.getElementById('custom-items-tbody');
      if (!tbody) return;

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted" style="padding: 30px;">No custom order items found matching criteria.</td></tr>`;
        return;
      }

      tbody.innerHTML = filtered.map(item => {
        const costVal = item.costPrice !== null && item.costPrice !== undefined ? item.costPrice : '';
        return `
          <tr data-id="${item.id}">
            <td style="font-weight:700;">${H.esc(item.invoiceId)}</td>
            <td style="font-size:12px; color:#64748b;">${H.formatDateTime(item.date)}</td>
            <td>
              <div style="font-weight:600;">${H.esc(item.customerName || 'Walk-in')}</div>
              <div style="font-size:11px; color:#94a3b8;">${H.esc(item.customerPhone || 'N/A')}</div>
            </td>
            <td>
              <div style="font-weight:700; color:var(--text);">${H.esc(item.productName || 'Unnamed Custom Product')}</div>
              <span class="badge" style="font-size:10px; background:#eff6ff; color:#1e40af; border:1px solid #bfdbfe;">Custom Item</span>
            </td>
            <td class="text-right" style="font-weight:600;">${H.formatCurrency(item.unitPrice)}</td>
            <td class="text-center" style="font-weight:700;">${item.qty}</td>
            <td class="text-right" style="font-weight:700; color:var(--primary);">${H.formatCurrency(item.total || (item.unitPrice * item.qty))}</td>
            <td>
              <div style="display:flex; align-items:center; gap:4px;">
                <span style="color:#64748b; font-size:12px;">৳</span>
                <input type="number" class="form-input input-cost-price" data-id="${item.id}" value="${costVal}" placeholder="0.00" min="0" step="0.01" style="padding:4px 8px; height:30px; font-size:13px; font-weight:700; border: 1.5px solid #cbd5e1;">
              </div>
            </td>
            <td class="text-center">
              <button class="btn btn-primary btn-sm btn-update-single-cost" data-id="${item.id}" style="padding:4px 12px; font-size:11px; font-weight:700; white-space:nowrap;">Update</button>
            </td>
          </tr>
        `;
      }).join('');

      // Bind update buttons
      tbody.querySelectorAll('.btn-update-single-cost').forEach(btn => {
        btn.onclick = async () => {
          const id = btn.dataset.id;
          const input = tbody.querySelector(`.input-cost-price[data-id="${id}"]`);
          const val = input ? input.value : '';
          await this.saveSingleCost(id, val, btn);
        };
      });
    },

    async saveSingleCost(id, costPrice, btnEl) {
      const H = POS.Helpers;
      try {
        if (btnEl) {
          btnEl.disabled = true;
          btnEl.textContent = 'Saving...';
        }

        const res = await fetch(`/api/custom-order-items/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...POS.Store.getHeaders()
          },
          body: JSON.stringify({ costPrice })
        });

        if (!res.ok) throw new Error('Failed to update cost price');

        const item = this.items.find(i => i.id === id);
        if (item) {
          item.costPrice = costPrice !== '' ? parseFloat(costPrice) : null;
        }

        H.showToast('Cost price updated successfully!');
      } catch (err) {
        console.error('Error saving cost price:', err);
        H.showToast('Error saving cost price: ' + err.message, 'error');
      } finally {
        if (btnEl) {
          btnEl.disabled = false;
          btnEl.textContent = 'Update';
        }
      }
    },

    async bulkSaveCostPrices() {
      const H = POS.Helpers;
      const tbody = document.getElementById('custom-items-tbody');
      if (!tbody) return;

      const inputs = tbody.querySelectorAll('.input-cost-price');
      const updates = [];

      inputs.forEach(input => {
        const id = input.dataset.id;
        const val = input.value.trim();
        if (val !== '') {
          updates.push({ id, costPrice: val });
        }
      });

      if (updates.length === 0) {
        H.showToast('No cost prices entered to save.', 'warning');
        return;
      }

      const btn = document.getElementById('btn-bulk-save-costs');
      try {
        if (btn) {
          btn.disabled = true;
          btn.textContent = 'Saving updates...';
        }

        const res = await fetch('/api/custom-order-items-bulk', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...POS.Store.getHeaders()
          },
          body: JSON.stringify({ updates })
        });

        if (!res.ok) throw new Error('Bulk update failed');

        updates.forEach(u => {
          const it = this.items.find(i => i.id === u.id);
          if (it) it.costPrice = parseFloat(u.costPrice);
        });

        H.showToast(`Updated cost prices for ${updates.length} items successfully!`);
        this.filterAndRender();
      } catch (err) {
        console.error('Error in bulk cost save:', err);
        H.showToast('Error bulk updating costs: ' + err.message, 'error');
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:4px;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Bulk Save Cost Prices`;
        }
      }
    }
  };

  window.POS = window.POS || {};
  window.POS.CustomItemPrice = CustomItemPrice;
})();
