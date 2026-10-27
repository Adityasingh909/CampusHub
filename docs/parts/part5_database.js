// Part 5: Database Architecture & Prisma ORM
module.exports = {
  title: "Part 5 — Database Architecture & Prisma ORM",
  markdown: `
# Part 5 — Database Architecture & Prisma ORM

## 5.1 Complete Relational Schema & Entity Models
CampusHub LMS uses PostgreSQL as its primary transactional database, interfaced strictly through Prisma ORM v6.19.3. The schema defines 13 strongly-typed models structured around academic roles, courses, assessment engines, and private cloud asset storage.

### The 13 Core Prisma Models
1. **User:** Core identity entity. Supports \`STUDENT\`, \`TEACHER\`, and \`ADMIN\` roles. Has relations to taught courses, enrollments, assignment submissions, profile, announcements, private files, and quiz attempts.
2. **Course:** Academic unit managed by a Teacher. Features course code, credits, category, schedule, syllabus URL, and learning objectives array (\`String[]\`).
3. **Enrollment:** Join table linking Student and Course with a compound unique index \`@@unique([studentId, courseId])\`. Tracks course progress percentage and completion status.
4. **Assignment:** Faculty-created course task with deadline (\`dueDate\`), maximum points (\`totalPoints\`), and optional prompt attachment URL.
5. **AssignmentSubmission:** Student submission entity with unique constraint \`@@unique([assignmentId, studentId])\`. Stores student content, file URL, status (\`SUBMITTED\`, \`GRADED\`), score, and teacher feedback.
6. **StudentProfile:** One-to-one extension of User (\`@@unique([userId])\`). Stores bio, phone, date of birth, blood group, avatar URL, residential address, and emergency contact details.
7. **Announcement:** Course-level bulletin authored by faculty with priority flags (\`LOW\`, \`NORMAL\`, \`HIGH\`, \`URGENT\`).
8. **PrivateFolder:** User-specific directory for cloud storage organization. Enforces uniqueness per user via \`@@unique([userId, name])\`.
9. **PrivateFile:** Metadata record for objects stored in Cloudflare R2. Links to Cloudflare storageKey (unique), mimeType, size, user, and optional folder.
10. **Quiz:** Timed assessment engine entity belonging to a Course. Features duration in minutes, total marks, window start/end timestamps, and status (\`DRAFT\`, \`PUBLISHED\`, \`CLOSED\`).
11. **QuizQuestion:** Multiple-choice question belonging to a Quiz. Stores question prompt, options JSON (\`Json\` type), correct answer key, points, order, and explanation.
12. **QuizAnswer:** Student's recorded choice for a specific question within an attempt. Unique per attempt and question: \`@@unique([attemptId, questionId])\`. Tracks awarded points and correctness boolean.
13. **QuizAttempt:** An instance of a student taking a quiz. Tracks \`startedAt\`, \`submittedAt\`, status (\`IN_PROGRESS\`, \`SUBMITTED\`, \`GRADED\`, \`ABANDONED\`), final score, and percentage.

---

## 5.2 Relational Entity Relationship Diagram

\`\`\`
+-----------------------+              +-------------------------+
|         User          | 1          * |         Course          |
|-----------------------| ------------ |-------------------------|
| id (PK)               | (Teaches)    | id (PK)                 |
| email (UQ)            |              | code (UQ)               |
| password              |              | teacherId (FK -> User)  |
| role                  |              +-------------------------+
+-----------------------+                           | 1
   | 1             | 1                              |
   |               |                                | *
   | 1             | *                              +----------------------+
+--------------------+ +-------------------+        |      Assignment      |
|   StudentProfile   | |    Enrollment     |        |----------------------|
|--------------------| |-------------------|        | id (PK)              |
| id (PK)            | | id (PK)           |        | courseId (FK)        |
| userId (FK, UQ)    | | studentId (FK)    |        | dueDate              |
+--------------------+ | courseId (FK)     |        +----------------------+
                       | [student,course]UQ|           | 1
                       +-------------------+           |
                                                       | *
+----------------------+              +------------------------------+
|         Quiz         | 1          * |     AssignmentSubmission     |
|----------------------| ------------ |------------------------------|
| id (PK)              |              | id (PK)                      |
| courseId (FK)        |              | assignmentId (FK)            |
| durationMinutes      |              | studentId (FK -> User)       |
| status (DRAFT/PUB)   |              | [assignment,student] UQ      |
+----------------------+              +------------------------------+
   | 1            | 1
   |              |
   | *            | *
+--------------------+ +-------------------+
|    QuizQuestion    | |    QuizAttempt    |
|--------------------| |-------------------|
| id (PK)            | | id (PK)           |
| quizId (FK)        | | quizId (FK)       |
| options (Json)     | | studentId (FK)    |
| correctAnswer      | | status            |
+--------------------+ +-------------------+
   | 1                    | 1
   |                      |
   | *                  * |
+------------------------------+
|          QuizAnswer          |
|------------------------------|
| id (PK)                      |
| attemptId (FK)               |
| questionId (FK)              |
| selectedOption               |
| [attempt,question] UQ        |
+------------------------------+
\`\`\`

---

## 5.3 Complete Prisma Migration History (12 Migrations)
The database schema evolved through 12 incremental, production-tested Prisma migrations:

| Migration Name | Applied Purpose | Key DDL Changes |
| :--- | :--- | :--- |
| \`20261019131546_create_user\` | Initial Identity Model | Created \`User\` table with id, email (unique), password, role, createdAt. |
| \`20261019203025_add_pending_registration\` | Temporary OTP Buffer | Created \`PendingRegistration\` table with OTP hash and expiry timestamp. |
| \`20261020102822_add_course_model\` | Academic Course Catalog | Created \`Course\` table with course code (unique), title, teacherId foreign key. |
| \`20261020175730_add_course_display_fields\` | Course Metadata Expansion | Added thumbnail, credits, category, schedule, and instructorRole columns. |
| \`20261020190043_add_enrollment\` | Student-Course Relation | Created \`Enrollment\` join table with compound unique constraint \`studentId + courseId\`. |
| \`20261021113254_add_course_details\` | Rich Course Information | Added \`officeHours\`, \`syllabusUrl\`, and PostgreSQL text array \`learningObjectives\`. |
| \`20261021140045_add_lms_workflow\` | Assignment & Evaluation | Created \`Assignment\` and \`AssignmentSubmission\` with unique student submission guard. |
| \`20261024120257_add_student_profile\` | 1:1 Extended User Profile | Created \`StudentProfile\` table with demographic, avatar, and emergency contact fields. |
| \`20261024135314_add_announcements\` | Bulletin System | Created \`Announcement\` table linked to Course and User author with priority enum. |
| \`20261024202140_add_private_uploads\` | Cloudflare R2 Asset Index | Created \`PrivateFolder\` and \`PrivateFile\` tables with unique storage keys. |
| \`20261025130513_add_quizzes\` | Timed Assessment Engine | Created \`Quiz\`, \`QuizQuestion\` (with JSON options), \`QuizAnswer\`, and \`QuizAttempt\`. |
| \`20261028014000_remove_pending_registration_and_otp\` | Authentication Streamlining | Dropped \`PendingRegistration\` table, removing temporary registration buffers. |

---

## 5.4 Safe Migration Workflow & Production Discipline
### Development vs Production Migration Protocol
- **Local Development:** Developers execute \`npx prisma migrate dev --name <change_name>\`. This inspects \`schema.prisma\`, generates a timestamped SQL migration file, executes it against the local database, and regenerates \`@prisma/client\`.
- **Production CI/CD (Render):** Production deploy scripts execute strictly \`npx prisma migrate deploy\`. This command reads the \`_prisma_migrations\` tracking table, compares it against the migration files committed in source control, and applies pending migrations sequentially. It never prompts interactively and will fail safely if drift is detected.
- **Why \`prisma db push\` is Prohibited in Production:** \`db push\` syncs the schema directly without recording SQL migration files. In production, this can silently drop columns, break rollback capabilities, and create untracked schema divergence between team environments.

### Neon Connection Pooling Architecture
Neon serverless PostgreSQL utilizes PgBouncer for high-throughput connection pooling. CampusHub configures Prisma to work cleanly with serverless compute scaling:
- **Pooled Connection (\`DATABASE_URL\`):** Used for normal web application queries (port 6543 with \`pgbouncer=true\`). PgBouncer reuses existing physical connections across fast, ephemeral Express requests.
- **Direct Connection (\`DIRECT_URL\`):** Used for database migrations (port 5432). Migrations require non-pooled, direct TCP connections to safely execute DDL locks and schema transactions.
`,
  html: `
    <section class="chapter" id="part-5">
      <div class="chapter-header">
        <span class="chapter-tag">DATA ARCHITECTURE</span>
        <h1>Part 5 — Database Architecture &amp; Prisma ORM</h1>
      </div>

      <h2>5.1 Complete Relational Schema &amp; Entity Models</h2>
      <p>
        CampusHub LMS relies on <strong>PostgreSQL</strong> hosted on Neon Serverless Cloud, managed strictly through <strong>Prisma ORM v6.19.3</strong>. The database contains <strong>13 verified models</strong> designed for academic integrity, transactional reliability, and high relational efficiency.
      </p>

      <div class="table-container">
        <table class="spec-table">
          <thead>
            <tr>
              <th>Model</th>
              <th>Primary Key</th>
              <th>Foreign Keys &amp; Relations</th>
              <th>Unique Constraints &amp; Indexes</th>
              <th>Primary Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>User</strong></td>
              <td><code>id (Int)</code></td>
              <td>Taught courses, enrollments, submissions, profile, files, attempts</td>
              <td><code>email @unique</code></td>
              <td>Central identity entity with role-based permissions (STUDENT, TEACHER, ADMIN).</td>
            </tr>
            <tr>
              <td><strong>Course</strong></td>
              <td><code>id (Int)</code></td>
              <td><code>teacherId &rarr; User(id)</code> (onDelete: SetNull)</td>
              <td><code>code @unique</code>, <code>@@index([teacherId])</code></td>
              <td>Curricular unit with metadata, credits, category, schedule, and syllabus link.</td>
            </tr>
            <tr>
              <td><strong>Enrollment</strong></td>
              <td><code>id (Int)</code></td>
              <td><code>studentId &rarr; User</code>, <code>courseId &rarr; Course</code></td>
              <td><code>@@unique([studentId, courseId])</code></td>
              <td>Tracks student enrollment, academic progress (0-100%), and completion status.</td>
            </tr>
            <tr>
              <td><strong>Assignment</strong></td>
              <td><code>id (Int)</code></td>
              <td><code>courseId &rarr; Course(id)</code> (onDelete: Cascade)</td>
              <td><code>@@index([courseId, dueDate])</code></td>
              <td>Graded task with prompt, maximum points, due date, and optional attachment.</td>
            </tr>
            <tr>
              <td><strong>AssignmentSubmission</strong></td>
              <td><code>id (Int)</code></td>
              <td><code>assignmentId &rarr; Assignment</code>, <code>studentId &rarr; User</code></td>
              <td><code>@@unique([assignmentId, studentId])</code></td>
              <td>Student submission with uploaded file URL, status, score, and teacher feedback.</td>
            </tr>
            <tr>
              <td><strong>StudentProfile</strong></td>
              <td><code>id (Int)</code></td>
              <td><code>userId &rarr; User(id)</code> (onDelete: Cascade)</td>
              <td><code>userId @unique</code></td>
              <td>1:1 demographic profile (phone, DOB, blood group, avatar, emergency contacts).</td>
            </tr>
            <tr>
              <td><strong>Announcement</strong></td>
              <td><code>id (Int)</code></td>
              <td><code>courseId &rarr; Course</code>, <code>authorId &rarr; User</code></td>
              <td><code>@@index([courseId, createdAt])</code></td>
              <td>Course announcements with priority levels (LOW, NORMAL, HIGH, URGENT).</td>
            </tr>
            <tr>
              <td><strong>PrivateFolder</strong></td>
              <td><code>id (Int)</code></td>
              <td><code>userId &rarr; User(id)</code> (onDelete: Cascade)</td>
              <td><code>@@unique([userId, name])</code></td>
              <td>User-isolated organizational directories for private cloud file management.</td>
            </tr>
            <tr>
              <td><strong>PrivateFile</strong></td>
              <td><code>id (Int)</code></td>
              <td><code>userId &rarr; User</code>, <code>folderId &rarr; PrivateFolder</code></td>
              <td><code>storageKey @unique</code>, <code>@@index([userId, createdAt])</code></td>
              <td>Metadata pointer to binary objects stored in Cloudflare R2 bucket.</td>
            </tr>
            <tr>
              <td><strong>Quiz</strong></td>
              <td><code>id (Int)</code></td>
              <td><code>courseId &rarr; Course(id)</code> (onDelete: Cascade)</td>
              <td><code>@@index([courseId])</code>, <code>@@index([status])</code></td>
              <td>Timed quiz container (duration, total marks, status: DRAFT/PUBLISHED/CLOSED).</td>
            </tr>
            <tr>
              <td><strong>QuizQuestion</strong></td>
              <td><code>id (Int)</code></td>
              <td><code>quizId &rarr; Quiz(id)</code> (onDelete: Cascade)</td>
              <td><code>@@index([quizId, order])</code></td>
              <td>Multiple-choice item with JSON options array, correct answer, and points.</td>
            </tr>
            <tr>
              <td><strong>QuizAnswer</strong></td>
              <td><code>id (Int)</code></td>
              <td><code>attemptId &rarr; QuizAttempt</code>, <code>questionId &rarr; QuizQuestion</code></td>
              <td><code>@@unique([attemptId, questionId])</code></td>
              <td>Student's submitted answer per question with evaluation score and correctness.</td>
            </tr>
            <tr>
              <td><strong>QuizAttempt</strong></td>
              <td><code>id (Int)</code></td>
              <td><code>quizId &rarr; Quiz</code>, <code>studentId &rarr; User</code></td>
              <td><code>@@index([quizId, studentId])</code></td>
              <td>Timed test session tracking start time, submit time, score, and status.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>5.2 Relational Entity Relationship Diagram</h2>
      <div class="diagram-wrapper">
        <svg viewBox="0 0 880 440" class="diagram-svg" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="db-header-blue" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#1e293b" />
              <stop offset="100%" stop-color="#0f172a" />
            </linearGradient>
            <linearGradient id="db-header-indigo" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#4338ca" />
              <stop offset="100%" stop-color="#3730a3" />
            </linearGradient>
            <linearGradient id="db-header-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#059669" />
              <stop offset="100%" stop-color="#047857" />
            </linearGradient>
          </defs>

          <!-- Outer boundary -->
          <rect x="10" y="10" width="860" height="420" rx="14" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5" />

          <!-- Table: User -->
          <g transform="translate(30, 30)">
            <rect width="180" height="150" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
            <rect width="180" height="32" rx="8" fill="url(#db-header-blue)" />
            <rect y="24" width="180" height="8" fill="url(#db-header-blue)" />
            <text x="12" y="21" fill="#ffffff" font-size="12" font-weight="700">User (Identity)</text>
            <text x="12" y="52" fill="#0f172a" font-size="10" font-family="monospace">PK  id : Int</text>
            <text x="12" y="70" fill="#0f172a" font-size="10" font-family="monospace">UQ  email : String</text>
            <text x="12" y="88" fill="#64748b" font-size="10" font-family="monospace">    password : Hash</text>
            <text x="12" y="106" fill="#64748b" font-size="10" font-family="monospace">    role : Enum</text>
            <text x="12" y="124" fill="#64748b" font-size="10" font-family="monospace">    createdAt : Date</text>
          </g>

          <!-- Table: Course -->
          <g transform="translate(260, 30)">
            <rect width="180" height="150" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
            <rect width="180" height="32" rx="8" fill="url(#db-header-indigo)" />
            <rect y="24" width="180" height="8" fill="url(#db-header-indigo)" />
            <text x="12" y="21" fill="#ffffff" font-size="12" font-weight="700">Course (Academic)</text>
            <text x="12" y="52" fill="#0f172a" font-size="10" font-family="monospace">PK  id : Int</text>
            <text x="12" y="70" fill="#0f172a" font-size="10" font-family="monospace">UQ  code : String</text>
            <text x="12" y="88" fill="#64748b" font-size="10" font-family="monospace">    title : String</text>
            <text x="12" y="106" fill="#0f172a" font-size="10" font-family="monospace">FK  teacherId : Int?</text>
            <text x="12" y="124" fill="#64748b" font-size="10" font-family="monospace">    credits : Int</text>
          </g>

          <!-- Table: Enrollment -->
          <g transform="translate(145, 220)">
            <rect width="180" height="130" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
            <rect width="180" height="32" rx="8" fill="#475569" />
            <rect y="24" width="180" height="8" fill="#475569" />
            <text x="12" y="21" fill="#ffffff" font-size="12" font-weight="700">Enrollment</text>
            <text x="12" y="52" fill="#0f172a" font-size="10" font-family="monospace">PK  id : Int</text>
            <text x="12" y="70" fill="#0f172a" font-size="10" font-family="monospace">FK  studentId : Int</text>
            <text x="12" y="88" fill="#0f172a" font-size="10" font-family="monospace">FK  courseId : Int</text>
            <text x="12" y="106" fill="#64748b" font-size="10" font-family="monospace">UQ  [student,course]</text>
          </g>

          <!-- Table: Quiz -->
          <g transform="translate(490, 30)">
            <rect width="170" height="150" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
            <rect width="170" height="32" rx="8" fill="url(#db-header-emerald)" />
            <rect y="24" width="170" height="8" fill="url(#db-header-emerald)" />
            <text x="12" y="21" fill="#ffffff" font-size="12" font-weight="700">Quiz</text>
            <text x="12" y="52" fill="#0f172a" font-size="10" font-family="monospace">PK  id : Int</text>
            <text x="12" y="70" fill="#0f172a" font-size="10" font-family="monospace">FK  courseId : Int</text>
            <text x="12" y="88" fill="#64748b" font-size="10" font-family="monospace">    durationMinutes</text>
            <text x="12" y="106" fill="#64748b" font-size="10" font-family="monospace">    status : Enum</text>
            <text x="12" y="124" fill="#64748b" font-size="10" font-family="monospace">    totalMarks : Int</text>
          </g>

          <!-- Table: QuizQuestion -->
          <g transform="translate(490, 220)">
            <rect width="170" height="130" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
            <rect width="170" height="32" rx="8" fill="url(#db-header-emerald)" />
            <rect y="24" width="170" height="8" fill="url(#db-header-emerald)" />
            <text x="12" y="21" fill="#ffffff" font-size="12" font-weight="700">QuizQuestion</text>
            <text x="12" y="52" fill="#0f172a" font-size="10" font-family="monospace">PK  id : Int</text>
            <text x="12" y="70" fill="#0f172a" font-size="10" font-family="monospace">FK  quizId : Int</text>
            <text x="12" y="88" fill="#64748b" font-size="10" font-family="monospace">    options : Json</text>
            <text x="12" y="106" fill="#64748b" font-size="10" font-family="monospace">    correctAnswer</text>
          </g>

          <!-- Table: QuizAttempt -->
          <g transform="translate(690, 30)">
            <rect width="160" height="150" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
            <rect width="160" height="32" rx="8" fill="#0284c7" />
            <rect y="24" width="160" height="8" fill="#0284c7" />
            <text x="12" y="21" fill="#ffffff" font-size="12" font-weight="700">QuizAttempt</text>
            <text x="12" y="52" fill="#0f172a" font-size="10" font-family="monospace">PK  id : Int</text>
            <text x="12" y="70" fill="#0f172a" font-size="10" font-family="monospace">FK  quizId : Int</text>
            <text x="12" y="88" fill="#0f172a" font-size="10" font-family="monospace">FK  studentId : Int</text>
            <text x="12" y="106" fill="#64748b" font-size="10" font-family="monospace">    score : Int?</text>
            <text x="12" y="124" fill="#64748b" font-size="10" font-family="monospace">    status : Enum</text>
          </g>

          <!-- Table: QuizAnswer -->
          <g transform="translate(690, 220)">
            <rect width="160" height="130" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
            <rect width="160" height="32" rx="8" fill="#0284c7" />
            <rect y="24" width="160" height="8" fill="#0284c7" />
            <text x="12" y="21" fill="#ffffff" font-size="12" font-weight="700">QuizAnswer</text>
            <text x="12" y="52" fill="#0f172a" font-size="10" font-family="monospace">PK  id : Int</text>
            <text x="12" y="70" fill="#0f172a" font-size="10" font-family="monospace">FK  attemptId : Int</text>
            <text x="12" y="88" fill="#0f172a" font-size="10" font-family="monospace">FK  questionId : Int</text>
            <text x="12" y="106" fill="#64748b" font-size="10" font-family="monospace">UQ  [attempt,quest]</text>
          </g>

          <!-- Relationship Connectors -->
          <!-- User to Course -->
          <path d="M 210 80 L 260 80" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4" marker-end="url(#arrow)" />
          <!-- Course to Quiz -->
          <path d="M 440 80 L 490 80" stroke="#94a3b8" stroke-width="2" />
          <!-- Quiz to Question -->
          <path d="M 575 180 L 575 220" stroke="#94a3b8" stroke-width="2" />
          <!-- Quiz to Attempt -->
          <path d="M 660 80 L 690 80" stroke="#94a3b8" stroke-width="2" />
          <!-- Attempt to Answer -->
          <path d="M 770 180 L 770 220" stroke="#94a3b8" stroke-width="2" />
          <!-- Question to Answer -->
          <path d="M 660 280 L 690 280" stroke="#94a3b8" stroke-width="2" />
          <!-- User to Enrollment -->
          <path d="M 120 180 L 120 280 L 145 280" stroke="#94a3b8" stroke-width="2" />
          <!-- Course to Enrollment -->
          <path d="M 350 180 L 350 280 L 325 280" stroke="#94a3b8" stroke-width="2" />
        </svg>
      </div>

      <h2>5.3 Complete Prisma Migration History (12 Applied Migrations)</h2>
      <p>Every single database modification in CampusHub has been committed as a deterministic, version-controlled SQL migration under <code>Server/prisma/migrations/</code>:</p>

      <div class="table-container">
        <table class="spec-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Migration Directory</th>
              <th>Architectural Purpose &amp; Impact</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td><code>20261019131546_create_user</code></td>
              <td>Initialized core user authentication schema with role-based segregation.</td>
            </tr>
            <tr>
              <td>2</td>
              <td><code>20261019203025_add_pending_registration</code></td>
              <td>Introduced temporary OTP verification holding table (later safely removed).</td>
            </tr>
            <tr>
              <td>3</td>
              <td><code>20261020102822_add_course_model</code></td>
              <td>Created academic Course model linked to faculty instructors.</td>
            </tr>
            <tr>
              <td>4</td>
              <td><code>20261020175730_add_course_display_fields</code></td>
              <td>Added thumbnail, credit units, category, schedule, and instructor role metadata.</td>
            </tr>
            <tr>
              <td>5</td>
              <td><code>20261020190043_add_enrollment</code></td>
              <td>Introduced Enrollment join table with compound unique constraint preventing duplicate course entries.</td>
            </tr>
            <tr>
              <td>6</td>
              <td><code>20261021113254_add_course_details</code></td>
              <td>Expanded course model with office hours, syllabus links, and PostgreSQL text array for learning objectives.</td>
            </tr>
            <tr>
              <td>7</td>
              <td><code>20261021140045_add_lms_workflow</code></td>
              <td>Added Assignment and AssignmentSubmission entities supporting grading and feedback lifecycles.</td>
            </tr>
            <tr>
              <td>8</td>
              <td><code>20261024120257_add_student_profile</code></td>
              <td>Created 1:1 StudentProfile table for comprehensive demographic and avatar management.</td>
            </tr>
            <tr>
              <td>9</td>
              <td><code>20261024135314_add_announcements</code></td>
              <td>Added Announcement table supporting course-scoped notifications with priority levels.</td>
            </tr>
            <tr>
              <td>10</td>
              <td><code>20261024202140_add_private_uploads</code></td>
              <td>Created PrivateFolder and PrivateFile models indexing user objects in Cloudflare R2.</td>
            </tr>
            <tr>
              <td>11</td>
              <td><code>20261025130513_add_quizzes</code></td>
              <td>Comprehensive assessment engine migration: Quiz, QuizQuestion, QuizAnswer, and QuizAttempt tables.</td>
            </tr>
            <tr>
              <td>12</td>
              <td><code>20261028014000_remove_pending_registration_and_otp</code></td>
              <td>Completely dropped PendingRegistration table and wiped temporary OTP artifacts from the system.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>5.4 Safe Migration Workflows &amp; Serverless Discipline</h2>
      <div class="grid-2">
        <div class="card">
          <h3 class="card-title">Development: \`prisma migrate dev\`</h3>
          <p class="text-sm">In local development, developers run <code>npx prisma migrate dev</code>. This command compares <code>schema.prisma</code> against the current database state, generates a readable <code>migration.sql</code> script, applies it locally, and updates the local Prisma client types.</p>
        </div>
        <div class="card">
          <h3 class="card-title">Production CI/CD: \`prisma migrate deploy\`</h3>
          <p class="text-sm">In production (Render build lifecycle), <strong>only</strong> <code>npx prisma migrate deploy</code> is executed. It compares committed migration files against the <code>_prisma_migrations</code> tracking table and applies new migrations non-interactively without prompting or modifying schema files.</p>
        </div>
      </div>

      <div class="callout callout-warning">
        <div class="callout-title">Engineering Rule: Never Run \`prisma db push\` in Production</div>
        <div class="callout-content">
          <code>prisma db push</code> synchronizes the database directly from schema files without producing migration history. In production, this can accidentally drop tables, lose historical audit trails, and break deterministic rollbacks. Production systems must always maintain an immutable, sequential migration history.
        </div>
      </div>
    </section>
  `
};
