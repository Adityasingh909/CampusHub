import { useState } from "react";
import { Bell, ChevronDown, Menu, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { currentUsers } from "../../data/navigation";
import { Dropdown } from "../ui/Dropdown";

export function Header({ role, onMenu }) {
  const user = currentUsers[role];
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const notificationsPath =
    role === "teacher" ? "/teacher/submissions" : "/student/notifications";

  function handleSearch(event) {
    event.preventDefault();
    const trimmed = query.trim();
    const path = role === "teacher" ? "/teacher/courses" : "/student/courses";
    navigate(trimmed ? `${path}?q=${encodeURIComponent(trimmed)}` : path);
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
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            role === "teacher"
              ? "Search students, submissions, courses"
              : "Search courses, assignments, quizzes..."
          }
          className="h-[42px] w-full rounded-lg border border-transparent bg-canvas pl-10 pr-4 text-sm text-ink outline-none placeholder:text-muted focus:border-navy focus:bg-white focus:ring-[3px] focus:ring-navy/15"
        />
      </form>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <Link
          to={notificationsPath}
          className="relative rounded-lg p-2 text-muted hover:bg-canvas hover:text-ink"
          aria-label="Notifications"
        >
          <Bell size={20} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-orange" />
        </Link>

        <Dropdown
          trigger={
            <button type="button" className="flex items-center gap-2 rounded-lg py-1 pl-2 hover:bg-canvas">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-navy text-xs font-bold text-white">
                {user.initials}
              </span>
              <span className="hidden text-left md:block">
                <span className="block text-xs font-semibold leading-tight text-ink">{user.name}</span>
                <span className="block text-[11px] leading-tight text-muted">{user.subtitle}</span>
              </span>
              <ChevronDown size={16} className="hidden text-muted md:block" />
            </button>
          }
        >
          <Link
            to={`/${role}/profile`}
            className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-ink hover:bg-canvas"
          >
            Profile
          </Link>
          <Link
            to={`/${role}/dashboard`}
            className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-ink hover:bg-canvas"
          >
            Dashboard
          </Link>
        </Dropdown>
      </div>
    </header>
  );
}
