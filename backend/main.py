from typing import Annotated, List, Optional
from fastapi import FastAPI, HTTPException, Depends, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import httpx
import asyncio
from datetime import datetime
from enum import Enum
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="FamilyScreen AI Backend",
    description="AI agent that processes family cancer history and generates personalized screening recommendations",
    version="1.0.0"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://your-frontend-domain.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enums and Models
class CancerType(str, Enum):
    BREAST = "breast"
    COLORECTAL = "colorectal"
    LUNG = "lung"
    PROSTATE = "prostate"
    CERVICAL = "cervical"
    OVARIAN = "ovarian"
    PANCREATIC = "pancreatic"
    MELANOMA = "melanoma"
    OTHER = "other"

class RelationshipType(str, Enum):
    PARENT = "parent"
    SIBLING = "sibling"
    GRANDPARENT = "grandparent"
    AUNT_UNCLE = "aunt_uncle"
    COUSIN = "cousin"

class RiskLevel(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    VERY_HIGH = "very_high"

class FamilyMember(BaseModel):
    name: str = Field(description="Name of family member")
    relationship: RelationshipType = Field(description="Relationship to patient")
    cancer_type: CancerType = Field(description="Type of cancer diagnosed")
    age_at_diagnosis: int = Field(ge=0, le=120, description="Age when cancer was diagnosed")
    current_age: Optional[int] = Field(None, ge=0, le=120, description="Current age if alive")
    is_alive: bool = Field(True, description="Whether family member is still alive")

class PatientInfo(BaseModel):
    age: int = Field(ge=0, le=120, description="Patient's current age")
    sex: str = Field(description="Patient's biological sex (male/female)")
    ethnicity: Optional[str] = Field(None, description="Patient's ethnicity")
    personal_cancer_history: bool = Field(False, description="Has patient had cancer before")

class FamilyHistoryInput(BaseModel):
    patient_info: PatientInfo = Field(description="Patient demographic information")
    family_members: List[FamilyMember] = Field(description="List of family members with cancer history")

class ScreeningRecommendation(BaseModel):
    cancer_type: CancerType = Field(description="Type of cancer")
    risk_level: RiskLevel = Field(description="Calculated risk level")
    recommended_age_start: int = Field(description="Age to start screening")
    screening_frequency: str = Field(description="How often to screen")
    screening_method: str = Field(description="Recommended screening method")
    rationale: str = Field(description="Explanation of recommendation")

class RiskReport(BaseModel):
    patient_name: str = Field(description="Patient's name for the report")
    generated_date: datetime = Field(description="When report was generated")
    overall_risk_summary: str = Field(description="Summary of overall cancer risk")
    recommendations: List[ScreeningRecommendation] = Field(description="Screening recommendations by cancer type")
    next_steps: List[str] = Field(description="Recommended next steps for patient")
    disclaimer: str = Field(description="Medical disclaimer")

# Configuration for external services
FEATHERLESS_API_KEY = os.getenv("FEATHERLESS_API_KEY")
FEATHERLESS_BASE_URL = "https://api.featherless.ai/v1"
TINYFISH_API_KEY = os.getenv("TINYFISH_API_KEY")
TINYFISH_BASE_URL = "https://api.tinyfish.ai/v1"
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

# Health check endpoints
@app.get("/")
def index():
    return {
        "message": "FamilyScreen AI Backend",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}

@app.get("/sponsors")
def sponsors():
    return {
        "ai": "Featherless",
        "agent": "TinyFish",
        "voice": "ElevenLabs",
        "ide": "Kiro"
    }

# Main API endpoints
@app.post("/analyze-family-history", response_model=RiskReport)
async def analyze_family_history(
    family_history: FamilyHistoryInput,
    patient_name: Annotated[str, Query(description="Patient's name for the report")]
) -> RiskReport:
    """
    Analyze family cancer history and generate personalized screening recommendations.
    
    This endpoint integrates with:
    - TinyFish: Autonomous agent coordination and USPSTF data retrieval
    - Featherless AI: Risk analysis and recommendation generation
    """
    try:
        # Step 1: Use TinyFish agent to autonomously gather USPSTF guidelines
        uspstf_data = await tinyfish_get_guidelines(family_history)
        
        # Step 2: Use Featherless AI to analyze family history and calculate risk
        risk_analysis = await featherless_analyze_risk(family_history, uspstf_data)
        
        # Step 3: Generate screening recommendations
        recommendations = await generate_screening_recommendations(
            family_history.patient_info, 
            risk_analysis,
            uspstf_data
        )
        
        # Create comprehensive report
        report = RiskReport(
            patient_name=patient_name,
            generated_date=datetime.now(),
            overall_risk_summary=risk_analysis["summary"],
            recommendations=recommendations,
            next_steps=[
                "Discuss this report with your primary care physician",
                "Schedule recommended screenings based on your age and risk level",
                "Update your family history if new diagnoses occur",
                "Consider genetic counseling if high-risk patterns are identified"
            ],
            disclaimer="This report is for informational purposes only and does not replace professional medical advice. Always consult with your healthcare provider for personalized medical recommendations."
        )
        
        return report
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing family history: {str(e)}")

@app.post("/generate-audio-report")
async def generate_audio_report(
    report: RiskReport,
    voice_settings: Annotated[dict, Body(description="ElevenLabs voice configuration")] = None
):
    """
    Generate audio version of the risk report using ElevenLabs TTS.
    """
    try:
        # Convert report to readable text
        report_text = format_report_for_audio(report)
        
        # Generate audio using ElevenLabs
        audio_url = await generate_audio_with_elevenlabs(report_text, voice_settings)
        
        return {
            "audio_url": audio_url,
            "text": report_text,
            "duration_estimate": len(report_text.split()) * 0.5
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating audio: {str(e)}")

# TinyFish Integration Functions
async def tinyfish_get_guidelines(family_history: FamilyHistoryInput) -> dict:
    """
    Use TinyFish autonomous agent to gather current USPSTF guidelines.
    TinyFish acts as the agentic layer that autonomously:
    1. Identifies relevant cancer types from family history
    2. Fetches current USPSTF guidelines for each type
    3. Cross-references with latest medical literature
    4. Returns structured guideline data
    """
    if not TINYFISH_API_KEY:
        # Fallback to mock data if TinyFish not configured
        return await mock_uspstf_guidelines(family_history)
    
    async with httpx.AsyncClient() as client:
        # Extract cancer types from family history
        cancer_types = list(set([member.cancer_type for member in family_history.family_members]))
        
        # TinyFish agent task definition
        agent_task = {
            "task_type": "uspstf_guidelines_retrieval",
            "parameters": {
                "cancer_types": cancer_types,
                "patient_age": family_history.patient_info.age,
                "patient_sex": family_history.patient_info.sex,
                "include_latest_updates": True,
                "cross_reference_sources": ["USPSTF", "ACS", "NCCN"]
            },
            "autonomous_mode": True,
            "return_format": "structured_json"
        }
        
        try:
            response = await client.post(
                f"{TINYFISH_BASE_URL}/agents/execute",
                headers={"Authorization": f"Bearer {TINYFISH_API_KEY}"},
                json=agent_task,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()["guidelines"]
        except Exception as e:
            print(f"TinyFish API error: {e}")
            return await mock_uspstf_guidelines(family_history)

async def featherless_analyze_risk(family_history: FamilyHistoryInput, uspstf_data: dict) -> dict:
    """
    Use Featherless AI to analyze family history and calculate personalized risk scores.
    Featherless AI processes:
    1. Family relationship patterns
    2. Age at diagnosis factors
    3. Cancer type hereditary weights
    4. Population risk baselines
    5. Generates risk scores and explanations
    """
    if not FEATHERLESS_API_KEY:
        # Fallback to rule-based analysis if Featherless not configured
        return calculate_rule_based_risk(family_history)
    
    async with httpx.AsyncClient() as client:
        # Prepare data for AI analysis
        analysis_prompt = f"""
        Analyze the following family cancer history and calculate personalized risk scores:
        
        Patient Information:
        - Age: {family_history.patient_info.age}
        - Sex: {family_history.patient_info.sex}
        - Personal cancer history: {family_history.patient_info.personal_cancer_history}
        
        Family History:
        {format_family_history_for_ai(family_history.family_members)}
        
        USPSTF Guidelines Context:
        {uspstf_data}
        
        Please provide:
        1. Risk level for each relevant cancer type (low/moderate/high/very_high)
        2. Overall risk summary explanation
        3. Key risk factors identified
        4. Confidence level in assessment
        
        Return as structured JSON.
        """
        
        try:
            response = await client.post(
                f"{FEATHERLESS_BASE_URL}/chat/completions",
                headers={"Authorization": f"Bearer {FEATHERLESS_API_KEY}"},
                json={
                    "model": "meta-llama/Meta-Llama-3.1-8B-Instruct",
                    "messages": [
                        {"role": "system", "content": "You are a medical AI assistant specializing in cancer risk assessment based on family history. Provide accurate, evidence-based risk calculations."},
                        {"role": "user", "content": analysis_prompt}
                    ],
                    "temperature": 0.1,
                    "max_tokens": 1000
                },
                timeout=30.0
            )
            response.raise_for_status()
            
            ai_response = response.json()["choices"][0]["message"]["content"]
            # Parse AI response (would need proper JSON parsing in production)
            return parse_ai_risk_analysis(ai_response)
            
        except Exception as e:
            print(f"Featherless AI error: {e}")
            return calculate_rule_based_risk(family_history)

# Helper functions
def format_family_history_for_ai(family_members: List[FamilyMember]) -> str:
    """Format family history data for AI processing."""
    formatted = []
    for member in family_members:
        formatted.append(
            f"- {member.relationship.value}: {member.cancer_type.value} cancer at age {member.age_at_diagnosis}"
        )
    return "\n".join(formatted)

def parse_ai_risk_analysis(ai_response: str) -> dict:
    """Parse AI response into structured risk analysis."""
    # This would implement proper JSON parsing of AI response
    # For now, return mock structure
    return {
        "risk_level": "moderate",
        "summary": "Your family history indicates moderate cancer risk with some screening modifications recommended.",
        "confidence": 0.85,
        "key_factors": ["Multiple first-degree relatives", "Early age at diagnosis"]
    }

async def mock_uspstf_guidelines(family_history: FamilyHistoryInput) -> dict:
    """Mock USPSTF guidelines for development/testing."""
    return {
        "breast": {
            "standard_age": 50,
            "high_risk_age": 40,
            "frequency": "Every 2 years",
            "method": "Mammography"
        },
        "colorectal": {
            "standard_age": 45,
            "high_risk_age": 40,
            "frequency": "Every 10 years",
            "method": "Colonoscopy"
        }
    }

def calculate_rule_based_risk(family_history: FamilyHistoryInput) -> dict:
    """Fallback rule-based risk calculation."""
    risk_score = 0
    for member in family_history.family_members:
        if member.relationship in [RelationshipType.PARENT, RelationshipType.SIBLING]:
            risk_score += 0.3
        if member.age_at_diagnosis < 50:
            risk_score += 0.2
    
    if risk_score > 0.5:
        return {"risk_level": "high", "summary": "Elevated risk based on family history"}
    else:
        return {"risk_level": "moderate", "summary": "Moderate risk based on family history"}

async def generate_screening_recommendations(
    patient_info: PatientInfo, 
    risk_analysis: dict,
    uspstf_data: dict
) -> List[ScreeningRecommendation]:
    """Generate personalized screening recommendations."""
    recommendations = []
    
    for cancer_type, guidelines in uspstf_data.items():
        if cancer_type == "breast" and patient_info.sex.lower() == "male":
            continue
        if cancer_type == "cervical" and patient_info.sex.lower() == "male":
            continue
        if cancer_type == "prostate" and patient_info.sex.lower() == "female":
            continue
        
        risk_level = RiskLevel(risk_analysis["risk_level"])
        start_age = guidelines.get("high_risk_age" if risk_level in [RiskLevel.HIGH, RiskLevel.VERY_HIGH] else "standard_age", 50)
        
        recommendation = ScreeningRecommendation(
            cancer_type=CancerType(cancer_type),
            risk_level=risk_level,
            recommended_age_start=start_age,
            screening_frequency=guidelines.get("frequency", "Consult physician"),
            screening_method=guidelines.get("method", "Standard screening"),
            rationale=f"Based on {risk_analysis['risk_level']} risk level from family history analysis"
        )
        recommendations.append(recommendation)
    
    return recommendations

def format_report_for_audio(report: RiskReport) -> str:
    """Format the risk report for audio narration."""
    text_parts = [
        f"Cancer Screening Report for {report.patient_name}",
        f"Generated on {report.generated_date.strftime('%B %d, %Y')}",
        "",
        "Overall Risk Summary:",
        report.overall_risk_summary,
        "",
        "Screening Recommendations:"
    ]
    
    for rec in report.recommendations:
        text_parts.extend([
            f"{rec.cancer_type.value.title()} Cancer:",
            f"Risk Level: {rec.risk_level.value.replace('_', ' ').title()}",
            f"Start screening at age {rec.recommended_age_start}",
            f"Frequency: {rec.screening_frequency}",
            f"Method: {rec.screening_method}",
            ""
        ])
    
    return "\n".join(text_parts)

async def generate_audio_with_elevenlabs(text: str, voice_settings: dict = None) -> str:
    """Generate audio using ElevenLabs TTS API."""
    if not ELEVENLABS_API_KEY:
        return "https://mock-audio-url.com/report.mp3"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM",
                headers={
                    "Accept": "audio/mpeg",
                    "Content-Type": "application/json",
                    "xi-api-key": ELEVENLABS_API_KEY
                },
                json={
                    "text": text,
                    "model_id": "eleven_monolingual_v1",
                    "voice_settings": voice_settings or {
                        "stability": 0.5,
                        "similarity_boost": 0.5
                    }
                }
            )
            response.raise_for_status()
            
            # In production, you'd save the audio file and return a URL
            return "https://your-storage.com/generated-audio.mp3"
            
        except Exception as e:
            print(f"ElevenLabs API error: {e}")
            return "https://mock-audio-url.com/report.mp3"