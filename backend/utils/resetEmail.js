import nodemailer from "nodemailer";

export function resetOrigin() {
  const url = new URL(process.env.FRONTEND_URL);
  const local = ["localhost", "127.0.0.1"].includes(url.hostname) && !process.env.VERCEL;
  if (
    (!local && url.protocol !== "https:") ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("FRONTEND_URL must be the site's trusted origin.");
  }
  return url.origin;
}

export function smtpOptions() {
  const port = Number(process.env.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid SMTP port.");
  return {
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
    disableFileAccess: true,
    disableUrlAccess: true,
  };
}

export const resetMailer = {
  configured: () =>
    ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "MAIL_FROM", "FRONTEND_URL"].every((key) =>
      Boolean(process.env[key]),
    ),
  async send(to, url) {
    const transport = nodemailer.createTransport(smtpOptions());
    try {
      await transport.sendMail({
        from: process.env.MAIL_FROM,
        to,
        subject: "Reset your EMSAM password",
        text: `A password reset was requested for your EMSAM account.\n\nOpen this link within 30 minutes:\n${url}\n\nIf you did not request this, ignore this email. Your password has not changed. Never share this link.`,
      });
    } finally {
      transport.close();
    }
  },
};
