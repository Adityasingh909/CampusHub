
import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import {
  AlarmClock,
  CalendarDays,
  BookOpen,
  ClipboardList,
  FileQuestion,
  ChevronRight,
  PlayCircle,
  Upload,
  ArrowRight,
  CheckCircle2,
  Award,
  BookMarked,
  Sparkles,
} from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import {
  MetricCardSkeleton,
  CourseCardSkeleton,
  AssignmentCardSkeleton,
} from "../../components/ui/Skeleton";

export function StudentDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [deadlineTab, setDeadlineTab] = useState("active");
  const [timetableOpen, setTimetableOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboard() {
      try {
        setDashboardLoading(true);
        setDashboardError("");

        const [dashRes, assignRes] = await Promise.all([
          api().get("/dashboard/student"),
          api().get("/assignments/student").catch(() => ({ assignments: [] })),
        ]);

        if (!dashRes?.success) {
          throw new Error(
            dashRes?.message || "Failed to load dashboard."
          );
        }

        if (!cancelled) {
          setDashboardData(dashRes);
          setAssignments(assignRes?.assignments || []);
        }
      } catch (error) {
        if (!cancelled) {
          setDashboardError(
            error.message || "Failed to load dashboard."
          );
        }
      } finally {
        if (!cancelled) {
          setDashboardLoading(false);
        }
      }
    }

    fetchDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const student = dashboardData?.student;
  const stats = dashboardData?.stats;

  const recentCourses = useMemo(() => {
    return (dashboardData?.courses ?? [])
      .slice(0, 3)
      .map((enrollment) => ({
        ...enrollment.course,
        progress: enrollment.progress ?? 0,
        instructor:
          enrollment.course?.teacher?.name ||
          enrollment.course?.instructor ||
          "Instructor not assigned",
      }));
  }, [dashboardData]);

  const pendingAssignments = useMemo(() => {
    return assignments.filter(
      (a) => a.submissionStatus === "PENDING" || (!a.submissionStatus && !a.mySubmission)
    );
  }, [assignments]);

  const completedAssignments = useMemo(() => {
    return assignments.filter(
      (a) => a.submissionStatus === "SUBMITTED" || a.submissionStatus === "GRADED"
    );
  }, [assignments]);

  const gradedAssignments = useMemo(() => {
    return assignments.filter(
      (a) => a.submissionStatus === "GRADED" && a.mySubmission?.score != null && a.totalPoints > 0
    );
  }, [assignments]);

  const averageScore = useMemo(() => {
    if (gradedAssignments.length === 0) return null;
    const sum = gradedAssignments.reduce(
      (acc, a) => acc + (a.mySubmission.score / a.totalPoints) * 100,
      0
    );
    return Math.round(sum / gradedAssignments.length);
  }, [gradedAssignments]);

  const activeDeadlines = useMemo(() => {
    return [...pendingAssignments].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  }, [pendingAssignments]);

  const completedDeadlines = useMemo(() => {
    return [...completedAssignments].sort(
      (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
    );
  }, [completedAssignments]);

  const activityFeed = useMemo(() => {
    return completedAssignments.slice(0, 4).map((a) => ({
      id: a.id,
      title:
        a.submissionStatus === "GRADED"
          ? `Graded: ${a.title}`
          : `Submitted: ${a.title}`,
      detail:
        a.submissionStatus === "GRADED"
          ? `Score: ${a.mySubmission?.score ?? "—"}/${a.totalPoints} points`
          : a.course?.code
          ? `${a.course.code} — Submitted`
          : "Submission received",
      time: a.mySubmission?.submittedAt
        ? new Date(a.mySubmission.submittedAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })
        : "Recently",
    }));
  }, [completedAssignments]);

  const upcomingQuizzes = [];

  const deadlinesToShow =
    deadlineTab === "active"
      ? activeDeadlines
      : completedDeadlines;

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      {/* Welcome Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-navy-deep via-navy to-navy-hover p-6 sm:p-8 text-white shadow-card">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.name?.trim().split(/\s+/)[0] || student?.name?.trim().split(/\s+/)[0] || "Student"}!
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {dashboardError
                ? dashboardError
                : "Here's what's happening with your learning journey."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <a
              href="#deadlines"
              className="px-5 py-2.5 rounded-lg bg-orange hover:bg-orange-hover text-white text-sm font-semibold shadow-sm transition-all flex items-center gap-2"
            >
              <AlarmClock size={18} />
              <span>View Deadlines</span>
            </a>

            <button
              type="button"
              onClick={() => setTimetableOpen(true)}
              className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all flex items-center gap-2"
            >
              <CalendarDays size={18} />
              <span>My Timetable</span>
            </button>
          </div>
        </div>

        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-orange/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 top-0 -translate-y-8 w-48 h-48 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />
      </section>

      {/* Dashboard Metrics */}
      {dashboardLoading ? (
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </section>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          {/* Enrolled Courses */}
          <div className="rounded-2xl border border-line bg-white p-5 sm:p-6 shadow-card hover:shadow-lift transition-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Enrolled Courses
              </span>
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-navy">
                <BookOpen size={20} />
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl font-extrabold text-ink">
                  {stats?.totalEnrolled ?? 0}
                </span>
                <span className="text-sm font-medium text-muted">
                  Enrolled
                </span>
              </div>

              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-navy font-semibold">
                {`${stats?.inProgress ?? 0} In Progress`}
              </span>
            </div>

            <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-navy h-full rounded-full w-full" />
            </div>
          </div>

          {/* Pending Assignments */}
          <div className="rounded-2xl border border-line bg-white p-5 sm:p-6 shadow-card hover:shadow-lift transition-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Pending Assignments
              </span>
              <div className="w-10 h-10 rounded-xl bg-orange/10 flex items-center justify-center text-orange">
                <ClipboardList size={20} />
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl font-extrabold text-ink">
                  {pendingAssignments.length}
                </span>
                <span className="text-sm font-medium text-muted">
                  Due
                </span>
              </div>

              <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange/10 text-orange font-semibold">
                {`${completedAssignments.length} Submitted`}
              </span>
            </div>

            <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-orange h-full rounded-full transition-all duration-500"
                style={{
                  width: `${
                    assignments.length > 0
                      ? Math.round(
                          (completedAssignments.length / assignments.length) * 100
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          {/* Upcoming Quizzes */}
          <div className="rounded-2xl border border-line bg-white p-5 sm:p-6 shadow-card hover:shadow-lift transition-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Upcoming Quizzes
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
                <FileQuestion size={20} />
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between gap-2">
              <span className="font-display text-3xl font-extrabold text-ink">
                —
              </span>
              <span className="text-sm font-medium text-muted">
                Not available
              </span>
            </div>

            <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden" />
          </div>

          {/* Academic Progress */}
          <div className="rounded-2xl border border-line bg-white p-5 sm:p-6 shadow-card hover:shadow-lift transition-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Academic Progress
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
                <Award size={20} />
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl font-extrabold text-ink">
                  {averageScore != null
                    ? `${averageScore}%`
                    : "—"}
                </span>
                <span className="text-sm font-medium text-muted">
                  Average
                </span>
              </div>

              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                {gradedAssignments.length > 0
                  ? `${gradedAssignments.length} Graded`
                  : "No grades yet"}
              </span>
            </div>

            <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${averageScore != null ? Math.min(100, Math.max(0, averageScore)) : 0}%`,
                }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column */}
        <div className="lg:col-span-8 flex flex-col gap-6 lg:gap-8">
          {/* Recently Accessed Courses */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-navy/5 text-navy">
                  <BookMarked size={20} />
                </div>
                <h2 className="font-display text-xl font-bold text-ink">
                  Recently Accessed Courses
                </h2>
              </div>

              <Link
                to="/student/courses"
                className="text-xs sm:text-sm font-semibold text-navy hover:text-orange transition-colors flex items-center gap-1"
              >
                View All <ChevronRight size={16} />
              </Link>
            </div>

            {dashboardLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CourseCardSkeleton />
                <CourseCardSkeleton />
                <CourseCardSkeleton />
              </div>
            ) : recentCourses.length === 0 ? (
              <div className="rounded-2xl border border-line bg-white p-8 text-center">
                <BookOpen
                  className="mx-auto mb-3 text-muted"
                  size={28}
                />
                <p className="text-sm font-semibold text-ink">
                  No enrolled courses yet
                </p>
                <p className="mt-1 text-xs text-muted">
                  Enroll in a course to see it on your dashboard.
                </p>
                <Link
                  to="/student/courses"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-navy"
                >
                  Browse courses <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentCourses.map((course) => (
                  <div
                    key={course.id}
                    className="rounded-2xl border border-line bg-white p-4 shadow-card hover:shadow-lift transition-all flex flex-col justify-between group"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="w-full h-32 rounded-xl bg-slate-100 overflow-hidden relative flex items-center justify-center">
                        {course.thumbnail ? (
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <BookOpen
                            size={32}
                            className="text-navy/50"
                          />
                        )}

                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-navy/85 backdrop-blur-sm text-white text-xs font-semibold">
                          {course.code}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-display text-base font-bold text-ink group-hover:text-orange transition-colors line-clamp-1">
                          {course.title}
                        </h3>
                        <p className="text-xs text-muted mt-0.5">
                          {course.instructor}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs text-muted">
                        <span>Progress</span>
                        <span className="font-bold text-ink">
                          {course.progress}%
                        </span>
                      </div>

                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-orange h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(0, course.progress)
                            )}%`,
                          }}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/student/courses/${course.id}`)
                        }
                        className="mt-2 w-full py-2 px-3 rounded-lg bg-canvas hover:bg-navy hover:text-white text-navy text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                      >
                        Continue <PlayCircle size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Upcoming Deadlines */}
          <section className="flex flex-col gap-4" id="deadlines">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-orange/10 text-orange">
                  <AlarmClock size={20} />
                </div>
                <h2 className="font-display text-xl font-bold text-ink">
                  Upcoming Deadlines
                </h2>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setDeadlineTab("active")}
                  className={`px-3 py-1 text-xs rounded-md font-semibold transition ${
                    deadlineTab === "active"
                      ? "bg-white text-ink shadow-sm"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  Active ({activeDeadlines.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDeadlineTab("completed")}
                  className={`px-3 py-1 text-xs rounded-md font-semibold transition ${
                    deadlineTab === "completed"
                      ? "bg-white text-ink shadow-sm"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  Completed ({completedDeadlines.length})
                </button>
              </div>
            </div>

            {dashboardLoading ? (
              <div className="flex flex-col gap-3">
                <AssignmentCardSkeleton />
                <AssignmentCardSkeleton />
              </div>
            ) : deadlinesToShow.length === 0 ? (
              <div className="rounded-2xl border border-line bg-white p-8 text-center text-muted">
                {deadlineTab === "active"
                  ? "No active deadlines. You're all caught up!"
                  : "No completed assignments yet."}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {deadlinesToShow.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-line bg-white p-4 sm:p-5 shadow-card hover:shadow-lift transition-shadow flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.course?.code && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-navy/10 text-navy">
                            {item.course.code}
                          </span>
                        )}
                        <Link
                          to={`/student/assignments/${item.id}`}
                          className="font-semibold text-ink hover:text-orange transition-colors truncate"
                        >
                          {item.title}
                        </Link>
                      </div>
                      <p className="text-xs text-muted mt-1">
                        Due:{" "}
                        {item.dueDate
                          ? new Date(item.dueDate).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : "No due date"}
                      </p>
                    </div>

                    <Link
                      to={`/student/assignments/${item.id}`}
                      className="px-4 py-2 rounded-lg bg-orange hover:bg-orange-hover text-white text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap"
                    >
                      {item.submissionStatus === "GRADED" ? (
                        "View Grade"
                      ) : item.submissionStatus === "SUBMITTED" ? (
                        "View Submission"
                      ) : (
                        <>
                          <Upload size={14} /> Submit
                        </>
                      )}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Sidebar */}
        <aside className="lg:col-span-4 flex flex-col gap-6 w-full">
          {/* Timetable */}
          <div className="rounded-2xl border border-line bg-white p-5 shadow-card flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <CalendarDays size={18} className="text-navy" />
              <h3 className="font-display text-sm font-bold text-ink">
                My Timetable
              </h3>
            </div>

            <p className="text-xs text-muted">
              Course schedules will appear here once they are configured.
            </p>

            <button
              type="button"
              onClick={() => setTimetableOpen(true)}
              className="w-full rounded-lg bg-canvas hover:bg-slate-100 text-navy text-sm font-semibold py-2.5"
            >
              View Timetable
            </button>
          </div>

          {/* Upcoming Quizzes */}
          <div className="rounded-2xl border border-line bg-white p-5 shadow-card flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-ink">
                Upcoming Quizzes
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                {upcomingQuizzes.length} pending
              </span>
            </div>

            {upcomingQuizzes.length === 0 ? (
              <p className="rounded-xl bg-canvas p-4 text-xs text-muted">
                Quiz data is not available yet.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {upcomingQuizzes.slice(0, 2).map((quiz) => (
                  <div
                    key={quiz.id}
                    className="p-3 rounded-xl bg-canvas border border-line/60 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-ink">
                        {quiz.courseCode}: {quiz.title}
                      </p>
                      <p className="text-[11px] text-muted">
                        {quiz.durationMinutes} mins
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/student/quizzes/${quiz.id}`)
                      }
                      className="px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-semibold"
                    >
                      Start
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl border border-line bg-white p-5 shadow-card flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-ink">
                Recent Activity
              </h3>
              <span className="text-xs text-muted flex items-center gap-1">
                <Sparkles size={14} className="text-orange" />
                Activity
              </span>
            </div>

            {activityFeed.length === 0 ? (
              <p className="text-xs text-muted">
                Your recent learning activity will appear here when available.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {activityFeed.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3"
                  >
                    <div className="w-5 h-5 rounded-full bg-navy text-white flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 size={13} />
                    </div>
                    <div className="flex flex-col text-xs min-w-0">
                      <span className="font-semibold text-ink">
                        {activity.title}
                      </span>
                      <span className="text-muted mt-0.5">
                        {activity.detail}
                      </span>
                      <span className="text-slate-400 text-[10px] mt-0.5">
                        {activity.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Timetable Modal */}
      <Modal
        open={timetableOpen}
        onClose={() => setTimetableOpen(false)}
        title="My Academic Timetable"
      >
        <div className="space-y-4 text-sm">
          <p className="text-xs text-muted">
            Your timetable will show the schedules of your enrolled courses.
          </p>

          <div className="divide-y divide-slate-100 border rounded-xl overflow-hidden">
            {recentCourses.length === 0 ? (
              <p className="p-4 text-xs text-muted">
                No enrolled courses are available for the timetable yet.
              </p>
            ) : (
              recentCourses.map((course) => (
                <div
                  key={course.id}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-canvas"
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-navy">
                        {course.code}
                      </span>
                      <span className="font-semibold text-ink">
                        {course.title}
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      {course.schedule || "Schedule not set"}
                    </p>
                  </div>

                  <span className="text-xs font-semibold text-muted whitespace-nowrap">
                    {course.credits} Credits
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
