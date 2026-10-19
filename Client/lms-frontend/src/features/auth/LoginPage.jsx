import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { PasswordInput } from "../../components/ui/PasswordInput";
import { useAuth } from "../../hooks/useAuth";
import { AuthShell } from "./AuthShell";
import { AuthTabs } from "./AuthTabs";
import { api } from "../../services/api";

export function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const [error, setError] = useState("");
  const [remember, setRemember] = useState(true);
  const [form, setForm] = useState({ email: "", password: "" });

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  }

  // function handleSubmit(event) {
  //   event.preventDefault();

  //   if (!form.email.trim() || !form.password) {
  //     setError("Please enter your email and password.");
  //     return;
  //   }

  //   if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
  //     setError("Please enter a valid email address.");
  //     return;
  //   }

  //   signIn({
  //     id: "student-1",
  //     name: "Aditya Sharma",
  //     email: form.email,
  //     role: "student",
  //     subtitle: "Computer Science & Eng",
  //   });

  //   navigate("/student/dashboard");
  // }


  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.email.trim() || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    const email = form.email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api().post("/auth/login", {
        email,
        password: form.password,
      });

      if (!response?.success || !response?.token || !response?.user?.id) {
        throw new Error(response?.message || "Invalid login response.");
      }

      // Pass the real backend user and token to the auth context.
      signIn({
        ...response.user,
        role: String(response.user.role || "STUDENT").toLowerCase(),
        subtitle: "Computer Science & Eng",
        token: response.token,
      });

      const role = String(response.user.role || "STUDENT").toLowerCase();

      navigate(
        role === "teacher" ? "/teacher/dashboard" : "/student/dashboard",
        { replace: true }
      );
    } catch (err) {
      setError(err.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }


  return (
    <AuthShell>
      <span className="text-xs font-bold tracking-[0.22em] text-orange">WELCOME BACK</span>
      <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
        Sign in to your account
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted">Continue where your learning left off.</p>

      <AuthTabs />

      <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-5">
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
          autoComplete="current-password"
          label="Password"
          placeholder="Enter your password"
          value={form.password}
          onChange={handleChange}
          extraLabel={
            <Link to="/forgot-password" className="text-xs font-semibold text-orange hover:text-orange-hover">
              Forgot password?
            </Link>
          }
        />
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="h-4 w-4 accent-orange"
          />
          Remember me
        </label>
        {error ? (
          <p role="status" className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm leading-6 text-orange-800">
            {error}
          </p>
        ) : null}
        {/* <Button type="submit" variant="accent" className="w-full">
          Sign in to CampusHub
          <ArrowRight size={16} />
        </Button> */}
        <Button
          type="submit"
          variant="accent"
          className="w-full"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in to CampusHub"}
          {!loading && <ArrowRight size={16} />}
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-muted">
        New to CampusHub?{" "}
        <Link to="/signup" className="font-bold text-orange hover:text-orange-hover">
          Create account
        </Link>
      </p>
    </AuthShell>
  );
}
