import Link from "next/link"
import { CheckCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-primary/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="size-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to Premium! 🎉</CardTitle>
          <CardDescription>
            Your subscription is now active. You have full access to all premium features.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <h3 className="mb-2 font-semibold text-foreground">What's Included:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>AI Health Assistant for general symptoms</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Personalized vitamin recommendations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Local clinic & specialist suggestions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Unlimited health queries</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>7-day money-back guarantee</span>
              </li>
            </ul>
          </div>

          <Button asChild className="w-full" size="lg">
            <Link href="/">
              Get Started
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            You can manage your subscription anytime from your account settings.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
