import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SEO } from "@/components/SEO";
import { profileService } from "@/services/profileService";
import { authService } from "@/services/authService";
import { Loader2, Upload, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const { data: profile, error } = await profileService.getCurrentProfile();
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } else if (profile) {
      setFullName(profile.full_name || "");
      setEmail(profile.email || "");
      setAvatarUrl(profile.avatar_url || "");
    }
    
    setLoading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size should be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const { data: url, error } = await profileService.uploadAvatar(file);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive",
      });
    } else if (url) {
      setAvatarUrl(url);
      // Auto-save avatar URL
      await profileService.updateProfile({ avatar_url: url });
      toast({
        title: "Success",
        description: "Avatar updated successfully",
      });
    }

    setUploading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await profileService.updateProfile({
      full_name: fullName,
      avatar_url: avatarUrl,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SEO
        title="Profile - Telegram Bot Admin"
        description="Manage your account profile"
      />
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Profile</h1>
            <p className="mt-2 text-muted-foreground">
              Manage your account settings and profile information
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Avatar Section */}
            <Card className="p-6">
              <div className="space-y-4">
                <h3 className="font-heading text-lg font-semibold">Profile Picture</h3>
                
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={avatarUrl} alt={fullName || "User"} />
                    <AvatarFallback className="bg-primary/10 text-2xl">
                      <User className="h-12 w-12 text-primary" />
                    </AvatarFallback>
                  </Avatar>

                  <div className="w-full">
                    <label htmlFor="avatar-upload">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        disabled={uploading}
                        onClick={() => document.getElementById("avatar-upload")?.click()}
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Photo
                          </>
                        )}
                      </Button>
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                    />
                    <p className="mt-2 text-xs text-muted-foreground text-center">
                      JPG, PNG or GIF. Max 2MB.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Profile Details */}
            <Card className="p-6 lg:col-span-2">
              <form onSubmit={handleSave} className="space-y-6">
                <h3 className="font-heading text-lg font-semibold">Account Details</h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full-name">Full Name</Label>
                    <Input
                      id="full-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed. Contact support if needed.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={loadProfile}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Account Info */}
          <Card className="p-6">
            <h3 className="font-heading text-lg font-semibold mb-4">Account Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Account Status</p>
                <p className="mt-1 font-medium">Active</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Account Type</p>
                <p className="mt-1 font-medium">Admin</p>
              </div>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}