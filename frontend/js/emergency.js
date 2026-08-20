/* LifeOS Emergency Profile & QR Code Controller */

document.addEventListener('DOMContentLoaded', async () => {
  checkAuth();
  await loadEmergencyProfile();

  document.getElementById('emergency-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const bloodGroup = document.getElementById('emg-blood').value;
    const emergencyContactName = document.getElementById('emg-contact-name').value;
    const emergencyContactPhone = document.getElementById('emg-contact-phone').value;
    const emergencyContactRelation = document.getElementById('emg-contact-relation').value;
    const doctorContactName = document.getElementById('emg-doc-name').value;
    const doctorContactPhone = document.getElementById('emg-doc-phone').value;
    const allergies = document.getElementById('emg-allergies').value;
    const chronicConditions = document.getElementById('emg-chronic').value;
    const importantNotes = document.getElementById('emg-notes').value;

    const sharedInQR = {
      bloodGroup: document.getElementById('qr-share-blood').checked,
      emergencyContactName: document.getElementById('qr-share-name').checked,
      emergencyContactPhone: document.getElementById('qr-share-phone').checked,
      allergies: document.getElementById('qr-share-allergies').checked,
      importantNotes: document.getElementById('qr-share-notes').checked,
      doctorContactPhone: document.getElementById('qr-share-doc').checked
    };

    try {
      await apiCall('/emergency', {
        method: 'PUT',
        body: {
          bloodGroup,
          emergencyContactName,
          emergencyContactPhone,
          emergencyContactRelation,
          doctorContactName,
          doctorContactPhone,
          allergies,
          chronicConditions,
          importantNotes,
          sharedInQR
        }
      });
      showToast('Emergency Card updated successfully', 'success');
      loadEmergencyProfile();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  document.getElementById('generate-qr-btn')?.addEventListener('click', generateEmergencyQR);
});

async function loadEmergencyProfile() {
  try {
    const res = await apiCall('/emergency');
    const p = res.data.profile || {};

    document.getElementById('emg-blood').value = p.bloodGroup || 'Unknown';
    document.getElementById('emg-contact-name').value = p.emergencyContactName || '';
    document.getElementById('emg-contact-phone').value = p.emergencyContactPhone || '';
    document.getElementById('emg-contact-relation').value = p.emergencyContactRelation || '';
    document.getElementById('emg-doc-name').value = p.doctorContactName || '';
    document.getElementById('emg-doc-phone').value = p.doctorContactPhone || '';
    document.getElementById('emg-allergies').value = p.allergies || '';
    document.getElementById('emg-chronic').value = p.chronicConditions || '';
    document.getElementById('emg-notes').value = p.importantNotes || '';

    if (p.sharedInQR) {
      document.getElementById('qr-share-blood').checked = !!p.sharedInQR.bloodGroup;
      document.getElementById('qr-share-name').checked = !!p.sharedInQR.emergencyContactName;
      document.getElementById('qr-share-phone').checked = !!p.sharedInQR.emergencyContactPhone;
      document.getElementById('qr-share-allergies').checked = !!p.sharedInQR.allergies;
      document.getElementById('qr-share-notes').checked = !!p.sharedInQR.importantNotes;
      document.getElementById('qr-share-doc').checked = !!p.sharedInQR.doctorContactPhone;
    }

    // Render Preview Card
    const bloodBadge = document.getElementById('card-blood-badge');
    if (bloodBadge) bloodBadge.textContent = `Blood Group: ${p.bloodGroup || 'Unknown'}`;

    const contactText = document.getElementById('card-contact-text');
    if (contactText) {
      contactText.textContent = p.emergencyContactName
        ? `${p.emergencyContactName} (${p.emergencyContactRelation || 'Emergency'}) • 📞 ${p.emergencyContactPhone}`
        : 'No emergency contact specified yet.';
    }

    const allergiesText = document.getElementById('card-allergies-text');
    if (allergiesText) {
      allergiesText.textContent = p.allergies ? `⚠️ Allergies: ${p.allergies}` : 'No known allergies reported.';
    }

    generateEmergencyQR();
  } catch (err) {
    showToast('Failed to load emergency profile', 'error');
  }
}

async function generateEmergencyQR() {
  const qrImg = document.getElementById('emergency-qr-img');
  const modal = document.getElementById('qr-modal');

  try {
    const res = await apiCall('/emergency/qr');
    if (qrImg) qrImg.src = res.data.qrDataUrl;
    if (modal) modal.classList.add('active');
  } catch (err) {
    showToast('Failed to generate emergency QR code', 'error');
  }
}
