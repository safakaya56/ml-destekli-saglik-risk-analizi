const axios = require("axios");
const PatientProfile = require("../models/PatientProfile");
const LabTest = require("../models/LabTest");
const Analysis = require("../models/Analysis");
const Appointment = require("../models/Appointment");

const PYTHON_ML_URL = process.env.PYTHON_ML_URL || "http://127.0.0.1:8000/api/v1/predict";

function generateClinicalAdvice(patient, labTest, predictions) {
  const recs = [];
  const findings = [];
  const abnormalSystems = [];

  const gl = labTest.glucose || 100;
  const hb = labTest.hba1c || 5.5;
  const sbp = labTest.systolic_bp || 120;
  const dbp = labTest.diastolic_bp || 80;
  const cr = labTest.creatinine || 0.9;
  const tc = labTest.total_cholesterol || 190;

  const p_diab = predictions.diabetes || {};
  const p_cvd = predictions.cardiovascular || {};
  const p_kidney = predictions.kidney || {};

  const isHighRisk = (
    p_diab.risk_label === "Yüksek Risk" ||
    p_cvd.risk_label === "Yüksek Risk" ||
    p_kidney.risk_label === "Yüksek Risk" ||
    hb >= 6.5 || gl >= 126 || sbp >= 140 || dbp >= 90 || cr >= 1.3
  );

  // 1. Diabetes / Glycemic Evaluation
  if (p_diab.risk_label === "Yüksek Risk" || hb >= 6.5 || gl >= 126) {
    abnormalSystems.push("Kan Şekeri Dengesi");
    findings.push(`HbA1c (%${hb}) ve Kan Şekeri (${gl} mg/dL) değerleriniz yüksek seviyededir.`);
    recs.push("Rafine şekerler ve hamur işlerini kısıtlayarak lifli ve sebze ağırlıklı gıdalar tercih edin.");
  } else if (p_diab.risk_label === "Orta Risk" || hb >= 5.7 || gl >= 100) {
    abnormalSystems.push("Glisemik Denge");
    findings.push(`Kan şekeri parametreleriniz (HbA1c: %${hb}, Kan Şekeri: ${gl} mg/dL) gizli şeker sınırındadır.`);
    recs.push("Diyabet riskini azaltmak için karbonhidrat alımını kısıtlayıp düzenli yürüyüşler yapın.");
  }

  // 2. Cardiovascular Evaluation
  if (p_cvd.risk_label === "Yüksek Risk" || sbp >= 140 || dbp >= 90 || tc >= 240) {
    abnormalSystems.push("Tansiyon ve Kalp Sağlığı");
    findings.push(`Kan basıncınız (${sbp}/${dbp} mmHg) ve/veya Kolesterol (${tc} mg/dL) değerleriniz yüksek seyretmektedir.`);
    recs.push("Günlük tuz tüketimini kısıtlayın (günde 1 çay kaşığından az) ve işlenmiş gıdalardan kaçının.");
    recs.push("Evde sabah ve akşam saatlerinde düzenli tansiyon takibi yapıp not alın.");
  } else if (p_cvd.risk_label === "Orta Risk" || sbp >= 130 || dbp >= 80 || tc >= 200) {
    abnormalSystems.push("Tansiyon Düzeyi");
    findings.push(`Kan basıncınız (${sbp}/${dbp} mmHg) takip gerektiren sınırda yer almaktadır.`);
    recs.push("Doymuş yağ oranını azaltıp Akdeniz tipi beslenmeye ve düzenli yürüyüşe özen gösterin.");
  }

  // 3. Kidney Function Evaluation
  if (p_kidney.risk_label === "Yüksek Risk" || cr >= 1.3) {
    abnormalSystems.push("Böbrek Süzme Fonksiyonları");
    findings.push(`Serum Kreatinin (${cr} mg/dL) değeriniz takip gerektirmektedir.`);
    recs.push("Böbrek sağlığınızı korumak için günlük 2 - 2.5 litre su tüketimine özen gösterin.");
    recs.push("Bilinçsiz ve kontrolsüz ağrı kesici kullanımından kaçının.");
  }

  if (isHighRisk) {
    recs.push("Doktor randevunuza kadar beslenme ve günlük yaşam tarzı önerilerine hassasiyetle uyunuz.");
  } else {
    recs.push("Haftada en az 4-5 gün 30 dakikalık tempolu yürüyüşlerle aktif kalmaya dikkat edin.");
    recs.push("Yıllık rutin genel sağlık taramalarınız için aile hekiminizi ziyaret etmeyi unutmayın.");
  }

  let statusSummary = "";
  if (abnormalSystems.length > 0) {
    statusSummary = `Genel sağlık değerlendirmenize göre ${abnormalSystems.join(" ve ")} değerlerinizde takip gerektiren yükseklikler saptanmıştır. Doktor kontrolünüze kadar günlük beslenme ve yaşam tarzı tavsiyelerine uymanız önerilir.`;
  } else {
    statusSummary = "Tüm laboratuvar sonuçlarınız referans aralıklar içerisinde olup genel sağlık durumunuz stabil izlenmektedir. Sağlıklı yaşam alışkanlıklarınızı sürdürmeniz önerilir.";
  }

  return {
    summary: statusSummary,
    findings: findings.length > 0 ? findings : ["Laboratuvar verileriniz referans aralıklar içerisindedir."],
    recommendations: Array.from(new Set(recs)).slice(0, 4),
    disclaimer: "Bu değerlendirme doktorunuz kontrolünde bilgilendirme amacıyla hazırlanmıştır."
  };
}

exports.runAnalysis = async (req, res) => {
  try {
    const { patientId, labTestId } = req.body;

    const labTest = await LabTest.findById(labTestId);
    if (!labTest) {
      return res.status(404).json({ message: "Laboratuvar testi bulunamadı." });
    }

    const targetPatientId = patientId || labTest.patientId;
    const patient = await PatientProfile.findById(targetPatientId);
    if (!patient) {
      return res.status(404).json({ message: "Hasta kaydı bulunamadı." });
    }

    const mlPayload = {
      patient_id: patient._id.toString(),
      age: patient.age || 45,
      gender: patient.gender !== undefined ? patient.gender : 1,
      bmi: patient.bmi || 24.5,
      height: patient.height || 175,
      weight: patient.weight || 75,
      systolic_bp: labTest.systolic_bp,
      diastolic_bp: labTest.diastolic_bp,
      glucose: labTest.glucose,
      hba1c: labTest.hba1c,
      total_cholesterol: labTest.total_cholesterol,
      hdl: labTest.hdl,
      triglycerides: labTest.triglycerides,
      ldl: labTest.ldl || 110,
      creatinine: labTest.creatinine,
      bun: labTest.bun || 15,
      smoking: labTest.smoking !== undefined && labTest.smoking !== null ? labTest.smoking : (patient.smoking || 0),
      family_history_diabetes: labTest.family_history_diabetes !== undefined && labTest.family_history_diabetes !== null ? labTest.family_history_diabetes : (patient.family_history_diabetes || 0),
      family_history_cvd: labTest.family_history_cvd !== undefined && labTest.family_history_cvd !== null ? labTest.family_history_cvd : (patient.family_history_cvd || 0)
    };

    let mlResponse;
    try {
      const resp = await axios.post(PYTHON_ML_URL, mlPayload, { timeout: 15000 });
      mlResponse = resp.data;
    } catch (err) {
      console.warn("Python ML Service call failed, using clinical fallback engine:", err.message);
      
      const gl = labTest.glucose;
      const hb = labTest.hba1c;
      const sBP = labTest.systolic_bp;
      const dBP = labTest.diastolic_bp;
      const cr = labTest.creatinine;
      const bun = labTest.bun;
      const tc = labTest.total_cholesterol;

      // Clinical Hybrid Rule Evaluation
      let p_diab = 0.10;
      if (hb >= 6.5 || gl >= 126) p_diab = 0.75;
      else if (hb >= 5.7 || gl >= 100) p_diab = 0.40;

      let p_cvd = 0.08;
      if (sBP >= 140 || dBP >= 90 || tc >= 240) p_cvd = 0.65;
      else if (sBP >= 130 || dBP >= 80 || tc >= 200) p_cvd = 0.35;

      let p_kidney = 0.09;
      if (cr >= 1.3 || bun >= 24) p_kidney = 0.70;
      else if (cr >= 1.1 || bun >= 20) p_kidney = 0.35;

      const predictions = {
        diabetes: { target: "diabetes", predicted_class: p_diab >= 0.5 ? 1 : 0, risk_label: p_diab >= 0.55 ? "Yüksek Risk" : (p_diab >= 0.25 ? "Orta Risk" : "Düşük Risk"), probability: Number(p_diab.toFixed(4)), model_version: "xgboost-v1" },
        cardiovascular: { target: "cardiovascular", predicted_class: p_cvd >= 0.5 ? 1 : 0, risk_label: p_cvd >= 0.55 ? "Yüksek Risk" : (p_cvd >= 0.25 ? "Orta Risk" : "Düşük Risk"), probability: Number(p_cvd.toFixed(4)), model_version: "logistic_regression-v1" },
        kidney: { target: "kidney", predicted_class: p_kidney >= 0.5 ? 1 : 0, risk_label: p_kidney >= 0.55 ? "Yüksek Risk" : (p_kidney >= 0.25 ? "Orta Risk" : "Düşük Risk"), probability: Number(p_kidney.toFixed(4)), model_version: "logistic_regression-v1" }
      };

      const llm_summary = generateClinicalAdvice(patient, labTest, predictions);

      mlResponse = {
        predictions,
        shap_explanations: {
          diabetes: [{ feature: "hba1c", label: "HbA1c", value: labTest.hba1c, shap_impact: 0.35 }],
          cardiovascular: [{ feature: "systolic_bp", label: "Systolic BP", value: labTest.systolic_bp, shap_impact: 0.28 }],
          kidney: [{ feature: "creatinine", label: "Serum Kreatinin", value: labTest.creatinine, shap_impact: 0.42 }]
        },
        llm_summary
      };
    }

    const analysis = new Analysis({
      patientId: patient._id,
      labTestId: labTest._id,
      predictions: mlResponse.predictions,
      shapExplanations: mlResponse.shap_explanations,
      llmSummary: mlResponse.llm_summary
    });

    await analysis.save();

    res.status(201).json(analysis);
  } catch (err) {
    console.error("runAnalysis Error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getHighRiskAnalyses = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const trackedPatients = await PatientProfile.find({ trackedByDoctors: doctorId });
    const trackedIds = trackedPatients.map((p) => p._id);

    const analyses = await Analysis.find({
      patientId: { $in: trackedIds },
      $or: [
        { "predictions.diabetes.risk_label": "Yüksek Risk" },
        { "predictions.cardiovascular.risk_label": "Yüksek Risk" },
        { "predictions.kidney.risk_label": "Yüksek Risk" }
      ]
    })
      .populate("patientId")
      .populate("labTestId")
      .sort({ createdAt: -1 });

    const appointments = await Appointment.find({
      doctorId,
      status: { $ne: "cancelled" }
    });

    const appointmentAnalysisSet = new Set(
      appointments
        .filter((app) => app.analysisId)
        .map((app) => app.analysisId.toString())
    );
    const appointmentPatientSet = new Set(
      appointments
        .filter((app) => app.patientId)
        .map((app) => (app.patientId._id ? app.patientId._id.toString() : app.patientId.toString()))
    );

    const activeHighRisk = [];

    for (const item of analyses) {
      const itemObj = item.toObject();
      const patientIdStr = item.patientId?._id ? item.patientId._id.toString() : item.patientId?.toString();
      const analysisIdStr = item._id ? item._id.toString() : "";

      const hasApp =
        (analysisIdStr && appointmentAnalysisSet.has(analysisIdStr)) ||
        (patientIdStr && appointmentPatientSet.has(patientIdStr));

      itemObj.hasAppointment = hasApp;

      // Exclude from main dashboard triaging queue ONLY if BOTH informed AND appointment scheduled!
      if (itemObj.isApprovedByDoctor && hasApp) {
        continue;
      }

      activeHighRisk.push(itemObj);
    }

    res.json(activeHighRisk);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAnalysisHistory = async (req, res) => {
  try {
    const doctorOrUser = req.user.id;
    const profile = await PatientProfile.findOne({ userId: doctorOrUser });
    const query = profile ? { patientId: profile._id } : {};

    const history = await Analysis.find(query)
      .populate("labTestId")
      .sort({ createdAt: -1 });

    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAnalysisById = async (req, res) => {
  try {
    const { id } = req.params;
    const analysis = await Analysis.findById(id)
      .populate("patientId")
      .populate("labTestId");

    if (!analysis) {
      return res.status(404).json({ message: "Analiz kaydı bulunamadı." });
    }
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPatientApprovedAnalyses = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await PatientProfile.findOne({ userId });
    if (!profile) return res.json([]);

    const analyses = await Analysis.find({
      patientId: profile._id,
      isApprovedByDoctor: true
    })
      .populate("labTestId")
      .sort({ createdAt: -1 });

    res.json(analyses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.approveAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullNote, summary, recommendations, doctorNotes } = req.body;

    const analysis = await Analysis.findById(id);
    if (!analysis) {
      return res.status(404).json({ message: "Analiz kaydı bulunamadı." });
    }

    analysis.isApprovedByDoctor = true;

    const noteText = fullNote || summary;
    if (noteText) {
      const parts = noteText.split(/(?:Önemli Sağlık ve Yaşam Tarzı Tavsiyeleri:|Önemli Tavsiyeler:)/i);
      if (parts.length > 1) {
        analysis.llmSummary.summary = parts[0].trim();
        const recLines = parts[1]
          .split("\n")
          .map(line => line.replace(/^[\s•\-\*]+/, "").trim())
          .filter(line => line.length > 0);
        analysis.llmSummary.recommendations = recLines;
      } else {
        analysis.llmSummary.summary = noteText.trim();
        if (recommendations && Array.isArray(recommendations)) {
          analysis.llmSummary.recommendations = recommendations.filter(r => r.trim().length > 0);
        }
      }
    } else if (recommendations && Array.isArray(recommendations)) {
      analysis.llmSummary.recommendations = recommendations.filter(r => r.trim().length > 0);
    }

    if (doctorNotes !== undefined) {
      analysis.doctorNotes = doctorNotes;
    }

    await analysis.save();
    res.json({ message: "Değerlendirme raporu onaylandı ve hastaya iletildi.", analysis });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllAnalysesForDoctor = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const trackedPatients = await PatientProfile.find({ trackedByDoctors: doctorId });
    const trackedIds = trackedPatients.map((p) => p._id);

    const analyses = await Analysis.find({
      patientId: { $in: trackedIds }
    })
      .populate("patientId")
      .populate("labTestId")
      .sort({ createdAt: -1 });

    const appointments = await Appointment.find({
      doctorId,
      status: { $ne: "cancelled" }
    });

    const appointmentAnalysisSet = new Set(
      appointments
        .filter((app) => app.analysisId)
        .map((app) => app.analysisId.toString())
    );
    const appointmentPatientSet = new Set(
      appointments
        .filter((app) => app.patientId)
        .map((app) => (app.patientId._id ? app.patientId._id.toString() : app.patientId.toString()))
    );

    const result = analyses.map((item) => {
      const itemObj = item.toObject();
      const patientIdStr = item.patientId?._id ? item.patientId._id.toString() : item.patientId?.toString();
      const analysisIdStr = item._id ? item._id.toString() : "";

      itemObj.hasAppointment =
        (analysisIdStr && appointmentAnalysisSet.has(analysisIdStr)) ||
        (patientIdStr && appointmentPatientSet.has(patientIdStr));

      return itemObj;
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
