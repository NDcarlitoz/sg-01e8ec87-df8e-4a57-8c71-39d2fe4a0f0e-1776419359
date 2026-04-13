import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/30 px-6 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-6xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm font-medium text-accent">
          <Sparkles className="h-4 w-4" />
          <span>Now with advanced analytics</span>
        </div>
        
        <h1 className="font-heading text-5xl font-bold tracking-tight text-foreground sm:text-7xl">
          Manage your business
          <br />
          <span className="text-primary">with clarity</span>
        </h1>
        
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
          The all-in-one platform that gives you the tools and insights you need to grow faster. 
          Track metrics, manage data, and make informed decisions.
        </p>
        
        <div className="mt-10 flex items-center justify-center gap-4">
          <Button size="lg" className="group">
            Get started free
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
          <Button size="lg" variant="outline">
            View demo
          </Button>
        </div>
        
        <div className="mt-16 flex justify-center">
          <div className="relative rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 p-1 shadow-2xl">
            <div className="rounded-lg bg-background p-4">
              <div className="aspect-video w-full max-w-4xl overflow-hidden rounded-lg bg-muted/50">
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Dashboard Preview
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}