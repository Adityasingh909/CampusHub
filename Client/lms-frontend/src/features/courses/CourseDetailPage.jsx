import { useState, useMemo,useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import {
  BookOpen,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Mail,
  Download,
  Share2,
  Bookmark,
  CheckCircle2,
  PlayCircle,
  FileText,
  Video,
  FileCode,
  FolderOpen,
  ClipboardList,
  Megaphone,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  Award,
} from "lucide-react";
import {
  coursesData,
  assignmentsData,
  quizzesData,
} from "../../data/mockLmsData";
import { Badge } from "../../components/ui/Badge";
import { useToast } from "../../hooks/useToast";

export function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("overview"); // overview | modules | materials | assignments | announcements
  const [saved, setSaved] = useState(false);

  // Find course by ID
  // const course = useMemo(() => {
  //   return coursesData.find((c) => c.id === courseId);
  // }, [courseId]);

  const [course, setCourse] = useState(null);
const [loading, setLoading] = useState(true);
const [fetchError, setFetchError] = useState("");

useEffect(() => {
  let cancelled = false;

  async function fetchCourse() {
    try {
      setLoading(true);
      setFetchError("");

      const response = await api().get("/course");
      const foundCourse = (response.courses || []).find(
        (item) => String(item.id) === String(courseId)
      );

      if (!foundCourse) {
        throw new Error("This course does not exist in the course catalogue.");
      }

      // Load enrollment-specific progress separately.
      let progress = 0;

      try {
        const enrollmentResponse = await api().get(
          "/enrollments/my-courses"
        );

        const enrollment = (enrollmentResponse.enrollments || []).find(
          (item) => String(item.courseId) === String(foundCourse.id)
        );

        if (enrollment) {
          progress = enrollment.progress ?? 0;
        }
      } catch {
        // Course details can still be viewed if enrollment lookup fails.
      }

      if (!cancelled) {
        setCourse({ ...foundCourse, progress });
      }
    } catch (error) {
      if (!cancelled) {
        setFetchError(error.message || "Failed to load course.");
        setCourse(null);
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  fetchCourse();

  return () => {
    cancelled = true;
  };
}, [courseId]);

  // Course-specific assignments
  const courseAssignments = useMemo(() => {
    if (!course) return [];
    return assignmentsData.filter(
      (a) => a.courseId === course.id || a.courseCode === course.code
    );
  }, [course]);

  // Course-specific quizzes
  const courseQuizzes = useMemo(() => {
    if (loading) {
  <p className="text-sm text-muted max-w-md mt-2">
  {fetchError || `Course ${courseId} could not be found.`}
</p>
}
    if (!course) return [];
    return quizzesData.filter(
      (q) => q.courseId === course.id || q.courseCode === course.code
    );
  }, [course]);

  // Fallback modules for courses that don't have dedicated modules listed
  const modules = useMemo(() => {
    if (!course) return [];
    if (course.modules && course.modules.length > 0) return course.modules;
    return [
      {
        id: "gen-mod-1",
        title: `Module 1: Foundations of ${course.title}`,
        weeks: "Weeks 1-4",
        status: "Completed",
        lessons: [
          { title: "Core Principles & Architecture Paradigms", duration: "45m", type: "video" },
          { title: "Theoretical Foundations & Asymptotic Constraints", duration: "60m", type: "slides" },
          { title: "Diagnostic Lab & Workspace Setup", duration: "90m", type: "lab" },
        ],
      },
      {
        id: "gen-mod-2",
        title: `Module 2: Advanced Implementation & Heuristics`,
        weeks: "Weeks 5-8",
        status: "In Progress",
        lessons: [
          { title: "Practical Optimization Techniques", duration: "50m", type: "video" },
          { title: "Case Studies & Architectural Tradeoffs", duration: "40m", type: "reading" },
          { title: "Comprehensive Capstone Milestone", duration: "120m", type: "lab" },
        ],
      },
      {
        id: "gen-mod-3",
        title: `Module 3: Verification, Profiling & Distributed Patterns`,
        weeks: "Weeks 9-12",
        status: "Upcoming",
        lessons: [
          { title: "Benchmarking and Security Invariants", duration: "55m", type: "reading" },
          { title: "Final Semester Examination Review", duration: "75m", type: "slides" },
        ],
      },
    ];
  }, [course]);

  // Fallback materials
  const materials = useMemo(() => {
    if (!course) return [];
    if (course.materials && course.materials.length > 0) return course.materials;
    return [
      { id: "mat-1", title: `${course.code} Course Syllabus & Lecture Schedule`, type: "PDF", size: "2.1 MB", date: "Oct 10" },
      { id: "mat-2", title: `Lecture Notes: Weeks 1-6 Master Review`, type: "PDF", size: "4.8 MB", date: "Oct 14" },
      { id: "mat-3", title: `Reference Textbook Solutions & Lab Manual`, type: "ZIP", size: "15.3 MB", date: "Oct 16" },
    ];
  }, [course]);

  // Fallback announcements
  const announcements = useMemo(() => {
    if (!course) return [];
    if (course.announcements && course.announcements.length > 0) return course.announcements;
    return [
      {
        id: "ann-1",
        title: `Welcome to ${course.code}: ${course.title}`,
        date: "Oct 01, 2026",
        content: `Welcome to the Fall 2026 session. All course materials, lab assignments, and quiz links will be posted under this portal. Please review the syllabus PDF before the first lecture.`,
      },
    ];
  }, [course]);

  if (!course) {
    return (
      <div className="rounded-2xl border border-line bg-white p-12 text-center shadow-card flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-orange/10 text-orange flex items-center justify-center mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="font-display text-2xl font-bold text-ink">Course Not Found</h2>
        <p className="text-sm text-muted max-w-md mt-2">
          The course with identifier &quot;{courseId}&quot; does not exist in your enrolled courses registry.
        </p>
        <button
          type="button"
          onClick={() => navigate("/student/courses")}
          className="mt-6 px-5 py-2.5 rounded-xl bg-navy text-white text-sm font-semibold hover:bg-navy-hover transition flex items-center gap-2 shadow-sm"
        >
          <ArrowLeft size={16} />
          <span>Back to My Courses</span>
        </button>
      </div>
    );
  }

  function handleSaveCourse() {
    setSaved(!saved);
    toast.show(
      saved ? "Course removed from bookmarks" : "Course saved to your academic bookmarks!",
      "success"
    );
  }

  function handleShareCourse() {
    navigator.clipboard?.writeText(window.location.href);
    toast.show("Course share link copied to clipboard!", "info");
  }

  function handleDownload(title) {
    toast.show(`Downloading "${title}"...`, "info");
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      {/* Top Breadcrumb & Metadata Trail */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted flex-wrap">
          <Link
            to="/student/courses"
            className="hover:text-navy transition-colors flex items-center gap-1"
          >
            <BookOpen size={14} />
            <span>My Courses</span>
          </Link>
          <span>/</span>
          <span className="text-ink font-bold">
            {course.title} ({course.code})
          </span>
          <span className="ml-2 px-2.5 py-0.5 rounded-full bg-slate-100 text-navy text-[11px] font-semibold">
            Fall 2026
          </span>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleSaveCourse}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-xs font-semibold transition shadow-xs ${
              saved
                ? "bg-orange text-white border-orange"
                : "bg-white text-ink hover:bg-slate-50"
            }`}
          >
            <Bookmark size={15} />
            <span>{saved ? "Saved" : "Save Course"}</span>
          </button>
          <button
            type="button"
            onClick={handleShareCourse}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-white text-ink hover:bg-slate-50 text-xs font-semibold transition shadow-xs"
          >
            <Share2 size={15} />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Course Hero Banner */}
      <div className="relative w-full rounded-2xl bg-gradient-to-r from-navy-deep via-navy to-navy-hover p-6 sm:p-8 text-white shadow-card overflow-hidden">
        {/* Decorative Ambient Visuals */}
        <div className="absolute -right-8 -bottom-12 w-80 h-80 rounded-full bg-orange/15 blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 -top-12 w-64 h-64 rounded-full bg-blue-400/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 lg:gap-8">
          <div className="flex-1 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-orange text-white text-xs font-bold tracking-wider uppercase shadow-xs">
                {course.code}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-slate-200 text-xs font-semibold">
                {course.credits}.0 Credits
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-slate-200 text-xs font-semibold">
                Computer Science &amp; Eng
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight mb-2">
              {course.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              {course.description}
            </p>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-5 mt-5 text-slate-300 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5">
                <User size={16} className="text-orange" />
                <span className="text-white font-medium">{course.instructor}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={16} className="text-blue-300" />
                <span>{course.schedule}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin size={16} className="text-emerald-300" />
                <span>{course.room}</span>
              </div>
            </div>
          </div>

          {/* Quick Action & Course Progress Card */}
          <div className="w-full lg:w-80 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Course Progress
              </span>
              <span className="font-display text-xl font-bold text-white">
                {course.progress}%
              </span>
            </div>

            {/* Progress Bar Track */}
            <div className="w-full h-2.5 bg-black/25 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange rounded-full transition-all duration-700 ease-out"
                style={{ width: `${course.progress}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-xs text-slate-300 font-medium">
              <span>{Math.round((course.progress / 100) * 24)} of 24 Modules completed</span>
              <span className="text-orange font-bold">
                {24 - Math.round((course.progress / 100) * 24)} Remaining
              </span>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab("modules")}
              className="w-full mt-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-orange text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-orange-hover transition-all shadow-sm group"
            >
              <span>Continue Learning</span>
              <ChevronRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          </div>
        </div>
      </div>

      {/* Segmented Course Navigation Tabs */}
      <div className="w-full bg-white border border-line rounded-2xl p-1.5 shadow-card overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max sm:min-w-0" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === "overview"
                ? "bg-navy text-white shadow-sm"
                : "text-muted hover:text-ink hover:bg-slate-50"
            }`}
          >
            <BookOpen size={16} />
            <span>Overview</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "modules"}
            onClick={() => setActiveTab("modules")}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === "modules"
                ? "bg-navy text-white shadow-sm"
                : "text-muted hover:text-ink hover:bg-slate-50"
            }`}
          >
            <FolderOpen size={16} />
            <span>Modules</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                activeTab === "modules" ? "bg-white/20 text-white" : "bg-slate-100 text-ink"
              }`}
            >
              {modules.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "materials"}
            onClick={() => setActiveTab("materials")}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === "materials"
                ? "bg-navy text-white shadow-sm"
                : "text-muted hover:text-ink hover:bg-slate-50"
            }`}
          >
            <FileText size={16} />
            <span>Materials</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                activeTab === "materials" ? "bg-white/20 text-white" : "bg-slate-100 text-ink"
              }`}
            >
              {materials.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "assignments"}
            onClick={() => setActiveTab("assignments")}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === "assignments"
                ? "bg-navy text-white shadow-sm"
                : "text-muted hover:text-ink hover:bg-slate-50"
            }`}
          >
            <ClipboardList size={16} />
            <span>Assignments</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                activeTab === "assignments" ? "bg-orange text-white" : "bg-orange-100 text-orange-800"
              }`}
            >
              {courseAssignments.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "announcements"}
            onClick={() => setActiveTab("announcements")}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === "announcements"
                ? "bg-navy text-white shadow-sm"
                : "text-muted hover:text-ink hover:bg-slate-50"
            }`}
          >
            <Megaphone size={16} />
            <span>Announcements</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                activeTab === "announcements" ? "bg-white/20 text-white" : "bg-slate-100 text-ink"
              }`}
            >
              {announcements.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT PANELS */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* About Card */}
            <div className="rounded-2xl border border-line bg-white p-6 shadow-card flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-6 bg-orange rounded-full" />
                  <h2 className="font-display text-xl font-bold text-ink">
                    About This Course
                  </h2>
                </div>
                <span className="text-xs text-muted">Updated Fall 2026</span>
              </div>

              <p className="text-sm text-ink leading-relaxed">
                {course.description} Students navigate the entire curriculum lifecycle: from modular UI architecture using modern component frameworks to scalable distributed backends, asynchronous messaging patterns, schema modeling, and production cloud builds.
              </p>

              {/* Download Syllabus PDF Box */}
              <div className="p-4 bg-canvas border border-line/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-orange/10 flex items-center justify-center text-orange flex-shrink-0">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-bold text-ink">
                      Complete Syllabus &amp; Course Policy
                    </h4>
                    <p className="text-xs text-muted">
                      Version 2.4 • 1.8 MB PDF • Grading Rubric Included
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownload(`${course.code}_Syllabus_Fall_2026.pdf`)}
                  className="px-4 py-2 bg-navy text-white rounded-xl text-xs font-semibold hover:bg-navy-hover transition-colors shadow-xs flex items-center gap-1.5 whitespace-nowrap self-stretch sm:self-auto justify-center"
                >
                  <Download size={14} />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>

            {/* Core Learning Objectives */}
            <div className="rounded-2xl border border-line bg-white p-6 shadow-card flex flex-col gap-4">
              <h3 className="font-display text-lg font-bold text-ink">
                Core Learning Objectives
              </h3>
              <p className="text-xs text-muted">
                Mastery verified via automated code tests, live lab sessions, and sprint deliverables.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-canvas border border-line/60">
                  <CheckCircle2 size={20} className="text-orange mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-ink">Architectural State Graphs</h4>
                    <p className="text-xs text-muted mt-0.5">
                      Manage complex client state flows with context reducers, custom hooks, and memoization.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-canvas border border-line/60">
                  <CheckCircle2 size={20} className="text-orange mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-ink">Stateless RESTful APIs &amp; Auth</h4>
                    <p className="text-xs text-muted mt-0.5">
                      Design enterprise endpoints with JWT tokens, CORS policy, and rate limiting.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-canvas border border-line/60">
                  <CheckCircle2 size={20} className="text-orange mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-ink">Relational Persistence &amp; Queries</h4>
                    <p className="text-xs text-muted mt-0.5">
                      Model relational schemas, composite keys, query optimization, and join trees.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-canvas border border-line/60">
                  <CheckCircle2 size={20} className="text-orange mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-ink">Production Deployments</h4>
                    <p className="text-xs text-muted mt-0.5">
                      Build production-ready bundles, manage assets, and deploy containerized services.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Instructor Details Card */}
            <div className="rounded-2xl border border-line bg-white p-6 shadow-card flex flex-col gap-4">
              <h3 className="font-display text-base font-bold text-ink pb-2 border-b border-slate-100">
                Course Instructor
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-navy text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  {course.instructor
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-ink">{course.instructor}</h4>
                  <p className="text-xs text-muted">{course.instructorRole}</p>
                </div>
              </div>

              <div className="space-y-2.5 pt-2 text-xs">
                <div className="flex items-center gap-2 text-muted">
                  <Mail size={14} className="text-navy" />
                  <a
                    href={`mailto:${course.instructorEmail}`}
                    className="text-navy hover:underline font-medium"
                  >
                    {course.instructorEmail}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <Clock size={14} className="text-navy" />
                  <span>Office Hours: Tue/Thu 3:00 - 5:00 PM</span>
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <MapPin size={14} className="text-navy" />
                  <span>{course.room}</span>
                </div>
              </div>
            </div>

            {/* Quick Milestones Card */}
            <div className="rounded-2xl border border-line bg-white p-6 shadow-card flex flex-col gap-3">
              <h3 className="font-display text-base font-bold text-ink">
                Course Milestones
              </h3>
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Total Credits</span>
                  <span className="font-bold text-ink">{course.credits}.0</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Syllabus Covered</span>
                  <span className="font-bold text-orange">{course.progress}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Assignments Due</span>
                  <span className="font-bold text-ink">{courseAssignments.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* TAB 3: MATERIALS */}
      {activeTab === "materials" && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-xl font-bold text-ink">
                Course Materials &amp; Lecture Vault
              </h3>
              <p className="text-xs text-muted mt-1">
                Official course slides, code templates, reference cheatsheets, and recordings.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-navy">
              {materials.length} files available
            </span>
          </div>

          <div className="rounded-2xl border border-line bg-white divide-y divide-slate-100 shadow-card overflow-hidden">
            {materials.map((mat) => (
              <div
                key={mat.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-canvas transition"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-orange/10 text-orange flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {mat.type}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-ink truncate">
                      {mat.title}
                    </h4>
                    <p className="text-xs text-muted mt-0.5">
                      {mat.type} Document • {mat.size} • Uploaded {mat.date}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownload(mat.title)}
                  className="px-4 py-2 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-xs self-stretch sm:self-auto justify-center"
                >
                  <Download size={14} />
                  <span>Download</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ASSIGNMENTS */}
      {activeTab === "assignments" && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-xl font-bold text-ink">
                Course Assignments
              </h3>
              <p className="text-xs text-muted mt-1">
                Lab deliverables, problem sets, and submission portals for {course.title}.
              </p>
            </div>
            <Link
              to="/student/assignments"
              className="text-xs font-semibold text-navy hover:text-orange transition"
            >
              View All Assignments →
            </Link>
          </div>

          {courseAssignments.length === 0 ? (
            <div className="rounded-2xl border border-line bg-white p-8 text-center text-muted">
              No assignments currently active for this course.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {courseAssignments.map((a) => (
                <div
                  key={a.id}
                  className="rounded-2xl border border-line bg-white p-5 shadow-card hover:shadow-lift transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-navy/10 text-navy flex items-center justify-center flex-shrink-0">
                      <ClipboardList size={22} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/student/assignments/${a.id}`}
                          className="font-display text-sm sm:text-base font-bold text-ink hover:text-orange transition-colors truncate"
                        >
                          {a.title}
                        </Link>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-navy text-[11px] font-semibold">
                          {a.courseCode}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted mt-1">
                        <span className="text-orange font-semibold">Due: {a.dueDate}</span>
                        <span>•</span>
                        <span>Points: {a.totalPoints}</span>
                        <span>•</span>
                        <span>Weight: {a.weight}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    {a.status === "Urgent" ? (
                      <Badge tone="error" dot>Urgent</Badge>
                    ) : a.status === "Graded" ? (
                      <Badge tone="success" dot>Graded: {a.score}</Badge>
                    ) : (
                      <Badge tone="neutral">Pending</Badge>
                    )}

                    <button
                      type="button"
                      onClick={() => navigate(`/student/assignments/${a.id}`)}
                      className="px-4 py-2 rounded-xl bg-orange hover:bg-orange-hover text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
                    >
                      <span>Submit</span>
                      <ExternalLink size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: ANNOUNCEMENTS */}
      {activeTab === "announcements" && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-xl font-bold text-ink">
                Course Announcements
              </h3>
              <p className="text-xs text-muted mt-1">
                Official circulars and notices broadcast by {course.instructor}.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-navy">
              {announcements.length} Notices
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="rounded-2xl border border-line bg-white p-5 sm:p-6 shadow-card flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Megaphone size={18} className="text-orange" />
                    <h4 className="font-display text-base font-bold text-ink">
                      {ann.title}
                    </h4>
                  </div>
                  <span className="text-xs font-semibold text-muted">{ann.date}</span>
                </div>
                <p className="text-xs sm:text-sm text-ink leading-relaxed">
                  {ann.content}
                </p>
                <div className="pt-2 border-t border-slate-100 text-xs text-muted flex items-center gap-2">
                  <span className="font-semibold text-navy">{course.instructor}</span>
                  <span>•</span>
                  <span>Faculty of {course.department || "Computer Science"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
