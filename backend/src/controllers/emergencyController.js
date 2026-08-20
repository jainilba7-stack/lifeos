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

// @desc    Generate Emergency QR Code Data URL (Contains only explicitly shared fields)
// @route   GET /api/emergency/qr
exports.getEmergencyQR = async (req, res, next) => {
  try {
    const profile = await EmergencyProfile.findOne({ user: req.user.id });
    if (!profile) {
      return ApiResponse.error(res, 'Emergency profile not configured', [], 404);
    }

    // Build payload containing ONLY explicitly authorized fields
    const publicPayload = {
      cardType: 'LifeOS Emergency Card',
      userName: req.user.fullName
    };

    if (profile.sharedInQR.bloodGroup && profile.bloodGroup !== 'Unknown') {
      publicPayload.bloodGroup = profile.bloodGroup;
    }
    if (profile.sharedInQR.emergencyContactName && profile.emergencyContactName) {
      publicPayload.emergencyContactName = profile.emergencyContactName;
    }
    if (profile.sharedInQR.emergencyContactPhone && profile.emergencyContactPhone) {
      publicPayload.emergencyContactPhone = profile.emergencyContactPhone;
    }
    if (profile.sharedInQR.allergies && profile.allergies) {
      publicPayload.allergies = profile.allergies;
    }
    if (profile.sharedInQR.importantNotes && profile.importantNotes) {
      publicPayload.importantNotes = profile.importantNotes;
    }
    if (profile.sharedInQR.doctorContactPhone && profile.doctorContactPhone) {
      publicPayload.doctorPhone = profile.doctorContactPhone;
    }

    const payloadString = JSON.stringify(publicPayload, null, 2);
    const qrDataUrl = await QRCode.toDataURL(payloadString, {
      errorCorrectionLevel: 'H',
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    return ApiResponse.success(res, 'Emergency QR Code generated', {
      qrDataUrl,
      publicPayload
    });
  } catch (error) {
    next(error);
  }
};
