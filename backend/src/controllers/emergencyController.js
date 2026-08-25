const EmergencyProfile = require('../models/EmergencyProfile');
const ApiResponse = require('../utils/apiResponse');
const QRCode = require('qrcode');

// @desc    Get current user's emergency profile
// @route   GET /api/emergency
exports.getEmergencyProfile = async (req, res, next) => {
  try {
    let profile = await EmergencyProfile.findOne({ user: req.user.id });
    if (!profile) {
      profile = await EmergencyProfile.create({ user: req.user.id });
    }
    return ApiResponse.success(res, 'Emergency profile retrieved', { profile });
  } catch (error) {
    next(error);
  }
};

// @desc    Update emergency profile details & sharing options
// @route   PUT /api/emergency
exports.updateEmergencyProfile = async (req, res, next) => {
  try {
    let profile = await EmergencyProfile.findOne({ user: req.user.id });
    if (!profile) {
      profile = new EmergencyProfile({ user: req.user.id });
    }

    const {
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
    } = req.body;

    if (bloodGroup !== undefined) profile.bloodGroup = bloodGroup;
    if (emergencyContactName !== undefined) profile.emergencyContactName = emergencyContactName;
    if (emergencyContactPhone !== undefined) profile.emergencyContactPhone = emergencyContactPhone;
    if (emergencyContactRelation !== undefined) profile.emergencyContactRelation = emergencyContactRelation;
    if (doctorContactName !== undefined) profile.doctorContactName = doctorContactName;
    if (doctorContactPhone !== undefined) profile.doctorContactPhone = doctorContactPhone;
    if (allergies !== undefined) profile.allergies = allergies;
    if (chronicConditions !== undefined) profile.chronicConditions = chronicConditions;
    if (importantNotes !== undefined) profile.importantNotes = importantNotes;

    if (sharedInQR) {
      profile.sharedInQR = { ...profile.sharedInQR, ...sharedInQR };
    }

    await profile.save();
    return ApiResponse.success(res, 'Emergency profile updated successfully', { profile });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate Emergency QR Code Data URL (Formats as readable text for mobile cameras)
// @route   GET /api/emergency/qr
exports.getEmergencyQR = async (req, res, next) => {
  try {
    const profile = await EmergencyProfile.findOne({ user: req.user.id });
    if (!profile) {
      return ApiResponse.error(res, 'Emergency profile not configured', [], 404);
    }

    // Format payload as human-readable structured text for phone camera scanners
    const lines = [`🚨 LIFEOS EMERGENCY MEDICAL CARD 🚨`, `Name: ${req.user.fullName}`];

    if (profile.sharedInQR.bloodGroup && profile.bloodGroup && profile.bloodGroup !== 'Unknown') {
      lines.push(`Blood Group: ${profile.bloodGroup}`);
    }
    if (profile.sharedInQR.emergencyContactName && profile.emergencyContactName) {
      const relation = profile.emergencyContactRelation ? ` (${profile.emergencyContactRelation})` : '';
      lines.push(`Emergency Contact: ${profile.emergencyContactName}${relation}`);
    }
    if (profile.sharedInQR.emergencyContactPhone && profile.emergencyContactPhone) {
      lines.push(`Phone: ${profile.emergencyContactPhone}`);
    }
    if (profile.sharedInQR.allergies && profile.allergies) {
      lines.push(`Allergies: ${profile.allergies}`);
    }
    if (profile.sharedInQR.doctorContactPhone && profile.doctorContactPhone) {
      lines.push(`Doctor Phone: ${profile.doctorContactPhone}`);
    }
    if (profile.sharedInQR.importantNotes && profile.importantNotes) {
      lines.push(`Notes: ${profile.importantNotes}`);
    }

    const payloadText = lines.join('\n');

    const qrDataUrl = await QRCode.toDataURL(payloadText, {
      errorCorrectionLevel: 'M',
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    return ApiResponse.success(res, 'Emergency QR Code generated', {
      qrDataUrl,
      payloadText
    });
  } catch (error) {
    next(error);
  }
};
