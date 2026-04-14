import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserCog, UserPlus, TrendingUp } from "lucide-react";

export default function UsersPage() {
  return (
    <ProtectedRoute>
      <SEO
        title="Users Management - Telegram Bot Admin"
        description="Manage your bot users"
      />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground">Users</h1>
              <p className="mt-1 text-muted-foreground">
                Manage semua users yang interact dengan bot anda
              </p>
            </div>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add User
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <h3 className="mt-2 font-heading text-3xl font-bold">0</h3>
                  <p className="mt-2 text-sm text-muted-foreground">No users yet</p>
                </div>
                <div className="rounded-lg bg-accent/10 p-3">
                  <UserCog className="h-6 w-6 text-accent" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Today</p>
                  <h3 className="mt-2 font-heading text-3xl font-bold">0</h3>
                  <p className="mt-2 text-sm text-success">Ready to engage</p>
                </div>
                <div className="rounded-lg bg-success/10 p-3">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">New This Week</p>
                  <h3 className="mt-2 font-heading text-3xl font-bold">0</h3>
                  <p className="mt-2 text-sm text-muted-foreground">No new users</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-3">
                  <UserPlus className="h-6 w-6 text-primary" />
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <div className="mb-6 flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users by name, username, or phone..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="text-center py-12">
              <UserCog className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-heading text-xl font-semibold">No users yet</h3>
              <p className="mt-2 text-muted-foreground">
                Users akan muncul di sini bila mereka mulakan interaction dengan bot anda
              </p>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}