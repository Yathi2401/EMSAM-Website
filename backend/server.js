import app from "./app.js";
import mongoose, { connectDatabase } from "./config/db.js";
import { initializeModels } from "./models/index.js";

try {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "replace_this_with_a_long_random_secret") {
    throw new Error("Set JWT_SECRET to a unique random secret in the backend environment.");
  }
  await connectDatabase();
  await initializeModels();
  const port = Number(process.env.PORT || 5000);
  const server = app.listen(port, () => console.log(`EMSAM MongoDB API is running at http://localhost:${port}`));
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => {
      server.close(async () => {
        await mongoose.disconnect();
        process.exit(0);
      });
    });
  }
} catch (error) {
  console.error("Backend startup failed. Check MONGODB_URI and your environment configuration.");
  console.error(error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
}
