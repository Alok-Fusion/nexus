"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FileText,
  Table2,
  Sparkles,
  Plus,
  Moon,
  Sun,
  X,
  ArrowRight,
  Database,
} from "lucide-react";
import { api, SearchResult, Workspace } from "@/lib/api";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace | null;
  onOpenAI: () => void;
  onToggleTheme: () => void;
  isDark: boolean;
}

export function CommandPalette({
  isOpen,
  onClose,
  workspace,
  onOpenAI,
  onToggleTheme,
  isDark,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
      if (workspace) {
        api.search(workspace.id, "").then((res) => setResults(res.results || []));
      }
    }
  }, [isOpen, workspace]);

  useEffect(() => {
    if (!isOpen || !workspace) return;
    const timeout = setTimeout(async () => {
      try {
        const res = await api.search(workspace.id, query);
        setResults(res.results || []);
        setSelectedIndex(0);
      } catch (err) {
        console.error("Search failed", err);
      }
    }, 150);
    return () => clearTimeout(timeout);
  }, [query, isOpen, workspace]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, results.length + 3));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + Math.max(1, results.length + 3)) % Math.max(1, results.length + 3));
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleExecuteSelection();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, results]);

  const handleExecuteSelection = async () => {
    if (selectedIndex < results.length) {
      const item = results[selectedIndex];
      router.push(item.url);
      onClose();
    } else {
      const actionIndex = selectedIndex - results.length;
      if (actionIndex === 0 && workspace) {
        // Create new page
        const p = await api.createPage(workspace.id, query || "Untitled Page");
        router.push(`/p/${p.id}`);
        onClose();
      } else if (actionIndex === 1) {
        // Open AI
        onClose();
        onOpenAI();
      } else if (actionIndex === 2) {
        // Toggle theme
        onToggleTheme();
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-surface-popover border border-border rounded-xl shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[70vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-border space-x-3">
          <Search size={18} className="text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, blocks, databases, or run commands..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded-md"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results / Commands List */}
        <div className="overflow-y-auto py-2 px-2 divide-y divide-border/40">
          {/* Search Matches */}
          {results.length > 0 && (
            <div className="pb-2 space-y-1">
              <div className="px-2 py-1 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Matching Documents & Blocks
              </div>
              {results.map((item, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      router.push(item.url);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                      isSelected
                        ? "bg-brand/15 text-brand font-semibold border border-brand/30"
                        : "hover:bg-surface-hover text-foreground"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <span className="text-sm">{item.icon || "📄"}</span>
                      <div className="flex flex-col truncate">
                        <span className="truncate font-medium">{item.title}</span>
                        {item.highlights && (
                          <span className="text-[11px] text-muted-foreground truncate font-normal">
                            {item.highlights}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight size={13} className={isSelected ? "text-brand" : "text-transparent"} />
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Actions */}
          <div className="pt-2 space-y-1">
            <div className="px-2 py-1 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              Quick Actions
            </div>

            {/* Action 1: Create Page */}
            <div
              onClick={async () => {
                if (!workspace) return;
                const p = await api.createPage(workspace.id, query || "Untitled Page");
                router.push(`/p/${p.id}`);
                onClose();
              }}
              onMouseEnter={() => setSelectedIndex(results.length)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs ${
                selectedIndex === results.length
                  ? "bg-brand/15 text-brand font-semibold border border-brand/30"
                  : "hover:bg-surface-hover text-foreground"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Plus size={14} className="text-brand" />
                <span>Create new page {query ? `"${query}"` : ""}</span>
              </div>
              <span className="kbd-shortcut">↵</span>
            </div>

            {/* Action 2: Ask NEXUS AI */}
            <div
              onClick={() => {
                onClose();
                onOpenAI();
              }}
              onMouseEnter={() => setSelectedIndex(results.length + 1)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs ${
                selectedIndex === results.length + 1
                  ? "bg-brand/15 text-brand font-semibold border border-brand/30"
                  : "hover:bg-surface-hover text-foreground"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Sparkles size={14} className="text-brand" />
                <span>Ask NEXUS AI Assistant...</span>
              </div>
              <span className="kbd-shortcut">Local</span>
            </div>

            {/* Action 3: Toggle Theme */}
            <div
              onClick={() => {
                onToggleTheme();
                onClose();
              }}
              onMouseEnter={() => setSelectedIndex(results.length + 2)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs ${
                selectedIndex === results.length + 2
                  ? "bg-brand/15 text-brand font-semibold border border-brand/30"
                  : "hover:bg-surface-hover text-foreground"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                {isDark ? <Sun size={14} /> : <Moon size={14} />}
                <span>Toggle {isDark ? "Light" : "Dark"} Mode</span>
              </div>
              <span className="kbd-shortcut">Theme</span>
            </div>
          </div>
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-2 bg-surface-card/40 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Use ↑ ↓ to navigate</span>
          <span>Press ESC to dismiss</span>
        </div>
      </div>
    </div>
  );
}
