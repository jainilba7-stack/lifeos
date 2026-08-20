/* LifeOS Central Reminder System Controller */

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadReminders();

  const modal = document.getElementById('reminder-modal');
  document.getElementById('add-reminder-btn')?.addEventListener('click', () => {
    document.getElementById('reminder-form').reset();
    modal.classList.add('active');
  });

  document.getElementById('cancel-rem-btn')?.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  document.getElementById('reminder-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('rem-title').value;
    const type = document.getElementById('rem-type').value;
    const dateTime = document.getElementById('rem-datetime').value;
    const repeatFrequency = document.getElementById('rem-repeat').value;
    const notes = document.getElementById('rem-notes').value;

    try {
      await apiCall('/reminders', {
        method: 'POST',
        body: { title, type, dateTime, repeatFrequency, notes }
      });
      showToast('Reminder scheduled!', 'success');
      modal.classList.remove('active');
      loadReminders();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
});

async function loadReminders() {
  const container = document.getElementById('reminders-container');
  if (!container) return;

  try {
    const res = await apiCall('/reminders');
    const reminders = res.data.reminders || [];

    if (reminders.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔔</div>
          <h3>No Reminders Set</h3>
          <p style="color: var(--text-secondary); font-size: 0.9rem;">Schedule reminders for bills, birthdays, document renewals, or personal events.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = reminders
      .map(
        (r) => `
      <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1.25rem; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <strong style="font-size: 1.1rem;">${r.title}</strong>
            <span class="badge badge-info">${r.type}</span>
          </div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.3rem;">
            📅 ${new Date(r.dateTime).toLocaleString()} • Repeat: ${r.repeatFrequency}
          </div>
        </div>
        <button class="btn-icon" onclick="deleteReminder('${r._id}')">🗑️</button>
      </div>
    `
      )
      .join('');
  } catch (err) {
    showToast('Failed to load reminders', 'error');
  }
}

async function deleteReminder(id) {
  if (!confirm('Delete reminder?')) return;
  try {
    await apiCall(`/reminders/${id}`, { method: 'DELETE' });
    showToast('Reminder deleted', 'info');
    loadReminders();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
