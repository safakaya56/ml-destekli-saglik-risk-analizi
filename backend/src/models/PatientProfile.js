const mongoose = require("mongoose");

const patientProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  trackedByDoctors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  name: { type: String, required: true },
  tcNo: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: Number, enum: [0, 1], required: true }, // 1: Male, 0: Female
  height: { type: Number, default: 175 },
  weight: { type: Number, default: 75 },
  bmi: { type: Number, required: true },
  smoking: { type: Number, default: 0 }, // 1: Smoker/Ever, 0: Never
  family_history_diabetes: { type: Number, default: 0 }, // 1: Yes, 0: No
  family_history_cvd: { type: Number, default: 0 }, // 1: Yes, 0: No
  isDemo: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("PatientProfile", patientProfileSchema);
