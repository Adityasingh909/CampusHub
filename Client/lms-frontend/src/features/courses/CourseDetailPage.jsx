import { useContext, useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  BookOpen,
  ArrowLeft,
  Clock,
  MapPin,
  User,
  Mail,
  Download,
  Share2,
  Bookmark,
  CheckCircle2,
  FileText,
  ClipboardList,
  Megaphone,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  Plus,
  Loader2,
} from "lucide-react";

import { AuthContext } from "../../context/AuthContext";
import { api } from "../../services/api";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../hooks/useToast";
import { Skeleton, DetailHeroSkeleton } from "../../components/ui/Skeleton";
import { CourseAnnouncementsTab } from "./CourseAnnouncementsTab";
import { getCourseAnnouncements } from "../../services/announcementService";

export function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useContext(AuthContext);

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [activeTab, setActiveTab] = useState("overview");
  const [announcementCount, setAnnouncementCount] = useState(null);
  const [announcementsCountLoading, setAnnouncementsCountLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  const [detailsForm, setDetailsForm] = useState({
    description: "",
    syllabusUrl: "",
    officeHours: "",
    learningObjectives: "",
  });

  const isTeacher = String(user?.role || "").toUpperCase() === "TEACHER";
  const coursesPath = isTeacher ? "/teacher/courses" : "/student/courses";
  const assignmentsPath = isTeacher ? "/teacher/assignments" : "/student/assignments";

  const canEditCourse =
    isTeacher &&
    user?.id != null &&
    course?.teacherId != null &&
    Number(user.id) === Number(course.teacherId);

  // Load the course from the backend.
  useEffect(() => {
    let cancelled = false;

    async function fetchCourse() {
      try {
        setLoading(true);
        setFetchError("");

        const response = await api().get(`/course/${courseId}`);

        if (!response?.course) {
          throw new Error("Course not found.");
        }

        const foundCourse = response.course;

        // Load enrollment progress when available.
        let enrollmentProgress = 0;

        try {
          const enrollmentResponse = await api().get(
            "/enrollments/my-courses"
          );

          const enrollment = (
            enrollmentResponse.enrollments ?? []
          ).find(
            (item) =>
              String(item.courseId) === String(foundCourse.id)
          );

          if (enrollment) {
            enrollmentProgress = enrollment.progress ?? 0;
          }
        } catch (error) {
          // The course itself can still be displayed if enrollment
          // data isn't available to this user.
          console.warn("Enrollment progress unavailable:", error.message);
        }

        if (!cancelled) {
          const loadedCourse = {
            ...foundCourse,
            progress: enrollmentProgress,
            instructor:
              foundCourse.teacher?.name ||
              foundCourse.instructor ||
              "Instructor not assigned",
          };
          setCourse(loadedCourse);
          setDetailsForm({
            description: loadedCourse.description ?? "",
            syllabusUrl: loadedCourse.syllabusUrl ?? "",
            officeHours: loadedCourse.officeHours ?? "",
            learningObjectives: (
              loadedCourse.learningObjectives ?? []
            ).join("\n"),
          });

          // Eagerly load the course announcement count so it is accurate immediately
          try {
            setAnnouncementsCountLoading(true);
            const annResponse = await getCourseAnnouncements(courseId, { silent: true });
            let list = [];
            if (Array.isArray(annResponse)) {
              list = annResponse;
            } else if (Array.isArray(annResponse?.announcements)) {
              list = annResponse.announcements;
            } else if (Array.isArray(annResponse?.data)) {
              list = annResponse.data;
            }
            if (!cancelled) {
              setAnnouncementCount(list.length);
            }
          } catch (annError) {
            console.warn("Initial announcement count fetch failed:", annError.message);
            if (!cancelled) {
              if (Array.isArray(loadedCourse.announcements)) {
                setAnnouncementCount(loadedCourse.announcements.length);
              } else {
                setAnnouncementCount(0);
              }
            }
          } finally {
            if (!cancelled) {
              setAnnouncementsCountLoading(false);
            }
          }
        }
      } catch (error) {
        if (!cancelled) {
          setCourse(null);
          setFetchError(error.message || "Failed to load course.");
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

  const updateFormField = (field, value) => {
    setDetailsForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSaveCourseDetails = async () => {
    if (!canEditCourse || !course) {
      setDetailsError("You are not allowed to edit this course.");
      return;
    }

    try {
      setSavingDetails(true);
      setDetailsError("");

      const syllabusUrl = detailsForm.syllabusUrl.trim();

      if (syllabusUrl) {
        let parsedUrl;

        try {
          parsedUrl = new URL(syllabusUrl);
        } catch {
          throw new Error("Enter a valid syllabus URL.");
        }

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          throw new Error("The syllabus URL must use HTTP or HTTPS.");
        }
      }

      const response = await api().put(`/course/${course.id}`, {
        description: detailsForm.description.trim(),
        syllabusUrl,
        officeHours: detailsForm.officeHours.trim(),
        learningObjectives: detailsForm.learningObjectives
          .split("\n")
          .map((objective) => objective.trim())
          .filter(Boolean),
      });

      if (!response?.success || !response.course) {
        throw new Error(
          response?.message || "Failed to update course details."
        );
      }

      setCourse((previous) => ({
        ...previous,
        ...response.course,
        teacher: previous.teacher,
        instructor:
          response.course.teacher?.name ||
          previous.teacher?.name ||
          response.course.instructor ||
          previous.instructor,
      }));

      setIsEditingDetails(false);
      toast.show("Course details saved successfully.", "success");
    } catch (error) {
      setDetailsError(
        error.message || "Failed to save course details."
      );
    } finally {
      setSavingDetails(false);
    }
  };

  const handleCancelEditing = () => {
    setDetailsForm({
      description: course.description ?? "",
      syllabusUrl: course.syllabusUrl ?? "",
      officeHours: course.officeHours ?? "",
      learningObjectives: (
        course.learningObjectives ?? []
      ).join("\n"),
    });

    setDetailsError("");
    setIsEditingDetails(false);
  };

  const handleSaveCourse = () => {
    setSaved((previous) => !previous);

    toast.show(
      saved
        ? "Course removed from bookmarks."
        : "Course saved to your academic bookmarks.",
      "success"
    );
  };

  const handleShareCourse = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.show("Course link copied to clipboard.", "success");
    } catch {
      toast.show("Unable to copy the course link.", "error");
    }
  };

  const [courseAssignments, setCourseAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [createAssignmentOpen, setCreateAssignmentOpen] = useState(false);
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false);
  const [assignmentFormError, setAssignmentFormError] = useState("");
  const [assignmentReloadKey, setAssignmentReloadKey] = useState(0);
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    dueDate: "",
    totalPoints: 100,
  });

  const refetchAssignments = useCallback(() => {
    setAssignmentReloadKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAssignments() {
      if (!courseId) return;
      try {
        setAssignmentsLoading(true);
        if (isTeacher) {
          const res = await api().get(`/assignments/course/${courseId}`);
          if (!cancelled) {
            setCourseAssignments(res?.assignments || []);
          }
        } else {
          const res = await api().get("/assignments/student");
          const studentAssignments = (res?.assignments || []).filter(
            (a) => String(a.courseId) === String(courseId)
          );
          if (!cancelled) {
            setCourseAssignments(studentAssignments);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch course assignments:", err.message);
      } finally {
        if (!cancelled) {
          setAssignmentsLoading(false);
        }
      }
    }

    loadAssignments();

    return () => {
      cancelled = true;
    };
  }, [courseId, isTeacher, assignmentReloadKey]);

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!newAssignment.title.trim()) {
      setAssignmentFormError("Assignment title is required.");
      return;
    }
    if (!newAssignment.dueDate) {
      setAssignmentFormError("Due date is required.");
      return;
    }

    try {
      setAssignmentSubmitting(true);
      setAssignmentFormError("");

      const res = await api().post("/assignments", {
        title: newAssignment.title.trim(),
        description: newAssignment.description.trim(),
        dueDate: new Date(newAssignment.dueDate).toISOString(),
        totalPoints: Number(newAssignment.totalPoints) || 100,
        courseId: Number(courseId),
      });

      if (!res?.success) {
        throw new Error(res?.message || "Failed to create assignment");
      }

      toast.show("Assignment created successfully!", "success");
      setCreateAssignmentOpen(false);
      setNewAssignment({
        title: "",
        description: "",
        dueDate: "",
        totalPoints: 100,
      });
      refetchAssignments();
    } catch (err) {
      setAssignmentFormError(err.message || "Failed to create assignment.");
    } finally {
      setAssignmentSubmitting(false);
    }
  };

  const completedAssignments = courseAssignments.filter(
    (assignment) =>
      assignment.submissionStatus === "SUBMITTED" ||
      assignment.submissionStatus === "GRADED" ||
      assignment.status === "SUBMITTED" ||
      assignment.status === "GRADED" ||
      assignment.mySubmission
  ).length;

  const totalAssignments = courseAssignments.length;

  const assignmentProgress =
    totalAssignments === 0
      ? 0
      : Math.round(
          (completedAssignments / totalAssignments) * 100
        );

  const materials = useMemo(() => {
    if (!course) return [];

    return course.materials ?? [];
  }, [course]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 lg:gap-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20 rounded-md" />
          <span className="text-muted">/</span>
          <Skeleton className="h-4 w-32 rounded-md" />
        </div>

        <DetailHeroSkeleton />

        <div className="flex gap-2 border-b border-line pb-3">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="rounded-2xl border border-line bg-white p-6 shadow-card flex flex-col gap-4">
              <Skeleton className="h-6 w-40 rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-5/6 rounded-md" />
              <Skeleton className="h-4 w-3/4 rounded-md" />
            </div>
            <div className="rounded-2xl border border-line bg-white p-6 shadow-card flex flex-col gap-4">
              <Skeleton className="h-6 w-48 rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-2/3 rounded-md" />
            </div>
          </div>
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="rounded-2xl border border-line bg-white p-6 shadow-card flex flex-col gap-4">
              <Skeleton className="h-5 w-32 rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-4/5 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-line bg-white p-12 text-center shadow-card">
        <AlertCircle size={32} className="mb-4 text-orange" />

        <h2 className="font-display text-2xl font-bold text-ink">
          Course Not Found
        </h2>

        <p className="mt-2 max-w-md text-sm text-muted">
          {fetchError || `Course ${courseId} could not be found.`}
        </p>

        <button
          type="button"
          onClick={() => navigate(coursesPath)}
          className="mt-6 flex items-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white"
        >
          <ArrowLeft size={16} />
          Back to Courses
        </button>
      </div>
    );
  }

  const instructorName =
    course.teacher?.name || course.instructor || "Instructor not assigned";

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      {/* Breadcrumb and actions */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
          <Link
            to={coursesPath}
            className="flex items-center gap-1 hover:text-navy"
          >
            <BookOpen size={14} />
            My Courses
          </Link>

          <span>/</span>

          <span className="font-bold text-ink">
            {course.title} ({course.code})
          </span>
        </div>

        <div className="flex items-center gap-2 self-start">
          <button
            type="button"
            onClick={handleSaveCourse}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-ink"
          >
            <Bookmark size={15} />
            {saved ? "Saved" : "Save Course"}
          </button>

          <button
            type="button"
            onClick={handleShareCourse}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-ink"
          >
            <Share2 size={15} />
            Share
          </button>
        </div>
      </div>

      {/* Course hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-navy-deep via-navy to-navy-hover p-6 text-white shadow-card sm:p-8">
        <div className="relative z-10 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-3xl flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-orange px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                {course.code}
              </span>

              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-200">
                {course.credits} Credits
              </span>

              {course.category && (
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-200">
                  {course.category}
                </span>
              )}
            </div>

            <h1 className="mb-2 font-display text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
              {course.title}
            </h1>

            <p className="max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
              {course.description || "Course description not provided."}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-300 sm:text-sm">
              <div className="flex items-center gap-1.5">
                <User size={16} className="text-orange" />
                <span className="font-medium text-white">
                  {instructorName}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Clock size={16} className="text-blue-300" />
                <span>{course.schedule || "Schedule not set"}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <MapPin size={16} className="text-emerald-300" />
                <span>{course.room || "Room not set"}</span>
              </div>
            </div>
          </div>

          {/* Progress and Continue Learning */}
          <div className="flex w-full flex-col gap-4 rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-md lg:w-80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Assignment Progress
              </span>

              <span className="font-display text-xl font-bold">
                {assignmentProgress}%
              </span>
            </div>

            <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/25">
              <div
                className="h-full rounded-full bg-orange transition-all duration-500"
                style={{ width: `${assignmentProgress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-medium text-slate-300">
              <span>
                {completedAssignments} of {totalAssignments} completed
              </span>

              <span className="font-bold text-orange">
                {totalAssignments - completedAssignments} Remaining
              </span>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab("assignments")}
              className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-orange px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-hover"
            >
              Continue Learning
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="w-full overflow-x-auto rounded-2xl border border-line bg-white p-1.5 shadow-card">
        <div className="flex min-w-max items-center gap-1 sm:min-w-0" role="tablist">
          {[
            { id: "overview", label: "Overview", icon: BookOpen },
            { id: "materials", label: "Materials", icon: FileText },
            { id: "assignments", label: "Assignments", icon: ClipboardList },
            { id: "announcements", label: "Announcements", icon: Megaphone },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              onClick={() => setActiveTab(id)}
              className={`flex min-w-[120px] flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition sm:text-sm ${
                activeTab === id
                  ? "bg-navy text-white shadow-sm"
                  : "text-muted hover:bg-slate-50 hover:text-ink"
              }`}
            >
              <Icon size={16} />
              {label}

              {id === "materials" && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-ink">
                  {materials.length}
                </span>
              )}

              {id === "assignments" && (
                <span className="rounded-full bg-orange/10 px-2 py-0.5 text-[11px] text-orange">
                  {courseAssignments.length}
                </span>
              )}

              {id === "announcements" && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-ink min-w-[20px] inline-flex items-center justify-center">
                  {announcementsCountLoading ? (
                    <span className="inline-block h-2 w-2 rounded-full border border-slate-400 border-t-navy animate-spin" />
                  ) : (
                    announcementCount ?? 0
                  )}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="flex flex-col gap-6 lg:col-span-8">
            {/* About Course */}
            <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-6 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="h-6 w-2.5 rounded-full bg-orange" />

                  <h2 className="font-display text-xl font-bold text-ink">
                    About This Course
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  {course.updatedAt && (
                    <span className="text-xs text-muted">
                      Updated{" "}
                      {new Date(course.updatedAt).toLocaleDateString()}
                    </span>
                  )}

                  {canEditCourse && (
                    <button
                      type="button"
                      onClick={() => {
                        if (isEditingDetails) {
                          handleCancelEditing();
                        } else {
                          setDetailsError("");
                          setIsEditingDetails(true);
                        }
                      }}
                      className="rounded-lg border border-line px-3 py-2 text-xs font-semibold hover:bg-canvas"
                    >
                      {isEditingDetails ? "Cancel editing" : "Edit details"}
                    </button>
                  )}
                </div>
              </div>

              {isEditingDetails && canEditCourse ? (
                <label className="text-sm font-semibold text-ink">
                  Course description
                  <textarea
                    rows={5}
                    value={detailsForm.description}
                    onChange={(event) =>
                      updateFormField("description", event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-line p-3 text-sm font-normal"
                    placeholder="Enter the course description"
                  />
                </label>
              ) : (
                <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
                  {course.description ||
                    "No course description has been added yet."}
                </p>
              )}

              {/* Syllabus */}
              <div className="mt-2 flex flex-col items-start justify-between gap-4 rounded-xl border border-line/80 bg-canvas p-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-orange/10 text-orange">
                    <FileText size={24} />
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-display text-sm font-bold text-ink">
                      Course Syllabus &amp; Policy
                    </h4>

                    <p className="mt-1 text-xs text-muted">
                      {course.syllabusUrl
                        ? "Syllabus document available"
                        : "No syllabus document added yet."}
                    </p>
                  </div>
                </div>

                <div className="w-full sm:w-auto">
                  {isEditingDetails && canEditCourse ? (
                    <input
                      type="url"
                      value={detailsForm.syllabusUrl}
                      onChange={(event) =>
                        updateFormField("syllabusUrl", event.target.value)
                      }
                      placeholder="https://example.com/syllabus.pdf"
                      className="w-full rounded-xl border border-line bg-white p-3 text-sm sm:w-72"
                    />
                  ) : course.syllabusUrl ? (
                    <a
                      href={course.syllabusUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-navy px-4 py-2 text-xs font-semibold text-white hover:bg-navy-hover"
                    >
                      <Download size={14} />
                      View Syllabus
                    </a>
                  ) : (
                    <span className="text-xs text-muted">
                      Not available
                    </span>
                  )}
                </div>
              </div>

              {/* Office Hours editor */}
              {isEditingDetails && canEditCourse && (
                <label className="text-sm font-semibold text-ink">
                  Instructor office hours
                  <input
                    value={detailsForm.officeHours}
                    onChange={(event) =>
                      updateFormField("officeHours", event.target.value)
                    }
                    placeholder="e.g. Tuesday and Thursday, 3–5 PM"
                    className="mt-2 w-full rounded-xl border border-line p-3 text-sm font-normal"
                  />
                </label>
              )}

              {/* Save and Cancel */}
              {isEditingDetails && canEditCourse && (
                <div className="flex flex-col gap-3">
                  {detailsError && (
                    <p className="text-sm text-red-600">{detailsError}</p>
                  )}

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleCancelEditing}
                      disabled={savingDetails}
                      className="rounded-xl border border-line px-4 py-2 text-sm font-semibold"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveCourseDetails}
                      disabled={savingDetails}
                      className="rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {savingDetails ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        "Save changes"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Learning Objectives */}
            <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-6 shadow-card">
              <h3 className="font-display text-lg font-bold text-ink">
                Core Learning Objectives
              </h3>

              <p className="text-xs text-muted">
                Learning objectives defined by the course instructor.
              </p>

              {isEditingDetails && canEditCourse ? (
                <label className="text-sm font-semibold text-ink">
                  Learning objectives (one per line)
                  <textarea
                    rows={6}
                    value={detailsForm.learningObjectives}
                    onChange={(event) =>
                      updateFormField(
                        "learningObjectives",
                        event.target.value
                      )
                    }
                    placeholder={"Design REST APIs\nModel relational data"}
                    className="mt-2 w-full rounded-xl border border-line p-3 text-sm font-normal"
                  />
                </label>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {(course.learningObjectives ?? [])
                    .filter(Boolean)
                    .map((objective, index) => (
                      <div
                        key={`${index}-${objective}`}
                        className="flex items-start gap-3 rounded-xl border border-line/60 bg-canvas p-3.5"
                      >
                        <CheckCircle2
                          size={20}
                          className="mt-0.5 flex-shrink-0 text-orange"
                        />

                        <p className="text-sm text-ink">{objective}</p>
                      </div>
                    ))}

                  {(!course.learningObjectives ||
                    course.learningObjectives.filter(Boolean).length ===
                      0) && (
                    <p className="col-span-full text-sm text-muted">
                      No learning objectives have been added yet.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Instructor and milestones */}
          <div className="flex flex-col gap-6 lg:col-span-4">
            <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-6 shadow-card">
              <h3 className="border-b border-slate-100 pb-3 font-display text-base font-bold text-ink">
                Course Instructor
              </h3>

              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
                  {instructorName
                    .split(/\s+/)
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-ink">
                    {instructorName}
                  </h4>

                  <p className="text-xs text-muted">
                    {course.instructorRole || "Instructor"}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2 text-xs text-muted">
                <div className="flex items-center gap-2">
                  <Mail size={14} className="flex-shrink-0 text-navy" />

                  {course.teacher?.email ? (
                    <a
                      href={`mailto:${course.teacher.email}`}
                      className="break-all font-medium text-navy hover:underline"
                    >
                      {course.teacher.email}
                    </a>
                  ) : (
                    <span>Email not provided</span>
                  )}
                </div>

                <div className="flex items-start gap-2">
                  <Clock size={14} className="mt-0.5 flex-shrink-0 text-navy" />
                  <span>
                    {course.officeHours || "Office hours not set"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin size={14} className="flex-shrink-0 text-navy" />
                  <span>{course.room || "Room not set"}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-6 shadow-card">
              <h3 className="font-display text-base font-bold text-ink">
                Course Milestones
              </h3>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Total Credits</span>
                <span className="font-bold text-ink">
                  {course.credits}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Assignments Due</span>
                <span className="font-bold text-ink">
                  {totalAssignments - completedAssignments}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Assignments Completed</span>
                <span className="font-bold text-ink">
                  {completedAssignments}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Materials */}
      {activeTab === "materials" && (
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="font-display text-xl font-bold text-ink">
              Course Materials &amp; Lecture Vault
            </h3>
            <p className="mt-1 text-xs text-muted">
              Course materials available for this class.
            </p>
          </div>

          {materials.length === 0 ? (
            <div className="rounded-2xl border border-line bg-white p-8 text-center text-sm text-muted">
              No course materials have been added yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-line bg-white shadow-card">
              {materials.map((material, index) => (
                <div
                  key={material.id ?? index}
                  className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-3">
                    <FileText size={22} className="text-orange" />
                    <div>
                      <h4 className="text-sm font-bold text-ink">
                        {material.title}
                      </h4>
                      <p className="mt-1 text-xs text-muted">
                        {material.type || "Course material"}
                      </p>
                    </div>
                  </div>

                  {material.url && (
                    <a
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-navy hover:underline"
                    >
                      Open material
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assignments */}
      {activeTab === "assignments" && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-display text-xl font-bold text-ink">
                Course Assignments
              </h3>
              <p className="mt-1 text-xs text-muted">
                Assignments for {course.title}.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {canEditCourse && (
                <button
                  type="button"
                  onClick={() => setCreateAssignmentOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-orange px-4 py-2 text-xs font-semibold text-white hover:bg-orange-hover shadow-xs transition-colors"
                >
                  <Plus size={15} />
                  <span>Create Assignment</span>
                </button>
              )}

              <Link
                to={assignmentsPath}
                className="text-xs font-semibold text-navy hover:text-orange transition-colors"
              >
                View All Assignments →
              </Link>
            </div>
          </div>

          {assignmentsLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted gap-2">
              <Loader2 className="animate-spin text-orange" size={24} />
              <span className="text-xs">Loading course assignments...</span>
            </div>
          ) : courseAssignments.length === 0 ? (
            <div className="rounded-2xl border border-line bg-white p-8 text-center text-sm text-muted">
              No assignments currently available for this course.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {courseAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-line bg-white p-5 shadow-card sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <ClipboardList
                      size={22}
                      className="mt-1 flex-shrink-0 text-navy"
                    />

                    <div className="min-w-0">
                      <h4 className="font-display text-sm font-bold text-ink">
                        {assignment.title}
                      </h4>

                      <p className="mt-1 text-xs text-muted">
                        {course.code} • {assignment.totalPoints || 100} Points
                      </p>

                      <p className="mt-2 text-xs text-orange">
                        Due:{" "}
                        {assignment.dueDate
                          ? new Date(assignment.dueDate).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    {isTeacher ? (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-navy font-semibold">
                        {assignment.totalPoints || 100} pts
                      </span>
                    ) : assignment.submissionStatus === "GRADED" ? (
                      <Badge tone="success" dot>
                        Graded (
                        {assignment.mySubmission?.score != null
                          ? `${assignment.mySubmission.score}/${assignment.totalPoints}`
                          : "Done"}
                        )
                      </Badge>
                    ) : assignment.submissionStatus === "SUBMITTED" ? (
                      <Badge tone="warning" dot>
                        Submitted
                      </Badge>
                    ) : (
                      <Badge tone="neutral">Pending</Badge>
                    )}

                    {isTeacher ? (
                      <Link
                        to={`/teacher/submissions?assignmentId=${assignment.id}`}
                        className="flex items-center gap-1.5 rounded-xl bg-navy px-4 py-2 text-xs font-semibold text-white hover:bg-navy-hover transition-colors"
                      >
                        Submissions
                        <ExternalLink size={14} />
                      </Link>
                    ) : (
                      <Link
                        to={`/student/assignments/${assignment.id}`}
                        className="flex items-center gap-1.5 rounded-xl bg-orange px-4 py-2 text-xs font-semibold text-white hover:bg-orange-hover transition-colors"
                      >
                        {assignment.submissionStatus === "GRADED"
                          ? "View Grade"
                          : assignment.submissionStatus === "SUBMITTED"
                          ? "View"
                          : "Submit"}
                        <ExternalLink size={14} />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Announcements */}
      {activeTab === "announcements" && (
        <CourseAnnouncementsTab
          course={course}
          isTeacher={isTeacher}
          onCountChange={(count) => {
            setAnnouncementCount(count);
            setAnnouncementsCountLoading(false);
          }}
        />
      )}

      {/* Create Assignment Modal (Teachers only) */}
      {canEditCourse && (
        <Modal
          open={createAssignmentOpen}
          onClose={() => {
            setCreateAssignmentOpen(false);
            setAssignmentFormError("");
          }}
          title={`Create Assignment for ${course.code}`}
        >
          <form onSubmit={handleCreateAssignment} className="space-y-4">
            {assignmentFormError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                {assignmentFormError}
              </div>
            )}

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
                placeholder="e.g. Lab 4: Relational Normalization"
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
                placeholder="Detail what students must complete and submit..."
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
                  setCreateAssignmentOpen(false);
                  setAssignmentFormError("");
                }}
                disabled={assignmentSubmitting}
                className="rounded-xl border border-line px-4 py-2 text-xs font-semibold text-muted hover:text-ink transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={assignmentSubmitting}
                className="rounded-xl bg-orange hover:bg-orange-hover px-5 py-2 text-xs font-semibold text-white shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {assignmentSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Assignment"
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
