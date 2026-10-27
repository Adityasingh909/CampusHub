import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FileQuestion,
  Search,
  Plus,
  Clock,
  Loader2,
  AlertCircle,
  RotateCcw,
  BookOpen,
  Award,
  Users,
  CheckCircle2,
  Trash2,
  Edit3,
  Check,
  Send,
  Eye,
  X,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { api } from "../../services/api";
import * as quizService from "../../services/quizService";
import { Modal } from "../../components/ui/Modal";

export function TeacherQuizzesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [selectedCourseId, setSelectedCourseId] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // all | DRAFT | PUBLISHED
  const [searchQuery, setSearchQuery] = useState("");

  // Create Quiz Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [newQuiz, setNewQuiz] = useState({
    courseId: "",
    title: "",
    description: "",
    durationMinutes: 30,
    totalMarks: 100,
    windowStart: "",
    windowEnd: "",
  });

  // Edit Quiz Metadata / Settings Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [updatingQuiz, setUpdatingQuiz] = useState(false);
  const [editError, setEditError] = useState("");

  // Manage Questions Modal State
  const [questionsModalOpen, setQuestionsModalOpen] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [loadingQuizDetails, setLoadingQuizDetails] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [questionForm, setQuestionForm] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    explanation: "",
    points: 10,
  });
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [questionError, setQuestionError] = useState("");
  const [questionToDelete, setQuestionToDelete] = useState(null);
  const [deletingQuestion, setDeletingQuestion] = useState(false);

  // Publish Modal State
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [quizToPublish, setQuizToPublish] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Attempts / Results Modal State
  const [attemptsModalOpen, setAttemptsModalOpen] = useState(false);
  const [attemptsData, setAttemptsData] = useState(null);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  // Teacher ID from auth context
  const teacherId = useMemo(() => {
    return Number(user?.id || user?.userId || 0);
  }, [user]);

  // Load Teacher's Courses and Quizzes
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // 1. Fetch courses taught by teacher
      let myCourses = [];
      try {
        const courseRes = await api().get("/course/");
        const allCourses = courseRes?.courses || [];
        myCourses = teacherId
          ? allCourses.filter(
              (c) =>
                Number(c.teacherId) === teacherId ||
                Number(c.teacher?.id) === teacherId
            )
          : allCourses;
        setCourses(myCourses);
      } catch (e) {
        console.warn("Could not fetch courses list:", e.message);
      }

      // 2. Fetch teacher's quizzes
      const quizRes = await quizService.getTeacherQuizzes();
      const loadedQuizzes = quizRes?.quizzes || [];
      setQuizzes(loadedQuizzes);
    } catch (err) {
      console.error("Failed to load teacher quizzes:", err);
      setError(err.message || "Failed to load quizzes. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Combine courses from course API and any courses associated with quizzes
  const availableCourses = useMemo(() => {
    const map = new Map();
    courses.forEach((c) => {
      if (c && c.id) map.set(Number(c.id), c);
    });
    quizzes.forEach((q) => {
      if (q.course && q.course.id && !map.has(Number(q.course.id))) {
        map.set(Number(q.course.id), q.course);
      }
    });
    return Array.from(map.values());
  }, [courses, quizzes]);

  // Set default course for new quiz when courses become available
  useEffect(() => {
    if (!newQuiz.courseId && availableCourses.length > 0) {
      setNewQuiz((prev) => ({ ...prev, courseId: String(availableCourses[0].id) }));
    }
  }, [availableCourses, newQuiz.courseId]);

  function resetQuestionForm() {
    setEditingQuestionId(null);
    setQuestionForm({
      question: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      explanation: "",
      points: 10,
    });
    setQuestionError("");
    setQuestionToDelete(null);
  }

  // Handle open questions
  const handleOpenQuestions = useCallback(async (quiz) => {
    try {
      setLoadingQuizDetails(true);
      setQuestionsModalOpen(true);
      setQuestionError("");
      resetQuestionForm();

      const res = await quizService.getQuizById(quiz.id);
      setActiveQuiz(res?.quiz || quiz);
    } catch (err) {
      toast.show("Failed to load quiz details: " + err.message, "error");
      setQuestionsModalOpen(false);
    } finally {
      setLoadingQuizDetails(false);
    }
  }, [toast]);

  // Open questions editor automatically if URL parameter exists
  useEffect(() => {
    const editQuizId = searchParams.get("edit");
    if (editQuizId && quizzes.length > 0) {
      const q = quizzes.find((item) => String(item.id) === String(editQuizId));
      if (q) {
        handleOpenQuestions(q);
        setSearchParams({});
      }
    }
  }, [searchParams, quizzes, setSearchParams, handleOpenQuestions]);

  // Filtered Quizzes
  const filteredQuizzes = useMemo(() => {
    let list = [...quizzes];

    if (selectedCourseId !== "all") {
      list = list.filter((q) => String(q.courseId) === String(selectedCourseId));
    }

    if (statusFilter !== "all") {
      list = list.filter((q) => q.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (quiz) =>
          quiz.title.toLowerCase().includes(q) ||
          quiz.course?.title?.toLowerCase().includes(q) ||
          quiz.course?.code?.toLowerCase().includes(q) ||
          quiz.description?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [quizzes, selectedCourseId, statusFilter, searchQuery]);

  // Metrics (computed dynamically from live quiz data)
  const totalQuizzes = quizzes.length;
  const publishedCount = useMemo(
    () => quizzes.filter((q) => q.status === "PUBLISHED").length,
    [quizzes]
  );
  const draftCount = useMemo(
    () => quizzes.filter((q) => q.status === "DRAFT").length,
    [quizzes]
  );
  const totalQuestionsCount = useMemo(
    () => quizzes.reduce((sum, q) => sum + (q._count?.questions || 0), 0),
    [quizzes]
  );
  const totalAttemptsCount = useMemo(
    () => quizzes.reduce((sum, q) => sum + (q._count?.attempts || 0), 0),
    [quizzes]
  );

  // ----------------------------------------------------
  // 1. CREATE QUIZ HANDLERS
  // ----------------------------------------------------
  function handleOpenCreateModal() {
    setCreateError("");
    setNewQuiz({
      courseId: availableCourses[0]?.id ? String(availableCourses[0].id) : "",
      title: "",
      description: "",
      durationMinutes: 30,
      totalMarks: 100,
      windowStart: "",
      windowEnd: "",
    });
    setCreateModalOpen(true);
  }

  async function handleCreateQuiz(e) {
    e.preventDefault();
    if (!newQuiz.courseId) {
      setCreateError("Please select a course for this quiz.");
      return;
    }
    if (!newQuiz.title.trim()) {
      setCreateError("Quiz title is required.");
      return;
    }
    const duration = Number(newQuiz.durationMinutes);
    if (!duration || duration <= 0) {
      setCreateError("Duration must be a positive number of minutes.");
      return;
    }
    const marks = Number(newQuiz.totalMarks);
    if (!marks || marks <= 0) {
      setCreateError("Total marks must be a positive number.");
      return;
    }

    try {
      setCreating(true);
      setCreateError("");
      const payload = {
        courseId: Number(newQuiz.courseId),
        title: newQuiz.title.trim(),
        description: newQuiz.description.trim(),
        durationMinutes: duration,
        totalMarks: marks,
        windowStart: newQuiz.windowStart ? new Date(newQuiz.windowStart).toISOString() : undefined,
        windowEnd: newQuiz.windowEnd ? new Date(newQuiz.windowEnd).toISOString() : undefined,
      };

      const res = await quizService.createQuiz(payload);
      const createdQuiz = res?.quiz;

      toast.show("Quiz created successfully! Now add questions.", "success");
      setCreateModalOpen(false);

      // Update quiz list immediately
      if (createdQuiz) {
        setQuizzes((prev) => [createdQuiz, ...prev]);
        // Automatically open question manager for the new quiz
        handleOpenQuestions(createdQuiz);
      } else {
        await loadData();
      }
    } catch (err) {
      setCreateError(err.message || "Failed to create quiz.");
    } finally {
      setCreating(false);
    }
  }

  // ----------------------------------------------------
  // 2. SETTINGS / EDIT QUIZ METADATA
  // ----------------------------------------------------
  function handleOpenEdit(quiz) {
    const toDatetimeLocal = (isoStr) => {
      if (!isoStr) return "";
      try {
        const d = new Date(isoStr);
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
      } catch {
        return "";
      }
    };

    setEditingQuiz({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description || "",
      durationMinutes: quiz.durationMinutes,
      totalMarks: quiz.totalMarks,
      windowStart: toDatetimeLocal(quiz.windowStart),
      windowEnd: toDatetimeLocal(quiz.windowEnd),
      hasAttempts: (quiz._count?.attempts || 0) > 0,
    });
    setEditError("");
    setEditModalOpen(true);
  }

  async function handleUpdateQuiz(e) {
    e.preventDefault();
    if (!editingQuiz || !editingQuiz.title.trim()) {
      setEditError("Title cannot be empty.");
      return;
    }

    const duration = Number(editingQuiz.durationMinutes);
    if (!duration || duration <= 0) {
      setEditError("Duration must be a positive number of minutes.");
      return;
    }

    const marks = Number(editingQuiz.totalMarks);
    if (!marks || marks <= 0) {
      setEditError("Total marks must be a positive number.");
      return;
    }

    try {
      setUpdatingQuiz(true);
      setEditError("");

      const payload = {
        title: editingQuiz.title.trim(),
        description: editingQuiz.description.trim(),
        durationMinutes: duration,
        totalMarks: marks,
        windowStart: editingQuiz.windowStart
          ? new Date(editingQuiz.windowStart).toISOString()
          : null,
        windowEnd: editingQuiz.windowEnd
          ? new Date(editingQuiz.windowEnd).toISOString()
          : null,
      };

      const res = await quizService.updateQuiz(editingQuiz.id, payload);
      const updated = res?.quiz;

      toast.show("Quiz settings updated successfully.", "success");
      setEditModalOpen(false);

      if (updated) {
        setQuizzes((prev) =>
          prev.map((q) => (q.id === updated.id ? { ...q, ...updated } : q))
        );
      }
      await loadData();
    } catch (err) {
      setEditError(err.message || "Failed to update quiz settings.");
    } finally {
      setUpdatingQuiz(false);
    }
  }

  // ----------------------------------------------------
  // 3. DELETE QUIZ HANDLERS
  // ----------------------------------------------------
  function handleOpenDelete(quiz) {
    setQuizToDelete(quiz);
    setDeleteError("");
    setDeleteModalOpen(true);
  }

  async function handleConfirmDelete() {
    if (!quizToDelete) return;
    try {
      setDeleting(true);
      setDeleteError("");
      await quizService.deleteQuiz(quizToDelete.id);
      toast.show("Quiz deleted successfully.", "success");
      setDeleteModalOpen(false);
      setQuizzes((prev) => prev.filter((q) => q.id !== quizToDelete.id));
      setQuizToDelete(null);
      await loadData();
    } catch (err) {
      setDeleteError(err.message || "Failed to delete quiz.");
      toast.show(err.message || "Failed to delete quiz.", "error");
    } finally {
      setDeleting(false);
    }
  }

  // ----------------------------------------------------
  // 4. QUESTIONS MANAGEMENT HANDLERS
  // ----------------------------------------------------
  function handleAddOptionField() {
    setQuestionForm((prev) => ({
      ...prev,
      options: [...prev.options, ""],
    }));
  }

  function handleRemoveOptionField(index) {
    setQuestionForm((prev) => {
      const removedText = prev.options[index];
      const newOpts = prev.options.filter((_, i) => i !== index);
      const newCorrect =
        prev.correctAnswer === removedText ? "" : prev.correctAnswer;
      return {
        ...prev,
        options: newOpts,
        correctAnswer: newCorrect,
      };
    });
  }

  function handleOptionTextChange(index, val) {
    setQuestionForm((prev) => {
      const oldVal = prev.options[index];
      const newOpts = [...prev.options];
      newOpts[index] = val;
      const newCorrect = prev.correctAnswer === oldVal ? val : prev.correctAnswer;
      return {
        ...prev,
        options: newOpts,
        correctAnswer: newCorrect,
      };
    });
  }

  function handleSelectCorrectOption(optText) {
    if (!optText) return;
    setQuestionForm((prev) => ({
      ...prev,
      correctAnswer: optText,
    }));
  }

  function handleEditQuestionItem(q) {
    setEditingQuestionId(q.id);
    const opts = Array.isArray(q.options) ? [...q.options] : [];
    while (opts.length < 2) opts.push("");
    setQuestionForm({
      question: q.question,
      options: opts,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || "",
      points: q.points,
    });
    setQuestionError("");
  }

  async function handleSaveQuestion(e) {
    e.preventDefault();
    if (!activeQuiz) return;

    if (!questionForm.question.trim()) {
      setQuestionError("Question text is required.");
      return;
    }

    const validOptions = questionForm.options.map((o) => o.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      setQuestionError("At least two non-empty options are required.");
      return;
    }

    if (!questionForm.correctAnswer.trim()) {
      setQuestionError("Please select which option is the correct answer.");
      return;
    }

    if (!validOptions.includes(questionForm.correctAnswer.trim())) {
      setQuestionError("Correct answer must match one of the valid options.");
      return;
    }

    const pointsNum = Number(questionForm.points);
    if (!pointsNum || pointsNum <= 0) {
      setQuestionError("Points must be a positive integer.");
      return;
    }

    try {
      setSavingQuestion(true);
      setQuestionError("");

      const payload = {
        question: questionForm.question.trim(),
        options: validOptions,
        correctAnswer: questionForm.correctAnswer.trim(),
        explanation: questionForm.explanation.trim() || undefined,
        points: pointsNum,
      };

      if (editingQuestionId) {
        await quizService.updateQuizQuestion(activeQuiz.id, editingQuestionId, payload);
        toast.show("Question updated successfully.", "success");
      } else {
        await quizService.addQuizQuestion(activeQuiz.id, payload);
        toast.show("Question added successfully.", "success");
      }

      resetQuestionForm();

      // Refresh quiz questions
      const updatedQuiz = await quizService.getQuizById(activeQuiz.id);
      setActiveQuiz(updatedQuiz?.quiz);
      await loadData();
    } catch (err) {
      setQuestionError(err.message || "Failed to save question.");
    } finally {
      setSavingQuestion(false);
    }
  }

  async function handleConfirmDeleteQuestion() {
    if (!activeQuiz || !questionToDelete) return;

    try {
      setDeletingQuestion(true);
      await quizService.deleteQuizQuestion(activeQuiz.id, questionToDelete.id);
      toast.show("Question deleted.", "success");

      const updatedQuiz = await quizService.getQuizById(activeQuiz.id);
      setActiveQuiz(updatedQuiz?.quiz);

      if (editingQuestionId === questionToDelete.id) {
        resetQuestionForm();
      }
      setQuestionToDelete(null);
      await loadData();
    } catch (err) {
      toast.show(err.message || "Failed to delete question.", "error");
    } finally {
      setDeletingQuestion(false);
    }
  }

  // ----------------------------------------------------
  // 5. PUBLISH QUIZ HANDLERS
  // ----------------------------------------------------
  async function handleOpenPublish(quiz) {
    try {
      setPublishError("");
      const fullQuizRes = await quizService.getQuizById(quiz.id);
      setQuizToPublish(fullQuizRes?.quiz || quiz);
      setPublishModalOpen(true);
    } catch (err) {
      toast.show("Failed to verify quiz details: " + err.message, "error");
    }
  }

  async function handleConfirmPublish() {
    if (!quizToPublish) return;
    try {
      setPublishing(true);
      setPublishError("");
      await quizService.publishQuiz(quizToPublish.id);
      toast.show(
        `"${quizToPublish.title}" has been published! Students can now access it.`,
        "success"
      );
      setPublishModalOpen(false);
      setQuizzes((prev) =>
        prev.map((q) =>
          q.id === quizToPublish.id ? { ...q, status: "PUBLISHED" } : q
        )
      );
      setQuizToPublish(null);
      await loadData();
    } catch (err) {
      setPublishError(err.message || "Failed to publish quiz.");
    } finally {
      setPublishing(false);
    }
  }

  // ----------------------------------------------------
  // 6. ATTEMPTS / RESULTS MODAL
  // ----------------------------------------------------
  async function handleOpenAttempts(quiz) {
    try {
      setLoadingAttempts(true);
      setAttemptsModalOpen(true);
      const res = await quizService.getQuizAttempts(quiz.id);
      setAttemptsData(res);
    } catch (err) {
      toast.show(err.message || "Failed to load attempts.", "error");
      setAttemptsModalOpen(false);
    } finally {
      setLoadingAttempts(false);
    }
  }

  // Question Editor total points sum
  const activeQuizPointsSum = useMemo(() => {
    if (!activeQuiz?.questions) return 0;
    return activeQuiz.questions.reduce((sum, q) => sum + (q.points || 0), 0);
  }, [activeQuiz]);

  const pointsMatch = activeQuizPointsSum === activeQuiz?.totalMarks;

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted mb-1.5">
            <Link to="/teacher/dashboard" className="hover:text-navy transition-colors">
              Portal
            </Link>
            <span>/</span>
            <span className="text-ink">Quizzes</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange/10 text-orange flex items-center justify-center">
              <FileQuestion size={22} />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
                Quiz Management
              </h1>
              <p className="text-sm text-muted mt-0.5">
                Author assessments, configure MCQs, monitor student attempts, and release rubrics.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-orange text-white text-sm font-semibold hover:bg-orange/90 transition shadow-sm self-start md:self-auto cursor-pointer"
        >
          <Plus size={18} />
          <span>Create Quiz</span>
        </button>
      </div>

      {/* Metric Cards Strip (5 Stats: Total, Published, Drafts, Questions, Attempts) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-line shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-muted font-bold">
              Total Quizzes
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-navy">
              <BookOpen size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-2xl sm:text-3xl font-bold text-ink">
              {String(totalQuizzes).padStart(2, "0")}
            </span>
            <span className="text-[11px] text-muted font-medium">All subjects</span>
          </div>
          <span className="text-[11px] text-muted mt-1">Managed tests</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-line shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-muted font-bold">
              Published
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-2xl sm:text-3xl font-bold text-emerald-700">
              {String(publishedCount).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-semibold text-emerald-700">Live</span>
          </div>
          <span className="text-[11px] text-muted mt-1">Student accessible</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-line shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-muted font-bold">
              Drafts
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
              <Edit3 size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-2xl sm:text-3xl font-bold text-amber-700">
              {String(draftCount).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-semibold text-amber-700">Pending</span>
          </div>
          <span className="text-[11px] text-muted mt-1">Under authoring</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-line shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-muted font-bold">
              Questions
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
              <FileQuestion size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-2xl sm:text-3xl font-bold text-blue-700">
              {String(totalQuestionsCount).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-semibold text-blue-700">Authored</span>
          </div>
          <span className="text-[11px] text-muted mt-1">Total items</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-line shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-muted font-bold">
              Attempts
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange/10 flex items-center justify-center text-orange">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-2xl sm:text-3xl font-bold text-ink">
              {String(totalAttemptsCount).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-semibold text-orange">Submissions</span>
          </div>
          <span className="text-[11px] text-muted mt-1">All cohorts</span>
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
              onClick={() => setStatusFilter("PUBLISHED")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                statusFilter === "PUBLISHED"
                  ? "bg-white text-ink shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Published ({publishedCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("DRAFT")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                statusFilter === "DRAFT"
                  ? "bg-white text-ink shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Drafts ({draftCount})</span>
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
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search quizzes by title or course..."
                className="h-[38px] w-full rounded-xl border border-line bg-canvas pl-9 pr-3 text-xs text-ink outline-none transition placeholder:text-muted focus:border-navy focus:bg-white"
              />
            </div>

            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="h-[38px] w-full appearance-none rounded-xl border border-line bg-canvas pl-3.5 pr-8 text-xs font-semibold text-ink outline-none cursor-pointer hover:bg-slate-100 transition"
              >
                <option value="all">All Taught Courses ({availableCourses.length})</option>
                {availableCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Quizzes List / Empty / Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 rounded-2xl bg-white border border-line shadow-card text-center">
          <Loader2 size={36} className="animate-spin text-orange mb-3" />
          <p className="text-sm font-semibold text-ink">Loading quizzes and assessments...</p>
          <p className="text-xs text-muted mt-1">Connecting to live course data</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-red-50 border border-red-200 text-center flex flex-col items-center">
          <AlertCircle size={36} className="text-red-500 mb-2" />
          <h3 className="font-display font-bold text-red-900 text-base">Error Loading Quizzes</h3>
          <p className="text-xs text-red-700 max-w-md mt-1">{error}</p>
          <button
            type="button"
            onClick={loadData}
            className="mt-4 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Try Again</span>
          </button>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-12 text-center shadow-card flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-orange/10 text-orange flex items-center justify-center mb-3">
            <FileQuestion size={28} />
          </div>
          <h3 className="font-display text-lg font-bold text-ink">No quizzes found</h3>
          <p className="text-sm text-muted max-w-sm mt-1">
            {searchQuery || selectedCourseId !== "all" || statusFilter !== "all"
              ? "No quizzes match your selected filter criteria."
              : "You have not created any quizzes yet. Click below to create your first assessment."}
          </p>
          {searchQuery || selectedCourseId !== "all" || statusFilter !== "all" ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCourseId("all");
                setStatusFilter("all");
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Reset Filters</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="mt-4 px-5 py-2.5 rounded-xl bg-orange text-white text-xs font-semibold hover:bg-orange/90 transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus size={16} />
              <span>Create First Quiz</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredQuizzes.map((quiz) => {
            const isDraft = quiz.status === "DRAFT";
            const qCount = quiz._count?.questions || 0;
            const aCount = quiz._count?.attempts || 0;

            const formatWindow = (start, end) => {
              if (!start && !end) return null;
              if (start && end) {
                return `${new Date(start).toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${new Date(end).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
              }
              if (start) return `From ${new Date(start).toLocaleDateString()}`;
              return `Until ${new Date(end).toLocaleDateString()}`;
            };

            const windowText = formatWindow(quiz.windowStart, quiz.windowEnd);

            return (
              <div
                key={quiz.id}
                className="p-5 rounded-2xl bg-white border border-line shadow-card flex flex-col justify-between hover:border-slate-300 transition duration-150 gap-4"
              >
                <div>
                  {/* Top Bar: Course Badge and Status Tag */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-bold tracking-wide">
                      {quiz.course?.code || "COURSE"}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                        isDraft
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isDraft ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                      />
                      {quiz.status}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-display font-bold text-ink text-base line-clamp-1">
                    {quiz.title}
                  </h3>
                  <p className="text-xs text-muted line-clamp-2 mt-1">
                    {quiz.description || "No description provided."}
                  </p>

                  {/* Course Name */}
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-muted font-medium">
                    <BookOpen size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">{quiz.course?.title}</span>
                  </div>

                  {/* Availability Window (if configured) */}
                  {windowText && (
                    <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                      <Calendar size={12} className="text-blue-600" />
                      <span>{windowText}</span>
                    </div>
                  )}

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
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <FileQuestion size={14} className="text-slate-400" />
                      <span>
                        {qCount} {qCount === 1 ? "question" : "questions"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Users size={14} className="text-slate-400" />
                      <span>
                        {aCount} {aCount === 1 ? "attempt" : "attempts"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex flex-col gap-2 pt-3 border-t border-line/60">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenQuestions(quiz)}
                      className="px-3 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <FileQuestion size={14} />
                      <span>Questions</span>
                    </button>

                    {isDraft ? (
                      <button
                        type="button"
                        onClick={() => handleOpenPublish(quiz)}
                        className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Send size={14} />
                        <span>Publish</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenAttempts(quiz)}
                        className="px-3 py-2 rounded-xl bg-orange/10 text-orange text-xs font-semibold hover:bg-orange/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye size={14} />
                        <span>Results ({aCount})</span>
                      </button>
                    )}
                  </div>

                  {/* Secondary buttons: Edit Settings & Delete */}
                  <div className="flex items-center justify-between text-xs text-muted pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(quiz)}
                      className="hover:text-navy transition flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Edit3 size={12} />
                      <span>Settings</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenDelete(quiz)}
                      disabled={aCount > 0}
                      title={
                        aCount > 0
                          ? "Cannot delete quiz with student attempts"
                          : "Delete quiz"
                      }
                      className={`flex items-center gap-1 transition font-medium ${
                        aCount > 0
                          ? "text-slate-300 cursor-not-allowed"
                          : "hover:text-red-600 cursor-pointer"
                      }`}
                    >
                      <Trash2 size={12} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL 1: CREATE QUIZ                                    */}
      {/* ======================================================= */}
      <Modal
        open={createModalOpen}
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Quiz"
      >
        <form onSubmit={handleCreateQuiz} className="flex flex-col gap-4 mt-2">
          {createError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="text-red-600 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Course <span className="text-red-500">*</span>
            </label>
            <select
              value={newQuiz.courseId}
              onChange={(e) =>
                setNewQuiz((prev) => ({ ...prev, courseId: e.target.value }))
              }
              className="w-full h-10 px-3 rounded-xl border border-line bg-canvas text-xs text-ink outline-none focus:border-navy focus:bg-white"
              required
            >
              <option value="">Select a course...</option>
              {availableCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Quiz Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newQuiz.title}
              onChange={(e) =>
                setNewQuiz((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g. Mid-term Assessment on Process Scheduling"
              className="w-full h-10 px-3 rounded-xl border border-line bg-canvas text-xs text-ink outline-none focus:border-navy focus:bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={newQuiz.description}
              onChange={(e) =>
                setNewQuiz((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Instructions or topics covered in this quiz..."
              className="w-full p-3 rounded-xl border border-line bg-canvas text-xs text-ink outline-none focus:border-navy focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Duration (Minutes) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="360"
                value={newQuiz.durationMinutes}
                onChange={(e) =>
                  setNewQuiz((prev) => ({
                    ...prev,
                    durationMinutes: e.target.value,
                  }))
                }
                className="w-full h-10 px-3 rounded-xl border border-line bg-canvas text-xs text-ink outline-none focus:border-navy focus:bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Total Marks <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={newQuiz.totalMarks}
                onChange={(e) =>
                  setNewQuiz((prev) => ({
                    ...prev,
                    totalMarks: e.target.value,
                  }))
                }
                className="w-full h-10 px-3 rounded-xl border border-line bg-canvas text-xs text-ink outline-none focus:border-navy focus:bg-white"
                required
              />
            </div>
          </div>

          {/* Schedule (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-line/60">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Open Window Start (Optional)
              </label>
              <input
                type="datetime-local"
                value={newQuiz.windowStart}
                onChange={(e) =>
                  setNewQuiz((prev) => ({ ...prev, windowStart: e.target.value }))
                }
                className="w-full h-10 px-3 rounded-xl border border-line bg-canvas text-xs text-ink outline-none focus:border-navy focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Open Window End (Optional)
              </label>
              <input
                type="datetime-local"
                value={newQuiz.windowEnd}
                onChange={(e) =>
                  setNewQuiz((prev) => ({ ...prev, windowEnd: e.target.value }))
                }
                className="w-full h-10 px-3 rounded-xl border border-line bg-canvas text-xs text-ink outline-none focus:border-navy focus:bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line mt-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-line text-xs font-semibold text-muted hover:text-ink transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2 rounded-xl bg-orange text-white text-xs font-semibold hover:bg-orange/90 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {creating && <Loader2 size={14} className="animate-spin" />}
              <span>Create Quiz</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================= */}
      {/* MODAL 2: EDIT SETTINGS                                  */}
      {/* ======================================================= */}
      {editingQuiz && (
        <Modal
          open={editModalOpen}
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title="Edit Quiz Settings"
        >
          <form onSubmit={handleUpdateQuiz} className="flex flex-col gap-4 mt-2">
            {editError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="text-red-600 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Quiz Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editingQuiz.title}
                onChange={(e) =>
                  setEditingQuiz((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full h-10 px-3 rounded-xl border border-line bg-canvas text-xs text-ink outline-none focus:border-navy focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Description
              </label>
              <textarea
                rows={2}
                value={editingQuiz.description}
                onChange={(e) =>
                  setEditingQuiz((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full p-3 rounded-xl border border-line bg-canvas text-xs text-ink outline-none focus:border-navy focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Duration (Minutes) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="360"
                  value={editingQuiz.durationMinutes}
                  onChange={(e) =>
                    setEditingQuiz((prev) => ({
                      ...prev,
                      durationMinutes: e.target.value,
                    }))
                  }
                  className="w-full h-10 px-3 rounded-xl border border-line bg-canvas text-xs text-ink outline-none focus:border-navy focus:bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Total Marks <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  disabled={editingQuiz.hasAttempts}
                  value={editingQuiz.totalMarks}
                  onChange={(e) =>
                    setEditingQuiz((prev) => ({
                      ...prev,
                      totalMarks: e.target.value,
                    }))
                  }
                  className={`w-full h-10 px-3 rounded-xl border border-line text-xs outline-none focus:border-navy ${
                    editingQuiz.hasAttempts
                      ? "bg-slate-100 text-muted cursor-not-allowed"
                      : "bg-canvas text-ink focus:bg-white"
                  }`}
                  required
                />
                {editingQuiz.hasAttempts && (
                  <p className="text-[10px] text-muted mt-1">
                    Locked because student attempts exist.
                  </p>
                )}
              </div>
            </div>

            {/* Schedule (windowStart / windowEnd) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-line/60">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Availability Start
                </label>
                <input
                  type="datetime-local"
                  value={editingQuiz.windowStart}
                  onChange={(e) =>
                    setEditingQuiz((prev) => ({
                      ...prev,
                      windowStart: e.target.value,
                    }))
                  }
                  className="w-full h-10 px-3 rounded-xl border border-line bg-canvas text-xs text-ink outline-none focus:border-navy focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Availability End
                </label>
                <input
                  type="datetime-local"
                  value={editingQuiz.windowEnd}
                  onChange={(e) =>
                    setEditingQuiz((prev) => ({
                      ...prev,
                      windowEnd: e.target.value,
                    }))
                  }
                  className="w-full h-10 px-3 rounded-xl border border-line bg-canvas text-xs text-ink outline-none focus:border-navy focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line mt-2">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-line text-xs font-semibold text-muted hover:text-ink transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updatingQuiz}
                className="px-5 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {updatingQuiz && <Loader2 size={14} className="animate-spin" />}
                <span>Save Settings</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ======================================================= */}
      {/* MODAL 3: QUESTIONS MANAGEMENT                           */}
      {/* ======================================================= */}
      {activeQuiz && (
        <Modal
          open={questionsModalOpen}
          isOpen={questionsModalOpen}
          onClose={() => setQuestionsModalOpen(false)}
          title={`Questions: ${activeQuiz.title}`}
          maxWidth="max-w-4xl"
        >
          {loadingQuizDetails ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-orange mb-2" />
              <p className="text-xs text-muted">Loading questions...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6 mt-1">
              {/* Status & Scoring Indicator Banner */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                  pointsMatch
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-amber-50 border-amber-200 text-amber-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {pointsMatch ? (
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold">
                      {pointsMatch
                        ? "Quiz scoring is balanced and ready for publishing."
                        : activeQuiz.questions?.length === 0
                        ? "Quiz has zero questions. Add questions before publishing."
                        : `Question points total (${activeQuizPointsSum}) does not match target (${activeQuiz.totalMarks}).`}
                    </span>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      Target total: <strong>{activeQuiz.totalMarks} marks</strong> | Current questions:{" "}
                      <strong>{activeQuizPointsSum} marks</strong> ({activeQuiz.questions?.length || 0}{" "}
                      questions)
                    </p>
                  </div>
                </div>

                {activeQuiz.status === "DRAFT" && pointsMatch && activeQuiz.questions?.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuestionsModalOpen(false);
                      handleOpenPublish(activeQuiz);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition shrink-0 cursor-pointer text-xs flex items-center gap-1.5"
                  >
                    <Send size={13} />
                    <span>Publish Now</span>
                  </button>
                )}
              </div>

              {/* Add / Edit Question Form */}
              <div className="p-4 sm:p-5 rounded-2xl bg-canvas border border-line">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-display font-bold text-ink text-sm flex items-center gap-1.5">
                    <Plus size={16} className="text-orange" />
                    <span>
                      {editingQuestionId
                        ? "Edit Question"
                        : "Add Multiple Choice Question (MCQ)"}
                    </span>
                  </h4>
                  {editingQuestionId && (
                    <button
                      type="button"
                      onClick={resetQuestionForm}
                      className="text-xs font-semibold text-muted hover:text-ink transition cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveQuestion} className="flex flex-col gap-3.5">
                  {questionError && (
                    <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                      <AlertCircle size={14} className="text-red-600 shrink-0" />
                      <span>{questionError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-3">
                      <label className="block text-xs font-semibold text-ink mb-1">
                        Question Text <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={questionForm.question}
                        onChange={(e) =>
                          setQuestionForm((prev) => ({
                            ...prev,
                            question: e.target.value,
                          }))
                        }
                        placeholder="e.g. Which of the following is a non-preemptive CPU scheduling algorithm?"
                        className="w-full h-10 px-3 rounded-xl border border-line bg-white text-xs text-ink outline-none focus:border-navy"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">
                        Marks / Points <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={questionForm.points}
                        onChange={(e) =>
                          setQuestionForm((prev) => ({
                            ...prev,
                            points: e.target.value,
                          }))
                        }
                        className="w-full h-10 px-3 rounded-xl border border-line bg-white text-xs text-ink outline-none focus:border-navy"
                        required
                      />
                    </div>
                  </div>

                  {/* Options */}
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1.5">
                      Options &amp; Correct Answer Selection <span className="text-red-500">*</span>
                      <span className="text-[11px] text-muted font-normal ml-2">
                        Click the radio pill on the left of an option to mark it as the correct answer.
                      </span>
                    </label>

                    <div className="flex flex-col gap-2">
                      {questionForm.options.map((option, idx) => {
                        const isCorrect =
                          option.trim() &&
                          questionForm.correctAnswer.trim() === option.trim();

                        return (
                          <div key={idx} className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSelectCorrectOption(option.trim())}
                              className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 cursor-pointer transition ${
                                isCorrect
                                  ? "bg-emerald-600 border-emerald-600 text-white font-bold"
                                  : "border-line bg-white text-muted hover:border-slate-400"
                              }`}
                              title={
                                isCorrect
                                  ? "Correct Answer"
                                  : "Click to select as correct answer"
                              }
                            >
                              {isCorrect ? (
                                <Check size={14} />
                              ) : (
                                <span className="text-xs font-semibold">
                                  {String.fromCharCode(65 + idx)}
                                </span>
                              )}
                            </button>

                            <input
                              type="text"
                              value={option}
                              onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                              placeholder={`Option ${idx + 1}...`}
                              className={`flex-1 h-9 px-3 rounded-xl border text-xs text-ink outline-none transition ${
                                isCorrect
                                  ? "border-emerald-500 bg-emerald-50/40 font-medium"
                                  : "border-line bg-white focus:border-navy"
                              }`}
                            />

                            {questionForm.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOptionField(idx)}
                                className="w-8 h-8 rounded-lg text-muted hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition cursor-pointer"
                                title="Remove option"
                              >
                                <X size={15} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {questionForm.options.length < 6 && (
                      <button
                        type="button"
                        onClick={handleAddOptionField}
                        className="mt-2 text-xs font-semibold text-orange hover:text-orange/80 transition flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={13} />
                        <span>Add Option</span>
                      </button>
                    )}
                  </div>

                  {/* Optional Explanation */}
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      Explanation (Optional)
                      <span className="text-[11px] text-muted font-normal ml-2">
                        Shown to students in review mode after submitting.
                      </span>
                    </label>
                    <input
                      type="text"
                      value={questionForm.explanation}
                      onChange={(e) =>
                        setQuestionForm((prev) => ({
                          ...prev,
                          explanation: e.target.value,
                        }))
                      }
                      placeholder="e.g. FCFS (First-Come, First-Served) is non-preemptive because the CPU cannot be taken away..."
                      className="w-full h-9 px-3 rounded-xl border border-line bg-white text-xs text-ink outline-none focus:border-navy"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={savingQuestion}
                      className="px-5 py-2 rounded-xl bg-orange text-white text-xs font-semibold hover:bg-orange/90 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {savingQuestion && <Loader2 size={13} className="animate-spin" />}
                      <span>{editingQuestionId ? "Update Question" : "Save Question"}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Existing Questions List */}
              <div>
                <h4 className="font-display font-bold text-ink text-sm mb-3">
                  Configured Questions ({activeQuiz.questions?.length || 0})
                </h4>

                {!activeQuiz.questions || activeQuiz.questions.length === 0 ? (
                  <div className="p-8 rounded-xl border border-dashed border-line text-center text-muted text-xs">
                    No questions added yet. Use the form above to add your first question.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {activeQuiz.questions.map((q, qIndex) => (
                      <div
                        key={q.id}
                        className="p-4 rounded-xl border border-line bg-white hover:border-slate-300 transition flex flex-col gap-2.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                              {qIndex + 1}
                            </span>
                            <div>
                              <p className="text-xs font-bold text-ink leading-relaxed">
                                {q.question}
                              </p>
                              <span className="inline-block mt-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                                {q.points} {q.points === 1 ? "point" : "points"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleEditQuestionItem(q)}
                              className="w-8 h-8 rounded-lg text-muted hover:text-navy hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
                              title="Edit question"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuestionToDelete(q)}
                              className="w-8 h-8 rounded-lg text-muted hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition cursor-pointer"
                              title="Delete question"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Options preview */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-8 text-xs">
                          {Array.isArray(q.options) &&
                            q.options.map((opt, oIdx) => {
                              const isCorrect = opt === q.correctAnswer;
                              return (
                                <div
                                  key={oIdx}
                                  className={`px-3 py-1.5 rounded-lg flex items-center gap-2 ${
                                    isCorrect
                                      ? "bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200"
                                      : "bg-slate-50 text-slate-600"
                                  }`}
                                >
                                  {isCorrect ? (
                                    <Check size={13} className="text-emerald-600 shrink-0" />
                                  ) : (
                                    <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0 inline-block" />
                                  )}
                                  <span className="truncate">{opt}</span>
                                </div>
                              );
                            })}
                        </div>

                        {q.explanation && (
                          <div className="pl-8 text-[11px] text-muted italic">
                            💡 Explanation: {q.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* ======================================================= */}
      {/* MODAL 3B: DELETE QUESTION CONFIRMATION                  */}
      {/* ======================================================= */}
      {questionToDelete && (
        <Modal
          open={Boolean(questionToDelete)}
          isOpen={Boolean(questionToDelete)}
          onClose={() => setQuestionToDelete(null)}
          title="Delete Question"
        >
          <div className="flex flex-col gap-4 mt-1 text-xs">
            <p className="text-slate-600 leading-relaxed">
              Are you sure you want to remove this question?
            </p>
            <div className="p-3 rounded-xl bg-slate-50 border border-line font-medium text-ink">
              &quot;{questionToDelete.question}&quot;
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-line">
              <button
                type="button"
                onClick={() => setQuestionToDelete(null)}
                className="px-4 py-2 rounded-xl border border-line text-muted hover:text-ink transition cursor-pointer font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteQuestion}
                disabled={deletingQuestion}
                className="px-5 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deletingQuestion && <Loader2 size={14} className="animate-spin" />}
                <span>Delete Question</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ======================================================= */}
      {/* MODAL 4: PUBLISH CONFIRMATION                           */}
      {/* ======================================================= */}
      {quizToPublish && (
        <Modal
          open={publishModalOpen}
          isOpen={publishModalOpen}
          onClose={() => setPublishModalOpen(false)}
          title="Publish Quiz"
        >
          <div className="flex flex-col gap-4 mt-1 text-xs">
            {publishError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-2">
                <AlertCircle size={15} className="text-red-600 shrink-0" />
                <span>{publishError}</span>
              </div>
            )}

            <p className="text-slate-600 leading-relaxed">
              Are you sure you want to publish <strong>&quot;{quizToPublish.title}&quot;</strong>?
              Once published, all students enrolled in <strong>{quizToPublish.course?.title}</strong> will
              be able to view and attempt this assessment.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-line flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-muted">Questions Count:</span>
                <span className="font-bold text-ink">
                  {quizToPublish.questions?.length || quizToPublish._count?.questions || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Total Marks:</span>
                <span className="font-bold text-ink">{quizToPublish.totalMarks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Duration:</span>
                <span className="font-bold text-ink">{quizToPublish.durationMinutes} minutes</span>
              </div>
            </div>

            {/* In-modal pre-check warning if 0 questions or points mismatch */}
            {(quizToPublish.questions?.length || quizToPublish._count?.questions || 0) === 0 ? (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                <span>This quiz has zero questions. You must add questions before publishing.</span>
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line mt-1">
              <button
                type="button"
                onClick={() => setPublishModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-line text-muted hover:text-ink transition cursor-pointer font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPublish}
                disabled={publishing}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {publishing && <Loader2 size={14} className="animate-spin" />}
                <span>Confirm &amp; Publish</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ======================================================= */}
      {/* MODAL 5: DELETE QUIZ CONFIRMATION                       */}
      {/* ======================================================= */}
      {quizToDelete && (
        <Modal
          open={deleteModalOpen}
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Delete Quiz"
        >
          <div className="flex flex-col gap-4 mt-1 text-xs">
            {deleteError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-2">
                <AlertCircle size={15} className="text-red-600 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <p className="text-slate-600 leading-relaxed">
              Are you sure you want to delete <strong>&quot;{quizToDelete.title}&quot;</strong>? This
              action cannot be undone and will permanently remove all associated questions.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line mt-1">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-line text-muted hover:text-ink transition cursor-pointer font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-5 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deleting && <Loader2 size={14} className="animate-spin" />}
                <span>Delete Quiz</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ======================================================= */}
      {/* MODAL 6: STUDENT ATTEMPTS & RESULTS REVIEW              */}
      {/* ======================================================= */}
      <Modal
        open={attemptsModalOpen}
        isOpen={attemptsModalOpen}
        onClose={() => setAttemptsModalOpen(false)}
        title={attemptsData?.quiz?.title ? `Results: ${attemptsData.quiz.title}` : "Student Attempts"}
        maxWidth="max-w-3xl"
      >
        {loadingAttempts ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-orange mb-2" />
            <p className="text-xs text-muted">Loading student results...</p>
          </div>
        ) : !attemptsData?.attempts || attemptsData.attempts.length === 0 ? (
          <div className="p-8 text-center text-muted text-xs">
            No students have attempted this quiz yet.
          </div>
        ) : (
          <div className="flex flex-col gap-4 mt-1">
            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-line text-xs">
              <div className="text-center">
                <span className="text-muted text-[11px] block">Completed Submissions</span>
                <span className="font-display font-bold text-ink text-lg">
                  {attemptsData.stats?.completedAttempts || 0}
                </span>
              </div>
              <div className="text-center border-x border-line">
                <span className="text-muted text-[11px] block">Average Score</span>
                <span className="font-display font-bold text-ink text-lg">
                  {attemptsData.stats?.averageScore || 0} / {attemptsData.quiz?.totalMarks || 100}
                </span>
              </div>
              <div className="text-center">
                <span className="text-muted text-[11px] block">Highest Score</span>
                <span className="font-display font-bold text-emerald-700 text-lg">
                  {attemptsData.stats?.highestScore || 0} / {attemptsData.quiz?.totalMarks || 100}
                </span>
              </div>
            </div>

            {/* Submissions Table */}
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-left text-xs">
                <thead className="bg-canvas border-b border-line text-muted uppercase font-bold text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3.5">Student</th>
                    <th className="py-2.5 px-3.5">Date</th>
                    <th className="py-2.5 px-3.5">Status</th>
                    <th className="py-2.5 px-3.5 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {attemptsData.attempts.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3.5 font-medium text-ink">
                        <div>{att.studentName}</div>
                        <div className="text-[11px] text-muted">{att.studentEmail}</div>
                      </td>
                      <td className="py-2.5 px-3.5 text-muted">
                        {att.submittedAt
                          ? new Date(att.submittedAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : new Date(att.startedAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            att.status === "SUBMITTED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {att.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-ink">
                        {att.status === "SUBMITTED" ? (
                          <span>
                            {att.score} / {att.totalMarks}{" "}
                            <span className="text-[11px] font-normal text-muted">
                              ({att.percentage}%)
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted font-normal">Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
