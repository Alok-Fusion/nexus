"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  ExternalLink,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { api, AIStatus, AIChatResponse, Workspace } from "@/lib/api";

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace | null;
  currentPageId?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: { title: string; url: string }[];
  isFallback?: boolean;
}

export function AIAssistantModal({
  isOpen,
  onClose,
  workspace,
  currentPageId,
}: AIAssistantModalProps) {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I am NEXUS AI, your private, local-first intelligence assistant. Ask me to synthesize your documents, query project tasks, or plan new knowledge structures.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<AIStatus | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      api.getAIStatus().then(setStatus).catch(() => {});
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !workspace || loading) return;

    const userText = prompt.trim();
    setPrompt("");
    setMessages((prev) => [...prev, { role: "user", content: userText }]);
    setLoading(true);

    try {
      const res = await api.chatWithAI(workspace.id, userText, currentPageId);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.message,
          sources: res.sources,
          isFallback: res.is_fallback,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Local AI request failed: ${err.message || "Unknown error"}. Workspace features remain operational.`,
          isFallback: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-surface-popover border border-border rounded-xl shadow-2xl overflow-hidden animate-fade-in flex flex-col h-[600px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header & Local AI Diagnostic Status */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface-card/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand/15 border border-brand/30 flex items-center justify-center text-brand">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-foreground">NEXUS AI</h3>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    status?.status === "connected"
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                  }`}
                >
                  {status?.status === "connected" ? "Local Model Active" : "Local AI Offline"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {status?.status === "connected"
                  ? `Provider: ${status?.provider} (${status?.model})`
                  : "Zero cloud API calls · Data remains on local machine"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface-hover"
          >
            <X size={16} />
          </button>
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" && (
                <div className="w-6 h-6 rounded-md bg-brand/15 border border-brand/30 flex items-center justify-center text-brand flex-shrink-0 mt-0.5">
                  <Bot size={14} />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-xl p-3.5 text-xs leading-relaxed ${
                  m.role === "user"
                    ? "bg-brand text-brand-foreground font-medium"
                    : m.isFallback
                    ? "bg-surface-card border border-amber-500/30 text-foreground"
                    : "bg-surface-card border border-border text-foreground"
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>

                {/* Sources & Citations */}
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-border/60">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Context Sources
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {m.sources.map((src, i) => (
                        <a
                          key={i}
                          href={src.url}
                          className="flex items-center space-x-1 px-2 py-0.5 rounded bg-surface-hover hover:bg-surface-hover/80 text-[11px] text-foreground border border-border transition-colors"
                        >
                          <ExternalLink size={10} className="text-brand" />
                          <span>{src.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {m.role === "user" && (
                <div className="w-6 h-6 rounded-md bg-surface-hover flex items-center justify-center text-muted-foreground flex-shrink-0 mt-0.5">
                  <User size={14} />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-xs text-muted-foreground pl-9">
              <RefreshCw size={13} className="animate-spin text-brand" />
              <span>Analyzing local workspace context...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 border-t border-border bg-surface-card/40 flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask NEXUS AI to synthesize workspace, draft tasks, or analyze pages..."
            className="flex-1 bg-surface-card border border-border rounded-lg px-3.5 py-2 text-xs text-foreground placeholder-muted-foreground outline-none focus:border-brand transition-colors"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || loading}
            className="p-2 bg-brand hover:bg-brand/90 text-brand-foreground rounded-lg disabled:opacity-40 transition-opacity"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
