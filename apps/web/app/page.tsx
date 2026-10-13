"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  Star,
  Table2,
  FolderOpen,
  ArrowRight,
  Zap,
} from "lucide-react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Header } from "@/components/ui/Header";
import { CommandPalette } from "@/components/command/CommandPalette";
import { QuickCapture } from "@/components/command/QuickCapture";
import { AIAssistantModal } from "@/components/ai/AIAssistantModal";
import { api, Workspace, PageTreeItem, User, DatabaseDetail } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [pages, setPages] = useState<PageTreeItem[]>([]);
  const [databases, setDatabases] = useState<DatabaseDetail[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Theme
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  const initData = async () => {
    try {
      const currentUser = await api.getMe();
      setUser(currentUser);
      const wsList = await api.getWorkspaces();
      setWorkspaces(wsList);
      if (wsList.length > 0) {
        const active = wsList[0];
        setCurrentWorkspace(active);
        const [pageTree, dbList] = await Promise.all([
          api.getWorkspacePages(active.id),
          api.getDatabases(active.id),
        ]);
        setPages(pageTree);
        setDatabases(dbList);
      }
    } catch (err) {
      console.error("Failed to load workspace data", err);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initData();
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === "Space") {
        e.preventDefault();
        setIsQuickCaptureOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelectWorkspace = async (ws: Workspace) => {
    setCurrentWorkspace(ws);
    const [pageTree, dbList] = await Promise.all([
      api.getWorkspacePages(ws.id),
      api.getDatabases(ws.id),
    ]);
    setPages(pageTree);
    setDatabases(dbList);
  };

  const handleCreatePage = async () => {
    if (!currentWorkspace) return;
    try {
      const p = await api.createPage(currentWorkspace.id, "Untitled Page");
      router.push(`/p/${p.id}`);
    } catch (err) {
      console.error("Create page error", err);
    }
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("light");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-brand/20 border border-brand/40 flex items-center justify-center text-brand animate-pulse">
            ⚡
          </div>
          <span className="text-xs text-muted-foreground font-medium">Launching NEXUS Local Engine...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        workspace={currentWorkspace}
        workspaces={workspaces}
        pages={pages}
        user={user}
        onSelectWorkspace={handleSelectWorkspace}
        onPageCreated={(p) => setPages([...pages, p])}
        onOpenCommand={() => setIsCommandOpen(true)}
        onOpenAI={() => setIsAIOpen(true)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <Header
          workspace={currentWorkspace}
          onOpenCommand={() => setIsCommandOpen(true)}
          onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
          onOpenAI={() => setIsAIOpen(true)}
          onToggleTheme={toggleTheme}
          isDark={isDark}
        />

        <main className="max-w-5xl mx-auto px-10 py-10 w-full space-y-10">
          {/* Welcome Banner */}
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Good morning, {user?.full_name || "Alex"}.
            </h1>
            <p className="text-sm text-muted-foreground">
              Welcome to your local-first workspace. All your documents, databases, and AI insights are cached on your host machine.
            </p>
          </div>

          {/* Quick Action Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={handleCreatePage}
              className="bg-surface-card/60 hover:bg-surface-hover border border-border hover:border-brand/50 rounded-xl p-5 cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-brand/15 border border-brand/30 flex items-center justify-center text-brand">
                  <Plus size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">New Page</h3>
                  <p className="text-[11px] text-muted-foreground">Start drafting blocks</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-brand flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                <span>Create page</span>
                <ArrowRight size={13} />
              </span>
            </div>

            <div
              onClick={() => setIsQuickCaptureOpen(true)}
              className="bg-surface-card/60 hover:bg-surface-hover border border-border hover:border-brand/50 rounded-xl p-5 cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Zap size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Quick Capture</h3>
                  <p className="text-[11px] text-muted-foreground">Instant thoughts & tasks</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-amber-400 flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                <span>Open capture modal</span>
                <ArrowRight size={13} />
              </span>
            </div>

            <div
              onClick={() => setIsAIOpen(true)}
              className="bg-surface-card/60 hover:bg-surface-hover border border-border hover:border-brand/50 rounded-xl p-5 cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">NEXUS AI</h3>
                  <p className="text-[11px] text-muted-foreground">Local workspace RAG</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-cyan-400 flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                <span>Ask assistant</span>
                <ArrowRight size={13} />
              </span>
            </div>
          </div>

          {/* Recent & Starred Pages Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center space-x-2">
                <FileText size={15} className="text-brand" />
                <span>Pinned & Recent Pages</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pages.map((p) => (
                <div
                  key={p.id}
                  onClick={() => router.push(`/p/${p.id}`)}
                  className="bg-surface-card/50 hover:bg-surface-hover border border-border hover:border-brand/40 p-4 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3 truncate">
                    <span className="text-2xl">{p.icon || "📄"}</span>
                    <div className="truncate">
                      <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-brand transition-colors">
                        {p.title || "Untitled"}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Updated {new Date(p.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {p.is_favorite && <Star size={14} className="text-amber-400 fill-amber-400" />}
                </div>
              ))}
            </div>
          </div>

          {/* Databases Section */}
          {databases.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center space-x-2">
                  <Table2 size={15} className="text-brand" />
                  <span>Workspace Databases</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {databases.map((db) => (
                  <div
                    key={db.id}
                    onClick={() => router.push(`/d/${db.id}`)}
                    className="bg-surface-card/50 hover:bg-surface-hover border border-border hover:border-brand/40 p-4 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <span className="text-2xl">{db.icon || "📊"}</span>
                      <div className="truncate">
                        <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-brand transition-colors">
                          {db.name}
                        </h4>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {db.description || `${db.rows?.length || 0} active records`}
                        </p>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-muted-foreground group-hover:text-brand transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        workspace={currentWorkspace}
        onOpenAI={() => setIsAIOpen(true)}
        onToggleTheme={toggleTheme}
        isDark={isDark}
      />

      <QuickCapture
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        workspace={currentWorkspace}
        onPageCreated={(p) => setPages([...pages, p])}
      />

      <AIAssistantModal
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        workspace={currentWorkspace}
      />
    </div>
  );
}
