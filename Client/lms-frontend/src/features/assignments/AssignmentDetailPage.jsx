import { useState, useMemo, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  UploadCloud,
  FileText,
  FileCheck2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Check,
  Loader2,
} from "lucide-react";
import {
  assignmentsData,
  coursesData,
  getSavedSubmissions,
  saveSubmissionToStorage,
} from "../../data/mockLmsData";
import { Badge } from "../../components/ui/Badge";
import { useToast } from "../../hooks/useToast";

export function AssignmentDetailPage() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const savedRecord = useMemo(() => {
    return getSavedSubmissions()[assignmentId];
  }, [assignmentId]);

  // Retrieve assignment
  const assignment = useMemo(() => {
    return assignmentsData.find((a) => a.id === assignmentId);
  }, [assignmentId]);

  // Retrieve course details for teacher info
  const course = useMemo(() => {
    if (!assignment) return null;
    return coursesData.find((c) => c.id === assignment.courseId || c.code === assignment.courseCode);
  }, [assignment]);

  // State
  const [files, setFiles] = useState(() => {
    if (savedRecord?.file) return [savedRecord.file];
    if (assignment?.submittedFile) return [assignment.submittedFile];
    return [
      {
        name: `${assignment?.courseCode || "CS301"}_Assignment_Report.pdf`,
        size: "1.4 MB",
        uploadedAt: "Ready for submission",
      },
    ];
  });
  const [honorCode, setHonorCode] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(() => {
    return Boolean(
      savedRecord || assignment?.status === "Submitted" || assignment?.status === "Graded"
    );
  });
  const [dragActive, setDragActive] = useState(false);

  if (!assignment) {
    return (
      <div className="rounded-2xl border border-line bg-white p-12 text-center shadow-card flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-orange/10 text-orange flex items-center justify-center mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="font-display text-2xl font-bold text-ink">Assignment Not Found</h2>
        <p className="text-sm text-muted max-w-md mt-2">
          The assignment with identifier &quot;{assignmentId}&quot; does not exist in your academic registry.
        </p>
        <button
          type="button"
          onClick={() => navigate("/student/assignments")}
          className="mt-6 px-5 py-2.5 rounded-xl bg-navy text-white text-sm font-semibold hover:bg-navy-hover transition flex items-center gap-2 shadow-sm"
        >
          <ArrowLeft size={16} />
          <span>Back to Assignments</span>
        </button>
      </div>
    );
  }

  function handleFileSelect(e) {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFiles = Array.from(selectedFiles).map((f) => ({
      name: f.name,
      size: (f.size / (1024 * 1024)).toFixed(2) + " MB",
      uploadedAt: "Just now",
    }));

    setFiles((prev) => [...prev, ...newFiles]);
    toast.show(`${selectedFiles.length} file(s) attached successfully`, "info");
  }

  function handleDragOver(e) {
    e.preventDefault();
    setDragActive(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setDragActive(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles || droppedFiles.length === 0) return;

    const newFiles = Array.from(droppedFiles).map((f) => ({
      name: f.name,
      size: (f.size / (1024 * 1024)).toFixed(2) + " MB",
      uploadedAt: "Just now",
    }));

    setFiles((prev) => [...prev, ...newFiles]);
    toast.show(`${droppedFiles.length} file(s) attached via drag and drop`, "info");
  }

  function handleRemoveFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    toast.show("File removed from staging", "info");
  }

  function handleSubmitAssignment() {
    if (files.length === 0) {
      toast.show("Please attach at least one solution file before submitting.", "error");
      return;
    }
    if (!honorCode) {
      toast.show("Please confirm the academic honor code declaration.", "warning");
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      saveSubmissionToStorage(assignment.id, {
        file: files[0] || {
          name: `${assignment.courseCode}_Submission.pdf`,
          size: "1.4 MB",
          uploadedAt: "Just now",
        },
      });
      setSubmitting(false);
      setSubmissionComplete(true);
      toast.show("Assignment submitted successfully to CampusHub!", "success");
    }, 900);
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-8 max-w-5xl mx-auto">
      {/* Top Breadcrumbs & Back Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted">
          <Link
            to="/student/assignments"
            className="hover:text-navy transition-colors flex items-center gap-1"
          >
            <ArrowLeft size={14} />
            <span>Assignments</span>
          </Link>
          <span>/</span>
          <span className="text-ink font-bold truncate max-w-sm sm:max-w-md">
            {assignment.title}
          </span>
        </div>

        <button
          type="button"
          onClick={() => navigate("/student/assignments")}
          className="text-xs text-navy font-semibold hover:text-orange transition flex items-center gap-1"
        >
          <span>All Assignments</span>
        </button>
      </div>

      {/* Main Title & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            {assignment.title}
          </h1>
          <div className="flex items-center gap-2.5 mt-2.5 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-navy text-white">
              {assignment.courseCode}
            </span>
            {assignment.status === "Urgent" ? (
              <Badge tone="error" dot>Urgent • {assignment.timeLeft}</Badge>
            ) : assignment.status === "Graded" ? (
              <Badge tone="success" dot>Graded • {assignment.score}</Badge>
            ) : submissionComplete ? (
              <Badge tone="success" dot>Submitted</Badge>
            ) : (
              <Badge tone="orange" dot>Due in {assignment.timeLeft}</Badge>
            )}
          </div>
        </div>

        {/* Right Status Indicator */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-line shadow-card text-xs font-semibold text-ink">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                submissionComplete ? "bg-emerald-500" : "bg-orange animate-pulse"
              }`}
            />
            <span>{submissionComplete ? "Submitted" : "Pending Submission"}</span>
          </div>
        </div>
      </div>

      {/* Key Metadata Cards Grid (4 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Course */}
        <div className="bg-white rounded-2xl p-4 border border-line shadow-card">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1">
            Course
          </span>
          <div className="font-bold text-sm text-ink truncate">
            {assignment.courseName}
          </div>
          <span className="text-xs text-muted font-medium">{assignment.courseCode}</span>
        </div>

        {/* Card 2: Faculty */}
        <div className="bg-white rounded-2xl p-4 border border-line shadow-card">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1">
            Instructor
          </span>
          <div className="font-bold text-sm text-ink truncate">
            {course?.instructor || "Department Faculty"}
          </div>
          <span className="text-xs text-muted font-medium">Academic Mentor</span>
        </div>

        {/* Card 3: Due Date */}
        <div className="bg-white rounded-2xl p-4 border border-line shadow-card">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1">
            Due Date
          </span>
          <div className="font-bold text-sm text-ink">{assignment.dueDate}</div>
          <span className="text-xs text-orange font-semibold">{assignment.timeLeft}</span>
        </div>

        {/* Card 4: Points & Weight */}
        <div className="bg-white rounded-2xl p-4 border border-line shadow-card">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1">
            Grading Weight
          </span>
          <div className="font-display font-bold text-lg text-ink">
            {assignment.totalPoints} pts
          </div>
          <span className="text-xs text-muted font-medium">Weight: {assignment.weight}</span>
        </div>
      </div>

      {/* Graded Feedback Banner (if already graded) */}
      {assignment.status === "Graded" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 shadow-card">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-200/60 mb-3">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-base">
              <CheckCircle2 size={20} className="text-emerald-700" />
              <span>Graded Submission &amp; Faculty Feedback</span>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-700 text-white font-bold text-xs">
              Score: {assignment.score}
            </span>
          </div>
          <p className="text-sm text-emerald-900 font-medium leading-relaxed">
            &quot;{assignment.feedback}&quot;
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700 font-semibold">
            <span>Evaluator: {course?.instructor || "Course Professor"}</span>
            <span>•</span>
            <span>Evaluation finalized and synced with grade registry.</span>
          </div>
        </div>
      )}

      {/* Instructions & Reference Material Section */}
      <div className="rounded-2xl border border-line bg-white p-6 shadow-card flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <span className="w-2.5 h-6 bg-navy rounded-full" />
          <h2 className="font-display text-lg font-bold text-ink">Instructions &amp; Prompt</h2>
        </div>

        <p className="text-sm text-ink leading-relaxed">
          {assignment.description}
        </p>

        {assignment.instructions && (
          <ul className="space-y-2 text-sm text-ink list-disc list-inside marker:text-orange pt-1">
            {assignment.instructions.map((inst, i) => (
              <li key={i} className="leading-relaxed">
                {inst}
              </li>
            ))}
          </ul>
        )}

        {/* Downloadable Reference Starter Attachment Card */}
        <div className="pt-2">
          <div className="inline-flex items-center justify-between gap-4 p-3.5 rounded-xl border border-line bg-canvas hover:bg-slate-100 transition duration-150 max-w-md">
            <div className="w-10 h-10 rounded-lg bg-orange/10 flex items-center justify-center text-orange flex-shrink-0">
              <FileText size={20} />
            </div>
            <div className="text-left flex-1 min-w-0">
              <span className="text-xs font-bold text-ink block truncate">
                {assignment.courseCode}_Lab_Specification_Document.pdf
              </span>
              <span className="text-[11px] text-muted">
                Official Lab Rubric • 420 KB PDF
              </span>
            </div>
            <button
              type="button"
              onClick={() => toast.show("Downloading specification document...", "info")}
              className="p-2 rounded-lg text-navy hover:text-orange hover:bg-white transition"
              title="Download Lab Material"
            >
              <Download size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* File Submissions Interactive Workspace */}
      <div className="rounded-2xl border border-line bg-white p-6 shadow-card flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-6 bg-orange rounded-full" />
            <h2 className="font-display text-lg font-bold text-ink">
              File Submissions
            </h2>
          </div>
          <span className="text-xs text-muted">Max upload size: {assignment.maxFileSize || "25 MB"}</span>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? "border-orange bg-orange/5"
              : "border-line bg-canvas hover:border-navy hover:bg-slate-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept=".doc,.docx,.pdf,.zip,.rar,.sql,.tar,.gz"
          />

          <div className="w-14 h-14 rounded-full bg-navy/5 flex items-center justify-center text-navy mb-3">
            <UploadCloud size={28} />
          </div>

          <p className="text-sm font-semibold text-ink mb-1">
            Drag and drop your solution file here, or click to browse
          </p>
          <p className="text-xs text-muted mb-4">
            Accepted formats: .pdf, .docx, .zip, .sql, .tar (Max size: {assignment.maxFileSize || "25 MB"})
          </p>

          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-white border border-line text-xs font-semibold text-navy hover:bg-slate-100 transition shadow-xs pointer-events-none"
          >
            Browse Files
          </button>
        </div>

        {/* Selected Files Staging List */}
        {files.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-ink">
              Selected files for submission ({files.length}):
            </span>
            <div className="space-y-2">
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-canvas border border-line text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileCheck2 size={20} className="text-orange flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="font-bold text-ink truncate block">
                        {file.name}
                      </span>
                      <span className="text-muted text-[11px]">
                        {file.size} • {file.uploadedAt}
                      </span>
                    </div>
                  </div>

                  {!submissionComplete && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="text-muted hover:text-error p-1.5 rounded-lg hover:bg-white transition"
                      title="Remove file"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Academic Integrity / Honor Code Declaration */}
        <div className="pt-3 border-t border-slate-100">
          <label className="flex items-center gap-2.5 cursor-pointer text-xs select-none">
            <input
              type="checkbox"
              checked={honorCode}
              onChange={(e) => setHonorCode(e.target.checked)}
              className="w-4 h-4 rounded text-orange accent-orange cursor-pointer"
            />
            <span className="text-ink font-semibold">
              I confirm that this submission is entirely my own original work, adhering to CampusHub&apos;s Academic Integrity Code.
            </span>
          </label>
        </div>

        {/* Submission Action Buttons */}
        <div className="pt-4 flex items-center gap-3 border-t border-slate-100 flex-wrap">
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmitAssignment}
            className="px-6 py-2.5 bg-orange hover:bg-orange-hover text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Submitting to Portal...</span>
              </>
            ) : submissionComplete ? (
              <>
                <Check size={16} />
                <span>Update Submission</span>
              </>
            ) : (
              <>
                <UploadCloud size={16} />
                <span>Submit Assignment</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate("/student/assignments")}
            className="px-5 py-2.5 bg-canvas hover:bg-slate-200 text-ink text-xs sm:text-sm font-medium rounded-xl border border-line transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
