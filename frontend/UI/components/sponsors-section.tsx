"use client"

import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"

export function SponsorsSection() {
  const sponsors = [
    {
      name: "TinyFish",
      description: "Autonomous web agent infrastructure",
      logo: "https://tinyfish.ai/favicon.ico",
      logoFallback: "🐟",
      url: "https://tinyfish.ai",
      logoBg: "#0f172a",
      useEmoji: false,
    },
    {
      name: "Featherless AI",
      description: "Serverless AI inference",
      logo: "",
      logoFallback: "🪶",
      url: "https://featherless.ai",
      logoBg: "#6366f1",
      useEmoji: true,
    },
    {
      name: "Stripe",
      description: "Payment infrastructure",
      logo: "https://images.ctfassets.net/fzn2n1nzq965/HTTOloNPhisV9P4hlMPNA/cacf1bb88b9fc492dfad34378d844280/Stripe_icon_-_square.svg",
      logoFallback: "💳",
      url: "https://stripe.com",
      logoBg: "#635bff",
      useEmoji: false,
    },
    {
      name: "Vercel",
      description: "Frontend deployment",
      logo: "https://assets.vercel.com/image/upload/front/favicon/vercel/180x180.png",
      logoFallback: "▲",
      url: "https://vercel.com",
      logoBg: "#000000",
      useEmoji: false,
    },
    {
      name: "ElevenLabs",
      description: "AI voice technology",
      logo: "https://elevenlabs.io/favicon-32x32.png",
      logoFallback: "🎙️",
      url: "https://elevenlabs.io",
      logoBg: "#000000",
      comingSoon: true,
      useEmoji: false,
    },
    {
      name: "Kiro",
      description: "AI-powered development",
      logo: "",
      logoFallback: "👻",
      url: "https://kiro.ai",
      logoBg: "#0ea5e9",
      useEmoji: true,
    },
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

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-6">
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
                  {/* Logo container */}
                  <div
                    className="mb-3 flex size-14 items-center justify-center overflow-hidden rounded-xl"
                    style={{ background: sponsor.logoBg }}
                  >
                    {sponsor.useEmoji ? (
                      <span style={{ fontSize: "28px" }}>{sponsor.logoFallback}</span>
                    ) : (
                      <LogoImage
                        src={sponsor.logo}
                        alt={sponsor.name}
                        fallback={sponsor.logoFallback}
                      />
                    )}
                  </div>
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
            We&apos;re grateful for their support in making healthcare more accessible.
          </p>
        </div>
      </div>
    </section>
  )
}

function LogoImage({ src, alt, fallback }: { src: string; alt: string; fallback: string }) {
  return (
    <img
      src={src}
      alt={alt}
      width={36}
      height={36}
      style={{ objectFit: "contain", width: 36, height: 36 }}
      onError={(e) => {
        // If image fails to load, show fallback emoji
        const target = e.currentTarget
        target.style.display = "none"
        const parent = target.parentElement
        if (parent && !parent.querySelector(".fallback-emoji")) {
          const span = document.createElement("span")
          span.className = "fallback-emoji"
          span.style.fontSize = "28px"
          span.textContent = fallback
          parent.appendChild(span)
        }
      }}
    />
  )
}
