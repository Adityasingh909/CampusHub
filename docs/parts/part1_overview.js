// Part 1: Executive Overview & System Architecture
module.exports = {
  title: "Part 1 — Executive Overview & System Architecture",
  markdown: `
# Part 1 — Executive Overview & System Architecture

## 1.1 Project Mission & Problem Statement
CampusHub LMS is a custom, full-stack Learning Management System engineered to streamline modern academic workflows for both students and faculty instructors. Traditional educational portals often suffer from fragmented user interfaces, cumbersome grading mechanics, clunky file storage, and unreliable submission lifecycles. CampusHub solves these problems through:
- **Unified Academic Workspaces:** Distinct, role-based dashboards tailored specifically for students and teachers.
- **Course Administration & Enrollment:** Direct student course catalogs, enrollment state tracking, syllabus inspection, and real-time announcements.
- **Assessment Engine:** Timed multiple-choice quizzes with server-side duration enforcement, automated instant scoring, anti-concurrency guards, and transparent student performance rubrics.
- **Assignment Lifecycles:** Deadline-aware student assignment submissions and a dedicated teacher evaluation portal with scoring and customized feedback.
- **Secure Cloud Object Storage:** A private personal file and folder repository integrated directly with Cloudflare R2, using time-limited presigned URLs (60-second TTL) for authenticated, zero-leak downloads.

## 1.2 Core Architectural Principles
1. **Decoupled Client-Server Boundary:** A Single Page Application (SPA) frontend communicating strictly over HTTPS with an asynchronous RESTful JSON API backend.
2. **Stateless JWT Authentication:** No server-side session memory or sticky sessions, enabling effortless horizontal scaling on serverless and containerized cloud platforms.
3. **Type-Safe ORM Data Access:** Complete elimination of raw, error-prone SQL string concatenation through Prisma ORM 6, enforcing compile-time model consistency and deterministic schema migrations.
4. **Resilient Blob Storage Offloading:** Large binary files (PDFs, ZIPs, images) are never stored in the database or server filesystem; they are streamed directly to Cloudflare R2 (S3-compatible) with metadata tracking in PostgreSQL.

## 1.3 Verified Production Architecture
The application runs across four managed cloud services, completely separating concerns:
- **Client (Frontend):** React 19 SPA bundled by Vite 8 and styled with Tailwind CSS v4, deployed globally across Vercel's Edge CDN (\`campus-hub-delta-sooty.vercel.app\`).
- **Server (Backend API):** Node.js 26 and Express 5 web service hosted on Render, handling routing, middleware authentication, business validation, and database operations.
- **Relational Database:** PostgreSQL managed by Neon Serverless Cloud (AWS us-east-2 region), connected via Prisma ORM 6.19.3.
- **Object Storage:** Cloudflare R2 private storage bucket, accessed via \`@aws-sdk/client-s3\` and \`@aws-sdk/s3-request-presigner\` using S3-compatible endpoints.

\`\`\`
+---------------------------------------------------------------------------------------------------------+
|                                  CAMPUSHUB END-TO-END ARCHITECTURE                                      |
+---------------------------------------------------------------------------------------------------------+
|                                                                                                         |
|   [ Browser / Student / Teacher Client ]                                                                |
|            |                                                                                            |
|            | 1. HTTP GET / Assets                                                                       |
|            v                                                                                            |
|   [ Vercel Edge CDN ]                                                                                   |
|   - React 19.2.8 + Vite 8.3.0 SPA                                                                       |
|   - Tailwind CSS v4.3.3 Design System                                                                   |
|   - Client-side Routing (React Router v7.18.4)                                                          |
|   - Global Request State & Auth Context                                                                 |
|            |                                                                                            |
|            | 2. HTTPS REST Calls + Authorization: Bearer <JWT>                                          |
|            v                                                                                            |
|   [ Render Container Service ]                                                                          |
|   - Node.js v26.12.0 + Express v5.3.0 REST API                                                          |
|   - CORS Middleware + JSON Body Parsing (5MB Limit)                                                     |
|   - JWT Authentication & Role Authorization Middleware                                                  |
|   - Route Handlers & Controllers                                                                        |
|      |                                                |                                                 |
|      | 3. Prisma ORM v6.19.3                          | 4. AWS S3 SDK v3.1156                           |
|      |    (Connection Pooling)                        |    (PutObjectCommand / Presigned URLs)          |
|      v                                                v                                                 |
|   [ Neon Cloud PostgreSQL ]                       [ Cloudflare R2 Storage ]                             |
|   - Serverless Postgres 16/17                     - S3-Compatible Bucket                                |
|   - AWS us-east-2 Region                          - Zero Egress Cost Blob Store                         |
|   - 12 Applied Migrations                         - User-Isolated Storage Keys                          |
|   - Relational Models & Indexes                   - 60s Time-To-Live Presigned URLs                     |
|                                                                                                         |
+---------------------------------------------------------------------------------------------------------+
\`\`\`
`,
  html: `
    <section class="chapter" id="part1">
      <div class="chapter-header">
        <span class="chapter-tag">SYSTEM BLUEPRINT</span>
        <h1>Part 1 — Executive Overview & System Architecture</h1>
      </div>

      <h2>1.1 Project Mission & Problem Statement</h2>
      <p>
        <strong>CampusHub LMS</strong> is a custom, full-stack Learning Management System engineered from the ground up to streamline modern academic workflows for both students and faculty instructors. Traditional educational portals often suffer from fragmented user interfaces, cumbersome grading mechanics, clunky file storage, and unreliable submission lifecycles. CampusHub solves these problems through:
      </p>
      <ul>
        <li><strong>Unified Academic Workspaces:</strong> Distinct, role-based dashboards tailored specifically for students and teachers with zero cross-role leakage.</li>
        <li><strong>Course Administration &amp; Enrollment:</strong> Direct student course catalogs, enrollment state tracking, syllabus inspection, and real-time course announcements.</li>
        <li><strong>Assessment Engine:</strong> Timed multiple-choice quizzes with server-side duration enforcement, automated instant scoring, anti-concurrency guards, and transparent student performance rubrics.</li>
        <li><strong>Assignment Lifecycles:</strong> Deadline-aware student assignment submissions and a dedicated teacher evaluation portal with scoring and customized feedback.</li>
        <li><strong>Secure Cloud Object Storage:</strong> A private personal file and folder repository integrated directly with Cloudflare R2, using time-limited presigned URLs (60-second TTL) for authenticated, zero-leak downloads.</li>
      </ul>

      <h2>1.2 Core Architectural Principles</h2>
      <div class="grid-2">
        <div class="card">
          <h3 class="card-title">1. Decoupled Client-Server Boundary</h3>
          <p class="text-sm">A Single Page Application (SPA) frontend communicating strictly over HTTPS with an asynchronous RESTful JSON API backend. Neither layer makes assumptions about the host environment of the other.</p>
        </div>
        <div class="card">
          <h3 class="card-title">2. Stateless JWT Authentication</h3>
          <p class="text-sm">No server-side session memory or sticky sessions. All authentication state is carried in cryptographic JSON Web Tokens signed with HMAC-SHA256, enabling effortless horizontal scaling on serverless and containerized cloud platforms.</p>
        </div>
        <div class="card">
          <h3 class="card-title">3. Type-Safe ORM Data Access</h3>
          <p class="text-sm">Complete elimination of raw, error-prone SQL string concatenation through Prisma ORM 6, enforcing compile-time model consistency, explicit foreign key relationships, and deterministic schema migrations.</p>
        </div>
        <div class="card">
          <h3 class="card-title">4. Resilient Blob Storage Offloading</h3>
          <p class="text-sm">Large binary files (PDFs, ZIPs, images) are never stored in the database or server filesystem; they are streamed directly to Cloudflare R2 (S3-compatible) with metadata tracking in PostgreSQL and compensation rollbacks on failure.</p>
        </div>
      </div>

      <h2>1.3 Verified System Architecture &amp; Data Pipeline</h2>
      <p>The application runs across four managed cloud services, completely separating concerns:</p>
      <ul>
        <li><strong>Client (Frontend):</strong> React 19 SPA bundled by Vite 8 and styled with Tailwind CSS v4, deployed globally across Vercel's Edge CDN (<code>campus-hub-delta-sooty.vercel.app</code>).</li>
        <li><strong>Server (Backend API):</strong> Node.js 26 and Express 5 web service hosted on Render, handling routing, middleware authentication, business validation, and database operations.</li>
        <li><strong>Relational Database:</strong> PostgreSQL managed by Neon Serverless Cloud (AWS us-east-2 region), connected via Prisma ORM 6.19.3.</li>
        <li><strong>Object Storage:</strong> Cloudflare R2 private storage bucket, accessed via <code>@aws-sdk/client-s3</code> and <code>@aws-sdk/s3-request-presigner</code> using S3-compatible endpoints.</li>
      </ul>

      <div class="diagram-wrapper">
        <svg viewBox="0 0 880 340" class="diagram-svg" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#0f172a" />
              <stop offset="100%" stop-color="#1e293b" />
            </linearGradient>
            <linearGradient id="grad-orange" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#f97316" />
              <stop offset="100%" stop-color="#ea580c" />
            </linearGradient>
            <linearGradient id="grad-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#059669" />
              <stop offset="100%" stop-color="#047857" />
            </linearGradient>
            <linearGradient id="grad-purple" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#7c3aed" />
              <stop offset="100%" stop-color="#6d28d9" />
            </linearGradient>
            <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.08" />
            </filter>
          </defs>

          <!-- Outer boundary -->
          <rect x="10" y="10" width="860" height="320" rx="16" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5" />

          <!-- Client Box -->
          <g filter="url(#shadow)">
            <rect x="35" y="40" width="220" height="260" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
            <rect x="35" y="40" width="220" height="42" rx="12" fill="url(#grad-blue)" />
            <text x="145" y="66" fill="#ffffff" font-size="13" font-weight="700" text-anchor="middle">CLIENT LAYER (Vercel)</text>
            <text x="50" y="105" fill="#0f172a" font-size="11" font-weight="700">React 19.2.8 + Vite 8.3</text>
            <text x="50" y="125" fill="#64748b" font-size="10">Tailwind CSS v4 (Engine)</text>
            <text x="50" y="145" fill="#64748b" font-size="10">React Router v7.18</text>
            <text x="50" y="165" fill="#64748b" font-size="10">Lucide React Icons</text>
            <line x1="50" y1="180" x2="235" y2="180" stroke="#f1f5f9" stroke-width="1" />
            <text x="50" y="200" fill="#0f172a" font-size="11" font-weight="700">Security &amp; State</text>
            <text x="50" y="220" fill="#64748b" font-size="10">JWT in LocalStorage</text>
            <text x="50" y="240" fill="#64748b" font-size="10">AuthContext &amp; LoadingContext</text>
            <text x="50" y="260" fill="#64748b" font-size="10">Axios-Style api.js Helper</text>
          </g>

          <!-- Arrow Client -> Server -->
          <g>
            <line x1="255" y1="170" x2="325" y2="170" stroke="#f97316" stroke-width="2.5" stroke-dasharray="4" />
            <polygon points="325,166 333,170 325,174" fill="#f97316" />
            <text x="290" y="158" fill="#ea580c" font-size="9" font-weight="700" text-anchor="middle">HTTPS / REST</text>
            <text x="290" y="188" fill="#64748b" font-size="8" text-anchor="middle">Bearer &lt;JWT&gt;</text>
          </g>

          <!-- Server Box -->
          <g filter="url(#shadow)">
            <rect x="335" y="40" width="220" height="260" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
            <rect x="335" y="40" width="220" height="42" rx="12" fill="url(#grad-orange)" />
            <text x="445" y="66" fill="#ffffff" font-size="13" font-weight="700" text-anchor="middle">BACKEND API (Render)</text>
            <text x="350" y="105" fill="#0f172a" font-size="11" font-weight="700">Node.js 26 + Express 5</text>
            <text x="350" y="125" fill="#64748b" font-size="10">CORS &amp; JSON (5MB Limit)</text>
            <text x="350" y="145" fill="#64748b" font-size="10">Auth &amp; Role Middleware</text>
            <text x="350" y="165" fill="#64748b" font-size="10">Multer (25MB Memory Storage)</text>
            <line x1="350" y1="180" x2="535" y2="180" stroke="#f1f5f9" stroke-width="1" />
            <text x="350" y="200" fill="#0f172a" font-size="11" font-weight="700">Service Modules</text>
            <text x="350" y="220" fill="#64748b" font-size="10">bcryptjs (Password Hash)</text>
            <text x="350" y="240" fill="#64748b" font-size="10">Prisma Client 6.19.3</text>
            <text x="350" y="260" fill="#64748b" font-size="10">AWS SDK v3 S3 Client</text>
          </g>

          <!-- Arrow Server -> Database -->
          <g>
            <line x1="555" y1="110" x2="625" y2="110" stroke="#059669" stroke-width="2" />
            <polygon points="625,106 633,110 625,114" fill="#059669" />
            <text x="590" y="100" fill="#047857" font-size="8.5" font-weight="700" text-anchor="middle">SQL / TCP</text>
          </g>

          <!-- Arrow Server -> Cloudflare R2 -->
          <g>
            <line x1="555" y1="230" x2="625" y2="230" stroke="#7c3aed" stroke-width="2" />
            <polygon points="625,226 633,230 625,234" fill="#7c3aed" />
            <text x="590" y="220" fill="#6d28d9" font-size="8.5" font-weight="700" text-anchor="middle">S3 API</text>
          </g>

          <!-- Neon Database Box -->
          <g filter="url(#shadow)">
            <rect x="635" y="40" width="205" height="120" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
            <rect x="635" y="40" width="205" height="34" rx="12" fill="url(#grad-emerald)" />
            <text x="737" y="62" fill="#ffffff" font-size="11.5" font-weight="700" text-anchor="middle">DATABASE (Neon Cloud)</text>
            <text x="650" y="94" fill="#0f172a" font-size="10.5" font-weight="700">PostgreSQL 16/17 Serverless</text>
            <text x="650" y="112" fill="#64748b" font-size="9.5">AWS us-east-2 / Connection Pooler</text>
            <text x="650" y="130" fill="#64748b" font-size="9.5">12 Schema Migrations Applied</text>
          </g>

          <!-- Cloudflare R2 Box -->
          <g filter="url(#shadow)">
            <rect x="635" y="180" width="205" height="120" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
            <rect x="635" y="180" width="205" height="34" rx="12" fill="url(#grad-purple)" />
            <text x="737" y="202" fill="#ffffff" font-size="11.5" font-weight="700" text-anchor="middle">BLOB STORE (Cloudflare R2)</text>
            <text x="650" y="234" fill="#0f172a" font-size="10.5" font-weight="700">S3-Compatible Object Store</text>
            <text x="650" y="252" fill="#64748b" font-size="9.5">Presigned URLs (60s Expiry)</text>
            <text x="650" y="270" fill="#64748b" font-size="9.5">Zero Egress Bandwidth Cost</text>
          </g>
        </svg>
      </div>

      <div class="callout callout-info">
        <div class="callout-title">Architectural Note on Mongoose in package.json</div>
        <p class="text-sm">
          Inspection of <code>Server/package.json</code> reveals <code>"mongoose": "^9.11.2"</code> listed as a dependency. However, a full codebase static analysis confirms that Mongoose is <em>neither imported nor used anywhere</em> in <code>Server/src</code>. PostgreSQL via Prisma ORM is the sole and authoritative database. The Mongoose dependency is legacy baggage from early prototype scaffolding and can be safely uninstalled.
        </p>
      </div>
    </section>
`
};
