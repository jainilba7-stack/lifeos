/* LifeOS Main Dashboard & Responsive App Navigation Controller */

document.addEventListener('DOMContentLoaded', async () => {
  checkAuth();
  setupResponsiveNavigation();
  setupUserInfo();
  if (document.getElementById('stat-tasks')) {
    await loadDashboardData();
  }
  setupGlobalSearchInput();
});

function setupResponsiveNavigation() {
  const topbar = document.querySelector('.topbar');
  const sidebar = document.querySelector('.sidebar');
  if (!topbar || !sidebar) return;

  // Ensure Mobile Hamburger Button Exists
  let menuBtn = document.querySelector('.mobile-menu-btn');
  if (!menuBtn) {
    menuBtn = document.createElement('button');
    menuBtn.className = 'mobile-menu-btn';
    menuBtn.innerHTML = '☰';
    menuBtn.setAttribute('aria-label', 'Toggle Menu');
    topbar.insertBefore(menuBtn, topbar.firstChild);
  }

  // Ensure Backdrop Overlay Exists
  let overlay = document.querySelector('.sidebar-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
  }

  const toggleMenu = () => {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
  };

  const closeMenu = () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
  };

  menuBtn.addEventListener('click', toggleMenu);
  overlay.addEventListener('click', closeMenu);

  // Close sidebar on mobile when nav links are clicked
  document.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });
}

function setupUserInfo() {
  const user = getCurrentUser();
  if (!user) return;

  const greetingElem = document.getElementById('user-greeting');
  if (greetingElem) {
    const hours = new Date().getHours();
    const timeOfDay = hours < 12 ? 'Good morning' : hours < 18 ? 'Good afternoon' : 'Good evening';
    greetingElem.textContent = `${timeOfDay}, ${user.fullName.split(' ')[0]} 👋`;
  }

  const userAvatar = document.getElementById('topbar-avatar');
  if (userAvatar) {
    if (user.profileImage) {
      userAvatar.src = user.profileImage;
    } else {
      userAvatar.outerHTML = `<div class="avatar-placeholder">${user.fullName.charAt(0)}</div>`;
    }
  }
}

async function loadDashboardData() {
  try {
    const [tasksRes, expensesRes, goalsRes, medicinesRes, docsRes, apptsRes, insightsRes, notifsRes] = await Promise.all([
      apiCall('/tasks?status=pending'),
      apiCall('/expenses'),
      apiCall('/goals'),
      apiCall('/medicines'),
      apiCall('/documents'),
      apiCall('/appointments?status=upcoming'),
      apiCall('/dashboard/insights'),
      apiCall('/notifications')
    ]);

    document.getElementById('stat-tasks').textContent = tasksRes.data.count || 0;
    document.getElementById('stat-expenses').textContent = `₹${(expensesRes.data.summary.totalExpenses || 0).toLocaleString()}`;
    document.getElementById('stat-goals').textContent = goalsRes.data.metrics?.active || 0;
    document.getElementById('stat-expiring-docs').textContent = docsRes.data.expiringSoonCount || 0;
    document.getElementById('stat-appointments').textContent = apptsRes.data.count || 0;

    renderTimeline(medicinesRes.data.medicines, tasksRes.data.tasks, apptsRes.data.appointments);
    renderFinancialChart(expensesRes.data.summary);
    renderGoalsProgress(goalsRes.data.goals);
    renderInsights(insightsRes.data.insights);
    renderNotificationsBadge(notifsRes.data);

  } catch (err) {
    console.error('Error loading dashboard metrics:', err);
    showToast('Failed to load some dashboard sections', 'warning');
  }
}

function renderTimeline(medicines = [], tasks = [], appointments = []) {
  const container = document.getElementById('timeline-container');
  if (!container) return;

  const timelineItems = [];

  medicines.forEach((m) => {
    timelineItems.push({
      time: m.reminderTime || '08:00',
      title: `Medicine: ${m.name}`,
      category: `${m.dosage} (${m.instructions})`,
      icon: '💊'
    });
  });

  tasks.slice(0, 3).forEach((t) => {
    const timeStr = t.dueDate ? new Date(t.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:00 PM';
    timelineItems.push({
      time: timeStr,
      title: `Task: ${t.title}`,
      category: `${t.category} • ${t.priority}`,
      icon: '✅'
    });
  });

  appointments.slice(0, 3).forEach((a) => {
    timelineItems.push({
      time: a.time || '02:00 PM',
      title: `Appointment: ${a.title}`,
      category: `With ${a.personOrOrg} @ ${a.location || 'Online'}`,
      icon: '📅'
    });
  });

  timelineItems.sort((a, b) => a.time.localeCompare(b.time));

  if (timelineItems.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">No scheduled timeline items for today.</p>`;
    return;
  }

  container.innerHTML = timelineItems
    .map(
      (item) => `
    <div class="timeline-item">
      <div>
        <strong style="font-size: 0.95rem;">${item.title}</strong>
        <div style="font-size: 0.8rem; color: var(--text-secondary);">${item.category}</div>
      </div>
      <span class="badge badge-medium">${item.time}</span>
    </div>
  `
    )
    .join('');
}

function renderFinancialChart(summary) {
  const ctx = document.getElementById('financeChart')?.getContext('2d');
  if (!ctx) return;

  if (window.myFinanceChart) {
    window.myFinanceChart.destroy();
  }

  const income = summary.totalIncome || 0;
  const expense = summary.totalExpenses || 0;
  const savings = Math.max(0, income - expense);
  const budget = summary.monthlyLimit || 0;

  window.myFinanceChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Expenses', 'Savings', 'Remaining Budget'],
      datasets: [
        {
          data: [expense, savings, Math.max(0, budget - expense)],
          backgroundColor: ['#ef4444', '#10b981', '#38bdf8'],
          borderWidth: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#94a3b8' }
        }
      }
    }
  });

  const budgetProgressText = document.getElementById('budget-progress-text');
  if (budgetProgressText) {
    budgetProgressText.textContent = `Spent ₹${expense.toLocaleString()} of ₹${budget.toLocaleString()} monthly budget`;
  }
}

function renderGoalsProgress(goals = []) {
  const container = document.getElementById('goals-progress-container');
  if (!container) return;

  if (goals.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">No goals created yet.</p>`;
    return;
  }

  container.innerHTML = goals
    .slice(0, 4)
    .map((g) => {
      const pct = g.targetValue > 0 ? Math.min(100, Math.round((g.currentValue / g.targetValue) * 100)) : 0;
      return `
      <div style="margin-bottom: 1rem;">
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600;">
          <span>${g.title}</span>
          <span style="color: var(--accent-primary);">${pct}%</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${pct}%;"></div>
        </div>
      </div>
    `;
    })
    .join('');
}

function renderInsights(insights = []) {
  const container = document.getElementById('insights-container');
  if (!container) return;

  container.innerHTML = insights
    .map(
      (ins) => `
    <div class="insight-card ${ins.type}">
      <div style="font-size: 1.25rem;">✨</div>
      <div>
        <strong style="font-size: 0.9rem;">${ins.title}</strong>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.2rem;">${ins.message}</p>
      </div>
    </div>
  `
    )
    .join('');
}

function renderNotificationsBadge(data) {
  const badge = document.getElementById('notif-badge');
  if (badge) {
    if (data.unreadCount > 0) {
      badge.style.display = 'flex';
      badge.textContent = data.unreadCount;
    } else {
      badge.style.display = 'none';
    }
  }
}

function setupGlobalSearchInput() {
  const searchInput = document.getElementById('global-search-input');
  if (!searchInput) return;

  let debounceTimer;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value.trim();

    if (!query) {
      hideSearchResults();
      return;
    }

    debounceTimer = setTimeout(async () => {
      try {
        const res = await apiCall(`/search?q=${encodeURIComponent(query)}`);
        showSearchResults(res.data.results);
      } catch (err) {
        console.error('Global search error:', err);
      }
    }, 300);
  });
}

function showSearchResults(results = []) {
  let dropdown = document.getElementById('search-dropdown-results');
  if (!dropdown) {
    dropdown = document.createElement('div');
    dropdown.id = 'search-dropdown-results';
    dropdown.style.cssText = `
      position: absolute; top: 110%; left: 0; right: 0;
      background: var(--bg-surface); border: 1px solid var(--border-color);
      border-radius: var(--radius-md); box-shadow: var(--shadow-lg);
      z-index: 1000; max-height: 350px; overflow-y: auto; padding: 0.5rem;
    `;
    document.querySelector('.search-box').appendChild(dropdown);
  }

  if (results.length === 0) {
    dropdown.innerHTML = `<div style="padding: 0.75rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No matching records found</div>`;
    return;
  }

  dropdown.innerHTML = results
    .map(
      (r) => `
    <a href="${r.link}" style="display: flex; justify-content: space-between; padding: 0.65rem 0.85rem; border-radius: var(--radius-sm); color: var(--text-primary); text-decoration: none; font-size: 0.85rem;" onmouseover="this.style.background='var(--bg-card)'" onmouseout="this.style.background='transparent'">
      <div>
        <strong>${r.title}</strong>
        <div style="font-size: 0.75rem; color: var(--text-secondary);">${r.subtitle}</div>
      </div>
      <span class="badge badge-info">${r.type}</span>
    </a>
  `
    )
    .join('');
}

function hideSearchResults() {
  const dropdown = document.getElementById('search-dropdown-results');
  if (dropdown) dropdown.remove();
}
