import Link from "next/link";
import { Bot, Facebook, Youtube, Twitter } from "lucide-react";

const footerLinks = {
  product: [
    { name: "AI Chatbot Builder", href: "/products/chatbot-builder" },
    { name: "Document Training", href: "/products/document-training" },
    { name: "Analytics", href: "/products/analytics" },
    { name: "Integrations", href: "/integrations" },
    { name: "API Reference", href: "/api-reference" },
  ],
  company: [
    { name: "আমাদের সম্পর্কে", href: "/about" },
    { name: "Blog", href: "/blog" },
    { name: "Pricing", href: "/pricing" },
    { name: "Contact", href: "/contact" },
    { name: "Careers", href: "/careers" },
  ],
  support: [
    { name: "Documentation", href: "/docs" },
    { name: "Help Center", href: "/help" },
    { name: "Community", href: "/community" },
    { name: "Status", href: "/status" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Privacy Policy (বাংলা)", href: "/privacy-bn" },
    { name: "Terms", href: "/terms" },
    { name: "Terms (বাংলা)", href: "/terms-bn" },
    { name: "Refund Policy", href: "/refund-policy" },
    { name: "Cookie Policy", href: "/cookie-policy" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-16 md:max-w-[90%] md:mx-auto">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold text-foreground">
                ChatTime AI
              </span>
            </Link>

            {/* Tagline */}
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              বাংলাদেশের F-Commerce ব্যবসায়ীদের জন্য তৈরি AI Sales Agent।
              Messenger, Instagram, WhatsApp সব এক জায়গায়।
            </p>

            {/* Payment Badges */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground">
                bKash 🟢
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground">
                Nagad 🔵
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground">
                Bank Transfer 🏦
              </span>
            </div>

            {/* Social Links */}
            <div className="mt-6 flex items-center gap-4">
              <Link
                href="#"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link
                href="#"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Youtube className="h-5 w-5" />
                <span className="sr-only">YouTube</span>
              </Link>
              <Link
                href="#"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
            </div>
          </div>

          {/* প্রোডাক্ট */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              প্রোডাক্ট
            </h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* কোম্পানি */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              কোম্পানি
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* সহায়তা */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              সহায়তা
            </h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* আইনি */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              আইনি
            </h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © 2026 ChatTime AI. Made with ❤️ in Bangladesh 🇧🇩
          </p>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2">
              <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <span className="text-sm text-muted-foreground">
              সব সিস্টেম সচল আছে
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
