import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Timer,
  AlertTriangle,
  Flag,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Award,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import {
  quizzesData,
  getSavedQuizzes,
  saveQuizResultToStorage,
  getQuizDraft,
  saveQuizDraft,
} from "../../data/mockLmsData";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../hooks/useToast";

export function QuizAttemptPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const quiz = useMemo(() => {
    return quizzesData.find((q) => q.id === quizId);
  }, [quizId]);

  const savedResult = useMemo(() => {
    return getSavedQuizzes()[quizId];
  }, [quizId]);

  // Quiz state
  const questions = useMemo(() => quiz?.questions || [], [quiz]);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Load draft or initial state
  const initialDraft = useMemo(() => {
    return getQuizDraft(quizId) || { answers: {}, flagged: {} };
  }, [quizId]);

  const [answers, setAnswers] = useState(initialDraft.answers || {});
  const [flagged, setFlagged] = useState(initialDraft.flagged || {});
  const [isSubmitted, setIsSubmitted] = useState(Boolean(savedResult || quiz?.status === "past"));
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  // Timer logic
  const totalSeconds = (quiz?.durationMinutes || 30) * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(() => {
    const draft = getQuizDraft(quizId);
    return draft?.remainingSeconds !== undefined ? draft.remainingSeconds : totalSeconds;
  });

  const timerRef = useRef(null);

  // Auto-save draft on answer/flag changes
  useEffect(() => {
    if (!isSubmitted && quiz) {
      saveQuizDraft(quiz.id, {
        answers,
        flagged,
        remainingSeconds: secondsRemaining,
      });
    }
  }, [answers, flagged, secondsRemaining, isSubmitted, quiz]);

  // Handle auto-submit ref to avoid effect recreation
  const autoSubmitRef = useRef();

  // Calculate score and finish
  const processSubmission = useCallback(() => {
    if (!quiz) return;
    let correctCount = 0;
    const reviewDetails = questions.map((q) => {
      const selected = answers[q.id];
      const isCorrect = selected === q.correctAnswer;
      if (isCorrect) correctCount++;
      return {
        questionId: q.id,
        question: q.question,
        selectedOption: selected || "None",
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const marksPerQ = quiz.totalMarks / (questions.length || 1);
    const pointsScored = Math.round(correctCount * marksPerQ);
    const percentage = Math.round((correctCount / (questions.length || 1)) * 100);

    const result = {
      pointsScored,
      totalMarks: quiz.totalMarks,
      percentage,
      correctCount,
      totalCount: questions.length,
      answers,
      review: reviewDetails,
    };

    saveQuizResultToStorage(quiz.id, result);
    setIsSubmitted(true);
    setConfirmModalOpen(false);
    toast.show(`Assessment submitted! Score: ${pointsScored}/${quiz.totalMarks} (${percentage}%)`, "success");
  }, [answers, questions, quiz, toast]);

  useEffect(() => {
    autoSubmitRef.current = () => {
      toast.show("Time limit expired! Auto-submitting assessment...", "warning");
      processSubmission();
    };
  }, [processSubmission, toast]);

  // Timer countdown
  useEffect(() => {
    if (isSubmitted || !quiz) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          autoSubmitRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isSubmitted, quiz]);

  // Answered / Review metrics
  const answeredCount = Object.keys(answers).length;
  const flaggedCount = Object.keys(flagged).filter((k) => flagged[k]).length;
  const unansweredCount = Math.max(0, questions.length - answeredCount);

  // Formatting minutes and seconds
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  if (!quiz) {
    return (
      <div className="rounded-2xl border border-line bg-white p-12 text-center shadow-card flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-orange/10 text-orange flex items-center justify-center mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="font-display text-2xl font-bold text-ink">Quiz Not Found</h2>
        <p className="text-sm text-muted max-w-md mt-2">
          The requested quiz assessment &quot;{quizId}&quot; could not be found in the current semester syllabus.
        </p>
        <button
          type="button"
          onClick={() => navigate("/student/quizzes")}
          className="mt-6 px-5 py-2.5 rounded-xl bg-navy text-white text-sm font-semibold hover:bg-navy-hover transition flex items-center gap-2 shadow-sm"
        >
          <ArrowLeft size={16} />
          <span>Back to Quizzes Hub</span>
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-white p-12 text-center shadow-card flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-orange/10 text-orange flex items-center justify-center mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="font-display text-2xl font-bold text-ink">No Questions Available</h2>
        <p className="text-sm text-muted max-w-md mt-2">
          This assessment does not currently have any active questions enrolled.
        </p>
        <button
          type="button"
          onClick={() => navigate("/student/quizzes")}
          className="mt-6 px-5 py-2.5 rounded-xl bg-navy text-white text-sm font-semibold hover:bg-navy-hover transition flex items-center gap-2 shadow-sm"
        >
          <ArrowLeft size={16} />
          <span>Back to Quizzes Hub</span>
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIdx] || questions[0];

  function handleSelectOption(optionKey) {
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionKey,
    }));
  }

  function toggleFlagCurrent() {
    setFlagged((prev) => ({
      ...prev,
      [currentQ.id]: !prev[currentQ.id],
    }));
  }

  function handleClearSelection() {
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQ.id];
      return copy;
    });
  }

  // REVIEW / RESULTS SCREEN
  if (isSubmitted) {
    const points = savedResult?.pointsScored ?? (quiz.score ? parseInt(quiz.score) : 25);
    const pct = savedResult?.percentage ?? 85;

    return (
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/student/quizzes")}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-navy transition"
          >
            <ArrowLeft size={14} />
            <span>Back to Quizzes Hub</span>
          </button>
          <span className="text-xs text-muted font-medium">Evaluation Completed</span>
        </div>

        {/* Results Hero Card */}
        <div className="rounded-2xl border border-line bg-white p-6 sm:p-8 shadow-card flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-2xl flex-shrink-0 shadow-xs">
              <Award size={36} />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Assessment Completed
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink mt-0.5">
                {quiz.title}
              </h1>
              <p className="text-xs text-muted mt-1">
                {quiz.courseCode} • {quiz.courseName} • Auto-Evaluated
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 w-full md:w-auto justify-around md:justify-start">
            <div className="text-center">
              <span className="text-xs text-muted block">Final Score</span>
              <span className="font-display text-2xl sm:text-3xl font-bold text-ink">
                {points} / {quiz.totalMarks}
              </span>
            </div>
            <div className="text-center">
              <span className="text-xs text-muted block">Accuracy</span>
              <span className="font-display text-2xl sm:text-3xl font-bold text-emerald-700">
                {pct}%
              </span>
            </div>
          </div>
        </div>

        {/* Question Review Section */}
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-lg font-bold text-ink">
            Question-by-Question Review &amp; Explanations
          </h2>

          <div className="space-y-4">
            {questions.map((q, idx) => {
              const userAns = answers[q.id] || savedResult?.answers?.[q.id];
              const isCorrect = userAns === q.correctAnswer;

              return (
                <div
                  key={q.id}
                  className="rounded-2xl border border-line bg-white p-5 shadow-card flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-navy">
                      Question {idx + 1} of {questions.length}
                    </span>
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 size={13} />
                        Correct (+{Math.round(quiz.totalMarks / questions.length)} pts)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-error bg-rose-50 px-2.5 py-0.5 rounded-full">
                        <XCircle size={13} />
                        Incorrect (0 pts)
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-ink leading-relaxed">
                    {q.question}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt) => {
                      const isUserChoice = userAns === opt.key;
                      const isAnswerKey = q.correctAnswer === opt.key;

                      let style = "bg-canvas border-line text-ink";
                      if (isAnswerKey) {
                        style = "bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold";
                      } else if (isUserChoice && !isCorrect) {
                        style = "bg-rose-50 border-rose-300 text-rose-950 line-through";
                      }

                      return (
                        <div
                          key={opt.key}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${style}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-white shadow-xs flex items-center justify-center font-bold text-[11px]">
                              {opt.key}
                            </span>
                            <span>{opt.text}</span>
                          </div>
                          {isAnswerKey && (
                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                              Correct Key
                            </span>
                          )}
                          {isUserChoice && !isAnswerKey && (
                            <span className="text-[10px] font-bold text-error uppercase tracking-wider">
                              Your Choice
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="p-3 bg-canvas border border-line/60 rounded-xl text-xs text-muted mt-1">
                      <strong className="text-ink font-semibold">Explanation: </strong>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // LIVE QUIZ ATTEMPT INTERFACE
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Top Assessment Sticky Bar */}
      <div className="w-full bg-white border border-line rounded-2xl p-4 sm:p-5 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy text-white font-bold text-xs">
            {quiz.courseCode}
          </span>
          <span className="hidden sm:block h-4 w-px bg-slate-200" />
          <h1 className="font-display text-sm sm:text-base font-bold text-ink truncate">
            {quiz.title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Countdown Pill */}
          <div
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold text-xs shadow-xs ${
              secondsRemaining < 300
                ? "bg-rose-100 text-rose-700 animate-pulse"
                : "bg-orange-100 text-orange-800"
            }`}
          >
            <Timer size={15} />
            <span>{timeFormatted} remaining</span>
          </div>

          <button
            type="button"
            onClick={() => setConfirmModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-orange hover:bg-orange-hover text-white text-xs font-semibold shadow-xs transition"
          >
            Finish &amp; Submit
          </button>
        </div>
      </div>

      {/* Main 2-Column Assessment Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Question Card (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-line p-6 shadow-card flex flex-col gap-5">
            {/* Question Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg bg-navy text-white font-bold text-xs">
                  Question {currentIdx + 1}
                </span>
                <span className="text-xs text-muted">of {questions.length} Questions</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-muted font-medium">
                  Single Choice
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-muted">
                  Marks: <strong className="text-ink">+{Math.round(quiz.totalMarks / questions.length)}</strong>
                </span>
                <button
                  type="button"
                  onClick={toggleFlagCurrent}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    flagged[currentQ.id]
                      ? "bg-amber-100 text-amber-800"
                      : "bg-canvas text-muted hover:text-ink hover:bg-slate-200"
                  }`}
                >
                  <Flag size={13} />
                  <span>{flagged[currentQ.id] ? "Flagged" : "Mark for Review"}</span>
                </button>
              </div>
            </div>

            {/* Question Prompt */}
            <p className="text-base text-ink font-semibold leading-relaxed">
              {currentQ.question}
            </p>

            {/* Options Radio List */}
            <div className="flex flex-col gap-2.5 pt-1">
              {currentQ.options.map((opt) => {
                const isSelected = answers[currentQ.id] === opt.key;

                return (
                  <label
                    key={opt.key}
                    onClick={() => handleSelectOption(opt.key)}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "border-orange bg-orange/5 shadow-xs"
                        : "border-line bg-canvas hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition ${
                          isSelected
                            ? "bg-orange text-white"
                            : "bg-white border border-line text-muted"
                        }`}
                      >
                        {opt.key}
                      </span>
                      <span className="text-sm text-ink font-medium leading-relaxed">
                        {opt.text}
                      </span>
                    </div>

                    {isSelected && (
                      <span className="text-xs font-bold text-orange flex items-center gap-1">
                        Selected ✓
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Bottom Navigator Controls */}
          <div className="bg-white rounded-2xl border border-line p-4 shadow-card flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                className="px-4 py-2 rounded-xl border border-line bg-canvas hover:bg-slate-200 text-ink text-xs font-semibold transition disabled:opacity-40 flex items-center gap-1"
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>

              <button
                type="button"
                onClick={handleClearSelection}
                className="px-3 py-2 text-xs text-muted hover:text-error transition font-medium"
              >
                Clear Selection
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  toggleFlagCurrent();
                  if (currentIdx < questions.length - 1) {
                    setCurrentIdx((prev) => prev + 1);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-ink text-xs font-semibold transition hidden sm:flex items-center gap-1"
              >
                <Flag size={14} className="text-orange" />
                <span>Review &amp; Next</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (currentIdx < questions.length - 1) {
                    setCurrentIdx((prev) => prev + 1);
                  } else {
                    setConfirmModalOpen(true);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-orange hover:bg-orange-hover text-white text-xs font-semibold transition flex items-center gap-1 shadow-xs"
              >
                <span>{currentIdx === questions.length - 1 ? "Review All" : "Save & Next"}</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Question Navigator Palette (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-line p-5 shadow-card flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-display text-sm font-bold text-ink">
                Question Palette
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-muted font-semibold">
                {questions.length} Total
              </span>
            </div>

            {/* Counters */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-line/60">
                <span className="font-bold text-base text-ink block">{answeredCount}</span>
                <span className="text-[11px] text-muted">Answered</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-line/60">
                <span className="font-bold text-base text-orange block">{flaggedCount}</span>
                <span className="text-[11px] text-muted">Review</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-line/60">
                <span className="font-bold text-base text-muted block">{unansweredCount}</span>
                <span className="text-[11px] text-muted">Left</span>
              </div>
            </div>

            {/* Matrix of Question Buttons */}
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 gap-2 pt-1">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIdx;
                const isAnswered = Boolean(answers[q.id]);
                const isFlagged = Boolean(flagged[q.id]);

                let btnStyle = "bg-canvas text-muted hover:bg-slate-200 border-line";
                if (isCurrent) {
                  btnStyle = "bg-orange text-white font-bold ring-2 ring-orange/30 shadow-xs";
                } else if (isFlagged) {
                  btnStyle = "bg-amber-100 text-amber-900 border-amber-300 font-bold";
                } else if (isAnswered) {
                  btnStyle = "bg-navy text-white font-bold";
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-10 rounded-xl border text-xs font-semibold transition flex items-center justify-center relative ${btnStyle}`}
                  >
                    <span>{idx + 1}</span>
                    {isFlagged && !isCurrent && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-orange" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-muted">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-navy" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-orange" />
                <span>Current</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-100 border border-amber-300" />
                <span>Marked for Review</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-canvas border border-line" />
                <span>Not Visited</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <Modal
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Submit Assessment Confirmation"
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <p className="text-muted leading-relaxed">
            Are you sure you want to finalize and submit your assessment for <strong>{quiz.title}</strong>? Once submitted, your answers will be locked and graded.
          </p>

          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-canvas border border-line text-center">
            <div>
              <span className="font-bold text-base text-ink block">{answeredCount}</span>
              <span className="text-[11px] text-muted">Answered</span>
            </div>
            <div>
              <span className="font-bold text-base text-orange block">{flaggedCount}</span>
              <span className="text-[11px] text-muted">Marked Review</span>
            </div>
            <div>
              <span className="font-bold text-base text-error block">{unansweredCount}</span>
              <span className="text-[11px] text-muted">Unanswered</span>
            </div>
          </div>

          {unansweredCount > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
              <AlertTriangle size={18} className="text-orange mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <strong>Attention:</strong> You have {unansweredCount} unanswered questions. Unanswered questions will receive 0 marks.
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setConfirmModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-canvas hover:bg-slate-200 text-ink text-xs font-semibold transition border border-line"
            >
              Continue Test
            </button>
            <button
              type="button"
              onClick={processSubmission}
              className="px-5 py-2 rounded-xl bg-orange hover:bg-orange-hover text-white text-xs font-bold transition shadow-xs"
            >
              Confirm &amp; Submit Assessment
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
