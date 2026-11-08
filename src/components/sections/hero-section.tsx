"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AuthButton from "@/components/auth-button";
import { ArrowRight, Sparkles, Play } from "lucide-react";

/* ─────────────────────────── types ─────────────────────────── */
type Message = { from: "ai" | "user"; text: string };

/* ─────────────────────── chat script ───────────────────────── */
const CHAT_MESSAGES: Message[] = [
  {
    from: "ai",
    text: "আসালামু আলাইকুম! 😊 আমি আপনার শপের AI Assistant। কিভাবে সাহায্য করতে পারি?",
  },
  { from: "user", text: "bhai ei dress er dam koto?" },
  {
    from: "ai",
    text: "এই Floral Maxi Dress টির দাম মাত্র ৳৮৫০ 🌸\n\nসাইজ: S, M, L, XL — সব স্টকে আছে ✅\n\nঅর্ডার করবেন?",
  },
  { from: "user", text: "haa korbo. L size" },
  { from: "ai", text: "দারুণ! অর্ডার নিচ্ছি 📝\n\nআপনার নাম কী?" },
  { from: "user", text: "Fatema Akter" },
  {
    from: "ai",
    text: "ধন্যবাদ Fatema আপু! 🎉\n\nফোন নম্বর ও ডেলিভারি ঠিকানা দিন।",
  },
  { from: "user", text: "01712345678, Mirpur-10, Dhaka" },
  {
    from: "ai",
    text: "✅ অর্ডার কনফার্ম!\n\n📦 Floral Maxi Dress (L)\n💰 ৳৮৫০ + ডেলিভারি ৳৮০\n📍 Mirpur-10, Dhaka\n\n১-৩ দিনে পৌঁছে যাবে! ধন্যবাদ 🙏",
  },
];

/* ─────────────── channel badges ────────────────────────────── */
const CHANNELS = [
  {
    name: "Facebook Messenger",
    color: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  {
    name: "Instagram",
    color: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  },
  {
    name: "WhatsApp",
    color: "bg-green-500/15 text-green-400 border-green-500/30",
  },
  {
    name: "FB Comments",
    color: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  },
];

/* ─────────────── stat chips ────────────────────────────────── */
const STATS = [
  { icon: "৳", label: "50 Free Credit" },
  { icon: "🗓", label: "7-Day Free Trial" },
  { icon: "⚡", label: "Setup in 10 min" },
  { icon: "🤖", label: "24/7 Active" },
];

/* ─────────────── floating badge cards ──────────────────────── */
const FLOAT_BADGES = [
  { text: "✅ Banglish বোঝে", pos: "absolute -left-4 top-10 lg:block hidden" },
  { text: "🛒 COD অর্ডার নেয়", pos: "absolute -right-4 top-1/3 lg:block hidden" },
  { text: "📸 ছবি চেনে", pos: "absolute -left-4 bottom-10 lg:block hidden" },
];

/* ═══════════════════════════════════════════════════════════════
   AI Avatar
═══════════════════════════════════════════════════════════════ */
function AiAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-600 ring-2 ring-teal-500/40">
      <Sparkles className="h-4 w-4 text-white" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Typing Dots
═══════════════════════════════════════════════════════════════ */
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <span
        className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce"
        style={{ animationDelay: "150ms" }}
      />
      <span
        className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce"
        style={{ animationDelay: "300ms" }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Chat Simulator
═══════════════════════════════════════════════════════════════ */
function ChatSimulator() {
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [typingText, setTypingText] = useState<string | null>(null);
  const [showTypingDots, setShowTypingDots] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* auto-scroll on new content */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleMessages, typingText, showTypingDots]);

  /* message loop */
  useEffect(() => {
    function typeAiMessage(msg: Message, done: () => void) {
      setShowTypingDots(true);
      setTypingText(null);

      const delay = Math.min(msg.text.length * 20 + 600, 1800);

      timerRef.current = setTimeout(() => {
        setShowTypingDots(false);
        let charIdx = 0;
        setTypingText("");

        function typeChar() {
          charIdx++;
          setTypingText(msg.text.slice(0, charIdx));
          if (charIdx < msg.text.length) {
            const perChar = Math.min(200 / msg.text.length, 18);
            timerRef.current = setTimeout(typeChar, perChar);
          } else {
            timerRef.current = setTimeout(() => {
              setTypingText(null);
              setVisibleMessages((prev) => [...prev, msg]);
              done();
            }, 300);
          }
        }
        typeChar();
      }, delay);
    }

    function showUserMessage(msg: Message, done: () => void) {
      timerRef.current = setTimeout(() => {
        setVisibleMessages((prev) => [...prev, msg]);
        done();
      }, 500);
    }

    function nextMessage() {
      const idx = indexRef.current;
      if (idx >= CHAT_MESSAGES.length) {
        /* restart after pause */
        timerRef.current = setTimeout(() => {
          indexRef.current = 0;
          setVisibleMessages([]);
          setTypingText(null);
          setShowTypingDots(false);
          timerRef.current = setTimeout(nextMessage, 800);
        }, 3500);
        return;
      }

      const msg = CHAT_MESSAGES[idx];
      indexRef.current = idx + 1;

      const proceed = () => {
        timerRef.current = setTimeout(nextMessage, 1500);
      };

      if (msg.from === "ai") {
        typeAiMessage(msg, proceed);
      } else {
        showUserMessage(msg, proceed);
      }
    }

    timerRef.current = setTimeout(nextMessage, 600);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center gap-3 border-b border-border pb-4 shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 ring-2 ring-teal-500/30">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-foreground leading-tight">
            AI Sales Assistant
          </p>
          <p className="text-xs text-green-400 flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            Online • আপনার শপের হয়ে কাজ করছে
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3 mt-4 pr-1 scroll-smooth"
        style={{ maxHeight: "360px", minHeight: "200px" }}
      >
        {visibleMessages.map((msg, i) => {
          if (msg.from === "ai") {
            return (
              <div
                key={i}
                className="flex gap-2 items-end animate-in fade-in slide-in-from-left-2 duration-300"
              >
                <AiAvatar />
                <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-2.5 max-w-[85%]">
                  <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                    {msg.text}
                  </p>
                </div>
              </div>
            );
          }
          return (
            <div
              key={i}
              className="flex justify-end animate-in fade-in slide-in-from-right-2 duration-300"
            >
              <div className="rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 max-w-[80%]">
                <p className="text-sm text-primary-foreground">{msg.text}</p>
              </div>
            </div>
          );
        })}

        {/* Typing dots or in-progress AI text */}
        {showTypingDots && (
          <div className="flex gap-2 items-end animate-in fade-in duration-200">
            <AiAvatar />
            <div className="rounded-2xl rounded-bl-sm bg-muted">
              <TypingDots />
            </div>
          </div>
        )}
        {typingText !== null && (
          <div className="flex gap-2 items-end animate-in fade-in duration-200">
            <AiAvatar />
            <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-2.5 max-w-[85%]">
              <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                {typingText}
                <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse align-middle" />
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Fake Input Bar */}
      <div className="mt-4 flex gap-2 shrink-0">
        <div className="flex flex-1 items-center rounded-full border border-border bg-muted/50 px-4 py-2">
          <span className="text-sm text-muted-foreground">
            মেসেজ লিখুন...
          </span>
        </div>
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Hero Section
═══════════════════════════════════════════════════════════════ */
export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      {/* ── Background ── */}
      <div className="max-sm:hidden absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(0.18_0.01_260/0.1)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.18_0.01_260/0.1)_1px,transparent_1px)] bg-[size:5rem_5rem] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_30%,#000_50%,transparent_100%)]" />
        {/* blobs */}
        <div className="absolute top-0 right-0 -mr-40 -mt-40 h-[480px] w-[480px] rounded-full bg-primary/15 blur-[90px] opacity-50" />
        <div className="absolute bottom-0 left-0 -ml-40 -mb-40 h-[480px] w-[480px] rounded-full bg-teal-600/10 blur-[90px] opacity-50" />
      </div>

      <div className="container mx-auto px-4">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* ══════════════ LEFT COLUMN ══════════════ */}
          <div className="max-w-xl">
            {/* Top badge */}
            <Badge className="mb-6 border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 gap-1.5 py-1 px-3">
              <Sparkles className="h-3 w-3" />
              Bangladesh&apos;s #1 F-Commerce AI Agent
            </Badge>

            {/* Headline */}
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl leading-tight">
              ব্যবসা চালান আপনি,
              <br />
              <span className="gradient-text">ঝামেলা সামলাবে AI</span>
            </h1>

            {/* Sub-headline */}
            <p className="mt-5 text-base md:text-lg leading-relaxed text-muted-foreground">
              Bangladesh&apos;s #1 AI Sales Agent for F-Commerce &amp;
              E-Commerce. Automates your Messenger, Instagram, WhatsApp &amp;
              Facebook Comments 24/7.
            </p>

            {/* Channel badges */}
            <div className="mt-6 flex flex-wrap gap-2">
              {CHANNELS.map((ch) => (
                <span
                  key={ch.name}
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${ch.color}`}
                >
                  {ch.name}
                </span>
              ))}
            </div>

            {/* Stats row */}
            <div className="mt-6 flex flex-wrap gap-3">
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm"
                >
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <AuthButton
                size="lg"
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              />
              <Button size="lg" variant="outline" className="gap-2 font-medium">
                <Play className="h-4 w-4 fill-current" />
                দেখুন কিভাবে কাজ করে
              </Button>
            </div>

            {/* Trust note */}
            <p className="mt-5 text-xs text-muted-foreground">
              ক্রেডিট কার্ড লাগবে না • বাংলাদেশে ব্যবহৃত • COD সাপোর্ট
            </p>
          </div>

          {/* ══════════════ RIGHT COLUMN – Chat Widget ══════════════ */}
          <div className="relative">
            {/* Floating badge cards */}
            {FLOAT_BADGES.map((b) => (
              <div
                key={b.text}
                className={`${b.pos} z-10 rounded-xl border border-border bg-card/90 backdrop-blur-sm px-3 py-2 shadow-lg`}
              >
                <span className="text-sm font-medium text-foreground whitespace-nowrap">
                  {b.text}
                </span>
              </div>
            ))}

            {/* Chat card */}
            <div className="relative rounded-2xl p-[1.5px] overflow-hidden shadow-2xl">
              {/* gradient border */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-primary/40 via-teal-500/30 to-primary/20" />
              {/* inner */}
              <div className="relative rounded-[14px] bg-card p-5">
                <ChatSimulator />
              </div>
            </div>

            {/* Decorative glow behind card */}
            <div className="absolute -inset-2 -z-10 rounded-3xl bg-primary/5 blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
