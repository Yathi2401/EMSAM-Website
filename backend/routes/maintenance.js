import express from "express";
import { createHash, timingSafeEqual } from "node:crypto";
import { removeExpiredReceipts } from "../utils/receiptRetention.js";
const router = express.Router();
const hash = (value) => createHash("sha256").update(value).digest();
router.get("/internal/receipt-retention", async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  const secret = process.env.CRON_SECRET;
  if (!secret || !timingSafeEqual(hash(req.headers.authorization || ""), hash(`Bearer ${secret}`)))
    return res.status(401).json({ message: "Unauthorised." });
  try {
    res.json(await removeExpiredReceipts());
  } catch (error) {
    next(error);
  }
});
export default router;
