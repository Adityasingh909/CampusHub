// Part 12: 1-Page Revision Cheat Sheet
module.exports = {
  title: "Part 12 — 1-Page Revision Cheat Sheet",
  markdown: `
# Part 12 — 1-Page Revision Cheat Sheet

## High-Density Pre-Interview Quick Reference

### 1. The Stack in 4 Bullets
- **Frontend:** React 19 + Vite 8 + Tailwind CSS v4 + React Router v7 on **Vercel** (\`campus-hub-delta-sooty.vercel.app\`).
- **Backend:** Node.js 26 + Express 5 REST API on **Render**, CommonJS modules, stateless JWT authentication.
- **Database:** PostgreSQL on **Neon Serverless** (AWS us-east-2), Prisma ORM 6.19.3, 13 models, 12 migrations.
- **Storage:** **Cloudflare R2** via AWS S3 SDK v3, 60s presigned URLs, zero egress fees, compensating rollback pattern.

---

### 2. Critical Prisma CLI Commands
\`\`\`bash
# Local development: generate migration SQL, apply locally, update client
npx prisma migrate dev --name <migration_name>

# Production CI/CD: apply pending migrations safely without interactive prompts
npx prisma migrate deploy

# Validate schema syntax against current Prisma version
npx prisma validate

# Regenerate Prisma Client TypeScript/JS definitions
npx prisma generate

# Launch local GUI browser to inspect database records
npx prisma studio
\`\`\`

---

### 3. Essential Architecture Rules
1. **Never use \`prisma db push\` in production:** It skips version-controlled migration files and risks silent data loss.
2. **Never commit \`.env\` files:** Store production secrets in Render and Vercel dashboard environment settings.
3. **Never store binary files in PostgreSQL:** Offload heavy blobs to Cloudflare R2 and store metadata pointers in the database.
4. **Always rollback distributed failures:** If database metadata insertion fails after an S3 upload, delete the uploaded object immediately.
5. **Always make mutative endpoints idempotent:** Guard against duplicate clicks and React StrictMode double mounts.

---

### 4. Sanitized Environment Variables Blueprint
\`\`\`env
# Server (.env)
PORT=2000
DATABASE_URL="postgresql://user:pass@ep-cool-db.us-east-2.aws.neon.tech/campushub?sslmode=require"
DIRECT_URL="postgresql://user:pass@ep-cool-db.us-east-2.aws.neon.tech/campushub?sslmode=require"
JWT_SECRET="<256-bit-cryptographic-random-secret>"
CLOUDFLARE_R2_ACCOUNT_ID="<r2-account-id>"
CLOUDFLARE_R2_ACCESS_KEY_ID="<r2-access-key>"
CLOUDFLARE_R2_SECRET_ACCESS_KEY="<r2-secret-key>"
CLOUDFLARE_R2_BUCKET_NAME="campushub-private-vault"
FRONTEND_URL="https://campus-hub-delta-sooty.vercel.app"

# Client (.env.production)
VITE_API_BASE_URL="https://campushub-api.onrender.com"
\`\`\`

---

### 5. 10 Core Concepts to Explain Confidently
1. **JWT RBAC:** Token carries \`{ id, role }\` signed with HMAC-SHA256; middleware rejects unauthorized access with 403.
2. **Cascade Delete:** Deleting a Course automatically deletes associated assignments, quizzes, and enrollments in one transaction.
3. **Presigned URLs:** Server signs S3 requests with 60-second validity, allowing browser direct download without exposing bucket credentials.
4. **PgBouncer Pooling:** Neon proxies connections on port 6543, reusing active DB connections across rapid serverless requests.
5. **Strict POSIX .env:** Keys must have no spaces around the equals sign (\`KEY=VALUE\`) to prevent shell parsing failure.
6. **Compensating Rollback:** Two-phase writes across cloud storage and DB must clean up storage if the DB call fails.
7. **React Ref Lock:** \`useRef(false)\` blocks race conditions during rapid re-renders or double button clicks.
8. **Prisma Pinning:** Locking \`prisma.pinToPrisma6: true\` in VS Code settings prevents Prisma 7 Language Server deprecation errors.
9. **Atomic Registration:** Direct registration hashes password via bcrypt and writes to DB, removing brittle email OTP dependencies.
10. **SPA Edge Fallback:** Vercel routes non-asset requests to \`/index.html\` so React Router handles URL routing client-side.
`,
  html: `
    <section class="chapter" id="part-12">
      <div class="chapter-header">
        <span class="chapter-tag">QUICK REVISION</span>
        <h1>Part 12 — 1-Page Revision Cheat Sheet</h1>
      </div>

      <div class="grid-2">
        <div class="card">
          <h3 class="card-title">Production Infrastructure</h3>
          <ul class="text-sm">
            <li><strong>Frontend:</strong> React 19 SPA on Vercel CDN.</li>
            <li><strong>Backend:</strong> Express 5 API on Render container.</li>
            <li><strong>Database:</strong> PostgreSQL on Neon Serverless (AWS us-east-2).</li>
            <li><strong>Object Store:</strong> Cloudflare R2 (S3-compatible, zero egress).</li>
            <li><strong>Auth:</strong> Stateless JWT + Bcrypt (10 salt rounds).</li>
          </ul>
        </div>

        <div class="card">
          <h3 class="card-title">Prisma &amp; Database CLI</h3>
          <ul class="text-sm">
            <li><code>npx prisma migrate dev</code> (Local schema migration)</li>
            <li><code>npx prisma migrate deploy</code> (Production non-interactive)</li>
            <li><code>npx prisma generate</code> (Update client bindings)</li>
            <li><code>npx prisma validate</code> (Check schema syntax)</li>
            <li><code>npx prisma studio</code> (Open database GUI browser)</li>
          </ul>
        </div>
      </div>

      <h2>Top 10 Architectural Principles to Mention in Interviews</h2>
      <div class="table-container">
        <table class="spec-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Architectural Principle</th>
              <th>How CampusHub Implements It</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td><strong>Stateless RBAC</strong></td>
              <td>Role stored in signed JWT; verified server-side on every protected API call.</td>
            </tr>
            <tr>
              <td>2</td>
              <td><strong>Zero-Egress Storage</strong></td>
              <td>Cloudflare R2 eliminates egress fees; files accessed via 60-second presigned URLs.</td>
            </tr>
            <tr>
              <td>3</td>
              <td><strong>Distributed Saga Rollback</strong></td>
              <td>If PostgreSQL metadata insert fails, controller deletes uploaded R2 blob immediately.</td>
            </tr>
            <tr>
              <td>4</td>
              <td><strong>Concurrency Idempotency</strong></td>
              <td>Frontend <code>useRef</code> lock + backend check prevent duplicate quiz attempt creation.</td>
            </tr>
            <tr>
              <td>5</td>
              <td><strong>Connection Pooling</strong></td>
              <td>Neon PgBouncer (port 6543) enables instant connection reuse across ephemeral requests.</td>
            </tr>
            <tr>
              <td>6</td>
              <td><strong>Migration Discipline</strong></td>
              <td>Never run <code>db push</code> in production; use version-controlled SQL migrations.</td>
            </tr>
            <tr>
              <td>7</td>
              <td><strong>Direct Registration</strong></td>
              <td>Removed email OTP to eliminate external SMTP relay bottlenecks and registration drop-offs.</td>
            </tr>
            <tr>
              <td>8</td>
              <td><strong>Tailwind CSS v4 Engine</strong></td>
              <td>Lightning CSS Rust compiler provides CSS-first variables and zero-config styling.</td>
            </tr>
            <tr>
              <td>9</td>
              <td><strong>SPA Route Fallback</strong></td>
              <td>Vercel CDN routes all incoming paths to <code>index.html</code> so React Router resolves routes.</td>
            </tr>
            <tr>
              <td>10</td>
              <td><strong>Atomic Transactions</strong></td>
              <td><code>prisma.$transaction</code> wraps multi-table updates (quiz score, answers, attempt status).</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `
};
