const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, required: true },
  notes: String,
  status: { type: String, default: 'pending' },
});

module.exports = mongoose.model('Appointment', appointmentSchema);
