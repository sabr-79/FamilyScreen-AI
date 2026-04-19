"use client"

import { useState } from "react"
import { VoiceGuidedInput } from "@/components/voice-guided-input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * Example: Voice-Guided Family History Form
 * 
 * This demonstrates how to use VoiceGuidedInput for a conversational form experience:
 * 1. AI reads each question out loud
 * 2. User can respond via voice OR typing
 * 3. Form auto-advances to next question
 */

const RELATIONSHIPS = [
  { label: "Mother", value: "mother" },
  { label: "Father", value: "father" },
  { label: "Sister", value: "sister" },
  { label: "Brother", value: "brother" },
  { label: "Grandmother", value: "grandmother" },
  { label: "Grandfather", value: "grandfather" },
  { label: "Aunt", value: "aunt" },
  { label: "Uncle", value: "uncle" },
  { label: "Cousin", value: "cousin" },
]

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
]

export function VoiceGuidedFormExample() {
  const [patientName, setPatientName] = useState("")
  const [patientAge, setPatientAge] = useState("")
  const [patientSex, setPatientSex] = useState("")
  const [relativeName, setRelativeName] = useState("")
  const [relationship, setRelationship] = useState("")
  const [cancerType, setCancerType] = useState("")
  const [ageAtDiagnosis, setAgeAtDiagnosis] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted:", {
      patientName,
      patientAge,
      patientSex,
      relativeName,
      relationship,
      cancerType,
      ageAtDiagnosis,
    })
    alert("Form submitted! Check console for data.")
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Voice-Guided Family History</CardTitle>
        <CardDescription>
          The AI will read each question out loud. You can respond by voice or typing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">About You</h3>

            <VoiceGuidedInput
              label="Your Name"
              prompt="What is your full name?"
              value={patientName}
              onChange={setPatientName}
              placeholder="John Doe"
              autoSpeak={true} // Auto-speak first question
            />

            <VoiceGuidedInput
              label="Your Age"
              prompt="How old are you?"
              value={patientAge}
              onChange={setPatientAge}
              type="number"
              placeholder="35"
            />

            <VoiceGuidedInput
              label="Your Sex"
              prompt="What is your biological sex? Male or female?"
              value={patientSex}
              onChange={setPatientSex}
              type="select"
              options={[
                { label: "Male", value: "male" },
                { label: "Female", value: "female" },
              ]}
            />
          </div>

          {/* Family Member Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Family Member with Cancer</h3>

            <VoiceGuidedInput
              label="Relative's Name"
              prompt="What is the name of your family member who had cancer?"
              value={relativeName}
              onChange={setRelativeName}
              placeholder="Jane Doe"
            />

            <VoiceGuidedInput
              label="Relationship"
              prompt="What is their relationship to you? For example, mother, father, sister, brother, grandmother, or grandfather."
              value={relationship}
              onChange={setRelationship}
              type="select"
              options={RELATIONSHIPS}
            />

            <VoiceGuidedInput
              label="Cancer Type"
              prompt="What type of cancer did they have? For example, breast, colon, lung, or prostate cancer."
              value={cancerType}
              onChange={setCancerType}
              type="select"
              options={CANCER_TYPES}
            />

            <VoiceGuidedInput
              label="Age at Diagnosis"
              prompt="How old were they when they were diagnosed with cancer?"
              value={ageAtDiagnosis}
              onChange={setAgeAtDiagnosis}
              type="number"
              placeholder="45"
            />
          </div>

          <Button type="submit" className="w-full">
            Submit Family History
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
