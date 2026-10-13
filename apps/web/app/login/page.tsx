"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, Sparkles, Lock, Mail, User } from "lucide-react";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("alex@nexus.local");
  const [password, setPassword] = useState("nexus123");
  const [fullName, setFullName] = useState("Alex Mercer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        await api.register(email, password, fullName);
      } else {
        await api.login(email, password);
      }
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setEmail("alex@nexus.local");
    setPassword("nexus123");
    setLoading(true);
    setError(null);
    try {
      await api.login("alex@nexus.local", "nexus123");
      router.push("/");
    } catch {
      // If not yet seeded, register
      try {
        await api.register("alex@nexus.local", "nexus123", "Alex Mercer");
        router.push("/");
      } catch (err: any) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-surface-popover border border-border rounded-2xl shadow-2xl p-8 z-10 space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-brand/15 border border-brand/40 flex items-center justify-center text-brand mb-1">
            <span className="text-2xl font-black">⚡</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">NEXUS</h1>
          <p className="text-xs text-muted-foreground max-w-xs">
            Local-First · AI-Native · Sovereign Productivity
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-400">
              {error}
            </div>
          )}

          {isRegister && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Full Name</label>
              <div className="flex items-center space-x-2 bg-surface-card border border-border rounded-lg px-3 py-2">
                <User size={14} className="text-muted-foreground" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Mercer"
                  className="flex-1 bg-transparent text-xs text-foreground outline-none"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Email</label>
            <div className="flex items-center space-x-2 bg-surface-card border border-border rounded-lg px-3 py-2">
              <Mail size={14} className="text-muted-foreground" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@nexus.local"
                className="flex-1 bg-transparent text-xs text-foreground outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Password</label>
            <div className="flex items-center space-x-2 bg-surface-card border border-border rounded-lg px-3 py-2">
              <Lock size={14} className="text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="flex-1 bg-transparent text-xs text-foreground outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand hover:bg-brand/90 text-brand-foreground font-semibold rounded-lg text-xs flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50 transition-all"
          >
            <span>{loading ? "Authenticating..." : isRegister ? "Create Local Account" : "Sign In to NEXUS"}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        {/* Quick Demo Login Option */}
        <div className="pt-2 border-t border-border/80 flex flex-col space-y-3">
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            disabled={loading}
            className="w-full py-2 bg-surface-card hover:bg-surface-hover border border-border rounded-lg text-xs text-foreground font-medium flex items-center justify-center space-x-2 transition-colors"
          >
            <Sparkles size={13} className="text-brand" />
            <span>Quick Launch Demo Workspace</span>
          </button>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span>{isRegister ? "Already have a local profile?" : "First time using NEXUS?"}</span>
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-brand hover:underline font-semibold"
            >
              {isRegister ? "Sign In" : "Create Account"}
            </button>
          </div>
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center space-x-1.5 text-[11px] text-muted-foreground pt-2">
          <ShieldCheck size={13} className="text-emerald-500" />
          <span>100% Host Encrypted & Stored Locally</span>
        </div>
      </div>
    </div>
  );
}
