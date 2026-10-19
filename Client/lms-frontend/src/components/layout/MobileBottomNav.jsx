import { NavLink } from "react-router-dom";
import { studentMobileNav } from "../../data/navigation";
import { cn } from "../../lib/cn";

export function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-white px-2 py-2 lg:hidden">
      {studentMobileNav.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 rounded-lg py-1 text-[11px] font-semibold",
                isActive ? "text-orange" : "text-muted",
              )
            }
          >
            <Icon size={18} />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
