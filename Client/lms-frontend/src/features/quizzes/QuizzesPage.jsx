import { useState, useMemo, useEffect } from "react";
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
} from "lucide-react";
import { getMergedQuizzes, coursesData } from "../../data/mockLmsData";

export function QuizzesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [statusFilter, setStatusFilter] = useState("all"); // all | live | upcoming | past
  const [courseFilter, setCourseFilter] = useState("all");

  useEffect(() => {
    setSearchQuery(urlQuery);
  }, [urlQuery]);

  const allQuizzes = useMemo(() => {
    return getMergedQuizzes();
  }, []);

  // Filtered lists
  const filteredQuizzes = useMemo(() => {
    let list = [...allQuizzes];

    // Status filter
    if (statusFilter !== "all") {
      list = list.filter((q) => q.status === statusFilter);
    }

    // Course filter
    if (courseFilter !== "all") {
      list = list.filter((q) => q.courseId === courseFilter || q.courseCode === courseFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (quiz) =>
          quiz.title.toLowerCase().includes(q) ||
          quiz.courseName.toLowerCase().includes(q) ||
          quiz.courseCode.toLowerCase().includes(q) ||
          quiz.description?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [allQuizzes, statusFilter, courseFilter, searchQuery]);

  const liveQuizzes = filteredQuizzes.filter((q) => q.status === "live");
  const upcomingQuizzes = filteredQuizzes.filter((q) => q.status === "upcoming");
  const pastQuizzes = filteredQuizzes.filter((q) => q.status === "past");

  const totalLive = allQuizzes.filter((q) => q.status === "live").length;
  const totalUpcoming = allQuizzes.filter((q) => q.status === "upcoming").length;
  const totalPast = allQuizzes.filter((q) => q.status === "past").length;

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
            Test your knowledge across enrolled subjects. Track live attempts, upcoming scheduled tests, and review past performance analytics.
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
              Live Now
            </span>
            <div className="w-9 h-9 rounded-xl bg-orange/10 flex items-center justify-center text-orange">
              <Zap size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-ink">
              0{totalLive}
            </span>
            <span className="text-xs font-semibold text-orange flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange animate-ping" />
              Active Session
            </span>
          </div>
          <span className="text-xs text-muted mt-1">Requires immediate completion</span>
        </div>

        {/* Card 2: Upcoming */}
        <div className="p-5 rounded-2xl bg-white border border-line shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted font-bold">
              Upcoming
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
              <Calendar size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-ink">
              0{totalUpcoming}
            </span>
            <span className="text-xs font-medium text-muted">Next: Oct 24</span>
          </div>
          <span className="text-xs text-muted mt-1">Scheduled through mid-term</span>
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
              0{totalPast}
            </span>
            <span className="text-xs font-semibold text-emerald-700">100% Attempt Rate</span>
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
              91%
            </span>
            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-0.5">
              <TrendingUp size={14} /> Top 10%
            </span>
          </div>
          <span className="text-xs text-muted mt-1">CS Cohort Benchmark</span>
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
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === "all"
                  ? "bg-white text-ink shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              All Quizzes ({allQuizzes.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("live")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                statusFilter === "live"
                  ? "bg-white text-ink shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              <span>Live</span>
              <span className="w-2 h-2 rounded-full bg-orange animate-pulse" />
              <span>({totalLive})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("upcoming")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === "upcoming"
                  ? "bg-white text-ink shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              Upcoming ({totalUpcoming})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("past")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === "past"
                  ? "bg-white text-ink shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              Past / Results ({totalPast})
            </button>
          </div>

          {/* Search & Course Selector */}
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
                {coursesData.map((c) => (
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
        </div>
      </div>

      {/* No Results Fallback */}
      {filteredQuizzes.length === 0 ? (
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
            className="mt-4 px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition flex items-center gap-1.5 shadow-sm"
          >
            <RotateCcw size={14} />
            <span>Reset Filters</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* SECTION 1: LIVE QUIZZES */}
          {liveQuizzes.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange animate-pulse" />
                <h2 className="font-display text-lg font-bold text-ink">Live Quizzes</h2>
                <span className="px-2 py-0.5 rounded-full bg-orange/10 text-orange font-bold text-xs">
                  {liveQuizzes.length} Active
                </span>
              </div>

              <div className="flex flex-col gap-4">
                {liveQuizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="rounded-2xl border-2 border-orange/40 bg-white p-6 shadow-card hover:shadow-lift transition-all relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 bottom-0 w-2 bg-orange" />

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pl-2">
                      <div className="flex flex-col max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-navy text-white font-bold text-xs">
                            {quiz.courseCode}
                          </span>
                          <span className="text-xs font-semibold text-ink">
                            {quiz.courseName}
                          </span>
                          <span className="text-muted text-xs">•</span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-ink text-xs font-medium">
                            Single Attempt
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-medium">
                            Auto-submit enabled
                          </span>
                        </div>

                        <h3 className="font-display text-xl font-bold text-ink hover:text-orange transition-colors">
                          {quiz.title}
                        </h3>
                        <p className="text-xs text-muted mt-1 leading-relaxed">
                          {quiz.description}
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-100 bg-canvas p-3 rounded-xl">
                          <div>
                            <span className="text-[11px] text-muted block">Duration</span>
                            <span className="font-bold text-xs text-ink">{quiz.durationMinutes} Mins</span>
                          </div>
                          <div>
                            <span className="text-[11px] text-muted block">Questions</span>
                            <span className="font-bold text-xs text-ink">{quiz.totalQuestions} MCQs</span>
                          </div>
                          <div>
                            <span className="text-[11px] text-muted block">Total Marks</span>
                            <span className="font-bold text-xs text-ink">{quiz.totalMarks} Points</span>
                          </div>
                          <div>
                            <span className="text-[11px] text-muted block">Window Closes</span>
                            <span className="font-bold text-xs text-orange">{quiz.windowEnd}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={() => navigate(`/student/quizzes/${quiz.id}`)}
                          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-orange hover:bg-orange-hover text-white text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 shadow-sm"
                        >
                          <Zap size={16} />
                          <span>Start Assessment</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 2: UPCOMING QUIZZES */}
          {upcomingQuizzes.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-navy" />
                <h2 className="font-display text-lg font-bold text-ink">Upcoming Quizzes</h2>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-muted font-semibold text-xs">
                  {upcomingQuizzes.length} Scheduled
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingQuizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="rounded-2xl border border-line bg-white p-5 shadow-card hover:shadow-lift transition-all flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-navy text-xs font-bold">
                          {quiz.courseCode}
                        </span>
                        <span className="text-xs font-semibold text-orange">
                          {quiz.scheduledDate}
                        </span>
                      </div>

                      <h3 className="font-display text-base font-bold text-ink mb-1">
                        {quiz.title}
                      </h3>
                      <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                        {quiz.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-muted">
                      <span>{quiz.durationMinutes} Mins • {quiz.totalQuestions} Questions</span>
                      <button
                        type="button"
                        onClick={() => navigate(`/student/courses/${quiz.courseId}`)}
                        className="text-navy hover:text-orange font-semibold flex items-center gap-1 transition"
                      >
                        <span>Syllabus</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 3: PAST QUIZZES & RESULTS */}
          {pastQuizzes.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-700" />
                <h2 className="font-display text-lg font-bold text-ink">Past Quizzes &amp; Review</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold text-xs">
                  {pastQuizzes.length} Completed
                </span>
              </div>

              <div className="flex flex-col gap-4">
                {pastQuizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="rounded-2xl border border-line bg-white p-5 shadow-card hover:shadow-lift transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        <Award size={22} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-navy text-xs font-bold">
                            {quiz.courseCode}
                          </span>
                          <span className="text-xs text-muted">{quiz.courseName}</span>
                          <span className="text-muted text-xs">•</span>
                          <span className="text-xs text-muted">Completed {quiz.completedDate}</span>
                        </div>

                        <h4 className="font-display text-base font-bold text-ink truncate">
                          {quiz.title}
                        </h4>

                        <div className="flex items-center gap-3 text-xs text-muted mt-1">
                          <span className="font-bold text-emerald-700">
                            Final Score: {quiz.score}
                          </span>
                          <span>•</span>
                          <span>{quiz.totalQuestions} Questions</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(`/student/quizzes/${quiz.id}`)}
                      className="px-4 py-2 rounded-xl bg-canvas hover:bg-slate-200 text-ink text-xs font-semibold transition flex items-center gap-1.5 border border-line shrink-0"
                    >
                      <Eye size={14} />
                      <span>Review Results</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
