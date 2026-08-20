const Medicine = require('../models/Medicine');
const ApiResponse = require('../utils/apiResponse');

// @desc    Get all medicines for user
// @route   GET /api/medicines
exports.getMedicines = async (req, res, next) => {
  try {
    const medicines = await Medicine.find({ user: req.user.id }).sort({ reminderTime: 1 });
    return ApiResponse.success(res, 'Medicines retrieved successfully', {
      medicines,
      disclaimerNotice: 'For organizational and reminder purposes only. Not medical advice.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create medicine entry
// @route   POST /api/medicines
exports.createMedicine = async (req, res, next) => {
  try {
    const { name, dosage, frequency, startDate, endDate, quantity, reminderTime, instructions } = req.body;

    const medicine = await Medicine.create({
      user: req.user.id,
      name,
      dosage,
      frequency,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : undefined,
      quantity: quantity !== undefined ? Number(quantity) : 10,
      reminderTime,
      instructions
    });

    return ApiResponse.success(res, 'Medicine created successfully', { medicine }, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update medicine details
// @route   PUT /api/medicines/:id
exports.updateMedicine = async (req, res, next) => {
  try {
    let medicine = await Medicine.findOne({ _id: req.params.id, user: req.user.id });
    if (!medicine) {
      return ApiResponse.error(res, 'Medicine entry not found', [], 404);
    }

    const { name, dosage, frequency, startDate, endDate, quantity, reminderTime, instructions } = req.body;
    if (name !== undefined) medicine.name = name;
    if (dosage !== undefined) medicine.dosage = dosage;
    if (frequency !== undefined) medicine.frequency = frequency;
    if (startDate !== undefined) medicine.startDate = new Date(startDate);
    if (endDate !== undefined) medicine.endDate = endDate ? new Date(endDate) : null;
    if (quantity !== undefined) medicine.quantity = Number(quantity);
    if (reminderTime !== undefined) medicine.reminderTime = reminderTime;
    if (instructions !== undefined) medicine.instructions = instructions;

    await medicine.save();
    return ApiResponse.success(res, 'Medicine updated successfully', { medicine });
  } catch (error) {
    next(error);
  }
};

// @desc    Log medicine taken or missed for today
// @route   POST /api/medicines/:id/log
exports.logMedicineStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // 'taken', 'missed', 'skipped'
    const todayStr = new Date().toISOString().split('T')[0];

    const medicine = await Medicine.findOne({ _id: req.params.id, user: req.user.id });
    if (!medicine) {
      return ApiResponse.error(res, 'Medicine not found', [], 404);
    }

    const existingLogIndex = medicine.logs.findIndex((log) => log.date === todayStr);

    if (existingLogIndex >= 0) {
      medicine.logs[existingLogIndex].status = status;
      medicine.logs[existingLogIndex].takenAt = new Date();
    } else {
      medicine.logs.push({
        date: todayStr,
        status,
        takenAt: new Date()
      });
    }

    // Decrement quantity if taken
    if (status === 'taken' && medicine.quantity > 0) {
      medicine.quantity -= 1;
    }

    await medicine.save();
    return ApiResponse.success(res, `Medicine logged as ${status}`, { medicine });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete medicine entry
// @route   DELETE /api/medicines/:id
exports.deleteMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!medicine) {
      return ApiResponse.error(res, 'Medicine entry not found', [], 404);
    }
    return ApiResponse.success(res, 'Medicine deleted successfully');
  } catch (error) {
    next(error);
  }
};
