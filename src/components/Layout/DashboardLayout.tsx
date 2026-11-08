"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bot,
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
    name: "Documents & Knowledge",
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

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
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-bold text-foreground">
                  ChatTime
                </span>
                <span className="ml-1 text-lg font-bold text-primary">AI</span>
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
                    className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                    {isActive && (
                      <span className="absolute -bottom-[17px] left-0 right-0 h-0.5 rounded-full bg-primary" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* AI Status indicator */}
            <div className="hidden items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1.5 sm:flex">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              <span className="text-xs font-medium text-green-400">
                AI Agent Active
              </span>
            </div>

            {/* Pricing / Recharge Shortcut */}
            <Link href="/pricing" className="hidden sm:block">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                রিচার্জ / Pricing
              </Button>
            </Link>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2 hover:bg-muted">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-semibold text-primary-foreground">
                    {getInitials(user?.name)}
                  </div>
                  <span className="hidden text-sm font-medium text-foreground sm:inline-block max-w-[120px] truncate">
                    {user?.name || "Merchant"}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      {user?.name || "Merchant"}
                    </span>
                    <span className="text-xs font-normal text-muted-foreground truncate">
                      {user?.email || "merchant@example.com"}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/connect" className="cursor-pointer">
                    <Share2 className="mr-2 h-4 w-4" />
                    Manage Facebook Pages
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/training" className="cursor-pointer">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Shop Knowledge & Rules
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/inbox" className="cursor-pointer">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Customer Conversations
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/pricing" className="cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4 text-primary" />
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

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-border/50 bg-background/95 backdrop-blur-xl md:hidden">
          <div className="space-y-1 px-4 py-3">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-border/50 mt-2">
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
