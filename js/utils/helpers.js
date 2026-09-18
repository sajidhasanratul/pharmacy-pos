(function () {
  'use strict';

  const Helpers = {
    /* ── Currency ──────────────────────────────────── */
    formatCurrency(amount) {
      const n = parseFloat(amount) || 0;
      return '৳' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    rawNumber(amount) {
      return parseFloat(amount) || 0;
    },

    /* ── Dates ─────────────────────────────────────── */
    formatDate(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    },

    formatDateTime(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    },

    formatDateInput(dateStr) {
      const d = new Date(dateStr || Date.now());
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    },

    today() {
      return this.formatDateInput(new Date());
    },

    isDateInRange(dateStr, from, to) {
      if (!dateStr) return false;
      const d = new Date(dateStr).setHours(0, 0, 0, 0);
      if (from && d < new Date(from).setHours(0, 0, 0, 0)) return false;
      if (to && d > new Date(to).setHours(23, 59, 59, 999)) return false;
      return true;
    },

    /* ── CSV Export ────────────────────────────────── */
    exportCSV(data, filename) {
      if (!data || !data.length) return;
      const headers = Object.keys(data[0]);
      const rows = data.map(row =>
        headers.map(h => {
          let val = row[h] ?? '';
          val = String(val).replace(/"/g, '""');
          return `"${val}"`;
        }).join(',')
      );
      const csv = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = (filename || 'export') + '.csv';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    parseCSV(text) {
      if (!text) return [];
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length === 0) return [];

      const parseLine = (line) => {
        const result = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              cur += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            result.push(cur.trim());
            cur = '';
          } else {
            cur += char;
          }
        }
        result.push(cur.trim());
        return result;
      };

      const headers = parseLine(lines[0]);
      const list = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseLine(lines[i]);
        if (values.length < headers.length) continue;
        const obj = {};
        headers.forEach((h, idx) => {
          obj[h] = values[idx] ?? '';
        });
        list.push(obj);
      }
      return list;
    },

    printHTML(html, title, settings = {}) {
      const w = window.open('', '_blank', 'width=800,height=600');
      const isReceipt = settings.default_print_type === 'receipt';
      const bodyClass = isReceipt ? 'receipt-body' : 'paper-body';
      w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
        <title>${title || 'Print'}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Libre+Barcode+39&display=swap" rel="stylesheet">
        <style>
          *{margin:0;padding:0;box-sizing:border-box}
          body{font-family:'Inter',sans-serif;padding:30px;color:#1e293b;font-size:13px}
          body.receipt-body { padding: 4px; font-size: 8pt; color: #000; line-height: 1.3; }
          body.receipt-body * { font-size: 8pt; }
          body.receipt-body h3 { font-size: 10pt !important; }
          body.receipt-body h4 { font-size: 8.5pt !important; }
          body.receipt-body small { font-size: 7.5pt !important; }
          body.receipt-body table th, body.receipt-body table td { font-size: 7.5pt !important; padding: 2px 0; }
          table{width:100%;border-collapse:collapse;margin:12px 0}
          th,td{border:1px solid #cbd5e1;padding:8px 10px;text-align:left}
          th{background:#f1f5f9;font-weight:600}
          .text-right{text-align:right} .text-center{text-align:center}
          h1{font-size:20px;margin-bottom:4px} h2{font-size:16px;margin:16px 0 8px}
          .invoice-header{display:flex;justify-content:space-between;margin-bottom:20px}
          .totals{margin-top:12px;text-align:right} .totals .grand{font-size:18px;font-weight:700}
          
          /* Thermal Receipt Printer CSS */
          /* Thermal Receipt Printer CSS */
          .thermal-receipt {
            max-width: ${settings.receipt_width || 80}mm;
            margin: 0 auto;
            color: #000;
            font-family: 'Inter', sans-serif;
            font-size: 12px;
          }
          .thermal-receipt table {
            border: none;
            width: 100%;
            border-collapse: collapse;
          }
          
          /* Style 1: Standard Minimalist (Default) */
          .thermal-receipt.style-1 hr {
            border: none;
            border-top: 1px dashed #000;
            margin: 8px 0;
          }
          .thermal-receipt.style-1 .totals {
            margin-top: 8px;
            border-top: 1px dashed #000;
            padding-top: 6px;
          }
          .thermal-receipt.style-1 .totals p {
            margin: 3px 0;
            display: flex;
            justify-content: space-between;
          }
          
          /* Style 2: Classic Bordered (Courier Monospace / Retro Cash Register) */
          .thermal-receipt.style-2 {
            font-family: 'Courier New', Courier, monospace !important;
            border: 1px solid #000;
            padding: 8px;
            color: #000;
          }
          .thermal-receipt.style-2 * {
            font-family: 'Courier New', Courier, monospace !important;
            color: #000 !important;
          }
          .thermal-receipt.style-2 hr {
            border: none;
            border-top: 1px solid #000 !important;
            margin: 8px 0;
          }
          .thermal-receipt.style-2 .receipt-item-row {
            border-bottom: 1px solid #000 !important;
            padding: 5px 0 !important;
          }
          .thermal-receipt.style-2 .receipt-item-name {
            font-weight: bold !important;
          }
          .thermal-receipt.style-2 .totals {
            margin-top: 8px;
            border-top: 1px solid #000 !important;
            padding-top: 6px;
          }
          .thermal-receipt.style-2 .totals p {
            margin: 4px 0;
            display: flex;
            justify-content: space-between;
          }

          /* Style 3: Modern Elegant (Centered & Premium Shaded Totals) */
          .thermal-receipt.style-3 {
            font-family: 'Inter', sans-serif;
            color: #1e293b;
          }
          .thermal-receipt.style-3 hr {
            border: none;
            border-top: 1px double #475569 !important;
            margin: 10px 0;
          }
          .thermal-receipt.style-3 .receipt-item-row {
            border-bottom: 1px solid #e2e8f0 !important;
            padding: 6px 0 !important;
          }
          .thermal-receipt.style-3 .receipt-item-name {
            color: #0f172a !important;
            font-weight: 700;
          }
          .thermal-receipt.style-3 .receipt-item-details {
            color: #64748b !important;
            margin-top: 3px !important;
          }
          .thermal-receipt.style-3 .totals {
            margin-top: 10px;
            border: 1px solid #e2e8f0;
            background: #f8fafc !important;
            padding: 8px;
            border-radius: 6px;
          }
          .thermal-receipt.style-3 .totals p {
            margin: 4px 0;
            display: flex;
            justify-content: space-between;
          }
          .thermal-receipt.style-3 .totals p strong {
            font-weight: 700;
          }
          
          .thermal-receipt .totals p {
            margin: 3px 0;
          }
          
          /* Product Label Printer CSS */
          .product-label {
            width: 50mm;
            height: 30mm;
            padding: 3mm;
            border: 1px dashed #94a3b8;
            margin: 0 auto;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            font-family: 'Inter', sans-serif;
            color: #000;
          }
          .label-title {
            font-size: 10px;
            font-weight: 800;
            margin-bottom: 2px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
          }
          .label-price {
            font-size: 11px;
            font-weight: 800;
            margin: 1px 0;
          }
          .label-barcode {
            margin: 2px auto;
            font-family: 'Libre Barcode 39', monospace;
            font-size: 24px;
            letter-spacing: 2px;
          }
          .label-sku {
            font-size: 8px;
            color: #334155;
            font-weight: 600;
          }
          
          /* Paper Invoice CSS styles */
          .paper-invoice {
            max-width: ${settings.invoice_width || 800}px;
            margin: 0 auto;
            color: #1e293b;
            padding: 0.3in 10px;
          }
          .paper-invoice .invoice-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 24px;
            padding-bottom: 16px;
          }
          .paper-invoice .store-details h2 {
            font-size: 22px;
            font-weight: 700;
            color: #0f172a;
          }
          .paper-invoice .invoice-meta {
            text-align: right;
          }
          .paper-invoice .invoice-meta h1 {
            font-size: 26px;
            font-weight: 800;
            color: #1e293b;
            letter-spacing: -0.5px;
          }
          .paper-invoice .billing-details {
            margin-bottom: 20px;
            background: #f8fafc;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
          }
          .paper-invoice .billing-details h3 {
            font-size: 13px;
            font-weight: 700;
            margin-bottom: 4px;
            color: #475569;
            text-transform: uppercase;
          }
          .paper-invoice .items-table th, .paper-invoice .items-table td {
            padding: 10px 12px;
            font-size: 12px;
          }
          .paper-invoice .invoice-bottom {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
            gap: 40px;
          }
          .paper-invoice .notes-area {
            flex: 1;
            font-size: 11px;
            color: #64748b;
            line-height: 1.5;
          }
          .paper-invoice .totals-area {
            width: 300px;
          }
          .paper-invoice .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 13px;
            border-bottom: 1px solid #e2e8f0;
          }
          .paper-invoice .totals-row.grand {
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
            border-bottom: 2px solid #0f172a;
            padding: 8px 0;
          }
          .paper-invoice .totals-row.paid {
            font-size: 13px;
            color: #10b981;
            border: none;
          }
          .paper-invoice .signature-line {
            display: flex;
            justify-content: space-between;
            margin-top: 60px;
            font-size: 12px;
          }
          .paper-invoice .sig-box {
            text-align: center;
          }
          
          /* Modern Minimalist Theme */
          .paper-invoice.theme-modern .invoice-top {
            border-bottom: 3px solid #3b82f6;
          }
          .paper-invoice.theme-modern .items-table th {
            background: #3b82f6;
            color: #fff;
          }
          
          /* Classic Business Theme */
          .paper-invoice.theme-classic .invoice-top {
            border-bottom: 4px double #000;
          }
          .paper-invoice.theme-classic .items-table th {
            background: #000;
            color: #fff;
          }
          .paper-invoice.theme-classic .billing-details {
            background: #fff;
            border-radius: 0;
            border: 2px solid #000;
          }

          /* Compact Invoice Theme */
          .paper-invoice.theme-compact {
            font-size: 11px;
          }
          .paper-invoice.theme-compact .invoice-top {
            margin-bottom: 12px;
            padding-bottom: 8px;
          }
          .paper-invoice.theme-compact .items-table th, .paper-invoice.theme-compact .items-table td {
            padding: 6px 8px;
          }
          
          @media print {
            body { padding: 0 !important; }
            body.receipt-body { padding: 1mm !important; }
            body.receipt-body .thermal-receipt { width: 100% !important; max-width: 100% !important; }
            .product-label { border: none !important; }
            .paper-invoice { width: 100% !important; padding: 0 !important; margin: 0 !important; }
            thead { display: table-row-group !important; }
          }
        </style></head><body class="${bodyClass}">${html}</body></html>`);
      w.document.close();
      setTimeout(() => { w.print(); }, 400);
    },

    async printOrder(order, items, localPayments = null) {
      const S = POS.Store;
      const settings = await S.getSettings();
      const printType = settings.default_print_type || 'receipt';

      let paymentsList = localPayments;
      if (!paymentsList) {
        try {
          const pRes = await fetch(`${window.location.origin}/api/payments`, {
            headers: S.getHeaders()
          });
          if (pRes.ok) {
            const allP = await pRes.json();
            paymentsList = allP.filter(p => p.orderId === order.id);
          }
        } catch (err) {
          console.error(err);
        }
      }
      if (!paymentsList) paymentsList = [];

      let itemsHtml = '';
      if (printType === 'receipt') {
        const isStyle3 = settings.receipt_style === 'style-3';
        items.forEach(item => {
          const varText = item.variationName ? ` (${this.esc(item.variationName)})` : '';
          if (isStyle3) {
            // Tabular Grid Layout
            itemsHtml += `
              <div class="receipt-item-row" style="display: grid; grid-template-columns: 1.5fr 30px 65px 75px; gap: 4px; padding: 5px 0; font-size: 8.5pt; text-align: right; align-items: center;">
                <span class="receipt-item-name" style="text-align: left; font-weight: 700; word-break: break-word;">${this.esc(item.productName)}${varText}</span>
                <span class="receipt-item-qty" style="text-align: center; color: #475569;">${item.qty}</span>
                <span class="receipt-item-price" style="color: #475569;">${this.formatCurrency(item.unitPrice)}</span>
                <strong class="receipt-item-total" style="color: #0f172a;">${this.formatCurrency(item.total || (item.unitPrice * item.qty))}</strong>
              </div>
            `;
          } else {
            // Block Layout for Style 1 & 2
            itemsHtml += `
              <div class="receipt-item-row" style="padding: 4px 0; border-bottom: 1px dashed #ddd; font-size: 8.5pt;">
                <div class="receipt-item-name" style="font-weight: 700; word-break: break-word;">${this.esc(item.productName)}${varText}</div>
                <div class="receipt-item-details" style="display: flex; justify-content: space-between; font-size: 8pt; color: #333; margin-top: 2px;">
                  <span>${item.qty} x ${this.formatCurrency(item.unitPrice)}</span>
                  <strong>${this.formatCurrency(item.total || (item.unitPrice * item.qty))}</strong>
                </div>
              </div>
            `;
          }
        });
      } else {
        items.forEach(item => {
          itemsHtml += `
            <tr>
              <td>${this.esc(item.productName)} ${item.variationName ? `<br><small style="color:#555">${this.esc(item.variationName)}</small>` : ''}</td>
              <td class="text-center">${item.qty}</td>
              <td class="text-right">${this.formatCurrency(item.unitPrice)}</td>
              <td class="text-right">${this.formatCurrency(item.total || (item.unitPrice * item.qty))}</td>
            </tr>
          `;
        });
      }

      const showStoreName = settings.invoice_show_store_name !== '0';
      const storeName = showStoreName ? (settings.store_name || '').trim() : '';
      const storeAddress = settings.store_address || '';
      const storePhone = settings.store_phone || '';

      let printContent = '';

      if (printType === 'receipt') {
        // Thermal Receipt layout
        printContent = `
          <div class="thermal-receipt ${settings.receipt_style || 'style-1'}">
            <hr style="margin-top: 0; margin-bottom: 8px;">
            <div style="text-align: center; margin-bottom: 8px;">
              ${settings.invoice_logo ? `<img src="${settings.invoice_logo}" style="max-width: 60px; max-height: 60px; object-fit: contain; margin-bottom: 6px; display: block; margin-left: auto; margin-right: auto;">` : ''}
              ${storeName ? `<h3 style="margin:0; font-size:12pt;">${this.esc(storeName)}</h3>` : ''}
              <p style="font-size:8pt; margin: 2px 0 0 0;">${this.esc(storeAddress)}</p>
              <p style="font-size:8pt; margin: 1px 0 0 0;">Phone: ${this.esc(storePhone)}</p>
              ${settings.store_website ? `<p style="font-size:8pt; margin: 1px 0 0 0;">Website: ${this.esc(settings.store_website)}</p>` : ''}
            </div>
            <hr>
            <div style="font-size: 8pt; line-height: 1.4; margin-bottom: 6px;">
              <div><strong>Invoice ID:</strong> ${order.invoiceId}</div>
              <div><strong>Customer:</strong> ${this.esc(order.customerName)} (${this.esc(order.customerPhone)})</div>
              <div><strong>Date:</strong> ${this.formatDateTime(order.date)}</div>
            </div>
            <hr>
            <div style="margin: 6px 0;">
              ${settings.receipt_style === 'style-3' ? `
                <div style="display: grid; grid-template-columns: 1.5fr 30px 65px 75px; gap: 4px; padding: 4px 0; border-bottom: 2px solid #475569; font-size: 8pt; font-weight: 700; text-align: right; text-transform: uppercase; color: #475569; margin-bottom: 4px;">
                  <span style="text-align: left;">Item Description</span>
                  <span style="text-align: center;">Qty</span>
                  <span>Price</span>
                  <span>Total</span>
                </div>
              ` : ''}
              ${itemsHtml}
            </div>
            
            <div class="totals" style="font-size: 8.5pt;">
              <p>Sub Total: <strong>${this.formatCurrency(order.subtotal)}</strong></p>
              ${order.discountAmount > 0 ? `<p>Discount: <strong style="color:#000">-${this.formatCurrency(order.discountAmount)}</strong></p>` : ''}
              ${order.taxAmount > 0 ? `<p>Tax (${order.taxPercent}%): <strong>${this.formatCurrency(order.taxAmount)}</strong></p>` : ''}
              <p style="font-size:10.5pt; font-weight:800; border-top:1px dashed #000; padding-top:4px; margin-top:4px;">Grand Total: <span>${this.formatCurrency(order.grandTotal)}</span></p>
            </div>

            ${paymentsList.length > 0 ? `
              <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #000; font-size: 8pt; line-height: 1.4;">
                <div style="font-weight: 700; margin-bottom: 2px;">Payment Details:</div>
                ${paymentsList.map(p => `
                  <div style="display: flex; justify-content: space-between;">
                    <span>• ${this.esc(p.method)}${(p.lastFour || p.lastfour) ? ` (xxxx-${p.lastFour || p.lastfour})` : ''}</span>
                    <strong>${this.formatCurrency(p.amount)}</strong>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            <hr>
            <div style="text-align: center; margin-top: 15px; font-size: 8pt;">
              ${settings.invoice_note ? `<p style="margin-bottom: 8px; font-style: italic; color:#333;">${this.esc(settings.invoice_note)}</p>` : ''}
              <p style="font-weight:700;">Thank you for shopping with us!</p>
              ${settings.store_website ? `<p style="font-size: 8pt; margin-top:4px; color:#555;">${this.esc(settings.store_website)}</p>` : ''}
              <p style="font-size: 7.5pt; margin-top:6px; color:#888;">Software by Zen IT</p>
            </div>
          </div>
        `;
      } else {
        // Paper A4 Invoice layout
        printContent = `
          <div class="paper-invoice ${settings.invoice_style || 'theme-modern'}">
            <div class="invoice-top">
              <div class="store-details" style="display:flex; align-items:center; gap:16px;">
                ${settings.invoice_logo ? `<img src="${settings.invoice_logo}" style="max-width: 80px; max-height: 80px; object-fit: contain; border-radius: 4px;">` : ''}
                <div>
                  ${storeName ? `<h2 style="margin:0;">${this.esc(storeName)}</h2>` : ''}
                  <p style="margin:2px 0 0 0; font-size:12px; color:#64748b;">${this.esc(storeAddress)}</p>
                  <p style="margin:1px 0 0 0; font-size:12px; color:#64748b;"><strong>Phone:</strong> ${this.esc(storePhone)}</p>
                  ${settings.store_website ? `<p style="margin:1px 0 0 0; font-size:12px; color:#64748b;"><strong>Website:</strong> ${this.esc(settings.store_website)}</p>` : ''}
                </div>
              </div>
              <div class="invoice-meta">
                <h1>RETAIL INVOICE</h1>
                <p><strong>Invoice ID:</strong> ${order.invoiceId}</p>
                <p><strong>Sales Date:</strong> ${this.formatDateTime(order.date)}</p>
              </div>
            </div>
            
            <div class="billing-details">
              <h3>Bill To:</h3>
              <p><strong>Customer Name:</strong> ${this.esc(order.customerName)}</p>
              <p><strong>Contact Phone:</strong> ${this.esc(order.customerPhone)}</p>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th style="text-align:left;">Item Description</th>
                  <th style="text-align:center; width:80px;">Qty</th>
                  <th style="text-align:right; width:120px;">Unit Price</th>
                  <th style="text-align:right; width:120px;">Total Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="invoice-bottom">
              <div class="notes-area">
                <p style="font-weight:700; margin-bottom:4px; color:var(--text-dark);">Terms & Conditions / Note</p>
                ${settings.invoice_note ? `<p style="white-space: pre-line; line-height: 1.5; color: #555;">${this.esc(settings.invoice_note)}</p>` : '<p>1. Goods once sold cannot be returned or exchanged.</p><p>2. Keep this invoice safe for any warranty claims.</p>'}
                <div style="margin-top: 15px; font-size: 11px; color:#475569;">
                  ${settings.store_website ? `<p>Website: <strong>${this.esc(settings.store_website)}</strong></p>` : ''}
                </div>
              </div>
              <div class="totals-area">
                <div class="totals-row">
                  <span>Sub Total:</span>
                  <strong>${this.formatCurrency(order.subtotal)}</strong>
                </div>
                ${order.discountAmount > 0 ? `
                  <div class="totals-row text-danger">
                    <span>Discount:</span>
                    <strong>-${this.formatCurrency(order.discountAmount)}</strong>
                  </div>
                ` : ''}
                ${order.taxAmount > 0 ? `
                  <div class="totals-row">
                    <span>Tax (${order.taxPercent}%):</span>
                    <strong>${this.formatCurrency(order.taxAmount)}</strong>
                  </div>
                ` : ''}
                <div class="totals-row grand">
                  <span>Grand Total:</span>
                  <strong>${this.formatCurrency(order.grandTotal)}</strong>
                </div>

                ${paymentsList.length > 0 ? `
                  <div style="margin-top:12px; border-top:1px dashed #cbd5e1; padding-top:8px; font-size:11px;">
                    <div style="font-weight:700; color:#475569; margin-bottom:4px;">Payment Method:</div>
                    ${paymentsList.map(p => `
                      <div class="totals-row" style="border:none; padding:2px 0;">
                        <span>• ${this.esc(p.method)}${(p.lastFour || p.lastfour) ? ` (xxxx-${p.lastFour || p.lastfour})` : ''}</span>
                        <strong>${this.formatCurrency(p.amount)}</strong>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            </div>

            <div class="signature-line">
              <div class="sig-box">
                <div style="border-top:1px solid #94a3b8; width:180px; margin-top:50px;">Customer Signature</div>
              </div>
              <div class="sig-box">
                <div style="border-top:1px solid #94a3b8; width:180px; margin-top:50px;">Authorized Signature</div>
              </div>
            </div>
          </div>
        `;
      }

      this.printHTML(printContent, `Invoice ${order.invoiceId}`, settings);
    },

    /* ── Toast Notification ────────────────────────── */
    showToast(message, type) {
      type = type || 'success';
      const icons = { success: '✓', error: '✗', info: 'ⓘ', warning: '⚠' };
      const toast = document.createElement('div');
      toast.className = 'toast toast-' + type;
      toast.innerHTML = '<span class="toast-icon">' + (icons[type] || 'ⓘ') + '</span><span>' + message + '</span>';
      document.body.appendChild(toast);
      requestAnimationFrame(() => toast.classList.add('show'));
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 350);
      }, 3000);
    },

    /* ── Confirm Dialog ────────────────────────────── */
    confirm(message) {
      return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        overlay.innerHTML = `
          <div class="modal" style="max-width:420px">
            <div class="modal-header"><h3>Confirm Action</h3>
              <button class="modal-close" id="confirm-close">&times;</button></div>
            <div class="modal-body"><p style="font-size:15px">${message}</p></div>
            <div class="modal-footer">
              <button class="btn btn-secondary" id="confirm-no">Cancel</button>
              <button class="btn btn-danger" id="confirm-yes">Confirm</button>
            </div>
          </div>`;
        document.body.appendChild(overlay);
        const close = (val) => { overlay.remove(); resolve(val); };
        overlay.querySelector('#confirm-yes').onclick = () => close(true);
        overlay.querySelector('#confirm-no').onclick = () => close(false);
        overlay.querySelector('#confirm-close').onclick = () => close(false);
      });
    },

    /* ── Debounce ──────────────────────────────────── */
    debounce(fn, ms) {
      let t; return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms || 300); };
    },

    /* ── Escape HTML ──────────────────────────────── */
    esc(str) {
      const d = document.createElement('div');
      d.textContent = str || '';
      return d.innerHTML;
    },

    /* ── Payment methods & Presets ────────────────── */
    _paymentMethodsCache: null,

    async loadPaymentMethods(forceRefresh = false) {
      if (!forceRefresh && this._paymentMethodsCache && this._paymentMethodsCache.length > 0) {
        return this._paymentMethodsCache;
      }
      try {
        if (window.POS && window.POS.Store) {
          const list = await window.POS.Store.getAll('payment-methods');
          if (Array.isArray(list) && list.length > 0) {
            this._paymentMethodsCache = list;
            return this._paymentMethodsCache;
          }
        }
      } catch (err) {
        console.warn('Could not load payment methods from backend:', err);
      }

      this._paymentMethodsCache = [
        { id: 'pm-cash', name: 'Cash', code: 'CASH', color: '#059669', iconType: 'preset', iconValue: 'cash', requiresLastFour: 0, status: 'active', isDefault: 1, sortOrder: 1 },
        { id: 'pm-card', name: 'Card', code: 'CARD', color: '#4338CA', iconType: 'preset', iconValue: 'card', requiresLastFour: 1, status: 'active', isDefault: 1, sortOrder: 2 },
        { id: 'pm-bkash', name: 'bKash', code: 'BKASH', color: '#E2136E', iconType: 'preset', iconValue: 'bkash', requiresLastFour: 1, status: 'active', isDefault: 1, sortOrder: 3 },
        { id: 'pm-nagad', name: 'Nagad', code: 'NAGAD', color: '#F7941D', iconType: 'preset', iconValue: 'nagad', requiresLastFour: 1, status: 'active', isDefault: 1, sortOrder: 4 },
        { id: 'pm-rocket', name: 'Rocket', code: 'ROCKET', color: '#8C3494', iconType: 'preset', iconValue: 'rocket', requiresLastFour: 1, status: 'active', isDefault: 1, sortOrder: 5 },
        { id: 'pm-bank', name: 'Bank Transfer', code: 'BANK', color: '#2563EB', iconType: 'preset', iconValue: 'bank', requiresLastFour: 1, status: 'active', isDefault: 1, sortOrder: 6 },
        { id: 'pm-other', name: 'Other', code: 'OTHER', color: '#64748B', iconType: 'preset', iconValue: 'wallet', requiresLastFour: 0, status: 'active', isDefault: 1, sortOrder: 7 }
      ];
      return this._paymentMethodsCache;
    },

    get paymentMethods() {
      if (this._paymentMethodsCache && this._paymentMethodsCache.length > 0) {
        return this._paymentMethodsCache
          .filter(m => m.status !== 'inactive')
          .map(m => m.name);
      }
      return ['Cash', 'Card', 'bKash', 'Nagad', 'Rocket', 'Bank Transfer', 'Other'];
    },

    /* ── Customer labels ──────────────────────────── */
    customerLabels: ['Regular', 'VIP', 'Elite', 'Wholesale', 'Premium', 'New'],

    labelColors: {
      Regular: '#64748b', VIP: '#7c3aed', Elite: '#d97706',
      Wholesale: '#059669', Premium: '#2563eb', New: '#06b6d4'
    },

    getPaymentMethodColor(method) {
      if (!method) return '#64748B';
      const mName = String(method).toLowerCase().trim();

      // Check loaded cache
      if (this._paymentMethodsCache) {
        const found = this._paymentMethodsCache.find(p => (p.name || '').toLowerCase().trim() === mName);
        if (found && found.color) return found.color;
      }

      switch (mName) {
        case 'bkash': return '#E2136E';
        case 'nagad': return '#F7941D';
        case 'rocket': return '#8C3494';
        case 'bank transfer':
        case 'bank': return '#2563EB';
        case 'cash': return '#059669';
        case 'card': return '#4338CA';
        default: return '#0d9488';
      }
    },

    getPaymentPresetIcons() {
      return [
        { id: 'cash', label: 'Cash Bill' },
        { id: 'card', label: 'Credit / Debit Card' },
        { id: 'mobile', label: 'Mobile Banking / MFS' },
        { id: 'wallet', label: 'Digital Wallet' },
        { id: 'bank', label: 'Bank Institution' },
        { id: 'qr', label: 'QR Scan Code' },
        { id: 'pos', label: 'POS Terminal' },
        { id: 'coin', label: 'Coin / Cash Flow' },
        { id: 'shield', label: 'Secure Escrow' },
        { id: 'check', label: 'Cheque / Draft' },
        { id: 'bkash', label: 'bKash Brand' },
        { id: 'nagad', label: 'Nagad Brand' },
        { id: 'rocket', label: 'Rocket Brand' }
      ];
    },

    renderPresetIcon(presetId, size = 28, bg = '#f8fafc', color = '#0d9488') {
      const pid = String(presetId || '').toLowerCase().trim();
      const s = size;

      switch (pid) {
        case 'bkash':
          return `<svg viewBox="0 0 48 48" width="${s}" height="${s}" fill="none" xmlns="http://www.w3.org/2000/svg" style="border-radius:6px; flex-shrink:0;">
            <rect width="48" height="48" rx="8" fill="#E2136E"/>
            <path d="M12 18L24 10L19 25Z" fill="#FFFFFF"/>
            <path d="M24 10L38 15L27 24Z" fill="#FCE4EC"/>
            <path d="M19 25L24 10L24 37Z" fill="#F8BBD0"/>
            <path d="M27 24L24 10L24 37Z" fill="#FFFFFF"/>
            <path d="M12 18L19 25L15 29Z" fill="#F48FB1"/>
            <path d="M38 15L27 24L32 29Z" fill="#FFFFFF"/>
            <path d="M24 37L19 25L24 29Z" fill="#F06292"/>
            <path d="M24 37L27 24L24 29Z" fill="#F8BBD0"/>
          </svg>`;

        case 'nagad':
          return `<svg viewBox="0 0 48 48" width="${s}" height="${s}" fill="none" xmlns="http://www.w3.org/2000/svg" style="border-radius:6px; flex-shrink:0;">
            <rect width="48" height="48" rx="8" fill="#FFF7ED"/>
            <path d="M14 34C11 28 12 18 22 12C26 9 31 8 28 14C25 20 20 22 20 26C20 31 23 34 27 34C33 34 36 28 36 21C36 17 38 15 40 18C43 23 42 32 35 37C30 41 19 42 14 34Z" fill="#F7941D"/>
            <path d="M22 26C22 23 24 19 27 16C28 15 29 17 28 19C26 22 25 24 26 26C27 28 29 29 31 28C32 29 30 31 28 31C25 31 22 29 22 26Z" fill="#ED1C24"/>
          </svg>`;

        case 'rocket':
          return `<svg viewBox="0 0 48 48" width="${s}" height="${s}" fill="none" xmlns="http://www.w3.org/2000/svg" style="border-radius:6px; flex-shrink:0;">
            <rect width="48" height="48" rx="8" fill="#FDF2F8"/>
            <path d="M16 32C14.5 30.5 14 27 15 25L23 17C26 14 30 13 33 13C33 16 32 20 29 23L21 31C19 32 17.5 33.5 16 32Z" fill="#8C3494"/>
            <path d="M15 25L12 27L14 30L16 32L19 34L21 31" fill="#701A75"/>
            <path d="M13 33L10 38L15 35" fill="#EF4444"/>
            <circle cx="27" cy="19" r="2" fill="#FFFFFF"/>
          </svg>`;

        case 'cash':
          return `<svg viewBox="0 0 48 48" width="${s}" height="${s}" fill="none" xmlns="http://www.w3.org/2000/svg" style="border-radius:6px; flex-shrink:0;">
            <rect width="48" height="48" rx="8" fill="#ECFDF5"/>
            <rect x="10" y="15" width="28" height="18" rx="3" stroke="#059669" stroke-width="2.5" fill="#D1FAE5"/>
            <circle cx="24" cy="24" r="4" stroke="#059669" stroke-width="2"/>
            <path d="M14 19V19.01M34 29V29.01" stroke="#059669" stroke-width="2.5" stroke-linecap="round"/>
          </svg>`;

        case 'card':
          return `<svg viewBox="0 0 48 48" width="${s}" height="${s}" fill="none" xmlns="http://www.w3.org/2000/svg" style="border-radius:6px; flex-shrink:0;">
            <rect width="48" height="48" rx="8" fill="#EEF2FF"/>
            <rect x="10" y="15" width="28" height="18" rx="3" fill="#4338CA"/>
            <rect x="10" y="20" width="28" height="4" fill="#312E81"/>
            <rect x="14" y="27" width="5" height="3" rx="1" fill="#FBBF24"/>
            <line x1="22" y1="28" x2="33" y2="28" stroke="#A5B4FC" stroke-width="2" stroke-linecap="round"/>
          </svg>`;

        case 'bank':
          return `<svg viewBox="0 0 48 48" width="${s}" height="${s}" fill="none" xmlns="http://www.w3.org/2000/svg" style="border-radius:6px; flex-shrink:0;">
            <rect width="48" height="48" rx="8" fill="#EFF6FF"/>
            <path d="M12 36H36M12 21H36M14 17L24 11L34 17H14ZM16 21V33M21 21V33M27 21V33M32 21V33" stroke="#1E40AF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="35" cy="33" r="6" fill="#2563EB"/>
            <path d="M33 33H37M35 31L37 33L35 35" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`;

        case 'mobile':
          return `<svg viewBox="0 0 48 48" width="${s}" height="${s}" fill="none" xmlns="http://www.w3.org/2000/svg" style="border-radius:6px; flex-shrink:0;">
            <rect width="48" height="48" rx="8" fill="#F0FDF4"/>
            <rect x="15" y="10" width="18" height="28" rx="3" stroke="#16a34a" stroke-width="2.5" fill="#DCFCE7"/>
            <line x1="21" y1="14" x2="27" y2="14" stroke="#16a34a" stroke-width="2" stroke-linecap="round"/>
            <circle cx="24" cy="33" r="2" fill="#16a34a"/>
          </svg>`;

        case 'qr':
          return `<svg viewBox="0 0 48 48" width="${s}" height="${s}" fill="none" xmlns="http://www.w3.org/2000/svg" style="border-radius:6px; flex-shrink:0;">
            <rect width="48" height="48" rx="8" fill="#F8FAFC"/>
            <rect x="12" y="12" width="10" height="10" rx="1.5" stroke="#0f172a" stroke-width="2" fill="#e2e8f0"/>
            <rect x="26" y="12" width="10" height="10" rx="1.5" stroke="#0f172a" stroke-width="2" fill="#e2e8f0"/>
            <rect x="12" y="26" width="10" height="10" rx="1.5" stroke="#0f172a" stroke-width="2" fill="#e2e8f0"/>
            <rect x="15" y="15" width="4" height="4" fill="#0f172a"/>
            <rect x="29" y="15" width="4" height="4" fill="#0f172a"/>
            <rect x="15" y="29" width="4" height="4" fill="#0f172a"/>
            <rect x="26" y="26" width="4" height="4" fill="#0f172a"/>
            <rect x="32" y="32" width="4" height="4" fill="#0f172a"/>
          </svg>`;

        case 'pos':
          return `<svg viewBox="0 0 48 48" width="${s}" height="${s}" fill="none" xmlns="http://www.w3.org/2000/svg" style="border-radius:6px; flex-shrink:0;">
            <rect width="48" height="48" rx="8" fill="#F1F5F9"/>
            <rect x="14" y="10" width="20" height="28" rx="3" stroke="#334155" stroke-width="2.5" fill="#FFFFFF"/>
            <rect x="17" y="14" width="14" height="8" rx="1" fill="#0d9488"/>
            <circle cx="18" cy="27" r="1.2" fill="#64748b"/><circle cx="24" cy="27" r="1.2" fill="#64748b"/><circle cx="30" cy="27" r="1.2" fill="#64748b"/>
            <circle cx="18" cy="32" r="1.2" fill="#64748b"/><circle cx="24" cy="32" r="1.2" fill="#64748b"/><circle cx="30" cy="32" r="1.2" fill="#64748b"/>
          </svg>`;

        case 'coin':
          return `<svg viewBox="0 0 48 48" width="${s}" height="${s}" fill="none" xmlns="http://www.w3.org/2000/svg" style="border-radius:6px; flex-shrink:0;">
            <rect width="48" height="48" rx="8" fill="#FEF3C7"/>
            <circle cx="24" cy="24" r="14" stroke="#D97706" stroke-width="2.5" fill="#FDE68A"/>
            <circle cx="24" cy="24" r="10" stroke="#B45309" stroke-width="1.5" stroke-dasharray="2 2"/>
            <text x="24" y="28" font-size="13" font-weight="bold" fill="#B45309" text-anchor="middle" font-family="sans-serif">৳</text>
          </svg>`;

        case 'shield':
          return `<svg viewBox="0 0 48 48" width="${s}" height="${s}" fill="none" xmlns="http://www.w3.org/2000/svg" style="border-radius:6px; flex-shrink:0;">
            <rect width="48" height="48" rx="8" fill="#F0FDF4"/>
            <path d="M24 10L35 15V23C35 30 29 36 24 38C19 36 13 30 13 23V15L24 10Z" fill="#DCFCE7" stroke="#16A34A" stroke-width="2.5"/>
            <path d="M20 24L23 27L29 20" stroke="#15803D" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`;

        case 'check':
          return `<svg viewBox="0 0 48 48" width="${s}" height="${s}" fill="none" xmlns="http://www.w3.org/2000/svg" style="border-radius:6px; flex-shrink:0;">
            <rect width="48" height="48" rx="8" fill="#F5F3FF"/>
            <rect x="10" y="16" width="28" height="16" rx="2" stroke="#7C3AED" stroke-width="2" fill="#FFFFFF"/>
            <line x1="14" y1="21" x2="26" y2="21" stroke="#7C3AED" stroke-width="2"/>
            <line x1="14" y1="26" x2="22" y2="26" stroke="#DDD6FE" stroke-width="2"/>
            <line x1="28" y1="26" x2="34" y2="26" stroke="#7C3AED" stroke-width="1.5"/>
          </svg>`;

        case 'wallet':
        default:
          return `<svg viewBox="0 0 48 48" width="${s}" height="${s}" fill="none" xmlns="http://www.w3.org/2000/svg" style="border-radius:6px; flex-shrink:0;">
            <rect width="48" height="48" rx="8" fill="#F1F5F9"/>
            <rect x="11" y="14" width="26" height="20" rx="4" stroke="#475569" stroke-width="2.5" fill="#FFFFFF"/>
            <path d="M28 24H35V28H28C26.8954 24 26.8954 28 28 24Z" fill="#CBD5E1" stroke="#475569" stroke-width="2"/>
            <circle cx="30.5" cy="26" r="1.5" fill="#0F172A"/>
            <path d="M11 19H37" stroke="#475569" stroke-width="2"/>
          </svg>`;
      }
    },

    getPaymentMethodIcon(method, size = 28) {
      if (!method) return this.renderPresetIcon('wallet', size);

      let found = null;
      if (typeof method === 'object') {
        found = method;
      } else if (this._paymentMethodsCache) {
        const mName = String(method).toLowerCase().trim();
        found = this._paymentMethodsCache.find(p => (p.name || '').toLowerCase().trim() === mName);
      }

      if (found) {
        if (found.iconType === 'image' && found.iconValue) {
          return `<img src="${this.esc(found.iconValue)}" width="${size}" height="${size}" alt="${this.esc(found.name)}" style="width:${size}px; height:${size}px; object-fit:contain; border-radius:6px; flex-shrink:0; background:#fff; border:1px solid #e2e8f0; padding:2px; display:inline-block;" />`;
        }
        if (found.iconType === 'svg' && found.iconValue && found.iconValue.includes('<svg')) {
          return `<div style="width:${size}px; height:${size}px; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; border-radius:6px; overflow:hidden;">${found.iconValue}</div>`;
        }
        if (found.iconValue) {
          return this.renderPresetIcon(found.iconValue, size, '#f8fafc', found.color || '#0d9488');
        }
      }

      const m = String(typeof method === 'object' ? (method.name || '') : method).toLowerCase().trim();
      return this.renderPresetIcon(m, size);
    }
  };

  window.POS = window.POS || {};
  window.POS.Helpers = Helpers;
})();
