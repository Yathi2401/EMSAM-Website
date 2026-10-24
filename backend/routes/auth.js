import { rateLimit } from "../middleware/rateLimit.js";
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import { requireAuth } from "../middleware/auth.js";
import { examStreams, validText, validEmail, validYear } from "../utils/validation.js";

const router = express.Router();
const validIndex = value => value == null || value === "" ||
  (typeof value === "string" && /^[A-Za-z0-9/-]{1,30}$/.test(value.trim()));
const normalizeIndex = value => value?.trim().toUpperCase() || undefined;
const duplicateMessage = error => error.keyPattern?.index_number
  ? "An account already exists with this index number."
  : "An account already exists with this email.";
function validProfile({ fullName, email, phone, school, stream, alYear, indexNumber }) {
  return validText(fullName, 150) && validEmail(email) && validText(phone, 30, true) &&
    validText(school, 180, true) && validIndex(indexNumber) &&
    (!stream || [...examStreams, "Other"].includes(stream)) && (!alYear || validYear(alYear));
}
function profileFields({ fullName, email, phone, school, stream, alYear, indexNumber }) {
  return { full_name: fullName.trim(), email: email.trim().toLowerCase(),
    phone: phone?.trim() || null, school: school?.trim() || null,
    stream: stream || "Other", al_year: alYear || undefined,
    index_number: normalizeIndex(indexNumber) };
}

router.post("/register", rateLimit("register", 20), async (req, res) => {
  const { email, password } = req.body || {};
  if (!validProfile(req.body || {}) || typeof password !== "string") {
    return res.status(400).json({ message: "Provide valid profile details. Index numbers may contain letters, numbers, / and - (up to 30 characters)." });
  }

  if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
    return res.status(400).json({ message: "Password must contain at least 8 characters and at most 72 UTF-8 bytes." });
  }

  try {
    const existing = await User.exists({ email: email.toLowerCase().trim() });

    if (existing) {
      return res.status(409).json({ message: "An account already exists with this email." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await User.create({
      ...profileFields(req.body), password_hash: passwordHash, role: "student",
    });

    return res.status(201).json({
      message: "Student account created successfully.",
      userId: result.id,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: duplicateMessage(error) });
    }
    console.error(error);
    return res.status(500).json({ message: "Unable to create the account." });
  }
});

router.post("/login", rateLimit("login", 40), async (req, res) => {
  const { password } = req.body || {};
  const identifier = req.body?.identifier ?? req.body?.email;

  if ((!validEmail(identifier) && !(validText(identifier, 30) && validIndex(identifier))) || typeof password !== "string" || !password) {
    return res.status(400).json({ message: "Email or index number and password are required." });
  }

  try {
    const user = await User.findOne(validEmail(identifier)
      ? { email: identifier.toLowerCase().trim() }
      : { index_number: normalizeIndex(identifier) }).select("+password_hash");

    if (!user) {
      return res.status(401).json({ message: "Incorrect email, index number or password." });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: "This account has been disabled." });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Incorrect email, index number or password." });
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

router.put("/me", requireAuth, async (req, res) => {
  if (!validProfile(req.body || {})) {
    return res.status(400).json({ message: "Provide valid profile details. Index numbers may contain letters, numbers, / and - (up to 30 characters)." });
  }
  try {
    // Assign only editable fields; identity and permissions come from authentication.
    Object.assign(req.user, profileFields(req.body));
    await req.user.save();
    return res.json(req.user);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: duplicateMessage(error) });
    console.error(error);
    return res.status(500).json({ message: "Unable to save the profile." });
  }
});

export default router;
