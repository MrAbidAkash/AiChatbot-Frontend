"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageSquare,
  TrendingUp,
  Clock,
  Users,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Plus,
  Activity,
  ChevronRight,
  Play,
  Pause,
  Facebook,
  Instagram,
  Send,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Calendar,
  Zap,
  RefreshCw,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface DashboardProps {
  session: {
    user: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    };
    session: {
      id: string;
      expiresAt: Date;
    };
  };
}

// Monthly usage data
const monthlyUsageData = {
  currentMonth: "March 2026",
  messagesUsed: 8247,
  messagesLimit: 15000,
  conversationsUsed: 1842,
  conversationsLimit: 3000,
  aiResponsesUsed: 7103,
  aiResponsesLimit: 12000,
  daysRemaining: 21,
};

// Weekly trend data for the chart
const weeklyTrend = [
  { week: "Week 1", messages: 1850 },
  { week: "Week 2", messages: 2340 },
  { week: "Week 3", messages: 2180 },
  { week: "Week 4", messages: 1877 },
];

// Connected Facebook pages
const connectedPages = [
  {
    id: "1",
    name: "TechStore Official",
    platform: "facebook",
    status: "active",
    followers: 24500,
    messagesThisMonth: 3241,
    responseRate: 96,
    avgResponseTime: "1.2s",
    lastSync: "2 min ago",
  },
  {
    id: "2",
    name: "TechStore Support",
    platform: "facebook",
    status: "active",
    followers: 8200,
    messagesThisMonth: 1856,
    responseRate: 94,
    avgResponseTime: "1.8s",
    lastSync: "5 min ago",
  },
  {
    id: "3",
    name: "TechStore Instagram",
    platform: "instagram",
    status: "paused",
    followers: 45300,
    messagesThisMonth: 2104,
    responseRate: 89,
    avgResponseTime: "2.1s",
    lastSync: "1 hour ago",
  },
];

// Quick stats
const quickStats = [
  {
    title: "Total Messages",
    value: "8,247",
    change: "+12.5%",
    trend: "up",
    icon: MessageSquare,
    description: "This month",
  },
  {
    title: "Response Rate",
    value: "94.2%",
    change: "+3.1%",
    trend: "up",
    icon: TrendingUp,
    description: "Avg across pages",
  },
  {
    title: "Avg Response",
    value: "1.6s",
    change: "-0.4s",
    trend: "up",
    icon: Clock,
    description: "Faster than last month",
  },
  {
    title: "Active Users",
    value: "2,341",
    change: "+18.2%",
    trend: "up",
    icon: Users,
    description: "Unique conversations",
  },
];

export default function Dashboard({ session }: DashboardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeView, setActiveView] = useState<"overview" | "pages" | "usage">(
    "overview",
  );
  const [dbStats, setDbStats] = useState<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((data) => setDbStats(data))
      .catch((err) => console.error("Stats load error:", err));
    return () => clearTimeout(timer);
  }, []);

  const usagePercentage = (used: number, limit: number) =>
    Math.round((used / limit) * 100);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "facebook":
        return <Facebook className="h-5 w-5" />;
      case "instagram":
        return <Instagram className="h-5 w-5" />;
      case "telegram":
        return <Send className="h-5 w-5" />;
      default:
        return <MessageSquare className="h-5 w-5" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "facebook":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "instagram":
        return "bg-pink-500/20 text-pink-400 border-pink-500/30";
      case "telegram":
        return "bg-sky-500/20 text-sky-400 border-sky-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const currentStats = [
    {
      title: "Total Messages",
      value: dbStats?.totalMessages !== undefined ? dbStats.totalMessages.toLocaleString() : "8,247",
      change: "+12.5%",
      trend: "up",
      icon: MessageSquare,
      description: "Customer interactions",
    },
    {
      title: "AI Auto-Responses",
      value: dbStats?.totalAiReplies !== undefined ? dbStats.totalAiReplies.toLocaleString() : "7,103",
      change: "+14.2%",
      trend: "up",
      icon: Zap,
      description: "Powered by Gemini",
    },
    {
      title: "Trained Documents",
      value: dbStats?.totalDocuments !== undefined ? dbStats.totalDocuments.toLocaleString() : "12",
      change: "Active",
      trend: "up",
      icon: BookOpen,
      description: "Knowledge base indexed",
    },
    {
      title: "Connected FB Pages",
      value: dbStats?.totalPages !== undefined ? dbStats.totalPages.toLocaleString() : "2",
      change: "Active",
      trend: "up",
      icon: Facebook,
      description: "Auto-reply enabled",
    },
  ];

  const maxMessages = Math.max(...weeklyTrend.map((d) => d.messages));

  return (
    <div className="min-h-screen bg-background">
      {/* Subtle Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(0.12_0.01_260/0.2)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.12_0.01_260/0.2)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_40%,transparent_100%)]" />
        <div className="absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 left-0 h-[400px] w-[400px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <main className="relative z-10 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div
            className={`mb-8 transition-all duration-700 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Welcome back, {session.user.name || "User"}
                </h1>
                <p className="mt-1 text-muted-foreground">
                  Manage your connected pages and monitor your monthly usage.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/dashboard/training">
                  <Button variant="outline" size="sm" className="gap-2">
                    <BookOpen className="h-4 w-4" />
                    Knowledge Base
                  </Button>
                </Link>
                <Link href="/inbox">
                  <Button variant="outline" size="sm" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Customer Inbox
                  </Button>
                </Link>
                <Link href="/connect">
                  <Button
                    size="sm"
                    className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4" />
                    Connect Facebook
                  </Button>
                </Link>
              </div>
            </div>

            {/* View Toggle */}
            <div className="mt-6 inline-flex rounded-lg border border-border bg-muted/50 p-1">
              {[
                { id: "overview", label: "Overview" },
                { id: "pages", label: "Connected Pages" },
                { id: "usage", label: "Usage Stats" },
              ].map((view) => (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id as typeof activeView)}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                    activeView === view.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {view.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div
            className={`mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 transition-all duration-700 delay-100 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            {currentStats.map((stat, index) => (
              <Card
                key={stat.title}
                className="group border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-border hover:shadow-lg"
                style={{ transitionDelay: `${150 + index * 50}ms` }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {stat.value}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <ArrowUpRight className="h-3.5 w-3.5 text-success" />
                        <span className="text-xs font-medium text-success">
                          {stat.change}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-lg bg-primary/10 p-2.5">
                      <stat.icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Connected Pages */}
            <div
              className={`lg:col-span-2 transition-all duration-700 delay-200 ${
                isLoaded
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
            >
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Facebook className="h-5 w-5 text-blue-400" />
                      Connected Pages
                    </CardTitle>
                    <CardDescription>
                      Manage your Facebook and Instagram page connections
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Sync All
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {connectedPages.map((page, index) => (
                    <div
                      key={page.id}
                      className="group rounded-xl border border-border/50 bg-background/50 p-4 transition-all duration-200 hover:border-border hover:shadow-md"
                      style={{ animationDelay: `${300 + index * 100}ms` }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          {/* Platform Icon */}
                          <div
                            className={`rounded-xl p-3 ${getPlatformColor(page.platform)}`}
                          >
                            {getPlatformIcon(page.platform)}
                          </div>

                          {/* Page Info */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground">
                                {page.name}
                              </h3>
                              <Badge
                                variant="outline"
                                className={
                                  page.status === "active"
                                    ? "bg-success/10 text-success border-success/30"
                                    : "bg-warning/10 text-warning border-warning/30"
                                }
                              >
                                {page.status === "active" ? (
                                  <Play className="mr-1 h-3 w-3" />
                                ) : (
                                  <Pause className="mr-1 h-3 w-3" />
                                )}
                                {page.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {page.followers.toLocaleString()} followers
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Last synced: {page.lastSync}
                            </p>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="hidden text-right sm:block">
                          <p className="text-lg font-semibold text-foreground">
                            {page.messagesThisMonth.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            messages this month
                          </p>
                        </div>
                      </div>

                      {/* Page Stats Row */}
                      <div className="mt-4 grid grid-cols-3 gap-4 border-t border-border/50 pt-4">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Response Rate
                          </p>
                          <p className="font-semibold text-foreground">
                            {page.responseRate}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Avg Response
                          </p>
                          <p className="font-semibold text-foreground">
                            {page.avgResponseTime}
                          </p>
                        </div>
                        <div className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-primary"
                          >
                            Manage
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add New Page CTA */}
                  <button className="w-full rounded-xl border-2 border-dashed border-border/50 bg-background/30 p-6 text-center transition-all duration-200 hover:border-primary/50 hover:bg-primary/5">
                    <div className="flex flex-col items-center gap-2">
                      <div className="rounded-full bg-primary/10 p-3">
                        <Plus className="h-6 w-6 text-primary" />
                      </div>
                      <p className="font-medium text-foreground">
                        Connect New Page
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Link your Facebook or Instagram page
                      </p>
                    </div>
                  </button>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Usage Stats */}
            <div
              className={`space-y-6 transition-all duration-700 delay-300 ${
                isLoaded
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
            >
              {/* Monthly Usage Card */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Calendar className="h-5 w-5 text-primary" />
                        Monthly Usage
                      </CardTitle>
                      <CardDescription>
                        {monthlyUsageData.currentMonth}
                      </CardDescription>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-primary/10 text-primary border-primary/30"
                    >
                      {monthlyUsageData.daysRemaining} days left
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Messages Usage */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Messages</span>
                      <span className="font-medium text-foreground">
                        {monthlyUsageData.messagesUsed.toLocaleString()} /{" "}
                        {monthlyUsageData.messagesLimit.toLocaleString()}
                      </span>
                    </div>
                    <Progress
                      value={usagePercentage(
                        monthlyUsageData.messagesUsed,
                        monthlyUsageData.messagesLimit,
                      )}
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      {usagePercentage(
                        monthlyUsageData.messagesUsed,
                        monthlyUsageData.messagesLimit,
                      )}
                      % used
                    </p>
                  </div>

                  {/* Conversations Usage */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Conversations
                      </span>
                      <span className="font-medium text-foreground">
                        {monthlyUsageData.conversationsUsed.toLocaleString()} /{" "}
                        {monthlyUsageData.conversationsLimit.toLocaleString()}
                      </span>
                    </div>
                    <Progress
                      value={usagePercentage(
                        monthlyUsageData.conversationsUsed,
                        monthlyUsageData.conversationsLimit,
                      )}
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      {usagePercentage(
                        monthlyUsageData.conversationsUsed,
                        monthlyUsageData.conversationsLimit,
                      )}
                      % used
                    </p>
                  </div>

                  {/* AI Responses Usage */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        AI Responses
                      </span>
                      <span className="font-medium text-foreground">
                        {monthlyUsageData.aiResponsesUsed.toLocaleString()} /{" "}
                        {monthlyUsageData.aiResponsesLimit.toLocaleString()}
                      </span>
                    </div>
                    <Progress
                      value={usagePercentage(
                        monthlyUsageData.aiResponsesUsed,
                        monthlyUsageData.aiResponsesLimit,
                      )}
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      {usagePercentage(
                        monthlyUsageData.aiResponsesUsed,
                        monthlyUsageData.aiResponsesLimit,
                      )}
                      % used
                    </p>
                  </div>

                  <Button variant="outline" className="w-full gap-2">
                    <Zap className="h-4 w-4" />
                    Upgrade Plan
                  </Button>
                </CardContent>
              </Card>

              {/* Weekly Trend Mini Chart */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="h-5 w-5 text-primary" />
                    Weekly Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex h-24 items-end justify-between gap-2">
                    {weeklyTrend.map((data, index) => (
                      <div
                        key={data.week}
                        className="flex flex-1 flex-col items-center gap-1"
                      >
                        <span className="text-xs font-medium text-foreground">
                          {data.messages.toLocaleString()}
                        </span>
                        <div
                          className="w-full rounded-t bg-linear-to-t from-primary to-primary/60 transition-all duration-500"
                          style={{
                            height: `${(data.messages / maxMessages) * 60}px`,
                            transitionDelay: `${index * 100}ms`,
                          }}
                        />
                        <span className="text-xs text-muted-foreground">
                          W{index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Status */}
              <Card className="relative overflow-hidden border-success/20 bg-gradient-to-br from-success/10 via-card/50 to-primary/10">
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-success/10 blur-2xl" />
                <CardContent className="relative p-5">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/20">
                        <CheckCircle className="h-6 w-6 text-success" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 animate-pulse rounded-full bg-success" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        All Systems Active
                      </p>
                      <p className="text-sm text-muted-foreground">
                        3 pages connected and responding
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
