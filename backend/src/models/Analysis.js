const mongoose = require("mongoose");

const analysisSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "PatientProfile", required: true },
  labTestId: { type: mongoose.Schema.Types.ObjectId, ref: "LabTest", required: true },
  createdAt: { type: Date, default: Date.now },
  predictions: {
    diabetes: {
      predicted_class: Number,
      risk_label: String,
      probability: Number,
      model_version: String
    },
    cardiovascular: {
      predicted_class: Number,
      risk_label: String,
      probability: Number,
      model_version: String
    },
    kidney: {
      predicted_class: Number,
      risk_label: String,
      probability: Number,
      model_version: String
    }
  },
  shapExplanations: { type: mongoose.Schema.Types.Mixed },
  llmSummary: {
    summary: String,
    findings: [String],
    recommendations: [String],
    disclaimer: String
  },
  isApprovedByDoctor: { type: Boolean, default: false },
  doctorNotes: { type: String, default: "" }
});

module.exports = mongoose.model("Analysis", analysisSchema);
