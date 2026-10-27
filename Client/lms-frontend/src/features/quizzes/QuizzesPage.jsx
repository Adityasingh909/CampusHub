import { useState, useMemo, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  FileQuestion,
  Search,
  Filter,
  Zap,
  CheckCircle2,
  Calendar,
  Award,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Eye,
  Loader2,
  AlertCircle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { api } from "../../services/api";
import * as quizService from "../../services/quizService";

export function QuizzesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") || "";

  // Filters state
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [statusFilter, setStatusFilter] = useState("all"); // all | live | past | history
  const [courseFilter, setCourseFilter] = useState("all");

  // Data state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quizzes, setQuizzes] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);

  // Paginated History State
  const [historyPage, setHistoryPage] = useState(1);
  const [historyData, setHistoryData] = useState({
    attempts: [],
    pagination: { totalAttempts: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
  });
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Synchronize search query with URL param
  function handleSearchChange(e) {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim()) {
      setSearchParams({ q: val });
    } else {
      setSearchParams({});
    }
  }

  // Load live data from backend
  const loadQuizzesData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // 1. Fetch student's enrolled courses for the filter dropdown
      try {
        const enrollRes = await api().get("/enrollments/my-courses");
        const enrollments = enrollRes?.enrollments || [];
        const coursesList = enrollments
          .map((e) => e.course)
          .filter(Boolean);
        setEnrolledCourses(coursesList);
      } catch (e) {
        console.warn("Could not fetch enrolled courses list:", e.message);
      }

      // 2. Fetch all available published quizzes for the student
      const res = await quizService.getAllAvailableQuizzes();
      setQuizzes(res?.quizzes || []);

      // 3. Fetch initial attempt history
      const histRes = await quizService.getMyQuizAttempts(1, 10);
      setHistoryData(histRes || { attempts: [], pagination: {} });
    } catch (err) {
      console.error("Failed to load quizzes:", err);
      setError(err.message || "Failed to load quizzes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuizzesData();
  }, [loadQuizzesData]);

  // Load paginated history when page changes
  const loadHistoryPage = useCallback(async (page) => {
    try {
      setLoadingHistory(true);
      const histRes = await quizService.getMyQuizAttempts(page, 10);
      setHistoryData(histRes || { attempts: [], pagination: {} });
      setHistoryPage(page);
    } catch (err) {
      console.error("Failed to load history page:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Filtered Quizzes
  const filteredQuizzes = useMemo(() => {
    let list = [...quizzes];

    // Status filter
    if (statusFilter === "live") {
      list = list.filter((q) => !q.hasAttempted);
    } else if (statusFilter === "past") {
      list = list.filter((q) => q.hasAttempted);
    }

    // Course filter
    if (courseFilter !== "all") {
      list = list.filter(
        (q) => String(q.courseId) === String(courseFilter) || q.courseCode === courseFilter
      );
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (quiz) =>
          quiz.title.toLowerCase().includes(q) ||
          quiz.courseTitle?.toLowerCase().includes(q) ||
          quiz.courseCode?.toLowerCase().includes(q) ||
          quiz.description?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [quizzes, statusFilter, courseFilter, searchQuery]);

  // Metrics calculation
  const totalLive = useMemo(() => quizzes.filter((q) => !q.hasAttempted).length, [quizzes]);
  const totalCompleted = useMemo(() => quizzes.filter((q) => q.hasAttempted).length, [quizzes]);

  const averageScore = useMemo(() => {
    const completed = quizzes.filter((q) => q.hasAttempted && q.latestPercentage !== null);
    if (completed.length === 0) return 0;
    const sum = completed.reduce((acc, q) => acc + (q.latestPercentage || 0), 0);
    return Math.round(sum / completed.length);
  }, [quizzes]);

  function handleReset() {
    setSearchQuery("");
    setStatusFilter("all");
    setCourseFilter("all");
    setSearchParams({});
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      {/* Header and Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted mb-1.5">
            <Link to="/student/dashboard" className="hover:text-navy transition-colors">
              Portal
            </Link>
            <span>/</span>
            <span className="text-ink">Quizzes</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            Quizzes &amp; Assessments
          </h1>
          <p className="text-sm text-muted mt-1 max-w-2xl leading-relaxed">
            Test your knowledge across enrolled subjects. Track live attempts, scheduled tests, and review past performance analytics.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-line shadow-card text-xs font-semibold text-muted self-start md:self-auto">
          <span className="w-2 h-2 rounded-full bg-orange animate-pulse" />
          <span className="text-ink">Term Evaluation Window Active</span>
        </div>
      </div>

      {/* Summary Metric Strip (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Live Now */}
        <div className="p-5 rounded-2xl bg-white border border-line shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted font-bold">
              Available Now
            </span>
            <div className="w-9 h-9 rounded-xl bg-orange/10 flex items-center justify-center text-orange">
              <Zap size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-ink">
              {String(totalLive).padStart(2, "0")}
            </span>
            <span className="text-xs font-semibold text-orange flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange animate-ping" />
              Active
            </span>
          </div>
          <span className="text-xs text-muted mt-1">Ready for submission</span>
        </div>

        {/* Card 2: Enrolled Courses */}
        <div className="p-5 rounded-2xl bg-white border border-line shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted font-bold">
              Enrolled Courses
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
              <Calendar size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-ink">
              {String(enrolledCourses.length).padStart(2, "0")}
            </span>
            <span className="text-xs font-medium text-muted">Subjects</span>
          </div>
          <span className="text-xs text-muted mt-1">Current term enrollment</span>
        </div>

        {/* Card 3: Completed */}
        <div className="p-5 rounded-2xl bg-white border border-line shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted font-bold">
              Completed
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-navy">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-ink">
              {String(totalCompleted).padStart(2, "0")}
            </span>
            <span className="text-xs font-semibold text-emerald-700">Graded</span>
          </div>
          <span className="text-xs text-muted mt-1">All rubrics released</span>
        </div>

        {/* Card 4: Average Score */}
        <div className="p-5 rounded-2xl bg-white border border-line shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted font-bold">
              Average Score
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <Award size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-ink">
              {averageScore}%
            </span>
            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-0.5">
              <TrendingUp size={14} /> Cumulative
            </span>
          </div>
          <span className="text-xs text-muted mt-1">Across submitted quizzes</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-line shadow-card flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === "all"
                  ? "bg-white text-ink shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              All Quizzes ({quizzes.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("live")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                statusFilter === "live"
                  ? "bg-white text-ink shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              <span>Available</span>
              <span className="w-2 h-2 rounded-full bg-orange animate-pulse" />
              <span>({totalLive})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("past")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === "past"
                  ? "bg-white text-ink shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              Completed ({totalCompleted})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("history")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === "history"
                  ? "bg-white text-ink shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              Attempt History ({historyData.pagination?.totalAttempts || 0})
            </button>
          </div>

          {/* Search & Course Selector */}
          {statusFilter !== "history" && (
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <div className="relative min-w-[220px] flex-1 sm:flex-initial">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Filter quiz topics..."
                  className="h-[38px] w-full rounded-xl border border-line bg-canvas pl-9 pr-3 text-xs text-ink outline-none transition placeholder:text-muted focus:border-navy focus:bg-white"
                />
              </div>

              <div className="relative min-w-[180px] flex-1 sm:flex-initial">
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="h-[38px] w-full appearance-none rounded-xl border border-line bg-canvas pl-3.5 pr-8 text-xs font-semibold text-ink outline-none cursor-pointer hover:bg-slate-100 transition"
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
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 rounded-2xl bg-white border border-line shadow-card text-center">
          <Loader2 size={36} className="animate-spin text-orange mb-3" />
          <p className="text-sm font-semibold text-ink">Loading enrolled quizzes...</p>
          <p className="text-xs text-muted mt-1">Connecting to authenticated courses</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-red-50 border border-red-200 text-center flex flex-col items-center">
          <AlertCircle size={36} className="text-red-500 mb-2" />
          <h3 className="font-display font-bold text-red-900 text-base">Error Loading Quizzes</h3>
          <p className="text-xs text-red-700 max-w-md mt-1">{error}</p>
          <button
            type="button"
            onClick={loadQuizzesData}
            className="mt-4 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Try Again</span>
          </button>
        </div>
      ) : statusFilter === "history" ? (
        /* ======================================================= */
        /* ATTEMPT HISTORY VIEW                                   */
        /* ======================================================= */
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-line shadow-card flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-ink text-lg">Quiz Submission History</h2>
              <p className="text-xs text-muted mt-0.5">
                Past assessment attempts, scores, and grade reports.
              </p>
            </div>
            {loadingHistory && <Loader2 size={18} className="animate-spin text-orange" />}
          </div>

          {historyData.attempts.length === 0 ? (
            <div className="p-12 text-center text-muted text-xs border border-dashed border-line rounded-xl">
              You have not submitted any quiz attempts yet.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-line">
                <table className="w-full text-left text-xs">
                  <thead className="bg-canvas border-b border-line text-muted uppercase font-bold text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Quiz &amp; Course</th>
                      <th className="py-3 px-4">Submitted At</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-center">Score</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {historyData.attempts.map((att) => (
                      <tr key={att.attemptId} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-ink">{att.quizTitle}</div>
                          <div className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
                            <span className="font-semibold">{att.courseCode}</span>
                            <span>•</span>
                            <span className="truncate max-w-xs">{att.courseTitle}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-muted">
                          {att.submittedAt
                            ? new Date(att.submittedAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "In Progress"}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              att.status === "SUBMITTED"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {att.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-ink">
                          {att.status === "SUBMITTED" ? (
                            <span>
                              {att.score} / {att.totalMarks}{" "}
                              <span className="text-[11px] font-normal text-muted">
                                ({att.percentage}%)
                              </span>
                            </span>
                          ) : (
                            <span className="text-muted font-normal text-[11px]">Pending</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {att.status === "SUBMITTED" ? (
                            <Link
                              to={`/student/quizzes/attempts/${att.attemptId}/result`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-navy hover:text-orange transition"
                            >
                              <Eye size={13} />
                              <span>View Rubric</span>
                            </Link>
                          ) : (
                            <Link
                              to={`/student/quizzes/${att.quizId}/attempt`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-orange hover:text-orange/80 transition"
                            >
                              <span>Resume</span>
                              <ArrowRight size={13} />
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* History Pagination */}
              {historyData.pagination?.totalPages > 1 && (
                <div className="flex items-center justify-between pt-2 text-xs">
                  <span className="text-muted">
                    Page {historyData.pagination.page} of {historyData.pagination.totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!historyData.pagination.hasPreviousPage || loadingHistory}
                      onClick={() => loadHistoryPage(historyPage - 1)}
                      className="px-3 py-1.5 rounded-xl border border-line text-xs font-semibold text-muted hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
                    >
                      <ChevronLeft size={14} />
                      <span>Previous</span>
                    </button>
                    <button
                      type="button"
                      disabled={!historyData.pagination.hasNextPage || loadingHistory}
                      onClick={() => loadHistoryPage(historyPage + 1)}
                      className="px-3 py-1.5 rounded-xl border border-line text-xs font-semibold text-muted hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
                    >
                      <span>Next</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : filteredQuizzes.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-line bg-white p-12 text-center shadow-card flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-muted flex items-center justify-center mb-3">
            <FileQuestion size={28} />
          </div>
          <h3 className="font-display text-lg font-bold text-ink">No quizzes found</h3>
          <p className="text-sm text-muted max-w-sm mt-1">
            No quizzes match your selected filter or search term.
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="mt-4 px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Reset Filters</span>
          </button>
        </div>
      ) : (
        /* Quizzes Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredQuizzes.map((quiz) => {
            const hasAttempted = Boolean(quiz.hasAttempted);

            return (
              <div
                key={quiz.id}
                className="p-5 rounded-2xl bg-white border border-line shadow-card flex flex-col justify-between hover:border-slate-300 transition duration-150 gap-4"
              >
                <div>
                  {/* Top Bar: Course Badge and Status Tag */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-bold tracking-wide">
                      {quiz.courseCode || "COURSE"}
                    </span>
                    {hasAttempted ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        <span>Completed ({quiz.latestPercentage}%)</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange/10 text-orange flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange animate-pulse" />
                        <span>Live / Available</span>
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-display font-bold text-ink text-base line-clamp-1">
                    {quiz.title}
                  </h3>
                  <p className="text-xs text-muted line-clamp-2 mt-1">
                    {quiz.description || "Course assessment evaluation."}
                  </p>

                  {/* Course Name */}
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-muted font-medium">
                    <BookOpen size={13} className="text-slate-400" />
                    <span className="truncate">{quiz.courseTitle}</span>
                  </div>

                  {/* Details Strip */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-t border-line/60 pt-3">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Clock size={14} className="text-slate-400" />
                      <span>{quiz.durationMinutes} mins</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Award size={14} className="text-slate-400" />
                      <span>{quiz.totalMarks} marks</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 col-span-2">
                      <FileQuestion size={14} className="text-slate-400" />
                      <span>
                        {quiz.questionCount} {quiz.questionCount === 1 ? "question" : "questions"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <div className="pt-3 border-t border-line/60">
                  {hasAttempted ? (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/student/quizzes/attempts/${quiz.attemptId}/result`)
                      }
                      className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-ink text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye size={14} />
                      <span>View Results &amp; Answers</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate(`/student/quizzes/${quiz.id}/attempt`)}
                      className="w-full py-2.5 rounded-xl bg-orange hover:bg-orange/90 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <span>
                        {quiz.attemptStatus === "IN_PROGRESS"
                          ? "Resume Assessment"
                          : "Start Assessment"}
                      </span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
