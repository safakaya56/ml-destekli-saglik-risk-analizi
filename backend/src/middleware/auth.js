const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "health_risk_super_secret_key_2026";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access denied. Token missing." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token." });
  }
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: `Forbidden. ${role} access required.` });
    }
    next();
  };
};

module.exports = { authenticateToken, requireRole, JWT_SECRET };
