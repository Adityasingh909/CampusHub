import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  BookOpen,
  GraduationCap,
  ArrowRight,
  Clock,
  RotateCcw,
  SlidersHorizontal,
  Plus,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { api } from "../../services/api";
import { CourseCardSkeleton } from "../../components/ui/Skeleton";
import { Modal } from "../../components/ui/Modal";

export function TeacherCoursesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("code");

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [courseForm, setCourseForm] = useState({
    code: "",
    title: "",
    description: "",
    credits: 3,
    category: "Computer Science",
    schedule: "Mon, Wed • 10:00 - 11:30 AM",
    instructorRole: "Lead Faculty",
  });

  const [reloadKey, setReloadKey] = useState(0);

  const refetchCourses = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadTeacherCourses() {
      try {
        setLoading(true);
        setError("");

        const response = await api().get("/course/");
        const allCourses = response?.courses || [];

        const myCourses = allCourses.filter(
          (c) => Number(c.teacherId) === Number(user?.id)
        );

        if (!cancelled) {
          setCourses(myCourses);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load courses");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTeacherCourses();

    return () => {
      cancelled = true;
    };
  }, [user?.id, reloadKey]);

  const filteredCourses = useMemo(() => {
    let result = [...courses];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.code?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (sortBy === "code") return (a.code || "").localeCompare(b.code || "");
      if (sortBy === "title") return (a.title || "").localeCompare(b.title || "");
      if (sortBy === "credits") return (b.credits || 0) - (a.credits || 0);
      return 0;
    });

    return result;
  }, [courses, searchQuery, sortBy]);

  const totalCredits = useMemo(() => {
    return courses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
  }, [courses]);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!courseForm.code.trim() || !courseForm.title.trim()) {
      setCreateError("Course code and title are required.");
      return;
    }

    try {
      setCreating(true);
      setCreateError("");

      const payload = {
        code: courseForm.code.trim().toUpperCase(),
        title: courseForm.title.trim(),
        description: courseForm.description.trim(),
        credits: Number(courseForm.credits) || 3,
        category: courseForm.category.trim() || "Computer Science",
        schedule: courseForm.schedule.trim() || "Schedule TBA",
        instructor: user?.name || "Faculty",
        instructorRole: courseForm.instructorRole.trim() || "Faculty",
      };

      const res = await api().post("/course/", payload);

      if (!res?.success) {
        throw new Error(res?.message || "Failed to create course.");
      }

      toast.show("Course created successfully!", "success");
      setCreateModalOpen(false);
      setCourseForm({
        code: "",
        title: "",
        description: "",
        credits: 3,
        category: "Computer Science",
        schedule: "Mon, Wed • 10:00 - 11:30 AM",
        instructorRole: "Lead Faculty",
      });
      refetchCourses();
    } catch (err) {
      setCreateError(err.message || "Failed to create course.");
    } finally {
      setCreating(false);
    }
  };


  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center max-w-lg mx-auto my-8">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
          <AlertCircle size={24} />
        </div>
        <h3 className="text-base font-bold text-ink">Failed to Load Courses</h3>
        <p className="text-sm text-muted mt-1 mb-4">{error}</p>
        <button
          type="button"
          onClick={refetchCourses}
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
      {/* Header Bar & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted mb-1.5">
            <Link to="/teacher/dashboard" className="hover:text-navy transition-colors">
              Faculty Portal
            </Link>
            <span>/</span>
            <span className="text-ink">Managed Courses</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            Managed Courses
          </h1>
          <p className="text-sm text-muted mt-1">
            Curate course details, release assignments, and supervise enrolled students.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-4 bg-white border border-line px-5 py-3 rounded-2xl shadow-card">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange animate-pulse" />
              <span className="text-xs text-muted font-medium">Courses:</span>
              <span className="text-sm font-bold text-ink">{courses.length} Taught</span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <GraduationCap size={18} className="text-navy" />
              <span className="text-xs text-muted font-medium">Credits:</span>
              <span className="text-sm font-bold text-ink">{totalCredits} Total</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-3 rounded-2xl bg-orange hover:bg-orange-hover text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Create New Course</span>
          </button>
        </div>
      </div>

      {/* Search & Sort Controls */}
      <div className="rounded-2xl border border-line bg-white p-4 sm:p-5 shadow-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by code or title (e.g. CS-301, Operating Systems)..."
            className="h-[42px] w-full rounded-xl border border-line bg-canvas pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-muted focus:border-navy focus:bg-white focus:ring-[3px] focus:ring-navy/15"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-[42px] rounded-xl border border-line bg-canvas px-4 pr-9 text-xs sm:text-sm font-semibold text-ink outline-none cursor-pointer hover:bg-slate-100 transition appearance-none"
            >
              <option value="code">Sort by: Course Code</option>
              <option value="title">Sort by: Title</option>
              <option value="credits">Sort by: Credits</option>
            </select>
            <SlidersHorizontal
              size={14}
              className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CourseCardSkeleton />
          <CourseCardSkeleton />
          <CourseCardSkeleton />
          <CourseCardSkeleton />
          <CourseCardSkeleton />
          <CourseCardSkeleton />
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-12 text-center shadow-card flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-muted flex items-center justify-center mb-3">
            <BookOpen size={28} />
          </div>
          <h3 className="font-display text-lg font-bold text-ink">
            {searchQuery ? "No matching courses found" : "No courses managed yet"}
          </h3>
          <p className="text-sm text-muted max-w-sm mt-1">
            {searchQuery
              ? `We couldn't find any courses matching "${searchQuery}".`
              : "You haven't created any courses yet. Click below to add your first course."}
          </p>
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="mt-4 px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition flex items-center gap-1.5 shadow-sm"
            >
              <RotateCcw size={14} />
              Reset Search
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="mt-4 px-4 py-2.5 rounded-xl bg-orange hover:bg-orange-hover text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
            >
              <Plus size={16} />
              Create Your First Course
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="group flex flex-col rounded-2xl border border-line bg-white shadow-card hover:shadow-lift transition-all duration-300 overflow-hidden"
            >
              {/* Header / Thumbnail Banner */}
              <div className="relative h-40 w-full overflow-hidden bg-navy">
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
                <div className="absolute inset-0 bg-gradient-to-t from-navy/95 via-navy/50 to-transparent" />

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
                    {course.category || "Faculty Course"}
                  </span>
                  <div className="flex items-center gap-1 bg-navy/70 px-2 py-0.5 rounded-full backdrop-blur-xs text-[11px] text-slate-200">
                    <Clock size={12} />
                    <span>
                      {course.schedule
                        ? course.schedule.split("•")[0]
                        : "Schedule TBA"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <Link
                    to={`/teacher/courses/${course.id}`}
                    className="font-display text-lg font-bold text-ink group-hover:text-orange transition-colors"
                  >
                    {course.title}
                  </Link>

                  <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                    {course.description || "No course description provided."}
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/teacher/courses/${course.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-orange hover:bg-orange-hover text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <span>View &amp; Manage</span>
                    <ArrowRight size={14} />
                  </button>

                  <Link
                    to={`/teacher/submissions`}
                    className="p-2 rounded-xl border border-line bg-canvas hover:bg-slate-100 text-muted hover:text-ink transition-colors flex items-center justify-center"
                    title="View Submissions"
                  >
                    <ExternalLink size={16} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Course Modal */}
      <Modal
        open={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setCreateError("");
        }}
        title="Create New Academic Course"
      >
        <form onSubmit={handleCreateCourse} className="space-y-4">
          {createError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
              {createError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Course Code *
              </label>
              <input
                type="text"
                required
                value={courseForm.code}
                onChange={(e) =>
                  setCourseForm((prev) => ({ ...prev, code: e.target.value }))
                }
                placeholder="e.g. CS-301"
                className="w-full rounded-xl border border-line bg-canvas p-2.5 text-sm text-ink outline-none focus:border-navy focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Course Credits
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={courseForm.credits}
                onChange={(e) =>
                  setCourseForm((prev) => ({
                    ...prev,
                    credits: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-line bg-canvas p-2.5 text-sm text-ink outline-none focus:border-navy focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Course Title *
            </label>
            <input
              type="text"
              required
              value={courseForm.title}
              onChange={(e) =>
                setCourseForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g. Database Management Systems"
              className="w-full rounded-xl border border-line bg-canvas p-2.5 text-sm text-ink outline-none focus:border-navy focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Course Description
            </label>
            <textarea
              rows={3}
              value={courseForm.description}
              onChange={(e) =>
                setCourseForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="A comprehensive introduction to relational schemas, SQL, and normalization..."
              className="w-full rounded-xl border border-line bg-canvas p-2.5 text-sm text-ink outline-none focus:border-navy focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Category
              </label>
              <input
                type="text"
                value={courseForm.category}
                onChange={(e) =>
                  setCourseForm((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
                placeholder="e.g. Core Computer Science"
                className="w-full rounded-xl border border-line bg-canvas p-2.5 text-sm text-ink outline-none focus:border-navy focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Schedule
              </label>
              <input
                type="text"
                value={courseForm.schedule}
                onChange={(e) =>
                  setCourseForm((prev) => ({
                    ...prev,
                    schedule: e.target.value,
                  }))
                }
                placeholder="e.g. Mon, Wed • 10:00 - 11:30 AM"
                className="w-full rounded-xl border border-line bg-canvas p-2.5 text-sm text-ink outline-none focus:border-navy focus:bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setCreateModalOpen(false);
                setCreateError("");
              }}
              disabled={creating}
              className="rounded-xl border border-line px-4 py-2 text-xs font-semibold text-muted hover:text-ink transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="rounded-xl bg-orange hover:bg-orange-hover px-5 py-2 text-xs font-semibold text-white shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {creating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Course"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
