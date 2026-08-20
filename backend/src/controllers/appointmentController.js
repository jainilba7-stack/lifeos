const Appointment = require('../models/Appointment');
const ApiResponse = require('../utils/apiResponse');

// @desc    Get user appointments
// @route   GET /api/appointments
exports.getAppointments = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const query = { user: req.user.id };

    if (status && status !== 'All') query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { personOrOrg: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const appointments = await Appointment.find(query).sort({ date: 1, time: 1 });
    return ApiResponse.success(res, 'Appointments retrieved successfully', {
      appointments,
      count: appointments.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create appointment
// @route   POST /api/appointments
exports.createAppointment = async (req, res, next) => {
  try {
    const { title, personOrOrg, date, time, location, notes } = req.body;

    const appointment = await Appointment.create({
      user: req.user.id,
      title,
      personOrOrg,
      date: new Date(date),
      time,
      location,
      notes,
      status: 'upcoming'
    });

    return ApiResponse.success(res, 'Appointment scheduled successfully', { appointment }, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
exports.updateAppointment = async (req, res, next) => {
  try {
    let appointment = await Appointment.findOne({ _id: req.params.id, user: req.user.id });
    if (!appointment) {
      return ApiResponse.error(res, 'Appointment not found or unauthorized', [], 404);
    }

    const { title, personOrOrg, date, time, location, notes, status } = req.body;
    if (title !== undefined) appointment.title = title;
    if (personOrOrg !== undefined) appointment.personOrOrg = personOrOrg;
    if (date !== undefined) appointment.date = new Date(date);
    if (time !== undefined) appointment.time = time;
    if (location !== undefined) appointment.location = location;
    if (notes !== undefined) appointment.notes = notes;
    if (status !== undefined) appointment.status = status;

    await appointment.save();
    return ApiResponse.success(res, 'Appointment updated successfully', { appointment });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
exports.deleteAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!appointment) {
      return ApiResponse.error(res, 'Appointment not found or unauthorized', [], 404);
    }
    return ApiResponse.success(res, 'Appointment deleted successfully');
  } catch (error) {
    next(error);
  }
};
