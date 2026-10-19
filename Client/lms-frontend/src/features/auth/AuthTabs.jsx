import { NavLink } from "react-router-dom";
import { cn } from "../../lib/cn";

export function AuthTabs() {
  const tabClass = ({ isActive }) =>
    cn(
      "rounded-lg px-3 py-3 text-center text-sm font-semibold transition",
      isActive ? "bg-white text-navy shadow-sm" : "text-muted hover:text-ink",
    );

  return (
    <div className="mt-8 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
      <NavLink to="/login" className={tabClass}>
        Sign in
      </NavLink>
      <NavLink to="/signup" className={tabClass}>
        Create account
      </NavLink>
    </div>
  );
}
