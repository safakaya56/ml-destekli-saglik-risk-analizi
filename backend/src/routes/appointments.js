const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointmentController");
const { authenticateToken, requireRole } = require("../middleware/auth");

router.post("/", authenticateToken, requireRole("doctor"), appointmentController.createAppointment);

router.get("/", authenticateToken, (req, res) => {
  if (req.user.role === "doctor") {
    return appointmentController.getDoctorAppointments(req, res);
  }
  return appointmentController.getPatientAppointments(req, res);
});

router.get("/doctor", authenticateToken, requireRole("doctor"), appointmentController.getDoctorAppointments);
router.get("/patient", authenticateToken, appointmentController.getPatientAppointments);
router.put("/:id/status", authenticateToken, appointmentController.updateAppointmentStatus);
router.patch("/:id/status", authenticateToken, appointmentController.updateAppointmentStatus);

module.exports = router;
