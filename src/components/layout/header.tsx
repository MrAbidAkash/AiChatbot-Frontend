"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import AuthHeader from "@/components/auth-header";

const navLinks = [
  { label: "ফিচারসমূহ", href: "/#features" },
  { label: "ইন্টিগ্রেশন", href: "/#integrations" },
  { label: "AI Desk", href: "/#dashboard" },
  { label: "মূল্য ও প্যাকেজ", href: "/#pricing" },
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
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden shadow-xs transition-transform group-hover:scale-105">
              <Image
                src="/icon-192.png"
                alt="ChatTime AI"
                width={36}
                height={36}
                className="h-full w-full object-cover"
                priority
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              ChatTime <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">AI</span>
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
