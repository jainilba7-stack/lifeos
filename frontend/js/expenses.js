/* LifeOS Expense & Budget Management Controller */

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadExpenses();

  // Modals & Form Setup
  const expenseModal = document.getElementById('expense-modal');
  const budgetModal = document.getElementById('budget-modal');

  document.getElementById('add-expense-btn')?.addEventListener('click', () => {
    document.getElementById('expense-form').reset();
    expenseModal.classList.add('active');
  });

  document.getElementById('set-budget-btn')?.addEventListener('click', () => {
    budgetModal.classList.add('active');
  });

  document.getElementById('cancel-expense-btn')?.addEventListener('click', () => {
    expenseModal.classList.remove('active');
  });

  document.getElementById('cancel-budget-btn')?.addEventListener('click', () => {
    budgetModal.classList.remove('active');
  });

  document.getElementById('expense-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = Number(document.getElementById('exp-amount').value);
    const type = document.getElementById('exp-type').value;
    const category = document.getElementById('exp-category').value;
    const description = document.getElementById('exp-desc').value;
    const date = document.getElementById('exp-date').value;
    const paymentMethod = document.getElementById('exp-payment').value;

    try {
      await apiCall('/expenses', {
        method: 'POST',
        body: { amount, type, category, description, date, paymentMethod }
      });
      showToast('Transaction added', 'success');
      expenseModal.classList.remove('active');
      loadExpenses();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  document.getElementById('budget-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const monthlyLimit = Number(document.getElementById('budget-limit').value);
    try {
      await apiCall('/expenses/budget', {
        method: 'POST',
        body: { monthlyLimit }
      });
      showToast('Monthly budget updated', 'success');
      budgetModal.classList.remove('active');
      loadExpenses();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
});

async function loadExpenses() {
  const container = document.getElementById('expense-list-container');
  if (!container) return;

  try {
    const res = await apiCall('/expenses');
    const expenses = res.data.expenses || [];
    const summary = res.data.summary || {};

    // Update Summary Header Widgets
    document.getElementById('total-income').textContent = `₹${(summary.totalIncome || 0).toLocaleString()}`;
    document.getElementById('total-expenses').textContent = `₹${(summary.totalExpenses || 0).toLocaleString()}`;
    document.getElementById('total-savings').textContent = `₹${(summary.totalSavings || 0).toLocaleString()}`;
    document.getElementById('remaining-budget').textContent = `₹${(summary.remainingBudget || 0).toLocaleString()}`;

    // Budget Warning Banner
    const warningBanner = document.getElementById('budget-warning-banner');
    if (warningBanner) {
      if (summary.isOverBudget) {
        warningBanner.style.display = 'block';
        warningBanner.className = 'insight-card urgent';
        warningBanner.innerHTML = `⚠️ <strong>Budget Exceeded!</strong> You have spent ₹${summary.totalExpenses.toLocaleString()}, exceeding your limit of ₹${summary.monthlyLimit.toLocaleString()}.`;
      } else if (summary.isNearBudget) {
        warningBanner.style.display = 'block';
        warningBanner.className = 'insight-card warning';
        warningBanner.innerHTML = `⚡ <strong>Budget Alert!</strong> You have used 80%+ of your monthly budget (₹${summary.totalExpenses.toLocaleString()} / ₹${summary.monthlyLimit.toLocaleString()}).`;
      } else {
        warningBanner.style.display = 'none';
      }
    }

    // Render Transaction List
    if (expenses.length === 0) {
      container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No financial transactions logged yet.</p>`;
      return;
    }

    container.innerHTML = expenses
      .map(
        (exp) => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.9rem 1.25rem; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); margin-bottom: 0.75rem;">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <div style="width: 42px; height: 42px; border-radius: var(--radius-md); background: ${exp.type === 'income' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; color: ${exp.type === 'income' ? '#10b981' : '#ef4444'}; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
            ${exp.type === 'income' ? '📈' : '📉'}
          </div>
          <div>
            <strong style="font-size: 0.95rem;">${exp.description || exp.category}</strong>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">${exp.category} • ${exp.paymentMethod} • ${new Date(exp.date).toLocaleDateString()}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 1rem;">
          <span style="font-size: 1.1rem; font-weight: 800; color: ${exp.type === 'income' ? '#10b981' : '#ef4444'};">
            ${exp.type === 'income' ? '+' : '-'}₹${exp.amount.toLocaleString()}
          </span>
          <button class="btn-icon" onclick="deleteExpense('${exp._id}')">🗑️</button>
        </div>
      </div>
    `
      )
      .join('');
  } catch (err) {
    showToast('Failed to load expenses', 'error');
  }
}

async function deleteExpense(id) {
  if (!confirm('Delete this financial transaction?')) return;
  try {
    await apiCall(`/expenses/${id}`, { method: 'DELETE' });
    showToast('Transaction deleted', 'info');
    loadExpenses();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
