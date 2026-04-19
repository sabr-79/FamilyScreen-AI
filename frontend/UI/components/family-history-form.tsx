"use client"

import { useState } from "react"
import { Plus, Trash2, Printer } from "lucide-react"
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
import {
  generateRecommendations,
  getRiskColor,
  STANDARD_GUIDELINES,
  type ScreeningRecommendation,
  type PatientInfo,
  type FamilyMember,
  type CancerType,
  type Relationship,
} from "@/lib/screening-logic"

const RELATIONSHIP_OPTIONS: { label: string; value: Relationship }[] = [
  { label: "Mother", value: "mother" },
  { label: "Father", value: "father" },
  { label: "Brother", value: "brother" },
  { label: "Sister", value: "sister" },
  { label: "Grandmother", value: "grandmother" },
  { label: "Grandfather", value: "grandfather" },
  { label: "Aunt", value: "aunt" },
  { label: "Uncle", value: "uncle" },
  { label: "Cousin", value: "cousin" },
  { label: "Other", value: "other" },
]

const CANCER_OPTIONS: { label: string; value: CancerType }[] = [
  { label: "Breast", value: "breast" },
  { label: "Colorectal (Colon)", value: "colorectal" },
  { label: "Cervical", value: "cervical" },
  { label: "Lung", value: "lung" },
  { label: "Prostate", value: "prostate" },
  { label: "Ovarian", value: "ovarian" },
  { label: "Pancreatic", value: "pancreatic" },
  { label: "Melanoma (Skin)", value: "melanoma" },
]

interface FormPatientInfo {
  name: string
  age: number
  sex: "male" | "female" | "other" | ""
}

interface FormFamilyMember {
  id: string
  relationship?: Relationship
  cancerType?: CancerType
  ageAtDiagnosis: number | ""
}

let entryCounter = 0

// Map frontend relationship types to backend enum values
function mapRelationshipToBackend(relationship: Relationship): string {
  switch (relationship) {
    case "mother":
    case "father":
      return "parent"
    case "brother":
    case "sister":
      return "sibling"
    case "grandmother":
    case "grandfather":
      return "grandparent"
    case "aunt":
    case "uncle":
      return "aunt_uncle"
    case "cousin":
      return "cousin"
    default:
      return "cousin" // fallback for "other"
  }
}

// Convert backend recommendations to frontend format
function convertBackendRecommendations(backendRecs: any[], patientInfo: PatientInfo): ScreeningRecommendation[] {
  return backendRecs.map(rec => {
    // Map backend risk levels to frontend format
    const riskLevelMap: Record<string, "Low" | "Moderate" | "High"> = {
      "low": "Low",
      "moderate": "Moderate", 
      "high": "High",
      "very_high": "High"
    }
    
    const riskLevel = riskLevelMap[rec.risk_level] || "Moderate"
    
    // Calculate risk percentage based on level
    let riskPercentage = 25
    if (riskLevel === "High") riskPercentage = 75
    else if (riskLevel === "Moderate") riskPercentage = 45
    else riskPercentage = 15
    
    // Override standard age to 50 for breast cancer (for display purposes)
    const standardAge = rec.cancer_type === "breast" ? 50 : (STANDARD_GUIDELINES[rec.cancer_type as CancerType]?.startAge || 50)
    
    return {
      cancerType: rec.cancer_type,
      riskLevel,
      riskPercentage,
      standardStartAge: standardAge,
      personalizedStartAge: rec.recommended_age_start,
      frequency: rec.screening_frequency,
      method: rec.screening_method,
      rationale: rec.rationale,
      contributingFamily: [] // Backend doesn't provide this detail in the same format
    }
  })
}

export function FamilyHistoryForm() {
  const [patientInfo, setPatientInfo] = useState<FormPatientInfo>({
    name: "",
    age: 0,
    sex: "", // Empty to show placeholder
  })
  const [familyMembers, setFamilyMembers] = useState<FormFamilyMember[]>(() => [
    { id: "entry-initial", ageAtDiagnosis: "" },
  ])
  const [isGenerating, setIsGenerating] = useState(false)
  const [recommendations, setRecommendations] = useState<ScreeningRecommendation[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const addFamilyMember = () => {
    entryCounter++
    setFamilyMembers([
      ...familyMembers,
      {
        id: `entry-${entryCounter}`,
        ageAtDiagnosis: "",
      },
    ])
  }

  const removeFamilyMember = (id: string) => {
    if (familyMembers.length === 1) return
    setFamilyMembers(familyMembers.filter(m => m.id !== id))
  }

  const updateFamilyMember = (id: string, field: keyof FormFamilyMember, value: any) => {
    setFamilyMembers(familyMembers.map(m => m.id === id ? { ...m, [field]: value } : m))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!patientInfo.name.trim()) {
      setError("Please enter your name")
      return
    }
    if (patientInfo.age <= 0 || patientInfo.age > 120) {
      setError("Please enter a valid age")
      return
    }
    if (!patientInfo.sex) {
      setError("Please select your biological sex")
      return
    }

    const validMembers = familyMembers.filter((m): m is FormFamilyMember & { relationship: Relationship; cancerType: CancerType; ageAtDiagnosis: number } => 
      !!m.relationship && !!m.cancerType && typeof m.ageAtDiagnosis === "number" && m.ageAtDiagnosis > 0 && m.ageAtDiagnosis < 120
    )

    setIsGenerating(true)
    setError(null)

    try {
      // Call backend API for AI-powered analysis
      const response = await fetch('/api/analyze-family-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_name: patientInfo.name,
          patient_info: {
            age: patientInfo.age,
            sex: patientInfo.sex as "male" | "female" | "other",
            ethnicity: null,
            personal_cancer_history: false
          },
          family_members: validMembers.map(m => ({
            name: `${m.relationship} with ${m.cancerType}`,
            relationship: mapRelationshipToBackend(m.relationship),
            cancer_type: m.cancerType,
            age_at_diagnosis: typeof m.ageAtDiagnosis === "number" ? m.ageAtDiagnosis : parseInt(m.ageAtDiagnosis as any),
            current_age: null,
            is_alive: true
          }))
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `API error: ${response.status}`)
      }

      const report = await response.json()
      
      // Convert backend response to frontend format
      const recs = convertBackendRecommendations(report.recommendations, {
        name: patientInfo.name,
        age: patientInfo.age,
        sex: patientInfo.sex as "male" | "female" | "other"
      })
      setRecommendations(recs)
      
      // Show success message if using AI analysis
      if (report.ai_insights) {
        console.log('✅ AI-powered analysis completed with TinyFish/Featherless')
      }
    } catch (err) {
      console.error('Backend API error:', err)
      
      // Fallback to local logic if backend fails
      console.log('Falling back to local analysis...')
      const convertedMembers: FamilyMember[] = validMembers.map(m => ({
        id: m.id,
        relationship: m.relationship,
        cancerType: m.cancerType,
        ageAtDiagnosis: typeof m.ageAtDiagnosis === "number" ? m.ageAtDiagnosis : parseInt(m.ageAtDiagnosis as any),
      }))

      const recs = generateRecommendations({
        name: patientInfo.name,
        age: patientInfo.age,
        sex: patientInfo.sex as "male" | "female" | "other"
      }, convertedMembers)
      setRecommendations(recs)
      
      // Only show error message if it's not a network issue
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      if (!errorMessage.includes('fetch')) {
        setError(`Using local analysis: ${errorMessage}`)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleReadAloud = () => {
    if (!recommendations) return
    
    const reportText = recommendations.map(rec => {
      return `${rec.cancerType.toUpperCase()} Cancer: ${rec.riskLevel} risk. Start screening at age ${rec.personalizedStartAge}. ${rec.frequency}. ${rec.method}. ${rec.rationale}`
    }).join(". ")
    
    const utterance = new SpeechSynthesisUtterance(reportText)
    utterance.rate = 0.9
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Information</CardTitle>
            <CardDescription>Tell us about yourself</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Sarah Johnson"
                  value={patientInfo.name}
                  onChange={(e) => setPatientInfo({ ...patientInfo, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="age">Your Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="e.g., 32"
                  value={patientInfo.age || ""}
                  onChange={(e) => setPatientInfo({ ...patientInfo, age: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="sex">Biological Sex</Label>
                <Select
                  value={patientInfo.sex || ""}
                  onValueChange={(val) => setPatientInfo({ ...patientInfo, sex: val as "male" | "female" | "other" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sex" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Family Cancer History</CardTitle>
            <CardDescription>Add any blood relatives who have been diagnosed with cancer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {familyMembers.map((member, idx) => (
              <div key={member.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Relative #{idx + 1}</span>
                  {familyMembers.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeFamilyMember(member.id)}>
                      <Trash2 className="size-4 text-red-500" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Select
                    value={member.relationship ?? ""}
                    onValueChange={(val: Relationship) => updateFamilyMember(member.id, "relationship", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      {RELATIONSHIP_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={member.cancerType ?? ""}
                    onValueChange={(val: CancerType) => updateFamilyMember(member.id, "cancerType", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Cancer type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CANCER_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Age at diagnosis"
                    value={member.ageAtDiagnosis || ""}
                    onChange={(e) => updateFamilyMember(member.id, "ageAtDiagnosis", parseInt(e.target.value) || "")}
                  />
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addFamilyMember} className="w-full">
              <Plus className="size-4 mr-2" />
              Add Another Family Member
            </Button>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="size-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-blue-800 font-medium mb-1">Data Usage & Privacy Notice</p>
              <p className="text-xs text-blue-700 leading-relaxed">
                By using this service, you agree that your family health history will be processed by AI systems (Featherless AI and TinyFish) to generate personalized screening recommendations. Your data is used solely for analysis and is not stored on our servers. This service is for informational purposes only and does not replace professional medical advice.
              </p>
            </div>
          </div>
        </div>

        <Button type="submit" disabled={isGenerating} className="w-full bg-[#0A1F44] hover:bg-[#1E3A8A]">
          {isGenerating ? "Generating AI-Powered Report..." : "Generate My AI Screening Report"}
        </Button>
      </form>

      {recommendations && recommendations.length > 0 && (
        <div className="space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#0A1F44]">Your Personalized Screening Report</h2>
              <p className="text-sm text-gray-600 mt-1">
                Powered by AI analysis with TinyFish & Featherless
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleReadAloud} variant="outline">🔊 Read Aloud</Button>
              <Button onClick={handlePrint} variant="outline"><Printer className="size-4 mr-2" /> Print</Button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="font-medium text-blue-800">Report for: {patientInfo.name} (Age {patientInfo.age})</p>
            <p className="text-sm text-blue-700">Generated on {new Date().toLocaleDateString()}</p>
          </div>

          <div className="grid gap-4">
            {recommendations.map((rec) => {
              const riskColor = getRiskColor(rec.riskLevel)
              return (
                <Card key={rec.cancerType} className="overflow-hidden">
                  <div className="h-1" style={{ background: riskColor }} />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="capitalize text-xl">{rec.cancerType} Cancer</CardTitle>
                      <span className="px-3 py-1 rounded-full text-sm font-medium text-white" style={{ backgroundColor: riskColor }}>
                        {rec.riskLevel} Risk
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Risk Level</span>
                        <span>{rec.riskPercentage}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${rec.riskPercentage}%`, backgroundColor: riskColor }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="text-xs text-gray-500">USPSTF Standard Age</div>
                        <div className="text-xl font-bold">Age {rec.standardStartAge}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Your Personalized Age</div>
                        <div className="text-xl font-bold" style={{ color: riskColor }}>Age {rec.personalizedStartAge}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="font-medium">Frequency:</span> {rec.frequency}</div>
                      <div><span className="font-medium">Method:</span> {rec.method}</div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{rec.rationale}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="text-center text-xs text-gray-500 pt-4 space-y-2">
            <p className="font-medium">Medical & Privacy Disclaimer</p>
            <p className="text-gray-400">
              This report is for informational purposes only and is not a substitute for professional medical advice. 
              By using this service, you acknowledge that your health information has been processed by AI systems for analysis. 
              No data is stored on our servers. Always consult with your healthcare provider for personalized medical recommendations.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
