import { ShieldCheck, Activity } from "lucide-react"
import { FamilyHistoryForm } from "@/components/family-history-form"

export default function FamilyScreenAI() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
            <Activity className="size-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">FamilyScreen AI</h1>
            <p className="text-sm text-muted-foreground">Family Health Assessment Tool</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Introduction */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
            Family Cancer History Assessment
          </h2>
          <p className="mt-3 text-muted-foreground">
            Understanding your family&apos;s health history can help identify potential risk factors.
            Please enter information about family members who have been diagnosed with cancer.
          </p>
        </div>

        {/* Info Banner */}
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="text-sm text-foreground">
            <p className="font-medium">Your privacy is protected</p>
            <p className="mt-1 text-muted-foreground">
              All information you provide is encrypted and handled in accordance with HIPAA guidelines.
            </p>
          </div>
        </div>

        {/* Form */}
        <FamilyHistoryForm />

        {/* Disclaimer */}
        <div className="mt-8 rounded-lg border border-border bg-muted/50 p-4 text-center">
          <p className="text-xs text-muted-foreground">
            <strong>Disclaimer:</strong> This tool is for informational purposes only and does not
            constitute professional medical advice, diagnosis, or treatment. Always seek the advice
            of your physician or other qualified health provider with any questions you may have
            regarding a medical condition.
          </p>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} FamilyScreen AI. All rights reserved.</p>
        </footer>
      </div>
    </main>
  )
}
