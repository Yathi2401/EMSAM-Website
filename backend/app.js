import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import "./config/db.js";

import authRoutes from "./routes/auth.js";
import publicRoutes from "./routes/public.js";
import adminRoutes from "./routes/admin.js";
import multer from "multer";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads/papers", express.static(path.join(__dirname, "uploads/papers")));

app.use("/api/auth", authRoutes);
app.use("/api", publicRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ message: error.code === "LIMIT_FILE_SIZE" ? "The uploaded file is too large." : "Invalid file upload." });
  }
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON request body." });
  }
  if (error.type === "entity.too.large") {
    return res.status(413).json({ message: "The request body is too large." });
  }
  console.error(error);
  res.status(500).json({ message: "Unexpected server error." });
});


export default app;

