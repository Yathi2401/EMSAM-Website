import mongoose from "mongoose";
import { Admission } from "../models/admissions.js";

export function receiptCutoff(now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 1);
  return cutoff;
}

export async function removeExpiredReceipts({ now = new Date(), limit = 50 } = {}) {
  const filter = { createdAt: { $lte: receiptCutoff(now) }, receiptId: { $ne: null } };
  const items = await Admission.find(filter)
    .sort({ createdAt: 1 })
    .limit(limit)
    .select("receiptId");
  const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "admission_receipts",
  });
  let removed = 0;
  for (const item of items) {
    const file = await bucket.find({ _id: item.receiptId }).next();
    if (file) await bucket.delete(item.receiptId);
    // Retain the application, payment status and all other historical details.
    const result = await Admission.updateOne(
      { _id: item._id, receiptId: item.receiptId },
      {
        $set: { receiptId: null },
        $unset: { receiptType: 1 },
      },
    );
    removed += result.modifiedCount;
  }
  return { removed, remaining: await Admission.countDocuments(filter) };
}
