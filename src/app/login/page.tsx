"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || "Invalid credentials");
      }

      toast.success(`Welcome back, ${data.data.user.name}!`);
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (role: "admin" | "employee" | "agent") => {
    if (role === "admin") {
      setEmail("admin@alhadi.local");
      setPassword("Admin@123456");
    } else if (role === "employee") {
      setEmail("employee@alhadi.local");
      setPassword("Employee@123456");
    } else if (role === "agent") {
      setEmail("agent@alhadi.local");
      setPassword("Agent@123456");
    }
    toast.info(`Filled ${role.toUpperCase()} credentials`);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Subtle Background Glow Elements */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Top Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-xl shadow-lg shadow-emerald-900/40">
            AH
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            AL-HADI ENTERPRISE
          </h1>
          <p className="text-xs text-slate-400">
            CSC & Citizen Service Center
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-slate-800 bg-slate-900/90 text-slate-100 shadow-2xl backdrop-blur-md">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg font-bold text-white">Sign In to Center Portal</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Enter your  credentials to access operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    type="email"
                    placeholder="name@alhadi.local"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9 bg-slate-950/60 border-slate-800 text-white text-xs h-9 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-300">Password</label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-9 pr-9 bg-slate-950/60 border-slate-800 text-white text-xs h-9 focus-visible:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-9 text-xs shadow-md shadow-emerald-950"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                )}
              </Button>
            </form>

            {/* Quick Demo Access Switcher */}
            <div className="pt-4 border-t border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-400 block mb-2 text-center uppercase tracking-wider">
                Quick Demo Access (1-Click Fill)
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemoAccount("admin")}
                  className="px-2 py-1.5 rounded bg-purple-950/50 hover:bg-purple-900/70 border border-purple-800/50 text-[11px] font-semibold text-purple-300 transition-colors text-center"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoAccount("employee")}
                  className="px-2 py-1.5 rounded bg-blue-950/50 hover:bg-blue-900/70 border border-blue-800/50 text-[11px] font-semibold text-blue-300 transition-colors text-center"
                >
                  Employee
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoAccount("agent")}
                  className="px-2 py-1.5 rounded bg-amber-950/50 hover:bg-amber-900/70 border border-amber-800/50 text-[11px] font-semibold text-amber-300 transition-colors text-center"
                >
                  Agent
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500">
          <p>© 2026 AL-HADI ENTERPRISE. All rights reserved.</p>
          <p className="text-[11px] text-slate-600 mt-1">Multi-Tenant CSC & Citizen Service Architecture</p>
        </div>
      </div>
    </div>
  );
}
