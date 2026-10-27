# CampusHub LMS 🎓

[![React](https://img.shields.io/badge/React-19.2.8-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5.3.0-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_Serverless-4169E1?logo=postgresql&logoColor=white)](https://neon.tech/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19.3-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Cloudflare R2](https://img.shields.io/badge/Cloudflare_R2-Object_Storage-F38020?logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/r2/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.3.3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Frontend_Deploy-Vercel-000000?logo=vercel&logoColor=white)](https://campus-hub-delta-sooty.vercel.app)
[![Render](https://img.shields.io/badge/Backend_Deploy-Render-46E3B7?logo=render&logoColor=white)](https://render.com)

> **A production-ready, full-stack Learning Management System (LMS)** engineered to streamline modern university academic workflows. CampusHub provides role-based portals for students and faculty, featuring course enrollment, timed quiz assessments with automated grading, assignment submissions with teacher evaluations, and user-isolated private cloud file vaults with zero-egress presigned downloads.

---

## 🌐 Live Deployments

- **Frontend Application (Vercel):** [https://campus-hub-delta-sooty.vercel.app](https://campus-hub-delta-sooty.vercel.app)
- **Backend API (Render):** Express 5 REST API running Node.js 26
- **Database:** Serverless PostgreSQL on Neon (AWS `us-east-2`)
- **Object Storage:** Cloudflare R2 (S3-compatible, private bucket)

---

## 🏛️ System Architecture

CampusHub is built as a strictly decoupled client-server architecture:

```
+----------------------------------------------------------------------------------------------------+
|                                  CAMPUSHUB END-TO-END ARCHITECTURE                                 |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|   [ Browser / Student & Teacher Clients ]                                                         |
|            |                                                                                       |
|            | 1. HTTP GET (Assets & SPA)                                                            |
|            v                                                                                       |
|   [ Vercel Edge CDN ]                                                                              |
|   - React 19 SPA + Vite 8 Bundler                                                                  |
|   - Tailwind CSS v4 Design System                                                                  |
|   - Client-side Routing (React Router v7)                                                         |
|   - Role-Based Protected Route Guards                                                              |
|            |                                                                                       |
|            | 2. HTTPS REST API Calls (Authorization: Bearer <JWT>)                                 |
|            v                                                                                       |
|   [ Render Container Web Service ]                                                                 |
|   - Node.js 26 + Express 5 REST API                                                                |
|   - Middleware: CORS, 5MB JSON Body Parser, JWT Auth Guard, Role RBAC                             |
|   - Route Handlers & Controllers                                                                   |
|      |                                                |                                            |
|      | 3. Prisma ORM v6.19.3                          | 4. AWS S3 SDK v3.1156                      |
|      |    (PgBouncer Connection Pooling)              |    (PutObjectCommand / Presigned URLs)     |
|      v                                                v                                            |
|   [ Neon Cloud PostgreSQL ]                       [ Cloudflare R2 Storage ]                        |
|   - 13 Relational Tables                          - Private S3-Compatible Bucket                   |
|   - 12 Applied Migrations                         - Zero Egress Cost Blob Vault                    |
|   - ACID Transactions & Cascades                  - 60s Time-To-Live Presigned URLs                |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## ✨ Features & Portals

### 👨‍🎓 Student Portal
- **Dashboard:** Snapshot of enrolled courses, recent activity, upcoming assignment deadlines, and quick navigation.
- **Course Catalog & Enrollment:** Browse available university courses, view instructor details, credit units, schedules, syllabi, and enroll with one click.
- **Assignment Submissions:** Review assignment prompts, guidelines, and due dates. Submit written notes, external project links, and file attachments. View grades and faculty feedback.
- **Timed Quiz Engine:** Take timed multiple-choice assessments with an active countdown timer. Prevents concurrent duplicate attempts and automatically calculates scores upon submission.
- **Private File Vault:** Organize personal study resources and assignments into nested folders with direct upload to Cloudflare R2 and secure 60-second presigned download links.
- **Student Profile:** Manage comprehensive demographic details, contact info, and avatar.

### 👩‍🏫 Teacher Portal
- **Course Administration:** Create and manage courses with custom codes, schedules, credits, office hours, and learning objectives.
- **Quiz Management System:**
  - Create, edit, and publish timed quizzes with custom point weightings and duration limits.
  - Interactive **Question Manager** with JSON-backed option arrays, explanation notes, and point allocations.
  - Real-time quiz statistics (published vs draft counts, question volume, student attempt tallies).
- **Assignment Evaluator:** Create course assignments with due dates and prompt attachments. Inspect student submissions, enter numerical scores, and return individualized feedback.
- **Course Announcements:** Broadcast course bulletins with prioritized urgency flags (`NORMAL`, `HIGH`, `URGENT`).

### 🔐 Authentication & Security
- **Stateless JWT Authentication:** Cryptographically signed tokens (`HMAC-SHA256`) storing user ID, email, and role.
- **Direct Atomic Registration:** Clean `Register → Bcrypt Hash → Create User → Immediate Login` pipeline with zero external SMTP delivery failure points.
- **Role-Based Access Control (RBAC):** Middleware-enforced route protection ensuring students cannot access faculty endpoints.
- **Compensating Transactions (Saga Pattern):** Distributed rollback logic: if saving file metadata to PostgreSQL fails after an R2 upload, the system automatically deletes the orphan R2 blob.

---

## 🛠️ Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | `19.2.8` | High-performance Single Page Application (SPA) |
| **Build Tool** | Vite | `8.3.0` | Ultra-fast HMR and optimized production bundling |
| **CSS & Design** | Tailwind CSS | `v4.3.3` | Next-generation Rust-powered CSS-first styling system |
| **Client Routing** | React Router | `v7.18.4` | Declarative client-side routing and protected route guards |
| **Iconography** | Lucide React | `1.58.0` | Accessible and consistent UI iconography |
| **HTTP Client** | Axios | `1.13.5` | Centralized API client with automatic JWT Bearer injection |
| **Backend Runtime** | Node.js | `26.12.0` | Asynchronous JavaScript runtime |
| **API Framework** | Express | `5.3.0` | Next-generation RESTful web framework with async error handling |
| **Database ORM** | Prisma | `6.19.3` | Type-safe database client and declarative schema modeling |
| **Database Engine** | PostgreSQL | `v16` | Serverless relational database hosted on Neon (AWS us-east-2) |
| **Cloud Storage** | Cloudflare R2 | S3-Compatible | Zero-egress fee private blob storage via `@aws-sdk/client-s3` |
| **Password Security** | bcryptjs | `3.0.3` | Adaptive salted hashing (10 salt rounds) |
| **Token Signing** | jsonwebtoken | `9.0.3` | HMAC-SHA256 stateless session management |

---

## 🗄️ Database Architecture (Prisma ORM)

The relational schema features **13 strongly-typed models** managed through **12 version-controlled migrations**:

```
+-------------------+           +-------------------+
|       User        | 1       * |      Course       |
|-------------------|-----------|-------------------|
| id (PK)           | (Teaches) | id (PK)           |
| email (UQ)        |           | code (UQ)         |
| password (Bcrypt) |           | teacherId (FK)    |
| role (Enum)       |           +-------------------+
+-------------------+                     | 1
   | 1             | 1                    |
   |               |                      | *
   | 1             | *                    +-------------------+
+----------------+ +----------------+     |    Assignment     |
| StudentProfile | |   Enrollment   |     |-------------------|
|----------------| |----------------|     | id (PK)           |
| id (PK)        | | id (PK)        |     | courseId (FK)     |
| userId (FK,UQ) | | studentId (FK) |     +-------------------+
+----------------+ | courseId (FK)  |               | 1
                   | [stu,crs] (UQ) |               | *
                   +----------------+     +----------------------+
                                          | AssignmentSubmission |
+----------------+                        |----------------------|
|      Quiz      | 1                    * | id (PK)              |
|----------------|------------------------| assignmentId (FK)    |
| id (PK)        |                        | studentId (FK)       |
| courseId (FK)  |                        | [asg,stu] (UQ)       |
+----------------+                        +----------------------+
   | 1          | 1
   | *          | *
+----------------+ +----------------+
|  QuizQuestion  | |  QuizAttempt   |
|----------------| |----------------|
| id (PK)        | | id (PK)        |
| quizId (FK)    | | quizId (FK)    |
| options (Json) | | studentId (FK) |
| correctAnswer  | +----------------+
+----------------+          | 1
   | 1                      | *
   | *             +------------------+
   +-------------> |    QuizAnswer    |
                   |------------------|
                   | id (PK)          |
                   | attemptId (FK)   |
                   | questionId (FK)  |
                   | [att,qst] (UQ)   |
                   +------------------+
```

---

## 📁 Repository Structure

```text
CampusHub/
├── Client/
│   └── lms-frontend/
│       ├── public/                     # Static web assets
│       ├── src/
│       │   ├── api/
│       │   │   └── axios.js            # Axios client with JWT interceptor
│       │   ├── components/
│       │   │   ├── common/             # Modal, Button, Input, Table primitives
│       │   │   ├── layout/             # Sidebar, Navbar, and layout shells
│       │   │   └── quiz/               # Question managers & submission modals
│       │   ├── context/
│       │   │   └── AuthContext.jsx     # Global authentication provider
│       │   ├── pages/
│       │   │   ├── auth/               # LoginPage, RegisterPage
│       │   │   ├── student/            # Dashboard, Courses, Quizzes, Vault
│       │   │   └── teacher/            # CourseAdmin, QuizAdmin, Gradebook
│       │   ├── App.jsx                 # Routing configuration
│       │   └── main.jsx                # Application root mount
│       ├── package.json
│       └── vite.config.js
│
├── Server/
│   ├── prisma/
│   │   ├── migrations/                 # 12 sequential SQL migrations
│   │   └── schema.prisma               # 13 relational Prisma models
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js       # Register, login, profile
│   │   │   ├── courseController.js     # Course CRUD and enrollments
│   │   │   ├── quizController.js       # Quizzes, questions, attempts, scoring
│   │   │   ├── assignmentController.js # Assignments and student submissions
│   │   │   ├── fileController.js       # Cloudflare R2 uploads & presigned URLs
│   │   │   └── announcementController.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js       # JWT signature verification
│   │   │   └── roleMiddleware.js       # Role-based authorization guards
│   │   ├── lib/
│   │   │   ├── prisma.js               # Prisma singleton client
│   │   │   └── r2.js                   # Cloudflare R2 S3 SDK client
│   │   ├── routes/                     # Modular Express routes
│   │   └── index.js                    # Express application entry point
│   └── package.json
│
├── docs/                               # Engineering Documentation
│   ├── CampusHub_Personal_Project_Handbook.pdf  # 34-page complete PDF handbook
│   ├── CampusHub_Personal_Project_Handbook.md   # Complete Markdown handbook
│   ├── handbook.html                   # Styled HTML print template
│   └── build_handbook.js               # Automated compilation script
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started Locally

### Prerequisites
- **Node.js:** v18.x or higher (tested on Node.js v26)
- **PostgreSQL Database:** Local instance or free [Neon](https://neon.tech) account
- **Cloudflare R2 Bucket:** For file uploads (or AWS S3 credentials)

---

### 1. Clone the Repository
```bash
git clone https://github.com/Adityasingh909/CampusHub.git
cd CampusHub
```

---

### 2. Configure the Backend (`Server/`)

```bash
cd Server
npm install
```

Create a `Server/.env` file with strict POSIX formatting (no spaces around `=`) :

```env
PORT=2000
DATABASE_URL="postgresql://<USER>:<PASSWORD>@<HOST>/<DATABASE>?sslmode=require"
DIRECT_URL="postgresql://<USER>:<PASSWORD>@<HOST>/<DATABASE>?sslmode=require"
JWT_SECRET="your-super-secure-jwt-secret-key-at-least-32-chars"

# Cloudflare R2 / AWS S3 Configuration
CLOUDFLARE_R2_ACCOUNT_ID="your-r2-account-id"
CLOUDFLARE_R2_ACCESS_KEY_ID="your-r2-access-key-id"
CLOUDFLARE_R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
CLOUDFLARE_R2_BUCKET_NAME="campushub-vault"

# Client CORS URL
FRONTEND_URL="http://localhost:5173"
```

Apply the database migrations and generate the Prisma Client:
```bash
npx prisma migrate dev
npx prisma generate
```

Start the Express API server:
```bash
npm run dev
# Server runs on http://localhost:2000
```

---

### 3. Configure the Frontend (`Client/lms-frontend/`)

Open a new terminal window:

```bash
cd Client/lms-frontend
npm install
```

Create a `Client/lms-frontend/.env` file:
```env
VITE_API_BASE_URL="http://localhost:2000"
```

Start the Vite development server:
```bash
npm run dev
# Frontend runs on http://localhost:5173
```

Open `http://localhost:5173` in your browser to explore CampusHub!


## 👨‍💻 Author

**Aditya Singh**
- GitHub: [@Adityasingh909](https://github.com/Adityasingh909)
- Portfolio & Projects: [Aditya Singh Portfolio](https://github.com/Adityasingh909)

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
