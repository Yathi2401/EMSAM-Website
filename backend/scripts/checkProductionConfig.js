import "../config/db.js";
import { productionConfigIssues } from "../config/production.js";
const { errors, warnings } = productionConfigIssues();
for (const message of errors) console.error(`ERROR: ${message}`);
for (const message of warnings) console.warn(`NOTE: ${message}`);
if (errors.length) process.exitCode = 1;
else console.log("Production configuration checks passed. No database changes were made.");
