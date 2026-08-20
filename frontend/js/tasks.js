/* LifeOS Task Management Controller */

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadTasks();

  // Filters & Search Setup
  document.getElementById('task-status-filter')?.addEventListener('change', loadTasks);
  document.getElementById('task-priority-filter')?.addEventListener('change', loadTasks);
  document.getElementById('task-category-filter')?.addEventListener('change', loadTasks);

  let searchTimeout;
  document.getElementById('task-search-input')?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(loadTasks, 300);
  });

  // Modal Setup
  const taskModal = document.getElementById('task-modal');
  const addTaskBtn = document.getElementById('add-task-btn');
  const cancelTaskBtn = document.getElementById('cancel-task-btn');
  const taskForm = document.getElementById('task-form');

  addTaskBtn?.addEventListener('click', () => {
    taskForm.reset();
    document.getElementById('task-id').value = '';
    document.getElementById('modal-title').textContent = 'Create New Task';
    taskModal.classList.add('active');
  });

  cancelTaskBtn?.addEventListener('click', () => {
    taskModal.classList.remove('active');
  });

  taskForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const taskId = document.getElementById('task-id').value;
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-desc').value;
    const category = document.getElementById('task-category').value;
    const priority = document.getElementById('task-priority').value;
    const dueDate = document.getElementById('task-duedate').value;

    try {
      if (taskId) {
        await apiCall(`/tasks/${taskId}`, {
          method: 'PUT',
          body: { title, description, category, priority, dueDate }
        });
        showToast('Task updated successfully', 'success');
      } else {
        await apiCall('/tasks', {
          method: 'POST',
          body: { title, description, category, priority, dueDate }
        });
        showToast('Task created successfully', 'success');
      }
      taskModal.classList.remove('active');
      loadTasks();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
});

async function loadTasks() {
  const status = document.getElementById('task-status-filter')?.value || 'All';
  const priority = document.getElementById('task-priority-filter')?.value || 'All';
  const category = document.getElementById('task-category-filter')?.value || 'All';
  const search = document.getElementById('task-search-input')?.value || '';

  const container = document.getElementById('tasks-container');
  if (!container) return;

  container.innerHTML = `<div style="text-align: center; padding: 2rem;"><div class="spinner"></div></div>`;

  try {
    const res = await apiCall(
      `/tasks?status=${status}&priority=${priority}&category=${category}&search=${encodeURIComponent(search)}`
    );
    const tasks = res.data.tasks || [];

    if (tasks.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📝</div>
          <h3>No tasks found</h3>
          <p style="color: var(--text-secondary); font-size: 0.9rem;">Create a new task to keep your day organized!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = tasks
      .map((t) => {
        const priorityBadgeClass = `badge-${t.priority.toLowerCase()}`;
        const dueDateStr = t.dueDate
          ? new Date(t.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })
          : 'No deadline';

        return `
        <div class="task-item ${t.isCompleted ? 'completed' : ''}">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <div class="checkbox-custom ${t.isCompleted ? 'checked' : ''}" onclick="toggleTaskCompletion('${t._id}')">
              ${t.isCompleted ? '✓' : ''}
            </div>
            <div>
              <div class="task-title" style="font-weight: 700; font-size: 0.95rem;">${t.title}</div>
              <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.2rem;">
                ${t.description ? t.description + ' • ' : ''}📅 ${dueDateStr}
              </div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span class="badge ${priorityBadgeClass}">${t.priority}</span>
            <span class="badge badge-info">${t.category}</span>
            <button class="btn-icon" onclick="editTask('${t._id}', '${escapeQuotes(t.title)}', '${escapeQuotes(t.description)}', '${t.category}', '${t.priority}', '${t.dueDate ? t.dueDate.split('T')[0] : ''}')">✏️</button>
            <button class="btn-icon" onclick="deleteTask('${t._id}')">🗑️</button>
          </div>
        </div>
      `;
      })
      .join('');
  } catch (err) {
    showToast('Failed to load tasks', 'error');
  }
}

async function toggleTaskCompletion(id) {
  try {
    await apiCall(`/tasks/${id}/toggle`, { method: 'PATCH' });
    loadTasks();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function editTask(id, title, description, category, priority, dueDate) {
  document.getElementById('task-id').value = id;
  document.getElementById('task-title').value = title;
  document.getElementById('task-desc').value = description;
  document.getElementById('task-category').value = category;
  document.getElementById('task-priority').value = priority;
  document.getElementById('task-duedate').value = dueDate;

  document.getElementById('modal-title').textContent = 'Edit Task';
  document.getElementById('task-modal').classList.add('active');
}

async function deleteTask(id) {
  if (!confirm('Are you sure you want to delete this task?')) return;
  try {
    await apiCall(`/tasks/${id}`, { method: 'DELETE' });
    showToast('Task deleted', 'info');
    loadTasks();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function escapeQuotes(str = '') {
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
