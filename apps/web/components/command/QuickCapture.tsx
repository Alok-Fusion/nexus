"use client";

import React, { useState, useEffect, useRef } from "react";
import { Zap, X, CheckCircle2, FileText, CheckSquare, Lightbulb } from "lucide-react";
import { api, Workspace } from "@/lib/api";

interface QuickCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace | null;
  onPageCreated?: (page: any) => void;
}

export function QuickCapture({ isOpen, onClose, workspace, onPageCreated }: QuickCaptureProps) {
  const [type, setType] = useState<"note" | "task" | "idea">("note");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setContent("");
      setSuccess(false);
      setIsSaving(false);
      setTimeout(() => titleInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace || !title.trim()) return;

    setIsSaving(true);
    try {
      const pageTitle = title.trim();
      const pageIcon = type === "task" ? "✅" : type === "idea" ? "💡" : "📝";
      const newPage = await api.createPage(workspace.id, pageTitle);
      
      // Update page icon and add initial block
      await api.updatePage(newPage.id, { icon: pageIcon });
      if (content.trim()) {
        await api.createBlock(newPage.id, {
          type: type === "task" ? "todo" : "paragraph",
          content: { text: content.trim() },
          properties: type === "task" ? { checked: false } : {},
        });
      }

      setSuccess(true);
      onPageCreated?.(newPage);
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err) {
      console.error("Quick capture failed", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-surface-popover border border-border rounded-xl shadow-2xl p-5 animate-fade-in flex flex-col space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center space-x-2">
            <Zap size={18} className="text-brand" />
            <h3 className="text-sm font-bold text-foreground">Quick Capture</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded-md"
          >
            <X size={16} />
          </button>
        </div>

        {/* Type selector tabs */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setType("note")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              type === "note"
                ? "bg-brand text-brand-foreground shadow-sm"
                : "bg-surface-card hover:bg-surface-hover text-muted-foreground"
            }`}
          >
            <FileText size={13} />
            <span>Note</span>
          </button>

          <button
            type="button"
            onClick={() => setType("task")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              type === "task"
                ? "bg-brand text-brand-foreground shadow-sm"
                : "bg-surface-card hover:bg-surface-hover text-muted-foreground"
            }`}
          >
            <CheckSquare size={13} />
            <span>Task</span>
          </button>

          <button
            type="button"
            onClick={() => setType("idea")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              type === "idea"
                ? "bg-brand text-brand-foreground shadow-sm"
                : "bg-surface-card hover:bg-surface-hover text-muted-foreground"
            }`}
          >
            <Lightbulb size={13} />
            <span>Idea</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === "task" ? "Task title..." : "Title or thought..."}
              className="w-full bg-surface-card border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-brand transition-colors"
              required
            />
          </div>

          <div>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Additional details, markdown notes, or checklist items..."
              className="w-full bg-surface-card border border-border rounded-lg p-3 text-xs text-foreground placeholder-muted-foreground outline-none focus:border-brand transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-muted-foreground">Press Cmd/Ctrl + Shift + Space</span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-surface-hover rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !title.trim()}
                className="flex items-center space-x-1.5 px-4 py-1.5 bg-brand hover:bg-brand/90 text-brand-foreground rounded-lg text-xs font-semibold shadow-md disabled:opacity-50 transition-all"
              >
                {success ? (
                  <>
                    <CheckCircle2 size={14} className="text-white" />
                    <span>Captured!</span>
                  </>
                ) : (
                  <span>{isSaving ? "Saving..." : "Save to Workspace"}</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
