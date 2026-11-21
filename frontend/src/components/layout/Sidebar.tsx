import { useAppSelector,useAppDispatch } from "../../store/hooks";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import { deleteConversation,renameConversation } from "../../features/conversations/conversationSlice";
import {
  LayoutDashboard,
  Files,
  MessageSquare,
  Brain,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Trash2,
  Pencil  
} from "lucide-react";

interface SidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/documents", label: "Documents", icon: Files },
  { to: "/chat/new", label: "AI Chat", icon: MessageSquare },
];

export default function Sidebar({
  isCollapsed,
  isMobileOpen,
  onToggleCollapse,
  onCloseMobile,
}: SidebarProps) {
  const conversations = useAppSelector(
      (state) => state.conversations.conversations
  );
  const dispatch = useAppDispatch();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(""); 
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-950 p-3 text-white transition-all duration-300 md:static md:translate-x-0 ${
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      } ${isCollapsed ? "md:w-20" : "md:w-64"}`}
    >
      {/* Sidebar Header */}
      <div className="mb-8 flex h-10 items-center justify-between gap-2 px-1">

        <div className="flex min-w-0 items-center gap-3">

          {/* Brain icon with hover sidebar toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="group relative hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-slate-800 md:flex"
          >
            {/* Brain icon */}
            <Brain className="absolute h-7 w-7 text-blue-400 transition-opacity duration-150 group-hover:opacity-0" />

            {/* Toggle icon appears on hover */}
            {isCollapsed ? (
              <PanelLeftOpen
                className="absolute h-5 w-5 text-slate-300 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
              />
            ) : (
              <PanelLeftClose
                className="absolute h-5 w-5 text-slate-300 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
              />
            )}
          </button>

          {/* Brain icon for mobile */}
          <Brain className="h-7 w-7 shrink-0 text-blue-400 md:hidden" />

          {/* Application title */}
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="whitespace-nowrap text-base font-bold">
                Knowledge AI
              </h1>
              <p className="whitespace-nowrap text-xs text-slate-400">
                Your knowledge workspace
              </p>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close sidebar"
          className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            onClick={onCloseMobile}
            title={isCollapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              } ${isCollapsed ? "md:justify-center md:px-2" : ""}`
            }
          >
            <Icon className="h-5 w-5 shrink-0" />

            <span className={isCollapsed ? "md:hidden" : ""}>
              {label}
            </span>
          </NavLink>
        ))}
      </nav>
      <div className={`mt-6 ${isCollapsed ? "md:hidden" : ""}`}>
        <h3 className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Recent Conversations
        </h3>
      <div className="flex flex-col gap-1">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className="group flex items-center gap-2 rounded-lg hover:bg-slate-800"
              >
            {editingId === conversation.id ? (
              <input
                autoFocus
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const title = editingTitle.trim();
                    if (title) {
                      dispatch(renameConversation({
                        conversationId: conversation.id,
                        title
                      }));
                    }
                    setEditingId(null);
                  }
                  if (e.key === "Escape") setEditingId(null);
                }}
                onBlur={() => setEditingId(null)}
                className="min-w-0 flex-1 rounded bg-slate-700 px-2 py-1 text-sm text-white outline-none"
              />
            ) : (
              <NavLink
                to={`/chat/${conversation.id}`}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                    `min-w-0 flex-1 truncate rounded-lg px-3 py-2 text-sm transition ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`
                  }
              >
                {conversation.title}
              </NavLink>
            )}

            <button
              onClick={() => {
                setEditingId(conversation.id);
                setEditingTitle(conversation.title);
              }}
              className="text-slate-500 hover:text-blue-400"
              title="Rename conversation"
            >
              <Pencil size={15} />
            </button>

            <button
              onClick={() => dispatch(deleteConversation(conversation.id))}
              className="mr-2 text-slate-500 hover:text-red-400"
              title="Delete conversation"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      </div>
      {/* Sidebar Footer */}
      {!isCollapsed && (
        <div className="mt-auto border-t border-slate-800 px-2 pt-4 text-xs text-slate-500">
          AI Knowledge Workspace
        </div>
      )}
    </aside>
  );
}
