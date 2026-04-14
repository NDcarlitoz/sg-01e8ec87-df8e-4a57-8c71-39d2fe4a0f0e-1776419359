import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Hash, Users, TrendingUp } from "lucide-react";

export default function ChannelsPage() {
  return (
    <ProtectedRoute>
      <SEO
        title="Channels Management - Telegram Bot Admin"
        description="Manage your Telegram channels"
      />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground">Channels</h1>
              <p className="mt-1 text-muted-foreground">
                Manage dan monitor Telegram channels yang connected dengan bot anda
              </p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Channel
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Channels</p>
                  <h3 className="mt-2 font-heading text-3xl font-bold">0</h3>
                  <p className="mt-2 text-sm text-muted-foreground">No channels yet</p>
                </div>
                <div className="rounded-lg bg-accent/10 p-3">
                  <Hash className="h-6 w-6 text-accent" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Subscribers</p>
                  <h3 className="mt-2 font-heading text-3xl font-bold">0</h3>
                  <p className="mt-2 text-sm text-success">Ready to grow</p>
                </div>
                <div className="rounded-lg bg-success/10 p-3">
                  <Users className="h-6 w-6 text-success" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Engagement Rate</p>
                  <h3 className="mt-2 font-heading text-3xl font-bold">0%</h3>
                  <p className="mt-2 text-sm text-muted-foreground">No data yet</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-3">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-8">
            <div className="text-center">
              <Hash className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-heading text-xl font-semibold">No channels yet</h3>
              <p className="mt-2 text-muted-foreground">
                Add your first Telegram channel untuk mulakan channel management
              </p>
              <Button className="mt-6 gap-2">
                <Plus className="h-4 w-4" />
                Add First Channel
              </Button>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}