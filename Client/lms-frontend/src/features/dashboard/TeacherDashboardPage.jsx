import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  ClipboardList,
  Clock,
  Award,
  ChevronRight,
  FolderKanban,
  FileCheck2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  PlusCircle,
  Calendar,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../services/api";
import {
  MetricCardSkeleton,
  CourseCardSkeleton,
  AssignmentCardSkeleton,
} from "../../components/ui/Skeleton";

function formatDueDate(isoString) {
  if (!isoString) {
    return { formatted: "No deadline", timeLeft: "N/A", isPast: false };
  }
  const due = new Date(isoString);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const isPast = diffMs < 0;
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let timeLeft = "";
  if (isPast) {
    timeLeft = "Past deadline";
  } else if (daysLeft <= 2) {
    const hoursLeft = Math.ceil(diffMs / (1000 * 60 * 60));
    timeLeft = `${hoursLeft} hours left`;
  } else {
    timeLeft = `${daysLeft} days left`;
  }

  const formatted = due.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return { formatted, timeLeft, isPast };
}

export function TeacherDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissionsSummary, setSubmissionsSummary] = useState({
    pending: 0,
    graded: 0,
    total: 0,
    pendingList: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [nowTimestamp, setNowTimestamp] = useState(() => Date.now());
  const [reloadKey, setReloadKey] = useState(0);

  const refetchDashboard = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");
        setNowTimestamp(Date.now());

        // 1. Fetch all courses and filter by authenticated teacher ID
        const courseResponse = await api().get("/course/");
        const allCourses = courseResponse?.courses || [];

        const myCourses = allCourses.filter(
          (c) => Number(c.teacherId) === Number(user?.id)
        );

        if (cancelled) return;
        setCourses(myCourses);

        // 2. Fetch assignments concurrently for each owned course
        const assignmentPromises = myCourses.map(async (c) => {
          try {
            const aRes = await api().get(`/assignments/course/${c.id}`);
            return (aRes?.assignments || []).map((item) => ({
              ...item,
              course: c,
            }));
          } catch (e) {
            console.warn(`Could not fetch assignments for course ${c.id}:`, e.message);
            return [];
          }
        });

        const assignmentResults = await Promise.all(assignmentPromises);
        const assignmentsList = assignmentResults.flat();

        if (cancelled) return;
        setAssignments(assignmentsList);

        // 3. Fetch submissions concurrently across assignments
        const submissionPromises = assignmentsList.map(async (a) => {
          try {
            const subRes = await api().get(`/assignments/${a.id}/submissions`);
            const subs = subRes?.submissions || [];
            const pending = subs.filter((s) => s.status !== "GRADED");
            const graded = subs.filter((s) => s.status === "GRADED");

            return {
              assignment: a,
              total: subs.length,
              pendingCount: pending.length,
              gradedCount: graded.length,
              pendingSubmissions: pending,
            };
          } catch (e) {
            console.warn(`Could not fetch submissions for assignment ${a.id}:`, e.message);
            return {
              assignment: a,
              total: 0,
              pendingCount: 0,
              gradedCount: 0,
              pendingSubmissions: [],
            };
          }
        });

        const submissionResults = await Promise.all(submissionPromises);

        let pendingCount = 0;
        let gradedCount = 0;
        let totalSubmissions = 0;
        const pendingQueue = [];

        for (const item of submissionResults) {
          totalSubmissions += item.total;
          pendingCount += item.pendingCount;
          gradedCount += item.gradedCount;
          if (item.pendingCount > 0) {
            pendingQueue.push({
              assignment: item.assignment,
              pendingCount: item.pendingCount,
              pendingSubmissions: item.pendingSubmissions,
            });
          }
        }

        if (cancelled) return;
        setSubmissionsSummary({
          pending: pendingCount,
          graded: gradedCount,
          total: totalSubmissions,
          pendingList: pendingQueue,
        });
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load teacher dashboard data.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [user?.id, reloadKey]);

  // Derived upcoming assignments
  const upcomingAssignments = useMemo(() => {
    return [...assignments]
      .filter((a) => a.dueDate && new Date(a.dueDate).getTime() >= nowTimestamp)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 4);
  }, [assignments, nowTimestamp]);

  const teacherName = user?.name?.trim() || "Faculty Member";

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      {/* Welcome Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-navy-deep via-navy to-navy-hover p-6 sm:p-8 text-white shadow-card">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-orange/20 text-orange text-xs font-bold uppercase tracking-wider">
                Faculty Portal
              </span>
              {(user?.department || user?.email) && (
                <>
                  <span className="text-xs text-slate-300">•</span>
                  <span className="text-xs text-slate-300 truncate max-w-xs">
                    {user?.department || user?.email}
                  </span>
                </>
              )}
            </div>

            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Welcome back, {teacherName}!
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Monitor enrolled subjects, manage assignment releases, and review pending student submissions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <Link
              to="/teacher/submissions"
              className="px-5 py-2.5 rounded-xl bg-orange hover:bg-orange-hover text-white text-sm font-semibold shadow-sm transition-all flex items-center gap-2"
            >
              <FileCheck2 size={18} />
              <span>Review Submissions</span>
            </Link>

            <Link
              to="/teacher/courses"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all flex items-center gap-2"
            >
              <FolderKanban size={18} />
              <span>Manage Courses</span>
            </Link>
          </div>
        </div>

        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-orange/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 top-0 -translate-y-8 w-48 h-48 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />
      </section>

      {/* Dashboard Metrics (4 Real-Time Faculty Stats) */}
      {loading ? (
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </section>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {/* Metric 1: Courses Taught */}
        <div className="rounded-2xl border border-line bg-white p-5 sm:p-6 shadow-card hover:shadow-lift transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Managed Courses
            </span>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-navy">
              <BookOpen size={20} />
            </div>
          </div>

          <div className="mt-4 flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-extrabold text-ink">
                {loading ? "..." : courses.length}
              </span>
              <span className="text-sm font-medium text-muted">Courses</span>
            </div>

            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-navy font-semibold">
              Assigned
            </span>
          </div>

          <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-navy h-full rounded-full w-full" />
          </div>
        </div>

        {/* Metric 2: Published Assignments */}
        <div className="rounded-2xl border border-line bg-white p-5 sm:p-6 shadow-card hover:shadow-lift transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Coursework Tasks
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
              <ClipboardList size={20} />
            </div>
          </div>

          <div className="mt-4 flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-extrabold text-ink">
                {loading ? "..." : assignments.length}
              </span>
              <span className="text-sm font-medium text-muted">Assignments</span>
            </div>

            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
              Live in Portal
            </span>
          </div>

          <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full w-full" />
          </div>
        </div>

        {/* Metric 3: Submissions Awaiting Grading */}
        <div className="rounded-2xl border border-line bg-white p-5 sm:p-6 shadow-card hover:shadow-lift transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Pending Grading
            </span>
            <div className="w-10 h-10 rounded-xl bg-orange/10 flex items-center justify-center text-orange">
              <Clock size={20} />
            </div>
          </div>

          <div className="mt-4 flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-extrabold text-ink">
                {loading ? "..." : submissionsSummary.pending}
              </span>
              <span className="text-sm font-medium text-muted">Submissions</span>
            </div>

            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                submissionsSummary.pending > 0
                  ? "bg-orange-100 text-orange-800"
                  : "bg-slate-100 text-muted"
              }`}
            >
              {submissionsSummary.pending > 0 ? "Action needed" : "All graded"}
            </span>
          </div>

          <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-orange h-full rounded-full transition-all"
              style={{
                width:
                  submissionsSummary.total > 0
                    ? `${(submissionsSummary.pending / submissionsSummary.total) * 100}%`
                    : "0%",
              }}
            />
          </div>
        </div>

        {/* Metric 4: Graded Submissions */}
        <div className="rounded-2xl border border-line bg-white p-5 sm:p-6 shadow-card hover:shadow-lift transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Graded Submissions
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <Award size={20} />
            </div>
          </div>

          <div className="mt-4 flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-extrabold text-ink">
                {loading ? "..." : submissionsSummary.graded}
              </span>
              <span className="text-sm font-medium text-muted">Evaluated</span>
            </div>

            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
              Synced
            </span>
          </div>

          <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full w-full" />
          </div>
        </div>
      </section>
      )}

      {/* Error State with Retry */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-white border border-line shadow-card text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-error flex items-center justify-center mb-3">
            <AlertCircle size={28} />
          </div>
          <h3 className="font-display text-lg font-bold text-ink">Failed to load dashboard data</h3>
          <p className="text-sm text-muted max-w-sm mt-1">{error}</p>
          <button
            type="button"
            onClick={refetchDashboard}
            className="mt-4 px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition flex items-center gap-1.5 shadow-sm"
          >
            <RotateCcw size={14} />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Main Content Layout */}
      {!error && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column (8 cols): Courses & Assignments */}
          <div className="lg:col-span-8 flex flex-col gap-6 lg:gap-8">
            {/* Section 1: Assigned Courses */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-navy/5 text-navy">
                    <FolderKanban size={20} />
                  </div>
                  <h2 className="font-display text-xl font-bold text-ink">
                    My Assigned Courses
                  </h2>
                </div>

                <Link
                  to="/teacher/courses"
                  className="text-xs sm:text-sm font-semibold text-navy hover:text-orange transition-colors flex items-center gap-1"
                >
                  Manage All <ChevronRight size={16} />
                </Link>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CourseCardSkeleton />
                  <CourseCardSkeleton />
                </div>
              ) : courses.length === 0 ? (
                <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-card">
                  <BookOpen className="mx-auto mb-3 text-muted" size={28} />
                  <p className="text-sm font-semibold text-ink">No courses assigned</p>
                  <p className="mt-1 text-xs text-muted">
                    You have not been assigned as instructor for any course in the academic registry.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="rounded-2xl border border-line bg-white p-5 shadow-card hover:shadow-lift transition-all flex flex-col justify-between group"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-navy text-white text-xs font-bold">
                            {course.code}
                          </span>
                          <span className="text-xs font-semibold text-muted">
                            {course.credits} Credits
                          </span>
                        </div>

                        <div>
                          <h3 className="font-display text-base font-bold text-ink group-hover:text-orange transition-colors line-clamp-1">
                            {course.title}
                          </h3>
                          <p className="text-xs text-muted mt-1 line-clamp-2 leading-relaxed">
                            {course.description || "Comprehensive subject curriculum."}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                        <span className="text-xs text-muted font-medium">
                          {course.schedule || "Schedule active"}
                        </span>

                        <button
                          type="button"
                          onClick={() => navigate(`/teacher/courses/${course.id}`)}
                          className="px-3.5 py-1.5 rounded-lg bg-canvas hover:bg-navy hover:text-white text-navy text-xs font-semibold transition flex items-center gap-1 border border-line"
                        >
                          <span>Course Hub</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Section 2: Recent Coursework & Assignments */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-orange/10 text-orange">
                    <ClipboardList size={20} />
                  </div>
                  <h2 className="font-display text-xl font-bold text-ink">
                    Published Assignments
                  </h2>
                </div>

                <Link
                  to="/teacher/assignments"
                  className="text-xs sm:text-sm font-semibold text-navy hover:text-orange transition-colors flex items-center gap-1"
                >
                  View All <ChevronRight size={16} />
                </Link>
              </div>

              {loading ? (
                <div className="flex flex-col gap-3">
                  <AssignmentCardSkeleton />
                  <AssignmentCardSkeleton />
                </div>
              ) : assignments.length === 0 ? (
                <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-card">
                  <ClipboardList className="mx-auto mb-3 text-muted" size={28} />
                  <p className="text-sm font-semibold text-ink">No assignments published</p>
                  <p className="mt-1 text-xs text-muted">
                    Create assignments directly from your course page to engage enrolled students.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {assignments.slice(0, 5).map((a) => {
                    const dateMeta = formatDueDate(a.dueDate);
                    return (
                      <div
                        key={a.id}
                        className="rounded-2xl border border-line bg-white p-4 sm:p-5 shadow-card hover:shadow-lift transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-navy flex-shrink-0 mt-0.5">
                            <ClipboardList size={20} />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-navy">
                                {a.course?.code || "Course"}
                              </span>
                              <span className="text-xs text-muted truncate">
                                {a.course?.title}
                              </span>
                            </div>

                            <h4 className="font-display text-sm sm:text-base font-bold text-ink truncate">
                              {a.title}
                            </h4>

                            <div className="flex items-center gap-2.5 text-xs text-muted mt-1.5 flex-wrap">
                              <span>Due: {dateMeta.formatted}</span>
                              <span>•</span>
                              <span className={dateMeta.isPast ? "text-muted" : "text-orange font-semibold"}>
                                {dateMeta.timeLeft}
                              </span>
                              <span>•</span>
                              <span>{a.totalPoints || 100} Points</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                          <Link
                            to={`/teacher/submissions`}
                            className="px-3.5 py-1.5 rounded-lg bg-orange hover:bg-orange-hover text-white text-xs font-semibold transition flex items-center gap-1 shadow-xs"
                          >
                            <span>Submissions</span>
                            <ArrowRight size={13} />
                          </Link>

                          {a.course?.id && (
                            <Link
                              to={`/teacher/courses/${a.course.id}`}
                              className="px-3 py-1.5 rounded-lg bg-canvas hover:bg-slate-200 text-ink text-xs font-medium border border-line transition"
                            >
                              Edit
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Right Column (4 cols): Queue & Actions */}
          <aside className="lg:col-span-4 flex flex-col gap-6 w-full">
            {/* Grading Queue Card */}
            <div className="rounded-2xl border border-line bg-white p-5 shadow-card flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileCheck2 size={18} className="text-orange" />
                  <h3 className="font-display text-sm font-bold text-ink">
                    Grading Queue
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-xs font-bold">
                  {submissionsSummary.pending} Pending
                </span>
              </div>

              {loading ? (
                <div className="flex flex-col gap-2.5">
                  <AssignmentCardSkeleton />
                </div>
              ) : submissionsSummary.pendingList.length === 0 ? (
                <div className="p-4 rounded-xl bg-canvas border border-line/60 text-center">
                  <p className="text-xs font-semibold text-ink">Queue is clear</p>
                  <p className="text-[11px] text-muted mt-0.5">
                    No submitted coursework is awaiting evaluation at this time.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {submissionsSummary.pendingList.map(({ assignment, pendingCount }) => (
                    <div
                      key={assignment.id}
                      className="p-3.5 rounded-xl bg-canvas border border-line/60 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-ink truncate">
                          {assignment.title}
                        </p>
                        <p className="text-[11px] text-muted truncate">
                          {assignment.course?.code} • {pendingCount} submission(s) to grade
                        </p>
                      </div>

                      <Link
                        to="/teacher/submissions"
                        className="px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition shrink-0"
                      >
                        Grade
                      </Link>
                    </div>
                  ))}
                </div>
              )}

              <Link
                to="/teacher/submissions"
                className="w-full py-2.5 rounded-xl bg-canvas hover:bg-slate-100 text-navy text-xs font-bold text-center border border-line transition block"
              >
                Open Grading Center →
              </Link>
            </div>

            {/* Quick Actions Card */}
            <div className="rounded-2xl border border-line bg-white p-5 shadow-card flex flex-col gap-3">
              <h3 className="font-display text-sm font-bold text-ink pb-2 border-b border-slate-100">
                Faculty Actions
              </h3>

              <button
                type="button"
                onClick={() => {
                  if (courses.length > 0) {
                    navigate(`/teacher/courses/${courses[0].id}`);
                  } else {
                    navigate("/teacher/courses");
                  }
                }}
                className="w-full p-3 rounded-xl bg-canvas hover:bg-slate-100 text-left border border-line/60 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <PlusCircle size={18} className="text-orange" />
                  <div>
                    <p className="text-xs font-bold text-ink">Create New Assignment</p>
                    <p className="text-[11px] text-muted">Add prompt to course hub</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted group-hover:text-ink transition-colors" />
              </button>

              <Link
                to="/teacher/courses"
                className="w-full p-3 rounded-xl bg-canvas hover:bg-slate-100 text-left border border-line/60 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <FolderKanban size={18} className="text-navy" />
                  <div>
                    <p className="text-xs font-bold text-ink">Manage Course Details</p>
                    <p className="text-[11px] text-muted">Update syllabus, hours &amp; goals</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted group-hover:text-ink transition-colors" />
              </Link>
            </div>

            {/* Upcoming Deadlines Widget */}
            <div className="rounded-2xl border border-line bg-white p-5 shadow-card flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Calendar size={16} className="text-navy" />
                <h3 className="font-display text-sm font-bold text-ink">
                  Upcoming Deadlines
                </h3>
              </div>

              {upcomingAssignments.length === 0 ? (
                <p className="text-xs text-muted p-2">
                  No upcoming deadlines scheduled across your courses.
                </p>
              ) : (
                <div className="space-y-2">
                  {upcomingAssignments.map((a) => {
                    const dateMeta = formatDueDate(a.dueDate);
                    return (
                      <div
                        key={a.id}
                        className="p-2.5 rounded-lg bg-canvas border border-line/40 flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-ink truncate">{a.title}</p>
                          <p className="text-[11px] text-muted">{a.course?.code}</p>
                        </div>
                        <span className="font-bold text-orange whitespace-nowrap">
                          {dateMeta.timeLeft}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
