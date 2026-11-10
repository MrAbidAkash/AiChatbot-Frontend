import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in-50 duration-300">
      {/* ==================== 1. EXECUTIVE HEADER SKELETON ==================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48 sm:w-64 rounded-lg" />
          <Skeleton className="h-3.5 w-64 sm:w-80 rounded-md" />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>

      {/* ==================== 2. SLIM SETUP REMINDER SKELETON ==================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border border-primary/20 bg-primary/5">
        <div className="flex items-start sm:items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-48 sm:w-72 rounded-md" />
            <Skeleton className="h-3 w-64 sm:w-96 rounded-md" />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Skeleton className="h-8 w-32 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>

      {/* ==================== 3. 4 KPI CARDS SKELETON ==================== */}
      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border/80 bg-card shadow-2xs">
            <CardContent className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-24 rounded-md" />
                <Skeleton className="h-7 w-7 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-20 rounded-md font-mono" />
              <div className="flex items-center gap-1.5 pt-0.5">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-3 w-24 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* ==================== 4. MAIN 2-COLUMN WORKSPACE SKELETON ==================== */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column (8 cols): Pages & Recent Inquiries */}
        <div className="space-y-6 lg:col-span-8">
          {/* Connected Facebook Pages */}
          <Card className="border-border/80 bg-card shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-40 rounded-md" />
                <Skeleton className="h-3 w-64 rounded-md" />
              </div>
              <Skeleton className="h-7 w-20 rounded-md" />
            </CardHeader>

            <CardContent className="pt-1 space-y-2.5">
              {[...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/20 p-3"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-3.5 w-32 rounded-md" />
                        <Skeleton className="h-4 w-12 rounded-full" />
                      </div>
                      <Skeleton className="h-3 w-40 rounded-md" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Skeleton className="h-7 w-14 rounded-md" />
                    <Skeleton className="h-7 w-16 rounded-md" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Inquiries Feed */}
          <Card className="border-border/80 bg-card shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-44 rounded-md" />
                <Skeleton className="h-3 w-60 rounded-md" />
              </div>
              <Skeleton className="h-7 w-16 rounded-md" />
            </CardHeader>

            <CardContent className="pt-1 divide-y divide-border/60">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start justify-between gap-3 py-3 px-2">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <div className="space-y-1.5 flex-1 max-w-md">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-3.5 w-28 rounded-md" />
                        <Skeleton className="h-4 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-3 w-3/4 rounded-md" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-14 rounded-md shrink-0 mt-1" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (4 cols): AI Health & Wallet */}
        <div className="space-y-6 lg:col-span-4">
          {/* AI Health Card */}
          <Card className="border-border/80 bg-card shadow-2xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-28 rounded-md" />
                <Skeleton className="h-4 w-20 rounded-full" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0"
                >
                  <Skeleton className="h-3 w-20 rounded-md" />
                  <Skeleton className="h-3 w-24 rounded-md" />
                </div>
              ))}
              <div className="pt-2">
                <Skeleton className="h-8 w-full rounded-md" />
              </div>
            </CardContent>
          </Card>

          {/* Wallet Card */}
          <Card className="border-border/80 bg-card shadow-2xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-28 rounded-md" />
                <Skeleton className="h-3 w-14 rounded-md" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-28 rounded-md" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-7 w-24 rounded-md" />
                  <Skeleton className="h-3 w-40 rounded-md" />
                </div>
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-2.5 w-16 rounded-md" />
                    <Skeleton className="h-2.5 w-8 rounded-md" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              </div>
              <Skeleton className="h-8 w-full rounded-md" />
              <div className="flex items-center justify-center gap-2 pt-1">
                <Skeleton className="h-3 w-36 rounded-md" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
