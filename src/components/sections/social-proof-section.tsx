"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Star } from "lucide-react";

const stats = [
  { value: "১০,০০০+", label: "Active Businesses" },
  { value: "৯৮%", label: "Customer Satisfaction" },
  { value: "৫০ লক্ষ+", label: "Messages Processed" },
  { value: "১০ মিনিট", label: "Average Setup Time" },
];

const testimonials = [
  {
    name: "Sadia Rahman",
    business: "Sadia's Boutique, Dhaka",
    initials: "SR",
    avatarBg: "bg-pink-500/20",
    avatarText: "text-pink-400",
    text: "আগে রাত ২টায় customer message করলেও আমাকে জেগে উঠতে হতো। এখন AI সব handle করে — COD order পর্যন্ত নেয়! গত মাসে ৩৫% বেশি order পেয়েছি।",
    badge: "Messenger + Instagram",
  },
  {
    name: "Karim Vai",
    business: "Karim Electronics, Chittagong",
    initials: "KV",
    avatarBg: "bg-blue-500/20",
    avatarText: "text-blue-400",
    text: "Customer ছবি দিয়ে জিজ্ঞেস করে 'এই product ache?' — AI নিজেই বলে দেয় দাম আর স্টক। আমাকে আর সারাদিন ফোনের সামনে থাকতে হয় না।",
    badge: "Vision AI",
  },
  {
    name: "Nasrin Akter",
    business: "Nasrin Saree House, Rajshahi",
    initials: "NA",
    avatarBg: "bg-green-500/20",
    avatarText: "text-green-400",
    text: "Banglish এ message করলেও AI বুঝতে পারে — এটাই সবচেয়ে বড় ব্যাপার। Setup ১০ মিনিটেই হয়ে গেছে। bKash এ রিচার্জ করা যায়, কোনো ঝামেলা নেই।",
    badge: "bKash Recharge",
  },
  {
    name: "Raju Ahmed",
    business: "Raju Fashion, Sylhet",
    initials: "RA",
    avatarBg: "bg-orange-500/20",
    avatarText: "text-orange-400",
    text: "ManyChat try করেছিলাম, keyword set করতে করতে মাথা নষ্ট হয়ে যায়। এই AI কে শুধু বললাম আমার delivery charge ৮০ টাকা — ব্যস, বুঝে গেছে।",
    badge: "No Keyword Bots",
  },
  {
    name: "Mitu Begum",
    business: "Mitu's Handicraft, Khulna",
    initials: "MB",
    avatarBg: "bg-purple-500/20",
    avatarText: "text-purple-400",
    text: "রাত ১২টায় আসা order গুলো সকালে দেখি সব confirmed! AI customer এর নাম, ফোন, ঠিকানা নিয়ে সব গুছিয়ে রেখেছে। এখন ঘুমের সমস্যা নেই।",
    badge: "Auto COD Order",
  },
  {
    name: "Tanvir Hossain",
    business: "Tanvir Sports, Comilla",
    initials: "TH",
    avatarBg: "bg-[hsl(var(--chart-5))]/20",
    avatarText: "text-[hsl(var(--chart-5))]",
    text: "Facebook comment এ কেউ দাম জানতে চাইলে AI instant reply দেয় এবং inbox এ নিয়ে আসে। আমার page engagement অনেক বেড়ে গেছে।",
    badge: "FB Comment Auto",
  },
];

function StarRating({ count = 5 }: { count?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star
          key={i}
          className="h-4 w-4 fill-yellow-400 text-yellow-400"
        />
      ))}
    </div>
  );
}

export function SocialProofSection() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Background subtle glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 md:px-6">
        {/* ── Section Header ── */}
        <div className="mb-12 flex flex-col items-center text-center gap-4">
          <Badge
            variant="outline"
            className="inline-flex items-center gap-1.5 border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary"
          >
            <Star className="h-3.5 w-3.5 fill-primary text-primary" />
            ব্যবহারকারীদের মতামত
          </Badge>

          <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-foreground">
            হাজারো ব্যবসায়ী আমাদের{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ভরসা করেন
            </span>
          </h2>

          <p className="max-w-xl text-base text-muted-foreground md:text-lg">
            Bangladesh এর বিভিন্ন প্রান্ত থেকে F-Commerce seller রা তাদের
            অভিজ্ঞতা শেয়ার করেছেন।
          </p>
        </div>

        {/* ── Stats Row ── */}
        <div className="mb-16">
          <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="grid grid-cols-2 divide-x divide-y divide-border/50 md:grid-cols-4 md:divide-y-0">
                {stats.map((stat, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center justify-center gap-1 px-6 py-8 text-center"
                  >
                    <span className="text-3xl font-bold text-foreground md:text-4xl">
                      {stat.value}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Testimonials Grid ── */}
        <div className="mb-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <Card
              key={i}
              className="group border-border/50 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
            >
              <CardContent className="flex h-full flex-col gap-4 p-6">
                {/* Top: Avatar + name + rating */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${t.avatarBg} ${t.avatarText}`}
                    >
                      {t.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground leading-tight">
                        {t.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t.business}
                      </p>
                    </div>
                  </div>
                  <StarRating />
                </div>

                {/* Testimonial text */}
                <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{t.text}&rdquo;
                </p>

                {/* Badge */}
                <Badge
                  variant="secondary"
                  className="w-fit border border-border/60 bg-background/60 text-xs text-muted-foreground"
                >
                  {t.badge}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── CTA Banner ── */}
        <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-primary/20 via-accent/30 to-primary/20">
          <Card className="rounded-2xl border-0 bg-card/80 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center gap-6 px-6 py-10 text-center md:px-12">
              {/* Glow dot */}
              <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_2px_hsl(var(--primary)/0.6)]" />

              <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-bold text-foreground md:text-3xl">
                  আপনিও শুরু করুন আজই
                </h3>
                <p className="text-muted-foreground md:text-lg">
                  ৭ দিন বিনামূল্যে ব্যবহার করুন —{" "}
                  <span className="font-semibold text-primary">
                    ৳৫০ ফ্রি ক্রেডিট
                  </span>
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Button size="lg" asChild className="font-semibold">
                  <Link href="/signup">ফ্রি ট্রায়াল শুরু করুন</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="font-semibold">
                  <Link href="/contact">কথা বলুন আমাদের সাথে</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
