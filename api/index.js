import app from "../backend/app.js";
import { connectDatabase } from "../backend/config/db.js";

let ready;
export default async function handler(req, res) {
  try {
    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is required.");
    if (!ready) {
      // Collections and indexes are prepared during deployment, not cold starts.
      ready = connectDatabase().catch((error) => {
        ready = undefined;
        throw error;
      });
    }
    await ready;
    return app(req, res);
  } catch (error) {
    console.error("API initialization failed:", error.name);
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        message:
          "The database connection is unavailable. Check the deployment environment and Atlas network access.",
      }),
    );
  }
}
