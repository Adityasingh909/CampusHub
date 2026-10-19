# CampusHub LMS 🎓

A modern Learning Management System (LMS) designed to help students and teachers manage courses, assignments, quizzes, and academic resources through a unified platform.

## 🚀 Features

### Student Portal
- **Dashboard:** Overview of courses, academic progress, and upcoming deadlines.
- **Courses:** Browse enrolled courses, view course details, modules, and learning materials.
- **Assignments:** View deadlines, manage submissions, and review grades and feedback.
- **Quizzes:** Attempt multiple-choice quizzes, track progress, and view results.
- **Private Uploads:** Organize academic files and resources with folders, search, and downloads.
- **Profile & Settings:** Student profile and account preferences.

### Current Development Status
- Student-facing frontend implemented incrementally.
- Mock data and browser `localStorage` used for frontend demonstrations.
- Backend API, database integration, and production authentication are planned.

## 🛠️ Tech Stack

**Frontend**
- React
- Vite
- JavaScript (JSX)
- Tailwind CSS v4
- React Router
- Lucide React

**Planned Backend**
- Node.js
- Express.js
- PostgreSQL
- Prisma ORM

## 📁 Project Structure

```text
CampusHub/
├── Client/
│   └── lms-frontend/
│       ├── src/
│       ├── public/
│       ├── package.json
│       └── vite.config.js
├── Server/
├── .gitignore
└── README.md
```

## 💻 Getting Started

### Prerequisites
- Node.js and npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Adityasingh909/CampusHub.git
cd CampusHub
```

### 2. Install frontend dependencies

```bash
cd Client/lms-frontend
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Open the local URL printed by Vite in your browser.

### 4. Build and lint

```bash
npm run build
npm run lint
```

## 🗺️ Roadmap

- [x] Student dashboard
- [x] Course listing and details
- [x] Assignment listing and submission workflow
- [x] Quizzes and quiz attempts
- [x] Private uploads with browser-local persistence
- [ ] Complete student profile and settings
- [ ] Teacher portal
- [ ] Express API integration
- [ ] PostgreSQL database with Prisma
- [ ] Authentication and role-based authorization
- [ ] Production file storage and deployment

## ⚠️ Current Limitations

This project is under active development. Several features currently use mock data and browser `localStorage`. Uploaded files, quiz scores, and profile changes are not yet backed by a production database or secure server-side storage.

Do not use this version to store sensitive academic or personal information.

## 👨‍💻 Author

**Aditya Singh**

GitHub: [@Adityasingh909](https://github.com/Adityasingh909)

---

Built as a full-stack learning project, with frontend development underway.