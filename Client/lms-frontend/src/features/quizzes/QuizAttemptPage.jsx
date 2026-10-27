import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Timer,
  AlertTriangle,
  Flag,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  Send,
  RotateCcw,
} from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../hooks/useToast";
import * as quizService from "../../services/quizService";

export function QuizAttemptPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alreadySubmittedAttemptId, setAlreadySubmittedAttemptId] = useState(null);

  // Attempt & Quiz state
  const [attempt, setAttempt] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Answers and flags
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  // Timer
  const [secondsRemaining, setSecondsRemaining] = useState(null);
  const timerRef = useRef(null);
  const initiatingRef = useRef(false);

  // 1. Start or resume attempt on mount
  useEffect(() => {
    let cancelled = false;

    async function initAttempt() {
      if (initiatingRef.current) return;
      initiatingRef.current = true;

      try {
        setLoading(true);
        setError("");
        setAlreadySubmittedAttemptId(null);

        const res = await quizService.startQuizAttempt(quizId);
        if (cancelled) return;

        const currentAttempt = res.attempt;
        const currentQuiz = res.quiz;

        setAttempt(currentAttempt);
        setQuiz(currentQuiz);

        // Load saved draft answers from localStorage if available
        try {
          const draftKey = `campushub_attempt_draft_${currentAttempt.id}`;
          const saved = localStorage.getItem(draftKey);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.answers) setAnswers(parsed.answers);
            if (parsed.flagged) setFlagged(parsed.flagged);
          }
        } catch {
          // ignore localStorage error
        }

        // Calculate timer remaining from server startedAt
        const startedTime = new Date(currentAttempt.startedAt).getTime();
        const durationMs = (currentQuiz.durationMinutes || 30) * 60 * 1000;
        const deadline = startedTime + durationMs;
        const remaining = Math.max(0, Math.round((deadline - Date.now()) / 1000));

        setSecondsRemaining(remaining);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to start quiz attempt:", err);

        const submittedId = err.attemptId || err.data?.attemptId || null;
        if (
          err.status === 409 ||
          (err.message && err.message.includes("already completed and submitted"))
        ) {
          setAlreadySubmittedAttemptId(submittedId || true);
        }
        setError(err.message || "Failed to start quiz attempt.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (quizId) {
      initAttempt();
    }

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizId]);

  // Persist local draft answers
  useEffect(() => {
    if (attempt?.id && !submitting) {
      try {
        const draftKey = `campushub_attempt_draft_${attempt.id}`;
        localStorage.setItem(draftKey, JSON.stringify({ answers, flagged }));
      } catch {
        // ignore
      }
    }
  }, [answers, flagged, attempt, submitting]);

  const questions = useMemo(() => quiz?.questions || [], [quiz]);
  const currentQuestion = questions[currentIdx] || null;

  // Process submission
  const handleProcessSubmit = useCallback(async () => {
    if (!attempt?.id || submitting || !quiz) return;

    try {
      setSubmitting(true);
      setConfirmModalOpen(false);

      const formattedAnswers = questions.map((q) => ({
        questionId: q.id,
        selectedOption: answers[q.id] || null,
      }));

      const res = await quizService.submitQuizAttempt(attempt.id, formattedAnswers);

      // Clean draft
      try {
        localStorage.removeItem(`campushub_attempt_draft_${attempt.id}`);
      } catch {
        // ignore
      }

      toast.show(
        `Assessment submitted! Score: ${res?.result?.score || 0}/${res?.totalMarks || quiz.totalMarks} (${res?.result?.percentage || 0}%)`,
        "success"
      );

      navigate(`/student/quizzes/attempts/${attempt.id}/result`, { replace: true });
    } catch (err) {
      toast.show(err.message || "Failed to submit assessment.", "error");
      setSubmitting(false);
    }
  }, [attempt, submitting, quiz, questions, answers, toast, navigate]);

  // Timer countdown
  useEffect(() => {
    if (secondsRemaining === null || loading || submitting) return;

    if (secondsRemaining <= 0) {
      toast.show("Time limit expired! Auto-submitting assessment...", "warning");
      handleProcessSubmit();
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleProcessSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [secondsRemaining, loading, submitting, handleProcessSubmit, toast]);

  // Handle Option Click
  function handleSelectOption(optionText) {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionText,
    }));
  }

  // Handle Flag Toggle
  function handleToggleFlag() {
    if (!currentQuestion) return;
    setFlagged((prev) => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id],
    }));
  }

  // Answered / flagged counts
  const answeredCount = Object.keys(answers).length;
  const flaggedCount = Object.keys(flagged).filter((k) => flagged[k]).length;
  const unansweredCount = Math.max(0, questions.length - answeredCount);

  // Format timer
  const minutes = Math.floor((secondsRemaining || 0) / 60);
  const seconds = (secondsRemaining || 0) % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const isUrgentTime = (secondsRemaining || 0) < 120; // under 2 mins

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 rounded-2xl bg-white border border-line shadow-card text-center my-6">
        <Loader2 size={36} className="animate-spin text-orange mb-3" />
        <p className="text-sm font-semibold text-ink">Starting assessment session...</p>
        <p className="text-xs text-muted mt-1">Enforcing server session &amp; timer security</p>
      </div>
    );
  }

  if (error || !quiz || !attempt) {
    return (
      <div className="p-8 rounded-2xl bg-white border border-line text-center flex flex-col items-center my-6 shadow-card">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
          <AlertTriangle size={28} />
        </div>
        <h3 className="font-display font-bold text-ink text-lg">
          {alreadySubmittedAttemptId ? "Assessment Already Completed" : "Unable to Start Quiz"}
        </h3>
        <p className="text-xs text-muted max-w-md mt-1 mb-4 leading-relaxed">
          {error || "Quiz details could not be loaded."}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {alreadySubmittedAttemptId && typeof alreadySubmittedAttemptId === "number" ? (
            <Link
              to={`/student/quizzes/attempts/${alreadySubmittedAttemptId}/result`}
              className="px-4 py-2 rounded-xl bg-orange text-white text-xs font-semibold hover:bg-orange/90 transition flex items-center gap-1.5 shadow-sm"
            >
              <Eye size={14} />
              <span>View Results &amp; Answers</span>
            </Link>
          ) : null}

          <Link
            to="/student/quizzes"
            className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition flex items-center gap-1.5 shadow-sm"
          >
            <ArrowLeft size={14} />
            <span>Return to Quizzes</span>
          </Link>

          {!alreadySubmittedAttemptId && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl border border-line text-xs font-semibold text-muted hover:text-ink transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Retry</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto pb-8">
      {/* Quiz Attempt Focus Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-line shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-4 z-20">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-bold">
              {quiz.course?.code || "COURSE"}
            </span>
            <span className="text-xs text-muted font-medium truncate max-w-xs">
              {quiz.course?.title}
            </span>
          </div>
          <h1 className="font-display font-bold text-ink text-base sm:text-lg mt-0.5">
            {quiz.title}
          </h1>
        </div>

        {/* Sticky Timer Display */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div
            className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-mono text-sm font-bold shadow-xs transition ${
              isUrgentTime
                ? "bg-red-50 border-red-300 text-red-600 animate-pulse"
                : "bg-canvas border-line text-ink"
            }`}
          >
            <Timer size={16} className={isUrgentTime ? "text-red-500" : "text-orange"} />
            <span>{timeFormatted}</span>
          </div>

          <button
            type="button"
            onClick={() => setConfirmModalOpen(true)}
            disabled={submitting}
            className="px-4 py-2 rounded-xl bg-orange text-white text-xs font-semibold hover:bg-orange/90 transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            <span>Submit</span>
          </button>
        </div>
      </div>

      {/* Main Attempt Body: Question Card & Question Navigation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Left 3 Cols: Active Question */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-line shadow-card flex flex-col justify-between min-h-[420px]">
            {currentQuestion ? (
              <div>
                {/* Question Top Bar */}
                <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-navy/10 text-navy font-bold text-xs">
                      Question {currentIdx + 1} of {questions.length}
                    </span>
                    <span className="text-xs text-muted font-medium">
                      ({currentQuestion.points} {currentQuestion.points === 1 ? "point" : "points"})
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleFlag}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      flagged[currentQuestion.id]
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "text-muted hover:text-ink hover:bg-slate-100"
                    }`}
                  >
                    <Flag
                      size={13}
                      className={flagged[currentQuestion.id] ? "fill-amber-600 text-amber-600" : ""}
                    />
                    <span>{flagged[currentQuestion.id] ? "Flagged" : "Flag for Review"}</span>
                  </button>
                </div>

                {/* Question Prompt */}
                <h2 className="font-display font-bold text-ink text-base sm:text-lg leading-relaxed mb-6">
                  {currentQuestion.question}
                </h2>

                {/* Options List */}
                <div className="flex flex-col gap-3">
                  {Array.isArray(currentQuestion.options) &&
                    currentQuestion.options.map((optionText, optIndex) => {
                      const isSelected = answers[currentQuestion.id] === optionText;

                      return (
                        <button
                          key={optIndex}
                          type="button"
                          onClick={() => handleSelectOption(optionText)}
                          className={`w-full p-3.5 sm:p-4 rounded-xl border text-left text-xs sm:text-sm font-medium transition flex items-center gap-3 cursor-pointer ${
                            isSelected
                              ? "bg-orange/5 border-orange text-orange font-bold shadow-2xs"
                              : "bg-white border-line text-ink hover:border-slate-300 hover:bg-slate-50/50"
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition ${
                              isSelected
                                ? "bg-orange text-white"
                                : "border border-line bg-canvas text-muted"
                            }`}
                          >
                            {String.fromCharCode(65 + optIndex)}
                          </span>
                          <span className="flex-1">{optionText}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-muted text-xs">No question selected.</div>
            )}

            {/* Bottom Navigation Buttons */}
            <div className="flex items-center justify-between pt-5 border-t border-line mt-6">
              <button
                type="button"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                className="px-4 py-2 rounded-xl border border-line text-xs font-semibold text-muted hover:text-ink hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>

              {currentIdx < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                  className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Next Question</span>
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmModalOpen(true)}
                  className="px-5 py-2 rounded-xl bg-orange text-white text-xs font-semibold hover:bg-orange/90 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Send size={14} />
                  <span>Review &amp; Submit</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Question Map & Progress Sidebar */}
        <div className="flex flex-col gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-line shadow-card flex flex-col gap-4">
            <h3 className="font-display font-bold text-ink text-sm">Question Navigation</h3>

            {/* Status counts summary */}
            <div className="grid grid-cols-3 gap-2 text-center text-[11px] pb-3 border-b border-line">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800">
                <span className="font-bold block text-sm">{answeredCount}</span>
                <span>Answered</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                <span className="font-bold block text-sm">{unansweredCount}</span>
                <span>Remaining</span>
              </div>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-800">
                <span className="font-bold block text-sm">{flaggedCount}</span>
                <span>Flagged</span>
              </div>
            </div>

            {/* Questions Grid */}
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIdx;
                const isAnswered = Boolean(answers[q.id]);
                const isFlagged = Boolean(flagged[q.id]);

                let btnStyle = "bg-canvas border-line text-muted hover:border-slate-400";
                if (isCurrent) {
                  btnStyle = "bg-navy text-white font-bold ring-2 ring-navy/30 border-navy";
                } else if (isFlagged) {
                  btnStyle = "bg-amber-100 border-amber-300 text-amber-900 font-bold";
                } else if (isAnswered) {
                  btnStyle = "bg-emerald-100 border-emerald-300 text-emerald-900 font-bold";
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-9 rounded-xl border text-xs font-semibold flex items-center justify-center transition cursor-pointer relative ${btnStyle}`}
                  >
                    <span>{idx + 1}</span>
                    {isFlagged && !isCurrent && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-col gap-1.5 text-[11px] text-muted pt-2 border-t border-line">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
                <span>Answered question</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
                <span>Flagged for review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-canvas border border-line" />
                <span>Unanswered</span>
              </div>
            </div>

            {/* Submit CTA */}
            <button
              type="button"
              onClick={() => setConfirmModalOpen(true)}
              className="mt-2 w-full py-2.5 rounded-xl bg-orange text-white text-xs font-semibold hover:bg-orange/90 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <CheckCircle2 size={14} />
              <span>Submit Assessment</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================= */}
      {/* SUBMISSION CONFIRMATION MODAL                           */}
      {/* ======================================================= */}
      <Modal
        open={confirmModalOpen}
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Submit Assessment"
      >
        <div className="flex flex-col gap-4 mt-1 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Are you sure you are ready to finalize and submit your assessment? Once submitted,
            your responses will be graded server-side and recorded.
          </p>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-line flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="text-muted">Total Questions:</span>
              <span className="font-bold text-ink">{questions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Answered:</span>
              <span className="font-bold text-emerald-700">{answeredCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Unanswered:</span>
              <span className={`font-bold ${unansweredCount > 0 ? "text-amber-700" : "text-ink"}`}>
                {unansweredCount}
              </span>
            </div>
            {flaggedCount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted">Flagged for Review:</span>
                <span className="font-bold text-amber-700">{flaggedCount}</span>
              </div>
            )}
          </div>

          {unansweredCount > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
              <AlertCircle size={14} className="text-amber-600 shrink-0" />
              <span>
                You have {unansweredCount} unanswered {unansweredCount === 1 ? "question" : "questions"}.
                Any blank questions will receive 0 marks.
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line mt-1">
            <button
              type="button"
              onClick={() => setConfirmModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-line text-muted hover:text-ink transition cursor-pointer font-semibold"
            >
              Return to Test
            </button>
            <button
              type="button"
              onClick={handleProcessSubmit}
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-orange text-white font-semibold hover:bg-orange/90 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              <span>Confirm &amp; Submit</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
