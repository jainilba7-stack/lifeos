/* LifeOS Goal Management Controller */

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadGoals();

  const modal = document.getElementById('goal-modal');
  document.getElementById('add-goal-btn')?.addEventListener('click', () => {
    document.getElementById('goal-form').reset();
    modal.classList.add('active');
  });

  document.getElementById('cancel-goal-btn')?.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  document.getElementById('goal-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('goal-title').value;
    const description = document.getElementById('goal-desc').value;
    const category = document.getElementById('goal-category').value;
    const targetValue = document.getElementById('goal-target').value;
    const currentValue = document.getElementById('goal-current').value;
    const unit = document.getElementById('goal-unit').value;
    const deadline = document.getElementById('goal-deadline').value;

    try {
      await apiCall('/goals', {
        method: 'POST',
        body: { title, description, category, targetValue, currentValue, unit, deadline }
      });
      showToast('Goal created successfully', 'success');
      modal.classList.remove('active');
      loadGoals();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
});

async function loadGoals() {
  const container = document.getElementById('goals-container');
  if (!container) return;

  try {
    const res = await apiCall('/goals');
    const goals = res.data.goals || [];

    if (goals.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🎯</div>
          <h3>Set Your Life Goals</h3>
          <p style="color: var(--text-secondary); font-size: 0.9rem;">Track progress on DSA problems, savings targets, skills, or fitness objectives.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = goals
      .map((g) => {
        const pct = g.targetValue > 0 ? Math.min(100, Math.round((g.currentValue / g.targetValue) * 100)) : 0;
        const statusBadge =
          g.status === 'completed'
            ? '<span class="badge badge-success">Completed</span>'
            : g.status === 'overdue'
            ? '<span class="badge badge-danger">Overdue</span>'
            : '<span class="badge badge-medium">Active</span>';

        return `
        <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1.5rem; margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <strong style="font-size: 1.1rem;">${g.title}</strong>
                ${statusBadge}
              </div>
              <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">${g.description || 'No detailed description.'}</p>
            </div>
            <button class="btn-icon" onclick="deleteGoal('${g._id}')">🗑️</button>
          </div>

          <div style="margin-top: 1rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 700;">
              <span>Progress: ${g.currentValue} / ${g.targetValue} ${g.unit}</span>
              <span style="color: var(--accent-primary);">${pct}%</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${pct}%;"></div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem;">
            <span style="font-size: 0.8rem; color: var(--text-muted);">Deadline: ${g.deadline ? new Date(g.deadline).toLocaleDateString() : 'No limit'}</span>
            <button class="btn btn-secondary btn-sm" onclick="updateGoalProgress('${g._id}', ${g.currentValue}, ${g.targetValue})">⚡ Update Progress</button>
          </div>
        </div>
      `;
      })
      .join('');
  } catch (err) {
    showToast('Failed to load goals', 'error');
  }
}

async function updateGoalProgress(id, current, target) {
  const newValue = prompt(`Enter updated progress value (Current: ${current}):`, current);
  if (newValue === null || isNaN(newValue)) return;

  try {
    await apiCall(`/goals/${id}`, {
      method: 'PUT',
      body: { currentValue: Number(newValue) }
    });
    showToast('Goal progress updated', 'success');
    loadGoals();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteGoal(id) {
  if (!confirm('Delete this goal?')) return;
  try {
    await apiCall(`/goals/${id}`, { method: 'DELETE' });
    showToast('Goal deleted', 'info');
    loadGoals();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
