# Database initialization

Vercel runs `npm run db:indexes --prefix backend` before building the frontend.
This prepares collections and indexes once per deployment instead of making
visitors wait for that work on every API cold start. The command does not seed,
delete, or replace application records. Initialization failure stops deployment.

The Vercel build environment must have `MONGODB_URI` and network access to the
configured database. Preview deployments should use a separate test database.
If overriding the build command, keep the initialization step before publishing
the API, especially when adding a new collection or unique index.

Local `npm start --prefix backend` and `npm run dev --prefix backend` continue to
initialize collections and indexes before listening for requests. An offline
frontend build remains available with `npm run build --prefix frontend`.
