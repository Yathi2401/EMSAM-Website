import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import { requireAuth } from "../middleware/auth.js";
import { examStreams, validText, validEmail, validYear } from "../utils/validation.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  const { fullName, email, phone, school, stream, alYear, password } = req.body || {};

  if (!validText(fullName, 150) || !validEmail(email) || typeof password !== "string" ||
      !validText(phone, 30, true) || !validText(school, 180, true) ||
      (stream && ![...examStreams, "Other"].includes(stream)) || (alYear && !validYear(alYear))) {
    return res.status(400).json({ message: "Provide a valid name, email, password and profile details." });
  }

  if (password.length < 6 || Buffer.byteLength(password, "utf8") > 72) {
    return res.status(400).json({ message: "Password must contain at least 6 characters and at most 72 UTF-8 bytes." });
  }

  try {
    const existing = await User.exists({ email: email.toLowerCase().trim() });

    if (existing) {
      return res.status(409).json({ message: "An account already exists with this email." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await User.create({
      full_name: fullName.trim(), email: email.toLowerCase().trim(),
      phone: phone || null, school: school || null, stream: stream || "Other",
      al_year: alYear || undefined, password_hash: passwordHash, role: "student",
    });

    return res.status(201).json({
      message: "Student account created successfully.",
      userId: result.id,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "An account already exists with this email." });
    }
    console.error(error);
    return res.status(500).json({ message: "Unable to create the account." });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!validEmail(email) || typeof password !== "string" || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password_hash");

    if (!user) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }

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
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "Account not found." });
    }

    return res.json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to load the account." });
  }
});

export default router;
