import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { TrendingUp, Users, DollarSign, Activity } from "lucide-react";

export default function DashboardOverview() {
  return (
    <>
      <SEO title="Dashboard Overview" />
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Overview</h1>
            <p className="mt-2 text-muted-foreground">Welcome back! Here's what's happening today.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Revenue"
              value="$54,230"
              change="+12.5% from last month"
              changeType="positive"
              icon={DollarSign}
            />
            <MetricCard
              title="Active Users"
              value="2,845"
              change="+8.2% from last month"
              changeType="positive"
              icon={Users}
            />
            <MetricCard
              title="Conversion Rate"
              value="3.24%"
              change="-2.1% from last month"
              changeType="negative"
              icon={TrendingUp}
            />
            <MetricCard
              title="System Health"
              value="99.9%"
              change="All systems operational"
              changeType="neutral"
              icon={Activity}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h3 className="font-heading text-lg font-semibold">Revenue Trend</h3>
              <div className="mt-6 flex h-64 items-end justify-between gap-2">
                {[40, 65, 55, 75, 60, 85, 70].map((height, i) => (
                  <div key={i} className="flex-1 rounded-t bg-primary/20" style={{ height: `${height}%` }} />
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-heading text-lg font-semibold">Recent Activity</h3>
              <div className="mt-6 space-y-4">
                {[
                  { title: "New user registered", time: "2 minutes ago" },
                  { title: "Payment received", time: "15 minutes ago" },
                  { title: "Project created", time: "1 hour ago" },
                  { title: "Team member invited", time: "3 hours ago" },
                ].map((activity, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}