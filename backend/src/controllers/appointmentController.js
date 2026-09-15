const Appointment = require("../models/Appointment");
const PatientProfile = require("../models/PatientProfile");

exports.createAppointment = async (req, res) => {
  try {
    const { patientId, date, time, riskTypes, analysisId, note } = req.body;
    const doctorId = req.user.id;

    if (!date || !time) {
      return res.status(400).json({ message: "Tarih ve saat alanları zorunludur." });
    }

    // 1. Weekday Validation (Pazartesi - Cuma)
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay(); // 0: Pazar, 6: Cumartesi
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return res.status(400).json({ message: "Randevular yalnızca haftaiçi (Pazartesi - Cuma) verilebilir." });
    }

    // 2. Working Hours Validation (09:00 - 17:00)
    const [hour, minute] = time.split(":").map(Number);
    if (hour < 9 || hour >= 17) {
      return res.status(400).json({ message: "Randevular yalnızca mesai saatleri (09:00 - 17:00) arasında verilebilir." });
    }

    // 3. Overlap / Collision Check
    const existing = await Appointment.findOne({
      doctorId,
      date,
      time,
      status: "scheduled"
    });

    if (existing) {
      return res.status(400).json({
        message: `Seçilen tarih ve saatte (${date} ${time}) doktorun tanımlı bir randevusu bulunmaktadır. Lütfen farklı bir saat seçiniz.`
      });
    }

    const appointment = new Appointment({
      patientId,
      doctorId,
      analysisId,
      date,
      time,
      riskTypes: riskTypes || [],
      note: note || "",
      status: "scheduled"
    });

    await appointment.save();

    // Emit Socket.io event for real-time notification
    if (req.io) {
      req.io.emit("appointmentCreated", { appointment });
    }

    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDoctorAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.user.id })
      .populate("patientId")
      .sort({ date: 1, time: 1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPatientAppointments = async (req, res) => {
  try {
    // Find patient profile associated with current user or patientId
    const patientProfile = await PatientProfile.findOne({ userId: req.user.id });
    if (!patientProfile) {
      return res.json([]);
    }

    const appointments = await Appointment.find({ patientId: patientProfile._id })
      .populate("doctorId", "name email")
      .sort({ date: 1, time: 1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(id, { status }, { new: true });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
