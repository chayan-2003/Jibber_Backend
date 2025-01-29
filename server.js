import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes.js";
import mongoose from "mongoose";
import { initializeSocket } from './socket.js';
import roomRoutes from "./routes/roomRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("Connected to DB"))
  .catch((err) => console.log("MongoDB connection failed", err));

initializeSocket(server);
app.use(cors({
  origin: ["http://localhost:3000", "https://joyful-froyo-69e8c4.netlify.app"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization'
],

}));

app.use(express.json());
app.use(cookieParser());


app.get("/", (req, res) => {
  res.json({
    project: "MERN Chat App using Socket.IO",
    message: "Welcome to MERN Chat Application",
    developedBy: "Chayan Ghosh ",
  });
});

app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/chats", chatRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log("Server is up and running on port", PORT));