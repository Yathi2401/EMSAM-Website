// Isolated browser-test environment. Never connects to backend/.env's database.
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { randomBytes } from "node:crypto";

const backendRequire = createRequire(new URL("../../backend/package.json", import.meta.url));
const frontendRequire = createRequire(new URL("../../frontend/package.json", import.meta.url));
const { MongoMemoryReplSet } = backendRequire("mongodb-memory-server");
const bcrypt = backendRequire("bcryptjs");
const { createServer } = await import(pathToFileURL(frontendRequire.resolve("vite")).href);
const mongo = await MongoMemoryReplSet.create({
  binary: { version: "7.0.14" },
  replSet: { count: 1, ip: "127.0.0.1" },
});
Object.assign(process.env, {
  MONGODB_URI: mongo.getUri("emsam_browser_test"),
  JWT_SECRET: randomBytes(32).toString("hex"),
  CRON_SECRET: randomBytes(32).toString("hex"),
  FRONTEND_URL: "http://127.0.0.1:5178",
  SMTP_HOST: "",
  SMTP_USER: "",
  SMTP_PASSWORD: "",
  MAIL_FROM: "",
  DNS_SERVERS: "",
  VERCEL: "",
});
const { default: mongoose, connectDatabase } = await import("../../backend/config/db.js");
const { User, Announcement, initializeModels } = await import("../../backend/models/index.js");
const { default: app } = await import("../../backend/app.js");
await connectDatabase();
await initializeModels();
await User.create({
  full_name: "Test Administrator",
  email: "admin@example.test",
  password_hash: await bcrypt.hash("BrowserTestPassword123!", 10),
  role: "admin",
});
await Announcement.insertMany(
  Array.from({ length: 7 }, (_, index) => ({
    title: `Sample ${index + 1}: ${index % 2 ? "Study resources" : "Dreamway information"}`,
    category: index % 2 ? "Resources" : "Dreamway",
    summary: "Announcement fixture for automated browser checks.",
    event_date: new Date("2026-10-31T00:00:00Z"),
    created_at: new Date(Date.UTC(2026, 9, 20 + index)),
  })),
);
const api = app.listen(5008, "127.0.0.1");
await new Promise((resolve, reject) => {
  api.once("listening", resolve);
  api.once("error", reject);
});
const vite = await createServer({
  root: fileURLToPath(new URL("../../frontend", import.meta.url)),
  server: { host: "127.0.0.1", port: 5178, strictPort: true },
  define: { "import.meta.env.VITE_API_URL": JSON.stringify("http://127.0.0.1:5008/api") },
});
await vite.listen();
console.log("Browser test server ready: http://127.0.0.1:5178");

let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await vite.close();
  await new Promise((resolve) => api.close(resolve));
  await mongoose.disconnect();
  await mongo.stop();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
