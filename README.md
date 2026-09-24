# EMSAM — MERN Student and Examination Management System

The project uses **MongoDB, Express, React and Node.js (MERN)**. Mongoose defines the MongoDB documents and indexes. The backend no longer requires MySQL or XAMPP.

## What changed

- SQL queries were replaced with Mongoose models and queries.
- MongoDB collections store users, announcements, past papers, exam results and contact messages.
- Existing API paths and frontend field names are retained. The API exposes MongoDB ObjectIds as `id` strings.
- JWT login, administrator access, paper uploads, result search and Excel imports remain available.
- Excel workbooks, JSON source data, PDF papers and media files are unchanged.
- Old SQL files in `backend/database/` are historical references only and are not executed.

## Requirements

- Node.js 22.12 or later and npm.
- MongoDB Atlas, or a locally running MongoDB replica set.
- Transactional Excel imports require a replica set. A standalone MongoDB server supports the other features, but imports return a configuration error.

## Configure and run

1. Copy `backend/.env.example` to `backend/.env` if it does not exist.
2. Set `MONGODB_URI` to your MongoDB connection string, including the database name `emsam_db`.
3. Set `JWT_SECRET` to a long random secret and `ADMIN_PASSWORD` to a unique password of at least 12 characters. Set `ADMIN_EMAIL` to your preferred administrator email.
4. Run:

```powershell
cd backend
npm install
npm run db:setup
npm run dev
```

In a second terminal:

```powershell
cd frontend
npm install
# Copy .env.example to .env if needed.
npm run dev
```

Frontend: `http://localhost:5173`. Backend health: `http://localhost:5000/api/health`.

The frontend environment should contain `VITE_API_URL=http://localhost:5000/api`.

The setup script adds the administrator, three announcements, 48 paper records and 287 result records. It preserves existing records and passwords when rerun. Log in with your configured administrator credentials; create student accounts through registration. No fixed-password demo student is created.

### MongoDB Atlas

Create a database deployment and a database user in Atlas, allow your machine's IP in Network Access, and copy the application connection string. Use the database user's credentials (not your Atlas account password), URL-encode special characters in the password, and include `/emsam_db` before the query string:

```dotenv
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_ENCODED_PASSWORD@YOUR_CLUSTER/emsam_db?retryWrites=true&w=majority
```

### Local MongoDB replica set

After installing MongoDB Community Server and MongoDB Shell, run from the project root in PowerShell:

```powershell
New-Item -ItemType Directory -Force .mongo-data
mongod --dbpath .mongo-data --replSet rs0 --bind_ip 127.0.0.1
```

Keep that terminal running. In another terminal, initialize the replica set once:

```powershell
mongosh --eval 'rs.initiate({_id: "rs0", members: [{_id: 0, host: "127.0.0.1:27017"}]})'
```

Then use:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/emsam_db?replicaSet=rs0
```

If another MongoDB service already occupies port 27017, configure that service as a replica set or use a different port consistently. Wait for a primary to be elected before running database setup.

## Understanding the backend

| File | Purpose |
|---|---|
| `backend/config/db.js` | Loads backend environment settings and connects Mongoose to MongoDB |
| `backend/models/index.js` | Collection schemas, validation, defaults and unique indexes |
| `backend/routes/auth.js` | Registration, login and profile requests |
| `backend/middleware/auth.js` | Checks JWTs and the account's current role/status |
| `backend/routes/public.js` | Announcements, paper search, result search and contact form |
| `backend/routes/admin.js` | Administrator management and transactional result imports |
| `backend/scripts/setupDatabase.js` | Seeds MongoDB from the included JSON records |
| `backend/app.js` | Configures Express routes and error handling |
| `backend/server.js` | Connects the database and starts the HTTP server |

For example, registration uses `User.create(...)` to save a document; login uses `User.findOne({ email })` to retrieve it. Unique indexes prevent duplicate emails, paper filenames and result combinations (index number + stream + year). Password hashes are excluded from API responses.

## Existing MySQL data

This migration changes the application code and seeds the included project data. It does **not** copy accounts, announcements, messages or uploaded-paper records previously added to a MySQL database. Keep that database and the old SQL exports until any additional data has been migrated separately. Existing MySQL-era sessions require a new login because MongoDB uses different account IDs.

## Verification

```powershell
cd backend
npm test
npm run test:integration
```

Unit tests run with `npm test` without a database. Integration tests use a temporary MongoDB replica set, not the database in `.env`. The first integration run may download a large MongoDB test binary. Tests cover seeding, registration/login, permissions, filters, results, contact messages, administrator CRUD, original spreadsheet imports and transaction rollback. Source spreadsheets are checked for unchanged checksums.

```powershell
cd frontend
npm run build
```

## Deployment

Set `MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` and `FRONTEND_URL` on the backend host. Run `npm run db:setup` against the intended MongoDB database, then `npm start`. Set `VITE_API_URL` on the frontend host and rebuild the frontend. Keep `backend/uploads/papers` on persistent storage for uploaded PDFs. Updating local code does not update an existing deployed website.

See the [Mongoose schema guide](https://mongoosejs.com/docs/guide.html) and [transaction guide](https://mongoosejs.com/docs/transactions.html) for the database APIs used here.
