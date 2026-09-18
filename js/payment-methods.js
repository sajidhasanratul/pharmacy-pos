(function () {
  'use strict';

  const PaymentMethods = {
    async render() {
      const mc = document.getElementById('main-content');
      const S = POS.Store;
      const H = POS.Helpers;

      mc.innerHTML = `
        <div class="page-header fade-in">
          <div>
            <h2 class="page-title" style="display:flex; align-items:center; gap:8px;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="2.2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
              Payment Methods
            </h2>
            <p class="page-subtitle">Configure accepted tender methods, custom brand icons, colors, and dashboard reconciliation channels.</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-primary btn-sm" id="btn-add-payment-method" style="display:inline-flex; align-items:center; gap:6px; font-weight:600;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Payment Method
            </button>
          </div>
        </div>

        <!-- Summary KPIs -->
        <div class="stats-grid fade-in" id="pm-stats-bar" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(190px, 1fr)); gap:14px; margin-bottom:20px;">
          <div class="stat-card" style="padding:16px; border:1px solid #e2e8f0; border-radius:10px; background:#fff;">
            <div style="font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase;">Total Methods</div>
            <div style="font-size:22px; font-weight:800; color:#0f172a; margin-top:4px;" id="pm-stat-total">--</div>
          </div>
          <div class="stat-card" style="padding:16px; border:1px solid #e2e8f0; border-radius:10px; background:#fff;">
            <div style="font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase;">Active Channels</div>
            <div style="font-size:22px; font-weight:800; color:#059669; margin-top:4px;" id="pm-stat-active">--</div>
          </div>
          <div class="stat-card" style="padding:16px; border:1px solid #e2e8f0; border-radius:10px; background:#fff;">
            <div style="font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase;">Core Built-in</div>
            <div style="font-size:22px; font-weight:800; color:#2563eb; margin-top:4px;" id="pm-stat-default">--</div>
          </div>
          <div class="stat-card" style="padding:16px; border:1px solid #e2e8f0; border-radius:10px; background:#fff;">
            <div style="font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase;">Custom Added</div>
            <div style="font-size:22px; font-weight:800; color:#7c3aed; margin-top:4px;" id="pm-stat-custom">--</div>
          </div>
        </div>

        <!-- Payment Methods Cards Grid -->
        <div class="card fade-in" style="border:1px solid #e2e8f0; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,0.04); background:#fff; margin-bottom:24px;">
          <div class="card-header" style="padding:14px 20px; border-bottom:1px solid #edf2f7; display:flex; justify-content:space-between; align-items:center;">
            <div style="font-weight:700; font-size:14px; color:#1e293b;">Configured Payment Tender Channels</div>
            <div style="font-size:12px; color:#64748b;">Active methods appear directly on the Dashboard and at Checkout</div>
          </div>
          <div class="card-body" style="padding:20px;">
            <div id="payment-methods-cards-container" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:18px;">
              <div style="grid-column:1/-1; text-align:center; padding:40px 0;"><div class="spinner" style="margin:0 auto 10px;"></div>Loading payment methods...</div>
            </div>
          </div>
        </div>

        <!-- Modal Mount Point -->
        <div class="modal-overlay" id="pm-modal-overlay"></div>
      `;

      document.getElementById('btn-add-payment-method').onclick = () => this.showModal(null);
      await this.loadList();
    },

    async loadList() {
      const H = POS.Helpers;
      const list = await H.loadPaymentMethods(true);

      const totalEl = document.getElementById('pm-stat-total');
      const activeEl = document.getElementById('pm-stat-active');
      const defEl = document.getElementById('pm-stat-default');
      const customEl = document.getElementById('pm-stat-custom');

      if (totalEl) totalEl.textContent = list.length;
      if (activeEl) activeEl.textContent = list.filter(m => m.status !== 'inactive').length;
      if (defEl) defEl.textContent = list.filter(m => m.isDefault === 1 || m.isDefault === true).length;
      if (customEl) customEl.textContent = list.filter(m => !m.isDefault).length;

      const container = document.getElementById('payment-methods-cards-container');
      if (!container) return;

      if (list.length === 0) {
        container.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#94a3b8; padding:30px;">No payment methods found. Click "Add Payment Method" to create one.</div>`;
        return;
      }

      container.innerHTML = list.map(pm => {
        const isInactive = pm.status === 'inactive';
        const brandColor = pm.color || '#0d9488';
        const iconHtml = H.getPaymentMethodIcon(pm, 42);
        const isDefault = pm.isDefault === 1 || pm.isDefault === true;
        const reqFour = pm.requiresLastFour === 1 || pm.requiresLastFour === true;

        return `
          <div class="pm-card" data-id="${H.esc(pm.id)}" style="background:#fff; border:1px solid ${isInactive ? '#e2e8f0' : '#cbd5e1'}; border-radius:12px; padding:16px; display:flex; flex-direction:column; justify-content:space-between; gap:14px; position:relative; box-shadow:0 1px 3px rgba(0,0,0,0.02); opacity:${isInactive ? '0.65' : '1'}; transition:all 0.2s ease;">
            
            <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px;">
              <div style="display:flex; align-items:center; gap:12px; min-width:0;">
                ${iconHtml}
                <div style="min-width:0;">
                  <div style="font-weight:700; font-size:15px; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    ${H.esc(pm.name)}
                  </div>
                  <div style="display:flex; align-items:center; gap:6px; margin-top:2px;">
                    <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${brandColor}; flex-shrink:0;"></span>
                    <span style="font-size:11px; font-family:monospace; color:#64748b;">${brandColor.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              <div>
                ${isInactive
                  ? `<span style="font-size:10px; font-weight:700; color:#64748b; background:#f1f5f9; padding:2px 8px; border-radius:12px;">Inactive</span>`
                  : `<span style="font-size:10px; font-weight:700; color:#16a34a; background:#f0fdf4; border:1px solid #bbf7d0; padding:2px 8px; border-radius:12px;">Active</span>`
                }
              </div>
            </div>

            <!-- Badges -->
            <div style="display:flex; flex-wrap:wrap; gap:6px; font-size:11px;">
              ${isDefault 
                ? `<span style="background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; font-weight:600; padding:2px 8px; border-radius:6px;">System Default</span>`
                : `<span style="background:#faf5ff; color:#7e22ce; border:1px solid #e9d5ff; font-weight:600; padding:2px 8px; border-radius:6px;">Custom Channel</span>`
              }
              ${reqFour
                ? `<span style="background:#fef3c7; color:#92400e; border:1px solid #fde68a; font-weight:600; padding:2px 8px; border-radius:6px;">Requires Last 4 Digits</span>`
                : `<span style="background:#f8fafc; color:#64748b; border:1px solid #e2e8f0; font-weight:500; padding:2px 8px; border-radius:6px;">Direct Tender</span>`
              }
            </div>

            <!-- Actions Bar -->
            <div style="display:flex; align-items:center; justify-content:space-between; border-top:1px solid #f1f5f9; padding-top:12px; margin-top:2px;">
              <button type="button" class="btn btn-secondary btn-sm btn-edit-pm" data-id="${H.esc(pm.id)}" style="display:inline-flex; align-items:center; gap:5px; font-size:12px;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit
              </button>

              <div style="display:flex; gap:6px;">
                <button type="button" class="btn btn-secondary btn-sm btn-toggle-status" data-id="${H.esc(pm.id)}" data-status="${pm.status || 'active'}" style="font-size:12px;" title="Toggle Active / Inactive">
                  ${isInactive ? 'Enable' : 'Disable'}
                </button>
                ${!isDefault ? `
                  <button type="button" class="btn btn-secondary btn-sm btn-delete-pm" data-id="${H.esc(pm.id)}" data-name="${H.esc(pm.name)}" style="color:var(--danger); font-size:12px;" title="Delete this custom method">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('');

      // Bind events
      container.querySelectorAll('.btn-edit-pm').forEach(btn => {
        btn.onclick = () => {
          const pm = list.find(m => m.id === btn.dataset.id);
          if (pm) this.showModal(pm);
        };
      });

      container.querySelectorAll('.btn-toggle-status').forEach(btn => {
        btn.onclick = async () => {
          const pm = list.find(m => m.id === btn.dataset.id);
          if (!pm) return;
          const nextStatus = pm.status === 'inactive' ? 'active' : 'inactive';
          await this.savePaymentMethod(pm.id, { ...pm, status: nextStatus });
        };
      });

      container.querySelectorAll('.btn-delete-pm').forEach(btn => {
        btn.onclick = async () => {
          const pmId = btn.dataset.id;
          const pmName = btn.dataset.name;
          if (confirm(`Are you sure you want to delete payment method "${pmName}"?`)) {
            await this.deletePaymentMethod(pmId);
          }
        };
      });
    },

    showModal(pm) {
      const H = POS.Helpers;
      const isEdit = !!pm;
      const overlay = document.getElementById('pm-modal-overlay');
      if (!overlay) return;

      const presets = H.getPaymentPresetIcons();
      let activeColor = pm ? (pm.color || '#0d9488') : '#0d9488';
      let activeIconType = pm ? (pm.iconType || 'preset') : 'preset';
      let activeIconValue = pm ? (pm.iconValue || 'wallet') : 'wallet';

      overlay.style.display = 'flex';
      overlay.innerHTML = `
        <div class="modal animate" style="max-width:540px; width:100%; border-radius:12px; overflow:hidden;">
          <div class="modal-header" style="background:#f8fafc; border-bottom:1px solid #edf2f7; padding:16px 20px;">
            <h3 style="margin:0; font-size:16px; font-weight:700; color:#0f172a; display:flex; align-items:center; gap:8px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
              ${isEdit ? 'Edit Payment Method' : 'Add New Payment Method'}
            </h3>
            <button class="modal-close" id="pm-modal-close" style="font-size:20px; line-height:1; background:none; border:none; cursor:pointer;">&times;</button>
          </div>

          <div class="modal-body" style="padding:20px; max-height:75vh; overflow-y:auto; display:flex; flex-direction:column; gap:16px;">
            
            <!-- Live Preview Pill Card -->
            <div style="background:#f8fafc; border:1px dashed #cbd5e1; border-radius:10px; padding:12px; display:flex; align-items:center; justify-content:space-between; gap:12px;">
              <div style="display:flex; align-items:center; gap:10px;">
                <div id="modal-preview-icon"></div>
                <div>
                  <div style="font-size:11px; color:#64748b; font-weight:600; text-transform:uppercase;">Live Dashboard Preview</div>
                  <div style="font-size:15px; font-weight:800; color:#0f172a;" id="modal-preview-name">Cash</div>
                </div>
              </div>
              <div style="text-align:right;">
                <span id="modal-preview-badge" style="font-size:11px; font-weight:700; padding:2px 8px; border-radius:12px; color:#fff; background:#0d9488;">
                  Channel Active
                </span>
              </div>
            </div>

            <!-- Method Name -->
            <div class="form-group">
              <label class="form-label" style="font-weight:600; font-size:13px;">Payment Method Name <span style="color:var(--danger)">*</span></label>
              <input type="text" class="form-input" id="pm-input-name" placeholder="e.g. Upay, CityTouch, NexusPay, Amex" value="${pm ? H.esc(pm.name) : ''}" required style="border:1.5px solid #cbd5e1;">
            </div>

            <!-- Brand Color Picker -->
            <div class="form-group">
              <label class="form-label" style="font-weight:600; font-size:13px;">Brand Accent Color</label>
              <div style="display:flex; align-items:center; gap:10px;">
                <input type="color" id="pm-input-color" value="${activeColor}" style="width:42px; height:38px; border:1px solid #cbd5e1; border-radius:6px; cursor:pointer; padding:2px; background:#fff;">
                <input type="text" class="form-input" id="pm-input-color-hex" value="${activeColor}" style="width:110px; font-family:monospace; text-transform:uppercase; font-size:13px;">
                <div style="display:flex; gap:6px; flex-wrap:wrap;">
                  ${['#0d9488', '#059669', '#2563eb', '#4338ca', '#e2136e', '#f7941d', '#8c3494', '#64748b'].map(c => `
                    <button type="button" class="btn-color-swatch" data-color="${c}" style="width:24px; height:24px; border-radius:50%; background:${c}; border:2px solid ${c === activeColor ? '#0f172a' : 'transparent'}; cursor:pointer; padding:0; outline:none;"></button>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- Icon Source Tabbed Switcher -->
            <div class="form-group">
              <label class="form-label" style="font-weight:600; font-size:13px;">Channel Icon or Logo</label>
              <div style="display:flex; border-bottom:1px solid #e2e8f0; margin-bottom:12px; gap:8px;">
                <button type="button" class="btn btn-sm btn-icon-tab ${activeIconType === 'preset' ? 'btn-primary' : 'btn-secondary'}" data-tab="preset" style="font-size:12px;">Preset Library</button>
                <button type="button" class="btn btn-sm btn-icon-tab ${activeIconType === 'image' ? 'btn-primary' : 'btn-secondary'}" data-tab="image" style="font-size:12px;">Upload Logo / Image</button>
                <button type="button" class="btn btn-sm btn-icon-tab ${activeIconType === 'svg' ? 'btn-primary' : 'btn-secondary'}" data-tab="svg" style="font-size:12px;">SVG Code / URL</button>
              </div>

              <!-- Preset Icons View -->
              <div id="tab-pane-preset" style="display:${activeIconType === 'preset' ? 'block' : 'none'};">
                <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(80px, 1fr)); gap:8px; max-height:180px; overflow-y:auto; padding:4px;">
                  ${presets.map(p => `
                    <div class="preset-icon-option ${p.id === activeIconValue ? 'selected' : ''}" data-id="${p.id}" style="border:1.5px solid ${p.id === activeIconValue ? '#0d9488' : '#e2e8f0'}; background:${p.id === activeIconValue ? '#f0fdfa' : '#fff'}; border-radius:8px; padding:8px 4px; display:flex; flex-direction:column; align-items:center; gap:6px; cursor:pointer; text-align:center; transition:all 0.15s ease;">
                      ${H.renderPresetIcon(p.id, 28, '#f8fafc', activeColor)}
                      <span style="font-size:10px; color:#475569; line-height:1.1;">${p.label}</span>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- Image Upload View -->
              <div id="tab-pane-image" style="display:${activeIconType === 'image' ? 'block' : 'none'};">
                <div style="border:1px dashed #cbd5e1; border-radius:8px; padding:14px; background:#f8fafc; display:flex; align-items:center; gap:14px;">
                  <div id="pm-img-preview" style="width:50px; height:50px; border-radius:8px; border:1px solid #cbd5e1; background:#fff; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                    ${activeIconType === 'image' && activeIconValue ? `<img src="${activeIconValue}" style="width:100%; height:100%; object-fit:contain;" />` : `<span style="font-size:10px; color:#94a3b8;">No File</span>`}
                  </div>
                  <div style="flex:1;">
                    <input type="file" id="pm-file-upload" accept="image/*" style="font-size:12px; margin-bottom:6px;">
                    <div style="font-size:11px; color:#64748b;">Supports PNG, JPG, WebP, SVG transparent logos (Stored locally)</div>
                  </div>
                </div>
              </div>

              <!-- SVG Code View -->
              <div id="tab-pane-svg" style="display:${activeIconType === 'svg' ? 'block' : 'none'};">
                <textarea class="form-input" id="pm-input-svg" rows="3" placeholder="Paste <svg ...>...</svg> code or https:// remote image URL here..." style="font-family:monospace; font-size:11px;">${activeIconType === 'svg' ? H.esc(activeIconValue) : ''}</textarea>
              </div>
            </div>

            <!-- Configuration Options -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; border-top:1px solid #edf2f7; padding-top:14px;">
              <div class="form-group" style="margin:0;">
                <label class="form-label" style="font-weight:600; font-size:13px;">Transaction Reference</label>
                <label style="display:flex; align-items:center; gap:8px; font-size:12px; cursor:pointer; margin-top:4px;">
                  <input type="checkbox" id="pm-chk-lastfour" ${pm && pm.requiresLastFour ? 'checked' : ''}>
                  Require Last 4 Digits / Ref #
                </label>
              </div>

              <div class="form-group" style="margin:0;">
                <label class="form-label" style="font-weight:600; font-size:13px;">Status</label>
                <select class="form-select" id="pm-select-status" style="font-size:12px;">
                  <option value="active" ${pm && pm.status === 'inactive' ? '' : 'selected'}>Active (Visible everywhere)</option>
                  <option value="inactive" ${pm && pm.status === 'inactive' ? 'selected' : ''}>Inactive (Hidden from checkout)</option>
                </select>
              </div>
            </div>

          </div>

          <div class="modal-footer" style="background:#f8fafc; border-top:1px solid #edf2f7; padding:14px 20px; display:flex; justify-content:flex-end; gap:10px;">
            <button type="button" class="btn btn-secondary" id="pm-modal-cancel">Cancel</button>
            <button type="button" class="btn btn-primary" id="pm-modal-save" style="font-weight:600;">Save Payment Method</button>
          </div>
        </div>
      `;

      // Helper to update live preview
      const updatePreview = () => {
        const nameVal = document.getElementById('pm-input-name').value.trim() || 'New Channel';
        const statusVal = document.getElementById('pm-select-status').value;
        const colorVal = activeColor;

        const previewName = document.getElementById('modal-preview-name');
        const previewBadge = document.getElementById('modal-preview-badge');
        const previewIcon = document.getElementById('modal-preview-icon');

        if (previewName) previewName.textContent = nameVal;
        if (previewBadge) {
          previewBadge.style.background = colorVal;
          previewBadge.textContent = statusVal === 'inactive' ? 'Channel Inactive' : 'Channel Active';
        }

        if (previewIcon) {
          const fakePm = {
            name: nameVal,
            color: colorVal,
            iconType: activeIconType,
            iconValue: activeIconValue
          };
          previewIcon.innerHTML = H.getPaymentMethodIcon(fakePm, 38);
        }
      };

      updatePreview();

      // Input changes
      document.getElementById('pm-input-name').oninput = updatePreview;
      document.getElementById('pm-select-status').onchange = updatePreview;

      // Color pickers
      const colorPicker = document.getElementById('pm-input-color');
      const colorHex = document.getElementById('pm-input-color-hex');
      colorPicker.oninput = (e) => {
        activeColor = e.target.value;
        colorHex.value = activeColor;
        updatePreview();
      };
      colorHex.oninput = (e) => {
        if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
          activeColor = e.target.value;
          colorPicker.value = activeColor;
          updatePreview();
        }
      };

      overlay.querySelectorAll('.btn-color-swatch').forEach(swatch => {
        swatch.onclick = () => {
          activeColor = swatch.dataset.color;
          colorPicker.value = activeColor;
          colorHex.value = activeColor;
          overlay.querySelectorAll('.btn-color-swatch').forEach(s => s.style.borderColor = 'transparent');
          swatch.style.borderColor = '#0f172a';
          updatePreview();
        };
      });

      // Tab switcher
      overlay.querySelectorAll('.btn-icon-tab').forEach(btn => {
        btn.onclick = () => {
          activeIconType = btn.dataset.tab;
          overlay.querySelectorAll('.btn-icon-tab').forEach(b => {
            b.classList.remove('btn-primary');
            b.classList.add('btn-secondary');
          });
          btn.classList.remove('btn-secondary');
          btn.classList.add('btn-primary');

          document.getElementById('tab-pane-preset').style.display = activeIconType === 'preset' ? 'block' : 'none';
          document.getElementById('tab-pane-image').style.display = activeIconType === 'image' ? 'block' : 'none';
          document.getElementById('tab-pane-svg').style.display = activeIconType === 'svg' ? 'block' : 'none';

          updatePreview();
        };
      });

      // Preset icons selection
      overlay.querySelectorAll('.preset-icon-option').forEach(opt => {
        opt.onclick = () => {
          activeIconValue = opt.dataset.id;
          overlay.querySelectorAll('.preset-icon-option').forEach(o => {
            o.style.borderColor = '#e2e8f0';
            o.style.background = '#fff';
            o.classList.remove('selected');
          });
          opt.style.borderColor = '#0d9488';
          opt.style.background = '#f0fdfa';
          opt.classList.add('selected');
          updatePreview();
        };
      });

      // File upload
      const fileInput = document.getElementById('pm-file-upload');
      if (fileInput) {
        fileInput.onchange = (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            activeIconValue = reader.result;
            const previewContainer = document.getElementById('pm-img-preview');
            if (previewContainer) {
              previewContainer.innerHTML = `<img src="${activeIconValue}" style="width:100%; height:100%; object-fit:contain;" />`;
            }
            updatePreview();
          };
          reader.readAsDataURL(file);
        };
      }

      // SVG code input
      const svgInput = document.getElementById('pm-input-svg');
      if (svgInput) {
        svgInput.oninput = (e) => {
          activeIconValue = e.target.value.trim();
          updatePreview();
        };
      }

      // Close handlers
      const closeModal = () => {
        overlay.style.display = 'none';
        overlay.innerHTML = '';
      };
      document.getElementById('pm-modal-close').onclick = closeModal;
      document.getElementById('pm-modal-cancel').onclick = closeModal;

      // Save handler
      document.getElementById('pm-modal-save').onclick = async () => {
        const name = document.getElementById('pm-input-name').value.trim();
        if (!name) {
          H.showToast('Please specify a payment method name', 'error');
          return;
        }

        const requiresLastFour = document.getElementById('pm-chk-lastfour').checked ? 1 : 0;
        const status = document.getElementById('pm-select-status').value;

        const payload = {
          id: pm ? pm.id : undefined,
          name,
          color: activeColor,
          iconType: activeIconType,
          iconValue: activeIconValue,
          requiresLastFour,
          status,
          isDefault: pm ? pm.isDefault : 0
        };

        const saveBtn = document.getElementById('pm-modal-save');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        await this.savePaymentMethod(pm ? pm.id : null, payload);
        closeModal();
      };
    },

    async savePaymentMethod(id, data) {
      const S = POS.Store;
      const H = POS.Helpers;

      try {
        let ok = false;
        if (id) {
          const res = await S.update('payment-methods', id, data);
          ok = !!res;
        } else {
          const res = await S.add('payment-methods', data);
          ok = !!res;
        }

        if (ok) {
          H.showToast(`Payment method "${data.name}" saved successfully!`, 'success');
          // Invalidate cache and reload
          await H.loadPaymentMethods(true);
          await this.loadList();
        } else {
          H.showToast('Could not save payment method', 'error');
        }
      } catch (err) {
        console.error('Save payment method error:', err);
        H.showToast(err.message || 'Error saving payment method', 'error');
      }
    },

    async deletePaymentMethod(id) {
      const S = POS.Store;
      const H = POS.Helpers;

      try {
        const ok = await S.delete('payment-methods', id);
        if (ok) {
          H.showToast('Payment method removed successfully.', 'info');
          await H.loadPaymentMethods(true);
          await this.loadList();
        } else {
          H.showToast('Could not delete payment method', 'error');
        }
      } catch (err) {
        console.error('Delete payment method error:', err);
        H.showToast(err.message || 'Error deleting payment method', 'error');
      }
    }
  };

  window.POS = window.POS || {};
  window.POS.PaymentMethods = PaymentMethods;
})();
