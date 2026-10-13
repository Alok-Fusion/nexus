"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Header } from "@/components/ui/Header";
import { DatabaseView } from "@/components/database/DatabaseView";
import { CommandPalette } from "@/components/command/CommandPalette";
import { QuickCapture } from "@/components/command/QuickCapture";
import { AIAssistantModal } from "@/components/ai/AIAssistantModal";
import { api, DatabaseDetail, Workspace, PageTreeItem, User } from "@/lib/api";

export default function DatabasePage() {
  const params = useParams();
  const router = useRouter();
  const databaseId = params.id as string;

  const [database, setDatabase] = useState<DatabaseDetail | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [pages, setPages] = useState<PageTreeItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Theme
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  const loadDatabaseData = async () => {
    try {
      const [currentUser, dbData, wsList] = await Promise.all([
        api.getMe(),
        api.getDatabase(databaseId),
        api.getWorkspaces(),
      ]);

      setUser(currentUser);
      setDatabase(dbData);
      setWorkspaces(wsList);

      const activeWs = wsList.find((w) => w.id === dbData.workspace_id) || wsList[0];
      setCurrentWorkspace(activeWs);

      if (activeWs) {
        const pageTree = await api.getWorkspacePages(activeWs.id);
        setPages(pageTree);
      }
    } catch (err) {
      console.error("Failed to load database data", err);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (databaseId) {
      loadDatabaseData();
    }
  }, [databaseId]);

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

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("light");
  };

  if (loading || !database) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-brand/20 border border-brand/40 flex items-center justify-center text-brand animate-pulse">
            📊
          </div>
          <span className="text-xs text-muted-foreground font-medium">Opening Database...</span>
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
        onSelectWorkspace={(ws) => {
          setCurrentWorkspace(ws);
          router.push("/");
        }}
        onPageCreated={(p) => setPages([...pages, p])}
        onOpenCommand={() => setIsCommandOpen(true)}
        onOpenAI={() => setIsAIOpen(true)}
      />

      {/* Database Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <Header
          breadcrumbs={[{ label: database.name || "Database" }]}
          workspace={currentWorkspace}
          onOpenCommand={() => setIsCommandOpen(true)}
          onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
          onOpenAI={() => setIsAIOpen(true)}
          onToggleTheme={toggleTheme}
          isDark={isDark}
        />

        <main className="max-w-6xl mx-auto px-10 py-10 w-full">
          <DatabaseView database={database} onRefresh={loadDatabaseData} />
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
