import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { authService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { SEO } from "@/components/SEO";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!email) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please enter the email you used to register.",
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await authService.requestPasswordReset(email);

    setIsSubmitting(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Unable to send reset email",
        description: error,
      });
      return;
    }

    toast({
      title: "Check your email",
      description:
        "If an account exists for this email, we have sent a password reset link. Please follow the instructions there.",
    });

    setTimeout(() => {
      void router.push("/login");
    }, 1500);
  };

  return (
    <>
      <SEO title="Forgot Password" description="Reset your password for the Telegram Automation Dashboard." />
      <div className="flex min-h-screen items-center justify-center bg-muted px-4">
        <Card className="w-full max-w-md p-6 shadow-sm">
          <h1 className="mb-2 text-center text-2xl font-semibold tracking-tight">
            Forgot your password?
          </h1>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending reset link..." : "Send reset link"}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <Link href="/login" className="text-primary hover:underline">
              Back to login
            </Link>
            <Link href="/signup" className="text-muted-foreground hover:underline">
              Create an account
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
}