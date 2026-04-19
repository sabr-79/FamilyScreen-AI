"use client"

import { Card, CardContent } from "@/components/ui/card"

export function SponsorsSection() {
  const sponsors = [
    {
      name: "TinyFish",
      description: "Autonomous web agent infrastructure",
      logo: "🐟",
      url: "https://tinyfish.ai"
    },
    {
      name: "Featherless AI",
      description: "Serverless AI inference",
      logo: "🪶",
      url: "https://featherless.ai"
    },
    {
      name: "Stripe",
      description: "Payment infrastructure",
      logo: "💳",
      url: "https://stripe.com"
    },
    {
      name: "Vercel",
      description: "Frontend deployment platform",
      logo: "▲",
      url: "https://vercel.com"
    },
    {
      name: "ElevenLabs",
      description: "AI voice technology",
      logo: "🎙️",
      url: "https://elevenlabs.io",
      comingSoon: true
    },
    {
      name: "Kiro",
      description: "AI-powered development",
      logo: "🤖",
      url: "https://kiro.ai"
    }
  ]

  return (
    <section className="border-t border-border bg-muted/30 py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold text-foreground">Powered By</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Built with cutting-edge AI and infrastructure partners
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {sponsors.map((sponsor) => (
            <a
              key={sponsor.name}
              href={sponsor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative"
            >
              <Card className="transition-all hover:border-primary/50 hover:shadow-md">
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <div className="mb-3 text-4xl">{sponsor.logo}</div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary">
                    {sponsor.name}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {sponsor.description}
                  </p>
                  {sponsor.comingSoon && (
                    <span className="mt-2 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      Coming Soon
                    </span>
                  )}
                </CardContent>
              </Card>
            </a>
          ))}
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>
            FamilyScreen AI is made possible by these amazing technology partners.
            <br />
            We're grateful for their support in making healthcare more accessible.
          </p>
        </div>
      </div>
    </section>
  )
}