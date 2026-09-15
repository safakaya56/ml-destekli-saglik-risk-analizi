const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "PatientProfile", required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  analysisId: { type: mongoose.Schema.Types.ObjectId, ref: "Analysis", required: false },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  time: { type: String, required: true }, // Format: HH:mm (e.g. "10:30")
  riskTypes: [{ type: String }], // e.g. ["Diyabet", "Böbrek", "Kalp"]
  note: { type: String, default: "" },
  status: { type: String, enum: ["scheduled", "completed", "cancelled"], default: "scheduled" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Appointment", appointmentSchema);
