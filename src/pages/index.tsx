import { useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { SocialProof } from "@/components/landing/SocialProof";
import { Pricing } from "@/components/landing/Pricing";
import { Footer } from "@/components/landing/Footer";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    // Redirect to dashboard if already logged in
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  return (
    <>
      <SEO />
      <div className="min-h-screen">
        <Hero />
        <Features />
        <SocialProof />
        <Pricing />
        <Footer />
      </div>
    </>
  );
}