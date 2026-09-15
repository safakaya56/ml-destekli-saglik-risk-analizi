const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patientController");
const { authenticateToken } = require("../middleware/auth");

router.get("/", authenticateToken, patientController.getPatients);
router.get("/me/profile", authenticateToken, patientController.getMyProfile);
router.put("/me/profile", authenticateToken, patientController.updateMyProfile);
router.get("/tracked", authenticateToken, patientController.getTrackedPatients);
router.get("/:patientId", authenticateToken, patientController.getPatientById);
router.post("/", authenticateToken, patientController.createPatient);
router.post("/:patientId/track", authenticateToken, patientController.trackPatient);
router.post("/:patientId/untrack", authenticateToken, patientController.untrackPatient);

router.post("/:patientId/labs", authenticateToken, patientController.createLabTest);
router.get("/:patientId/labs", authenticateToken, patientController.getPatientLabs);

module.exports = router;
