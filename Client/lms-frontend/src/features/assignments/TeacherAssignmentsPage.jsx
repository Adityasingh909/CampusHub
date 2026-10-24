import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  Search,
  Plus,
  Clock,
  Loader2,
  AlertCircle,
  RotateCcw,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { api } from "../../services/api";
import { AssignmentCardSkeleton } from "../../components/ui/Skeleton";
import { Modal } from "../../components/ui/Modal";

export function TeacherAssignmentsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissionsByAssignment, setSubmissionsByAssignment] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nowTimestamp, setNowTimestamp] = useState(() => Date.now());

  const [selectedCourseId, setSelectedCourseId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [newAssignment, setNewAssignment] = useState({
    courseId: "",
    title: "",
    description: "",
    dueDate: "",
    totalPoints: 100,
  });

  const [reloadKey, setReloadKey] = useState(0);

  const refetchData = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadTeacherAssignments() {
      try {
        setLoading(true);
        setError("");
        setNowTimestamp(Date.now());

        // 1. Fetch courses owned by teacher
        const courseRes = await api().get("/course/");
        const allCourses = courseRes?.courses || [];
        const myCourses = allCourses.filter(
          (c) => Number(c.teacherId) === Number(user?.id)
        );

        if (cancelled) return;
        setCourses(myCourses);

        if (myCourses.length > 0) {
          setNewAssignment((prev) =>
            prev.courseId ? prev : { ...prev, courseId: String(myCourses[0].id) }
          );
        }

        // 2. Fetch assignments concurrently for each course
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

        // 3. Fetch submissions concurrently for each assignment
        const submissionPromises = assignmentsList.map(async (a) => {
          try {
            const subRes = await api().get(`/assignments/${a.id}/submissions`);
            return {
              assignmentId: a.id,
              submissions: subRes?.submissions || [],
            };
          } catch (e) {
            console.warn(`Could not fetch submissions for assignment ${a.id}:`, e.message);
            return { assignmentId: a.id, submissions: [] };
          }
        });

        const subResults = await Promise.all(submissionPromises);
        const subMap = {};
        for (const item of subResults) {
          subMap[item.assignmentId] = item.submissions;
        }

        if (cancelled) return;
        setSubmissionsByAssignment(subMap);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load assignments");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTeacherAssignments();

    return () => {
      cancelled = true;
    };
  }, [user?.id, reloadKey]);

  const filteredAssignments = useMemo(() => {
    let result = [...assignments];

    if (selectedCourseId !== "all") {
      result = result.filter(
        (a) => String(a.courseId) === String(selectedCourseId)
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.title?.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q) ||
          a.course?.code?.toLowerCase().includes(q)
      );
    }

    // Sort by due date (soonest / most recent first)
    result.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
    });

    return result;
  }, [assignments, selectedCourseId, searchQuery]);

  // Overall stats
  const stats = useMemo(() => {
    let totalSubs = 0;
    let pendingGrading = 0;

    for (const subs of Object.values(submissionsByAssignment)) {
      totalSubs += subs.length;
      pendingGrading += subs.filter((s) => s.status !== "GRADED").length;
    }

    return {
      totalAssignments: assignments.length,
      totalSubs,
      pendingGrading,
    };
  }, [assignments, submissionsByAssignment]);

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!newAssignment.courseId) {
      setCreateError("Please select a course for this assignment.");
      return;
    }
    if (!newAssignment.title.trim()) {
      setCreateError("Assignment title is required.");
      return;
    }
    if (!newAssignment.dueDate) {
      setCreateError("Due date is required.");
      return;
    }

    try {
      setCreating(true);
      setCreateError("");

      const res = await api().post("/assignments", {
        courseId: Number(newAssignment.courseId),
        title: newAssignment.title.trim(),
        description: newAssignment.description.trim(),
        dueDate: new Date(newAssignment.dueDate).toISOString(),
        totalPoints: Number(newAssignment.totalPoints) || 100,
      });

      if (!res?.success) {
        throw new Error(res?.message || "Failed to create assignment");
      }

      toast.show("Assignment created and published!", "success");
      setCreateModalOpen(false);
      setNewAssignment({
        courseId: courses[0]?.id ? String(courses[0].id) : "",
        title: "",
        description: "",
        dueDate: "",
        totalPoints: 100,
      });
      refetchData();
    } catch (err) {
      setCreateError(err.message || "Failed to create assignment.");
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
        <h3 className="text-base font-bold text-ink">Failed to Load Assignments</h3>
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
            <span className="text-ink">Course Assignments</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            Assignments Management
          </h1>
          <p className="text-sm text-muted mt-1">
            Create, publish, and monitor coursework tasks across your teaching roster.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Quick Stats Ribbon */}
          <div className="flex items-center gap-4 bg-white border border-line px-5 py-3 rounded-2xl shadow-card">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange animate-pulse" />
              <span className="text-xs text-muted font-medium">Tasks:</span>
              <span className="text-sm font-bold text-ink">{stats.totalAssignments}</span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-orange" />
              <span className="text-xs text-muted font-medium">To Grade:</span>
              <span className="text-sm font-bold text-orange">{stats.pendingGrading}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-3 rounded-2xl bg-orange hover:bg-orange-hover text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Create Assignment</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
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
            placeholder="Search assignments by title or description..."
            className="h-[42px] w-full rounded-xl border border-line bg-canvas pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-muted focus:border-navy focus:bg-white focus:ring-[3px] focus:ring-navy/15"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="h-[42px] rounded-xl border border-line bg-canvas px-4 pr-9 text-xs sm:text-sm font-semibold text-ink outline-none cursor-pointer hover:bg-slate-100 transition"
          >
            <option value="all">All Courses ({courses.length})</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assignments List */}
      {loading ? (
        <div className="flex flex-col gap-4">
          <AssignmentCardSkeleton />
          <AssignmentCardSkeleton />
          <AssignmentCardSkeleton />
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-12 text-center shadow-card flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-muted flex items-center justify-center mb-3">
            <ClipboardList size={28} />
          </div>
          <h3 className="font-display text-lg font-bold text-ink">
            {searchQuery || selectedCourseId !== "all"
              ? "No assignments matching your filters"
              : "No coursework created yet"}
          </h3>
          <p className="text-sm text-muted max-w-sm mt-1">
            {searchQuery || selectedCourseId !== "all"
              ? "Try resetting your course filter or search keywords."
              : "Publish assignments for students to complete and submit for grading."}
          </p>
          {searchQuery || selectedCourseId !== "all" ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCourseId("all");
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition flex items-center gap-1.5 shadow-sm"
            >
              <RotateCcw size={14} />
              Reset Filters
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="mt-4 px-4 py-2.5 rounded-xl bg-orange hover:bg-orange-hover text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
            >
              <Plus size={16} />
              Create First Assignment
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredAssignments.map((assignment) => {
            const subs = submissionsByAssignment[assignment.id] || [];
            const pendingSubs = subs.filter((s) => s.status !== "GRADED");
            const gradedSubs = subs.filter((s) => s.status === "GRADED");

            const due = assignment.dueDate ? new Date(assignment.dueDate) : null;
            const isPastDue = due ? due.getTime() < nowTimestamp : false;

            return (
              <div
                key={assignment.id}
                className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 rounded-2xl border border-line bg-white p-5 shadow-card hover:shadow-lift transition-all"
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-navy flex-shrink-0 mt-0.5">
                    <ClipboardList size={22} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="px-2.5 py-0.5 rounded-md bg-navy text-white text-[11px] font-bold">
                        {assignment.course?.code || "Course"}
                      </span>
                      <h3 className="font-display text-base font-bold text-ink">
                        {assignment.title}
                      </h3>
                    </div>

                    <p className="text-xs text-muted line-clamp-2 leading-relaxed mb-2">
                      {assignment.description || "No description provided."}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock size={13} className={isPastDue ? "text-red-500" : "text-orange"} />
                        <span className={isPastDue ? "text-red-600 font-semibold" : ""}>
                          Due:{" "}
                          {due
                            ? due.toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "No due date"}
                        </span>
                      </span>

                      <span>•</span>

                      <span>{assignment.totalPoints || 100} Total Points</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-3 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <div className="flex flex-col text-left lg:text-right">
                    <span className="text-xs font-bold text-ink">
                      {subs.length} Submissions
                    </span>
                    <span className="text-[11px] text-muted">
                      {pendingSubs.length > 0 ? (
                        <span className="text-orange font-semibold">
                          {pendingSubs.length} awaiting grading
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium">
                          All {gradedSubs.length} graded
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/teacher/submissions?assignmentId=${assignment.id}`}
                      className="px-4 py-2 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <span>Submissions</span>
                      <ChevronRight size={14} />
                    </Link>

                    <Link
                      to={`/teacher/courses/${assignment.courseId}`}
                      title="View Course"
                      className="p-2 rounded-xl border border-line bg-canvas hover:bg-slate-100 text-muted hover:text-ink transition-colors"
                    >
                      <BookOpen size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Assignment Modal */}
      <Modal
        open={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setCreateError("");
        }}
        title="Create &amp; Publish New Assignment"
      >
        <form onSubmit={handleCreateAssignment} className="space-y-4">
          {createError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
              {createError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Select Course *
            </label>
            <select
              required
              value={newAssignment.courseId}
              onChange={(e) =>
                setNewAssignment((prev) => ({
                  ...prev,
                  courseId: e.target.value,
                }))
              }
              className="w-full rounded-xl border border-line bg-canvas p-2.5 text-sm text-ink outline-none focus:border-navy focus:bg-white"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Assignment Title *
            </label>
            <input
              type="text"
              required
              value={newAssignment.title}
              onChange={(e) =>
                setNewAssignment((prev) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
              placeholder="e.g. Midterm Lab 3: Index Optimization"
              className="w-full rounded-xl border border-line bg-canvas p-2.5 text-sm text-ink outline-none focus:border-navy focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Instructions / Description
            </label>
            <textarea
              rows={3}
              value={newAssignment.description}
              onChange={(e) =>
                setNewAssignment((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Outline the problem specification, submission requirements, and rubric details..."
              className="w-full rounded-xl border border-line bg-canvas p-2.5 text-sm text-ink outline-none focus:border-navy focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Due Date &amp; Time *
              </label>
              <input
                type="datetime-local"
                required
                value={newAssignment.dueDate}
                onChange={(e) =>
                  setNewAssignment((prev) => ({
                    ...prev,
                    dueDate: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-line bg-canvas p-2.5 text-xs text-ink outline-none focus:border-navy focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Total Points
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={newAssignment.totalPoints}
                onChange={(e) =>
                  setNewAssignment((prev) => ({
                    ...prev,
                    totalPoints: e.target.value,
                  }))
                }
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
                  Publishing...
                </>
              ) : (
                "Publish Assignment"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
