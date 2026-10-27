// Part 4: Request Lifecycle & Core Application Workflows
module.exports = {
  title: "Part 4 — Request Lifecycle & Core Application Workflows",
  markdown: `
# Part 4 — Request Lifecycle & Core Application Workflows

## 4.1 The Standard 10-Step HTTP Request Lifecycle in CampusHub
Every user interaction in CampusHub follows an orchestrated ten-step journey across the frontend, network, backend middleware, business controllers, and persistence layers:

1. **User Action & Input Trigger:** The user interacts with a React UI component (e.g., submitting the Signup form or clicking "Submit Quiz").
2. **Client-Side Pre-Validation:** The component performs initial checks (e.g., verifying password length $\\ge 8$, checking email regex, ensuring confirmed passwords match) to prevent unnecessary network roundtrips.
3. **HTTP Dispatch via Centralized API Client:** The \`api()\` helper in \`src/services/api.js\` increments the active request counter (triggering the top global loading bar), extracts the JWT from \`localStorage.getItem("campushub_auth")\`, attaches \`Authorization: Bearer <token>\` and \`Content-Type: application/json\`, and dispatches the fetch request.
4. **Network & Ingress:** The request travels over TLS 1.3 across the internet to the Express 5 server hosted on Render.
5. **Global Middleware Execution:** Express processes global interceptors:
   - \`cors()\`: Validates origin headers and preflight \`OPTIONS\` requests.
   - \`express.json({ limit: "5mb" })\`: Parses raw incoming body buffers into JavaScript objects on \`req.body\`.
6. **Route Dispatch & Security Middleware:** Express matches the URL prefix (e.g., \`/api/quizzes\`) to \`quizRoutes\`. Route-specific middleware executes:
   - \`authenticate\`: Decodes and verifies the JWT signature; populates \`req.user = { userId, role }\`.
   - \`authorizeStudent\` / \`authorizeTeacher\`: Enforces role-based permissions, immediately returning HTTP 403 if unauthorized.
7. **Controller Domain Validation:** The controller method executes business rules (e.g., verifying course enrollment, checking if a quiz window is active, ensuring an assignment is not submitted past its deadline).
8. **Prisma ORM & PostgreSQL Persistence:** The controller executes type-safe Prisma queries or transactions (e.g., \`prisma.quizAttempt.update\`, \`prisma.$transaction\`), enforcing relational constraints and atomicity.
9. **Structured HTTP Response:** The controller returns an appropriate HTTP status code (\`200 OK\`, \`201 Created\`, \`400 Bad Request\`, \`404 Not Found\`, \`409 Conflict\`) with a structured JSON payload: \`{ success: boolean, message: string, data?: object }\`.
10. **State Reconciliation & UI Render:** The \`api()\` client decrements the global loading counter. The React component receives the parsed JSON, updates local or context state (e.g., displaying a success toast, redirecting via \`navigate()\`, or re-rendering with new database records).

---

## 4.2 Individual Workflow Traces

### Flow A: Registration (Direct User Creation)
- **Frontend Source:** \`Client/lms-frontend/src/features/auth/SignupPage.jsx\`
- **Backend Route:** \`POST /api/auth/register\` (\`Server/src/routes/auth.routes.js\`)
- **Backend Controller:** \`register\` in \`Server/src/controllers/auth.controller.js\`
- **Database Model:** \`User\` in \`Server/prisma/schema.prisma\`

**Execution Trace:**
1. Student enters full name, college email, password, and confirms password.
2. Form validates: name $\\ge 2$ characters, valid email regex, password $\\ge 8$ characters, passwords match, terms accepted.
3. Client dispatches \`api().post("/auth/register", { name, email, password })\`.
4. Server controller normalizes email: \`normalizedEmail = email.trim().toLowerCase()\`.
5. Duplicate check: executes \`prisma.user.findUnique({ where: { email: normalizedEmail } })\`. If found, halts with HTTP 409 Conflict: *"An account with this email already exists."*
6. Password hashing: executes \`await bcrypt.hash(password, 10)\`. The salt is generated automatically and embedded in the resulting hash string.
7. Record creation: executes \`prisma.user.create\` with \`role: "STUDENT"\`.
8. Response: returns HTTP 201 with \`{ success: true, message: "Account created successfully.", user: { id, name, email, role } }\`.
9. Redirection: \`SignupPage\` navigates directly to \`/login\` with navigation state: \`{ email, message }\`.
10. Feedback: \`LoginPage\` mounts, pre-fills the email input, and renders an emerald success alert banner: *"Account created successfully! Please sign in."*

### Flow B: Login and Protected Route Access
- **Frontend Source:** \`LoginPage.jsx\`, \`AuthContext.jsx\`, \`ProtectedRoute.jsx\`
- **Backend Route:** \`POST /api/auth/login\`
- **Backend Controller:** \`login\` in \`auth.controller.js\`
- **Middleware:** \`authenticate\` in \`Server/src/middleware/auth.middleware.js\`

**Execution Trace:**
1. User enters email and password; client submits to \`POST /api/auth/login\`.
2. Controller searches user: \`prisma.user.findUnique({ where: { email } })\`. If missing, returns HTTP 400.
3. Password comparison: executes \`await bcrypt.compare(password, user.password)\`. If mismatch, returns HTTP 401 Unauthorized.
4. Token creation: signs JWT with payload \`{ userId: user.id, role: user.role }\`, secret \`process.env.JWT_SECRET\`, and \`expiresIn: "1h"\`.
5. Response: returns HTTP 200 with JWT token and user profile object.
6. Client storage: \`AuthContext\` saves the session to \`localStorage.setItem("campushub_auth", JSON.stringify({ token, user, role }))\`.
7. Role dispatch: redirects to \`/teacher/dashboard\` if role is \`TEACHER\`, else \`/student/dashboard\`.
8. Protected Route Enforcement: \`ProtectedRoute.jsx\` wraps all portal routes. If \`auth.token\` is missing, it immediately redirects to \`/login\`. If a student attempts to access \`/teacher/*\`, it redirects them back to their authorized student portal.

### Flow C: Quiz Attempt & Automated Grading Lifecycle
- **Frontend Source:** \`QuizzesPage.jsx\`, \`QuizAttemptPage.jsx\`, \`QuizResultPage.jsx\`
- **Backend Routes:**
  - \`POST /api/quizzes/:quizId/start\`
  - \`POST /api/quizzes/attempts/:attemptId/submit\`
  - \`GET /api/quizzes/attempts/:attemptId/result\`
- **Backend Controller:** \`quiz.controller.js\`
- **Database Models:** \`Quiz\`, \`QuizQuestion\`, \`QuizAttempt\`, \`QuizAnswer\`

**Execution Trace:**
1. **Starting Attempt:** Student clicks "Start Assessment".
   - Client uses a ref guard (\`initiatingRef\`) to prevent React StrictMode double-mounting race conditions.
   - Server verifies course enrollment, quiz status (\`PUBLISHED\`), and checks if a submitted attempt already exists (returns 409 if already completed).
   - Server checks for active in-progress attempt within deadline limit. If valid, resumes; otherwise creates a new \`QuizAttempt\` with \`status: "IN_PROGRESS"\`.
   - Critical Security Feature: Question objects returned to the student have \`correctAnswer\` and \`explanation\` stripped server-side.
2. **Running Attempt:** A client countdown timer tracks remaining time derived from \`serverStartedAt + durationMinutes\`. Answers are saved to \`localStorage\` draft cache after every radio-button selection.
3. **Submitting Attempt:**
   - Student clicks "Submit Quiz". Client posts \`{ answers: [{ questionId, selectedOption }] }\`.
   - Server fetches quiz questions with authoritative \`correctAnswer\` and points.
   - Iterates through questions, evaluates correctness, accumulates \`totalScore\`, calculates percentage, and builds \`QuizAnswer\` records.
   - Database Transaction (\`prisma.$transaction\`):
     1. Atomically updates \`QuizAttempt\` from \`IN_PROGRESS\` to \`SUBMITTED\`, setting \`score\`, \`percentage\`, and \`submittedAt\`.
     2. Deletes any orphan/duplicate \`IN_PROGRESS\` attempts for this student and quiz.
     3. Inserts all \`QuizAnswer\` records with \`isCorrect\` and \`pointsAwarded\`.
4. **Results Review:** Student is redirected to \`/student/quizzes/attempts/:attemptId/result\`, viewing their final score, percentage, time spent, question-by-question breakdown, and correct answers with explanations.

### Flow D: Secure File Upload to Cloudflare R2
- **Frontend Source:** \`PrivateUploadsPage.jsx\` (\`src/services/privateFileService.js\`)
- **Backend Route:** \`POST /api/private-files/upload\`
- **Backend Controller:** \`uploadPrivateFile\` in \`privateFile.controller.js\`
- **Middleware:** \`upload.single("file")\` in \`upload.middleware.js\`

**Execution Trace:**
1. User selects a file (e.g., \`lecture_notes.pdf\`) and an optional folder.
2. Client wraps file in \`FormData\` and posts with \`onUploadProgress\` tracking.
3. Multer middleware intercepts: enforces 25MB maximum size, validates MIME type against whitelist (\`application/pdf\`, \`image/png\`, \`application/zip\`, etc.), and places buffer in \`req.file.buffer\`.
4. Controller verifies ownership if uploading into a specific folder (\`prisma.privateFolder.findFirst({ where: { id: folderId, userId } })\`).
5. Generates UUID storage key: \`storageKey = "private/" + userId + "/" + crypto.randomUUID() + ".pdf"\`.
6. Uploads binary buffer to Cloudflare R2 bucket via AWS S3 SDK \`PutObjectCommand\`.
7. Saves metadata in PostgreSQL \`PrivateFile\` table (\`originalName\`, \`storageKey\`, \`mimeType\`, \`size\`, \`userId\`, \`folderId\`).
8. Compensation Rollback Safety: If the database write fails, a catch block automatically executes \`DeleteObjectCommand\` on R2 to prevent orphaned storage leaks.
9. Secure Download: When downloading, client calls \`GET /api/private-files/:id/download\`. Server verifies user ownership and executes \`getSignedUrl(r2, command, { expiresIn: 60 })\`. Client receives a temporary presigned link that expires in 60 seconds, preventing unauthorized public URL sharing.
`,
  html: `
    <section class="chapter" id="part4">
      <div class="chapter-header">
        <span class="chapter-tag">EXECUTION PIPELINES</span>
        <h1>Part 4 — Request Lifecycle &amp; Core Application Workflows</h1>
      </div>

      <h2>4.1 The Standard 10-Step HTTP Request Lifecycle</h2>
      <p>Every dynamic interaction in CampusHub follows an orchestrated ten-step pipeline between browser, network, middleware, business controllers, and PostgreSQL:</p>

      <div class="card">
        <ol style="margin-left: 18px; padding-left: 0;">
          <li><strong>User Action:</strong> User interacts with a React UI component (e.g., submitting registration or a quiz answer).</li>
          <li><strong>Client-Side Validation:</strong> Component performs instant checks (email format, password length, required fields) to eliminate invalid network calls.</li>
          <li><strong>HTTP Client Dispatch:</strong> Centralized <code>api()</code> helper increments the active request counter (triggering the top loading bar), retrieves JWT from <code>localStorage</code>, injects <code>Authorization: Bearer &lt;token&gt;</code>, and dispatches the fetch call.</li>
          <li><strong>Network Ingress:</strong> Request traverses TLS 1.3 across the internet to the Express 5 server hosted on Render.</li>
          <li><strong>Global Middleware:</strong> Express invokes <code>cors()</code> and <code>express.json({ limit: "5mb" })</code> to parse incoming payload buffers into <code>req.body</code>.</li>
          <li><strong>Route &amp; Security Guards:</strong> Route-specific middleware executes: <code>authenticate</code> verifies the JWT signature; <code>authorizeStudent</code> or <code>authorizeTeacher</code> verifies role permissions.</li>
          <li><strong>Controller Business Validation:</strong> Controller evaluates domain rules (deadline expirations, course enrollments, duplicate checks).</li>
          <li><strong>Prisma ORM &amp; PostgreSQL:</strong> Controller executes type-safe queries or atomic <code>prisma.$transaction</code> blocks.</li>
          <li><strong>Structured HTTP Response:</strong> Controller returns an explicit HTTP status (<code>200</code>, <code>201</code>, <code>400</code>, <code>403</code>, <code>409</code>) with JSON payload: <code>{ success, message, data }</code>.</li>
          <li><strong>State Reconciliation:</strong> <code>api()</code> decrements the loading counter; React updates state, re-renders the DOM, or triggers navigation.</li>
        </ol>
      </div>

      <h2>4.2 Individual Workflow Traces</h2>

      <div class="card">
        <h3>Flow A: Direct Registration Lifecycle</h3>
        <p class="text-sm"><strong>Frontend:</strong> <code>SignupPage.jsx</code> | <strong>Backend Route:</strong> <code>POST /api/auth/register</code> | <strong>Controller:</strong> <code>auth.controller.js</code></p>
        <p class="text-sm">
          Registration is completely streamlined: User submits name, email, and password. The controller normalizes email to lowercase, checks for duplicates via <code>prisma.user.findUnique</code> (returning HTTP 409 if taken), hashes the password with <code>bcrypt.hash(password, 10)</code>, and inserts the user directly into PostgreSQL with role <code>STUDENT</code>. Upon receiving HTTP 201, the frontend redirects directly to <code>/login</code>, pre-populating the email field with a green success notification.
        </p>
      </div>

      <div class="card">
        <h3>Flow B: Quiz Attempt &amp; Automated Grading Pipeline</h3>
        <p class="text-sm"><strong>Frontend:</strong> <code>QuizzesPage.jsx</code>, <code>QuizAttemptPage.jsx</code>, <code>QuizResultPage.jsx</code> | <strong>Controller:</strong> <code>quiz.controller.js</code></p>
        <p class="text-sm">
          <strong>1. Attempt Initialization:</strong> When a student starts a quiz, the server verifies enrollment and availability windows. Crucially, the server strips <code>correctAnswer</code> and <code>explanation</code> from the question JSON returned to the client, preventing any client-side inspection cheats.
        </p>
        <p class="text-sm">
          <strong>2. Atomic Submission &amp; Grading:</strong> When submitted, the controller fetches the master questions, compares the student's selections, calculates the final score and percentage, and executes an atomic <code>prisma.$transaction</code>: marks the attempt <code>SUBMITTED</code>, deletes any orphan in-progress attempts, and persists all answers. The student is then redirected to the comprehensive Rubric Result page.
        </p>
      </div>

      <div class="card">
        <h3>Flow C: Cloudflare R2 Secure Object Storage</h3>
        <p class="text-sm"><strong>Frontend:</strong> <code>PrivateUploadsPage.jsx</code> | <strong>Controller:</strong> <code>privateFile.controller.js</code> | <strong>Config:</strong> <code>r2.js</code></p>
        <p class="text-sm">
          <strong>1. Ingestion:</strong> Multer buffers incoming files in memory with a 25MB limit and strict MIME whitelist. The controller generates a collision-free UUID storage key: <code>private/&lt;userId&gt;/&lt;UUID&gt;.&lt;ext&gt;</code>, streams it to Cloudflare R2 via <code>PutObjectCommand</code>, and records file metadata in PostgreSQL.
        </p>
        <p class="text-sm">
          <strong>2. Compensation Rollback:</strong> If the database write fails after the file reaches R2, a catch block automatically executes <code>DeleteObjectCommand</code> on R2 to prevent orphaned storage leaks.
        </p>
        <p class="text-sm">
          <strong>3. Presigned Downloads:</strong> Downloads request a temporary signed URL via <code>getSignedUrl(r2, command, { expiresIn: 60 })</code>. The link is valid for exactly 60 seconds, ensuring files remain completely private and inaccessible without authentication.
        </p>
      </div>
    </section>
`
};
