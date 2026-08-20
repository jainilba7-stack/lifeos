const Task = require('../models/Task');
const Note = require('../models/Note');
const Expense = require('../models/Expense');
const Document = require('../models/Document');
const Goal = require('../models/Goal');
const Appointment = require('../models/Appointment');
const Medicine = require('../models/Medicine');
const ApiResponse = require('../utils/apiResponse');

// @desc    Global search across all modules
// @route   GET /api/search?q=query
exports.globalSearch = async (req, res, next) => {
  try {
    const queryStr = req.query.q || '';
    if (!queryStr.trim()) {
      return ApiResponse.success(res, 'Empty search query', { results: [] });
    }

    const regex = new RegExp(queryStr, 'i');
    const userId = req.user.id;

    const [tasks, notes, expenses, documents, goals, appointments, medicines] = await Promise.all([
      Task.find({
        user: userId,
        $or: [{ title: regex }, { description: regex }, { category: regex }]
      }).limit(5),

      Note.find({
        user: userId,
        $or: [{ title: regex }, { content: regex }, { category: regex }, { tags: regex }]
      }).limit(5),

      Expense.find({
        user: userId,
        $or: [{ description: regex }, { category: regex }, { paymentMethod: regex }]
      }).limit(5),

      Document.find({
        user: userId,
        $or: [{ name: regex }, { description: regex }, { category: regex }]
      }).limit(5),

      Goal.find({
        user: userId,
        $or: [{ title: regex }, { description: regex }, { category: regex }]
      }).limit(5),

      Appointment.find({
        user: userId,
        $or: [{ title: regex }, { personOrOrg: regex }, { location: regex }, { notes: regex }]
      }).limit(5),

      Medicine.find({
        user: userId,
        $or: [{ name: regex }, { instructions: regex }]
      }).limit(5)
    ]);

    const results = [
      ...tasks.map((t) => ({ type: 'Task', id: t._id, title: t.title, subtitle: `${t.category} • ${t.priority} Priority`, link: '/pages/tasks.html' })),
      ...notes.map((n) => ({ type: 'Note', id: n._id, title: n.title, subtitle: `${n.category} Note`, link: '/pages/notes.html' })),
      ...expenses.map((e) => ({ type: 'Expense', id: e._id, title: `${e.description || e.category}`, subtitle: `₹${e.amount} (${e.type})`, link: '/pages/expenses.html' })),
      ...documents.map((d) => ({ type: 'Document', id: d._id, title: d.name, subtitle: `${d.category} Document`, link: '/pages/documents.html' })),
      ...goals.map((g) => ({ type: 'Goal', id: g._id, title: g.title, subtitle: `${g.currentValue}/${g.targetValue} ${g.unit}`, link: '/pages/goals.html' })),
      ...appointments.map((a) => ({ type: 'Appointment', id: a._id, title: a.title, subtitle: `With ${a.personOrOrg}`, link: '/pages/appointments.html' })),
      ...medicines.map((m) => ({ type: 'Medicine', id: m._id, title: m.name, subtitle: `${m.dosage} @ ${m.reminderTime}`, link: '/pages/medicines.html' }))
    ];

    return ApiResponse.success(res, `Global search results for '${queryStr}'`, {
      results,
      count: results.length
    });
  } catch (error) {
    next(error);
  }
};
