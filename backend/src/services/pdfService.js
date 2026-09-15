const PDFDocument = require("pdfkit");

exports.generateAnalysisPDF = (analysis, patient, labTest, res) => {
  const doc = new PDFDocument({ margin: 40, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=Health_Risk_Report_${patient.name.replace(/\s+/g, "_")}.pdf`
  );

  doc.pipe(res);

  // Header
  doc
    .fontSize(20)
    .fillColor("#0284c7")
    .text("AI-ASSISTED HEALTH RISK ASSESSMENT REPORT", { align: "center" })
    .moveDown(0.5);

  doc
    .fontSize(10)
    .fillColor("#64748b")
    .text(`Report Date: ${new Date(analysis.createdAt).toLocaleDateString("tr-TR")}`, { align: "center" })
    .moveDown(1.5);

  // Divider
  doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#cbd5e1").stroke().moveDown(1);

  // Patient Info Section
  doc.fontSize(14).fillColor("#0f172a").text("1. Patient Profile", { underline: true }).moveDown(0.5);
  doc.fontSize(10).fillColor("#334155");
  doc.text(`Name / Surname: ${patient.name}`);
  doc.text(`T.C. No: ${patient.tcNo || "N/A"}`);
  doc.text(`Age: ${patient.age} years | Gender: ${patient.gender === 1 ? "Male" : "Female"}`);
  doc.text(`BMI: ${patient.bmi} kg/m² (${patient.height || 170} cm, ${patient.weight || 70} kg)`).moveDown(1.5);

  // Lab Results Section
  doc.fontSize(14).fillColor("#0f172a").text("2. Laboratory Values", { underline: true }).moveDown(0.5);
  doc.fontSize(10).fillColor("#334155");
  doc.text(`Blood Pressure: ${labTest.systolic_bp} / ${labTest.diastolic_bp} mmHg`);
  doc.text(`Fasting Glucose: ${labTest.glucose} mg/dL | HbA1c: ${labTest.hba1c} %`);
  doc.text(`Lipid Profile: Total Chol ${labTest.total_cholesterol} mg/dL, HDL ${labTest.hdl} mg/dL, LDL ${labTest.ldl} mg/dL, Triglycerides ${labTest.triglycerides} mg/dL`);
  doc.text(`Renal Markers: Serum Creatinine ${labTest.creatinine} mg/dL, BUN ${labTest.bun} mg/dL`).moveDown(1.5);

  // Predictions Section
  doc.fontSize(14).fillColor("#0f172a").text("3. AI Multi-Target Risk Predictions", { underline: true }).moveDown(0.5);
  const preds = analysis.predictions || {};

  ["diabetes", "cardiovascular", "kidney"].forEach((targetKey) => {
    const p = preds[targetKey] || {};
    const probPct = ((p.probability || 0) * 100).toFixed(1);
    const title = targetKey.toUpperCase();

    doc.fontSize(11).fillColor("#0284c7").text(`• ${title} ASSESSMENT:`, { continued: true });
    doc.fillColor("#0f172a").text(` Risk Label: ${p.risk_label || "N/A"} | Probability: ${probPct}% (Model: ${p.model_version || "v1"})`);
  });

  doc.moveDown(1.5);

  // Clinical Summary & Disclaimer
  doc.fontSize(14).fillColor("#0f172a").text("4. Clinical Support Summary & Findings", { underline: true }).moveDown(0.5);
  doc.fontSize(10).fillColor("#334155");

  if (analysis.llmSummary) {
    doc.text(analysis.llmSummary.summary || "").moveDown(0.5);
    (analysis.llmSummary.findings || []).forEach((f) => doc.text(`- ${f}`));
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor("#dc2626").text(`Disclaimer: ${analysis.llmSummary.disclaimer || ""}`);
  }

  doc.end();
};
