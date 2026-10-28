import mongoose, { connectDatabase } from "../config/db.js";
import { initializeModels } from "../models/index.js";
import { productionConfigIssues } from "../config/production.js";

// Prepare schema infrastructure without seeding or changing application records.
try {
  if (process.env.VERCEL) {
    const { errors, warnings } = productionConfigIssues();
    warnings.forEach((message) => console.warn(message));
    if (errors.length) {
      errors.forEach((message) => console.error(message));
      throw new Error("Invalid production configuration");
    }
  }
  await connectDatabase();
  await initializeModels();
  console.log("Database collections and indexes are ready.");
} catch (error) {
  console.error("Database initialization failed:", error.name);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
