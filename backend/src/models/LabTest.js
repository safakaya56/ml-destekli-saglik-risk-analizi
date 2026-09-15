const mongoose = require("mongoose");

const labTestSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "PatientProfile", required: true },
  testDate: { type: Date, default: Date.now },
  title: { type: String, default: "Full Panel Kan Sayımı & Biyokimya" },
  systolic_bp: { type: Number, required: true },
  diastolic_bp: { type: Number, required: true },
  glucose: { type: Number, required: true },
  hba1c: { type: Number, required: true },
  total_cholesterol: { type: Number, required: true },
  hdl: { type: Number, required: true },
  triglycerides: { type: Number, required: true },
  ldl: { type: Number, default: 110 },
  creatinine: { type: Number, required: true },
  bun: { type: Number, default: 15 },
  smoking: { type: Number, default: 0 },
  family_history_diabetes: { type: Number, default: 0 },
  family_history_cvd: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

module.exports = mongoose.model("LabTest", labTestSchema);
