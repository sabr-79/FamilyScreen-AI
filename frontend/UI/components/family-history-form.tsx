"use client"

import { useState, useId } from "react"
import { Plus, Trash2, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Backend enum mappings
const RELATIONSHIPS = [
  { label: "Mother", value: "parent" },
  { label: "Father", value: "parent" },
  { label: "Sister", value: "sibling" },
  { label: "Brother", value: "sibling" },
  { label: "Grandmother", value: "grandparent" },
  { label: "Grandfather", value: "grandparent" },
  { label: "Aunt", value: "aunt_uncle" },
  { label: "Uncle", value: "aunt_uncle" },
  { label: "Cousin", value: "cousin" },
] as const

const CANCER_TYPES = [
  { label: "Breast", value: "breast" },
  { label: "Colon", value: "colorectal" },
  { label: "Lung", value: "lung" },
  { label: "Prostate", value: "prostate" },
  { label: "Cervical", value: "cervical" },
  { label: "Skin (Melanoma)", value: "melanoma" },
  { label: "Ovarian", value: "ovarian" },
  { label: "Pancreatic", value: "pancreatic" },
  { label: "Other", value: "other" },
] as const

interface FamilyMemberEntry {
  id: string
  name: string
  relationship: string
  relationshipLabel: string
  cancerType: string
  ageAtDiagnosis: string
}

interface PatientInfo {
  name: string
  age: string
  sex: string
}

interface ScreeningRecommendation {
  cancer_type: string
  risk_level: string
  recommended_age_start: number
  screening_frequency: string
  screening_method: string
  rationale: string
}

interface RiskReport {
  patient_name: string
  generated_date: string
  overall_risk_summary: string
  recommendations: ScreeningRecommendation[]
  next_steps: string[]
  disclaimer: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

let entryCounter = 0
function generateEntryId() {
  return `entry-${++entryCounter}`
}


export function FamilyHistoryForm() {
    const formId = useId()

  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    name: "",
    age: "",
    sex: "",
  })
  const [entries, setEntries] = useState<FamilyMemberEntry[]>(() => [
    { id: "entry-initial", name: "", relationship: "", relationshipLabel: "", cancerType: "", ageAtDiagnosis: "" },
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [report, setReport] = useState<RiskReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  const addEntry = () => {
    setEntries([
      ...entries,
      { id: generateEntryId(), name: "", relationship: "", relationshipLabel: "", cancerType: "", ageAtDiagnosis: "" },
    ])
  }

  const removeEntry = (id: string) => {
    if (entries.length > 1) {
      setEntries(entries.filter((entry) => entry.id !== id))
    }
  }

  const updateEntry = (id: string, field: keyof FamilyMemberEntry, value: string) => {
    setEntries(
      entries.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    )
  }

  const updateRelationship = (id: string, label: string) => {
    const rel = RELATIONSHIPS.find((r) => r.label === label)
    if (rel) {
      setEntries(
        entries.map((entry) =>
          entry.id === id
            ? { ...entry, relationship: rel.value, relationshipLabel: rel.label, name: rel.label }
            : entry
        )
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    // Validate required fields
    if (!patientInfo.name || !patientInfo.age || !patientInfo.sex) {
      setError("Please fill in all patient information fields.")
      setIsSubmitting(false)
      return
    }

    const validEntries = entries.filter(
      (entry) => entry.relationship && entry.cancerType && entry.ageAtDiagnosis
    )

    if (validEntries.length === 0) {
      setError("Please add at least one complete family member entry.")
      setIsSubmitting(false)
      return
    }

    // Build request body matching backend schema
    const requestBody = {
      patient_info: {
        age: parseInt(patientInfo.age),
        sex: patientInfo.sex,
        ethnicity: null,
        personal_cancer_history: false,
      },
      family_members: validEntries.map((entry) => ({
        name: entry.name || entry.relationshipLabel,
        relationship: entry.relationship,
        cancer_type: entry.cancerType,
        age_at_diagnosis: parseInt(entry.ageAtDiagnosis),
        current_age: null,
        is_alive: true,
      })),
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/analyze-family-history?patient_name=${encodeURIComponent(patientInfo.name)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `Server error: ${response.status}`)
      }

      const data: RiskReport = await response.json()
      setReport(data)
    } catch (err) {
      console.error("[v0] API Error:", err)
      setError(
        err instanceof Error
          ? err.message
          : "Failed to analyze family history. Please try again."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setReport(null)
    setError(null)
    setPatientInfo({ name: "", age: "", sex: "" })
    setEntries([
      { id: generateEntryId(), name: "", relationship: "", relationshipLabel: "", cancerType: "", ageAtDiagnosis: "" },
    ])
  }

  // Show report if available
  if (report) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl text-foreground">
            Screening Recommendations for {report.patient_name}
          </CardTitle>
          <CardDescription>
            Generated on {new Date(report.generated_date).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Summary */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <h3 className="font-semibold text-foreground">Overall Risk Summary</h3>
            <p className="mt-2 text-sm text-muted-foreground">{report.overall_risk_summary}</p>
          </div>

          {/* Recommendations */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Screening Recommendations</h3>
            {report.recommendations.map((rec, index) => (
              <div
                key={index}
                className="rounded-lg border border-border bg-muted/30 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize text-foreground">
                    {rec.cancer_type.replace("_", " ")} Cancer
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      rec.risk_level === "high" || rec.risk_level === "very_high"
                        ? "bg-destructive/10 text-destructive"
                        : rec.risk_level === "moderate"
                          ? "bg-yellow-500/10 text-yellow-600"
                          : "bg-green-500/10 text-green-600"
                    }`}
                  >
                    {rec.risk_level.replace("_", " ").toUpperCase()} RISK
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Start screening at age:</span>{" "}
                    <span className="font-medium text-foreground">{rec.recommended_age_start}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Frequency:</span>{" "}
                    <span className="font-medium text-foreground">{rec.screening_frequency}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Method:</span>{" "}
                    <span className="font-medium text-foreground">{rec.screening_method}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Next Steps */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Recommended Next Steps</h3>
            <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
              {report.next_steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ul>
          </div>

          {/* Disclaimer */}
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <p className="text-xs text-muted-foreground">{report.disclaimer}</p>
          </div>

          <Button onClick={resetForm} variant="outline" className="w-full">
            Start New Assessment
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl text-foreground">Family Cancer History</CardTitle>
          <CardDescription>
            Please provide your information and details about family members who have been diagnosed with cancer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Patient Information */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="mb-3 text-sm font-medium text-foreground">Your Information</div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="patient-name">Your Name</Label>
                <Input
                  id="patient-name"
                  type="text"
                  placeholder="Enter your name"
                  value={patientInfo.name}
                  onChange={(e) => setPatientInfo({ ...patientInfo, name: e.target.value })}
                  className="bg-card"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patient-age">Your Age</Label>
                <Input
                  id="patient-age"
                  type="number"
                  min="0"
                  max="120"
                  placeholder="Enter your age"
                  value={patientInfo.age}
                  onChange={(e) => setPatientInfo({ ...patientInfo, age: e.target.value })}
                  className="bg-card"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patient-sex">Biological Sex</Label>
                <Select
                  value={patientInfo.sex}
                  onValueChange={(value) => setPatientInfo({ ...patientInfo, sex: value })}
                >
                  <SelectTrigger id="patient-sex" className="w-full bg-card">
                    <SelectValue placeholder="Select sex" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Family Members */}
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              className="relative rounded-lg border border-border bg-muted/30 p-4"
            >
              {entries.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEntry(entry.id)}
                  className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Remove family member"
                >
                  <Trash2 className="size-4" />
                </button>
              )}

              <div className="mb-3 text-sm font-medium text-muted-foreground">
                Family Member {index + 1}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor={`${formId}-relationship-${index}`}>Relationship</Label>
                  <Select
                    value={entry.relationshipLabel}
                    onValueChange={(value) => updateRelationship(entry.id, value)}
                  >
                    <SelectTrigger id={`${formId}-relationship-${index}`} className="w-full bg-card">
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      {RELATIONSHIPS.map((rel) => (
                        <SelectItem key={rel.label} value={rel.label}>
                          {rel.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${formId}-cancer-${index}`}>Cancer Type</Label>
                  <Select
                    value={entry.cancerType}
                    onValueChange={(value) => updateEntry(entry.id, "cancerType", value)}
                  >
                    <SelectTrigger id={`${formId}-cancer-${index}`} className="w-full bg-card">
                      <SelectValue placeholder="Select cancer type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CANCER_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${formId}-age-${index}`}>Age at Diagnosis</Label>
                  <Input
                    id={`${formId}-age-${index}`}
                    type="number"
                    min="0"
                    max="120"
                    placeholder="Enter age"
                    value={entry.ageAtDiagnosis}
                    onChange={(e) => updateEntry(entry.id, "ageAtDiagnosis", e.target.value)}
                    className="bg-card"
                  />
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addEntry}
            className="w-full border-dashed border-primary/40 text-primary hover:border-primary hover:bg-primary/5"
          >
            <Plus className="size-4" />
            Add Another Family Member
          </Button>

          <div className="pt-4">
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Submit Family History"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
