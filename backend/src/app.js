import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import authRoutes from "./routes/auth.route.js";
import parcelRoutes from "./routes/parcel.route.js";
import adminRoutes from "./routes/admin.route.js";
const isProduction = process.env.NODE_ENV === "production";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: isProduction
      ? "https://get-fast.pages.dev"
      : "http://localhost:5173",
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.io
io.on("connection", (socket) => {
  console.log("Clientconnected:", socket.id);

  const userId = socket.handshake.auth.userId;
  if (userId) {
    socket.join(`user:${userId}`);
    console.log(`User ${userId} joined their room`);
  }
  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
  });
});

//make io available to routes
app.set("io", io);

//Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timeStamp: new Date() });
});

//Routes
app.use("/api/auth", authRoutes);
app.use("/api/parcels", parcelRoutes);
app.use("/api/admin", adminRoutes);

//Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

export { app, server, io };
