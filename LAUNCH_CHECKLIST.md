# EMSAM launch status

## Implemented locally

- SheetJS upgraded to the official pinned 0.20.3 distribution. Lockfile integrity
  pins the download. Import/export and rollback tests cover the migration.
- Password recovery screens and API: 30-minute random single-use tokens, stored
  only as hashes, rate limits, per-account cooldown, trusted HTTPS reset origin,
  password validation, atomic redemption and invalidation of old login sessions.
  The token travels in the URL fragment and is removed from the address bar.
- Privacy notice: the EMSAM President handles enquiries; admission records are
  retained indefinitely; payment receipt files are scheduled for deletion after
  one year. The contact form accepts a prefilled privacy-request subject.
- A secret-protected daily Vercel receipt-retention job. It preserves admission
  details and payment status. It processes 50 receipts per run and reports any
  remaining backlog. Backup copies need a separately configured retention policy.
- Public page titles, descriptions, canonical URLs and social preview metadata
  generated into HTML, plus sitemap/robots.txt. Private routes use noindex.
- Skip navigation, route focus, labelled password fields and recovery messages.
- Production configuration checks, a database-aware health endpoint, read-only
  deployment smoke-check script and a GitHub Actions build/test/audit workflow.
- Earlier fixes: admission settings conflict protection, unsaved-design navigation
  warning, result-year selection and targeted dashboard refreshes.

## Required hosting setup (not performed by these code changes)

1. In Vercel, set `MONGODB_URI`, `JWT_SECRET` (32+ random characters),
   `CRON_SECRET` (a different 32+ character random secret), and `FRONTEND_URL`
   to your public HTTPS origin. Set `VITE_SITE_URL` to that same origin if using
   a custom domain; its default is https://emsam-website.vercel.app.
   Do not put database or mail credentials in `VITE_` variables.
2. The build validates configuration and prepares database indexes. Run
   `npm run check:config` against the intended environment to see missing settings
   without printing credentials or modifying the database. Localhost frontend
   URLs intentionally fail this production check; keep your development settings.
3. No email provider exists yet. Create an SMTP sender with a delivery provider,
   verify the sending address/domain, and set `SMTP_HOST`, `SMTP_PORT` (usually
   587 or 465), `SMTP_USER`, `SMTP_PASSWORD` and `MAIL_FROM` in Vercel. TLS is
   required. Without these values recovery returns a clear support message; it
   does not pretend to send email. Test delivery to an account you own before
   enabling the feature for students. Check spam placement and provider logs.
4. Confirm the President has the appropriate administrator access to review
   contact messages whose subject is "Privacy request". No automatic forwarding
   or new admin account was created. Application/email notifications are not enabled.
5. Enable backups in the production MongoDB hosting account. Set a backup
   retention period with the President, document it, and restore a backup into a
   separate disposable database to verify it. Never test a restore over production.
   No backup service or restore was activated from this workspace.
6. After deployment, check that the daily cron appears in Vercel and succeeds.
   Its schedule is 02:00 UTC (07:30 Sri Lanka). Vercel sends `CRON_SECRET` as a
   bearer token automatically. Investigate nonzero `remaining` counts and failures.
   This job permanently removes eligible receipt files from the primary database.
7. Connect an uptime monitor to `/api/health` and enable deployment/error alerts.
   The endpoint checks database availability without disclosing credentials.
   No external monitoring account or notification recipient is configured here.

## Preview and release checks

Run `npm run check:deployment -- https://YOUR-PREVIEW-OR-PUBLIC-ORIGIN`.
This only reads public pages, metadata, assets and health; it never submits forms
or deletes receipts. Protected previews may need to be tested while signed in.

Then use a separate preview database to test registration, login, password reset,
each published results year, PDF downloads, receipt uploads, admission retries,
admin review and Excel import/export. Check fees, bank details, deadlines and all
contact links with EMSAM. Review the privacy notice with the President.

For a custom domain, rebuild after updating the public origin and confirm page
canonical URLs, sitemap entries and reset links use that domain.

The GitHub Actions workflow runs only after these files are pushed. It uses a
temporary test database and does not deploy or alter production.

## References

- Official SheetJS installation: https://docs.sheetjs.com/docs/getting-started/installation/nodejs/
- Reset design guidance: https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html
- SMTP setup: https://nodemailer.com/smtp
- Securing and operating Vercel cron: https://vercel.com/docs/cron-jobs/manage-cron-jobs
