"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Bot, Menu, X } from "lucide-react";
import AuthHeader from "@/components/auth-header";

const navLinks = [
  { label: "ফিচারসমূহ", href: "/#features" },
  { label: "ইন্টিগ্রেশন", href: "/#integrations" },
  { label: "মূল্য", href: "/pricing" },
  { label: "ব্লগ", href: "/blog" },
  { label: "যোগাযোগ", href: "/contact" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    const path = href.startsWith("/#") ? "/" : href;
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Bot className="h-5 w-5 text-primary-foreground" />
              {/* Green pulse dot — "online" indicator */}
              <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
              </span>
            </div>
            <span className="text-xl font-semibold text-foreground">
              ChatTime AI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Button
                key={link.href}
                variant="ghost"
                className={`${
                  isActive(link.href)
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                } hover:bg-accent hover:text-accent-foreground`}
                asChild
              >
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
          </nav>

          {/* Right side CTA */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/signup"
              className="text-xs bg-primary/10 text-primary border border-primary/30 rounded-full px-3 py-1 hover:bg-primary/20 transition-colors"
            >
              ৭ দিন ফ্রি →
            </Link>
            <AuthHeader />
          </div>

          {/* Mobile Menu Button */}
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

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-border py-4 md:hidden">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Button
                  key={link.href}
                  variant="ghost"
                  className={`justify-start ${
                    isActive(link.href)
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  } hover:bg-accent hover:text-accent-foreground`}
                  asChild
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              ))}
              <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
                <Link
                  href="/signup"
                  className="text-center text-xs bg-primary/10 text-primary border border-primary/30 rounded-full px-3 py-2 hover:bg-primary/20 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  ৭ দিন ফ্রি →
                </Link>
                <AuthHeader />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
