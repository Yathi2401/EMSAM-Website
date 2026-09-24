import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User } from "../models/index.js";

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication is required." });
  }

  const token = header.split(" ")[1];

  let claims;
  try {
    claims = jwt.verify(token, process.env.JWT_SECRET);
    if (!mongoose.isObjectIdOrHexString(claims.id)) throw new Error("Invalid account ID");
  } catch {
    return res.status(401).json({ message: "Your session is invalid or expired." });
  }

  try {
    const user = await User.findById(claims.id);
    if (!user || !user.is_active) {
      return res.status(401).json({ message: "Your account is unavailable. Please log in again." });
    }
    req.user = user;
  } catch (error) {
    return next(error);
  }
  return next();
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Administrator access is required." });
  }

  next();
}
