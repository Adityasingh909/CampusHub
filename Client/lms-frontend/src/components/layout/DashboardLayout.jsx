import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Header } from "./Header";
import { MobileBottomNav } from "./MobileBottomNav";
import { Sidebar } from "./Sidebar";

export function DashboardLayout({ role }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useAuth();

  function handleLogout() {
    signOut();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <Sidebar
        role={role}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />
      <div className="lg:pl-64">
        <Header role={role} onMenu={() => setSidebarOpen(true)} />
        <main
          className={
            role === "student"
              ? "px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-8"
              : "px-4 py-6 sm:px-6 lg:px-8"
          }
        >
          <Outlet />
        </main>
      </div>
      {role === "student" ? <MobileBottomNav /> : null}
    </div>
  );
}
