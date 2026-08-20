/* LifeOS Document Vault Controller */

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadDocuments();

  const modal = document.getElementById('document-modal');
  document.getElementById('upload-doc-btn')?.addEventListener('click', () => {
    document.getElementById('document-form').reset();
    modal.classList.add('active');
  });

  document.getElementById('cancel-doc-btn')?.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  document.getElementById('document-category-filter')?.addEventListener('change', loadDocuments);

  document.getElementById('document-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('doc-file');
    if (!fileInput.files[0]) {
      return showToast('Please select a document file to upload', 'warning');
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('name', document.getElementById('doc-name').value);
    formData.append('category', document.getElementById('doc-category').value);
    formData.append('expiryDate', document.getElementById('doc-expiry').value);
    formData.append('description', document.getElementById('doc-desc').value);

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Uploading...';

    try {
      await apiCall('/documents', {
        method: 'POST',
        body: formData,
        isFormData: true
      });
      showToast('Document uploaded to Vault!', 'success');
      modal.classList.remove('active');
      loadDocuments();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Upload Document';
    }
  });
});

async function loadDocuments() {
  const category = document.getElementById('document-category-filter')?.value || 'All';
  const container = document.getElementById('documents-grid');
  if (!container) return;

  try {
    const res = await apiCall(`/documents?category=${category}`);
    const docs = res.data.documents || [];

    if (docs.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📂</div>
          <h3>Document Vault is Empty</h3>
          <p style="color: var(--text-secondary); font-size: 0.9rem;">Safely store your Aadhaar, Passport, Certificates, Insurance, and Bills.</p>
        </div>
      `;
      return;
    }

    const now = new Date();

    container.innerHTML = docs
      .map((doc) => {
        let expiryBadge = '';
        if (doc.expiryDate) {
          const daysLeft = Math.ceil((new Date(doc.expiryDate) - now) / (1000 * 60 * 60 * 24));
          if (daysLeft < 0) {
            expiryBadge = `<span class="badge badge-danger">EXPIRED</span>`;
          } else if (daysLeft <= 30) {
            expiryBadge = `<span class="badge badge-warning">Expires in ${daysLeft} days</span>`;
          } else {
            expiryBadge = `<span class="badge badge-success">Valid till ${new Date(doc.expiryDate).toLocaleDateString()}</span>`;
          }
        }

        return `
        <div class="document-card">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div class="document-icon">📄</div>
              ${expiryBadge}
            </div>
            <strong style="font-size: 1.05rem; display: block; margin-top: 0.5rem;">${doc.name}</strong>
            <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.2rem;">
              ${doc.category} • Uploaded ${new Date(doc.uploadDate).toLocaleDateString()}
            </div>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.5rem;">${doc.description || 'No description provided.'}</p>
          </div>
          <div style="display: flex; gap: 0.5rem; margin-top: 1.25rem;">
            <a href="${doc.fileUrl}" target="_blank" class="btn btn-secondary btn-sm" style="flex: 1; text-align: center;">👁️ Preview / Download</a>
            <button class="btn-icon" onclick="deleteDocument('${doc._id}')">🗑️</button>
          </div>
        </div>
      `;
      })
      .join('');
  } catch (err) {
    showToast('Failed to load documents', 'error');
  }
}

async function deleteDocument(id) {
  if (!confirm('Permanently delete this document from your vault?')) return;
  try {
    await apiCall(`/documents/${id}`, { method: 'DELETE' });
    showToast('Document deleted', 'info');
    loadDocuments();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
