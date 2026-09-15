const express = require("express");
const router = express.Router();
const analysisController = require("../controllers/analysisController");
const { authenticateToken } = require("../middleware/auth");
const { generateAnalysisPDF } = require("../services/pdfService");
const Analysis = require("../models/Analysis");

router.post("/run", authenticateToken, analysisController.runAnalysis);
router.get("/high-risk", authenticateToken, analysisController.getHighRiskAnalyses);
router.get("/all-doctor", authenticateToken, analysisController.getAllAnalysesForDoctor);
router.get("/my-approved", authenticateToken, analysisController.getPatientApprovedAnalyses);
router.put("/:id/approve", authenticateToken, analysisController.approveAnalysis);
router.get("/history/:patientId", authenticateToken, analysisController.getAnalysisHistory);
router.get("/:id", authenticateToken, analysisController.getAnalysisById);

router.get("/:id/pdf", authenticateToken, async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id)
      .populate("patientId")
      .populate("labTestId");

    if (!analysis) {
      return res.status(404).json({ message: "Analiz kaydı bulunamadı." });
    }

    generateAnalysisPDF(analysis, analysis.patientId, analysis.labTestId, res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
