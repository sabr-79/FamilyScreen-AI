"use client"

import { useState } from "react"
import { Sparkles, Lock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface HealthAssistantProps {
  isPremium: boolean
  onUpgrade: () => void
}

export function HealthAssistant({ isPremium, onUpgrade }: HealthAssistantProps) {
  const [symptoms, setSymptoms] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!symptoms.trim()) {
      setError("Please describe your symptoms or health concerns")
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch("/api/analyze-symptoms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms }),
      })

      if (!response.ok) {
        throw new Error("Failed to analyze symptoms")
      }

      const data = await response.json()
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (!isPremium) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <CardTitle>AI Health Assistant</CardTitle>
          </div>
          <CardDescription>
            Get personalized health insights, vitamin recommendations, and local clinic suggestions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-6 text-center">
            <Lock className="mx-auto mb-3 size-12 text-muted-foreground" />
            <h3 className="mb-2 font-semibold text-foreground">Premium Feature</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Unlock AI-powered health analysis for general symptoms, vitamin recommendations,
              and personalized wellness guidance.
            </p>
            <ul className="mb-6 space-y-2 text-left text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Free-form symptom analysis with AI</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Personalized vitamin & supplement recommendations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Local clinic & specialist suggestions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Lifestyle & wellness guidance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Unlimited health queries</span>
              </li>
            </ul>
            <Button onClick={onUpgrade} size="lg" className="w-full">
              Upgrade to Premium - $15/month
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              Cancel anytime • 7-day money-back guarantee
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          <CardTitle>AI Health Assistant</CardTitle>
          <span className="ml-auto rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
            Premium
          </span>
        </div>
        <CardDescription>
          Describe any health concerns, symptoms, or wellness questions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <label htmlFor="symptoms" className="text-sm font-medium text-foreground">
            What are you experiencing?
          </label>
          <Textarea
            id="symptoms"
            placeholder="Example: I've been feeling tired lately and have occasional headaches. I also want to know if I should take any vitamins..."
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            rows={6}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Be as detailed as possible. Include duration, severity, and any other relevant information.
          </p>
        </div>

        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !symptoms.trim()}
          className="w-full"
          size="lg"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Analyzing with AI...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 size-4" />
              Analyze Health Concerns
            </>
          )}
        </Button>

        {results && (
          <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div>
              <h3 className="mb-2 font-semibold text-foreground">AI Analysis</h3>
              <p className="text-sm text-muted-foreground">{results.analysis}</p>
            </div>

            {results.recommendations && results.recommendations.length > 0 && (
              <div>
                <h3 className="mb-2 font-semibold text-foreground">Recommendations</h3>
                <ul className="space-y-2">
                  {results.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {results.vitamins && results.vitamins.length > 0 && (
              <div>
                <h3 className="mb-2 font-semibold text-foreground">Suggested Vitamins & Supplements</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {results.vitamins.map((vitamin: any, idx: number) => (
                    <div key={idx} className="rounded-md border border-border bg-card p-3">
                      <p className="font-medium text-foreground">{vitamin.name}</p>
                      <p className="text-xs text-muted-foreground">{vitamin.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.clinics && results.clinics.length > 0 && (
              <div>
                <h3 className="mb-2 font-semibold text-foreground">Nearby Specialists</h3>
                <div className="space-y-2">
                  {results.clinics.map((clinic: any, idx: number) => (
                    <div key={idx} className="rounded-md border border-border bg-card p-3">
                      <p className="font-medium text-foreground">{clinic.name}</p>
                      <p className="text-xs text-muted-foreground">{clinic.specialty}</p>
                      {clinic.distance && (
                        <p className="text-xs text-muted-foreground">{clinic.distance} away</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-md border border-yellow-500/20 bg-yellow-500/10 p-3">
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                <strong>Disclaimer:</strong> This AI analysis is for informational purposes only and does not
                replace professional medical advice. Always consult with a qualified healthcare provider
                for medical concerns.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}