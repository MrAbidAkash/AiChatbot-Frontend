"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please provide both master email and password.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Welcome back, Master Admin!");
        router.push("/admin");
        router.refresh();
      } else {
        setErrorMsg(data.error || "Access denied. Invalid admin credentials.");
      }
    } catch (err: any) {
      setErrorMsg("Failed to connect to the authentication service.");
    } finally {
      setLoading(false);
    }
  };

  const handleAutofillOwner = () => {
    setEmail("mrabidakash@gmail.com");
    setPassword("Admin@ChatTime2026!");
    toast.info("Master credentials filled. Click Authenticate to enter.");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-emerald-500 selection:text-black">
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Logo and Shield Header */}
        <div className="text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-xl shadow-emerald-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <ShieldAlert className="h-7 w-7 text-emerald-400" />
            </div>
          </div>
          <h2 className="mt-5 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            ChatTime AI Master Admin
          </h2>
          <p className="mt-1.5 text-xs text-slate-400">
            Confidential Platform Command Center • Authorized Personnel Only
          </p>
        </div>

        {/* Card Form */}
        <div className="mt-8 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl p-6 sm:p-8 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Master Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mrabidakash@gmail.com"
                  required
                  className="pl-9 bg-slate-950/60 border-slate-700/80 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20 text-sm h-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Master Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  required
                  className="pl-9 pr-10 bg-slate-950/60 border-slate-700/80 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20 text-sm h-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold gap-2 transition-all duration-200 mt-2 shadow-lg shadow-emerald-500/25"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Authenticate & Enter Console</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Quick Demo Credential Autofill */}
          <div className="pt-2 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={handleAutofillOwner}
              className="text-[11px] text-slate-400 hover:text-emerald-400 inline-flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="h-3 w-3 text-emerald-400" />
              <span>Fill Master Owner Credentials (Abid Akash)</span>
            </button>
          </div>
        </div>

        {/* Back Link */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Return to{" "}
          <a href="/login" className="text-slate-400 hover:text-white underline">
            Merchant Portal
          </a>{" "}
          or{" "}
          <a href="/" className="text-slate-400 hover:text-white underline">
            Homepage
          </a>
        </p>
      </div>
    </div>
  );
}

