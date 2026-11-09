"use client";

import { useState, useEffect } from "react";
import { getSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface PricingButtonProps {
  planName: string;
  className?: string;
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "destructive";
}

export default function PricingButton({
  planName,
  className = "",
  variant = "default",
}: PricingButtonProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getSession();
        setIsAuthenticated(!!session.data?.user);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <Button variant={variant} className={className} disabled>
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        Loading...
      </Button>
    );
  }

  // Get the appropriate CTA text and href based on plan and auth state
  const getButtonContent = () => {
    if (planName === "Free" || planName === "ফ্রি ট্রায়াল") {
      return {
        text: isAuthenticated ? "ড্যাশবোর্ডে যান" : "ফ্রি ট্রায়াল শুরু করুন",
        href: isAuthenticated ? "/dashboard" : "/login",
      };
    }

    if (planName === "Enterprise" || planName === "এন্টারপ্রাইজ") {
      return {
        text: "কন্টাক্ট করুন",
        href: "/contact",
      };
    }

    if (planName === "Starter" || planName === "স্টার্টার প্যাক") {
      return {
        text: "বিকাশ দিয়ে রিচার্জ করুন",
        href: "/checkout?plan=starter",
      };
    } else if (
      planName === "Growth" ||
      planName === "গ্রোথ প্যাক" ||
      planName === "Professional"
    ) {
      return {
        text: "বিকাশ দিয়ে রিচার্জ করুন",
        href: "/checkout?plan=growth",
      };
    } else if (planName === "Business" || planName === "বিজনেস স্কেল") {
      return {
        text: "বিকাশ দিয়ে রিচার্জ করুন",
        href: "/checkout?plan=business",
      };
    }

    return {
      text: "রিচার্জ করুন",
      href: `/checkout?plan=${planName.toLowerCase()}`,
    };
  };

  const { text, href } = getButtonContent();

  return (
    <Button variant={variant} className={className} asChild>
      <Link href={href} className="gap-2">
        {text}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Button>
  );
}
