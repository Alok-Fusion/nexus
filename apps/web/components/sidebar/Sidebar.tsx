"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FileText,
  ChevronRight,
  ChevronDown,
  Plus,
  Star,
  Clock,
  Trash2,
  Settings,
  Sparkles,
  Layers,
  Search,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  FolderPlus,
  Table2,
} from "lucide-react";
import { PageTreeItem, Workspace, User, api } from "@/lib/api";

interface SidebarProps {
  workspace: Workspace | null;
  workspaces: Workspace[];
  pages: PageTreeItem[];
  user: User | null;
  onSelectWorkspace: (ws: Workspace) => void;
  onPageCreated: (page: any) => void;
  onOpenCommand: () => void;
  onOpenAI: () => void;
}

export function Sidebar({
  workspace,
  workspaces,
  pages,
  user,
  onSelectWorkspace,
  onPageCreated,
  onOpenCommand,
  onOpenAI,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreatePage = async (parentId?: string) => {
    if (!workspace) return;
    try {
      const newPage = await api.createPage(workspace.id, "Untitled", parentId);
      onPageCreated(newPage);
      router.push(`/p/${newPage.id}`);
    } catch (err) {
      console.error("Failed to create page", err);
    }
  };

  const handleLogout = () => {
    api.clearToken();
    router.push("/login");
  };

  const favorites = pages.filter((p) => p.is_favorite);

  const renderTree = (items: PageTreeItem[], level: number = 0) => {
    return items.map((item) => {
      const isExpanded = !!expandedNodes[item.id];
      const hasChildren = item.children && item.children.length > 0;
      const isActive = pathname === `/p/${item.id}`;

      return (
        <div key={item.id} className="select-none">
          <div
            className={`group flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
              isActive
                ? "bg-surface-hover text-foreground font-semibold"
                : "text-muted-foreground hover:bg-surface-hover/60 hover:text-foreground"
            }`}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
            onClick={() => router.push(`/p/${item.id}`)}
          >
            <div className="flex items-center space-x-1.5 truncate">
              {hasChildren ? (
                <button
                  onClick={(e) => toggleExpand(item.id, e)}
                  className="p-0.5 hover:bg-surface-card rounded text-muted-foreground hover:text-foreground"
                >
                  {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
              ) : (
                <span className="w-3.5" />
              )}
              <span className="text-sm leading-none">{item.icon || "📄"}</span>
              <span className="truncate">{item.title || "Untitled"}</span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCreatePage(item.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-surface-card rounded text-muted-foreground hover:text-foreground"
              title="Add subpage"
            >
              <Plus size={12} />
            </button>
          </div>

          {isExpanded && hasChildren && (
            <div className="mt-0.5">{renderTree(item.children, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  if (collapsed) {
    return (
      <div className="w-12 h-screen bg-surface-sidebar border-r border-border flex flex-col items-center py-3 space-y-4 select-none">
        <button
          onClick={() => setCollapsed(false)}
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-hover rounded-md transition-colors"
          title="Expand Sidebar"
        >
          <PanelLeft size={18} />
        </button>
        <button
          onClick={onOpenCommand}
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-hover rounded-md transition-colors"
          title="Command Palette (Cmd+K)"
        >
          <Search size={18} />
        </button>
        <button
          onClick={onOpenAI}
          className="p-1.5 text-brand hover:text-brand hover:bg-brand-subtle/30 rounded-md transition-colors"
          title="NEXUS AI Assistant"
        >
          <Sparkles size={18} />
        </button>
      </div>
    );
  }

  return (
    <aside className="w-64 h-screen bg-surface-sidebar border-r border-border flex flex-col justify-between select-none z-20">
      {/* Top Section */}
      <div className="flex flex-col flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {/* Workspace Selector */}
        <div className="relative">
          <button
            onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
            className="w-full flex items-center justify-between p-2 rounded-lg bg-surface-card/60 hover:bg-surface-hover border border-border/80 transition-colors"
          >
            <div className="flex items-center space-x-2.5 truncate">
              <div className="w-6 h-6 rounded bg-brand/20 border border-brand/40 flex items-center justify-center text-xs font-bold text-brand">
                {workspace?.icon || "⚡"}
              </div>
              <div className="flex flex-col text-left truncate">
                <span className="text-xs font-bold text-foreground truncate">
                  {workspace?.name || "NEXUS Workspace"}
                </span>
                <span className="text-[10px] text-muted-foreground tracking-wide uppercase">
                  Local-First Sovereign
                </span>
              </div>
            </div>
            <ChevronDown size={14} className="text-muted-foreground" />
          </button>

          {showWorkspaceMenu && (
            <div className="absolute top-12 left-0 w-full bg-surface-popover border border-border rounded-lg shadow-xl py-1 z-30 animate-fade-in">
              <div className="px-2 py-1 text-[10px] uppercase font-bold text-muted-foreground">
                Switch Workspace
              </div>
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    onSelectWorkspace(ws);
                    setShowWorkspaceMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center space-x-2 hover:bg-surface-hover ${
                    ws.id === workspace?.id ? "text-brand font-semibold" : "text-foreground"
                  }`}
                >
                  <span>{ws.icon || "⚡"}</span>
                  <span className="truncate">{ws.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Global Quick Action Buttons */}
        <div className="space-y-1">
          <button
            onClick={onOpenCommand}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Search size={14} />
              <span>Search / Command</span>
            </div>
            <span className="kbd-shortcut">⌘K</span>
          </button>

          <button
            onClick={onOpenAI}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-medium text-brand hover:bg-brand-subtle/30 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Sparkles size={14} />
              <span className="font-semibold">NEXUS AI Assistant</span>
            </div>
            <span className="kbd-shortcut bg-brand/10 border-brand/30 text-brand">Local</span>
          </button>
        </div>

        {/* Favorites */}
        {favorites.length > 0 && (
          <div className="space-y-1">
            <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center space-x-1">
              <Star size={11} />
              <span>Favorites</span>
            </div>
            {favorites.map((fav) => (
              <div
                key={fav.id}
                onClick={() => router.push(`/p/${fav.id}`)}
                className={`flex items-center px-2 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                  pathname === `/p/${fav.id}`
                    ? "bg-surface-hover text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-surface-hover/60 hover:text-foreground"
                }`}
              >
                <span className="text-sm leading-none mr-2">{fav.icon || "📄"}</span>
                <span className="truncate">{fav.title || "Untitled"}</span>
              </div>
            ))}
          </div>
        )}

        {/* Pages Tree */}
        <div className="space-y-1 flex-1">
          <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Pages</span>
            <button
              onClick={() => handleCreatePage()}
              className="p-1 hover:bg-surface-card rounded text-muted-foreground hover:text-foreground"
              title="Create Root Page"
            >
              <Plus size={13} />
            </button>
          </div>

          <div className="space-y-0.5">
            {pages.length === 0 ? (
              <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                No pages yet.
                <button
                  onClick={() => handleCreatePage()}
                  className="mt-1 block mx-auto text-brand hover:underline font-medium"
                >
                  Create first page
                </button>
              </div>
            ) : (
              renderTree(pages)
            )}
          </div>
        </div>
      </div>

      {/* Bottom User & Settings Footer */}
      <div className="p-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center space-x-2 truncate">
          <div className="w-6 h-6 rounded-full bg-surface-card border border-border flex items-center justify-center font-bold text-[10px] text-foreground">
            {user?.full_name?.charAt(0) || "U"}
          </div>
          <span className="truncate font-medium text-foreground">{user?.full_name || "Alex Mercer"}</span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setCollapsed(true)}
            className="p-1.5 hover:bg-surface-hover rounded text-muted-foreground hover:text-foreground"
            title="Collapse Sidebar"
          >
            <PanelLeftClose size={15} />
          </button>
          <button
            onClick={handleLogout}
            className="p-1.5 hover:bg-surface-hover rounded text-muted-foreground hover:text-foreground"
            title="Logout"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
