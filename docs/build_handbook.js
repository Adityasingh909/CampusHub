const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const DOCS_DIR = "/Users/adityasingh/Code Playground/LMS/docs";
const PARTS_DIR = path.join(DOCS_DIR, "parts");

// 1. Require all 13 parts
const part1 = require(path.join(PARTS_DIR, "part1_overview.js"));
const part2 = require(path.join(PARTS_DIR, "part2_structure.js"));
const part3 = require(path.join(PARTS_DIR, "part3_techstack.js"));
const part4 = require(path.join(PARTS_DIR, "part4_lifecycle.js"));
const part5 = require(path.join(PARTS_DIR, "part5_database.js"));
const part6 = require(path.join(PARTS_DIR, "part6_otp.js"));
const part7 = require(path.join(PARTS_DIR, "part7_debugging.js"));
const part8 = require(path.join(PARTS_DIR, "part8_learning.js"));
const part9 = require(path.join(PARTS_DIR, "part9_interview.js"));
const part10 = require(path.join(PARTS_DIR, "part10_roadmap.js"));
const part11 = require(path.join(PARTS_DIR, "part11_backlog.js"));
const part12 = require(path.join(PARTS_DIR, "part12_cheatsheet.js"));
const part13 = require(path.join(PARTS_DIR, "part13_glossary.js"));

const parts = [
  part1, part2, part3, part4, part5, part6,
  part7, part8, part9, part10, part11, part12, part13
];

console.log(`Loaded ${parts.length} handbook parts successfully.`);

// 2. Build Markdown Document
let fullMarkdown = `# CampusHub LMS — Complete Personal Engineering Handbook & Revision Guide
**Author:** Aditya Singh  
**Architecture:** React 19 (Vercel) + Express 5 (Render) + PostgreSQL (Neon) + Prisma 6 + Cloudflare R2  
**Edition:** Production Release v2.0 • October 2026  

---

## Table of Contents
1. [Part 1 — Executive Overview & System Architecture](#part-1--executive-overview--system-architecture)
2. [Part 2 — Codebase Directory & Component Mapping](#part-2--codebase-directory--component-mapping)
3. [Part 3 — Technology Stack Deep Dive](#part-3--technology-stack-deep-dive)
4. [Part 4 — End-to-End Request Lifecycles](#part-4--end-to-end-request-lifecycles)
5. [Part 5 — Database Architecture & Prisma ORM](#part-5--database-architecture--prisma-orm)
6. [Part 6 — Authentication System & Email OTP Removal Post-Mortem](#part-6--authentication-system--email-otp-removal-post-mortem)
7. [Part 7 — 6 Real-World Debugging Case Studies](#part-7--6-real-world-debugging-case-studies)
8. [Part 8 — Learning Progression & Personal Skills Audit](#part-8--learning-progression--personal-skills-audit)
9. [Part 9 — Complete Interview Preparation Kit](#part-9--complete-interview-preparation-kit)
10. [Part 10 — Structured 4-Week Full-Stack Mastery Roadmap](#part-10--structured-4-week-full-stack-mastery-roadmap)
11. [Part 11 — Engineering Backlog & Next Features](#part-11--engineering-backlog--next-features)
12. [Part 12 — 1-Page Revision Cheat Sheet](#part-12--1-page-revision-cheat-sheet)
13. [Part 13 — Technical Glossary & Project File Index](#part-13--technical-glossary--project-file-index)

---
`;

parts.forEach(p => {
  fullMarkdown += `\n\n---\n\n${p.markdown.trim()}\n`;
});

const mdPath = path.join(DOCS_DIR, "CampusHub_Personal_Project_Handbook.md");
fs.writeFileSync(mdPath, fullMarkdown, "utf8");
console.log(`Wrote Markdown handbook: ${mdPath} (${Math.round(fullMarkdown.length / 1024)} KB)`);

// 3. Build HTML Document with Professional Print CSS
const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CampusHub LMS — Personal Engineering Handbook</title>
  <style>
    /* CSS Reset & Core Styling */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background-color: #ffffff;
      line-height: 1.6;
      font-size: 13.5px;
      -webkit-font-smoothing: antialiased;
    }

    /* Print & Page Specifications */
    @page {
      size: A4;
      margin: 18mm 16mm 18mm 16mm;
      @bottom-right {
        content: counter(page);
        font-size: 9px;
        color: #94a3b8;
        font-family: monospace;
      }
      @bottom-left {
        content: "CampusHub LMS • Personal Engineering Handbook";
        font-size: 9px;
        color: #94a3b8;
      }
    }

    @media print {
      body {
        background: #ffffff;
        font-size: 11pt;
      }
      .page-break {
        page-break-before: always;
      }
      .no-break {
        page-break-inside: avoid;
      }
      .card, .callout, .diagram-wrapper, .table-container, pre {
        page-break-inside: avoid;
      }
      h2, h3 {
        page-break-after: avoid;
      }
    }

    /* Container */
    .document-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 24px;
    }

    /* Cover Page */
    .cover-page {
      min-height: 92vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 60px 40px;
      background: linear-gradient(145deg, #0f172a 0%, #1e293b 60%, #090d16 100%);
      color: #ffffff;
      border-radius: 16px;
      margin-bottom: 40px;
      box-shadow: 0 20px 40px rgba(15, 23, 42, 0.25);
    }

    .cover-badge-row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .cover-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #93c5fd;
    }

    .cover-main {
      margin: 60px 0;
    }

    .cover-title {
      font-size: 42px;
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.15;
      color: #ffffff;
      margin-bottom: 16px;
    }

    .cover-title span {
      background: linear-gradient(90deg, #38bdf8, #818cf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .cover-subtitle {
      font-size: 18px;
      color: #cbd5e1;
      max-width: 680px;
      line-height: 1.5;
      font-weight: 400;
    }

    .cover-footer {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      padding-top: 24px;
    }

    .cover-meta-item h4 {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #94a3b8;
      margin-bottom: 4px;
    }

    .cover-meta-item p {
      font-size: 13px;
      color: #f1f5f9;
      font-weight: 600;
    }

    /* Table of Contents */
    .toc-container {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 32px;
      margin-bottom: 48px;
    }

    .toc-title {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 20px;
      border-bottom: 2px solid #cbd5e1;
      padding-bottom: 8px;
    }

    .toc-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 32px;
    }

    .toc-item {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 12.5px;
      color: #334155;
      text-decoration: none;
      padding: 4px 0;
      border-bottom: 1px dotted #cbd5e1;
    }

    .toc-item:hover {
      color: #2563eb;
    }

    .toc-part-num {
      font-weight: 700;
      color: #4f46e5;
      margin-right: 6px;
    }

    /* Chapter Header */
    .chapter {
      margin-bottom: 56px;
    }

    .chapter-header {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 14px;
      margin-bottom: 24px;
      margin-top: 24px;
    }

    .chapter-tag {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: #4f46e5;
      text-transform: uppercase;
      display: block;
      margin-bottom: 4px;
    }

    h1 {
      font-size: 26px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
      line-height: 1.25;
    }

    h2 {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
      margin: 28px 0 12px 0;
      letter-spacing: -0.01em;
    }

    h3 {
      font-size: 15px;
      font-weight: 700;
      color: #334155;
      margin: 20px 0 8px 0;
    }

    p {
      margin-bottom: 12px;
      color: #334155;
    }

    .lead {
      font-size: 14.5px;
      color: #475569;
      margin-bottom: 16px;
    }

    /* Cards & Grids */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin: 16px 0;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin: 16px 0;
    }

    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px 18px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }

    .card-title {
      font-size: 13.5px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 6px;
    }

    .text-sm {
      font-size: 12px;
      color: #475569;
      line-height: 1.5;
    }

    .text-red { color: #dc2626; }
    .text-emerald { color: #059669; }

    /* Tables */
    .table-container {
      margin: 18px 0;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }

    table.spec-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      text-align: left;
    }

    table.spec-table th {
      background: #f1f5f9;
      color: #1e293b;
      font-weight: 700;
      padding: 10px 12px;
      border-bottom: 1px solid #cbd5e1;
    }

    table.spec-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
      vertical-align: top;
    }

    table.spec-table tr:last-child td {
      border-bottom: none;
    }

    table.spec-table tr:nth-child(even) td {
      background-color: #fafbfc;
    }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .badge-blue { background: #e0f2fe; color: #0369a1; }
    .badge-emerald { background: #d1fae5; color: #065f46; }
    .badge-purple { background: #ede9fe; color: #5b21b6; }
    .badge-orange { background: #ffedd5; color: #9a3412; }
    .badge-red { background: #fee2e2; color: #991b1b; }

    /* Callouts */
    .callout {
      border-left: 4px solid;
      border-radius: 0 8px 8px 0;
      padding: 14px 18px;
      margin: 18px 0;
      font-size: 12.5px;
    }

    .callout-info {
      background: #f0f9ff;
      border-color: #0284c7;
      color: #0c4a6e;
    }

    .callout-warning {
      background: #fffbeb;
      border-color: #d97706;
      color: #78350f;
    }

    .callout-title {
      font-weight: 700;
      margin-bottom: 4px;
      font-size: 13px;
    }

    /* Code & Pre */
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11.5px;
      background: #f1f5f9;
      color: #0f172a;
      padding: 2px 5px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }

    pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
      line-height: 1.5;
      margin: 16px 0;
      border: 1px solid #1e293b;
    }

    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
      border: none;
      font-size: inherit;
    }

    /* Diagram SVG */
    .diagram-wrapper {
      margin: 20px 0;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      justify-content: center;
    }

    .diagram-svg {
      width: 100%;
      max-width: 860px;
      height: auto;
    }

    /* Lists */
    ul, ol {
      margin: 8px 0 16px 20px;
      color: #334155;
    }

    li {
      margin-bottom: 4px;
    }
  </style>
</head>
<body>
  <div class="document-container">
    
    <!-- COVER PAGE -->
    <div class="cover-page">
      <div class="cover-badge-row">
        <span class="cover-badge">Full-Stack Architecture</span>
        <span class="cover-badge">Personal Revision Handbook</span>
        <span class="cover-badge">Production v2.0</span>
      </div>

      <div class="cover-main">
        <h1 class="cover-title">CampusHub <span>LMS</span></h1>
        <p class="cover-subtitle">
          Comprehensive Technical Documentation, Systems Architecture Blueprints, End-to-End Request Lifecycles, and Senior Interview Revision Handbook.
        </p>
      </div>

      <div class="cover-footer">
        <div class="cover-meta-item">
          <h4>Author &amp; Architect</h4>
          <p>Aditya Singh</p>
        </div>
        <div class="cover-meta-item">
          <h4>Core Stack</h4>
          <p>React 19 • Express 5 • PostgreSQL • Prisma 6</p>
        </div>
        <div class="cover-meta-item">
          <h4>Deployments</h4>
          <p>Vercel Edge • Render • Neon Serverless • Cloudflare R2</p>
        </div>
      </div>
    </div>

    <div class="page-break"></div>

    <!-- TABLE OF CONTENTS -->
    <div class="toc-container">
      <div class="toc-title">Handbook Table of Contents</div>
      <div class="toc-grid">
        <a class="toc-item" href="#part-1"><span class="toc-part-num">Part 1</span> Executive Overview &amp; Architecture</a>
        <a class="toc-item" href="#part-2"><span class="toc-part-num">Part 2</span> Codebase Directory &amp; Component Map</a>
        <a class="toc-item" href="#part-3"><span class="toc-part-num">Part 3</span> Technology Stack Deep Dive</a>
        <a class="toc-item" href="#part-4"><span class="toc-part-num">Part 4</span> End-to-End Request Lifecycles</a>
        <a class="toc-item" href="#part-5"><span class="toc-part-num">Part 5</span> Database Architecture &amp; Prisma ORM</a>
        <a class="toc-item" href="#part-6"><span class="toc-part-num">Part 6</span> Identity &amp; OTP Removal Post-Mortem</a>
        <a class="toc-item" href="#part-7"><span class="toc-part-num">Part 7</span> 6 Real-World Debugging Case Studies</a>
        <a class="toc-item" href="#part-8"><span class="toc-part-num">Part 8</span> Learning Progression &amp; Skills Audit</a>
        <a class="toc-item" href="#part-9"><span class="toc-part-num">Part 9</span> Complete Interview Preparation Kit</a>
        <a class="toc-item" href="#part-10"><span class="toc-part-num">Part 10</span> 4-Week Full-Stack Mastery Roadmap</a>
        <a class="toc-item" href="#part-11"><span class="toc-part-num">Part 11</span> Engineering Backlog &amp; Next Features</a>
        <a class="toc-item" href="#part-12"><span class="toc-part-num">Part 12</span> 1-Page Revision Cheat Sheet</a>
        <a class="toc-item" href="#part-13"><span class="toc-part-num">Part 13</span> Technical Glossary &amp; Project Index</a>
      </div>
    </div>

    <!-- CHAPTER CONTENTS -->
    ${parts.map((p, idx) => `
      <div class="page-break"></div>
      ${p.html}
    `).join("\n")}

  </div>
</body>
</html>`;

const htmlPath = path.join(DOCS_DIR, "handbook.html");
fs.writeFileSync(htmlPath, htmlTemplate, "utf8");
console.log(`Wrote HTML handbook: ${htmlPath} (${Math.round(htmlTemplate.length / 1024)} KB)`);

// 4. Compile PDF with Headless Chrome
const pdfPath = path.join(DOCS_DIR, "CampusHub_Personal_Project_Handbook.pdf");
console.log(`Compiling PDF via Headless Chrome to: ${pdfPath}...`);

const chromeCmd = `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --print-to-pdf="${pdfPath}" --no-pdf-header-footer "${htmlPath}"`;

try {
  const result = execSync(chromeCmd, { stdio: "pipe" });
  console.log("Chrome execution completed successfully.");
} catch (err) {
  console.error("Chrome execution error:", err.message);
  if (err.stderr) console.error("stderr:", err.stderr.toString());
}

if (fs.existsSync(pdfPath)) {
  const stats = fs.statSync(pdfPath);
  console.log(`SUCCESS! Generated PDF: ${pdfPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
} else {
  console.error("FAILED! PDF file was not created.");
}
