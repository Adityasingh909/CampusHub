import { NavLink } from "react-router-dom";
import { LogOut, X } from "lucide-react";
import { studentNav, teacherNav } from "../../data/navigation";
import { cn } from "../../lib/cn";
import { BrandMark } from "./BrandMark";

export function Sidebar({ role, open, onClose, onLogout }) {
  const items = role === "teacher" ? teacherNav : studentNav;

  return (
    <>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-navy/40 lg:hidden"
          aria-label="Close navigation"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between bg-navy py-6 text-white shadow-card transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div>
          <div className="mb-6 flex items-center justify-between px-6">
            <BrandMark inverted />
            <button
              type="button"
              className="rounded-lg p-1 text-slate-300 hover:bg-white/10 lg:hidden"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          </div>
          <p className="px-6 pb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {role === "teacher" ? "Teacher Portal" : "Student Portal LMS"}
          </p>
          <nav className="flex flex-col gap-1 px-4">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center justify-between rounded-lg px-4 py-2.5 text-sm transition",
                      isActive
                        ? "bg-orange font-semibold text-white shadow-sm"
                        : "text-slate-300 hover:bg-white/10 hover:text-white",
                    )
                  }
                >
                  <span className="flex items-center gap-3">
                    <Icon size={18} />
                    {item.label}
                  </span>
                  {item.badge ? (
                    <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold">
                      {item.badge}
                    </span>
                  ) : null}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="px-4">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
