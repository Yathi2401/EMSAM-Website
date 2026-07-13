<div align="center">

# 🎓 EMSAM Student Association and Examination Management System

### Engineering & Medical Students Association of Mullaitivu

<p>
  <strong>A modern full-stack platform for student services, examination resources, results and association activities.</strong>
</p>

[![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Build-Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/API-Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/Database-MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)

[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=flat-square&logo=vercel)](https://emsam-website.vercel.app)
[![Railway](https://img.shields.io/badge/Backend-Railway-7B2CBF?style=flat-square&logo=railway)](https://emsam-website-production.up.railway.app)
[![GitHub](https://img.shields.io/badge/Repository-GitHub-181717?style=flat-square&logo=github)](https://github.com/Yathi2401/EMSAM-Website)

<br>

### 🌐 [Visit the Live Website](https://emsam-website.vercel.app)

</div>

---

## 📖 About the Project

The **EMSAM Student Association and Examination Management System** is a full-stack web application developed for the **Engineering & Medical Students Association of Mullaitivu**.

The platform brings EMSAM’s educational programmes, student services, examination resources, results, announcements and association activities into one responsive digital system.

It provides:

- 🌍 A professional public website
- 📚 Dreamway examination resources
- 🔐 Private student result search
- 👨‍🎓 Student registration and login
- 🛡️ Administrator management features
- 📢 Announcement publishing
- 📄 PDF past-paper management
- 📊 Excel result importing
- 💬 Contact-message management

---

## 🚀 Live Deployment

| Service | Platform | Address |
|---|---|---|
| 🌐 Frontend | Vercel | [emsam-website.vercel.app](https://emsam-website.vercel.app) |
| ⚙️ Backend API | Railway | [emsam-website-production.up.railway.app](https://emsam-website-production.up.railway.app) |
| 🗄️ Database | Railway MySQL | Private database service |
| 💻 Source Code | GitHub | [Yathi2401/EMSAM-Website](https://github.com/Yathi2401/EMSAM-Website) |

> The backend and MySQL services must be online for login, results, announcements, contact forms and past-paper features to work.

---

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| 🎨 Frontend | React, Vite, JavaScript, CSS |
| ⚙️ Backend | Node.js, Express.js |
| 🗄️ Database | MySQL |
| 🔐 Authentication | JSON Web Token and bcrypt |
| 📤 File Uploads | Multer |
| 📊 Result Import | Excel file processing |
| 📁 PDF Storage | Backend file storage |
| 🌐 Frontend Hosting | Vercel |
| 🚂 Backend Hosting | Railway |
| 🛢️ Database Hosting | Railway MySQL |
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
- 💬 Contact form connected to MySQL
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

## 🔐 Private Result Search

Student results are protected and are not displayed as a complete public list.

To retrieve a result, the student must provide:

- 🔢 Index number
- 🎓 Advanced Level stream

The system returns only the matching result record.

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
- 🔎 Private result search
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
│   │   ├── assets
│   │   ├── components
│   │   ├── pages
│   │   └── services
│   └── package.json
│
├── backend
│   ├── data
│   ├── database
│   ├── middleware
│   ├── routes
│   ├── uploads
│   │   └── papers
│   ├── server.js
│   └── package.json
│
├── .gitignore
├── FEATURE_CHECKLIST.md
├── FIRST_TIME_SETUP.bat
├── START_BACKEND.bat
├── START_FRONTEND.bat
└── README.md
