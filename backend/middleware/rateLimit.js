import { createHmac } from "node:crypto";
import mongoose from "mongoose";

// Shared MongoDB counters survive Vercel instance changes; no raw IPs are stored.
export function rateLimit(scope, limit, windowMs = 15 * 60 * 1000) {
  return async (req, res, next) => {
    const forwarded = process.env.VERCEL ? req.headers["x-forwarded-for"] : undefined;
    const address = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.socket.remoteAddress;
    const now = Date.now();
    const window = Math.floor(now / windowMs);
    const expiresAt = new Date((window + 1) * windowMs);
    try {
      const key = createHmac("sha256", process.env.JWT_SECRET).update(`${scope}:${address}:${window}`).digest("hex");
      const collection = mongoose.connection.collection("request_limits");
      let counter;
      const update = { $inc: { count: 1 }, $setOnInsert: { expiresAt } };
      try {
        counter = await collection.findOneAndUpdate({ _id: key }, update, { upsert: true, returnDocument: "after", includeResultMetadata: false });
      } catch (error) {
        if (error.code !== 11000) throw error;
        counter = await collection.findOneAndUpdate({ _id: key }, { $inc: { count: 1 } }, { returnDocument: "after", includeResultMetadata: false });
      }
      if (counter.count > limit) {
        res.setHeader("Retry-After", Math.ceil((expiresAt.getTime() - now) / 1000));
        return res.status(429).json({ message: "Too many requests. Please wait a few minutes and try again." });
      }
      return next();
    } catch (error) { return next(error); }
  };
}
