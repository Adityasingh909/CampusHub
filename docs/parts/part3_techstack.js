// Part 3: Technology Stack Matrix & Deep Relationships
module.exports = {
  title: "Part 3 — Technology Stack Matrix & Ecosystem Relationships",
  markdown: `
# Part 3 — Technology Stack Matrix & Ecosystem Relationships

## 3.1 Technology Stack Matrix

| Technology | Verified Version | Primary Responsibility in CampusHub | Key Code Appearance | What You Must Understand | Next Learning Target |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **React** | \`19.2.8\` | Declarative component UI, reactive state, and virtual DOM diffing | \`src/features/*\`, \`src/components/*\` | Component lifecycles, unidirectional data flow, React 18/19 StrictMode double-mount behaviors | React 19 Actions, \`useTransition\`, Server Components |
| **Vite** | \`8.3.0\` | Lightning-fast development server with Hot Module Replacement (HMR) and Rolldown/Rollup production bundling | \`vite.config.js\`, \`package.json\` | ES module-based local bundling vs minified production chunks; environment variable exposure via \`import.meta.env\` | Advanced code-splitting via dynamic imports, custom Vite plugins |
| **Tailwind CSS** | \`4.3.3\` | Utility-first CSS engine for clean, responsive UI styling | \`src/index.css\`, JSX \`className\` attributes | CSS-first config in Tailwind v4; flexbox, grid, breakpoints (\`sm:\`, \`md:\`, \`lg:\`), pseudo-classes | Custom CSS variables, container queries, dark mode variants |
| **React Router** | \`7.18.4\` | Client-side routing, URL synchronization, and navigation guards | \`src/app/router.jsx\`, \`ProtectedRoute.jsx\` | Client-side SPA routing without page refreshes; route parameters (\`:id\`), query params (\`useSearchParams\`), and navigation state | Nested route layouts, data loaders, action functions in React Router 7 |
| **Node.js** | \`v26.12.0\` | Asynchronous, event-driven JavaScript runtime environment | Server runtime, CLI execution | Single-threaded event loop, non-blocking I/O, worker threads, CommonJS vs ESM module resolution | Node.js stream internals, clustering, memory profiling |
| **Express** | \`5.3.0\` | Minimalist HTTP web framework and REST API server | \`Server/src/index.js\`, \`Server/src/routes/*\` | Request-response lifecycle, middleware stacking, route parameter extraction, HTTP status codes | Express 5 native async error propagation, custom rate-limiting middleware |
| **Prisma ORM** | \`6.19.3\` | Next-generation type-safe database query engine and migration tool | \`prisma/schema.prisma\`, \`src/config/prisma.js\` | Declarative schema modeling, deterministic migrations, relation queries (\`include\`), aggregation, connection pool limits | Raw SQL tagged templates with \`$queryRaw\`, Prisma transaction isolation levels |
| **PostgreSQL** | \`16/17 (Neon)\` | High-performance ACID-compliant relational SQL database | Neon Cloud (AWS us-east-2), local 5432 | Relational integrity, foreign keys, unique constraints, B-Tree indexes, cascade deletion | Advanced indexing (GIN, GiST), EXPLAIN ANALYZE query planning, connection pooling architectures |
| **Cloudflare R2** | Managed S3 | High-durability object storage for student files and folders | \`src/config/r2.js\`, \`privateFile.controller.js\` | Zero egress bandwidth fee model; S3 API compatibility; presigned URL generation with strict TTL | Multipart chunked uploads for files > 100MB, bucket lifecycle policies |
| **AWS SDK v3** | \`3.1156.0\` | Modular AWS SDK client for S3 PutObject, GetObject, DeleteObject | \`src/controllers/privateFile.controller.js\` | Command-pattern architecture (\`client.send(new Command())\`); streaming buffers to remote buckets | Presigned PUT URLs allowing direct browser-to-bucket uploads without server buffering |
| **bcryptjs** | \`3.0.3\` | Cryptographic password hashing using salt and Blowfish cipher | \`src/controllers/auth.controller.js\` | One-way irreversible hashing; salt generation preventing rainbow table attacks; computational cost factor (10 rounds) | Argon2 hashing algorithms, password policy enforcement engines |
| **jsonwebtoken** | \`9.0.3\` | Compact, URL-safe cryptographic token generator and validator | \`src/controllers/auth.controller.js\`, \`auth.middleware.js\` | Header, Payload, Signature breakdown; stateless verification using shared secret (\`JWT_SECRET\`) | Refresh token rotation, asymmetric RSA/ECDSA key pairs (RS256) |
| **Multer** | \`2.5.0\` | Multipart/form-data middleware for processing file uploads | \`src/middleware/upload.middleware.js\` | In-memory buffering vs disk storage; MIME-type filtering; file size enforcement | Streaming direct to S3 without holding file buffers in server RAM |

## 3.2 Deep Architectural Relationships

### 1. React and Vite
React provides the declarative component abstraction, but it cannot run raw JSX directly in web browsers. Vite acts as the build engine. In development, Vite leverages native browser ES modules to achieve sub-millisecond Hot Module Replacement (HMR). When you change a button color in \`QuizAttemptPage.jsx\`, only that component updates in the browser without reloading the page. During \`npm run build\`, Vite invokes Rolldown/Rollup to bundle, tree-shake, and minify the entire application into optimized static assets (\`dist/\`).

### 2. Prisma Client vs PostgreSQL: What the ORM Actually Does
A common beginner misconception is that Prisma *is* the database. PostgreSQL is the actual storage engine running on Neon's servers that holds physical data in relational tables on disk. Prisma is a **bridge**:
- **Without Prisma:** You would write raw strings like \`await db.query("SELECT * FROM users WHERE email = '" + email + "'")\`, leaving your code vulnerable to SQL injection and runtime syntax typos.
- **With Prisma:** You write \`await prisma.user.findUnique({ where: { email } })\`. The Prisma query engine translates this JavaScript method call into parameterized, injection-safe SQL, executes it against PostgreSQL, and maps the resulting SQL rows back into typed JavaScript objects.

### 3. Vercel, Render, and Neon: Cloud Service Distribution
- **Vercel:** Hosts the **Frontend**. It is an Edge CDN optimized for static files (HTML, CSS, JS bundles). It does not run Node.js backend controllers; it merely delivers the pre-compiled React application to the user's browser.
- **Render:** Hosts the **Backend API**. It runs a persistent Node.js container process that listens on port 4000 (or Render's assigned \`PORT\`), receives REST requests from the browser, and executes Express routes.
- **Neon:** Hosts the **Database**. It is a serverless PostgreSQL provider that decouples compute from storage, allowing instant database branching and automatic connection pooling.
`,
  html: `
    <section class="chapter" id="part3">
      <div class="chapter-header">
        <span class="chapter-tag">DEPENDENCY ARCHITECTURE</span>
        <h1>Part 3 — Technology Stack Matrix &amp; Ecosystem Relationships</h1>
      </div>

      <h2>3.1 Verified Technology Stack Matrix</h2>
      <p>Every technology in this matrix was directly verified against <code>Server/package.json</code>, <code>Client/lms-frontend/package.json</code>, and the live application runtime.</p>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th style="width: 14%;">Technology</th>
              <th style="width: 10%;">Version</th>
              <th style="width: 26%;">CampusHub Responsibility</th>
              <th style="width: 25%;">Core Concept to Master</th>
              <th style="width: 25%;">Next Learning Target</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>React</strong></td>
              <td><code>19.2.8</code></td>
              <td>Declarative component UI, reactive state, and virtual DOM diffing</td>
              <td>Unidirectional data flow, effect dependencies, StrictMode double-mounting</td>
              <td>React 19 Actions, <code>useTransition</code>, Server Components</td>
            </tr>
            <tr>
              <td><strong>Vite</strong></td>
              <td><code>8.3.0</code></td>
              <td>Development server with instant HMR and production bundle optimizer</td>
              <td>ESM bundling vs production chunks; <code>import.meta.env</code> exposure</td>
              <td>Route-level code splitting via dynamic <code>import()</code></td>
            </tr>
            <tr>
              <td><strong>Tailwind CSS</strong></td>
              <td><code>4.3.3</code></td>
              <td>Utility-first CSS styling engine with responsive breakpoints</td>
              <td>CSS-first theme configuration, flexbox, CSS grid, pseudo-classes</td>
              <td>Custom CSS design tokens, container queries, dark mode</td>
            </tr>
            <tr>
              <td><strong>React Router</strong></td>
              <td><code>7.18.4</code></td>
              <td>Client-side routing, URL state management, and protected route guards</td>
              <td>Client-side navigation without page reload; params &amp; location state</td>
              <td>Route data loaders, action handlers, pending states</td>
            </tr>
            <tr>
              <td><strong>Node.js</strong></td>
              <td><code>v26.12.0</code></td>
              <td>Asynchronous, non-blocking JavaScript server runtime environment</td>
              <td>Event loop, asynchronous I/O, CommonJS vs ESM module systems</td>
              <td>Node.js stream processing, memory profiling, worker threads</td>
            </tr>
            <tr>
              <td><strong>Express</strong></td>
              <td><code>5.3.0</code></td>
              <td>HTTP REST API server framework and request routing engine</td>
              <td>Middleware chaining, route dispatching, HTTP status semantics</td>
              <td>Express 5 native promise rejection handling, custom rate limiters</td>
            </tr>
            <tr>
              <td><strong>Prisma ORM</strong></td>
              <td><code>6.19.3</code></td>
              <td>Type-safe database abstraction, query builder, and migration engine</td>
              <td>Declarative schemas, migration generation, relation queries (<code>include</code>)</td>
              <td>Raw SQL with <code>$queryRaw</code>, database transaction isolation</td>
            </tr>
            <tr>
              <td><strong>PostgreSQL</strong></td>
              <td><code>16/17 (Neon)</code></td>
              <td>ACID-compliant relational database management system</td>
              <td>Relational constraints, foreign keys, unique indexes, cascade deletions</td>
              <td>Query execution planning with <code>EXPLAIN ANALYZE</code></td>
            </tr>
            <tr>
              <td><strong>Cloudflare R2</strong></td>
              <td>Managed S3</td>
              <td>High-durability object storage for student files and folders</td>
              <td>Zero-egress bandwidth pricing, S3 API compatibility, private bucket security</td>
              <td>Direct browser-to-bucket uploads via presigned PUT URLs</td>
            </tr>
            <tr>
              <td><strong>bcryptjs</strong></td>
              <td><code>3.0.3</code></td>
              <td>Cryptographic password hashing using salt and Blowfish cipher</td>
              <td>One-way hashing, salt rounds (cost factor 10), timing attacks</td>
              <td>Argon2id hashing algorithm comparison and benchmark</td>
            </tr>
            <tr>
              <td><strong>jsonwebtoken</strong></td>
              <td><code>9.0.3</code></td>
              <td>Cryptographic token generation and stateless signature verification</td>
              <td>Header.Payload.Signature anatomy; stateless verification via secret</td>
              <td>Refresh token rotation, RS256 asymmetric public/private keys</td>
            </tr>
            <tr>
              <td><strong>Multer</strong></td>
              <td><code>2.5.0</code></td>
              <td>Multipart/form-data middleware for processing file uploads</td>
              <td>Memory buffering, MIME-type validation, 25MB file size enforcement</td>
              <td>Direct stream piping to cloud storage without holding RAM</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>3.2 Key Technology Relationships Explained</h2>

      <div class="card">
        <h3>1. Prisma ORM vs PostgreSQL: Who Does What?</h3>
        <p class="text-sm">
          A common beginner confusion is thinking Prisma <em>is</em> the database. It is not. <strong>PostgreSQL</strong> is the database server hosted on Neon that physically stores your tables, records, and indexes on disk. <strong>Prisma</strong> is an Object-Relational Mapper (ORM) that lives inside your Express server code.
        </p>
        <p class="text-sm">
          When your controller executes <code>prisma.user.findUnique({ where: { email } })</code>, Prisma's Rust query engine constructs a parameterized SQL query: <code>SELECT id, name, email, password, role FROM "User" WHERE email = $1 LIMIT 1</code>. It sends this query over TCP to PostgreSQL, parses the database response rows, and returns a clean JavaScript object.
        </p>
      </div>

      <div class="card">
        <h3>2. Vercel vs Render vs Neon: Why Three Different Clouds?</h3>
        <p class="text-sm">
          CampusHub uses modern specialized cloud hosting rather than a monolithic virtual private server:
        </p>
        <ul>
          <li><strong>Vercel (Frontend):</strong> Serves static assets across global edge locations. When a user in Delhi or New York visits the site, the HTML, JS, and CSS load from the nearest edge server in milliseconds.</li>
          <li><strong>Render (Backend):</strong> Runs a continuous Node.js server that listens for incoming API traffic, verifies authentication, and computes business logic.</li>
          <li><strong>Neon (Database):</strong> Runs serverless PostgreSQL in AWS us-east-2. Neon automatically scales compute, handles automated backups, and provides connection pooling for high-concurrency queries.</li>
        </ul>
      </div>
    </section>
`
};
