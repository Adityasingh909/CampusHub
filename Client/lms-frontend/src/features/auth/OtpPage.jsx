import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { AuthShell } from "./AuthShell";

export function OtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const email = location.state?.email || "your college email";
  const name = location.state?.name || "Student";
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");

  const code = useMemo(() => digits.join(""), [digits]);

  function updateDigit(index, value) {
    const next = value.replace(/\D/g, "").slice(-1);
    setDigits((current) => current.map((digit, i) => (i === index ? next : digit)));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (code.length !== 6) {
      setError("Enter the 6-digit verification code.");
      return;
    }

    signIn({
      id: "student-1",
      name,
      email,
      role: "student",
      subtitle: "Computer Science & Eng",
    });
    navigate("/student/dashboard");
  }

  return (
    <AuthShell>
      <span className="text-xs font-bold tracking-[0.22em] text-orange">VERIFY EMAIL</span>
      <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
        Check your inbox
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted">
        Enter the 6-digit code sent to {email}. This is a frontend preview; no real OTP is issued.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="grid grid-cols-6 gap-2">
          {digits.map((digit, index) => (
            <input
              key={index}
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(event) => updateDigit(index, event.target.value)}
              className="h-12 rounded-lg border border-line text-center text-lg font-semibold text-ink outline-none focus:border-navy focus:ring-[3px] focus:ring-navy/15"
            />
          ))}
        </div>
        {error ? <p className="text-sm font-semibold text-error">{error}</p> : null}
        <Button type="submit" variant="accent" className="w-full">
          Verify and continue
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-muted">
        Wrong email?{" "}
        <Link to="/signup" className="font-bold text-orange hover:text-orange-hover">
          Back to registration
        </Link>
      </p>
    </AuthShell>
  );
}
