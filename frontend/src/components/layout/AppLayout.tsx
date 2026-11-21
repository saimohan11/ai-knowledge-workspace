
import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isMobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileOpen]);

  return (
    <div className="h-screen overflow-hidden bg-slate-900 text-white">
      {isMobileOpen && (
        <button
          type="button"
          aria-label="Close navigation backdrop"
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
        />
      )}

      <div className="flex h-full min-h-0">
        <Sidebar
          isCollapsed={isCollapsed}
          isMobileOpen={isMobileOpen}
          onToggleCollapse={() => setIsCollapsed((current) => !current)}
          onCloseMobile={() => setIsMobileOpen(false)}
        />

        <main className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-800 bg-slate-900/95 px-4 backdrop-blur md:hidden">
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open navigation"
              className="rounded-md p-2 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <Menu size={21} />
            </button>

            <span className="text-sm text-slate-400">
              AI Knowledge Workspace
            </span>
          </header>
          <div className="min-h-0 flex-1 overflow-hidden sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
