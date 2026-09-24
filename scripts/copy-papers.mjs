import { cp, mkdir } from "node:fs/promises";

const destination = new URL("../frontend/dist/uploads/papers/", import.meta.url);
await mkdir(destination, { recursive: true });
await cp(new URL("../backend/uploads/papers/", import.meta.url), destination, { recursive: true });
console.log("Copied bundled PDF papers into the static deployment output.");
