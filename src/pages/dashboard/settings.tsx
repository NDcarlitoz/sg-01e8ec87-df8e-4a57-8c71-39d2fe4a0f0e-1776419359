import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SEO title="Settings" />
      <DashboardLayout>
        <div className="max-w-3xl space-y-6">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Settings</h1>
            <p className="mt-2 text-muted-foreground">Manage your account preferences and settings</p>
          </div>

          <Card className="p-6">
            <h3 className="font-heading text-lg font-semibold">Profile</h3>
            <p className="text-sm text-muted-foreground">Update your personal information</p>
            
            <Separator className="my-6" />
            
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="John Doe" />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="john@example.com" />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="company">Company</Label>
                <Input id="company" placeholder="Acme Inc." />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button>Save Changes</Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-heading text-lg font-semibold">Notifications</h3>
            <p className="text-sm text-muted-foreground">Configure how you receive notifications</p>
            
            <Separator className="my-6" />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive email updates about your account</p>
                </div>
                <Switch />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Weekly Reports</p>
                  <p className="text-sm text-muted-foreground">Get weekly summary of your activity</p>
                </div>
                <Switch />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Marketing Emails</p>
                  <p className="text-sm text-muted-foreground">Receive updates about new features</p>
                </div>
                <Switch />
              </div>
            </div>
          </Card>

          <Card className="border-destructive/50 p-6">
            <h3 className="font-heading text-lg font-semibold text-destructive">Danger Zone</h3>
            <p className="text-sm text-muted-foreground">Irreversible actions for your account</p>
            
            <Separator className="my-6" />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Delete Account</p>
                  <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                </div>
                <Button variant="destructive">Delete</Button>
              </div>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}