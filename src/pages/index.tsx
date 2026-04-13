import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { SocialProof } from "@/components/landing/SocialProof";
import { Pricing } from "@/components/landing/Pricing";
import { Footer } from "@/components/landing/Footer";
import { SEO } from "@/components/SEO";

export default function Home() {
  return (
    <>
      <SEO 
        title="SaaS Dashboard Platform - Manage Your Business with Clarity"
        description="The all-in-one platform that gives you the tools and insights you need to grow faster. Track metrics, manage data, and make informed decisions."
      />
      <main className="min-h-screen">
        <Hero />
        <Features />
        <SocialProof />
        <Pricing />
        <Footer />
      </main>
    </>
  );
}