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
  ChevronDown,
  Menu,
  X,
  Sparkles,
  LogOut,
  CreditCard,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth-client";
import { toast } from "sonner";

interface DashboardLayoutProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Shop Rules & Knowledge",
    href: "/dashboard/training",
    icon: BookOpen,
  },
  {
    name: "Facebook Connect",
    href: "/connect",
    icon: Share2,
  },
  {
    name: "Customer Inbox",
    href: "/inbox",
    icon: MessageSquare,
  },
];

export default function DashboardLayout({ user }: DashboardLayoutProps) {
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
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden shadow-xs transition-transform group-hover:scale-105">
                <Image
                  src="/icon-192.png"
                  alt="ChatTime AI"
                  width={36}
                  height={36}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold tracking-tight text-foreground">
                  ChatTime
                </span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                  AI
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:gap-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-primary/10 text-primary font-semibold shadow-2xs"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-3">
            {/* AI Status Indicator */}
            <div className="hidden lg:flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>AI Agent Active</span>
            </div>

            {/* Recharge / Billing */}
            <Link href="/pricing" className="hidden sm:block">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8 border-border hover:bg-muted"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>রিচার্জ / Pricing</span>
              </Button>
            </Link>

            {/* Theme Toggle (Light / Dark) */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 text-amber-400" />
                ) : (
                  <Moon className="h-4 w-4 text-slate-600" />
                )}
              </Button>
            )}

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="gap-2 px-2 h-9 hover:bg-muted border border-transparent hover:border-border"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold">
                    {getInitials(user?.name)}
                  </div>
                  <span className="hidden text-sm font-medium text-foreground sm:inline-block max-w-[120px] truncate">
                    {user?.name || "Merchant"}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 border-border shadow-md">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">
                      {user?.name || "Merchant"}
                    </span>
                    <span className="text-xs font-normal text-muted-foreground truncate">
                      {user?.email || "merchant@example.com"}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/training" className="cursor-pointer">
                    <BookOpen className="mr-2 h-4 w-4 text-primary" />
                    Shop Knowledge & Rules
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/connect" className="cursor-pointer">
                    <Share2 className="mr-2 h-4 w-4 text-blue-500" />
                    Facebook Connect
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/inbox" className="cursor-pointer">
                    <MessageSquare className="mr-2 h-4 w-4 text-emerald-500" />
                    Customer Conversations
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/pricing" className="cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4 text-purple-500" />
                    Recharge Balance (bKash)
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={isSigningOut}
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {isSigningOut ? "Signing out..." : "Sign out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9 text-muted-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-card p-4 md:hidden">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
            <div className="pt-3 border-t border-border mt-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
