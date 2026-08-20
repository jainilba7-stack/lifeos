/* LifeOS Medicine Reminder & Dose Management Controller */

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadMedicines();

  const modal = document.getElementById('medicine-modal');
  document.getElementById('add-medicine-btn')?.addEventListener('click', () => {
    document.getElementById('medicine-form').reset();
    modal.classList.add('active');
  });

  document.getElementById('cancel-med-btn')?.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  document.getElementById('medicine-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('med-name').value;
    const dosage = document.getElementById('med-dosage').value;
    const frequency = document.getElementById('med-frequency').value;
    const reminderTime = document.getElementById('med-time').value;
    const quantity = document.getElementById('med-quantity').value;
    const instructions = document.getElementById('med-instructions').value;

    try {
      await apiCall('/medicines', {
        method: 'POST',
        body: { name, dosage, frequency, reminderTime, quantity, instructions }
      });
      showToast('Medicine added successfully', 'success');
      modal.classList.remove('active');
      loadMedicines();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
});

async function loadMedicines() {
  const container = document.getElementById('medicines-container');
  if (!container) return;

  try {
    const res = await apiCall('/medicines');
    const medicines = res.data.medicines || [];
    const todayStr = new Date().toISOString().split('T')[0];

    if (medicines.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">💊</div>
          <h3>No Medicine Reminders</h3>
          <p style="color: var(--text-secondary); font-size: 0.9rem;">Keep track of your daily prescribed doses and schedules.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = medicines
      .map((med) => {
        const todayLog = med.logs?.find((l) => l.date === todayStr);
        const isTaken = todayLog?.status === 'taken';

        return `
        <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1.25rem; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <strong style="font-size: 1.1rem;">${med.name}</strong>
              <span class="badge badge-medium">${med.dosage}</span>
            </div>
            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.3rem;">
              ⏰ ${med.reminderTime} • ${med.frequency} • 💡 ${med.instructions}
            </div>
            <div style="font-size: 0.8rem; color: ${med.quantity <= 3 ? 'var(--accent-danger)' : 'var(--text-muted)'}; margin-top: 0.2rem;">
              Remaining Pill Quantity: <strong>${med.quantity}</strong>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <button class="btn ${isTaken ? 'btn-secondary' : 'btn-primary'}" onclick="logMedicineDose('${med._id}', '${isTaken ? 'missed' : 'taken'}')">
              ${isTaken ? '✓ Taken Today' : 'Mark as Taken'}
            </button>
            <button class="btn-icon" onclick="deleteMedicine('${med._id}')">🗑️</button>
          </div>
        </div>
      `;
      })
      .join('');
  } catch (err) {
    showToast('Failed to load medicines', 'error');
  }
}

async function logMedicineDose(id, status) {
  try {
    await apiCall(`/medicines/${id}/log`, {
      method: 'POST',
      body: { status }
    });
    showToast(`Dose marked as ${status}`, 'success');
    loadMedicines();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteMedicine(id) {
  if (!confirm('Remove this medicine schedule?')) return;
  try {
    await apiCall(`/medicines/${id}`, { method: 'DELETE' });
    showToast('Medicine removed', 'info');
    loadMedicines();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
