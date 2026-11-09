"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  Share2,
  Menu,
  X,
  Sparkles,
  LogOut,
  CreditCard,
  Sun,
  Moon,
  Radio,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Bot,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { signOut } from "@/lib/auth-client";
import { toast } from "sonner";

interface DashboardLayoutProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  children?: React.ReactNode;
}

export default function DashboardLayout({ user, children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      toast.success("Signed out successfully");
      router.push("/login");
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to sign out");
      setIsSigningOut(false);
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "M";
    return name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const navGroups = [
    {
      group: "সেলস ও মেসেঞ্জার",
      items: [
        {
          name: "ড্যাশবোর্ড (Overview)",
          href: "/dashboard",
          icon: LayoutDashboard,
          badge: null,
        },
        {
          name: "কাস্টমার ইনবক্স",
          href: "/inbox",
          icon: MessageSquare,
          badge: "Live",
        },
        {
          name: "Facebook Connect",
          href: "/connect",
          icon: Share2,
          badge: null,
        },
      ],
    },
    {
      group: "AI এজেন্ট ও নলেজ",
      items: [
        {
          name: "শপ রুলস ও ক্যাটালগ",
          href: "/dashboard/training",
          icon: BookOpen,
          badge: null,
        },
        {
          name: "অ্যানালিটিক্স ও রিপোর্ট",
          href: "/dashboard?tab=analytics",
          icon: BarChart3,
          badge: null,
        },
      ],
    },
    {
      group: "বিলিং ও একাউন্ট",
      items: [
        {
          name: "ব্যালেন্স ও রিচার্জ",
          href: "/pricing",
          icon: CreditCard,
          badge: "bKash",
        },
      ],
    },
  ];

  // Derive current page title for the top utility bar
  const currentPageTitle = (() => {
    if (pathname === "/dashboard") return "ড্যাশবোর্ড (Overview)";
    if (pathname === "/inbox") return "কাস্টমার ইনবক্স";
    if (pathname === "/connect") return "Facebook Connect";
    if (pathname === "/dashboard/training") return "শপ রুলস ও ক্যাটালগ";
    if (pathname === "/pricing") return "ব্যালেন্স ও রিচার্জ";
    return "ড্যাশবোর্ড";
  })();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row antialiased">
      {/* ==================== 1. DESKTOP SIDEBAR ==================== */}
      <aside className="hidden lg:flex w-64 xl:w-72 border-r border-border/80 bg-card/60 backdrop-blur-md shrink-0 h-screen sticky top-0 flex-col justify-between overflow-y-auto z-40">
        <div className="p-4 space-y-6">
          {/* Logo & Brand Header */}
          <Link href="/dashboard" className="flex items-center gap-3 group px-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden shadow-xs transition-transform group-hover:scale-105">
              <Image
                src="/icon-192.png"
                alt="ChatTime AI"
                width={40}
                height={40}
                className="h-full w-full object-cover"
                priority
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-base font-bold tracking-tight text-foreground">
                  ChatTime
                </span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                  AI
                </span>
              </div>
              <span className="text-[10px] font-medium text-muted-foreground mt-1">
                F-Commerce Sales Agent
              </span>
            </div>
          </Link>

          {/* Navigation Groups */}
          <nav className="space-y-5">
            {navGroups.map((group) => (
              <div key={group.group} className="space-y-1">
                <div className="px-2 pb-1">
                  <span className="text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
                    {group.group}
                  </span>
                </div>
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all group ${
                        isActive
                          ? "bg-primary/10 text-primary font-semibold shadow-2xs border border-primary/20"
                          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`h-4 w-4 ${
                            isActive
                              ? "text-primary"
                              : "text-muted-foreground group-hover:text-foreground"
                          }`}
                        />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
                            item.badge === "Live"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                              : "bg-pink-500/10 text-pink-600 dark:text-pink-400 font-semibold"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer: AI Engine Status & Profile Box */}
        <div className="p-3 border-t border-border/80 space-y-2 bg-muted/20">
          {/* AI Live Status Pill */}
          <div className="flex items-center justify-between px-2 py-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              AI Agent Active
            </span>
            <span className="text-[10px] font-mono text-muted-foreground/80">Gemini 2.5</span>
          </div>

          {/* User Account Card */}
          <div className="rounded-xl border border-border/80 bg-card p-2.5 space-y-2 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary text-xs font-bold">
                {getInitials(user?.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate leading-tight">
                  {user?.name || "Merchant"}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {user?.email || "merchant@chattimeai.com"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-border/50">
              {mounted && (
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-muted transition-colors"
                  title="Toggle theme"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="h-3 w-3 text-amber-400" />
                      <span>Light</span>
                    </>
                  ) : (
                    <>
                      <Moon className="h-3 w-3 text-slate-600" />
                      <span>Dark</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive px-1.5 py-0.5 rounded hover:bg-destructive/10 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-3 w-3" />
                <span>{isSigningOut ? "..." : "লগআউট"}</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ==================== 2. MOBILE DRAWER ==================== */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border p-4 flex flex-col justify-between shadow-xl">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Image
                    src="/icon-192.png"
                    alt="ChatTime AI"
                    width={32}
                    height={32}
                    className="rounded-lg"
                  />
                  <span className="font-bold text-sm">ChatTime AI</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <nav className="space-y-4">
                {navGroups.map((group) => (
                  <div key={group.group} className="space-y-1">
                    <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase px-2">
                      {group.group}
                    </span>
                    {group.items.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
                          pathname === item.href
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ))}
              </nav>
            </div>

            <div className="pt-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="w-full text-xs gap-2 text-destructive"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>লগআউট</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 3. MAIN WORKSPACE AREA ==================== */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top App Bar */}
        <header className="sticky top-0 z-30 h-14 border-b border-border/80 bg-background/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
          {/* Left: Mobile Toggle & Page Title */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8 text-muted-foreground"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>

            <span className="text-xs font-semibold text-foreground">
              {currentPageTitle}
            </span>
          </div>

          {/* Right: Minimal AI Status & Wallet */}
          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              ২৪/৭ AI Active
            </span>

            <Link href="/pricing" className="hidden sm:block">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8 border-border hover:bg-muted"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>রিচার্জ</span>
              </Button>
            </Link>
          </div>
        </header>

        {/* Page Content Canvas */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
