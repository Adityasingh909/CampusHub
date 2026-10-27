// Part 13: Technical Glossary & Project File Index
module.exports = {
  title: "Part 13 — Technical Glossary & Project File Index",
  markdown: `
# Part 13 — Technical Glossary & Project File Index

## 13.1 Technical Glossary (35+ Essential Industry Concepts)

1. **ACID Properties:** Atomicity, Consistency, Isolation, Durability. The core guarantees provided by PostgreSQL transactions to ensure reliable database modifications.
2. **Atomic Transaction:** A database operation where all sub-queries succeed together or none take effect (\`prisma.$transaction\`), preventing partial data corruption.
3. **Bcrypt:** An adaptive cryptographic hash function designed specifically for secure password storage with built-in salting and adjustable computation cost.
4. **Bearer Token:** A security token sent in the \`Authorization\` HTTP header (\`Bearer <token>\`) granting the bearer access to protected resources.
5. **Blob (Binary Large Object):** Unstructured binary data such as PDFs, images, and ZIP files. In CampusHub, blobs are stored in Cloudflare R2 rather than PostgreSQL.
6. **CDN (Content Delivery Network):** A geographically distributed network of proxy servers (Vercel Edge) delivering static web assets with minimal latency.
7. **Compensating Transaction (Saga):** An architectural pattern that executes an explicit undo action (e.g., deleting an uploaded R2 file) when a subsequent distributed step (database insert) fails.
8. **Connection Pooling:** A cache of persistent database connections maintained by a proxy like PgBouncer, eliminating TCP and SSL handshake latency for incoming requests.
9. **CORS (Cross-Origin Resource Sharing):** An HTTP-header mechanism allowing a browser on one domain (\`campus-hub.vercel.app\`) to make requests to an API on another domain (\`render.com\`).
10. **CSRF (Cross-Site Request Forgery):** An exploit where an unauthorized command is transmitted from a trusted user's browser. Mitigated in modern APIs using stateless Bearer tokens.
11. **DDL (Data Definition Language):** SQL statements that define or modify database structure (\`CREATE TABLE\`, \`ALTER TABLE\`, \`DROP TABLE\`), managed automatically via Prisma migrations.
12. **Idempotency:** A property of an API operation where making multiple identical requests has the exact same side-effect as making a single request (e.g., starting an active quiz).
13. **JWT (JSON Web Token):** A compact, URL-safe token carrying signed JSON claims used for stateless client-server authentication.
14. **Lightning CSS:** A high-performance Rust-based CSS parser and minifier that powers Tailwind CSS v4's ultra-fast compilation.
15. **Middleware:** A composable software pipeline in Express through which incoming HTTP requests pass before reaching their route controllers (e.g., JSON parsing, CORS, authentication).
16. **Monolith (Modular):** A software architecture where all application modules (auth, courses, quizzes, storage) share a unified backend codebase and database.
17. **ORM (Object-Relational Mapper):** A tool (Prisma) that abstracts SQL queries into strongly-typed programming language objects.
18. **Pagination:** The technique of breaking large datasets into smaller chunks (pages) using \`limit\` and \`offset\` to optimize API performance and memory usage.
19. **PgBouncer:** A lightweight, high-performance PostgreSQL connection pooler utilized by Neon to support thousands of concurrent serverless database connections.
20. **Presigned URL:** A time-limited, cryptographically signed URL allowing a client to download or upload directly to cloud object storage without public bucket exposure.
21. **Primary Key (PK):** A unique identifier for a database record (e.g., \`User.id\`).
22. **Foreign Key (FK):** A column in a table that references the primary key of another table, creating a relational link and enforcing referential integrity.
23. **RBAC (Role-Based Access Control):** A security model restricting system access to authorized users based on their assigned role (\`STUDENT\`, \`TEACHER\`, \`ADMIN\`).
24. **REST (Representational State Transfer):** An architectural style for network APIs using standard HTTP verbs (\`GET\`, \`POST\`, \`PATCH\`, \`DELETE\`) to operate on resources.
25. **Reverse Proxy:** A server that sits in front of backend web applications and forwards client requests (e.g., Render routing traffic to Node.js containers).
26. **Route Guard:** A client-side routing component in React that checks authentication tokens and user roles before allowing access to private views.
27. **Salt Rounds:** The logarithmic cost factor applied to bcrypt hashing, defining how many iterations of key expansion are performed (\`2^10 = 1024\`).
28. **Single Page Application (SPA):** A web application (React) that loads a single HTML page and dynamically rewrites the view as the user interacts with the app, without page reloads.
29. **Stateless Architecture:** An application design where the server does not store client session state between requests; each request carries all necessary credentials (JWT).
30. **StrictMode:** A development-only feature in React that double-mounts components to detect unintended side-effects and resource leaks.
31. **TanStack Query:** A powerful asynchronous state management library for React that simplifies caching, background refetching, and server-state synchronization.
32. **Time-To-Live (TTL):** The duration for which a token, cache entry, or presigned URL remains valid before expiring automatically.
33. **WebSockets:** A protocol providing full-duplex, persistent communication channels over a single TCP connection, enabling real-time live events.
34. **XSS (Cross-Site Scripting):** A security vulnerability where malicious scripts are injected into trusted websites. Mitigated by React's automatic string escaping.
35. **Zod:** A TypeScript-first schema declaration and validation library used for runtime data parsing and API request sanitization.

---

## 13.2 Project File Cross-Reference Index

### Frontend Modules (\`Client/lms-frontend/src/\`)
- \`src/api/axios.js\`: Central Axios HTTP client. Injects \`Authorization: Bearer <token>\` and handles 401 redirect logic.
- \`src/context/AuthContext.jsx\`: React context provider storing authenticated user state and login/logout methods.
- \`src/components/common/Modal.jsx\`: Universal modal primitive supporting \`open\` and \`isOpen\` prop variants with backdrop blur.
- \`src/components/common/ProtectedRoute.jsx\`: Route guard verifying authentication status and authorized user roles.
- \`src/pages/auth/RegisterPage.jsx\`: Student/teacher registration view with direct submission and automatic redirect to login.
- \`src/pages/teacher/TeacherQuizzes.jsx\`: Faculty quiz administration portal with search, filter, and management actions.
- \`src/pages/student/QuizAttemptPage.jsx\`: Student timed assessment view with automated timer countdown and submission lock.

### Backend Modules (\`Server/src/\`)
- \`src/index.js\`: Server entry point. Configures Express 5, CORS, JSON parsing, routes, and error middleware.
- \`src/controllers/authController.js\`: Handles registration (bcrypt hashing), login (JWT issuance), and user profile lookups.
- \`src/controllers/quizController.js\`: Manages quiz CRUD, questions, starting attempts, and automated grading transactions.
- \`src/controllers/fileController.js\`: Manages Cloudflare R2 uploads, presigned URL generation, and compensating rollback logic.
- \`src/middleware/authMiddleware.js\`: Verifies JWT HMAC-SHA256 signatures and attaches sanitized user to \`req.user\`.
- \`src/middleware/roleMiddleware.js\`: Enforces role-based authorization guards on protected faculty and admin routes.
- \`src/lib/prisma.js\`: Global singleton PrismaClient instance preventing connection exhaustion in development.
- \`src/lib/r2.js\`: AWS S3 SDK v3 client configuration targeting Cloudflare R2 endpoint.
`,
  html: `
    <section class="chapter" id="part-13">
      <div class="chapter-header">
        <span class="chapter-tag">REFERENCE &amp; INDEX</span>
        <h1>Part 13 — Technical Glossary &amp; Project File Index</h1>
      </div>

      <h2>13.1 Technical Glossary (35+ Essential Industry Concepts)</h2>
      <p class="lead">Key engineering definitions contextualized within the CampusHub LMS architecture.</p>

      <div class="grid-2">
        <div class="card">
          <h4 style="margin: 0 0 4px 0; color: #1e293b;">Atomic Transaction</h4>
          <p class="text-sm">A database operation wrapped in <code>prisma.$transaction</code> where all sub-operations succeed together or roll back completely on error, preventing partial corruption.</p>
        </div>
        <div class="card">
          <h4 style="margin: 0 0 4px 0; color: #1e293b;">Bcrypt &amp; Salt Rounds</h4>
          <p class="text-sm">One-way cryptographic hash with 10 salt rounds (1024 work factor) protecting user passwords against rainbow tables and brute-force cracking.</p>
        </div>
        <div class="card">
          <h4 style="margin: 0 0 4px 0; color: #1e293b;">Compensating Transaction (Saga)</h4>
          <p class="text-sm">An explicit undo operation (deleting an uploaded R2 file) triggered when a subsequent distributed database insert fails.</p>
        </div>
        <div class="card">
          <h4 style="margin: 0 0 4px 0; color: #1e293b;">Connection Pooling (PgBouncer)</h4>
          <p class="text-sm">Neon's managed proxy caching physical PostgreSQL connections, enabling instant query execution across ephemeral serverless requests.</p>
        </div>
        <div class="card">
          <h4 style="margin: 0 0 4px 0; color: #1e293b;">Presigned URLs (60s TTL)</h4>
          <p class="text-sm">Cryptographically signed URLs allowing authorized clients direct download access to Cloudflare R2 objects without making the bucket public.</p>
        </div>
        <div class="card">
          <h4 style="margin: 0 0 4px 0; color: #1e293b;">Idempotency</h4>
          <p class="text-sm">Designing API endpoints so that repeated identical requests produce the same side-effect as a single request (e.g., starting an active quiz session).</p>
        </div>
      </div>

      <h2>13.2 Project File Cross-Reference Index</h2>
      <div class="table-container">
        <table class="spec-table">
          <thead>
            <tr>
              <th>File Path</th>
              <th>Architectural Role</th>
              <th>Key Exports &amp; Functions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>Client/src/api/axios.js</code></td>
              <td>Centralized HTTP Client</td>
              <td>Axios instance with automatic Bearer token interceptor and 401 handling.</td>
            </tr>
            <tr>
              <td><code>Client/src/context/AuthContext.jsx</code></td>
              <td>Identity Provider</td>
              <td>React Context providing <code>user</code>, <code>login()</code>, <code>logout()</code>, and auth state.</td>
            </tr>
            <tr>
              <td><code>Client/src/components/common/Modal.jsx</code></td>
              <td>Reusable UI Primitive</td>
              <td>Defensive modal dialog supporting both <code>open</code> and <code>isOpen</code> props.</td>
            </tr>
            <tr>
              <td><code>Server/src/index.js</code></td>
              <td>Express Server Entry Point</td>
              <td>Configures Express 5, CORS, JSON limits, route registration, and error handling.</td>
            </tr>
            <tr>
              <td><code>Server/src/lib/prisma.js</code></td>
              <td>Database Singleton</td>
              <td>Exports shared <code>PrismaClient</code> instance preventing connection leaks.</td>
            </tr>
            <tr>
              <td><code>Server/src/lib/r2.js</code></td>
              <td>Cloudflare R2 Client</td>
              <td>AWS S3 SDK v3 client initialized with Cloudflare endpoint and credentials.</td>
            </tr>
            <tr>
              <td><code>Server/src/controllers/quizController.js</code></td>
              <td>Assessment Engine</td>
              <td>Quiz CRUD, question management, idempotent attempt initialization, and grading.</td>
            </tr>
            <tr>
              <td><code>Server/src/controllers/fileController.js</code></td>
              <td>Cloud Storage Controller</td>
              <td>Uploads files to R2, creates DB records, handles saga rollbacks, and signs URLs.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `
};
