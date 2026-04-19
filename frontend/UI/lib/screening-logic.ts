"use client"

export type CancerType =
  | "breast"
  | "colorectal"
  | "cervical"
  | "lung"
  | "prostate"
  | "ovarian"
  | "pancreatic"
  | "melanoma"

// EXACT RELATIONSHIP TYPES as requested
export type Relationship =
  | "mother"
  | "father"
  | "brother"
  | "sister"
  | "grandmother"
  | "grandfather"
  | "aunt"
  | "uncle"
  | "cousin"
  | "other"

export interface FamilyMember {
  id: string
  relationship: Relationship
  cancerType: CancerType
  ageAtDiagnosis: number
}

export interface PatientInfo {
  name: string
  age: number
  sex: "male" | "female" | "other"
}

export interface ScreeningRecommendation {
  cancerType: CancerType
  riskLevel: "Low" | "Moderate" | "High"
  riskPercentage: number
  standardStartAge: number
  personalizedStartAge: number
  frequency: string
  method: string
  rationale: string
  contributingFamily: string[]
}

// USPSTF STANDARD GUIDELINES
export const STANDARD_GUIDELINES: Record<CancerType, { startAge: number; frequency: string; method: string }> = {
  breast: { startAge: 40, frequency: "Every 2 years", method: "Mammography" },
  colorectal: { startAge: 45, frequency: "Every 10 years", method: "Colonoscopy" },
  cervical: { startAge: 21, frequency: "Every 3 years", method: "Pap smear" },
  lung: { startAge: 50, frequency: "Annually", method: "Low-dose CT scan" },
  prostate: { startAge: 55, frequency: "Every 2 years", method: "PSA test" },
  ovarian: { startAge: 50, frequency: "Annually", method: "Consult physician" },
  pancreatic: { startAge: 50, frequency: "Annually", method: "Consult physician" },
  melanoma: { startAge: 35, frequency: "Annually", method: "Skin exam" },
}

// Map relationship to category for risk calculation
function getRelationshipCategory(relationship: Relationship): "first_degree" | "second_degree" | "third_degree" {
  switch (relationship) {
    case "mother":
    case "father":
    case "brother":
    case "sister":
      return "first_degree"
    case "grandmother":
    case "grandfather":
    case "aunt":
    case "uncle":
      return "second_degree"
    case "cousin":
      return "third_degree"
    default:
      return "third_degree"
  }
}

// Get display name for relationship
function getRelationshipDisplay(relationship: Relationship): string {
  const map: Record<Relationship, string> = {
    mother: "Mother",
    father: "Father",
    brother: "Brother",
    sister: "Sister",
    grandmother: "Grandmother",
    grandfather: "Grandfather",
    aunt: "Aunt",
    uncle: "Uncle",
    cousin: "Cousin",
    other: "Other relative",
  }
  return map[relationship]
}

// Calculate personalized screening age based on family members
function calculatePersonalizedStartAge(
  cancerType: CancerType,
  familyMembers: FamilyMember[]
): { age: number; contributingMembers: FamilyMember[] } {
  const standardAge = STANDARD_GUIDELINES[cancerType].startAge
  const relevantMembers = familyMembers.filter(m => m.cancerType === cancerType)
  
  if (relevantMembers.length === 0) {
    return { age: standardAge, contributingMembers: [] }
  }

  let earliestAge = standardAge

  for (const member of relevantMembers) {
    let adjustedAge = standardAge
    
    // First degree relatives (parent/sibling): 10 years before diagnosis, minimum 25
    if (member.relationship === "mother" || member.relationship === "father" || 
        member.relationship === "brother" || member.relationship === "sister") {
      adjustedAge = Math.max(member.ageAtDiagnosis - 10, 25)
    }
    // Second degree (grandparent, aunt, uncle): 5 years earlier than standard
    else if (member.relationship === "grandmother" || member.relationship === "grandfather" ||
             member.relationship === "aunt" || member.relationship === "uncle") {
      adjustedAge = Math.max(standardAge - 5, 25)
    }
    // Third degree (cousin): 3 years earlier than standard
    else if (member.relationship === "cousin") {
      adjustedAge = Math.max(standardAge - 3, 25)
    }
    
    if (adjustedAge < earliestAge) {
      earliestAge = adjustedAge
    }
  }

  return { age: earliestAge, contributingMembers: relevantMembers }
}

// Calculate risk level
function calculateRiskLevel(
  cancerType: CancerType,
  familyMembers: FamilyMember[],
  patientAge: number
): { level: "Low" | "Moderate" | "High"; percentage: number; contributingText: string[] } {
  const relevantMembers = familyMembers.filter(m => m.cancerType === cancerType)
  
  if (relevantMembers.length === 0) {
    return {
      level: "Low",
      percentage: 10,
      contributingText: [],
    }
  }

  let totalRiskScore = 0
  let hasFirstDegree = false
  const contributingText: string[] = []

  for (const member of relevantMembers) {
    const category = getRelationshipCategory(member.relationship)
    const displayName = getRelationshipDisplay(member.relationship)
    
    // Base score by relationship category
    if (category === "first_degree") {
      totalRiskScore += 45
      hasFirstDegree = true
      contributingText.push(`${displayName} diagnosed at ${member.ageAtDiagnosis}`)
    } else if (category === "second_degree") {
      totalRiskScore += 25
      contributingText.push(`${displayName} diagnosed at ${member.ageAtDiagnosis}`)
    } else {
      totalRiskScore += 15
      contributingText.push(`${displayName} diagnosed at ${member.ageAtDiagnosis}`)
    }
    
    // Early diagnosis bonus
    if (member.ageAtDiagnosis < 40) {
      totalRiskScore += 20
    } else if (member.ageAtDiagnosis < 50) {
      totalRiskScore += 10
    }
  }

  // Multiple family members bonus
  if (relevantMembers.length >= 2) {
    totalRiskScore += 15
  }
  if (relevantMembers.length >= 3) {
    totalRiskScore += 10
  }

  // Young patient with family history
  if (patientAge < 40 && hasFirstDegree) {
    totalRiskScore += 10
  }

  // Determine level and percentage
  let level: "Low" | "Moderate" | "High"
  let percentage: number

  if (totalRiskScore >= 80) {
    level = "High"
    percentage = Math.min(92, 70 + (totalRiskScore - 80) / 2)
  } else if (totalRiskScore >= 55) {
    level = "High"
    percentage = 55 + (totalRiskScore - 55) / 1.5
  } else if (totalRiskScore >= 35) {
    level = "Moderate"
    percentage = 38 + (totalRiskScore - 35) / 1.5
  } else if (totalRiskScore >= 20) {
    level = "Moderate"
    percentage = 25 + (totalRiskScore - 20) / 1.5
  } else {
    level = "Low"
    percentage = 10 + totalRiskScore / 3
  }

  percentage = Math.min(95, Math.max(8, Math.round(percentage)))

  return { level, percentage, contributingText }
}

// MAIN FUNCTION
export function generateRecommendations(
  patient: PatientInfo,
  familyMembers: FamilyMember[]
): ScreeningRecommendation[] {
  const recommendations: ScreeningRecommendation[] = []
  const allCancerTypes: CancerType[] = [
    "breast", "colorectal", "cervical", "lung", 
    "prostate", "ovarian", "pancreatic", "melanoma"
  ]

  for (const cancerType of allCancerTypes) {
    // Skip gender-inappropriate screenings
    if (cancerType === "breast" && patient.sex === "male") continue
    if (cancerType === "cervical" && patient.sex === "male") continue
    if (cancerType === "prostate" && patient.sex === "female") continue

    const { age: personalizedStartAge, contributingMembers } = calculatePersonalizedStartAge(cancerType, familyMembers)
    const standardAge = STANDARD_GUIDELINES[cancerType].startAge
    const { level, percentage, contributingText } = calculateRiskLevel(cancerType, familyMembers, patient.age)
    const guideline = STANDARD_GUIDELINES[cancerType]

    let rationale = ""

    if (contributingMembers.length === 0) {
      rationale = `No family history of ${cancerType} cancer. Follow standard USPSTF screening starting at age ${standardAge}.`
      if (patient.age < standardAge) {
        rationale += ` You are ${patient.age}, so screening begins in ${standardAge - patient.age} years.`
      }
    } else {
      const familyList = contributingText.join("; ")
      rationale = `${level} risk based on family history: ${familyList}. `
      
      if (personalizedStartAge < standardAge) {
        rationale += `Personalized screening recommended at age ${personalizedStartAge} instead of ${standardAge}. `
      } else {
        rationale += `Standard screening at age ${standardAge} is appropriate. `
      }
      
      if (patient.age >= personalizedStartAge) {
        rationale += `You are at or above screening age — discuss with your doctor.`
      } else if (personalizedStartAge < standardAge) {
        rationale += `Begin screening in ${personalizedStartAge - patient.age} years at age ${personalizedStartAge}.`
      }
    }

    recommendations.push({
      cancerType,
      riskLevel: level,
      riskPercentage: percentage,
      standardStartAge: standardAge,
      personalizedStartAge,
      frequency: guideline.frequency,
      method: guideline.method,
      rationale,
      contributingFamily: contributingMembers.map(m => `${getRelationshipDisplay(m.relationship)} (diagnosed at ${m.ageAtDiagnosis})`)
    })
  }

  // Sort by risk level (High first)
  const riskOrder = { High: 0, Moderate: 1, Low: 2 }
  recommendations.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel])

  return recommendations
}

export function getRiskColor(riskLevel: "Low" | "Moderate" | "High"): string {
  switch (riskLevel) {
    case "High": return "#DC2626"
    case "Moderate": return "#CA8A04"
    case "Low": return "#16A34A"
  }
}
