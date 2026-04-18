require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");
const { errorHandler } = require("./middleware/errorMiddleware");
const rateLimiter = require("./middleware/rateLimiter");

// ── Route imports ──────────────────────────────────────────────
const authRoutes = require("./routes/authRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const fingerprintRoutes = require("./routes/fingerprintRoutes");
const detectionRoutes = require("./routes/detectionRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

// ── App & HTTP server setup ────────────────────────────────────
const app = express();
const httpServer = http.createServer(app);

// ── Socket.IO ─────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Attach io to app so controllers can emit events
app.set("io", io);

io.on("connection", (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);
  socket.on("disconnect", () =>
    console.log(`[WS] Client disconnected: ${socket.id}`)
  );
});

// ── Connect Database ───────────────────────────────────────────
connectDB();

// ── Global Middleware ──────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Serve local uploads folder as static
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── API Routes ─────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api", uploadRoutes);
app.use("/api/fingerprint", fingerprintRoutes);
app.use("/api", detectionRoutes);
app.use("/api/analytics", analyticsRoutes);

// ── Health check ───────────────────────────────────────────────
app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() })
);

// ── 404 handler ───────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ message: "Route not found" }));

// ── Global error handler ──────────────────────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () =>
  console.log(
    `[Server] ContentShield AI running on port ${PORT} [${process.env.NODE_ENV}]`
  )
);

module.exports = { app, io };
