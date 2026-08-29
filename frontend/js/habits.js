/* LifeOS Habit Tracker Controller with Accuracy & Heatmap Metrics */

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadHabits();

  const modal = document.getElementById('habit-modal');
  document.getElementById('add-habit-btn')?.addEventListener('click', () => {
    document.getElementById('habit-form').reset();
    modal.classList.add('active');
  });

  document.getElementById('cancel-habit-btn')?.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  document.getElementById('habit-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('habit-title').value;
    const description = document.getElementById('habit-desc').value;
    const category = document.getElementById('habit-category').value;

    try {
      await apiCall('/habits', {
        method: 'POST',
        body: { title, description, category }
      });
      showToast('Habit created!', 'success');
      modal.classList.remove('active');
      loadHabits();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
});

async function loadHabits() {
  const container = document.getElementById('habits-container');
  if (!container) return;

  try {
    const res = await apiCall('/habits');
    const habits = res.data.habits || [];
    const logs = res.data.logs || [];
    const todayStr = new Date().toISOString().split('T')[0];

    if (habits.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔥</div>
          <h3>Build Powerful Daily Habits</h3>
          <p style="color: var(--text-secondary); font-size: 0.9rem;">Track exercise, reading, coding, meditation, and water intake with GitHub-style activity heatmaps.</p>
        </div>
      `;
      return;
    }

    // Build log map per habit
    const logSet = new Set(logs.filter((l) => l.completed).map((l) => `${l.habit}_${l.date}`));

    container.innerHTML = habits
      .map((h) => {
        const isDoneToday = logSet.has(`${h._id}_${todayStr}`);

        // Generate past 30 days matrix & calculate accuracy percentage
        let heatmapHTML = '';
        let completedDays30 = 0;
        for (let i = 29; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const isCompleted = logSet.has(`${h._id}_${dateStr}`);

          if (isCompleted) completedDays30++;

          heatmapHTML += `<div class="heatmap-day ${isCompleted ? 'completed' : ''}" title="${dateStr}: ${isCompleted ? 'Completed' : 'Missed'}"></div>`;
        }

        const accuracyPct = Math.round((completedDays30 / 30) * 100);

        return `
        <div class="habit-card">
          <div class="habit-card-header">
            <div class="habit-card-info">
              <div class="habit-title-row">
                <strong style="font-size: 1.15rem;">${h.title}</strong>
                <span class="badge badge-success" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);">🎯 ${accuracyPct}% Accuracy</span>
                <span class="badge badge-warning">🔥 ${h.streakCurrent} Day Streak</span>
                <span class="badge badge-info">Best: ${h.streakBest}d</span>
              </div>
              <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.2rem;">${h.description || h.category}</p>
            </div>
            <div class="habit-actions-row">
              <button class="btn ${isDoneToday ? 'btn-secondary' : 'btn-primary'}" onclick="toggleHabit('${h._id}')">
                ${isDoneToday ? '✓ Done Today' : 'Mark Completed'}
              </button>
              <button class="btn-icon" onclick="deleteHabit('${h._id}')" aria-label="Delete Habit">🗑️</button>
            </div>
          </div>

          <div class="habit-heatmap-container">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-bottom: 0.4rem;">
              <span>Activity Heatmap (Past 30 Days)</span>
              <span style="color: var(--accent-success);">${completedDays30}/30 Days Completed (${accuracyPct}%)</span>
            </div>
            <div class="habit-heatmap-grid">
              ${heatmapHTML}
            </div>
          </div>
        </div>
      `;
      })
      .join('');
  } catch (err) {
    showToast('Failed to load habits', 'error');
  }
}

async function toggleHabit(id) {
  try {
    await apiCall(`/habits/${id}/toggle`, { method: 'POST' });
    loadHabits();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteHabit(id) {
  if (!confirm('Delete habit tracker and history?')) return;
  try {
    await apiCall(`/habits/${id}`, { method: 'DELETE' });
    showToast('Habit deleted', 'info');
    loadHabits();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
