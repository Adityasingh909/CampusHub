import { useState, useMemo, useRef, useEffect, useCallback } from "react";
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
  Link as LinkIcon,
  RotateCcw,
  ExternalLink,
  Edit3,
  Clock,
} from "lucide-react";
import { api } from "../../services/api";
import { Badge } from "../../components/ui/Badge";
import { useToast } from "../../hooks/useToast";
import { Skeleton } from "../../components/ui/Skeleton";

function formatDueDate(isoString) {
  if (!isoString) {
    return { formatted: "No deadline", timeLeft: "N/A", isUrgent: false, isOverdue: false };
  }
  const due = new Date(isoString);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const isOverdue = diffMs < 0;
  const hoursLeft = Math.ceil(diffMs / (1000 * 60 * 60));
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let timeLeft = "";
  let isUrgent = false;

  if (isOverdue) {
    timeLeft = "Past due";
    isUrgent = true;
  } else if (hoursLeft <= 48) {
    timeLeft = `${hoursLeft} hours left`;
    isUrgent = true;
  } else {
    timeLeft = `${daysLeft} days left`;
  }

  const formatted = due.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return { formatted, timeLeft, isUrgent, isOverdue };
}

function formatSubmissionDate(isoString) {
  if (!isoString) return "Recently";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return String(isoString);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return String(isoString);
  }
}

export function AssignmentDetailPage() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Submission inputs
  const [content, setContent] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [stagedFiles, setStagedFiles] = useState([]);
  const [honorCode, setHonorCode] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);

  const refetchAssignment = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchAssignment() {
      try {
        setLoading(true);
        setError("");
        const response = await api().get(`/assignments/${assignmentId}`);

        if (cancelled) return;

        if (!response?.success || !response.assignment) {
          throw new Error(response?.message || "Assignment not found.");
        }

        const data = response.assignment;
        setAssignment(data);

        if (data.mySubmission) {
          setContent(data.mySubmission.content || "");
          setFileUrl(data.mySubmission.fileUrl || "");
          setIsEditing(false);
        } else {
          setIsEditing(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load assignment details.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchAssignment();

    return () => {
      cancelled = true;
    };
  }, [assignmentId, reloadKey]);

  const dateMeta = useMemo(() => {
    return formatDueDate(assignment?.dueDate);
  }, [assignment?.dueDate]);

  const isGraded = assignment?.submissionStatus === "GRADED";
  const isSubmitted = assignment?.submissionStatus === "SUBMITTED" || isGraded;
  const mySubmission = assignment?.mySubmission || null;

  function handleFileSelect(e) {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFiles = Array.from(selectedFiles).map((f) => ({
      name: f.name,
      size: (f.size / (1024 * 1024)).toFixed(2) + " MB",
      uploadedAt: "Staged locally",
    }));

    setStagedFiles((prev) => [...prev, ...newFiles]);
    toast.show(`${selectedFiles.length} file(s) attached to draft. Remember to provide a hosted URL if available.`, "info");
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
      uploadedAt: "Staged locally",
    }));

    setStagedFiles((prev) => [...prev, ...newFiles]);
    toast.show(`${droppedFiles.length} file(s) attached to draft.`, "info");
  }

  function handleRemoveFile(index) {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
    toast.show("File removed from draft.", "info");
  }

  async function handleSubmitAssignment(e) {
    if (e) e.preventDefault();

    if (isGraded) {
      toast.show("This assignment has already been evaluated and graded. Submissions are closed.", "warning");
      return;
    }

    if (!honorCode) {
      toast.show("Please confirm the academic honor code declaration.", "warning");
      return;
    }

    const trimmedContent = content.trim();
    const trimmedFileUrl = fileUrl.trim();

    if (!trimmedContent && !trimmedFileUrl && stagedFiles.length === 0) {
      toast.show("Please enter your written solution notes or provide an external project URL.", "error");
      return;
    }

    // Validate URL format if provided
    if (trimmedFileUrl) {
      try {
        const parsed = new URL(trimmedFileUrl);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          toast.show("Project URL must begin with http:// or https://", "warning");
          return;
        }
      } catch {
        toast.show("Please enter a valid URL (e.g. https://github.com/... or Google Drive link).", "warning");
        return;
      }
    }

    let finalContent = trimmedContent;
    if (!finalContent && stagedFiles.length > 0) {
      finalContent = `Solution Document: ${stagedFiles.map((f) => `${f.name} (${f.size})`).join(", ")}`;
    }

    const finalFileUrl = trimmedFileUrl || null;

    setSubmitting(true);
    try {
      const response = await api().post(`/assignments/${assignment.id}/submit`, {
        content: finalContent,
        fileUrl: finalFileUrl,
      });

      if (!response?.success) {
        throw new Error(response?.message || "Failed to submit assignment");
      }

      toast.show(response.message || "Assignment submitted successfully!", "success");

      // Reload fresh persisted state from the database
      refetchAssignment();
      setIsEditing(false);
      setStagedFiles([]);
    } catch (err) {
      toast.show(err.message || "Submission failed. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 lg:gap-8 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24 rounded-md" />
          <span className="text-muted">/</span>
          <Skeleton className="h-4 w-36 rounded-md" />
        </div>

        <div className="rounded-2xl border border-line bg-white p-6 sm:p-8 shadow-card flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-8 w-3/4 rounded-xl" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-4 w-20 rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="rounded-2xl border border-line bg-white p-6 shadow-card flex flex-col gap-4">
              <Skeleton className="h-5 w-32 rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-5/6 rounded-md" />
              <Skeleton className="h-4 w-4/6 rounded-md" />
            </div>
          </div>
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="rounded-2xl border border-line bg-white p-6 shadow-card flex flex-col gap-4">
              <Skeleton className="h-5 w-36 rounded-md" />
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="rounded-2xl border border-line bg-white p-12 text-center shadow-card flex flex-col items-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-orange/10 text-orange flex items-center justify-center mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="font-display text-2xl font-bold text-ink">Assignment Unavailable</h2>
        <p className="text-sm text-muted max-w-md mt-2">
          {error || `The assignment with identifier "${assignmentId}" could not be accessed.`}
        </p>
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={refetchAssignment}
            className="px-4 py-2.5 rounded-xl border border-line text-sm font-semibold text-ink hover:bg-canvas transition flex items-center gap-1.5"
          >
            <RotateCcw size={15} />
            <span>Retry</span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/student/assignments")}
            className="px-5 py-2.5 rounded-xl bg-navy text-white text-sm font-semibold hover:bg-navy-hover transition flex items-center gap-2 shadow-sm"
          >
            <ArrowLeft size={16} />
            <span>Back to Assignments</span>
          </button>
        </div>
      </div>
    );
  }

  const instructorName =
    assignment.course?.teacher?.name || assignment.course?.instructor || "Department Faculty";

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
              {assignment.course?.code || "CS Course"}
            </span>

            {isGraded ? (
              <Badge tone="success" dot>
                Graded • {mySubmission?.score} / {assignment.totalPoints} pts
              </Badge>
            ) : isSubmitted ? (
              <Badge tone="success" dot>
                Submitted • Awaiting Review
              </Badge>
            ) : dateMeta.isUrgent ? (
              <Badge tone="error" dot>
                Urgent • {dateMeta.timeLeft}
              </Badge>
            ) : (
              <Badge tone="orange" dot>
                Due in {dateMeta.timeLeft}
              </Badge>
            )}
          </div>
        </div>

        {/* Right Status Indicator */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-line shadow-card text-xs font-semibold text-ink">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isGraded
                  ? "bg-emerald-600"
                  : isSubmitted
                  ? "bg-blue-600"
                  : dateMeta.isUrgent
                  ? "bg-orange animate-pulse"
                  : "bg-slate-400"
              }`}
            />
            <span>
              {isGraded
                ? "Graded"
                : isSubmitted
                ? "Submitted (Awaiting Grade)"
                : "Pending Submission"}
            </span>
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
            {assignment.course?.title || "Enrolled Subject"}
          </div>
          <span className="text-xs text-muted font-medium">
            {assignment.course?.code || ""}
          </span>
        </div>

        {/* Card 2: Faculty */}
        <div className="bg-white rounded-2xl p-4 border border-line shadow-card">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1">
            Instructor
          </span>
          <div className="font-bold text-sm text-ink truncate">
            {instructorName}
          </div>
          <span className="text-xs text-muted font-medium">Academic Mentor</span>
        </div>

        {/* Card 3: Due Date */}
        <div className="bg-white rounded-2xl p-4 border border-line shadow-card">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1">
            Due Date
          </span>
          <div className="font-bold text-sm text-ink">{dateMeta.formatted}</div>
          <span className="text-xs text-orange font-semibold">{dateMeta.timeLeft}</span>
        </div>

        {/* Card 4: Points */}
        <div className="bg-white rounded-2xl p-4 border border-line shadow-card">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1">
            Grading Points
          </span>
          <div className="font-display font-bold text-lg text-ink">
            {assignment.totalPoints || 100} pts
          </div>
          <span className="text-xs text-muted font-medium">
            Credits: {assignment.course?.credits || 4}
          </span>
        </div>
      </div>

      {/* Instructions & Reference Material Section */}
      <div className="rounded-2xl border border-line bg-white p-6 shadow-card flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <span className="w-2.5 h-6 bg-navy rounded-full" />
          <h2 className="font-display text-lg font-bold text-ink">Instructions &amp; Prompt</h2>
        </div>

        <p className="text-sm text-ink leading-relaxed whitespace-pre-line">
          {assignment.description || "No specific instructions provided for this assignment."}
        </p>

        {/* Optional reference starter attachment */}
        {assignment.attachmentUrl && (
          <div className="pt-2">
            <a
              href={assignment.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-between gap-4 p-3.5 rounded-xl border border-line bg-canvas hover:bg-slate-100 transition duration-150 max-w-md group"
            >
              <div className="w-10 h-10 rounded-lg bg-orange/10 flex items-center justify-center text-orange flex-shrink-0">
                <FileText size={20} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <span className="text-xs font-bold text-ink block truncate group-hover:text-orange transition-colors">
                  Course Material Reference Attachment
                </span>
                <span className="text-[11px] text-muted">
                  Official resource link provided by instructor
                </span>
              </div>
              <Download size={16} className="text-navy" />
            </a>
          </div>
        )}
      </div>

      {/* SECTION 1: PERSISTED SUBMISSION SUMMARY (Visible when a submission exists) */}
      {isSubmitted && mySubmission && (
        <div className="rounded-2xl border border-line bg-white p-6 shadow-card flex flex-col gap-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-ink">
                  Your Submitted Work
                </h2>
                <span className="text-xs text-muted flex items-center gap-1.5 mt-0.5">
                  <Clock size={12} />
                  <span>Submitted on {formatSubmissionDate(mySubmission.submittedAt)}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isGraded ? (
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 shadow-xs">
                  <span>Score: {mySubmission.score} / {assignment.totalPoints || 100}</span>
                  <span className="text-emerald-600">
                    ({Math.round(((mySubmission.score || 0) / (assignment.totalPoints || 100)) * 100)}%)
                  </span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                  Awaiting Grading
                </span>
              )}
            </div>
          </div>

          {/* Graded Feedback Box (if evaluated) */}
          {isGraded && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-emerald-900 font-bold">
                <span>Faculty Evaluation &amp; Feedback</span>
                <span>{mySubmission.score} / {assignment.totalPoints || 100} pts</span>
              </div>
              <p className="text-emerald-950 font-medium leading-relaxed italic">
                {mySubmission.feedback ? `"${mySubmission.feedback}"` : "No written comments recorded."}
              </p>
              <div className="text-[11px] text-emerald-700 pt-1">
                Evaluated by {instructorName}
              </div>
            </div>
          )}

          {/* Written Solution Display */}
          <div className="space-y-1.5">
            <span className="block text-xs font-bold uppercase tracking-wider text-muted">
              Submitted Solution Notes
            </span>
            <div className="rounded-xl border border-line bg-canvas p-4 text-sm text-ink leading-relaxed whitespace-pre-wrap">
              {mySubmission.content || (
                <span className="text-muted italic">No written solution notes provided.</span>
              )}
            </div>
          </div>

          {/* External URL Display */}
          {mySubmission.fileUrl && (
            <div className="space-y-1.5">
              <span className="block text-xs font-bold uppercase tracking-wider text-muted">
                Attached Project / Hosted URL
              </span>
              <div className="rounded-xl border border-line bg-canvas p-3.5 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <LinkIcon size={16} className="text-orange flex-shrink-0" />
                  <a
                    href={mySubmission.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-navy hover:underline truncate max-w-md"
                  >
                    {mySubmission.fileUrl}
                  </a>
                </div>
                <a
                  href={mySubmission.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-lg bg-navy hover:bg-navy-hover text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <span>Open Link</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          )}

          {/* Resubmission Action Controls */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
            {!isGraded ? (
              <div className="flex items-center justify-between w-full">
                <p className="text-xs text-muted">
                  You can update your solution notes or project link before the assignment is evaluated.
                </p>
                <button
                  type="button"
                  onClick={() => setIsEditing((prev) => !prev)}
                  className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition flex items-center gap-1.5 shadow-xs"
                >
                  <Edit3 size={14} />
                  <span>{isEditing ? "Hide Update Form" : "Edit / Update Submission"}</span>
                </button>
              </div>
            ) : (
              <p className="text-xs text-muted">
                This assignment has been evaluated and graded. Submissions are finalized and closed.
              </p>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: EMPTY STATE (Visible when student has not submitted anything yet) */}
      {!isSubmitted && (
        <div className="rounded-2xl border border-line bg-canvas p-5 text-center flex flex-col items-center">
          <div className="w-10 h-10 rounded-xl bg-orange/10 text-orange flex items-center justify-center mb-2">
            <UploadCloud size={20} />
          </div>
          <h3 className="font-display text-sm font-bold text-ink">
            No Submission Recorded Yet
          </h3>
          <p className="text-xs text-muted max-w-md mt-0.5 leading-relaxed">
            Please complete your solution notes or attach your external project URL below and submit before the deadline.
          </p>
        </div>
      )}

      {/* SECTION 3: SUBMISSION / UPDATE FORM (Shown when editing or initially submitting) */}
      {(isEditing || !isSubmitted) && !isGraded && (
        <form
          onSubmit={handleSubmitAssignment}
          className="rounded-2xl border border-line bg-white p-6 shadow-card flex flex-col gap-5"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-6 bg-orange rounded-full" />
              <h2 className="font-display text-lg font-bold text-ink">
                {isSubmitted ? "Update Your Submission" : "Submit Your Assignment"}
              </h2>
            </div>
            <span className="text-xs font-semibold text-muted">
              {isSubmitted ? "Resubmission Active" : "Initial Submission"}
            </span>
          </div>

          {/* Written Solution / Response Notes Input */}
          <div className="space-y-1.5">
            <label htmlFor="content" className="block text-xs font-bold uppercase tracking-wider text-muted">
              Solution Notes &amp; Written Response
            </label>
            <textarea
              id="content"
              rows={5}
              disabled={submitting}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your written solution, explanations, methodology, or notes here..."
              className="w-full rounded-xl border border-line bg-canvas p-3.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-navy focus:bg-white focus:ring-[3px] focus:ring-navy/15 disabled:bg-slate-100"
            />
          </div>

          {/* Project URL / Solution Link Field */}
          <div className="space-y-1.5">
            <label htmlFor="fileUrl" className="block text-xs font-bold uppercase tracking-wider text-muted">
              External Project or Hosted Document URL (Optional)
            </label>
            <div className="relative">
              <LinkIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                id="fileUrl"
                type="url"
                disabled={submitting}
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://github.com/username/project or Google Drive / OneDrive shared link"
                className="h-[42px] w-full rounded-xl border border-line bg-canvas pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-muted focus:border-navy focus:bg-white focus:ring-[3px] focus:ring-navy/15 disabled:bg-slate-100"
              />
            </div>
            <p className="text-[11px] text-muted">
              Paste a public or institutional link to your code repository, shared document, or project archive.
            </p>
          </div>

          {/* Local File Attachment Reference Dropzone */}
          <div className="space-y-2 pt-1">
            <span className="block text-xs font-bold uppercase tracking-wider text-muted">
              Reference Solution File
            </span>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => {
                if (!submitting) fileInputRef.current?.click();
              }}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 cursor-pointer ${
                dragActive
                  ? "border-orange bg-orange/5"
                  : "border-line bg-canvas hover:border-navy hover:bg-slate-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                disabled={submitting}
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.zip,.tar,.gz,.py,.js,.sql,.txt"
              />

              <div className="w-10 h-10 rounded-full bg-navy/5 flex items-center justify-center text-navy mb-2 mx-auto">
                <UploadCloud size={20} />
              </div>

              <p className="text-sm font-semibold text-ink mb-1">
                Drag &amp; drop reference files here, or click to browse
              </p>
              <p className="text-xs text-muted max-w-md mx-auto">
                Supported formats: PDF, DOCX, ZIP, Code files. Provide a public URL above for teacher access.
              </p>
            </div>

            {/* Staged Files List */}
            {stagedFiles.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-ink">
                  Attached files for this draft ({stagedFiles.length}):
                </span>
                <div className="space-y-2">
                  {stagedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-canvas border border-line text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileCheck2 size={18} className="text-orange flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="font-bold text-ink truncate block">
                            {file.name}
                          </span>
                          <span className="text-muted text-[11px]">
                            {file.size}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        disabled={submitting}
                        className="text-muted hover:text-error p-1.5 rounded-lg hover:bg-white transition"
                        title="Remove file"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Academic Integrity Code Declaration */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none">
              <input
                type="checkbox"
                checked={honorCode}
                disabled={submitting}
                onChange={(e) => setHonorCode(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-orange accent-orange cursor-pointer disabled:opacity-50"
              />
              <span className="text-ink font-semibold leading-relaxed">
                I confirm that this submission is entirely my own original work, adhering to CampusHub&apos;s Academic Integrity Code.
              </span>
            </label>
          </div>

          {/* Submission Actions */}
          <div className="pt-4 flex items-center gap-3 border-t border-slate-100 flex-wrap">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-orange hover:bg-orange-hover text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Submitting to Portal...</span>
                </>
              ) : isSubmitted ? (
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

            {isSubmitted && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={submitting}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-ink text-xs sm:text-sm font-medium rounded-xl transition"
              >
                Cancel Edit
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate("/student/assignments")}
              className="px-5 py-2.5 bg-canvas hover:bg-slate-200 text-ink text-xs sm:text-sm font-medium rounded-xl border border-line transition"
            >
              Back
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
