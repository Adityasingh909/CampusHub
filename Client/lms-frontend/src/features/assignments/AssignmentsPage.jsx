import { useState, useMemo, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ClipboardList,
  Search,
  Filter,
  SlidersHorizontal,
  Clock,
  AlarmClock,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Award,
  Paperclip,
  AlertCircle,
} from "lucide-react";
import { api } from "../../services/api";
import {
  MetricCardSkeleton,
  AssignmentCardSkeleton,
} from "../../components/ui/Skeleton";

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
  });

  return { formatted, timeLeft, isUrgent, isOverdue };
}

export function AssignmentsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") || "";

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [statusFilter, setStatusFilter] = useState("all"); // all | pending | submitted | graded
  const [courseFilter, setCourseFilter] = useState("all");
  const [sortBy, setSortBy] = useState("dueDate"); // dueDate | points

  // Synchronize search query with URL query param
  useEffect(() => {
    setSearchQuery(urlQuery);
  }, [urlQuery]);

  const loadAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api().get("/assignments/student");

      if (!response?.success) {
        throw new Error(response?.message || "Failed to load assignments");
      }

      setAssignments(response.assignments || []);
    } catch (err) {
      setError(err.message || "Failed to load assignments. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  // Extract unique enrolled courses from assignments for dropdown filter
  const enrolledCourses = useMemo(() => {
    const map = new Map();
    for (const a of assignments) {
      if (a.course?.id && !map.has(a.course.id)) {
        map.set(a.course.id, {
          id: a.course.id,
          title: a.course.title,
          code: a.course.code,
        });
      }
    }
    return Array.from(map.values());
  }, [assignments]);

  // Derived filtered assignments
  const filteredAssignments = useMemo(() => {
    let list = [...assignments];

    // Filter by Status Tab
    if (statusFilter === "pending") {
      list = list.filter(
        (a) => a.submissionStatus === "PENDING" || (!a.submissionStatus && !a.mySubmission)
      );
    } else if (statusFilter === "submitted") {
      list = list.filter((a) => a.submissionStatus === "SUBMITTED");
    } else if (statusFilter === "graded") {
      list = list.filter((a) => a.submissionStatus === "GRADED");
    }

    // Filter by Course
    if (courseFilter !== "all") {
      list = list.filter(
        (a) =>
          String(a.courseId) === String(courseFilter) ||
          String(a.course?.id) === String(courseFilter) ||
          a.course?.code === courseFilter
      );
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.course?.title?.toLowerCase().includes(q) ||
          a.course?.code?.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q)
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "points") return (b.totalPoints || 0) - (a.totalPoints || 0);
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    return list;
  }, [assignments, searchQuery, statusFilter, courseFilter, sortBy]);

  // Summary metrics calculated directly from real backend assignments
  const totalTasks = assignments.length;
  const pendingCount = assignments.filter(
    (a) => a.submissionStatus === "PENDING" || (!a.submissionStatus && !a.mySubmission)
  ).length;
  const submittedCount = assignments.filter(
    (a) => a.submissionStatus === "SUBMITTED"
  ).length;
  const gradedCount = assignments.filter(
    (a) => a.submissionStatus === "GRADED"
  ).length;

  const gradedWithScores = assignments.filter(
    (a) => a.submissionStatus === "GRADED" && a.mySubmission?.score != null && a.totalPoints > 0
  );
  const avgScore =
    gradedWithScores.length > 0
      ? Math.round(
          gradedWithScores.reduce(
            (sum, a) => sum + (a.mySubmission.score / a.totalPoints) * 100,
            0
          ) / gradedWithScores.length
        )
      : null;

  function handleSearchChange(e) {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim()) {
      setSearchParams({ q: val });
    } else {
      setSearchParams({});
    }
  }

  function handleReset() {
    setSearchQuery("");
    setStatusFilter("all");
    setCourseFilter("all");
    setSortBy("dueDate");
    setSearchParams({});
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      {/* Top Breadcrumb & Page Identification */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted mb-1.5">
            <Link to="/student/dashboard" className="hover:text-navy transition-colors">
              Portal
            </Link>
            <span>/</span>
            <span className="text-ink">Assignments</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            Assignments
          </h1>
          <p className="text-sm text-muted mt-1 max-w-2xl">
            Track deadlines, submit solutions directly, and review course grades across all enrolled subjects.
          </p>
        </div>

        {/* Live Academic Sync Pill */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-line shadow-card text-xs font-semibold text-muted self-start md:self-auto">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange" />
          </span>
          <span className="text-ink">Fall Semester 2026</span>
        </div>
      </div>

      {/* Summary Metric Strip (4 Real-Time Stats) */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Stat 1: Total Active */}
          <div className="p-5 rounded-2xl bg-white border border-line shadow-card flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wider text-muted font-bold">
                Total Active
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-display text-2xl font-bold text-ink">
                  {`${totalTasks} Tasks`}
                </span>
              </div>
              <span className="text-xs text-muted mt-0.5">Enrolled Coursework</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-navy">
              <ClipboardList size={22} />
            </div>
          </div>

          {/* Stat 2: Pending Submission */}
          <div className="p-5 rounded-2xl bg-white border border-line shadow-card flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wider text-muted font-bold">
                Pending
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-display text-2xl font-bold text-ink">
                  {`${pendingCount} Due`}
                </span>
              </div>
              <span className="text-xs text-orange font-semibold mt-0.5">
                {pendingCount > 0 ? "Awaiting your solution" : "All caught up"}
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-orange/10 flex items-center justify-center text-orange">
              <AlarmClock size={22} />
            </div>
          </div>

          {/* Stat 3: Submitted */}
          <div className="p-5 rounded-2xl bg-white border border-line shadow-card flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wider text-muted font-bold">
                Submitted
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-display text-2xl font-bold text-ink">
                  {`${submittedCount} In Review`}
                </span>
              </div>
              <span className="text-xs text-muted mt-0.5">Awaiting faculty grading</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
              <Clock size={22} />
            </div>
          </div>

          {/* Stat 4: Graded */}
          <div className="p-5 rounded-2xl bg-white border border-line shadow-card flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wider text-muted font-bold">
                Graded
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-display text-2xl font-bold text-ink">
                  {`${gradedCount} Completed`}
                </span>
              </div>
              <span className="text-xs text-emerald-700 font-semibold mt-0.5">
                {avgScore != null ? `Avg Score: ${avgScore}%` : "Evaluated tasks"}
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <Award size={22} />
            </div>
          </div>
        </div>
      )}

      {/* Search, Filter & Tabs Bar */}
      <div className="p-5 rounded-2xl bg-white border border-line shadow-card flex flex-col gap-4">
        {/* Top row: Search and Selectors */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search assignment title, course code, or topic..."
              className="h-[42px] w-full rounded-xl border border-line bg-canvas pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-muted focus:border-navy focus:bg-white focus:ring-[3px] focus:ring-navy/15"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            {/* Course Filter Dropdown */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="h-[42px] w-full appearance-none rounded-xl border border-line bg-canvas pl-3.5 pr-8 text-xs font-semibold text-ink outline-none cursor-pointer hover:bg-slate-100 transition"
              >
                <option value="all">All Enrolled Courses</option>
                {enrolledCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.code})
                  </option>
                ))}
              </select>
              <Filter
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative min-w-[180px] flex-1 sm:flex-initial">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-[42px] w-full appearance-none rounded-xl border border-line bg-canvas pl-3.5 pr-8 text-xs font-semibold text-ink outline-none cursor-pointer hover:bg-slate-100 transition"
              >
                <option value="dueDate">Sort: Due Date (Earliest)</option>
                <option value="points">Sort: Total Points</option>
              </select>
              <SlidersHorizontal
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
              />
            </div>
          </div>
        </div>

        {/* Status Tabs Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 transition ${
              statusFilter === "all"
                ? "bg-navy text-white shadow-xs"
                : "bg-slate-100 text-muted hover:text-ink hover:bg-slate-200"
            }`}
          >
            <span>All</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                statusFilter === "all" ? "bg-white/20 text-white" : "bg-white text-muted"
              }`}
            >
              {totalTasks}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("pending")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 transition ${
              statusFilter === "pending"
                ? "bg-navy text-white shadow-xs"
                : "bg-slate-100 text-muted hover:text-ink hover:bg-slate-200"
            }`}
          >
            <span>Pending Submission</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                statusFilter === "pending" ? "bg-orange text-white" : "bg-orange-100 text-orange-800"
              }`}
            >
              {pendingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("submitted")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 transition ${
              statusFilter === "submitted"
                ? "bg-navy text-white shadow-xs"
                : "bg-slate-100 text-muted hover:text-ink hover:bg-slate-200"
            }`}
          >
            <span>Submitted</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                statusFilter === "submitted" ? "bg-white/20 text-white" : "bg-white text-muted"
              }`}
            >
              {submittedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("graded")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 transition ${
              statusFilter === "graded"
                ? "bg-navy text-white shadow-xs"
                : "bg-slate-100 text-muted hover:text-ink hover:bg-slate-200"
            }`}
          >
            <span>Graded</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                statusFilter === "graded"
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-50 text-emerald-800"
              }`}
            >
              {gradedCount}
            </span>
          </button>
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="flex flex-col gap-4">
          <AssignmentCardSkeleton />
          <AssignmentCardSkeleton />
          <AssignmentCardSkeleton />
          <AssignmentCardSkeleton />
        </div>
      )}

      {/* Error State with Retry */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-white border border-line shadow-card text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-error flex items-center justify-center mb-3">
            <AlertCircle size={28} />
          </div>
          <h3 className="font-display text-lg font-bold text-ink">Failed to load assignments</h3>
          <p className="text-sm text-muted max-w-sm mt-1">{error}</p>
          <button
            type="button"
            onClick={loadAssignments}
            className="mt-4 px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition flex items-center gap-1.5 shadow-sm"
          >
            <RotateCcw size={14} />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Empty / Zero Assignments State */}
      {!loading && !error && filteredAssignments.length === 0 && (
        <div className="rounded-2xl border border-line bg-white p-12 text-center shadow-card flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-muted flex items-center justify-center mb-3">
            <ClipboardList size={28} />
          </div>
          <h3 className="font-display text-lg font-bold text-ink">
            {assignments.length === 0 ? "No assignments assigned" : "No assignments match your filter"}
          </h3>
          <p className="text-sm text-muted max-w-sm mt-1">
            {assignments.length === 0
              ? "Your enrolled courses do not have any published assignments yet."
              : "Try adjusting your search query, course selection, or status tabs."}
          </p>
          {assignments.length > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="mt-4 px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition flex items-center gap-1.5 shadow-sm"
            >
              <RotateCcw size={14} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      )}

      {/* Assignments List Stream */}
      {!loading && !error && filteredAssignments.length > 0 && (
        <div className="flex flex-col gap-4">
          {filteredAssignments.map((a) => {
            const dateMeta = formatDueDate(a.dueDate);
            const isGraded = a.submissionStatus === "GRADED";
            const isSubmitted = a.submissionStatus === "SUBMITTED";

            const instructorName =
              a.course?.teacher?.name || a.course?.instructor || "Course Faculty";

            return (
              <div
                key={a.id}
                className="rounded-2xl border border-line bg-white p-5 sm:p-6 shadow-card hover:shadow-lift transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5 group"
              >
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isGraded
                        ? "bg-emerald-100 text-emerald-800"
                        : isSubmitted
                        ? "bg-blue-100 text-blue-800"
                        : dateMeta.isUrgent
                        ? "bg-orange-100 text-orange-700"
                        : "bg-slate-100 text-navy"
                    }`}
                  >
                    {isGraded ? (
                      <CheckCircle2 size={24} />
                    ) : isSubmitted ? (
                      <Clock size={24} />
                    ) : dateMeta.isUrgent ? (
                      <AlarmClock size={24} />
                    ) : (
                      <ClipboardList size={24} />
                    )}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-navy text-xs font-bold">
                        {a.course?.code || "Course"}
                      </span>
                      <span className="text-xs font-medium text-ink">
                        {a.course?.title}
                      </span>
                      {instructorName && (
                        <span className="text-xs text-muted">
                          • {instructorName}
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/student/assignments/${a.id}`}
                      className="font-display text-base sm:text-lg font-bold text-ink group-hover:text-orange transition-colors truncate"
                    >
                      {a.title}
                    </Link>

                    {a.description && (
                      <p className="text-xs text-muted line-clamp-2 mt-1 leading-relaxed">
                        {a.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-muted mt-2 flex-wrap font-medium">
                      <span className="flex items-center gap-1 text-ink font-semibold">
                        <Clock size={13} className="text-orange" />
                        Due: {dateMeta.formatted}
                      </span>
                      <span>•</span>
                      <span
                        className={
                          dateMeta.isUrgent
                            ? "text-orange font-bold"
                            : "text-muted font-medium"
                        }
                      >
                        {dateMeta.timeLeft}
                      </span>
                      <span>•</span>
                      <span>{a.totalPoints || 100} Points</span>

                      {isGraded && a.mySubmission?.score != null && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-700 font-bold">
                            Score: {a.mySubmission.score} / {a.totalPoints}
                          </span>
                        </>
                      )}

                      {a.attachmentUrl && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Paperclip size={12} className="text-slate-400" />
                            Reference attached
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Column */}
                <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end justify-between md:justify-center gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => navigate(`/student/assignments/${a.id}`)}
                    className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap ${
                      isGraded
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : isSubmitted
                        ? "bg-navy hover:bg-navy-hover text-white"
                        : "bg-orange hover:bg-orange-hover text-white"
                    }`}
                  >
                    <span>
                      {isGraded
                        ? "View Feedback"
                        : isSubmitted
                        ? "Review Submission"
                        : "Submit Solution"}
                    </span>
                    <ArrowRight size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(`/student/assignments/${a.id}`)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-canvas hover:bg-slate-200 text-ink text-xs font-medium transition text-center border border-line"
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
