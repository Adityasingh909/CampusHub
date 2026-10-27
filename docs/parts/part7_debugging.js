// Part 7: 6 Real-World Debugging Case Studies
module.exports = {
  title: "Part 7 — 6 Real-World Debugging Case Studies",
  markdown: `
# Part 7 — 6 Real-World Debugging Case Studies

## Case Study 1: The Invisible Modal Bug (Prop Name Mismatch)
- **Problem & Observable Symptoms:** On the Teacher Portal Quiz Management page (\`/teacher/quizzes\`), clicking "Create Quiz", "Add Question", or "Quiz Settings" triggered click events and state updates, but no dialog or form appeared on screen. No console errors were thrown.
- **Root Cause Analysis:** The shared \`Modal.jsx\` component was written to expect \`isOpen\` as its control boolean (\`if (!isOpen) return null;\`). However, the calling quiz pages passed \`<Modal open={isModalOpen} ... />\`. Because \`isOpen\` was \`undefined\`, the modal component strictly evaluated \`!undefined === true\` and rendered \`null\` every single time.
- **Investigation Steps:**
  1. Inspected browser React DevTools component tree: verified state \`isCreateOpen = true\` was toggling correctly on button click.
  2. Inspected \`Modal.jsx\` source code: discovered \`const Modal = ({ isOpen, onClose, title, children }) => ...\`.
  3. Checked parent call site: discovered \`<Modal open={isCreateOpen}>\`. The prop name did not match.
- **Solution & Code Changes:** Standardized \`Modal.jsx\` to defensively support both prop variants:
  \`\`\`jsx
  // Modal.jsx Defensive Prop Fallback
  const Modal = ({ isOpen, open, onClose, title, children }) => {
    const isVisible = isOpen !== undefined ? isOpen : open;
    if (!isVisible) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        {/* Modal content */}
      </div>
    );
  };
  \`\`\`
- **Why It Worked:** By providing a fallback (\`isOpen !== undefined ? isOpen : open\`), the modal functions identically whether the consumer passes \`open\` or \`isOpen\`, eliminating silent render suppression.
- **Lessons Learned:** Always establish consistent naming conventions across reusable component libraries. In TypeScript or React prop validation, missing or mismatched prop names are flagged at compile time; in plain JavaScript, defensive prop resolution prevents silent UI failures.

---

## Case Study 2: The Race Condition Double-Attempt Bug in React 18 StrictMode
- **Problem & Observable Symptoms:** When students initiated a quiz, the quiz status would immediately show "IN_PROGRESS" or duplicate attempt entries in PostgreSQL timestamped within 1 to 3 milliseconds of each other. Submitting answers sometimes failed or threw constraint violations.
- **Root Cause Analysis:** React 18 StrictMode in development intentionally mounts, unmounts, and re-mounts components in rapid succession to detect side-effect leaks. The quiz start logic in \`useEffect\` fired two concurrent \`POST /api/quizzes/:id/start\` requests. Both requests passed the check \`findFirst({ where: { status: 'IN_PROGRESS' } })\` simultaneously because neither had finished writing to PostgreSQL yet, resulting in two duplicate attempts.
- **Investigation Steps:**
  1. Inspected PostgreSQL query logs: observed two consecutive \`INSERT INTO "QuizAttempt"\` records for the same \`studentId\` and \`quizId\` separated by 2ms.
  2. Inspected React lifecycle: noted \`useEffect(() => { startQuiz(); }, [])\` was firing twice due to React.StrictMode.
  3. Identified race condition window: between reading current attempt status and creating a new attempt, an asynchronous gap existed.
- **Solution & Code Changes:** Implemented a three-tiered defense:
  1. **Frontend Ref Guard:** Added \`const initiatingRef = useRef(false)\` in the component to block duplicate trigger events during the same render cycle.
  2. **Backend Concurrency Check:** Handled existing \`IN_PROGRESS\` attempts gracefully by returning the active attempt rather than creating a new one.
  3. **Atomic Attempt Cleanup:** If a student already has an unfinished attempt, the backend cleans up orphaned zero-answer attempts or reuses the valid open session.
- **Why It Worked:** \`initiatingRef\` prevents the browser from dispatching duplicate concurrent network calls, and the backend idempotency logic guarantees that starting an in-progress quiz returns the existing attempt rather than inserting a duplicate record.
- **Lessons Learned:** React 18 StrictMode will expose real-world concurrency flaws that also happen when real users double-click buttons or experience network retries. All state-mutating APIs must be designed to be **idempotent**.

---

## Case Study 3: The Prisma Configuration & VS Code Extension Conflict
- **Problem & Observable Symptoms:** Running \`npx prisma validate\` or editing \`Server/prisma/schema.prisma\` caused VS Code to flag \`url = env("DATABASE_URL")\` with a red squiggly error: *"The datasource block does not accept a 'url' property in Prisma 7"*. However, running \`npx prisma --version\` reported Prisma 6.19.3.
- **Root Cause Analysis:** VS Code's Prisma extension auto-updated to version v31.13.0+, which bundled the Prisma 7 Language Server by default. Prisma 7 introduces a new configuration model where datasource URLs move to \`prisma.config.ts\`. The extension was evaluating a Prisma 6 project using Prisma 7 syntax rules, creating a version mismatch between the editor and the CLI.
- **Investigation Steps:**
  1. Verified package versions in \`Server/package.json\`: \`prisma: ^6.19.3\`, \`@prisma/client: ^6.19.3\`.
  2. Verified CLI behavior: \`npx prisma validate\` succeeded in terminal, but VS Code editor displayed persistent errors.
  3. Investigated Prisma extension release notes: found newly introduced setting \`"prisma.pinToPrisma6"\`.
- **Solution & Code Changes:** Configured \`.vscode/settings.json\` to pin the language server to version 6:
  \`\`\`json
  {
    "prisma.pinToPrisma6": true,
    "[prisma]": {
      "editor.defaultFormatter": "Prisma.prisma"
    }
  }
  \`\`\`
- **Why It Worked:** Pinning the extension explicitly forces the VS Code Language Server to validate schema files using Prisma 6 specification rules, restoring full syntax highlighting and eliminating false deprecation errors.
- **Lessons Learned:** Developer tooling and IDE extensions can evolve independently of project dependencies. Explicit workspace configuration (\`.vscode/settings.json\`) guarantees identical developer environments across team members.

---

## Case Study 4: Shell Environment Sourcing Failures with Whitespace in \`.env\`
- **Problem & Observable Symptoms:** The Express server crashed on startup with \`Error: listen EADDRINUSE\` or defaulted to port 5000 despite having \`PORT = 2000\` declared in \`.env\`. In other runs, environment variables evaluated to \`undefined\`.
- **Root Cause Analysis:** The \`.env\` file contained spaces around the assignment operator (\`PORT = 2000\` instead of \`PORT=2000\`). Standard POSIX shell parsers and specific versions of \`dotenv\` do not parse keys with spaces correctly, either capturing the trailing space as part of the key name (\`"PORT "\`) or ignoring the line entirely.
- **Investigation Steps:**
  1. Ran \`node -e "require('dotenv').config(); console.log(process.env.PORT);"\` &rarr; returned \`undefined\`.
  2. Inspected \`.env\` with hex/whitespace view: observed spaces flanking the \`=\` operator.
- **Solution & Code Changes:** Sanitized the entire \`.env\` file to strictly adhere to POSIX key-value syntax:
  \`\`\`env
  PORT=2000
  DATABASE_URL="postgresql://user:pass@ep-cool-db.us-east-2.aws.neon.tech/campushub?sslmode=require"
  JWT_SECRET="super-secure-production-secret-key-256"
  \`\`\`
- **Why It Worked:** Removing whitespace around \`=\` ensures universal compatibility across \`dotenv\`, Docker, systemd, bash/zsh shell sourcing, and cloud PaaS runners (Render, Vercel).
- **Lessons Learned:** Environment variable configuration files must follow strict formatting standards. Never place spaces around the equals sign in \`.env\` files.

---

## Case Study 5: S3/R2 Blob Orphan Prevention via Compensation Rollbacks
- **Problem & Observable Symptoms:** If a network timeout or database constraint error occurred while saving file metadata to PostgreSQL after a user uploaded an assignment or personal document, the file remained stranded in Cloudflare R2 indefinitely. Over time, storage costs would rise with orphaned blobs that no database record referenced.
- **Root Cause Analysis:** Uploading a file involves a two-phase operation across two independent cloud systems:
  1. Send binary bytes to Cloudflare R2 via \`PutObjectCommand\`.
  2. Insert metadata record in PostgreSQL via \`prisma.privateFile.create()\`.
  If Step 2 throws a foreign key error or timeout, Step 1 has already succeeded, leaving an orphaned object in the bucket.
- **Investigation Steps:**
  1. Simulated database failure by injecting an invalid foreign key during file upload.
  2. Inspected R2 bucket: verified that the object was written to storage even though the API returned a 500 error to the client.
- **Solution & Code Changes:** Implemented a **Compensating Transaction (Saga pattern)** in the storage controller:
  \`\`\`javascript
  // fileController.js - Compensating Rollback Pattern
  let uploadedStorageKey = null;
  try {
    const uploadResult = await uploadToR2(file.buffer, storageKey, file.mimetype);
    uploadedStorageKey = storageKey;

    // Phase 2: Database Metadata Record
    const record = await prisma.privateFile.create({
      data: { storageKey, originalName: file.originalname, size: file.size, mimeType: file.mimetype, userId }
    });
    return res.status(201).json({ success: true, file: record });
  } catch (error) {
    // Compensation Phase: If DB fails, rollback the R2 upload immediately
    if (uploadedStorageKey) {
      await deleteFromR2(uploadedStorageKey).catch(cleanupErr => {
        console.error("Critical: Failed to rollback orphan R2 blob:", cleanupErr);
      });
    }
    return res.status(500).json({ error: "File upload failed. Storage rolled back." });
  }
  \`\`\`
- **Why It Worked:** Wrapping the two-phase write in a \`try...catch\` block with an automated rollback guarantees eventual consistency: if PostgreSQL fails, R2 is cleaned up immediately, preventing ghost blobs.
- **Lessons Learned:** When coordinating operations across distributed cloud services that cannot share a single database transaction, always implement compensating actions to undo partial progress upon failure.

---

## Case Study 6: Vercel Deployment Serving Stale Frontend Due to Git State
- **Problem & Observable Symptoms:** After fixing critical quiz API endpoints and pushing changes, the live Vercel production frontend (\`campus-hub-delta-sooty.vercel.app\`) continued to show old UI screens and call outdated endpoints.
- **Root Cause Analysis:** The local git working directory contained unstaged changes in \`Client/lms-frontend/src\`. Only backend files had been committed and pushed to GitHub. Because Vercel triggers automated builds solely based on commits pushed to the linked GitHub branch, Vercel had not rebuilt the frontend.
- **Investigation Steps:**
  1. Inspected Vercel deployment logs: noted the last build commit hash was 3 commits behind current work.
  2. Ran \`git status\` locally: discovered multiple modified files in \`Client/\` that were never staged (\`git add\`) or committed.
- **Solution & Code Changes:**
  1. Staged and committed all frontend changes: \`git add Client/ && git commit -m "fix(frontend): update quiz submission workflows"\`.
  2. Pushed to remote: \`git push origin main\`.
  3. Monitored Vercel build dashboard until the new commit deployed successfully with status \`Ready\`.
- **Why It Worked:** Pushing the updated frontend commit triggered Vercel's automated CI/CD pipeline, building the Vite bundle from clean source and invalidating edge CDN cache.
- **Lessons Learned:** Always verify \`git status\` across monorepo/polyrepo workspaces before verifying cloud deployments. Automation only deploys what is committed and pushed.
`,
  html: `
    <section class="chapter" id="part-7">
      <div class="chapter-header">
        <span class="chapter-tag">SYSTEMS DEBUGGING</span>
        <h1>Part 7 — 6 Real-World Debugging Case Studies</h1>
      </div>

      <p class="lead">
        True senior engineering competence is forged during debugging. The following six case studies document real architectural challenges encountered, investigated, and permanently resolved during the development of CampusHub LMS.
      </p>

      <!-- Case 1 -->
      <div class="card" style="margin-bottom: 24px;">
        <span class="badge badge-purple">CASE STUDY 1</span>
        <h3 class="card-title" style="margin-top: 8px;">The Invisible Modal Bug (Prop Name Mismatch)</h3>
        <p class="text-sm"><strong>Observable Symptom:</strong> Clicking "Create Quiz", "Add Question", or "Quiz Settings" on <code>/teacher/quizzes</code> triggered state updates, but the modal dialog never appeared on screen. No console errors were generated.</p>
        <p class="text-sm"><strong>Root Cause:</strong> <code>Modal.jsx</code> expected <code>isOpen</code>, but the calling parent page passed <code>open={isCreateOpen}</code>. Because <code>isOpen</code> was <code>undefined</code>, the modal silently rendered <code>null</code>.</p>
        <div class="callout callout-info" style="margin: 12px 0;">
          <div class="callout-title">The Engineering Fix</div>
          <div class="callout-content">
            Updated <code>Modal.jsx</code> with a defensive fallback: <code>const isVisible = isOpen !== undefined ? isOpen : open; if (!isVisible) return null;</code>. This resolved all modal invocations across the portal instantly.
          </div>
        </div>
      </div>

      <!-- Case 2 -->
      <div class="card" style="margin-bottom: 24px;">
        <span class="badge badge-purple">CASE STUDY 2</span>
        <h3 class="card-title" style="margin-top: 8px;">The Race Condition Double-Attempt Bug in React 18 StrictMode</h3>
        <p class="text-sm"><strong>Observable Symptom:</strong> Starting a quiz generated two duplicate <code>QuizAttempt</code> records in PostgreSQL timestamped 1 to 3ms apart, leaving students stuck in an invalid state.</p>
        <p class="text-sm"><strong>Root Cause:</strong> React 18 StrictMode double-mounts components in development. Two concurrent <code>POST /api/quizzes/:id/start</code> requests executed simultaneously before either had written to PostgreSQL.</p>
        <div class="callout callout-info" style="margin: 12px 0;">
          <div class="callout-title">The Engineering Fix</div>
          <div class="callout-content">
            Implemented a three-layer defense: (1) Added <code>initiatingRef = useRef(false)</code> on the frontend to block multi-execution, (2) Made the backend start endpoint idempotent by returning existing in-progress attempts, and (3) Added an atomic transaction cleaning up zero-answer orphaned attempts.
          </div>
        </div>
      </div>

      <!-- Case 3 -->
      <div class="card" style="margin-bottom: 24px;">
        <span class="badge badge-purple">CASE STUDY 3</span>
        <h3 class="card-title" style="margin-top: 8px;">Prisma 6 vs Prisma 7 VS Code Extension Conflict</h3>
        <p class="text-sm"><strong>Observable Symptom:</strong> VS Code editor highlighted <code>url = env("DATABASE_URL")</code> with errors stating <code>url</code> is no longer supported in Prisma 7, even though the project installed Prisma 6.19.3.</p>
        <p class="text-sm"><strong>Root Cause:</strong> VS Code's Prisma extension auto-updated to v31.13.0+, running the Prisma 7 Language Server which enforced unreleased Prisma 7 configuration rules on a Prisma 6 project.</p>
        <div class="callout callout-info" style="margin: 12px 0;">
          <div class="callout-title">The Engineering Fix</div>
          <div class="callout-content">
            Added <code>"prisma.pinToPrisma6": true</code> in <code>.vscode/settings.json</code>, forcing the editor language server to respect Prisma 6 syntax rules.
          </div>
        </div>
      </div>

      <!-- Case 4 -->
      <div class="card" style="margin-bottom: 24px;">
        <span class="badge badge-purple">CASE STUDY 4</span>
        <h3 class="card-title" style="margin-top: 8px;">Shell Environment Sourcing Failures with Whitespace in .env</h3>
        <p class="text-sm"><strong>Observable Symptom:</strong> Express server defaulted to fallback ports or failed to connect to Neon database because environment variables evaluated to <code>undefined</code>.</p>
        <p class="text-sm"><strong>Root Cause:</strong> Spaces around the equals sign (<code>PORT = 2000</code>) violated POSIX shell key-value parsing, causing <code>dotenv</code> to misidentify variable names.</p>
        <div class="callout callout-info" style="margin: 12px 0;">
          <div class="callout-title">The Engineering Fix</div>
          <div class="callout-content">
            Sanitized all environment variable declarations to strict POSIX <code>KEY=VALUE</code> syntax with zero whitespace surrounding the equals operator.
          </div>
        </div>
      </div>

      <!-- Case 5 -->
      <div class="card" style="margin-bottom: 24px;">
        <span class="badge badge-purple">CASE STUDY 5</span>
        <h3 class="card-title" style="margin-top: 8px;">S3/R2 Blob Orphan Prevention via Compensating Transactions</h3>
        <p class="text-sm"><strong>Observable Symptom:</strong> When database writes failed after an S3/R2 upload, binary objects remained stranded in Cloudflare R2 indefinitely with no database reference.</p>
        <p class="text-sm"><strong>Root Cause:</strong> Distributed two-phase write across independent cloud services without automated compensation logic.</p>
        <div class="callout callout-info" style="margin: 12px 0;">
          <div class="callout-title">The Engineering Fix</div>
          <div class="callout-content">
            Implemented the <strong>Compensating Transaction Pattern (Saga)</strong>: if PostgreSQL metadata creation throws any error, the controller immediately executes <code>DeleteObjectCommand</code> to delete the R2 object before returning a 500 status.
          </div>
        </div>
      </div>

      <!-- Case 6 -->
      <div class="card" style="margin-bottom: 24px;">
        <span class="badge badge-purple">CASE STUDY 6</span>
        <h3 class="card-title" style="margin-top: 8px;">Vercel Stale Deployment Due to Uncommitted Git State</h3>
        <p class="text-sm"><strong>Observable Symptom:</strong> Production URL on Vercel displayed outdated UI components and called deprecated endpoints after code edits were supposedly completed.</p>
        <p class="text-sm"><strong>Root Cause:</strong> Frontend modifications were left unstaged in the local git repository; only backend commits had been pushed to GitHub.</p>
        <div class="callout callout-info" style="margin: 12px 0;">
          <div class="callout-title">The Engineering Fix</div>
          <div class="callout-content">
            Standardized release checklist: run <code>git status</code> across both directories, stage frontend and backend changes cohesively, push to GitHub, and verify Vercel build status dashboard.
          </div>
        </div>
      </div>
    </section>
  `
};
