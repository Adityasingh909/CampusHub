
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../services/api";
import { AuthShell } from "./AuthShell";

export function OtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const email = location.state?.email || "";
  const name = location.state?.name || "Student";

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const code = useMemo(() => digits.join(""), [digits]);

  function updateDigit(index, value) {
    const next = value.replace(/\D/g, "").slice(-1);

    setDigits((current) =>
      current.map((digit, i) => (i === index ? next : digit))
    );

    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!email) {
      setError("Registration details are missing. Please register again.");
      return;
    }

    if (code.length !== 6) {
      setError("Enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api().post("/auth/verify-otp", {
        email,
        otp: code,
      });
      if (!response?.user?.id) {
  throw new Error(
    response?.message || "Verification succeeded, but user details were not returned."
  );
}
      signIn({
        id: response.user.id,
        name: response.user.name || name,
        email: response.user.email,
        role: String(response.user.role || "STUDENT").toLowerCase(),
        subtitle: "Computer Science & Eng",
      });

      navigate("/student/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "OTP verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <span className="text-xs font-bold tracking-[0.22em] text-orange">
        VERIFY EMAIL
      </span>

      <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
        Check your inbox
      </h2>

      <p className="mt-3 text-sm leading-6 text-muted">
        Enter the 6-digit code sent to {email || "your college email"}.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="grid grid-cols-6 gap-2">
          {digits.map((digit, index) => (
            <input
              key={index}
              aria-label={`OTP digit ${index + 1}`}
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              value={digit}
              onChange={(event) => updateDigit(index, event.target.value)}
              className="h-12 rounded-lg border border-line text-center text-lg font-semibold text-ink outline-none focus:border-navy focus:ring-[3px] focus:ring-navy/15"
            />
          ))}
        </div>

        {error ? (
          <p role="alert" className="text-sm font-semibold text-error">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          variant="accent"
          className="w-full"
          disabled={loading}
        >
          {loading ? "Verifying..." : "Verify and continue"}
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
