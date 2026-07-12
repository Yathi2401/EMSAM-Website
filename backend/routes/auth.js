import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  const { fullName, email, phone, school, stream, alYear, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: "Full name, email and password are required." });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must contain at least 6 characters." });
  }

  try {
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email.toLowerCase()]);

    if (existing.length > 0) {
      return res.status(409).json({ message: "An account already exists with this email." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users
       (full_name, email, phone, school, stream, al_year, password_hash, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'student')`,
      [
        fullName.trim(),
        email.toLowerCase().trim(),
        phone || null,
        school || null,
        stream || "Other",
        alYear || null,
        passwordHash,
      ]
    );

    return res.status(201).json({
      message: "Student account created successfully.",
      userId: result.insertId,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to create the account." });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const [rows] = await pool.query(
      `SELECT id, full_name, email, password_hash, role, is_active
       FROM users WHERE email = ?`,
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    const user = rows[0];

    if (!user.is_active) {
      return res.status(403).json({ message: "This account has been disabled." });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to log in." });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, full_name, email, phone, school, stream, al_year, role, created_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Account not found." });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to load the account." });
  }
});

export default router;
