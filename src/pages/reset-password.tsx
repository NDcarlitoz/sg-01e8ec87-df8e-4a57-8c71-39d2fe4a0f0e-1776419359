import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { authService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { SEO } from "@/components/SEO";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const checkSession = async (): Promise<void> => {
      const { data: user } = await authService.getCurrentUser();
      setHasSession(!!user);
    };

    void checkSession();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords do not match",
        description: "Please make sure both password fields match.",
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await authService.updatePassword(password);

    setIsSubmitting(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Unable to update password",
        description: error,
      });
      return;
    }

    toast({
      title: "Password updated",
      description: "Your password has been changed successfully. You can now log in with the new password.",
    });

    setTimeout(() => {
      void router.push("/login");
    }, 1500);
  };

  const renderContent = (): JSX.Element => {
    if (hasSession === null) {
      return (
        <p className="text-sm text-muted-foreground">
          Validating your reset link...
        </p>
      );
    }

    if (!hasSession) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-destructive">
            This reset link is invalid or has expired.
          </p>
          <p className="text-sm text-muted-foreground">
            Please request a new password reset link.
          </p>
          <Button
            variant="outline"
            className="w-full"
            asChild
          >
            <Link href="/forgot-password">Request new reset link</Link>
          </Button>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Updating password..." : "Update password"}
        </Button>
      </form>
    );
  };

  return (
    <>
      <SEO title="Reset Password" description="Set a new password for your Telegram Automation Dashboard account." />
      <div className="flex min-h-screen items-center justify-center bg-muted px-4">
        <Card className="w-full max-w-md p-6 shadow-sm">
          <h1 className="mb-2 text-center text-2xl font-semibold tracking-tight">
            Reset your password
          </h1>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            Choose a new password for your account.
          </p>

          {renderContent()}

          <div className="mt-6 flex items-center justify-center text-sm">
            <Link href="/login" className="text-primary hover:underline">
              Back to login
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
}