/* LifeOS User Profile & Settings Controller */

document.addEventListener('DOMContentLoaded', async () => {
  checkAuth();
  await loadProfile();

  // Profile Form Handler
  document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = document.getElementById('prof-fullName').value;
    const phone = document.getElementById('prof-phone').value;
    const dateOfBirth = document.getElementById('prof-dob').value;
    const bio = document.getElementById('prof-bio').value;

    const fileInput = document.getElementById('prof-avatar-file');
    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('phone', phone);
    formData.append('dateOfBirth', dateOfBirth);
    formData.append('bio', bio);

    if (fileInput.files[0]) {
      formData.append('profileImage', fileInput.files[0]);
    }

    try {
      const res = await apiCall('/profile', {
        method: 'PUT',
        body: formData,
        isFormData: true
      });
      setCurrentUser(res.data.user);
      showToast('Profile details updated', 'success');
      loadProfile();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Password Change Handler
  document.getElementById('password-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('curr-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('conf-password').value;

    try {
      await apiCall('/profile/change-password', {
        method: 'PUT',
        body: { currentPassword, newPassword, confirmPassword }
      });
      showToast('Password changed successfully', 'success');
      document.getElementById('password-form').reset();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Account Deletion Handler
  document.getElementById('delete-account-btn')?.addEventListener('click', async () => {
    const confirmation = prompt('Type DELETE to permanently delete your LifeOS account and all data:');
    if (confirmation !== 'DELETE') {
      return showToast('Account deletion cancelled', 'info');
    }

    try {
      await apiCall('/profile', { method: 'DELETE' });
      showToast('Account permanently deleted', 'info');
      removeToken();
      setTimeout(() => {
        window.location.href = '/pages/register.html';
      }, 1000);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
});

async function loadProfile() {
  try {
    const res = await apiCall('/auth/me');
    const user = res.data.user;

    document.getElementById('prof-fullName').value = user.fullName || '';
    document.getElementById('prof-username').value = `@${user.username}`;
    document.getElementById('prof-email').value = user.email || '';
    document.getElementById('prof-phone').value = user.phone || '';
    document.getElementById('prof-dob').value = user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '';
    document.getElementById('prof-bio').value = user.bio || '';

    const avatarPreview = document.getElementById('profile-avatar-preview');
    if (avatarPreview && user.profileImage) {
      avatarPreview.src = user.profileImage;
    }
  } catch (err) {
    showToast('Failed to load profile details', 'error');
  }
}
