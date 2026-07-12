# EMSAM Student Association and Examination Management System

A beginner-friendly full-stack web application for the **Engineering & Medical Students Association of Mullaitivu (EMSAM)**.

## Technology Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express.js
- **Database:** MySQL
- **Authentication:** JSON Web Token (JWT) + bcrypt password hashing
- **Uploads:** Multer

## Main Features

### Public website
- Attractive animated EMSAM homepage
- Separate About, Dreamway and Pathfinder pages
- 2026 activity photographs and official posters
- Search and download 48 Dreamway question papers and marking schemes
- Private result search using index number and A/L stream
- Announcements page
- Contact form connected to the database
- Responsive navigation bar and animated footer
- Official Facebook, Instagram, WhatsApp and Telegram links

### Student system
- Student registration
- Student login
- Student dashboard
- Profile information
- Easy access to past papers, Dreamway and results

### Administrator system
- Admin login and dashboard
- Dashboard statistics
- Publish announcements
- Upload PDF past papers
- Import Physical Science or Biological Science results from Excel
- View contact messages

## Included Data

- 48 past-paper PDF files from 2023–2026
- 287 Dreamway 2026 student result records
  - 163 Biological Science records
  - 124 Physical Science records
- Official EMSAM and Dreamway logos
- Pathfinder posters
- Dreamway timetable, results and seminar posters
- Four 2026 seminar/examination photographs

## 1. MySQL Setup

You may use MySQL Server or XAMPP MySQL.

1. Start MySQL.
2. Open the `backend` folder.
3. Copy `.env.example` and rename the copy to `.env`.
4. Check the MySQL username and password in `.env`.

Example:

```env
PORT=5000
FRONTEND_URL=http://localhost:5173
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=emsam_db
JWT_SECRET=change_this_to_a_long_random_secret
ADMIN_EMAIL=admin@emsam.lk
ADMIN_PASSWORD=Admin@123
```

## 2. Start the Backend

Open a terminal in the `backend` folder:

```powershell
npm install
npm run db:setup
npm run dev
```

The backend runs at:

```text
http://localhost:5000
```

The database setup command creates the database, tables, demo accounts, announcements, past-paper records and 2026 results.

## 3. Start the Frontend

Open a second terminal in the `frontend` folder:

```powershell
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## Demo Accounts

### Administrator

```text
Email: admin@emsam.lk
Password: Admin@123
```

### Student

```text
Email: student@emsam.lk
Password: Student@123
```

Change the default admin password before using the system outside a classroom demonstration.

## Sample Result Searches

### Biological Science

```text
Index number: 2007259
Stream: Biological Science
```

### Physical Science

```text
Index number: 2007260
Stream: Physical Science
```

## Alternative Database Import

Instead of `npm run db:setup`, you may import this file through phpMyAdmin or MySQL Workbench:

```text
backend/database/emsam_database.sql
```

## Important Folders

```text
frontend/src/pages          Website pages
frontend/src/components     Shared navigation, footer and hero
frontend/public/media       Official images and photographs
backend/routes              API routes
backend/database            MySQL schema and complete SQL import
backend/uploads/papers      Past-paper PDF files
backend/data                Seed data and source result files
```

## API Summary

### Public
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/announcements`
- `GET /api/papers`
- `GET /api/results`
- `POST /api/contact`

### Admin
- `GET /api/admin/summary`
- `GET /api/admin/messages`
- `GET /api/admin/users`
- `POST /api/admin/announcements`
- `DELETE /api/admin/announcements/:id`
- `POST /api/admin/papers`
- `DELETE /api/admin/papers/:id`
- `POST /api/admin/results/import`

## Result Privacy

The website does not publish a complete student result list. A student must provide an index number and stream to retrieve one result record.
