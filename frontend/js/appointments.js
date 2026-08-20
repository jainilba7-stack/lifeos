/* LifeOS Appointments Manager Controller */

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadAppointments();

  const modal = document.getElementById('appt-modal');
  document.getElementById('add-appt-btn')?.addEventListener('click', () => {
    document.getElementById('appt-form').reset();
    modal.classList.add('active');
  });

  document.getElementById('cancel-appt-btn')?.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  document.getElementById('appt-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('appt-title').value;
    const personOrOrg = document.getElementById('appt-person').value;
    const date = document.getElementById('appt-date').value;
    const time = document.getElementById('appt-time').value;
    const location = document.getElementById('appt-location').value;
    const notes = document.getElementById('appt-notes').value;

    try {
      await apiCall('/appointments', {
        method: 'POST',
        body: { title, personOrOrg, date, time, location, notes }
      });
      showToast('Appointment scheduled', 'success');
      modal.classList.remove('active');
      loadAppointments();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
});

async function loadAppointments() {
  const container = document.getElementById('appointments-container');
  if (!container) return;

  try {
    const res = await apiCall('/appointments');
    const appts = res.data.appointments || [];

    if (appts.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📅</div>
          <h3>No Upcoming Appointments</h3>
          <p style="color: var(--text-secondary); font-size: 0.9rem;">Manage doctor visits, college meetings, interviews, or bank appointments.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = appts
      .map(
        (a) => `
      <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1.25rem; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <strong style="font-size: 1.1rem;">${a.title}</strong>
            <span class="badge badge-info">With ${a.personOrOrg}</span>
          </div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.3rem;">
            📅 ${new Date(a.date).toLocaleDateString()} @ ${a.time} • 📍 ${a.location || 'Not specified'}
          </div>
          ${a.notes ? `<p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">${a.notes}</p>` : ''}
        </div>
        <button class="btn-icon" onclick="deleteAppointment('${a._id}')">🗑️</button>
      </div>
    `
      )
      .join('');
  } catch (err) {
    showToast('Failed to load appointments', 'error');
  }
}

async function deleteAppointment(id) {
  if (!confirm('Cancel appointment?')) return;
  try {
    await apiCall(`/appointments/${id}`, { method: 'DELETE' });
    showToast('Appointment removed', 'info');
    loadAppointments();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
