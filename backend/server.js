require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");

const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/auth");
const patientRoutes = require("./src/routes/patients");
const analysisRoutes = require("./src/routes/analysis");
const appointmentRoutes = require("./src/routes/appointments");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

connectDB();

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/appointments", appointmentRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "Health Risk Backend API", timestamp: new Date().toISOString() });
});

io.on("connection", (socket) => {
  console.log(`Socket client connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Express Backend Server running on port ${PORT}`);
});
