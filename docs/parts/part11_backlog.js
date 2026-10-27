// Part 11: Engineering Backlog & Next Features
module.exports = {
  title: "Part 11 — Engineering Backlog & Next Features",
  markdown: `
# Part 11 — Engineering Backlog & Next Features

## Prioritization Framework
Features in the CampusHub engineering backlog are prioritized using the **P0 - P3 Severity Matrix**, balancing user value, production reliability, security risk, and architectural complexity.

---

## P0: Critical Security & Production Hardening
*Must be implemented before opening the system to public, unmoderated university traffic.*

### 1. Endpoint Rate Limiting (P0 - High Impact, Low Effort)
- **Problem:** Currently, \`POST /api/auth/login\` and \`POST /api/auth/register\` have no rate limits, exposing the server to credential stuffing and brute-force password guessing.
- **Solution:** Add \`express-rate-limit\` with an in-memory or Redis store. Restrict registration to 5 requests per hour per IP and login to 10 attempts per 15 minutes.
- **Dependencies:** None.

### 2. Request Schema Validation with Zod (P0 - High Impact, Medium Effort)
- **Problem:** Controller handlers manually check \`if (!email || !password)\`. Subtle type mismatches or unvalidated string lengths could trigger database exceptions.
- **Solution:** Introduce Zod schemas as Express validation middleware (\`validateBody(registerSchema)\`). Reject malformed payloads with 400 Bad Request before hitting controllers.
- **Dependencies:** \`zod\`.

### 3. Helmet Security Headers & Content Security Policy (P0 - High Impact, Low Effort)
- **Problem:** Default Express HTTP responses lack modern browser security headers.
- **Solution:** Add \`helmet\` to inject \`Strict-Transport-Security\`, \`X-Content-Type-Options\`, \`X-Frame-Options: DENY\`, and strict referrer policies.
- **Dependencies:** \`helmet\`.

---

## P1: Core Academic & LMS Feature Expansion
*High-value functional features that complete the university learning experience.*

### 4. Interactive Course Discussion Forums (P1 - High Impact, Medium Effort)
- **Description:** Allow students and instructors to create discussion threads per course with nested replies, markdown formatting, and "Instructor Verified" answer badges.
- **Schema Changes:** Create \`ForumThread\` and \`ForumReply\` models linked to \`Course\` and \`User\`.
- **UI Changes:** Add "Discussions" tab to Course Details view.

### 5. Automated Gradebook & CSV Export (P1 - High Impact, Low Effort)
- **Description:** Provide teachers with an aggregated gradebook matrix showing all enrolled students, assignment scores, quiz results, and GPA calculations. Include one-click export to CSV for institutional records.
- **Implementation:** Backend endpoint \`GET /api/courses/:id/gradebook/export\` generating dynamic CSV streams via \`fast-csv\`.

### 6. Course Completion Certificates (P1 - Medium Impact, Medium Effort)
- **Description:** When an enrolled student reaches 100% course progress and achieves passing scores across all assignments and quizzes, automatically generate a verifiable PDF completion certificate.
- **Implementation:** Headless PDF generation via \`pdfkit\` or Puppeteer stored in Cloudflare R2 with unique verification UUID.

---

## P2: Advanced Architectural Upgrades
*Infrastructure enhancements supporting high scale and low latency.*

### 7. Refresh Token Rotation with Redis (P2 - High Impact, High Effort)
- **Description:** Migrate from single long-lived JWTs in \`localStorage\` to short-lived access tokens (15-minute TTL) stored in memory, paired with revolving refresh tokens stored in \`httpOnly\` Secure cookies backed by Redis.
- **Benefit:** Mitigates XSS token theft and allows instant token revocation on logout or account compromise.

### 8. Asynchronous Worker Queue with BullMQ (P2 - High Impact, High Effort)
- **Description:** Offload resource-heavy operations (generating course certificates, processing bulk quiz grading, compiling ZIPs of assignment files) to background worker processes via BullMQ and Redis.
- **Benefit:** Keeps the Express HTTP event loop completely responsive with sub-10ms response times.

---

## P3: User Experience Delighters & Modern UI Polish
*Enhancements that elevate the look, feel, and day-to-day usability of the platform.*

### 9. Dark Mode Theme Engine (P3 - Low Impact, Low Effort)
- **Description:** Provide seamless switching between Light, Dark, and System theme presets utilizing Tailwind CSS v4's native CSS variables and \`color-scheme\` properties.

### 10. Student Activity Heatmap (P3 - Low Impact, Medium Effort)
- **Description:** Display a GitHub-style activity contribution calendar on the student profile, visualizing quiz completions, assignment submissions, and login streaks.
`,
  html: `
    <section class="chapter" id="part-11">
      <div class="chapter-header">
        <span class="chapter-tag">ROADMAP &amp; PRIORITIES</span>
        <h1>Part 11 — Engineering Backlog &amp; Next Features</h1>
      </div>

      <p class="lead">
        A structured backlog categorized by the standard industry <strong>P0 (Critical) to P3 (Delighters)</strong> framework to guide the next phases of development.
      </p>

      <div class="table-container">
        <table class="spec-table">
          <thead>
            <tr>
              <th>Priority</th>
              <th>Feature / Improvement</th>
              <th>Impact</th>
              <th>Effort</th>
              <th>Key Architecture Requirement</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span class="badge badge-red">P0 - Critical</span></td>
              <td><strong>Rate Limiting &amp; Brute-Force Defense</strong></td>
              <td>Prevents credential stuffing attacks on auth endpoints.</td>
              <td>Low</td>
              <td><code>express-rate-limit</code> middleware with IP throttling.</td>
            </tr>
            <tr>
              <td><span class="badge badge-red">P0 - Critical</span></td>
              <td><strong>Zod Schema Request Validation</strong></td>
              <td>Guarantees strongly-typed request payloads at API boundary.</td>
              <td>Medium</td>
              <td>Validation middleware rejecting malformed requests with 400.</td>
            </tr>
            <tr>
              <td><span class="badge badge-red">P0 - Critical</span></td>
              <td><strong>Helmet Security Headers</strong></td>
              <td>Protects against XSS, clickjacking, and MIME-sniffing.</td>
              <td>Low</td>
              <td>Express <code>helmet</code> middleware integration.</td>
            </tr>
            <tr>
              <td><span class="badge badge-orange">P1 - High</span></td>
              <td><strong>Course Discussion Forums</strong></td>
              <td>Drives student-teacher engagement and collaborative learning.</td>
              <td>Medium</td>
              <td><code>ForumThread</code> &amp; <code>ForumReply</code> Prisma models.</td>
            </tr>
            <tr>
              <td><span class="badge badge-orange">P1 - High</span></td>
              <td><strong>Teacher Gradebook &amp; CSV Export</strong></td>
              <td>Aggregates all student scores into an institutional grade matrix.</td>
              <td>Low</td>
              <td>Dynamic CSV stream generation via <code>fast-csv</code>.</td>
            </tr>
            <tr>
              <td><span class="badge badge-blue">P2 - Scale</span></td>
              <td><strong>Refresh Token Rotation in Redis</strong></td>
              <td>Enterprise-grade security preventing token theft.</td>
              <td>High</td>
              <td>Short-lived access tokens + <code>httpOnly</code> refresh cookies.</td>
            </tr>
            <tr>
              <td><span class="badge badge-blue">P2 - Scale</span></td>
              <td><strong>BullMQ Asynchronous Job Queue</strong></td>
              <td>Prevents heavy tasks from blocking the Express event loop.</td>
              <td>High</td>
              <td>Redis-backed worker processes for batch processing.</td>
            </tr>
            <tr>
              <td><span class="badge badge-purple">P3 - Polish</span></td>
              <td><strong>Dark Mode &amp; Student Activity Heatmap</strong></td>
              <td>Modernizes UI aesthetics and boosts user engagement.</td>
              <td>Medium</td>
              <td>Tailwind CSS v4 CSS variables &amp; SVG contribution grid.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `
};
