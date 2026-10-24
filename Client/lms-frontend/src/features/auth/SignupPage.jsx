import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { PasswordInput } from "../../components/ui/PasswordInput";
import { AuthShell } from "./AuthShell";
import { AuthTabs } from "./AuthTabs";
import { api } from "../../services/api";

export function SignupPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [terms, setTerms] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  }

  
async function handleSubmit(event) {
  event.preventDefault();

  if (form.name.trim().length < 2) {
    setError("Please enter your full name.");
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    setError("Please enter a valid email address.");
    return;
  }

  if (form.password.length < 8) {
    setError("Password must be at least 8 characters.");
    return;
  }

  if (form.password !== form.confirmPassword) {
    setError("Passwords do not match.");
    return;
  }

  if (!terms) {
    setError("Please accept the terms and privacy policy.");
    return;
  }

  setLoading(true);
  setError("");

  try {
    await api().post("/auth/register", {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
    });

    navigate("/verify-otp", {
      state: {
        email: form.email.trim().toLowerCase(),
        name: form.name.trim(),
      },
    });
  } catch (err) {
    setError(err.message || "Registration failed. Please try again.");
  } finally {
    setLoading(false);
  }
}


  return (
    <AuthShell>
      <span className="text-xs font-bold tracking-[0.22em] text-orange">GET STARTED</span>
      <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
        Create your account
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted">
        Student registration only. Teacher access is issued by the university.
      </p>

      <AuthTabs />

      <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-5">
        <Input
          id="name"
          name="name"
          autoComplete="name"
          label="Full name"
          placeholder="Enter your full name"
          value={form.name}
          onChange={handleChange}
        />
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          label="College email"
          placeholder="you@college.edu"
          value={form.email}
          onChange={handleChange}
        />
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          label="Password"
          placeholder="Enter your password"
          value={form.password}
          onChange={handleChange}
        />
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          label="Confirm password"
          placeholder="Re-enter your password"
          value={form.confirmPassword}
          onChange={handleChange}
        />
        <label className="flex cursor-pointer items-start gap-2 text-sm leading-6 text-muted">
          <input
            type="checkbox"
            checked={terms}
            onChange={(event) => setTerms(event.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 accent-orange"
          />
          <span>I agree to the terms and privacy policy.</span>
        </label>
        {error ? (
          <p role="status" className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm leading-6 text-orange-800">
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          variant="accent"
          className="w-full"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Sending OTP...</span>
            </>
          ) : (
            <>
              <span>Continue to verification</span>
              <ArrowRight size={16} />
            </>
          )}
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link to="/login" className="font-bold text-orange hover:text-orange-hover">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
