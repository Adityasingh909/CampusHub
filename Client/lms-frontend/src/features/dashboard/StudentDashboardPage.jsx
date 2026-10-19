import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlarmClock,
  CalendarDays,
  BookOpen,
  ClipboardList,
  FileQuestion,
  TrendingUp,
  ChevronRight,
  PlayCircle,
  Upload,
  ArrowRight,
  Edit3,
  ChevronLeft,
  Database,
  Cpu,
  RefreshCw,
  CheckCircle2,
  Award,
  BookMarked,
  Sparkles,
} from "lucide-react";
import {
  currentUser,
  coursesData,
  assignmentsData,
  quizzesData,
  activityFeed,
} from "../../data/mockLmsData";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";

export function StudentDashboardPage() {
  const navigate = useNavigate();
  const [deadlineTab, setDeadlineTab] = useState("active");
  const [timetableOpen, setTimetableOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState("October 2026");

  const recentCourses = coursesData.slice(0, 3);
  const activeDeadlines = assignmentsData.filter(
    (item) => item.status !== "Graded" && item.status !== "Submitted"
  );
  const completedDeadlines = assignmentsData.filter(
    (item) => item.status === "Graded" || item.status === "Submitted"
  );
  const deadlinesToShow =
    deadlineTab === "active" ? activeDeadlines : completedDeadlines;

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      {/* Hero / Welcome Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-navy-deep via-navy to-navy-hover p-6 sm:p-8 text-white shadow-card">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-slate-200 w-fit text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-orange animate-pulse" />
              <span className="tracking-wide uppercase">
                Fall Semester 2026 • 85% weekly target completed
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Welcome back, {currentUser.name.split(" ")[0]}!
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Here&apos;s what&apos;s happening with your learning journey. You have 3 deadlines approaching this week.
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

        {/* Decorative ambient backdrop accents */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-orange/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 top-0 -translate-y-8 w-48 h-48 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />
      </section>

      {/* Key Metrics Summary Grid (4 Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Enrolled Courses */}
        <div className="rounded-2xl border border-line bg-white p-5 sm:p-6 shadow-card hover:shadow-lift transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Enrolled Courses
            </span>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-navy">
              <BookOpen size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-extrabold text-ink">
                {currentUser.stats.enrolledCourses}
              </span>
              <span className="text-sm font-medium text-muted">Active</span>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-navy font-semibold">
              {currentUser.stats.activeLabs} Labs
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-navy h-full rounded-full w-full" />
          </div>
        </div>

        {/* Card 2: Pending Assignments */}
        <div className="rounded-2xl border border-line bg-white p-5 sm:p-6 shadow-card hover:shadow-lift transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Pending Assignments
            </span>
            <div className="w-10 h-10 rounded-xl bg-orange/10 flex items-center justify-center text-orange">
              <ClipboardList size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-extrabold text-ink">
                {currentUser.stats.pendingAssignments}
              </span>
              <span className="text-sm font-semibold text-orange">Due This Week</span>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 font-semibold">
              {currentUser.stats.urgentDeadlines} Urgent
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-orange h-full rounded-full w-3/4" />
          </div>
        </div>

        {/* Card 3: Upcoming Quizzes */}
        <div className="rounded-2xl border border-line bg-white p-5 sm:p-6 shadow-card hover:shadow-lift transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Upcoming Quizzes
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
              <FileQuestion size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-extrabold text-ink">
                {currentUser.stats.upcomingQuizzes}
              </span>
              <span className="text-sm font-medium text-muted">Scheduled</span>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
              Oct 24 - 28
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full w-1/2" />
          </div>
        </div>

        {/* Card 4: Academic Progress */}
        <div className="rounded-2xl border border-line bg-white p-5 sm:p-6 shadow-card hover:shadow-lift transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Academic Progress
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <Award size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-extrabold text-ink">
                {currentUser.stats.academicProgress}%
              </span>
              <span className="text-sm font-semibold text-muted">
                Grade: {currentUser.stats.currentGrade}
              </span>
            </div>
            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-0.5">
              <TrendingUp size={14} /> {currentUser.stats.gpaTrend}
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full w-[82%]" />
          </div>
        </div>
      </section>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6 lg:gap-8">
          {/* Recently Accessed Courses */}
          <div className="flex flex-col gap-4">
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
                <span>View All</span>
                <ChevronRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentCourses.map((course) => (
                <div
                  key={course.id}
                  className="rounded-2xl border border-line bg-white p-4 shadow-card hover:shadow-lift transition-all flex flex-col justify-between group"
                >
                  <div className="flex flex-col gap-3">
                    <div className="w-full h-32 rounded-xl bg-slate-100 overflow-hidden relative flex items-center justify-center">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-navy/85 backdrop-blur-sm text-white text-xs font-semibold">
                        {course.code}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display text-base font-bold text-ink group-hover:text-orange transition-colors line-clamp-1">
                        {course.title}
                      </h3>
                      <p className="text-xs text-muted mt-0.5">{course.instructor}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs text-muted">
                      <span>Progress</span>
                      <span className="font-bold text-ink">{course.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-orange h-full rounded-full transition-all duration-500"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/student/courses/${course.id}`)}
                      className="mt-2 w-full py-2 px-3 rounded-lg bg-canvas hover:bg-navy hover:text-white text-navy text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Continue</span>
                      <PlayCircle size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Deadlines & Tasks Section */}
          <div className="flex flex-col gap-4" id="deadlines">
            <div className="flex items-center justify-between">
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

            <div className="flex flex-col gap-3">
              {deadlinesToShow.length === 0 ? (
                <div className="rounded-2xl border border-line bg-white p-8 text-center text-muted">
                  No deadlines found in this category.
                </div>
              ) : (
                deadlinesToShow.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-line bg-white p-4 sm:p-5 shadow-card hover:shadow-lift transition-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center ${
                          item.status === "Urgent"
                            ? "bg-orange-100 text-orange-700"
                            : item.status === "Graded"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-navy"
                        }`}
                      >
                        {item.status === "Urgent" ? (
                          <AlarmClock size={22} />
                        ) : item.status === "Graded" ? (
                          <CheckCircle2 size={22} />
                        ) : (
                          <ClipboardList size={22} />
                        )}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            to={`/student/assignments/${item.id}`}
                            className="font-display text-sm sm:text-base font-bold text-ink hover:text-orange transition-colors truncate"
                          >
                            {item.title}
                          </Link>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-navy text-[11px] font-semibold">
                            {item.courseCode}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-muted text-xs mt-1 flex-wrap">
                          <span className="flex items-center gap-1 font-medium text-ink">
                            <span className="text-orange font-bold">Due:</span> {item.dueDate}
                          </span>
                          <span>•</span>
                          <span className="text-orange font-semibold">{item.timeLeft}</span>
                          <span>•</span>
                          <span>Weight: {item.weight}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {item.status === "Urgent" ? (
                        <Badge tone="error" dot>Urgent</Badge>
                      ) : item.status === "Graded" ? (
                        <Badge tone="success" dot>Graded: {item.score}</Badge>
                      ) : (
                        <Badge tone="neutral">Scheduled</Badge>
                      )}

                      <button
                        type="button"
                        onClick={() => navigate(`/student/assignments/${item.id}`)}
                        className="px-4 py-2 rounded-lg bg-orange hover:bg-orange-hover text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <span>{item.status === "Graded" ? "Review" : "Submit"}</span>
                        <Upload size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar Column (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6 w-full">
          {/* Mini Academic Calendar Widget */}
          <div className="rounded-2xl border border-line bg-white p-5 shadow-card flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays size={18} className="text-navy" />
                <h3 className="font-display text-sm font-bold text-ink">
                  {calendarMonth}
                </h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Previous month"
                  className="w-7 h-7 rounded-lg hover:bg-slate-100 text-muted hover:text-ink flex items-center justify-center transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Next month"
                  className="w-7 h-7 rounded-lg hover:bg-slate-100 text-muted hover:text-ink flex items-center justify-center transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-y-2 text-center text-xs">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, idx) => (
                <span key={idx} className="text-muted font-bold py-1">
                  {d}
                </span>
              ))}

              {/* Prev month days */}
              <span className="text-slate-300 py-1.5">28</span>
              <span className="text-slate-300 py-1.5">29</span>
              <span className="text-slate-300 py-1.5">30</span>
              {/* Oct days */}
              {[...Array(18)].map((_, i) => (
                <span key={i} className="text-ink py-1.5">
                  {i + 1}
                </span>
              ))}

              {/* Week with key milestone dates */}
              <span className="text-ink py-1.5">19</span>
              {/* Today: 20 */}
              <span className="relative flex items-center justify-center py-1.5">
                <span className="w-7 h-7 rounded-full bg-navy text-white font-bold flex items-center justify-center shadow-sm">
                  20
                </span>
              </span>
              {/* Lab Due: 21 */}
              <span className="relative flex items-center justify-center py-1.5">
                <span className="w-7 h-7 rounded-full bg-orange text-white font-bold flex items-center justify-center shadow-sm">
                  21
                </span>
              </span>
              <span className="text-ink py-1.5">22</span>
              <span className="text-ink py-1.5">23</span>
              {/* Quiz: 24 */}
              <span className="relative flex items-center justify-center py-1.5">
                <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center">
                  24
                </span>
              </span>
              <span className="text-ink py-1.5">25</span>
              <span className="text-ink py-1.5">26</span>
              <span className="text-ink py-1.5">27</span>
              <span className="text-ink py-1.5">28</span>
              <span className="text-ink py-1.5">29</span>
              <span className="text-ink py-1.5">30</span>
              <span className="text-ink py-1.5">31</span>
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-muted">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-navy" />
                <span>Today</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange" />
                <span>Lab Due</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span>Quiz</span>
              </div>
            </div>
          </div>

          {/* Upcoming Quizzes Quick List */}
          <div className="rounded-2xl border border-line bg-white p-5 shadow-card flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-ink">
                Upcoming Quizzes
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                2 pending
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {quizzesData.slice(0, 2).map((quiz) => (
                <div
                  key={quiz.id}
                  className="p-3 rounded-xl bg-canvas border border-line/60 flex items-center justify-between gap-3 hover:border-line transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-white shadow-xs border border-line flex-shrink-0 flex items-center justify-center text-navy">
                      <FileQuestion size={18} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-xs text-ink truncate">
                        {quiz.courseCode}: {quiz.title}
                      </span>
                      <span className="text-[11px] text-muted">
                        {quiz.durationMinutes} mins • {quiz.totalQuestions} questions
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/student/quizzes/${quiz.id}`)}
                    className="px-3 py-1.5 rounded-lg bg-navy hover:bg-navy-hover text-white text-xs font-semibold flex-shrink-0 transition-colors"
                  >
                    Start
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="rounded-2xl border border-line bg-white p-5 shadow-card flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-ink">
                Recent Activity
              </h3>
              <span className="text-xs text-muted flex items-center gap-1">
                <Sparkles size={14} className="text-orange" /> Real-time
              </span>
            </div>

            <div className="relative flex flex-col gap-4 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {activityFeed.map((act) => (
                <div key={act.id} className="relative flex items-start gap-3 pl-1">
                  <div
                    className={`w-5 h-5 rounded-full text-white flex items-center justify-center flex-shrink-0 z-10 shadow-xs text-[10px] ${
                      act.type === "submission"
                        ? "bg-orange"
                        : act.type === "grade"
                        ? "bg-emerald-600"
                        : "bg-navy"
                    }`}
                  >
                    ✓
                  </div>
                  <div className="flex flex-col text-xs min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-ink leading-tight">
                        {act.title}
                      </span>
                      {act.scoreBadge && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                          {act.scoreBadge}
                        </span>
                      )}
                    </div>
                    <span className="text-muted text-[11px] mt-0.5">{act.detail}</span>
                    <span className="text-slate-400 text-[10px] mt-0.5">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Timetable Modal */}
      <Modal
        open={timetableOpen}
        onClose={() => setTimetableOpen(false)}
        title="Weekly Academic Timetable (Fall 2026)"
      >
        <div className="space-y-4 text-sm">
          <p className="text-xs text-muted">
            All lectures and lab sessions scheduled for Aditya Sharma • B.Tech CSE Semester 5
          </p>
          <div className="divide-y divide-slate-100 border rounded-xl overflow-hidden">
            {coursesData.map((course) => (
              <div key={course.id} className="p-3.5 flex items-center justify-between hover:bg-canvas">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-navy">{course.code}</span>
                    <span className="font-semibold text-ink">{course.title}</span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">{course.schedule} • {course.room}</p>
                </div>
                <Badge tone="neutral">{course.credits} Credits</Badge>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
