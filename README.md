<div align="center">

# 🎓 EMSAM Student Association and Examination Management System

### Engineering & Medical Students Association of Mullaitivu

<p>
  <strong>A MERN-stack platform for student services, examination resources, results and association activities.</strong>
</p>

[![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Build-Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/API-Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=flat-square&logo=vercel)](https://emsam-website.vercel.app)
[![GitHub](https://img.shields.io/badge/Repository-GitHub-181717?style=flat-square&logo=github)](https://github.com/Yathi2401/EMSAM-Website)

<br>

### 🌐 [Visit the Live Website](https://emsam-website.vercel.app)

</div>

---

## 📖 About the Project

The **EMSAM Student Association and Examination Management System** is a **MERN-stack web application (MongoDB, Express, React and Node.js)** developed for the **Engineering & Medical Students Association of Mullaitivu**.

The platform brings EMSAM’s educational programmes, student services, examination resources, results, announcements and association activities into one responsive digital system.

It provides:

- 🌍 A professional public website
- 📚 Dreamway examination resources
- 🔐 Individual student result search
- 👨‍🎓 Student registration and login
- 🛡️ Administrator management features
- 📢 Announcement publishing
- 📄 PDF past-paper management
- 📊 Excel result importing
- 💬 Contact-message management

---

## 🚀 Website & Hosting

| Service | Platform | Address |
|---|---|---|
| 🌐 Frontend | Vercel | [emsam-website.vercel.app](https://emsam-website.vercel.app) |
| ⚙️ Backend API | Express / Node.js | Local: `http://localhost:5000/api` |
| 🗄️ Database | MongoDB Atlas | Private MongoDB database |
| 💻 Source Code | GitHub | [Yathi2401/EMSAM-Website](https://github.com/Yathi2401/EMSAM-Website) |

> MongoDB Atlas hosts the database, not the Express API. Run the backend locally for development. The published frontend needs a publicly reachable backend with its own environment settings; a local backend is not available to other website visitors.

---

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| 🎨 Frontend | React, Vite, JavaScript, CSS |
| ⚙️ Backend | Node.js, Express.js |
| 🗄️ Database | MongoDB with Mongoose |
| 🔐 Authentication | JSON Web Token and bcrypt |
| 📤 File Uploads | Multer |
| 📊 Result Import | Excel file processing |
| 📁 PDF Storage | Backend file storage |
| 🌐 Frontend Hosting | Vercel |
| 🛢️ Database Hosting | MongoDB Atlas |
| 🔄 Version Control | Git and GitHub |

---

# ✨ Main Features

## 🌍 Public Website

The public section presents EMSAM information and provides students with easy access to educational resources.

- 🏠 Attractive animated homepage
- ℹ️ Dedicated About EMSAM page
- 🧭 Separate Dreamway page
- 🎯 Separate Pathfinder page
- 📢 Announcements page
- 📷 Official EMSAM photographs
- 🖼️ Event and programme posters
- 📱 Responsive navigation bar
- 🎨 Professional animated footer
- 💬 Contact form connected to MongoDB
- 🔗 Official social-media links
- 📱 Mobile, tablet and desktop support

---

## 📚 Dreamway Examination Resources

The Dreamway section provides Advanced Level examination resources for Physical Science and Biological Science students.

### Students can:

- 🔍 Search by title or subject
- 🧪 Filter by stream
- 📅 Filter by year
- 📄 Filter by resource type
- ⬇️ Download question papers
- ✅ Download marking schemes
- 🔐 Access files through the backend

### Available resources:

| Resource | Quantity |
|---|---:|
| 📄 Question papers and marking schemes | 48 |
| 📅 Covered years | 2023–2026 |
| 🧬 Biological Science resources | Included |
| ⚙️ Physical Science resources | Included |

---

## 🔐 Individual Result Search

The results page displays one matching record at a time instead of a complete public list.

To retrieve a result, the student must provide:

- 🔢 Index number
- 🎓 Advanced Level stream

The system returns the matching Dreamway 2026 result, including subject marks, grades, Z average and rank. Missing Z averages and ranks display “Not available”.

> Result lookup does not require login. Anyone with an index number and the correct stream can retrieve that result.

### Available result data:

| Stream | Records |
|---|---:|
| 🧬 Biological Science | 163 |
| ⚙️ Physical Science | 124 |
| 📊 Total records | 287 |

---

## 👨‍🎓 Student System

Registered students can access a personal student area.

- 📝 Student registration
- 🔑 Secure student login
- 📊 Student dashboard
- 👤 Profile information
- 📚 Easy access to past papers
- 🧭 Dreamway information
- 🔎 Individual result search
- 📢 Announcement access
- 🛡️ JWT-based authentication

---

## 🛡️ Administrator System

The administrator dashboard allows authorised EMSAM administrators to manage system content.

- 🔐 Secure administrator login
- 📊 Dashboard statistics
- 📢 Publish announcements
- 🗑️ Delete announcements
- 📤 Upload PDF past papers
- 🗑️ Delete past-paper records
- 📈 Import Biological Science results from Excel
- 📉 Import Physical Science results from Excel
- 👥 View registered users
- 💬 View contact messages
- 📚 Manage educational resources
- 🗄️ Monitor system information

---

# 📦 Included Project Data

## 📄 Examination Resources

- 48 past-paper PDF files
- Question papers from 2023–2026
- Marking schemes
- Biological Science resources
- Physical Science resources

## 📊 Student Results

- 287 Dreamway 2026 result records
- 163 Biological Science records
- 124 Physical Science records

## 🖼️ Media Content

- Official EMSAM logo
- Official Dreamway logo
- Pathfinder posters
- Dreamway timetable posters
- Dreamway result posters
- Seminar posters
- Examination posters
- Four 2026 seminar and examination photographs

---

# 🗂️ Project Structure

```text
EMSAM-Website
│
├── frontend
│   ├── public
│   │   └── media
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   └── services
│   └── package.json
│
├── backend
│   ├── config
│   ├── data
│   ├── database
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── scripts
│   ├── tests
│   ├── uploads
│   │   └── papers
│   ├── utils
│   ├── app.js
│   ├── server.js
│   └── package.json
│
├── .gitignore
├── FEATURE_CHECKLIST.md
├── FIRST_TIME_SETUP.bat
├── START_BACKEND.bat
├── START_FRONTEND.bat
└── README.md
```

---

## ✅ Requirements

- Node.js 22.12 or later and npm.
- MongoDB Atlas, or a locally running MongoDB replica set.
- Transactional Excel imports require a replica set. A standalone MongoDB server supports the other features, but imports return a configuration error.

## 💻 Local Setup

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

> Keep both terminals running. Starting the React frontend alone does not start the backend.

The setup script adds the administrator, three announcements, 48 paper records and 287 result records. It preserves existing records and passwords when rerun. Log in with your configured administrator credentials; create student accounts through registration. No fixed-password demo student is created.

### ☁️ MongoDB Atlas

Create a database deployment and a database user in Atlas, allow your machine's IP in Network Access, and copy the application connection string. Use the database user's credentials (not your Atlas account password), URL-encode special characters in the password, and include `/emsam_db` before the query string:

```dotenv
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_ENCODED_PASSWORD@YOUR_CLUSTER/emsam_db?retryWrites=true&w=majority
```

### 🌐 Optional DNS Configuration

If Atlas connections fail with `querySrv ECONNREFUSED` or `getaddrinfo ENOTFOUND`, the backend supports an optional DNS override in `backend/.env`:

```dotenv
DNS_SERVERS=1.1.1.1,8.8.8.8
```

This setting applies only to the backend process. It does not change system DNS settings or replace Atlas Network Access rules. Keep database credentials, administrator passwords and JWT secrets in environment variables; `.env` files are excluded from Git.

### 🖥️ Local MongoDB Replica Set

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

## 🧩 How the Backend Works

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

---

## 🧪 Tests & Build

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

---

## 🚢 Deployment Configuration

The repository includes `vercel.json` to deploy the React frontend and Express API together in one Vercel project.

### Vercel project settings

1. Push the deployment files to GitHub.
2. In Vercel, set **Root Directory** to the repository root (`.`), not `frontend`.
3. Select **Other** as the Framework Preset and use Node.js **22.x**.
4. Remove old build/install/output overrides so `vercel.json` supplies these settings:

| Setting | Value |
|---|---|
| Install Command | `npm ci --prefix backend --omit=dev && npm ci --prefix frontend` |
| Build Command | `npm run build` |
| Output Directory | `frontend/dist` |

5. Add these environment variables for Production (and Preview if you use preview deployments):

| Variable | Value |
|---|---|
| `MONGODB_URI` | Your Atlas connection string including `/emsam_db` |
| `JWT_SECRET` | Your private JWT signing secret |
| `FRONTEND_URL` | `https://emsam-website.vercel.app` or your actual frontend domain |

Copy secret values from your local environment into Vercel settings, never into Git. Remove the old `VITE_API_URL` deployment variable: production now uses same-origin `/api`. `VITE_API_URL` is used only for local development.

6. Ensure Atlas Network Access allows connections from your deployed Vercel backend. Allowing only your home computer's IP does not allow Vercel servers.
7. Redeploy after saving the settings. Verify `/api/health` returns JSON and `/api/papers` returns paper records on your published domain.

The API connects to the existing Atlas database; it does not seed records on every request. To seed a new database, configure it locally and run `npm run db:setup` inside `backend` once. `ADMIN_EMAIL` and `ADMIN_PASSWORD` are used by that setup command, not required by the deployed API.

### PDFs and uploads

The root build copies the 48 bundled PDFs to `frontend/dist/uploads/papers` for static hosting. On Vercel, new PDF uploads are stored persistently in MongoDB GridFS and downloaded through `/api/paper-files/:id`. Local development continues to use `backend/uploads/papers`.

Hosted PDF and Excel uploads are limited to **4 MB per file** to leave room for multipart metadata under the Vercel Function request limit. Existing bundled PDFs are static downloads and are not subject to that upload limit. Spreadsheet imports process the upload in memory and preserve the source files.

See [Vercel Node.js Functions](https://vercel.com/docs/functions/runtimes/node-js) and [Function limits](https://vercel.com/docs/functions/limitations) for the hosting behavior and limits.

See the [Mongoose schema guide](https://mongoosejs.com/docs/guide.html) and [transaction guide](https://mongoosejs.com/docs/transactions.html) for the database APIs used here.

---

<div align="center">

**🎓 Engineering & Medical Students Association of Mullaitivu**

Supporting students through Dreamway, Pathfinder and educational resources.

[🌐 Website](https://emsam-website.vercel.app) · [💻 GitHub](https://github.com/Yathi2401/EMSAM-Website)

</div>
