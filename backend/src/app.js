import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { timeStamp } from "console";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
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

//Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

export { app, server, io };
