import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Loader2,
  AlertCircle,
  RotateCcw,
  BookOpen,
  Calendar,
} from "lucide-react";
import * as quizService from "../../services/quizService";

export function QuizResultPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resultData, setResultData] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchResult() {
      try {
        setLoading(true);
        setError("");
        const res = await quizService.getQuizResult(attemptId);
        if (cancelled) return;
        setResultData(res?.result);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load quiz result:", err);
        setError(err.message || "Failed to load quiz result.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (attemptId) {
      fetchResult();
    }

    return () => {
      cancelled = true;
    };
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 rounded-2xl bg-white border border-line shadow-card text-center my-6">
        <Loader2 size={36} className="animate-spin text-orange mb-3" />
        <p className="text-sm font-semibold text-ink">Evaluating results...</p>
        <p className="text-xs text-muted mt-1">Retrieving official grade breakdown from server</p>
      </div>
    );
  }

  if (error || !resultData) {
    return (
      <div className="p-8 rounded-2xl bg-red-50 border border-red-200 text-center flex flex-col items-center my-6">
        <AlertCircle size={36} className="text-red-500 mb-2" />
        <h3 className="font-display font-bold text-red-900 text-base">Unable to Load Quiz Result</h3>
        <p className="text-xs text-red-700 max-w-md mt-1">{error || "Result not found."}</p>
        <div className="flex items-center gap-3 mt-4">
          <Link
            to="/student/quizzes"
            className="px-4 py-2 rounded-xl border border-red-300 text-red-800 text-xs font-semibold hover:bg-red-100 transition flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            <span>Back to Quizzes</span>
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  const {
    quizTitle,
    quizDescription,
    courseTitle,
    courseCode,
    score,
    totalMarks,
    percentage,
    submittedAt,
    startedAt,
    questions = [],
  } = resultData;

  const correctCount = questions.filter((q) => q.isCorrect).length;
  const totalCount = questions.length;
  const isPassed = (percentage ?? 0) >= 50;

  // Calculate duration taken
  let durationText = "Completed";
  if (startedAt && submittedAt) {
    const diffSecs = Math.max(
      0,
      Math.round((new Date(submittedAt).getTime() - new Date(startedAt).getTime()) / 1000)
    );
    const mins = Math.floor(diffSecs / 60);
    const secs = diffSecs % 60;
    durationText = `${mins}m ${secs}s`;
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-8 max-w-4xl mx-auto">
      {/* Top Breadcrumb & Return */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
          <Link to="/student/dashboard" className="hover:text-navy transition-colors">
            Portal
          </Link>
          <span>/</span>
          <Link to="/student/quizzes" className="hover:text-navy transition-colors">
            Quizzes
          </Link>
          <span>/</span>
          <span className="text-ink">Result</span>
        </div>

        <button
          type="button"
          onClick={() => navigate("/student/quizzes")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-navy transition cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>All Quizzes</span>
        </button>
      </div>

      {/* Hero Score Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-line shadow-card flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold">
              {courseCode || "COURSE"}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                isPassed
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {isPassed ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              <span>{isPassed ? "Assessment Passed" : "Needs Review"}</span>
            </span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            {quizTitle}
          </h1>
          <p className="text-xs text-muted mt-1 max-w-md">
            {quizDescription || courseTitle || "Course assessment review and performance rubric."}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <BookOpen size={14} className="text-slate-400" />
              <span>{courseTitle}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-slate-400" />
              <span>Time: {durationText}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-slate-400" />
              <span>
                {submittedAt
                  ? new Date(submittedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Submitted"}
              </span>
            </div>
          </div>
        </div>

        {/* Score Badge Pill */}
        <div className="p-6 rounded-2xl bg-canvas border border-line flex flex-col items-center justify-center min-w-[200px] shrink-0 text-center">
          <div className="w-12 h-12 rounded-2xl bg-orange/10 text-orange flex items-center justify-center mb-2">
            <Award size={26} />
          </div>
          <div className="font-display text-4xl font-black text-ink">
            {score}
            <span className="text-base font-normal text-muted"> / {totalMarks}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`text-sm font-bold ${
                isPassed ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {percentage}%
            </span>
            <span className="text-xs text-muted">
              ({correctCount}/{totalCount} correct)
            </span>
          </div>
        </div>
      </div>

      {/* Question Breakdown Heading */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">Question Breakdown</h2>
          <p className="text-xs text-muted mt-0.5">
            Review your answers, correct solutions, and official explanations.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="flex items-center gap-1 text-emerald-700">
            <CheckCircle2 size={14} /> {correctCount} Correct
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1 text-red-600">
            <XCircle size={14} /> {totalCount - correctCount} Incorrect
          </span>
        </div>
      </div>

      {/* Questions Review List */}
      <div className="flex flex-col gap-4">
        {questions.map((q, idx) => {
          const isCorrect = Boolean(q.isCorrect);

          return (
            <div
              key={q.questionId || idx}
              className={`p-5 sm:p-6 rounded-2xl bg-white border transition shadow-card flex flex-col gap-4 ${
                isCorrect ? "border-emerald-200" : "border-red-200"
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isCorrect
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-ink leading-relaxed">
                      {q.question}
                    </h3>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      isCorrect
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {isCorrect ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    <span>
                      {q.pointsAwarded || 0} / {q.pointsPossible || 1} pts
                    </span>
                  </span>
                </div>
              </div>

              {/* Options List */}
              <div className="flex flex-col gap-2 pl-10">
                {Array.isArray(q.options) &&
                  q.options.map((opt, optIdx) => {
                    const isSelected = opt === q.selectedOption;
                    const isTheCorrectAnswer = opt === q.correctAnswer;

                    let optionStyle = "border-line bg-canvas text-slate-700";
                    let badge = null;

                    if (isTheCorrectAnswer) {
                      optionStyle = "border-emerald-500 bg-emerald-50/60 text-emerald-950 font-semibold";
                      badge = (
                        <span className="ml-auto text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 size={13} /> Correct Answer
                        </span>
                      );
                    } else if (isSelected && !isCorrect) {
                      optionStyle = "border-red-400 bg-red-50/60 text-red-950 font-semibold";
                      badge = (
                        <span className="ml-auto text-[11px] font-bold text-red-700 flex items-center gap-1">
                          <XCircle size={13} /> Your Choice
                        </span>
                      );
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-3 rounded-xl border text-xs flex items-center gap-3 transition ${optionStyle}`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            isTheCorrectAnswer
                              ? "bg-emerald-600 text-white"
                              : isSelected
                              ? "bg-red-500 text-white"
                              : "border border-slate-300 text-muted"
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{opt}</span>
                        {badge}
                      </div>
                    );
                  })}
              </div>

              {/* Explanation Note */}
              {q.explanation && (
                <div className="ml-10 p-3.5 rounded-xl bg-slate-50 border border-line text-xs text-slate-700 leading-relaxed">
                  <span className="font-bold text-navy block mb-0.5">Instructor Explanation:</span>
                  <span>{q.explanation}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-line">
        <button
          type="button"
          onClick={() => navigate("/student/quizzes")}
          className="px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <ArrowLeft size={14} />
          <span>Return to Assessments</span>
        </button>

        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="px-4 py-2 rounded-xl border border-line text-xs font-semibold text-muted hover:text-ink transition cursor-pointer"
        >
          Back to Top
        </button>
      </div>
    </div>
  );
}
