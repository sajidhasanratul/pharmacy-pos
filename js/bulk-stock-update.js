(function () {
  'use strict';

  const BulkStockUpdate = {
    items: [], // [{ product, variant, id, type: 'product'|'variation', name, sku, barcode, currentStock, qtyPerUnit, mode: 'add'|'remove', qty: 1 }]
    currentMode: 'add', // 'add' or 'remove'

    async render() {
      const mc = document.getElementById('main-content');
      const S = POS.Store;
      const H = POS.Helpers;

      this.items = [];
      this.currentMode = 'add';

      mc.innerHTML = `
        <style>
          .stock-mode-pill {
            display: inline-flex;
            border-radius: 8px;
            background: #f1f5f9;
            padding: 3px;
            border: 1px solid #cbd5e1;
          }
          .stock-mode-btn {
            padding: 6px 16px;
            border-radius: 6px;
            border: none;
            cursor: pointer;
            font-size: 13px;
            font-weight: 700;
            transition: all 0.2s;
            background: transparent;
            color: #64748b;
          }
          .stock-mode-btn.active-add {
            background: #16a34a;
            color: #fff;
            box-shadow: 0 1px 3px rgba(22, 163, 74, 0.3);
          }
          .stock-mode-btn.active-remove {
            background: #dc2626;
            color: #fff;
            box-shadow: 0 1px 3px rgba(220, 38, 38, 0.3);
          }
          .bulk-suggest-box {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: #fff;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.12);
            max-height: 280px;
            overflow-y: auto;
            z-index: 1000;
            display: none;
          }
          .bulk-suggest-item {
            padding: 10px 14px;
            border-bottom: 1px solid #f1f5f9;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .bulk-suggest-item:hover {
            background: #f8fafc;
          }
        </style>

        <div class="page-header fade-in">
          <div>
            <h2 class="page-title">Bulk Stock Update</h2>
            <p class="page-subtitle">Add or remove inventory pieces in bulk using barcode scanning or medicine autocomplete search.</p>
          </div>
          <div class="page-actions" style="display:flex; align-items:center; gap:12px;">
            <div class="stock-mode-pill">
              <button type="button" class="stock-mode-btn active-add" id="btn-mode-add">+ Add Stock</button>
              <button type="button" class="stock-mode-btn" id="btn-mode-remove">- Remove Stock</button>
            </div>
            <button class="btn btn-secondary btn-sm" id="btn-clear-bulk-list">Clear List</button>
          </div>
        </div>

        <div class="card fade-in" style="margin-bottom: 20px;">
          <div class="card-body form-row" style="grid-template-columns: 1fr 1fr; gap: 16px;">
            <div>
              <label class="form-label" style="font-weight:700;">Scan Barcode Gun (Rapid Enter)</label>
              <input type="text" class="form-input" id="bulk-scan-input" placeholder="Scan barcode or type barcode and press Enter..." autocomplete="off" style="font-size:14px; padding:10px 14px; border:2px solid #0d9488;">
              <small class="text-muted" style="display:block; margin-top:4px;">Auto-submits on scan. Keep scanner focused here.</small>
            </div>
            <div style="position:relative;">
              <label class="form-label" style="font-weight:700;">Search Medicine (Name, Tag, Generic, SKU)</label>
              <input type="text" class="form-input" id="bulk-search-suggest" placeholder="Type medicine name, generic, tag, or SKU..." autocomplete="off" style="font-size:14px; padding:10px 14px; border:2px solid #0d9488;">
              <div class="bulk-suggest-box" id="bulk-suggest-dropdown"></div>
              <small class="text-muted" style="display:block; margin-top:4px;">Shows instant matching suggestions as you type.</small>
            </div>
          </div>
        </div>

        <div class="card fade-in">
          <div class="card-body" style="padding:0;">
            <div class="table-wrapper" style="border:none;">
              <table class="data-table" style="margin:0;">
                <thead>
                  <tr>
                    <th>Medicine / Packaging Unit</th>
                    <th style="width:140px;">SKU / Barcode</th>
                    <th class="text-center" style="width:120px;">Current Stock</th>
                    <th class="text-center" style="width:130px;">Action Mode</th>
                    <th class="text-center" style="width:140px;">Adjustment Qty</th>
                    <th class="text-center" style="width:150px;">Projected Stock</th>
                    <th class="text-center" style="width:70px;">Remove</th>
                  </tr>
                </thead>
                <tbody id="bulk-update-tbody">
                  <tr>
                    <td colspan="7" class="text-center text-muted" style="padding:40px;">
                      No medicines queued yet. Scan a barcode or search above to begin!
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="card-footer" style="background:#f8fafc; padding:16px 20px; border-top:1px solid var(--border-light); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
            <div id="bulk-update-summary" style="font-weight:700; color:#334155;">
              Queued Items: 0 | Total Piece Adjustment: 0 pcs
            </div>
            <button class="btn btn-primary" id="btn-confirm-bulk-update" style="background:#16a34a; border-color:#16a34a; padding:10px 24px; font-weight:700;" disabled>
              Confirm Stock Update
            </button>
          </div>
        </div>
      `;

      this.bindEvents();
    },

    async bindEvents() {
      const S = POS.Store;
      const H = POS.Helpers;

      const btnModeAdd = document.getElementById('btn-mode-add');
      const btnModeRemove = document.getElementById('btn-mode-remove');
      const scanInput = document.getElementById('bulk-scan-input');
      const searchSuggest = document.getElementById('bulk-search-suggest');
      const suggestDropdown = document.getElementById('bulk-suggest-dropdown');
      const confirmBtn = document.getElementById('btn-confirm-bulk-update');
      const clearBtn = document.getElementById('btn-clear-bulk-list');

      setTimeout(() => scanInput.focus(), 100);

      // Mode toggles
      btnModeAdd.onclick = () => {
        this.currentMode = 'add';
        btnModeAdd.className = 'stock-mode-btn active-add';
        btnModeRemove.className = 'stock-mode-btn';
        confirmBtn.style.background = '#16a34a';
        confirmBtn.style.borderColor = '#16a34a';
      };

      btnModeRemove.onclick = () => {
        this.currentMode = 'remove';
        btnModeRemove.className = 'stock-mode-btn active-remove';
        btnModeAdd.className = 'stock-mode-btn';
        confirmBtn.style.background = '#dc2626';
        confirmBtn.style.borderColor = '#dc2626';
      };

      // Barcode Gun Scanning
      scanInput.onkeydown = async (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const query = scanInput.value.trim();
          if (!query) return;
          await this.handleBarcodeScan(query);
          scanInput.value = '';
        }
      };

      // Autocomplete Search
      searchSuggest.oninput = H.debounce(async () => {
        const q = searchSuggest.value.toLowerCase().trim();
        if (!q || q.length < 1) {
          suggestDropdown.style.display = 'none';
          suggestDropdown.innerHTML = '';
          return;
        }

        const products = await S.getAll('products');
        const matches = [];

        for (const p of products) {
          const matchP = (p.name || '').toLowerCase().includes(q) ||
                         (p.generic || '').toLowerCase().includes(q) ||
                         (p.brand || '').toLowerCase().includes(q) ||
                         (p.tag || '').toLowerCase().includes(q) ||
                         (p.sku || '').toLowerCase().includes(q) ||
                         (p.barcode || '').toLowerCase().includes(q);

          if (matchP) {
            matches.push({ product: p, variant: null, label: p.name, sku: p.sku, barcode: p.barcode, stock: p.stock });
          }

          if (p.variations && p.variations.length > 0) {
            for (const v of p.variations) {
              const matchV = (v.name || '').toLowerCase().includes(q) ||
                             (v.sku || '').toLowerCase().includes(q) ||
                             (v.barcode || '').toLowerCase().includes(q);
              if (matchV && !matchP) {
                matches.push({ product: p, variant: v, label: `${p.name} - Unit: ${v.name}`, sku: v.sku, barcode: v.barcode, stock: p.stock, qtyPerUnit: v.qty_per_unit || 1 });
              }
            }
          }

          if (matches.length >= 25) break;
        }

        if (matches.length === 0) {
          suggestDropdown.innerHTML = `<div style="padding:12px; color:#94a3b8; font-size:12px; text-align:center;">No matching medicines found</div>`;
          suggestDropdown.style.display = 'block';
          return;
        }

        suggestDropdown.innerHTML = matches.map((m, idx) => `
          <div class="bulk-suggest-item" data-idx="${idx}">
            <div>
              <div style="font-weight:700; font-size:13px; color:#1e293b;">${H.esc(m.label)}</div>
              <div style="font-size:11px; color:#64748b; margin-top:2px;">
                ${m.product.brand ? `<span>Brand: ${H.esc(m.product.brand)} | </span>` : ''}
                ${m.product.generic ? `<span>Generic: ${H.esc(m.product.generic)} | </span>` : ''}
                <span>SKU: ${H.esc(m.sku || '—')}</span>
              </div>
            </div>
            <div style="text-align:right;">
              <span class="badge badge-success" style="font-size:11px;">Stock: ${m.stock} pcs</span>
            </div>
          </div>
        `).join('');

        suggestDropdown.style.display = 'block';

        suggestDropdown.querySelectorAll('.bulk-suggest-item').forEach(itemEl => {
          itemEl.onclick = () => {
            const idx = parseInt(itemEl.dataset.idx);
            const m = matches[idx];
            this.addQueueItem(m.product, m.variant);
            searchSuggest.value = '';
            suggestDropdown.style.display = 'none';
            suggestDropdown.innerHTML = '';
            scanInput.focus();
          };
        });
      }, 200);

      // Close suggest on outer click
      document.addEventListener('click', (e) => {
        if (!e.target.closest('#bulk-search-suggest') && !e.target.closest('#bulk-suggest-dropdown')) {
          suggestDropdown.style.display = 'none';
        }
      });

      // Clear List
      clearBtn.onclick = () => {
        this.items = [];
        this.renderQueueTable();
      };

      // Confirm
      confirmBtn.onclick = () => this.confirmBulkUpdate();
    },

    async handleBarcodeScan(query) {
      const S = POS.Store;
      const H = POS.Helpers;

      try {
        const res = await fetch(`/api/products/search-exact?query=${encodeURIComponent(query)}`, {
          headers: S.getHeaders()
        });
        const data = await res.json();

        if (data.success && data.item) {
          const it = data.item;
          let product, variant;
          if (it.type === 'variation') {
            variant = await S.getById('variations', it.id);
            if (variant) product = await S.getById('products', variant.productId);
          } else {
            product = await S.getById('products', it.id);
          }

          if (product) {
            this.addQueueItem(product, variant);
            H.showToast(`Queued: ${product.name} (${this.currentMode === 'add' ? '+1' : '-1'})`, 'success');
            return;
          }
        }

        // Fallback local scan
        const prods = await S.getAll('products');
        for (const p of prods) {
          if ((p.barcode && p.barcode.toLowerCase() === query.toLowerCase()) || (p.sku && p.sku.toLowerCase() === query.toLowerCase())) {
            this.addQueueItem(p, null);
            H.showToast(`Queued: ${p.name} (${this.currentMode === 'add' ? '+1' : '-1'})`, 'success');
            return;
          }
          if (p.variations && p.variations.length > 0) {
            const v = p.variations.find(vObj => (vObj.barcode && vObj.barcode.toLowerCase() === query.toLowerCase()) || (vObj.sku && vObj.sku.toLowerCase() === query.toLowerCase()));
            if (v) {
              this.addQueueItem(p, v);
              H.showToast(`Queued: ${p.name} - ${v.name} (${this.currentMode === 'add' ? '+1' : '-1'})`, 'success');
              return;
            }
          }
        }

        H.showToast(`No item found matching barcode/SKU: ${query}`, 'warning');
      } catch (err) {
        console.error('Scan error:', err);
        H.showToast('Barcode search failed', 'error');
      }
    },

    addQueueItem(product, variant) {
      const itemId = variant ? variant.id : product.id;
      const itemType = variant ? 'variation' : 'product';
      const qtyPerUnit = variant ? (variant.qty_per_unit || 1) : 1;

      const existing = this.items.find(i => i.id === itemId && i.type === itemType);
      if (existing) {
        existing.qty += 1;
      } else {
        this.items.push({
          product,
          variant,
          id: itemId,
          type: itemType,
          name: variant ? `${product.name} (Unit: ${variant.name})` : product.name,
          sku: variant ? (variant.sku || product.sku) : product.sku,
          barcode: variant ? (variant.barcode || product.barcode) : product.barcode,
          currentStock: product.stock,
          qtyPerUnit,
          mode: this.currentMode,
          qty: 1
        });
      }

      this.renderQueueTable();
    },

    renderQueueTable() {
      const H = POS.Helpers;
      const tbody = document.getElementById('bulk-update-tbody');
      const confirmBtn = document.getElementById('btn-confirm-bulk-update');
      const summaryText = document.getElementById('bulk-update-summary');

      if (!tbody) return;

      if (this.items.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center text-muted" style="padding:40px;">
              No medicines queued yet. Scan a barcode or search above to begin!
            </td>
          </tr>
        `;
        confirmBtn.disabled = true;
        summaryText.textContent = `Queued Items: 0 | Total Piece Adjustment: 0 pcs`;
        return;
      }

      confirmBtn.disabled = false;

      let totalPcs = 0;

      tbody.innerHTML = this.items.map((item, idx) => {
        const totalDeltaPcs = item.qty * item.qtyPerUnit;
        const signedDelta = item.mode === 'add' ? totalDeltaPcs : -totalDeltaPcs;
        totalPcs += signedDelta;

        const projectedStock = Math.max(0, item.currentStock + signedDelta);
        const projectedColor = item.mode === 'add' ? '#16a34a' : '#dc2626';

        return `
          <tr data-idx="${idx}">
            <td>
              <div style="font-weight:700; color:#1e293b;">${H.esc(item.name)}</div>
              ${item.variant ? `<div style="font-size:11px; color:#0284c7;">1 Unit = ${item.qtyPerUnit} pcs</div>` : ''}
            </td>
            <td style="font-size:12px; color:#64748b;">${H.esc(item.sku || item.barcode || '—')}</td>
            <td class="text-center" style="font-weight:700;">${item.currentStock} pcs</td>
            <td class="text-center">
              <select class="form-select select-item-mode" style="padding:4px 8px; font-size:12px; font-weight:700; width:105px; color:${item.mode === 'add' ? '#16a34a' : '#dc2626'};">
                <option value="add" ${item.mode === 'add' ? 'selected' : ''}>+ Add</option>
                <option value="remove" ${item.mode === 'remove' ? 'selected' : ''}>- Remove</option>
              </select>
            </td>
            <td class="text-center">
              <input type="number" class="form-input input-item-qty" min="1" value="${item.qty}" style="width:85px; text-align:center; padding:4px 8px; font-weight:700; margin:0 auto;">
            </td>
            <td class="text-center">
              <span style="font-weight:800; color:${projectedColor}; font-size:13px;">
                ${projectedStock} pcs (${signedDelta > 0 ? '+' : ''}${signedDelta})
              </span>
            </td>
            <td class="text-center">
              <button class="btn btn-danger btn-sm btn-remove-item" style="padding:4px 8px; display:inline-flex; align-items:center; justify-content:center;" title="Remove">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </td>
          </tr>
        `;
      }).join('');

      summaryText.textContent = `Queued Items: ${this.items.length} | Net Piece Adjustment: ${totalPcs > 0 ? '+' : ''}${totalPcs} pcs`;

      // Bind row inputs
      tbody.querySelectorAll('tr').forEach(row => {
        const idx = parseInt(row.dataset.idx);
        const item = this.items[idx];

        const modeSelect = row.querySelector('.select-item-mode');
        if (modeSelect) {
          modeSelect.onchange = (e) => {
            item.mode = e.target.value;
            this.renderQueueTable();
          };
        }

        const qtyInput = row.querySelector('.input-item-qty');
        if (qtyInput) {
          qtyInput.onchange = (e) => {
            let val = parseInt(e.target.value) || 1;
            if (val < 1) val = 1;
            item.qty = val;
            this.renderQueueTable();
          };
        }

        const rmBtn = row.querySelector('.btn-remove-item');
        if (rmBtn) {
          rmBtn.onclick = () => {
            this.items.splice(idx, 1);
            this.renderQueueTable();
          };
        }
      });
    },

    async confirmBulkUpdate() {
      const H = POS.Helpers;
      const S = POS.Store;

      if (this.items.length === 0) return;

      const confirmBtn = document.getElementById('btn-confirm-bulk-update');
      const updates = this.items.map(i => {
        const signedQty = i.mode === 'add' ? i.qty : -i.qty;
        return {
          type: i.type,
          id: i.id,
          qty: signedQty
        };
      });

      try {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Updating Inventory...';

        const res = await fetch('/api/products/bulk-stock-update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...S.getHeaders()
          },
          body: JSON.stringify(updates)
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Update failed');
        }

        H.showToast(`Successfully updated inventory for ${this.items.length} medicines!`);
        this.items = [];
        this.renderQueueTable();

        const scanInput = document.getElementById('bulk-scan-input');
        if (scanInput) scanInput.focus();
      } catch (err) {
        console.error('Bulk update error:', err);
        H.showToast(`Error updating stock: ${err.message}`, 'error');
      } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Confirm Stock Update';
      }
    }
  };

  window.POS = window.POS || {};
  window.POS.BulkStockUpdate = BulkStockUpdate;
})();
