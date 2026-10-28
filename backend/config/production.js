export function productionConfigIssues(env = process.env) {
  const errors = [];
  const warnings = [];
  if (!/^mongodb(?:\+srv)?:\/\//.test(env.MONGODB_URI || ""))
    errors.push("Set MONGODB_URI to the production database connection string.");
  for (const key of ["JWT_SECRET", "CRON_SECRET"]) {
    if (!env[key] || env[key].length < 32 || /replace_this|example|test-secret/.test(env[key]))
      errors.push(`Set ${key} to an independent random secret of at least 32 characters.`);
  }
  if (env.JWT_SECRET && env.JWT_SECRET === env.CRON_SECRET)
    errors.push("JWT_SECRET and CRON_SECRET must be different.");
  try {
    const url = new URL(env.FRONTEND_URL);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.hash ||
      url.search
    )
      throw new Error();
    if (env.VITE_SITE_URL && new URL(env.VITE_SITE_URL).origin !== url.origin)
      errors.push("VITE_SITE_URL must match FRONTEND_URL.");
  } catch {
    errors.push("Set FRONTEND_URL to the public HTTPS origin (without a path).");
  }
  if (!["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "MAIL_FROM"].every((key) => Boolean(env[key])))
    warnings.push(
      "Password-reset email is disabled until SMTP_HOST, SMTP_USER, SMTP_PASSWORD and MAIL_FROM are configured.",
    );
  return { errors, warnings };
}
