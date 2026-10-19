import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { AuthShell } from "./AuthShell";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setSent(true);
  }

  return (
    <AuthShell>
      <span className="text-xs font-bold tracking-[0.22em] text-orange">ACCOUNT RECOVERY</span>
      <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
        Reset your password
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted">
        Enter your college email. This screen only prepares the reset request; no email is sent until the backend is connected.
      </p>

      {sent ? (
        <div className="mt-8 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
          Reset instructions would be sent to <strong>{email}</strong> once email delivery is available.
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
          <Input
            id="reset-email"
            type="email"
            label="College email"
            placeholder="you@college.edu"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
            }}
            error={error}
          />
          <Button type="submit" variant="accent" className="w-full">
            Send reset link
          </Button>
        </form>
      )}

      <p className="mt-7 text-center text-sm text-muted">
        Remembered it?{" "}
        <Link to="/login" className="font-bold text-orange hover:text-orange-hover">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
