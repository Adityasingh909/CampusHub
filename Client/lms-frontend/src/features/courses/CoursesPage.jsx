import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import {
  Search,
  BookOpen,
  GraduationCap,
  ArrowRight,
  User,
  Clock,
  Sparkles,
  AlertCircle,
  RotateCcw,
  BookMarked,
  SlidersHorizontal,
} from "lucide-react";
import { currentUser } from "../../data/mockLmsData";
import { EmptyState } from "../../components/ui/EmptyState";
import { Badge } from "../../components/ui/Badge";
import { api } from "../../services/api";


export function CoursesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [filterCategory, setFilterCategory] = useState("All"); // All | In Progress | Completed
  const [sortBy, setSortBy] = useState("progress"); // progress | code | credits

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);
  const [enrollingCourseId, setEnrollingCourseId] = useState(null);
  const [enrollMessage, setEnrollMessage] = useState("");

  useEffect(() => {
    setSearchQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    async function fetchCourses() {
      try {
        setLoading(true);
        setError("");

        const [courseResponse, enrollmentResponse] = await Promise.all([
          api().get("/course"),
          api().get("/enrollments/my-courses"),
        ]);

        const enrollments = enrollmentResponse.enrollments || [];

        const enrollmentMap = new Map(
          enrollments.map((enrollment) => [
            enrollment.courseId,
            enrollment,
          ])
        );

        const allCourses = (courseResponse.courses || []).map((course) => {
          const enrollment = enrollmentMap.get(course.id);

          return {
            ...course,
            progress: enrollment?.progress ?? 0,
            category: enrollment
              ? enrollment.status === "COMPLETED"
                ? "Completed"
                : "In Progress"
              : "Not Enrolled",
            enrollmentId: enrollment?.id ?? null,
          };
        });

        setCourses(allCourses);
        setEnrolledCourseIds(enrollments.map((item) => item.courseId));
      } catch (err) {
        setError(err.message || "Failed to fetch courses");
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, []);

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    let result = [...courses];

    // Filter by Category
    if (filterCategory !== "All") {
      result = result.filter((course) => course.category === filterCategory);
    }
    if (filterCategory === "Not Enrolled") {
  result = result.filter(
    (course) => !enrolledCourseIds.includes(course.id)
  );
} else if (filterCategory !== "All") {
  result = result.filter((course) => course.category === filterCategory);
}

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (course) =>
          course.title.toLowerCase().includes(q) ||
          course.code.toLowerCase().includes(q) ||
          course.instructor.toLowerCase().includes(q) ||
          course.description.toLowerCase().includes(q)
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "progress") return b.progress - a.progress;
      if (sortBy === "code") return a.code.localeCompare(b.code);
      if (sortBy === "credits") return b.credits - a.credits;
      return 0;
    });

    return result;
  }, [courses, searchQuery, filterCategory, sortBy,enrolledCourseIds]);

  const notEnrolledCount = courses.filter(
    (c) => !enrolledCourseIds.includes(c.id)
  ).length;

  const inProgressCount = courses.filter(
    (c) => c.category === "In Progress"
  ).length;

  const completedCount = courses.filter(
    (c) => c.category === "Completed"
  ).length;

  function handleSearchChange(e) {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim()) {
      setSearchParams({ q: value });
    } else {
      setSearchParams({});
    }
  }

  function handleResetFilters() {
    setSearchQuery("");
    setFilterCategory("All");
    setSortBy("progress");
    setSearchParams({});
  }
  async function handleEnroll(courseId) {
    try {
      setEnrollingCourseId(courseId);
      setEnrollMessage("");

      await api().post(`/enrollments/${courseId}`);

      setEnrolledCourseIds((previous) =>
        previous.includes(courseId) ? previous : [...previous, courseId]
      );

      setCourses((previous) =>
        previous.map((course) =>
          course.id === courseId
            ? {
              ...course,
              progress: 0,
              category: "In Progress",
            }
            : course
        )
      );

      setEnrollMessage("Successfully enrolled in the course!");
    } catch (err) {
      setEnrollMessage(err.message || "Failed to enroll in course");
    } finally {
      setEnrollingCourseId(null);
    }
  }

  if (loading) {
    return <div className="p-6">Loading courses...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }
  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      {/* Top Level Breadcrumb Bar & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted mb-1.5">
            <Link to="/student/dashboard" className="hover:text-navy transition-colors">
              Portal
            </Link>
            <span>/</span>
            <span className="text-ink">My Courses</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            My Courses
          </h1>
          <p className="text-sm text-muted mt-1">
            Explore, manage, and continue your enrolled academic courses.
          </p>
        </div>

        {/* Quick Stats Ribbon */}
        <div className="flex items-center gap-4 bg-white border border-line px-5 py-3 rounded-2xl shadow-card self-start sm:self-auto">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange animate-pulse" />
            <span className="text-xs text-muted font-medium">Active:</span>
            <span className="text-sm font-bold text-ink">{inProgressCount} Enrolled</span>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <GraduationCap size={18} className="text-navy" />
            <span className="text-xs text-muted font-medium">Credits:</span>
            <span className="text-sm font-bold text-ink">
              {currentUser.stats.totalCredits} Max
            </span>
          </div>
        </div>
      </div>

      {/* Search, Filter & View Controls */}
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
              onChange={handleSearchChange}
              placeholder="Search enrolled courses or course codes (e.g. CS-301, Database)..."
              className="h-[42px] w-full rounded-xl border border-line bg-canvas pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-muted focus:border-navy focus:bg-white focus:ring-[3px] focus:ring-navy/15"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-[42px] w-full sm:w-auto rounded-xl border border-line bg-canvas px-4 pr-9 text-xs sm:text-sm font-semibold text-ink outline-none cursor-pointer hover:bg-slate-100 transition appearance-none"
              >
                <option value="progress">Sort by: Progress (High to Low)</option>
                <option value="code">Sort by: Course Code</option>
                <option value="credits">Sort by: Credits</option>
              </select>
              <SlidersHorizontal
                size={14}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted"
              />
            </div>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setFilterCategory("All")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition shadow-xs ${filterCategory === "All"
                ? "bg-navy text-white"
                : "bg-slate-100 text-muted hover:text-ink hover:bg-slate-200"
                }`}
            >
              All ({courses.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory("In Progress")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition shadow-xs ${filterCategory === "In Progress"
                ? "bg-navy text-white"
                : "bg-slate-100 text-muted hover:text-ink hover:bg-slate-200"
                }`}
            >
              In Progress ({inProgressCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory("Completed")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition shadow-xs ${filterCategory === "Completed"
                ? "bg-navy text-white"
                : "bg-slate-100 text-muted hover:text-ink hover:bg-slate-200"
                }`}
            >
              Completed ({completedCount})
            </button>
            <button
  type="button"
  onClick={() => setFilterCategory("Not Enrolled")}
  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition shadow-xs ${
    filterCategory === "Not Enrolled"
      ? "bg-navy text-white"
      : "bg-slate-100 text-muted hover:text-ink hover:bg-slate-200"
  }`}
>
  Not Enrolled ({notEnrolledCount})
</button>
          </div>

          <div className="text-xs text-muted flex items-center gap-1.5">
            <Sparkles size={14} className="text-orange" />
            <span>Showing {filteredCourses.length} courses</span>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-12 text-center shadow-card flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-muted flex items-center justify-center mb-3">
            <BookOpen size={28} />
          </div>
          <h3 className="font-display text-lg font-bold text-ink">No courses found</h3>
          <p className="text-sm text-muted max-w-sm mt-1">
            We couldn&apos;t find any enrolled courses matching &quot;{searchQuery}&quot; with current filters.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition flex items-center gap-1.5 shadow-sm"
          >
            <RotateCcw size={14} />
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="group flex flex-col rounded-2xl border border-line bg-white shadow-card hover:shadow-lift transition-all duration-300 overflow-hidden"
            >
              {/* Course Thumbnail & Badges Banner */}
              <div className="relative h-44 w-full overflow-hidden bg-navy">

                {course.thumbnail && (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/40 to-transparent" />


                {/* Badges on banner */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-navy/85 text-white backdrop-blur-md">
                    {course.code}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/95 text-ink backdrop-blur-md shadow-xs">
                    {course.credits}.0 Credits
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                  <span className="text-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                    {course.category}
                  </span>
                  <div className="flex items-center gap-1 bg-navy/70 px-2 py-0.5 rounded-full backdrop-blur-xs text-[11px] text-slate-200">
                    <Clock size={12} />
                    <span>{course.schedule.split("•")[0]}</span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                <div className="flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <Link
                      to={`/student/courses/${course.id}`}
                      className="font-display text-lg font-bold text-ink group-hover:text-orange transition-colors"
                    >
                      {course.title}
                    </Link>
                  </div>

                  {/* Instructor */}
                  <div className="flex items-center gap-2 text-xs text-muted font-medium mb-2">
                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-navy">
                      <User size={12} />
                    </div>
                    <span>{course.instructor}</span>
                    <span>•</span>
                    <span>{course.instructorRole.split(",")[0]}</span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                {/* Progress Section */}
                <div className="bg-canvas border border-line/60 p-3 rounded-xl flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted font-medium">Syllabus Progress</span>
                    <span className="font-bold text-ink">{course.progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-orange rounded-full transition-all duration-500"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>

                {/* Action Area */}
                <div className="pt-1 flex items-center gap-2">
                  {/* <button
                    type="button"
                    onClick={() => navigate(`/student/courses/${course.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-orange hover:bg-orange-hover text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <span>{course.progress === 100 ? "Review Course" : "Continue Learning"}</span>
                    <ArrowRight size={15} />
                  </button> */}
                  {enrolledCourseIds.includes(course.id) ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/student/courses/${course.id}`)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-orange hover:bg-orange-hover text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <span>
                        {course.progress === 100 ? "Review Course" : "Continue Learning"}
                      </span>
                      <ArrowRight size={15} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={enrollingCourseId === course.id}
                      onClick={() => handleEnroll(course.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-orange hover:bg-orange-hover text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-60"
                    >
                      <span>
                        {enrollingCourseId === course.id ? "Enrolling..." : "Enroll Now"}
                      </span>
                      <ArrowRight size={15} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate(`/student/courses/${course.id}`)}
                    title="View Course Syllabus"
                    className="p-2.5 rounded-xl border border-line bg-canvas hover:bg-white text-muted hover:text-ink transition-colors"
                  >
                    <BookMarked size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* {enrollMessage && (
        <p role="status" className="text-sm text-ink">
          {enrollMessage}
        </p>
      )} */}
    </div>
  );
}
