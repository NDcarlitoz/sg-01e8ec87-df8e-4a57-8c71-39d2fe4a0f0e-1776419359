import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "CEO, TechStart Inc",
    content: "This platform transformed how we track our metrics. The insights we've gained have been invaluable for strategic decisions.",
    rating: 5
  },
  {
    name: "Michael Rodriguez",
    role: "Operations Director, Scale Co",
    content: "The best dashboard solution we've tried. Clean interface, powerful features, and exceptional performance.",
    rating: 5
  },
  {
    name: "Emma Thompson",
    role: "Product Lead, Innovate Labs",
    content: "Our team productivity increased by 40% after switching. The collaboration features are game-changing.",
    rating: 5
  }
];

export function SocialProof() {
  return (
    <section className="bg-muted/30 px-6 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Trusted by teams worldwide
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join thousands of companies making better decisions with data
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="p-8">
              <div className="mb-4 flex gap-1">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-foreground leading-7">"{testimonial.content}"</p>
              <div className="mt-6">
                <p className="font-semibold text-foreground">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-12 opacity-60 grayscale">
          <div className="font-heading text-2xl font-bold">Company A</div>
          <div className="font-heading text-2xl font-bold">Company B</div>
          <div className="font-heading text-2xl font-bold">Company C</div>
          <div className="font-heading text-2xl font-bold">Company D</div>
        </div>
      </div>
    </section>
  );
}