import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  FileCheck2,
  Search,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
  Loader2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { api } from "../../services/api";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { AssignmentCardSkeleton } from "../../components/ui/Skeleton";

export function TeacherSubmissionsPage() {
  const { submissionId: routeSubmissionId, assignmentId: routeAssignmentId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlAssignmentId = searchParams.get("assignmentId") || routeAssignmentId || "all";

  const { user } = useAuth();
  const toast = useToast();

  const [assignments, setAssignments] = useState([]);
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedAssignmentId, setSelectedAssignmentId] = useState(urlAssignmentId);
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'pending' | 'graded'
  const [searchQuery, setSearchQuery] = useState("");

  // Grading Modal State
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [gradingScore, setGradingScore] = useState("");
  const [gradingFeedback, setGradingFeedback] = useState("");
  const [gradingSubmitting, setGradingSubmitting] = useState(false);
  const [gradingError, setGradingError] = useState("");

  const [reloadKey, setReloadKey] = useState(0);

  const refetchData = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        // 1. Fetch teacher's courses
        const currentTeacherId = user?.id ?? user?.userId;
        const courseRes = await api().get("/course/");
        const myCourses = (courseRes?.courses || []).filter(
          (c) => Number(c.teacherId) === Number(currentTeacherId)
        );

        if (cancelled) return;

        // 2. Fetch assignments across courses
        const assignmentPromises = myCourses.map(async (c) => {
          try {
            const aRes = await api().get(`/assignments/course/${c.id}`);
            return (aRes?.assignments || []).map((item) => ({
              ...item,
              course: c,
            }));
          } catch {
            return [];
          }
        });

        const assignmentResults = await Promise.all(assignmentPromises);
        const assignmentsList = assignmentResults.flat();

        if (cancelled) return;
        setAssignments(assignmentsList);

        // 3. Fetch submissions for all assignments
        const submissionPromises = assignmentsList.map(async (a) => {
          try {
            const sRes = await api().get(`/assignments/${a.id}/submissions`);
            return (sRes?.submissions || []).map((s) => ({
              ...s,
              assignment: a,
            }));
          } catch {
            return [];
          }
        });

        const submissionResults = await Promise.all(submissionPromises);
        const flatSubs = submissionResults.flat();

        if (cancelled) return;
        setAllSubmissions(flatSubs);

        // If route has specific submissionId, auto-open modal for it
        if (routeSubmissionId) {
          const match = flatSubs.find(
            (s) => String(s.id) === String(routeSubmissionId)
          );
          if (match) {
            setActiveSubmission(match);
            setGradingScore(match.score != null ? String(match.score) : "");
            setGradingFeedback(match.feedback || "");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load submissions");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.userId, routeSubmissionId, reloadKey]);

  const activeAssignmentId = searchParams.get("assignmentId") || routeAssignmentId || selectedAssignmentId;

  const handleAssignmentFilterChange = (val) => {
    setSelectedAssignmentId(val);
    if (val === "all") {
      setSearchParams({});
    } else {
      setSearchParams({ assignmentId: val });
    }
  };

  const filteredSubmissions = useMemo(() => {
    let result = [...allSubmissions];

    if (activeAssignmentId !== "all") {
      result = result.filter(
        (s) => String(s.assignmentId) === String(activeAssignmentId)
      );
    }

    if (statusFilter === "pending") {
      result = result.filter((s) => s.status !== "GRADED");
    } else if (statusFilter === "graded") {
      result = result.filter((s) => s.status === "GRADED");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.student?.name?.toLowerCase().includes(q) ||
          s.student?.email?.toLowerCase().includes(q) ||
          s.assignment?.title?.toLowerCase().includes(q) ||
          s.assignment?.course?.code?.toLowerCase().includes(q)
      );
    }

    result.sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );

    return result;
  }, [allSubmissions, activeAssignmentId, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = allSubmissions.length;
    const pending = allSubmissions.filter((s) => s.status !== "GRADED").length;
    const graded = allSubmissions.filter((s) => s.status === "GRADED").length;
    return { total, pending, graded };
  }, [allSubmissions]);

  const openGradingModal = (submission) => {
    setActiveSubmission(submission);
    setGradingScore(submission.score != null ? String(submission.score) : "");
    setGradingFeedback(submission.feedback || "");
    setGradingError("");
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (!activeSubmission) return;

    const maxScore = activeSubmission.assignment?.totalPoints || 100;
    const numScore = Number(gradingScore);

    if (isNaN(numScore) || numScore < 0) {
      setGradingError("Please enter a valid non-negative score.");
      return;
    }

    if (numScore > maxScore) {
      setGradingError(`Score cannot exceed maximum total points of ${maxScore}.`);
      return;
    }

    try {
      setGradingSubmitting(true);
      setGradingError("");

      const res = await api().patch(
        `/assignments/submissions/${activeSubmission.id}/grade`,
        {
          score: Math.round(numScore),
          feedback: gradingFeedback.trim(),
        }
      );

      if (!res?.success) {
        throw new Error(res?.message || "Failed to grade submission");
      }

      toast.show(
        `Graded submission for ${activeSubmission.student?.name || "Student"}!`,
        "success"
      );

      // Update in local state
      setAllSubmissions((prev) =>
        prev.map((s) =>
          s.id === activeSubmission.id
            ? {
                ...s,
                score: Math.round(numScore),
                feedback: gradingFeedback.trim(),
                status: "GRADED",
              }
            : s
        )
      );

      setActiveSubmission(null);
    } catch (err) {
      setGradingError(err.message || "Failed to save grade.");
    } finally {
      setGradingSubmitting(false);
    }
  };


  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center max-w-lg mx-auto my-8">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
          <AlertCircle size={24} />
        </div>
        <h3 className="text-base font-bold text-ink">Failed to Load Submissions</h3>
        <p className="text-sm text-muted mt-1 mb-4">{error}</p>
        <button
          type="button"
          onClick={refetchData}
          className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition inline-flex items-center gap-1.5 shadow-sm"
        >
          <RotateCcw size={14} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted mb-1.5">
            <Link to="/teacher/dashboard" className="hover:text-navy transition-colors">
              Faculty Portal
            </Link>
            <span>/</span>
            <span className="text-ink">Submissions &amp; Grading</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            Submissions &amp; Grading Review
          </h1>
          <p className="text-sm text-muted mt-1">
            Evaluate student assignment submissions, assign scores, and provide feedback.
          </p>
        </div>

        {/* Quick Stats Ribbon */}
        <div className="flex items-center gap-4 bg-white border border-line px-5 py-3 rounded-2xl shadow-card self-start sm:self-auto">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange animate-pulse" />
            <span className="text-xs text-muted font-medium">To Grade:</span>
            <span className="text-sm font-bold text-orange">{stats.pending}</span>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span className="text-xs text-muted font-medium">Graded:</span>
            <span className="text-sm font-bold text-ink">{stats.graded}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="rounded-2xl border border-line bg-white p-4 sm:p-5 shadow-card flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, email, or assignment..."
              className="h-[42px] w-full rounded-xl border border-line bg-canvas pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-muted focus:border-navy focus:bg-white focus:ring-[3px] focus:ring-navy/15"
            />
          </div>

          {/* Assignment Dropdown Filter */}
          <div className="flex items-center gap-2">
            <select
              value={activeAssignmentId}
              onChange={(e) => handleAssignmentFilterChange(e.target.value)}
              className="h-[42px] rounded-xl border border-line bg-canvas px-4 pr-9 text-xs sm:text-sm font-semibold text-ink outline-none cursor-pointer hover:bg-slate-100 transition max-w-xs truncate"
            >
              <option value="all">All Assignments ({assignments.length})</option>
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.course?.code}: {a.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition shadow-xs ${
                statusFilter === "all"
                  ? "bg-navy text-white"
                  : "bg-slate-100 text-muted hover:text-ink hover:bg-slate-200"
              }`}
            >
              All Submissions ({allSubmissions.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("pending")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition shadow-xs ${
                statusFilter === "pending"
                  ? "bg-navy text-white"
                  : "bg-slate-100 text-muted hover:text-ink hover:bg-slate-200"
              }`}
            >
              Pending Grading ({stats.pending})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("graded")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition shadow-xs ${
                statusFilter === "graded"
                  ? "bg-navy text-white"
                  : "bg-slate-100 text-muted hover:text-ink hover:bg-slate-200"
              }`}
            >
              Graded ({stats.graded})
            </button>
          </div>

          <span className="text-xs text-muted">
            Showing {filteredSubmissions.length} of {allSubmissions.length} submissions
          </span>
        </div>
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="flex flex-col gap-4">
          <AssignmentCardSkeleton />
          <AssignmentCardSkeleton />
          <AssignmentCardSkeleton />
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-12 text-center shadow-card flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-muted flex items-center justify-center mb-3">
            <FileCheck2 size={28} />
          </div>
          <h3 className="font-display text-lg font-bold text-ink">
            No submissions found
          </h3>
          <p className="text-sm text-muted max-w-sm mt-1">
            {searchQuery || selectedAssignmentId !== "all" || statusFilter !== "all"
              ? "No submissions match your active search or filter criteria."
              : "Students enrolled in your courses haven't submitted any coursework yet."}
          </p>
          {(searchQuery || selectedAssignmentId !== "all" || statusFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedAssignmentId("all");
                setStatusFilter("all");
                setSearchParams({});
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition flex items-center gap-1.5 shadow-sm"
            >
              <RotateCcw size={14} />
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredSubmissions.map((submission) => {
            const isGraded = submission.status === "GRADED";
            const initials =
              submission.student?.name
                ?.split(/\s+/)
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "ST";

            return (
              <div
                key={submission.id}
                className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 rounded-2xl border border-line bg-white p-5 shadow-card hover:shadow-lift transition-all"
              >
                {/* Student & Submission Info */}
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-navy text-white flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                    {initials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-display text-base font-bold text-ink">
                        {submission.student?.name || "Student"}
                      </h4>
                      <span className="text-xs text-muted">
                        ({submission.student?.email || "No email"})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-xs mb-2">
                      <span className="px-2 py-0.5 rounded bg-navy/10 text-navy font-bold text-[11px]">
                        {submission.assignment?.course?.code || "Course"}
                      </span>
                      <span className="font-semibold text-ink">
                        {submission.assignment?.title || "Assignment"}
                      </span>
                      <span className="text-muted">•</span>
                      <span className="text-muted">
                        Submitted:{" "}
                        {submission.submittedAt
                          ? new Date(submission.submittedAt).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : "Recently"}
                      </span>
                    </div>

                    {/* Content preview */}
                    {submission.content ? (
                      <p className="text-xs text-muted line-clamp-2 bg-canvas p-2.5 rounded-xl border border-line/60">
                        {submission.content}
                      </p>
                    ) : submission.fileUrl ? (
                      <div className="flex items-center gap-2 text-xs text-navy font-medium bg-canvas p-2 rounded-xl border border-line/60 w-fit">
                        <FileText size={14} className="text-orange" />
                        <span>Attached file uploaded</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Score & Grading Actions */}
                <div className="flex items-center justify-between lg:justify-end gap-3 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <div className="flex flex-col text-left lg:text-right">
                    {isGraded ? (
                      <div>
                        <Badge tone="success" dot>
                          Score: {submission.score} / {submission.assignment?.totalPoints || 100}
                        </Badge>
                        {submission.feedback && (
                          <p className="text-[11px] text-muted mt-1 max-w-xs truncate">
                            &quot;{submission.feedback}&quot;
                          </p>
                        )}
                      </div>
                    ) : (
                      <Badge tone="warning" dot>
                        Awaiting Grading
                      </Badge>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => openGradingModal(submission)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                      isGraded
                        ? "bg-slate-100 hover:bg-slate-200 text-ink"
                        : "bg-orange hover:bg-orange-hover text-white"
                    }`}
                  >
                    <span>{isGraded ? "Edit Grade" : "Grade Submission"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Grading Review Modal */}
      {activeSubmission && (
        <Modal
          open={Boolean(activeSubmission)}
          onClose={() => setActiveSubmission(null)}
          title={`Grade: ${activeSubmission.assignment?.title}`}
          className="max-w-2xl"
        >
          <div className="space-y-4">
            {gradingError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                {gradingError}
              </div>
            )}

            {/* Student & Course Meta */}
            <div className="p-3 rounded-2xl bg-canvas border border-line/70 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div>
                <span className="text-muted">Student: </span>
                <span className="font-bold text-ink">
                  {activeSubmission.student?.name}
                </span>{" "}
                <span className="text-muted">
                  ({activeSubmission.student?.email})
                </span>
              </div>
              <div>
                <span className="text-muted">Course: </span>
                <span className="font-bold text-navy">
                  {activeSubmission.assignment?.course?.code}
                </span>
              </div>
            </div>

            {/* Submission Content Section */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Student Response
              </label>
              {activeSubmission.content ? (
                <div className="rounded-xl border border-line bg-canvas p-3.5 text-xs text-ink whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed">
                  {activeSubmission.content}
                </div>
              ) : (
                <p className="text-xs text-muted italic">
                  No written text content provided.
                </p>
              )}
            </div>

            {/* Attached File Preview if any */}
            {activeSubmission.fileUrl && (
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Attached File / URL
                </label>
                <div className="rounded-xl border border-line p-3 flex items-center justify-between gap-3 bg-white">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={18} className="text-orange flex-shrink-0" />
                    <span className="text-xs font-medium text-ink truncate">
                      {activeSubmission.fileUrl}
                    </span>
                  </div>
                  <a
                    href={activeSubmission.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-navy hover:bg-navy-hover text-white text-xs font-semibold transition-colors flex-shrink-0"
                  >
                    <span>Open</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            )}

            {/* Grading Form */}
            <form onSubmit={handleSaveGrade} className="pt-2 border-t border-slate-100 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Score (out of {activeSubmission.assignment?.totalPoints || 100}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={activeSubmission.assignment?.totalPoints || 100}
                    required
                    value={gradingScore}
                    onChange={(e) => setGradingScore(e.target.value)}
                    placeholder={`0 - ${activeSubmission.assignment?.totalPoints || 100}`}
                    className="w-full rounded-xl border border-line bg-canvas p-2.5 text-sm text-ink outline-none focus:border-navy focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Evaluation Status
                  </label>
                  <div className="p-2.5 rounded-xl bg-slate-100 text-xs font-semibold text-ink">
                    {gradingScore !== ""
                      ? `Will mark as GRADED (${gradingScore}/${activeSubmission.assignment?.totalPoints || 100})`
                      : "Pending evaluation"}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Instructor Feedback / Comments
                </label>
                <textarea
                  rows={3}
                  value={gradingFeedback}
                  onChange={(e) => setGradingFeedback(e.target.value)}
                  placeholder="Provide constructive feedback, praise strong points, or explain point deductions..."
                  className="w-full rounded-xl border border-line bg-canvas p-2.5 text-sm text-ink outline-none focus:border-navy focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSubmission(null)}
                  disabled={gradingSubmitting}
                  className="rounded-xl border border-line px-4 py-2 text-xs font-semibold text-muted hover:text-ink transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={gradingSubmitting}
                  className="rounded-xl bg-orange hover:bg-orange-hover px-5 py-2 text-xs font-semibold text-white shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {gradingSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving Grade...
                    </>
                  ) : (
                    "Save Grade & Feedback"
                  )}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
