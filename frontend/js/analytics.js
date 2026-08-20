/* LifeOS Interactive Analytics Controller */

document.addEventListener('DOMContentLoaded', async () => {
  checkAuth();
  await loadAnalytics();
});

async function loadAnalytics() {
  try {
    const res = await apiCall('/analytics');
    const data = res.data;

    // 1. Productivity Summary Metrics
    document.getElementById('analytics-task-completion').textContent = `${data.productivity.taskCompletionRate}%`;
    document.getElementById('analytics-completed-tasks').textContent = data.productivity.completedTasks;
    document.getElementById('analytics-pending-tasks').textContent = data.productivity.pendingTasks;

    // 2. Finance Summary Metrics
    document.getElementById('analytics-income').textContent = `₹${data.finance.incomeThisMonth.toLocaleString()}`;
    document.getElementById('analytics-expense').textContent = `₹${data.finance.expenseThisMonth.toLocaleString()}`;
    document.getElementById('analytics-savings').textContent = `₹${data.finance.savingsThisMonth.toLocaleString()}`;

    // 3. Goal & Habit Summaries
    document.getElementById('analytics-avg-goal').textContent = `${data.goals.avgGoalProgress}%`;
    document.getElementById('analytics-max-streak').textContent = `${data.habits.maxBestStreak} days`;

    // 4. Render Charts
    renderProductivityChart(data.productivity);
    renderFinanceChart(data.finance);
  } catch (err) {
    showToast('Failed to load analytics', 'error');
  }
}

function renderProductivityChart(productivity) {
  const ctx = document.getElementById('productivityChart')?.getContext('2d');
  if (!ctx) return;

  const categories = (productivity.tasksByCategory || []).map((c) => c._id);
  const counts = (productivity.tasksByCategory || []).map((c) => c.count);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: categories.length ? categories : ['Personal', 'College', 'Work', 'Health'],
      datasets: [
        {
          label: 'Tasks by Category',
          data: counts.length ? counts : [0, 0, 0, 0],
          backgroundColor: '#38bdf8',
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
      },
      plugins: {
        legend: { labels: { color: '#94a3b8' } }
      }
    }
  });
}

function renderFinanceChart(finance) {
  const ctx = document.getElementById('financeCategoryChart')?.getContext('2d');
  if (!ctx) return;

  const categories = (finance.categorySpending || []).map((c) => c._id);
  const totals = (finance.categorySpending || []).map((c) => c.total);

  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: categories.length ? categories : ['Food', 'Bills', 'Transport', 'Shopping'],
      datasets: [
        {
          data: totals.length ? totals : [1, 1, 1, 1],
          backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#38bdf8', '#818cf8', '#ec4899']
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#94a3b8' } }
      }
    }
  });
}
