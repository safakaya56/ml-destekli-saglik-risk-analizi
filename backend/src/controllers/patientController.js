const PatientProfile = require("../models/PatientProfile");
const LabTest = require("../models/LabTest");
const Analysis = require("../models/Analysis");
const User = require("../models/User");

exports.getPatients = async (req, res) => {
  try {
    const validUsers = await User.find({ role: "patient" }).select("_id");
    const validUserIds = new Set(validUsers.map((u) => u._id.toString()));

    // Return only untracked patients (not assigned to any doctor)
    const profiles = await PatientProfile.find({
      $or: [
        { trackedByDoctors: { $exists: false } },
        { trackedByDoctors: { $size: 0 } }
      ]
    }).sort({ createdAt: -1 });

    const filtered = profiles.filter((p) => !p.userId || validUserIds.has(p.userId.toString()));
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    let profile = await PatientProfile.findOne({ userId: req.user.id });
    if (!profile) {
      // Create empty profile if not found
      profile = new PatientProfile({
        userId: req.user.id,
        name: req.user.name || "",
        tcNo: req.user.tcNo || "",
        age: 0,
        gender: 1,
        height: 0,
        weight: 0,
        bmi: 0
      });
      await profile.save();
    } else if (!profile.name && req.user.name) {
      profile.name = req.user.name;
      await profile.save();
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const { name, tcNo, age, gender, height, weight, smoking, family_history_diabetes, family_history_cvd } = req.body;
    let profile = await PatientProfile.findOne({ userId: req.user.id });
    if (!profile) {
      profile = new PatientProfile({ userId: req.user.id });
    }

    if (name) profile.name = name;
    if (tcNo) profile.tcNo = tcNo;
    if (age !== undefined) profile.age = Number(age);
    if (gender !== undefined) profile.gender = Number(gender);
    if (height !== undefined) profile.height = Number(height);
    if (weight !== undefined) profile.weight = Number(weight);
    if (smoking !== undefined) profile.smoking = Number(smoking);
    if (family_history_diabetes !== undefined) profile.family_history_diabetes = Number(family_history_diabetes);
    if (family_history_cvd !== undefined) profile.family_history_cvd = Number(family_history_cvd);

    if (profile.height > 0 && profile.weight > 0) {
      const h_m = profile.height / 100;
      profile.bmi = parseFloat((profile.weight / (h_m * h_m)).toFixed(2));
    }

    await profile.save();
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTrackedPatients = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const tracked = await PatientProfile.find({ trackedByDoctors: doctorId }).sort({ createdAt: -1 });
    res.json(tracked);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.trackPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.user.id;

    const patient = await PatientProfile.findById(patientId);
    if (!patient) return res.status(404).json({ message: "Hasta bulunamadı." });

    if (!patient.trackedByDoctors.includes(doctorId)) {
      patient.trackedByDoctors.push(doctorId);
      await patient.save();
    }

    res.json({ message: "Hasta takip listenize eklendi.", patient });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.untrackPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.user.id;

    const patient = await PatientProfile.findById(patientId);
    if (!patient) return res.status(404).json({ message: "Hasta bulunamadı." });

    patient.trackedByDoctors = patient.trackedByDoctors.filter((id) => id.toString() !== doctorId);
    await patient.save();

    res.json({ message: "Hasta takip listenizden çıkarıldı.", patient });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createPatient = async (req, res) => {
  try {
    const { name, tcNo, age, gender, height, weight, smoking, family_history_diabetes, family_history_cvd } = req.body;
    
    const h_m = (height || 175) / 100;
    const bmi = parseFloat(((weight || 75) / (h_m * h_m)).toFixed(2));

    const patient = new PatientProfile({
      name,
      tcNo,
      age: Number(age),
      gender: Number(gender),
      height: Number(height),
      weight: Number(weight),
      bmi,
      smoking: smoking !== undefined ? Number(smoking) : 0,
      family_history_diabetes: family_history_diabetes !== undefined ? Number(family_history_diabetes) : 0,
      family_history_cvd: family_history_cvd !== undefined ? Number(family_history_cvd) : 0,
      trackedByDoctors: req.user ? [req.user.id] : []
    });

    await patient.save();
    res.status(201).json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createLabTest = async (req, res) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.user ? req.user.id : null;

    const patient = await PatientProfile.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Hasta bulunamadı." });
    }

    if (req.user && req.user.role === "doctor" && !patient.trackedByDoctors.includes(doctorId)) {
      return res.status(403).json({ message: "Yalnızca takipli hastalarınıza kan testi girebilirsiniz." });
    }

    const labTest = new LabTest({
      patientId,
      ...req.body,
      createdBy: doctorId
    });

    await labTest.save();
    res.status(201).json(labTest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPatientLabs = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Find all labs for this patient
    const labs = await LabTest.find({ patientId }).sort({ testDate: -1 });

    // Check which labs have already been analyzed
    const labIds = labs.map(l => l._id);
    const existingAnalyses = await Analysis.find({ labTestId: { $in: labIds } });
    const analyzedSet = new Set(existingAnalyses.map(a => a.labTestId.toString()));

    const result = labs.map(lab => ({
      ...lab.toObject(),
      isAnalyzed: analyzedSet.has(lab._id.toString())
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPatientById = async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await PatientProfile.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Hasta bulunamadı." });
    }
    // Check doctor access
    if (req.user && req.user.role === "doctor" && !patient.trackedByDoctors.includes(req.user.id)) {
      return res.status(403).json({ message: "Bu hastaya veri girme yetkiniz yok. Hasta takipli hastalarınız arasında olmalıdır." });
    }
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
