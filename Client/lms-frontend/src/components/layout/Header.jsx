import { useState, useMemo } from "react";
import {
  Bell,
  BellOff,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  User,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Dropdown } from "../ui/Dropdown";
import { useAuth } from "../../hooks/useAuth";

function UserAvatar({ avatar, displayName, initials }) {
  const [hasError, setHasError] = useState(false);

  if (avatar && !hasError) {
    return (
      <img
        key={avatar}
        src={avatar}
        alt={displayName}
        onError={() => setHasError(true)}
        className="h-8 w-8 rounded-full object-cover border border-line"
      />
    );
  }

  return (
    <span className="grid h-8 w-8 place-items-center rounded-full bg-navy text-xs font-bold text-white">
      {initials}
    </span>
  );
}

export function Header({ role, onMenu }) {
  const { user: authUser, signOut } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");

  // Normalize role from authenticated user or layout prop
  const normalizedRole = (authUser?.role ? String(authUser.role).toLowerCase() : role) || "student";
  const isTeacher = normalizedRole === "teacher";

  // Real display name from authentication without fake mock names
  const displayName =
    authUser?.name && authUser.name.trim()
      ? authUser.name.trim()
      : authUser?.email
      ? authUser.email.split("@")[0]
      : isTeacher
      ? "Faculty"
      : "Student";

  const roleTitle = isTeacher ? "Faculty / Instructor" : "Student";

  // Subtitle showing email or academic program if available
  const subtitle = useMemo(() => {
    if (isTeacher) {
      return "Faculty / Instructor";
    }
    if (authUser?.program) {
      return authUser.program;
    }
    if (authUser?.department) {
      return authUser.department;
    }
    if (authUser?.email) {
      return authUser.email;
    }
    return "Student";
  }, [authUser, isTeacher]);

  // Real initials derived from user's authenticated name/email
  const initials = useMemo(() => {
    if (authUser?.name && authUser.name.trim()) {
      const parts = authUser.name.trim().split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (authUser?.email) {
      return authUser.email.slice(0, 2).toUpperCase();
    }
    return isTeacher ? "FC" : "ST";
  }, [authUser, isTeacher]);

  function handleSearch(event) {
    event.preventDefault();
    const trimmed = query.trim();
    const path = isTeacher ? "/teacher/courses" : "/student/courses";
    navigate(trimmed ? `${path}?q=${encodeURIComponent(trimmed)}` : path);
  }

  function handleLogout() {
    signOut();
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-line bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <button
        type="button"
        className="rounded-lg p-2 text-muted hover:bg-canvas hover:text-ink lg:hidden"
        onClick={onMenu}
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      <form onSubmit={handleSearch} className="relative max-w-md flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          size={16}
        />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            isTeacher
              ? "Search students, submissions, courses..."
              : "Search courses, assignments, quizzes..."
          }
          className="h-[42px] w-full rounded-lg border border-transparent bg-canvas pl-10 pr-4 text-sm text-ink outline-none placeholder:text-muted focus:border-navy focus:bg-white focus:ring-[3px] focus:ring-navy/15"
        />
      </form>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {/* Dynamic Honest Notification Bell */}
        <Dropdown
          align="right"
          className="w-80 p-0 overflow-hidden shadow-overlay"
          trigger={
            <button
              type="button"
              className="relative rounded-lg p-2 text-muted hover:bg-canvas hover:text-ink transition-colors focus:outline-none"
              aria-label="View notifications"
            >
              <Bell size={20} />
            </button>
          }
        >
          <div className="border-b border-line p-3.5 bg-white flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-ink">Notifications</h3>
            <span className="text-[11px] font-semibold text-muted bg-slate-100 px-2 py-0.5 rounded-full">
              0 unread
            </span>
          </div>

          <div className="p-6 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-muted flex items-center justify-center mb-2.5">
              <BellOff size={18} />
            </div>
            <p className="text-sm font-semibold text-ink">No notifications yet</p>
            <p className="text-xs text-muted mt-1 leading-relaxed max-w-[220px]">
              You&apos;re all caught up! Live system alerts and coursework reminders will appear here when available.
            </p>
          </div>
        </Dropdown>

        {/* Dynamic Authenticated User Section */}
        <Dropdown
          align="right"
          className="w-60 p-1 shadow-overlay"
          trigger={
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg py-1 pl-2 pr-1.5 hover:bg-canvas transition-colors focus:outline-none"
              aria-label="User profile and settings"
            >
              <UserAvatar
                avatar={authUser?.avatar}
                displayName={displayName}
                initials={initials}
              />
              <span className="hidden text-left md:block">
                <span className="block text-xs font-semibold leading-tight text-ink truncate max-w-[140px] lg:max-w-[180px]">
                  {displayName}
                </span>
                <span className="block text-[11px] leading-tight text-muted truncate max-w-[140px] lg:max-w-[180px]">
                  {subtitle}
                </span>
              </span>
              <ChevronDown size={16} className="hidden text-muted md:block" />
            </button>
          }
        >
          {/* User details header in dropdown */}
          <div className="border-b border-line px-3 py-2.5 mb-1">
            <p className="text-xs font-bold text-ink truncate">{displayName}</p>
            {authUser?.email ? (
              <p className="text-[11px] text-muted truncate mt-0.5">{authUser.email}</p>
            ) : null}
            <span className="mt-1.5 inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-navy/10 text-navy">
              {roleTitle}
            </span>
          </div>

          <Link
            to={`/${normalizedRole}/dashboard`}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-ink hover:bg-canvas transition-colors"
          >
            <LayoutDashboard size={15} className="text-muted" />
            <span>Dashboard</span>
          </Link>

          <Link
            to={`/${normalizedRole}/profile`}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-ink hover:bg-canvas transition-colors"
          >
            <User size={15} className="text-muted" />
            <span>My Profile</span>
          </Link>

          <div className="my-1 border-t border-line" />

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </Dropdown>
      </div>
    </header>
  );
}
