import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import dns from "node:dns";
import { isIP } from "node:net";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });
// Optional process-only override for networks whose DNS cannot resolve Atlas SRV records.
if (process.env.DNS_SERVERS) {
  dns.setServers(process.env.DNS_SERVERS.split(",").map(value => value.trim()).filter(Boolean));
}
mongoose.set("bufferCommands", false);

export async function connectDatabase() {
  if (!process.env.MONGODB_URI) throw new Error("Set MONGODB_URI in backend/.env to your MongoDB connection string.");
  const options = { serverSelectionTimeoutMS: 10000 };
  if (process.env.DNS_SERVERS) {
    // dns.setServers handles SRV/TXT queries, but socket lookup otherwise still
    // uses the operating system's resolver. Apply the override to both.
    options.lookup = (hostname, lookupOptions, callback) => {
      const family = isIP(hostname) || (lookupOptions?.family === 6 ? 6 : 4);
      const finish = (error, addresses) => {
        if (error) return callback(error);
        if (lookupOptions?.all) return callback(null, addresses.map(address => ({ address, family })));
        callback(null, addresses[0], family);
      };
      if (isIP(hostname)) return finish(null, [hostname]);
      if (family === 6) dns.resolve6(hostname, finish);
      else dns.resolve4(hostname, finish);
    };
  }
  await mongoose.connect(process.env.MONGODB_URI, options);
}

export default mongoose;
