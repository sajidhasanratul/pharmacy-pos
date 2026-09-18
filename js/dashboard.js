(function () {
  'use strict';

  const Dashboard = {
    async render() {
      const mc = document.getElementById('main-content');
      const H = POS.Helpers;
      const today = H.today();

      // Get initial date range filters
      let fromDate = localStorage.getItem('dash_from') || today;
      let toDate = localStorage.getItem('dash_to') || today;

      mc.innerHTML = `
        <div class="page-header fade-in">
          <div>
            <h2 class="page-title">Dashboard Overview</h2>
            <p class="page-subtitle">Welcome to your pharmacy sales performance and real-time operations overview.</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-secondary btn-sm" id="btn-today">Today</button>
            <button class="btn btn-secondary btn-sm" id="btn-this-month">This Month</button>
          </div>
        </div>

        <div class="filter-bar fade-in" style="display:flex; align-items:center; gap:16px;">
          <div class="form-group" style="margin-bottom:0; flex: 1; min-width: 150px;">
            <label class="form-label">From Date</label>
            <input type="date" class="form-input" id="dash-from" value="${fromDate}">
          </div>
          <div class="form-group" style="margin-bottom:0; flex: 1; min-width: 150px;">
            <label class="form-label">To Date</label>
            <input type="date" class="form-input" id="dash-to" value="${toDate}">
          </div>
          <button class="btn btn-primary" id="btn-filter" style="margin-top: 18px;">Apply Filter</button>
        </div>

        <div class="stats-grid fade-in" id="dashboard-stats" style="margin-bottom:24px;">
          <div style="grid-column: 1/-1; text-align: center; padding: 24px;">
            <div class="spinner" style="margin: 0 auto 10px;"></div>
            <span style="color:#64748b; font-size:13px;">Loading sales statistics...</span>
          </div>
        </div>

        <div class="grid-2 fade-in" style="margin-bottom:24px;">
          <div class="card">
            <div class="card-header" style="font-weight:700; font-size:14px; display:flex; align-items:center; gap:8px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
              Sales Trend
            </div>
            <div class="card-body">
              <div class="chart-container" style="height:260px;">
                <canvas id="salesTrendChart"></canvas>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-header" style="font-weight:700; font-size:14px; display:flex; align-items:center; gap:8px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
              Payment Method Breakdown
            </div>
            <div class="card-body">
              <div class="chart-container" style="height:260px;">
                <canvas id="paymentMethodChart"></canvas>
              </div>
            </div>
          </div>
        </div>

        <div class="card fade-in" style="margin-bottom:24px;">
          <div class="card-header" style="font-weight:700; font-size:14px; display:flex; align-items:center; gap:8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            24-Hour Sales Distribution (Hourly Peaks)
          </div>
          <div class="card-body">
            <div class="chart-container" style="height: 250px; position: relative;">
              <canvas id="hourlySalesChart"></canvas>
            </div>
          </div>
        </div>

        <div class="card fade-in">
          <div class="card-header" style="font-weight:700; font-size:14px; display:flex; align-items:center; gap:8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            Top Selling Medicines
          </div>
          <div class="card-body" style="padding:0;">
            <div class="table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Medicine Name</th>
                    <th class="text-center" style="width:120px;">Units Sold</th>
                    <th class="text-right" style="width:160px;">Total Revenue</th>
                  </tr>
                </thead>
                <tbody id="top-selling-tbody"></tbody>
              </table>
            </div>
          </div>
        </div>
      `;

      // Event listeners
      document.getElementById('btn-filter').onclick = async () => {
        fromDate = document.getElementById('dash-from').value;
        toDate = document.getElementById('dash-to').value;
        localStorage.setItem('dash_from', fromDate);
        localStorage.setItem('dash_to', toDate);
        await this.updateStats(fromDate, toDate);
      };

      document.getElementById('btn-today').onclick = () => {
        const t = H.today();
        document.getElementById('dash-from').value = t;
        document.getElementById('dash-to').value = t;
        document.getElementById('btn-filter').click();
      };

      document.getElementById('btn-this-month').onclick = () => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        document.getElementById('dash-from').value = `${y}-${m}-01`;
        document.getElementById('dash-to').value = H.today();
        document.getElementById('btn-filter').click();
      };

      // Initial stats load
      await this.updateStats(fromDate, toDate);
    },

    async updateStats(from, to) {
      const S = POS.Store;
      const H = POS.Helpers;

      const orders = await S.query('orders', o => H.isDateInRange(o.date, from, to));
      const orderItems = await S.getAll('orderItems');
      const payments = await S.getAll('payments');
      const products = await S.getAll('products');

      let totalSales = 0;
      let totalDue = 0;
      let cashSales = 0;
      let cardSales = 0;
      const paymentBreakdown = {};

      H.paymentMethods.forEach(method => {
        paymentBreakdown[method] = 0;
      });

      orders.forEach(order => {
        totalSales += parseFloat(order.grandTotal) || 0;
        totalDue += parseFloat(order.dueAmount) || 0;

        // Sum payment methods for this order
        const ordPayments = payments.filter(p => p.orderId === order.id);
        ordPayments.forEach(p => {
          const amt = parseFloat(p.amount) || 0;
          if (paymentBreakdown[p.method] !== undefined) {
            paymentBreakdown[p.method] += amt;
          } else {
            paymentBreakdown[p.method] = amt;
          }
          if (p.method === 'Cash') cashSales += amt;
          if (p.method === 'Card') cardSales += amt;
        });
      });

      // Calculate profit: Sell Price - Cost Price (including custom products)
      let totalProfit = 0;
      orders.forEach(order => {
        const items = orderItems.filter(i => i.orderId === order.id);
        let orderCost = 0;
        items.forEach(item => {
          let cost = item.costPrice !== undefined && item.costPrice !== null && !isNaN(parseFloat(item.costPrice))
            ? parseFloat(item.costPrice)
            : null;

          if (cost === null) {
            const product = products.find(p => p.id === item.productId);
            if (product) {
              if (product.variations && product.variations.length > 0) {
                const variant = product.variations.find(v => v.name === item.variationName || (product.name + ' ' + v.name) === item.productName);
                cost = variant ? parseFloat(variant.costPrice || 0) : parseFloat(product.costPrice || 0);
              } else {
                cost = parseFloat(product.costPrice || 0);
              }
            } else {
              cost = 0;
            }
          }
          orderCost += (cost * item.qty);
        });

        const discountAllocated = parseFloat(order.discountAmount) || 0;
        const profitForOrder = (parseFloat(order.subtotal) || 0) - orderCost - discountAllocated;
        totalProfit += profitForOrder;
      });

      // Render Summary Cards with high contrast and authentic SVGs
      const statsGrid = document.getElementById('dashboard-stats');
      statsGrid.innerHTML = `
        <div class="stat-card purple" style="border-left: 4px solid #0d9488;">
          <div class="stat-icon" style="color: #0d9488; background: #ccfbf1;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
          <div class="stat-info">
            <div class="stat-label">Total Revenue</div>
            <div class="stat-value" style="display:flex; align-items:baseline; gap:8px; flex-wrap:wrap;">
              <span>${H.formatCurrency(totalSales)}</span>
              <span style="font-size: 11px; font-weight: 700; color: #047857; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 2px 8px; border-radius: 12px;">${orders.length} Sales</span>
            </div>
            <div class="stat-sub">Invoiced Collections</div>
          </div>
        </div>

        <div class="stat-card green" style="border-left: 4px solid #10b981;">
          <div class="stat-icon" style="color: #10b981; background: #d1fae5;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
          </div>
          <div class="stat-info">
            <div class="stat-label">Gross Profit</div>
            <div class="stat-value">${H.formatCurrency(totalProfit)}</div>
            <div class="stat-sub">Estimated Net Margin</div>
          </div>
        </div>

        <div class="stat-card orange" style="border-left: 4px solid #3b82f6;">
          <div class="stat-icon" style="color: #2563eb; background: #eff6ff;">
            ${H.getPaymentMethodIcon('Card', 24)}
          </div>
          <div class="stat-info">
            <div class="stat-label">Card Sales</div>
            <div class="stat-value">${H.formatCurrency(cardSales)}</div>
            <div class="stat-sub">POS Terminal Sales</div>
          </div>
        </div>

        <div class="stat-card blue" style="border-left: 4px solid #059669;">
          <div class="stat-icon" style="color: #059669; background: #ecfdf5;">
            ${H.getPaymentMethodIcon('Cash', 24)}
          </div>
          <div class="stat-info">
            <div class="stat-label">Cash In Drawer</div>
            <div class="stat-value">${H.formatCurrency(cashSales)}</div>
            <div class="stat-sub">Physical Cash Tender</div>
          </div>
        </div>
      `;

      // Render other payment channel cards (bKash, Nagad, Rocket, Bank Transfer)
      let pbHtml = '';
      Object.entries(paymentBreakdown).forEach(([method, amount]) => {
        if (amount > 0 && method !== 'Cash' && method !== 'Card') {
          const icon = H.getPaymentMethodIcon(method, 24);
          const color = H.getPaymentMethodColor(method);
          pbHtml += `
            <div class="stat-card" style="border-left: 4px solid ${color};">
              <div class="stat-icon" style="background: #f8fafc;">
                ${icon}
              </div>
              <div class="stat-info">
                <div class="stat-label">${method}</div>
                <div class="stat-value">${H.formatCurrency(amount)}</div>
                <div class="stat-sub">Mobile / Digital Transfer</div>
              </div>
            </div>
          `;
        }
      });
      if (pbHtml) {
        statsGrid.insertAdjacentHTML('beforeend', pbHtml);
      }

      // Charts & Top Selling
      this.renderCharts(orders, paymentBreakdown, from, to);
      this.renderTopSelling(orders, orderItems);
    },

    renderCharts(orders, paymentBreakdown, from, to) {
      const H = POS.Helpers;

      const diffTime = Math.abs(new Date(to) - new Date(from));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      // 1. Sales Trend (by day)
      const dailySales = {};
      orders.forEach(o => {
        const day = H.formatDate(o.date);
        dailySales[day] = (dailySales[day] || 0) + parseFloat(o.grandTotal || 0);
      });

      const trendLabels = Object.keys(dailySales).reverse();
      const trendData = Object.values(dailySales).reverse();

      const ctxTrend = document.getElementById('salesTrendChart').getContext('2d');
      if (window.trendChart) window.trendChart.destroy();
      window.trendChart = new Chart(ctxTrend, {
        type: 'line',
        data: {
          labels: trendLabels.length ? trendLabels : ['No Data'],
          datasets: [{
            label: 'Sales Amount',
            data: trendData.length ? trendData : [0],
            borderColor: '#0d9488',
            backgroundColor: 'rgba(13, 148, 136, 0.1)',
            fill: true,
            tension: 0.3,
            borderWidth: 2,
            pointBackgroundColor: '#0d9488'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true }
          }
        }
      });

      // 2. Payment Method Distribution
      const payLabels = Object.keys(paymentBreakdown).filter(k => paymentBreakdown[k] > 0);
      const payData = payLabels.map(k => paymentBreakdown[k]);
      const payColors = payLabels.map(k => H.getPaymentMethodColor(k));

      const ctxPay = document.getElementById('paymentMethodChart').getContext('2d');
      if (window.payChart) window.payChart.destroy();
      window.payChart = new Chart(ctxPay, {
        type: 'doughnut',
        data: {
          labels: payLabels.length ? payLabels : ['No Sales'],
          datasets: [{
            data: payData.length ? payData : [1],
            backgroundColor: payColors.length ? payColors : ['#cbd5e1']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });

      // 3. 24-Hour Distribution (Hourly peaks)
      const hourlyCounts = Array(24).fill(0);
      orders.forEach(o => {
        const hr = new Date(o.date).getHours();
        if (hr >= 0 && hr < 24) {
          hourlyCounts[hr]++;
        }
      });

      const hourlyData = diffDays > 2 
        ? hourlyCounts.map(c => parseFloat((c / diffDays).toFixed(2))) 
        : hourlyCounts;

      const hourLabels = Array.from({ length: 24 }, (_, i) => {
        const h = i % 12 || 12;
        const ampm = i < 12 ? 'AM' : 'PM';
        return `${h} ${ampm}`;
      });

      const ctxHour = document.getElementById('hourlySalesChart').getContext('2d');
      if (window.hourChart) window.hourChart.destroy();
      window.hourChart = new Chart(ctxHour, {
        type: 'bar',
        data: {
          labels: hourLabels,
          datasets: [{
            label: diffDays > 2 ? 'Avg Orders / Hour' : 'Total Orders / Hour',
            data: hourlyData,
            backgroundColor: 'rgba(13, 148, 136, 0.75)',
            borderColor: '#0d9488',
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `Orders: ${context.raw}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { precision: 0 }
            }
          }
        }
      });
    },

    renderTopSelling(orders, orderItems) {
      const H = POS.Helpers;
      const orderIds = orders.map(o => o.id);
      const items = orderItems.filter(i => orderIds.includes(i.orderId));

      const totals = {};
      items.forEach(i => {
        const key = i.productName + (i.variationName ? ` (${i.variationName})` : '');
        if (!totals[key]) {
          totals[key] = { qty: 0, amount: 0 };
        }
        totals[key].qty += parseInt(i.qty) || 0;
        totals[key].amount += parseFloat(i.total) || 0;
      });

      const sorted = Object.entries(totals)
        .sort((a, b) => b[1].qty - a[1].qty)
        .slice(0, 5);

      const tbody = document.getElementById('top-selling-tbody');
      if (!tbody) return;
      tbody.innerHTML = '';

      if (sorted.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted" style="padding:24px;">No sales data available in selected period.</td></tr>`;
        return;
      }

      sorted.forEach(([name, data]) => {
        tbody.innerHTML += `
          <tr>
            <td style="font-weight:600; color:#1e293b;">${H.esc(name)}</td>
            <td class="text-center" style="font-weight:700; color:#475569;">${data.qty}</td>
            <td class="text-right" style="font-weight:700; color:#0d9488;">${H.formatCurrency(data.amount)}</td>
          </tr>
        `;
      });
    }
  };

  window.POS = window.POS || {};
  window.POS.Dashboard = Dashboard;
})();
