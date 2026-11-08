"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bot,
  MessageSquare,
  Users,
  TrendingUp,
  BarChart3,
  Settings,
  FileText,
  Inbox,
  Workflow,
  Zap,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Search,
  Bell,
  Moon,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

const sidebarItems = [
  { icon: Inbox, label: "Inbox", badge: 24, active: true },
  { icon: Bot, label: "AI Agents", badge: null, active: false },
  { icon: Users, label: "Contacts", badge: null, active: false },
  { icon: ShoppingBag, label: "Orders", badge: null, active: false },
  { icon: BarChart3, label: "Analytics", badge: null, active: false },
  { icon: Settings, label: "Settings", badge: null, active: false },
];

const conversations = [
  {
    name: "Fatema Akter",
    channel: "Messenger",
    channelColor: "bg-blue-500",
    preview: "COD order দিলাম, কখন পাবো?",
    time: "2m",
    unread: true,
    agentBadge: "AI",
    agentColor: "bg-orange-500",
    active: true,
  },
  {
    name: "Rahim Vai",
    channel: "Instagram",
    channelColor: "bg-pink-500",
    preview: "bhai blue color ache?",
    time: "5m",
    unread: true,
    agentBadge: "AI",
    agentColor: "bg-green-500",
    active: false,
  },
  {
    name: "Shopna",
    channel: "WhatsApp",
    channelColor: "bg-green-600",
    preview: "আপু delivery charge koto?",
    time: "12m",
    unread: false,
    agentBadge: "Human",
    agentColor: "bg-gray-500",
    active: false,
  },
];

const chatMessages = [
  { from: "customer", text: "bhai ei floral dress er dam koto?" },
  {
    from: "ai",
    text: "এই dress টির দাম ৳৮৫০ 🌸 (L, XL available) অর্ডার করবেন?",
  },
  { from: "customer", text: "haa, L size dibo" },
  { from: "ai", text: "✅ অর্ডার নিচ্ছি! নাম ও ঠিকানা দিন।" },
  {
    from: "customer",
    text: "Fatema Akter, 01712345678, Mirpur-10 Dhaka",
  },
  {
    from: "ai",
    text: "🎉 Order Confirmed! ৳৮৫০ + ৳৮০ delivery. ১-৩ দিনে পৌঁছাবে!",
  },
  { from: "customer", text: "COD order dilam, kkhon pabo?" },
];

const todayStats = [
  { label: "Total Messages", value: "847", change: "+12%", trend: "up" },
  { label: "AI Handled", value: "94%", change: "+3%", trend: "up" },
  { label: "Orders Taken", value: "23", change: "+8%", trend: "up" },
  { label: "Avg Response", value: "0.8s", change: "-0.2s", trend: "up" },
];

const designPrinciples = [
  {
    title: "AI ও Human একসাথে",
    description: "AI handles queries automatically; team takes over seamlessly with one click",
  },
  {
    title: "Realtime Notifications",
    description: "Instant alerts for new messages, orders & customer actions",
  },
  {
    title: "Order Timeline",
    description: "Full order history & conversation context in one view",
  },
  {
    title: "Multi-page Support",
    description: "Manage multiple Facebook pages & channels from one inbox",
  },
];

export function DashboardPreview() {
  const [activeConv, setActiveConv] = useState(0);

  return (
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4 md:max-w-[90%] md:mx-auto">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <Badge className="mb-6 border-primary/30 bg-primary/10 text-primary">
            <Inbox className="mr-2 h-3 w-3" />
            AI Desk &amp; Team Inbox
          </Badge>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
            সব conversation এক জায়গায় —{" "}
            <span className="gradient-text">AI ও Team একসাথে</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            AI automatically handles customer queries. When needed, your team takes over with one
            click. See the full conversation timeline, order history &amp; customer profile.
          </p>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-16">
          <Card className="overflow-hidden border-border bg-card shadow-2xl">
            <div className="flex h-[700px]">
              {/* Sidebar */}
              <div className="hidden w-56 flex-col border-r border-border bg-sidebar lg:flex">
                {/* Logo */}
                <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="font-semibold text-sidebar-foreground text-sm">
                    AI Praktor
                  </span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-3">
                  <ul className="space-y-0.5">
                    {sidebarItems.map((item) => (
                      <li key={item.label}>
                        <button
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                            item.active
                              ? "bg-sidebar-accent text-sidebar-primary font-medium"
                              : "text-sidebar-foreground hover:bg-sidebar-accent"
                          }`}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>

                {/* User */}
                <div className="border-t border-sidebar-border p-3">
                  <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-sidebar-accent">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
                      FF
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-sidebar-foreground">
                        Fatema Fashion
                      </p>
                      <p className="truncate text-xs text-muted-foreground">Admin</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content — split into conv list + chat + right panel */}
              <div className="flex flex-1 overflow-hidden">
                {/* Today Stats Bar */}
                {/* Conversation list */}
                <div className="hidden w-64 flex-col border-r border-border xl:flex">
                  {/* Stats mini row */}
                  <div className="border-b border-border px-3 py-2">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      আজকের Stats
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {todayStats.map((s) => (
                        <div
                          key={s.label}
                          className="rounded-md border border-border bg-muted/40 px-2 py-1.5"
                        >
                          <p className="text-[9px] text-muted-foreground leading-tight">{s.label}</p>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-bold text-foreground">{s.value}</span>
                            <span
                              className={`text-[9px] ${
                                s.trend === "up" ? "text-green-400" : "text-red-400"
                              }`}
                            >
                              {s.change}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Search */}
                  <div className="border-b border-border p-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search..."
                        className="w-full rounded-md border border-border bg-muted py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Conversation list */}
                  <div className="flex-1 overflow-y-auto">
                    {conversations.map((conv, idx) => (
                      <button
                        key={conv.name}
                        onClick={() => setActiveConv(idx)}
                        className={`flex w-full items-start gap-2.5 border-b border-border p-3 text-left transition-colors hover:bg-muted/50 ${
                          activeConv === idx ? "bg-muted/50" : ""
                        }`}
                      >
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                            {conv.name.charAt(0)}
                          </div>
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card ${conv.channelColor}`}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs font-semibold ${
                                conv.unread ? "text-foreground" : "text-muted-foreground"
                              }`}
                            >
                              {conv.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{conv.time}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span
                              className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium text-white ${conv.agentColor}`}
                            >
                              {conv.agentBadge}
                            </span>
                          </div>
                          <p
                            className={`mt-0.5 truncate text-[11px] ${
                              conv.unread ? "text-foreground font-medium" : "text-muted-foreground"
                            }`}
                          >
                            {conv.preview}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chat Panel */}
                <div className="flex flex-1 flex-col overflow-hidden">
                  {/* Chat header */}
                  <div className="flex h-14 items-center justify-between border-b border-border px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                        F
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-foreground">
                            Fatema Akter
                          </span>
                          <Badge className="border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] px-1.5 py-0">
                            Messenger
                          </Badge>
                          <Badge className="border-green-500/30 bg-green-500/10 text-green-400 text-[10px] px-1.5 py-0">
                            <span className="mr-0.5 h-1.5 w-1.5 rounded-full bg-green-400 inline-block" />
                            AI Active
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 border-orange-500/40 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 text-xs"
                      >
                        <Users className="h-3 w-3" />
                        Human Takeover
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Bell className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Moon className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                    {chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.from === "customer" ? "justify-start" : "justify-end"}`}
                      >
                        {msg.from === "ai" && (
                          <div className="mr-1.5 mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/20">
                            <Sparkles className="h-3 w-3 text-green-400" />
                          </div>
                        )}
                        <div
                          className={`max-w-[70%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                            msg.from === "customer"
                              ? "rounded-tl-sm bg-muted text-foreground"
                              : "rounded-tr-sm bg-green-500/15 text-foreground border border-green-500/20"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input bar */}
                  <div className="border-t border-border p-3">
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2">
                      <input
                        type="text"
                        placeholder="Reply করুন..."
                        className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                      />
                      <Button size="sm" className="h-6 bg-primary px-3 text-[11px] text-primary-foreground">
                        Send
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Right Panel — Customer Info */}
                <div className="hidden w-56 flex-col border-l border-border xl:flex overflow-y-auto">
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Customer Info
                    </p>
                  </div>
                  <div className="flex-1 p-4 space-y-4">
                    {/* Avatar */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 text-xl font-bold text-primary">
                        F
                      </div>
                      <p className="text-sm font-semibold text-foreground">Fatema Akter</p>
                      <Badge className="border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px]">
                        Messenger
                      </Badge>
                    </div>

                    {/* Info rows */}
                    <div className="space-y-2.5 rounded-lg border border-border bg-muted/40 p-3">
                      {[
                        { label: "Phone", value: "01712345678" },
                        { label: "Channel", value: "Messenger" },
                        { label: "Total Orders", value: "3" },
                      ].map((row) => (
                        <div key={row.label} className="flex justify-between">
                          <span className="text-[11px] text-muted-foreground">{row.label}</span>
                          <span className="text-[11px] font-medium text-foreground">{row.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Last order */}
                    <div className="rounded-lg border border-border bg-muted/40 p-3">
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Last Order
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-foreground">৳৮৫০</span>
                        <Badge className="border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-[10px]">
                          Pending
                        </Badge>
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground">Floral Dress — L</p>
                    </div>

                    {/* Quick actions */}
                    <div className="space-y-1.5">
                      <Button
                        size="sm"
                        className="w-full gap-1.5 bg-primary text-primary-foreground text-xs h-7"
                      >
                        <ShoppingBag className="h-3 w-3" />
                        View Orders
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full gap-1.5 text-xs h-7"
                      >
                        <FileText className="h-3 w-3" />
                        Order History
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Design Principles */}
        <div className="mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {designPrinciples.map((principle) => (
            <div
              key={principle.title}
              className="rounded-lg border border-border bg-card p-6"
            >
              <h3 className="font-semibold text-foreground">{principle.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{principle.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
