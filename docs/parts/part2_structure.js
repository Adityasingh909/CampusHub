// Part 2: Project Structure & File Responsibilities
module.exports = {
  title: "Part 2 — Project Structure & File Responsibilities",
  markdown: `
# Part 2 — Project Structure & File Responsibilities

## 2.1 Complete Verified Project Directory Tree

\`\`\`
CampusHub/
├── Client/
│   └── lms-frontend/                 # React 19 Frontend SPA (Vite + Tailwind v4)
│       ├── public/                   # Static assets served directly (favicons, SVG logos)
│       ├── src/
│       │   ├── app/
│       │   │   └── router.jsx        # Central routing configuration, protected guards, layouts
│       │   ├── assets/               # Local bundled images and logos
│       │   ├── components/
│       │   │   ├── layout/           # Shared layout containers: Header, Sidebar, DashboardLayout
│       │   │   ├── ui/               # Reusable primitives: Button, Input, Modal, ProgressBar, Tabs
│       │   │   └── ProtectedRoute.jsx# Auth and Role verification route guard
│       │   ├── context/
│       │   │   ├── AuthContext.jsx   # Global session state, localStorage sync, profile hydrator
│       │   │   └── LoadingContext.jsx# Active request counter for global top loader
│       │   ├── features/             # Domain-driven feature modules
│       │   │   ├── assignments/      # Student submissions & Teacher assignment grading
│       │   │   ├── auth/             # Login, Signup, ForgotPassword, Brand banners
│       │   │   ├── courses/          # Course listing, Course details, Teacher course editor
│       │   │   ├── dashboard/        # Student & Teacher personalized metrics dashboards
│       │   │   ├── profile/          # Student profile view and personal details editor
│       │   │   ├── quizzes/          # Quizzes catalog, Attempt runner, Results, Teacher Quiz Manager
│       │   │   ├── submissions/      # Dedicated Teacher student submissions overview
│       │   │   └── uploads/          # Cloudflare R2 Private file and folder storage manager
│       │   ├── hooks/                # Custom React hooks: useAuth, useLoading, useToast
│       │   ├── lib/                  # Utilities: cn (Tailwind class merging helper)
│       │   ├── services/             # HTTP clients: api.js, quizService, announcementService
│       │   ├── App.jsx               # Root component mounting AuthProvider and Global Loading Bar
│       │   ├── index.css             # Tailwind v4 theme configuration & font imports
│       │   └── main.jsx              # DOM entry point mounting React root with BrowserRouter
│       ├── package.json              # Client dependencies & scripts (Vite, Tailwind, React 19)
│       ├── vercel.json               # SPA client-side rewrite rules for Vercel deployment
│       └── vite.config.js            # Vite configuration with React and Tailwind plugins
│
└── Server/                           # Node.js + Express 5 REST API Backend
    ├── prisma/
    │   ├── migrations/               # 12 applied SQL migrations documenting database history
    │   │   ├── 20261019131546_create_user/
    │   │   ├── 20261019203025_add_pending_registration/
    │   │   ├── ...
    │   │   └── 20261028014000_remove_pending_registration_and_otp/
    │   ├── migration_lock.toml       # Prisma migration engine lockfile
    │   └── schema.prisma             # Authoritative Prisma data models, constraints, and datasource
    ├── src/
    │   ├── config/
    │   │   ├── prisma.js             # Singleton PrismaClient instance exported for controllers
    │   │   └── r2.js                 # Cloudflare R2 S3Client instance initialization
    │   ├── controllers/              # Business logic, data validation, database orchestration
    │   │   ├── announcement.controller.js
    │   │   ├── assignment.controller.js
    │   │   ├── auth.controller.js    # Direct registration, bcrypt hashing, JWT login
    │   │   ├── course.controller.js
    │   │   ├── dashboard.controller.js
    │   │   ├── enrollment.controller.js
    │   │   ├── privateFile.controller.js   # R2 PutObject, Presigned GetObject, DB records
    │   │   ├── privateFolder.controller.js
    │   │   ├── profile.controller.js
    │   │   └── quiz.controller.js    # Quiz CRUD, Question authoring, Attempts, Auto-grading
    │   ├── middleware/
    │   │   ├── auth.middleware.js    # JWT verification & role authorization (Student/Teacher)
    │   │   └── upload.middleware.js  # Multer memory storage & 25MB MIME whitelist validator
    │   ├── routes/                   # Express router definitions mapping HTTP methods to controllers
    │   │   ├── announcement.route.js
    │   │   ├── assignment.routes.js
    │   │   ├── auth.routes.js
    │   │   ├── course.routes.js
    │   │   ├── dashboard.routes.js
    │   │   ├── enrollment.routes.js
    │   │   ├── privateFile.route.js
    │   │   ├── privateFolder.route.js
    │   │   ├── profile.routes.js
    │   │   └── quiz.routes.js
    │   └── index.js                  # Main Express entry point, CORS, JSON parsing, port listener
    ├── .env                          # Local secrets: DATABASE_URL, JWT_SECRET, R2 credentials
    ├── .env.example                  # Template for environment variables (safe for Git)
    ├── package.json                  # Server dependencies & scripts (Express 5, Prisma 6)
    └── prisma.config.ts.backup       # Inactive Prisma 7 experimental config (kept as backup)
\`\`\`

## 2.2 Deep Dive: Why Architectural Layers are Separated

### Why Routes and Controllers are Separated
In Express, a **Route** is strictly a traffic dispatcher. It defines:
1. The HTTP method (\`GET\`, \`POST\`, \`PUT\`, \`DELETE\`, \`PATCH\`).
2. The URL endpoint pattern (\`/api/quizzes/:quizId/submit\`).
3. The chain of middleware to execute (\`authenticate\`, \`authorizeStudent\`, \`upload.single("file")\`).
4. The target controller method to handle the request.

A **Controller** is the business execution engine. It extracts parameters from \`req.body\`, \`req.params\`, and \`req.query\`, enforces domain validation rules (e.g., checking if a quiz deadline has passed), executes transactional Prisma database queries, and formats standard JSON HTTP responses.
*Benefit:* If an endpoint changes from \`/api/course\` to \`/api/courses\`, only the route file changes. The complex business logic in the controller remains completely untouched and unit-testable.

### Why Middleware Exists
Middleware functions are interceptors that execute before a controller handles a request. CampusHub uses middleware for:
- **Authentication (\`authenticate\`):** Reads the \`Authorization: Bearer <token>\` header, verifies the signature against \`process.env.JWT_SECRET\`, decodes \`userId\` and \`role\`, and attaches \`req.user = { userId, role }\`. If invalid or expired, it halts execution immediately with HTTP 401.
- **Authorization (\`authorizeTeacher\` / \`authorizeStudent\`):** Inspects \`req.user.role\`. If a student attempts to call a teacher course creation endpoint, it halts with HTTP 403 Forbidden.
- **File Ingestion (\`upload.single("file")\`):** Intercepts multipart/form-data streams, buffers file chunks in memory, rejects files exceeding 25MB, and validates MIME types before the controller ever runs.

### Why Prisma Schema is Kept Separate from Code
Unlike active-record libraries where database schemas are embedded in JavaScript classes, Prisma uses a declarative Data Definition Language in \`schema.prisma\`. This provides:
1. **Single Source of Truth:** Models, foreign keys, indexes, and constraints are declared once.
2. **Deterministic Migration History:** The CLI inspects the difference between the schema and the live database to generate pure, readable SQL migration files in \`prisma/migrations/\`.
3. **Automated Client Generation:** Running \`npx prisma generate\` produces an ultra-optimized, type-safe query client in \`node_modules/@prisma/client\`.
`,
  html: `
    <section class="chapter" id="part2">
      <div class="chapter-header">
        <span class="chapter-tag">CODEBASE ATLAS</span>
        <h1>Part 2 — Project Structure &amp; File Responsibilities</h1>
      </div>

      <h2>2.1 Verified Project Directory Tree</h2>
      <p>The repository is split into two cleanly separated root directories: <code>Client/lms-frontend</code> and <code>Server</code>.</p>

      <div class="tree-box">
<pre>CampusHub/
├── <strong>Client/lms-frontend/</strong>                 <span class="tree-comment"># React 19 Frontend SPA (Vite + Tailwind v4)</span>
│   ├── src/
│   │   ├── app/router.jsx               <span class="tree-comment"># Central routing configuration, protected guards, layouts</span>
│   │   ├── components/
│   │   │   ├── layout/                  <span class="tree-comment"># Header, Sidebar, DashboardLayout</span>
│   │   │   ├── ui/                      <span class="tree-comment"># Button, Input, Modal, ProgressBar, Tabs</span>
│   │   │   └── ProtectedRoute.jsx       <span class="tree-comment"># Auth and Role verification route guard</span>
│   │   ├── context/
│   │   │   ├── AuthContext.jsx          <span class="tree-comment"># Global session state, localStorage sync, profile hydrator</span>
│   │   │   └── LoadingContext.jsx       <span class="tree-comment"># Active request counter for global top loader</span>
│   │   ├── features/                    <span class="tree-comment"># Domain-driven feature modules</span>
│   │   │   ├── assignments/             <span class="tree-comment"># Student submissions &amp; Teacher assignment grading</span>
│   │   │   ├── auth/                    <span class="tree-comment"># Login, Signup, ForgotPassword, Brand banners</span>
│   │   │   ├── courses/                 <span class="tree-comment"># Course listing, Course details, Teacher course editor</span>
│   │   │   ├── dashboard/               <span class="tree-comment"># Student &amp; Teacher personalized metrics dashboards</span>
│   │   │   ├── profile/                 <span class="tree-comment"># Student profile view and personal details editor</span>
│   │   │   ├── quizzes/                 <span class="tree-comment"># Quizzes catalog, Attempt runner, Results, Teacher Quiz Manager</span>
│   │   │   ├── submissions/             <span class="tree-comment"># Dedicated Teacher student submissions overview</span>
│   │   │   └── uploads/                 <span class="tree-comment"># Cloudflare R2 Private file and folder storage manager</span>
│   │   ├── hooks/                       <span class="tree-comment"># useAuth, useLoading, useToast</span>
│   │   ├── services/api.js              <span class="tree-comment"># Central Axios-style fetch wrapper with auth injection</span>
│   │   ├── App.jsx                      <span class="tree-comment"># Root component mounting AuthProvider and Global Loading Bar</span>
│   │   └── main.jsx                     <span class="tree-comment"># DOM entry point mounting React root with BrowserRouter</span>
│   ├── vercel.json                      <span class="tree-comment"># SPA client-side rewrite rules for Vercel deployment</span>
│   └── vite.config.js                   <span class="tree-comment"># Vite configuration with React and Tailwind plugins</span>
│
└── <strong>Server/</strong>                              <span class="tree-comment"># Node.js + Express 5 REST API Backend</span>
    ├── prisma/
    │   ├── migrations/                  <span class="tree-comment"># 12 applied SQL migrations documenting database history</span>
    │   └── schema.prisma                <span class="tree-comment"># Authoritative Prisma data models, constraints, and datasource</span>
    ├── src/
    │   ├── config/
    │   │   ├── prisma.js                <span class="tree-comment"># Singleton PrismaClient instance exported for controllers</span>
    │   │   └── r2.js                    <span class="tree-comment"># Cloudflare R2 S3Client instance initialization</span>
    │   ├── controllers/                 <span class="tree-comment"># Business logic, data validation, database orchestration</span>
    │   │   ├── auth.controller.js       <span class="tree-comment"># Direct registration, bcrypt hashing, JWT login</span>
    │   │   ├── assignment.controller.js <span class="tree-comment"># Assignment creation, student submission, grading</span>
    │   │   ├── course.controller.js     <span class="tree-comment"># Course catalog, teacher course management</span>
    │   │   ├── privateFile.controller.js<span class="tree-comment"># R2 PutObject, Presigned GetObject, DB records</span>
    │   │   └── quiz.controller.js       <span class="tree-comment"># Quiz CRUD, Question authoring, Attempts, Auto-grading</span>
    │   ├── middleware/
    │   │   ├── auth.middleware.js       <span class="tree-comment"># JWT verification &amp; role authorization (Student/Teacher)</span>
    │   │   └── upload.middleware.js     <span class="tree-comment"># Multer memory storage &amp; 25MB MIME whitelist validator</span>
    │   ├── routes/                      <span class="tree-comment"># Express router definitions mapping HTTP methods to controllers</span>
    │   └── index.js                     <span class="tree-comment"># Main Express entry point, CORS, JSON parsing, port listener</span>
    └── .env                             <span class="tree-comment"># Local secrets: DATABASE_URL, JWT_SECRET, R2 credentials</span>
</pre>
      </div>

      <h2>2.2 Deep Dive: Why Architectural Layers are Separated</h2>

      <div class="card">
        <h3>1. Why Routes and Controllers are Separated</h3>
        <p class="text-sm">
          In Express, a <strong>Route</strong> is strictly a traffic dispatcher. It defines the HTTP verb, the path pattern, the middleware stack, and points to a controller function. A <strong>Controller</strong> contains the actual business execution logic.
        </p>
        <p class="text-sm">
          <em>Why this matters:</em> If an endpoint path changes from <code>/api/course</code> to <code>/api/courses</code>, only the route definition is touched. The complex business logic, validation algorithms, and database transactions in the controller remain completely unaffected and isolated.
        </p>
      </div>

      <div class="card">
        <h3>2. Why Middleware Exists</h3>
        <p class="text-sm">
          Middleware functions act as security guards and pre-processors. Instead of duplicating JWT verification or file-size checks inside every single controller, middleware executes first. If the incoming token is expired or the file is not an allowed PDF/ZIP, the middleware halts the request immediately with an HTTP 401 or 400 before heavy database queries run.
        </p>
      </div>

      <div class="card">
        <h3>3. Why the Prisma Schema is Separate from Code</h3>
        <p class="text-sm">
          Prisma uses a declarative modeling syntax in <code>schema.prisma</code> instead of inline JavaScript models. This acts as the single source of truth for the entire database. Running <code>prisma migrate</code> translates this schema into immutable SQL migration files, while <code>prisma generate</code> builds the strongly-typed JavaScript query builder used by controllers.
        </p>
      </div>
    </section>
`
};
