import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { sitePages, siteOrigin } from "../shared/sitePages.js";
import { loadEnv } from "../frontend/node_modules/vite/dist/node/index.js";
const env = loadEnv("production", fileURLToPath(new URL("../frontend/", import.meta.url)), "VITE_");
const origin = siteOrigin(process.env.VITE_SITE_URL || env.VITE_SITE_URL);
const root = new URL("../frontend/dist/", import.meta.url);
const template = await readFile(new URL("index.html", root), "utf8");
const escape = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
for (const [path, [title, description, index = true]] of Object.entries(sitePages)) {
  const url = origin + path;
  const tags = `<title>${escape(title)}</title>
    <meta name="description" content="${escape(description)}" />
    <meta name="robots" content="${index ? "index,follow" : "noindex,nofollow"}" />
    <meta name="referrer" content="${path === "/reset-password" ? "no-referrer" : "strict-origin-when-cross-origin"}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="website" /><meta property="og:site_name" content="EMSAM" />
    <meta property="og:title" content="${escape(title)}" /><meta property="og:description" content="${escape(description)}" />
    <meta property="og:url" content="${url}" /><meta property="og:image" content="${origin}/media/emsam-banner.jpg" />
    <meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${escape(title)}" />
    <meta name="twitter:description" content="${escape(description)}" /><meta name="twitter:image" content="${origin}/media/emsam-banner.jpg" />`;
  const html = template
    .replace(/<title>[\s\S]*?<\/title>/, tags)
    .replace(/<meta\s+name="description"\s+content="Official[\s\S]*?\/>/, "");
  const folder = new URL(path === "/" ? "./" : `.${path}/`, root);
  await mkdir(folder, { recursive: true });
  await writeFile(new URL("index.html", folder), html);
}
const urls = Object.entries(sitePages)
  .filter(([, values]) => values[2] !== false)
  .map(([path]) => `<url><loc>${origin}${path}</loc></url>`)
  .join("\n");
await writeFile(
  new URL("sitemap.xml", root),
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
);
await writeFile(
  new URL("robots.txt", root),
  `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`,
);
console.log("Generated route metadata, sitemap and robots.txt.");
