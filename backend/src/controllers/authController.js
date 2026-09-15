const jwt = require("jsonwebtoken");
const User = require("../models/User");
const PatientProfile = require("../models/PatientProfile");
const { JWT_SECRET } = require("../middleware/auth");

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, tcNo } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered." });
    }

    const user = new User({ name, email, password, role, tcNo });
    await user.save();

    // If role is patient, create empty patient profile for manual onboarding
    if (role === "patient") {
      const profile = new PatientProfile({
        userId: user._id,
        name: user.name,
        tcNo: tcNo || "",
        age: 0,
        gender: 1,
        height: 0,
        weight: 0,
        bmi: 0,
        smoking: 0,
        family_history_diabetes: 0,
        family_history_cvd: 0
      });
      await profile.save();
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Geçersiz e-posta veya şifre." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Geçersiz e-posta veya şifre." });
    }

    // Role verification check: Prevent login if selected login tab does not match account role
    if (role && user.role !== role) {
      if (user.role === "patient" && role === "doctor") {
        return res.status(403).json({
          message: "⚠️ Hatalı Profil Seçimi: Girdiğiniz e-posta adresi bir HASTA hesabına aittir. Lütfen yukarıdaki menüden 'Hasta Girişi' sekmesini seçerek giriş yapınız."
        });
      } else if (user.role === "doctor" && role === "patient") {
        return res.status(403).json({
          message: "⚠️ Hatalı Profil Seçimi: Girdiğiniz e-posta adresi bir DOKTOR hesabına aittir. Lütfen yukarıdaki menüden 'Doktor Girişi' sekmesini seçerek giriş yapınız."
        });
      }
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Giriş başarılı",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
