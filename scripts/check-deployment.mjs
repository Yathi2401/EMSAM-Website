// Read-only smoke check. Never submits forms, sends emails, or runs retention.
const origin = new URL(
  process.argv[2] || process.env.SITE_URL || "https://emsam-website.vercel.app",
);
if (
  !["http:", "https:"].includes(origin.protocol) ||
  origin.username ||
  origin.password ||
  origin.search ||
  origin.hash ||
  origin.pathname !== "/"
)
  throw new Error("Pass a site origin without credentials or a path.");
let failures = 0;
async function check(path, validate) {
  try {
    const response = await fetch(new URL(path, origin), {
      signal: AbortSignal.timeout(20000),
      redirect: "follow",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    await validate(response);
    console.log(`PASS ${path}`);
  } catch (error) {
    failures++;
    console.error(`FAIL ${path}: ${error.message}`);
  }
}
for (const [path, title] of [
  ["/", "EMSAM"],
  ["/privacy", "Privacy"],
  ["/forgot-password", "Password Recovery"],
  ["/results", "Examination Results"],
]) {
  await check(path, async (response) => {
    const html = await response.text();
    if (!html.includes(`<title>${title}`)) throw new Error("Expected route metadata is missing.");
  });
}
await check("/sitemap.xml", async (response) => {
  const xml = await response.text();
  if (!xml.includes("<urlset") || xml.includes("/admin<") || xml.includes("/reset-password<"))
    throw new Error("Invalid public sitemap.");
});
await check("/robots.txt", async (response) => {
  if (!(await response.text()).includes("Sitemap:"))
    throw new Error("Sitemap declaration is missing.");
});
await check("/api/health", async (response) => {
  if ((await response.json()).status !== "ok") throw new Error("API health check failed.");
});
await check("/media/emsam-banner.jpg", async (response) => {
  if (!response.headers.get("content-type")?.startsWith("image/"))
    throw new Error("Image was not served.");
});
process.exitCode = failures ? 1 : 0;
