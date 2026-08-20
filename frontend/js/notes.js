/* LifeOS Personal Notes Controller */

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadNotes();

  const modal = document.getElementById('note-modal');
  document.getElementById('add-note-btn')?.addEventListener('click', () => {
    document.getElementById('note-form').reset();
    document.getElementById('note-id').value = '';
    modal.classList.add('active');
  });

  document.getElementById('cancel-note-btn')?.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  document.getElementById('note-search-input')?.addEventListener('input', loadNotes);
  document.getElementById('note-category-filter')?.addEventListener('change', loadNotes);

  document.getElementById('note-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const noteId = document.getElementById('note-id').value;
    const title = document.getElementById('note-title').value;
    const content = document.getElementById('note-content').value;
    const category = document.getElementById('note-category').value;
    const tags = document.getElementById('note-tags').value;

    try {
      if (noteId) {
        await apiCall(`/notes/${noteId}`, {
          method: 'PUT',
          body: { title, content, category, tags }
        });
        showToast('Note updated', 'success');
      } else {
        await apiCall('/notes', {
          method: 'POST',
          body: { title, content, category, tags }
        });
        showToast('Note created', 'success');
      }
      modal.classList.remove('active');
      loadNotes();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
});

async function loadNotes() {
  const container = document.getElementById('notes-grid');
  if (!container) return;

  const search = document.getElementById('note-search-input')?.value || '';
  const category = document.getElementById('note-category-filter')?.value || 'All';

  try {
    const res = await apiCall(`/notes?search=${encodeURIComponent(search)}&category=${category}`);
    const notes = res.data.notes || [];

    if (notes.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📌</div>
          <h3>No Notes Found</h3>
          <p style="color: var(--text-secondary); font-size: 0.9rem;">Jot down personal ideas, college notes, or project tasks.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = notes
      .map(
        (n) => `
      <div class="note-card ${n.isPinned ? 'pinned' : ''}">
        <div>
          <span class="pin-icon" onclick="togglePinNote('${n._id}')">${n.isPinned ? '📌' : '📍'}</span>
          <strong style="font-size: 1.1rem; padding-right: 1.5rem; display: block;">${n.title}</strong>
          <span class="badge badge-info" style="margin-top: 0.4rem;">${n.category}</span>
          <p style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 0.75rem; white-space: pre-wrap;">${n.content}</p>
        </div>
        <div style="margin-top: 1.25rem; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.75rem; color: var(--text-muted);">${new Date(n.updatedAt).toLocaleDateString()}</span>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn-icon" onclick="editNote('${n._id}', '${escapeQuotes(n.title)}', '${escapeQuotes(n.content)}', '${n.category}', '${(n.tags || []).join(', ')}')">✏️</button>
            <button class="btn-icon" onclick="deleteNote('${n._id}')">🗑️</button>
          </div>
        </div>
      </div>
    `
      )
      .join('');
  } catch (err) {
    showToast('Failed to load notes', 'error');
  }
}

async function togglePinNote(id) {
  try {
    await apiCall(`/notes/${id}/pin`, { method: 'PATCH' });
    loadNotes();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function editNote(id, title, content, category, tags) {
  document.getElementById('note-id').value = id;
  document.getElementById('note-title').value = title;
  document.getElementById('note-content').value = content;
  document.getElementById('note-category').value = category;
  document.getElementById('note-tags').value = tags;

  document.getElementById('note-modal').classList.add('active');
}

async function deleteNote(id) {
  if (!confirm('Delete this note?')) return;
  try {
    await apiCall(`/notes/${id}`, { method: 'DELETE' });
    showToast('Note deleted', 'info');
    loadNotes();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function escapeQuotes(str = '') {
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
