"use client";

import React from "react";
import Link from "next/link";
import {
  Search,
  Zap,
  Sparkles,
  Sun,
  Moon,
  ChevronRight,
  Database,
  Home,
} from "lucide-react";
import { Workspace } from "@/lib/api";

interface HeaderProps {
  breadcrumbs?: { label: string; href?: string }[];
  workspace: Workspace | null;
  onOpenCommand: () => void;
  onOpenQuickCapture: () => void;
  onOpenAI: () => void;
  onToggleTheme: () => void;
  isDark: boolean;
}

export function Header({
  breadcrumbs = [],
  workspace,
  onOpenCommand,
  onOpenQuickCapture,
  onOpenAI,
  onToggleTheme,
  isDark,
}: HeaderProps) {
  return (
    <header className="h-12 border-b border-border bg-surface-sidebar/50 backdrop-blur-md px-4 flex items-center justify-between z-10 sticky top-0">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center space-x-1.5 text-xs text-muted-foreground truncate">
        <Link href="/" className="hover:text-foreground flex items-center space-x-1">
          <Home size={13} />
          <span>Home</span>
        </Link>

        {breadcrumbs.map((b, i) => (
          <React.Fragment key={i}>
            <ChevronRight size={12} className="text-muted" />
            {b.href ? (
              <Link href={b.href} className="hover:text-foreground truncate max-w-[200px]">
                {b.label}
              </Link>
            ) : (
              <span className="text-foreground font-semibold truncate max-w-[200px]">
                {b.label}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Right: Quick Action Controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onOpenQuickCapture}
          className="flex items-center space-x-1.5 px-2.5 py-1 bg-surface-card hover:bg-surface-hover border border-border text-foreground rounded-md text-xs font-medium transition-colors"
          title="Quick Capture (Cmd+Shift+Space)"
        >
          <Zap size={13} className="text-brand" />
          <span className="hidden sm:inline">Capture</span>
          <span className="kbd-shortcut hidden md:inline">⌘⇧Space</span>
        </button>

        <button
          onClick={onOpenCommand}
          className="flex items-center space-x-1.5 px-2.5 py-1 bg-surface-card hover:bg-surface-hover border border-border text-foreground rounded-md text-xs font-medium transition-colors"
          title="Search / Command Palette (Cmd+K)"
        >
          <Search size={13} className="text-muted-foreground" />
          <span className="hidden sm:inline">Search</span>
          <span className="kbd-shortcut hidden md:inline">⌘K</span>
        </button>

        <button
          onClick={onOpenAI}
          className="flex items-center space-x-1 px-2.5 py-1 bg-brand/10 hover:bg-brand/20 border border-brand/30 text-brand rounded-md text-xs font-semibold transition-colors"
          title="NEXUS AI Assistant"
        >
          <Sparkles size={13} />
          <span className="hidden sm:inline">NEXUS AI</span>
        </button>

        <button
          onClick={onToggleTheme}
          className="p-1.5 hover:bg-surface-hover text-muted-foreground hover:text-foreground rounded-md transition-colors"
          title="Toggle Dark / Light Theme"
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </header>
  );
}
