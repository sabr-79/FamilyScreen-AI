from typing import Annotated, List, Optional
from fastapi import FastAPI, HTTPException, Depends, Query, Body, Request, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import httpx
import asyncio
from datetime import datetime
from enum import Enum
import os
from dotenv import load_dotenv
from stripe_integration import StripeService
from elevenlabs_integration import transcribe_audio, text_to_speech

load_dotenv()

app = FastAPI(
    title="FamilyScreen AI Backend",
    description="AI agent that processes family cancer history and generates personalized screening recommendations",
    version="1.0.0"
)

# Get allowed origins from environment
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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
    # AI-powered insights from Featherless
    ai_insights: Optional[dict] = Field(None, description="Personalized AI insights and analysis")
    genetic_counseling_recommended: Optional[bool] = Field(None, description="Whether genetic counseling is recommended")
    key_risk_factors: Optional[List[str]] = Field(None, description="Key risk factors identified by AI")
    current_lifestyle_recommendations: Optional[List[str]] = Field(None, description="Current lifestyle recommendations")

# Configuration for external services
FEATHERLESS_API_KEY = os.getenv("FEATHERLESS_API_KEY")
FEATHERLESS_BASE_URL = "https://api.featherless.ai/v1"
TINYFISH_API_KEY = os.getenv("TINYFISH_API_KEY")
TINYFISH_BASE_URL = "https://api.fetch.tinyfish.ai"
#ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

# Security: Don't log API keys, just confirm they're loaded
if FEATHERLESS_API_KEY:
    print("✅ Featherless AI configured")
if TINYFISH_API_KEY:
    print("✅ TinyFish configured")
#if ELEVENLABS_API_KEY:
    #print("✅ ElevenLabs configured")

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
        "ide": "Kiro",
        "payments": "Stripe"
    }

# Stripe Subscription Endpoints
@app.post("/create-checkout-session")
async def create_checkout_session(
    user_email: Annotated[str, Body()],
    user_id: Annotated[str, Body()],
    success_url: Annotated[str, Body()] = "https://your-app.com/success",
    cancel_url: Annotated[str, Body()] = "https://your-app.com/cancel"
):
    """Create a Stripe checkout session for premium subscription"""
    try:
        # Debug: check keys are loaded
        stripe_key = os.getenv("STRIPE_SECRET_KEY", "")
        price_id = os.getenv("STRIPE_PRICE_ID", "")
        print(f"🔑 Stripe key loaded: {'yes' if stripe_key else 'NO - MISSING'}")
        print(f"💰 Price ID loaded: {price_id if price_id else 'NO - MISSING'}")

        if not stripe_key:
            raise HTTPException(status_code=500, detail="STRIPE_SECRET_KEY not configured")
        if not price_id:
            raise HTTPException(status_code=500, detail="STRIPE_PRICE_ID not configured")

        session = await StripeService.create_checkout_session(
            user_email=user_email,
            user_id=user_id,
            success_url=success_url,
            cancel_url=cancel_url
        )
        return session
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Stripe checkout error: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/create-portal-session")
async def create_portal_session(
    customer_id: Annotated[str, Body()],
    return_url: Annotated[str, Body()] = "https://your-app.com/account"
):
    """Create a Stripe customer portal session"""
    try:
        session = await StripeService.create_customer_portal_session(
            customer_id=customer_id,
            return_url=return_url
        )
        return session
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/subscription-status/{customer_id}")
async def get_subscription_status(customer_id: str):
    """Get subscription status for a customer"""
    try:
        status = await StripeService.get_subscription_status(customer_id)
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    try:
        event = StripeService.verify_webhook_signature(payload, sig_header)
        
        # Handle different event types
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            # Update user to premium in database
            print(f"✅ Subscription created for user: {session.get('client_reference_id')}")
            
        elif event['type'] == 'customer.subscription.deleted':
            subscription = event['data']['object']
            # Downgrade user from premium
            print(f"❌ Subscription canceled for customer: {subscription.get('customer')}")
            
        elif event['type'] == 'customer.subscription.updated':
            subscription = event['data']['object']
            # Update subscription status
            print(f"🔄 Subscription updated for customer: {subscription.get('customer')}")
        
        return {"status": "success"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Speech-to-Text Endpoint (ElevenLabs Scribe v2)
@app.post("/transcribe-audio")
async def transcribe_audio_endpoint(
    audio: UploadFile = File(..., description="Audio file to transcribe (webm, mp3, wav, etc.)")
):
    """
    Transcribe audio to text using ElevenLabs Scribe v2 Speech-to-Text API.
    Useful for voice input in family history forms and health assistant.
    
    Scribe v2 supports 90+ languages with high accuracy.
    """
    try:
        print(f"🎤 Received audio file: {audio.filename}, content_type: {audio.content_type}")
        
        # Read audio file
        audio_bytes = await audio.read()
        print(f"📊 Audio size: {len(audio_bytes)} bytes")
        
        if not audio_bytes:
            raise HTTPException(status_code=400, detail="Empty audio file")
        
        # Transcribe using ElevenLabs Scribe v2
        print("🔄 Calling ElevenLabs STT API...")
        result = await transcribe_audio(audio_bytes, audio.filename or "audio.webm")
        print(f"✅ STT result: {result}")
        
        if result.get("error"):
            print(f"❌ STT error: {result['error']}")
            raise HTTPException(status_code=500, detail=result["error"])
        
        return {
            "text": result["text"],
            "success": True,
            "filename": audio.filename
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Transcription exception: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

# Text-to-Speech Endpoint (ElevenLabs)
@app.post("/text-to-speech")
async def text_to_speech_endpoint(
    text: Annotated[str, Body(description="Text to convert to speech")],
    voice_id: Annotated[str, Body(description="ElevenLabs voice ID")] = "21m00Tcm4TlvDq8ikWAM"
):
    """
    Convert text to speech using ElevenLabs TTS.
    Returns audio bytes that can be played in the browser.
    """
    try:
        audio_bytes = await text_to_speech(text, voice_id)
        
        if not audio_bytes:
            raise HTTPException(status_code=500, detail="Failed to generate speech")
        
        from fastapi.responses import Response
        return Response(content=audio_bytes, media_type="audio/mpeg")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")

# Premium Feature: AI Health Assistant
@app.post("/analyze-symptoms")
async def analyze_symptoms(
    symptoms: Annotated[str, Body()],
    user_location: Annotated[Optional[str], Body()] = None
):
    """
    Premium feature: Analyze general health symptoms and provide recommendations.
    Uses TinyFish to scrape health information and Featherless AI for analysis.
    """
    try:
        # Use Featherless AI to analyze symptoms
        analysis = await analyze_symptoms_with_ai(symptoms, user_location)
        
        return {
            "analysis": analysis["summary"],
            "recommendations": analysis["recommendations"],
            "vitamins": analysis["vitamins"],
            "clinics": analysis.get("clinics", []),
            "urgency_level": analysis["urgency_level"],
            "disclaimer": "This analysis is for informational purposes only. Consult a healthcare provider for medical advice."
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing symptoms: {str(e)}")

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
        print(f"👤 Processing family history for {patient_name}")
        print(f"📊 Patient info: {family_history.patient_info.age}y, {family_history.patient_info.sex}")
        print(f"👪 Family members: {len(family_history.family_members)}")
        for member in family_history.family_members:
            print(f"  - {member.relationship.value}: {member.cancer_type.value} at age {member.age_at_diagnosis}")
        
        # Step 1: Use TinyFish agent to autonomously gather USPSTF guidelines
        print("🔍 Step 1: Fetching USPSTF guidelines with TinyFish...")
        uspstf_data = await tinyfish_get_guidelines(family_history)
        print(f"📋 USPSTF data: {list(uspstf_data.keys())}")
        
        # Step 2: Use Featherless AI to analyze family history and calculate risk
        print("🤖 Step 2: Analyzing risk with Featherless AI...")
        risk_analysis = await featherless_analyze_risk(family_history, uspstf_data)
        print(f"📈 Risk analysis: {risk_analysis.get('risk_level', 'unknown')}")
        print(f"📊 Cancer-specific risks: {list(risk_analysis.get('cancer_specific_risks', {}).keys())}")
        
        # Step 3: Generate screening recommendations
        print("🎯 Step 3: Generating screening recommendations...")
        recommendations = await generate_screening_recommendations(
            family_history.patient_info, 
            risk_analysis,
            uspstf_data
        )
        print(f"💡 Recommendations generated: {len(recommendations)}")
        for rec in recommendations:
            print(f"   - {rec.cancer_type.value}: {rec.risk_level.value} risk, age {rec.recommended_age_start}")
        
        # Create comprehensive report with AI insights
        ai_insights_dict = None
        if risk_analysis.get("personalized_insights") or risk_analysis.get("genetic_counseling_rationale"):
            ai_insights_dict = {
                "personalized_insights": risk_analysis.get("personalized_insights", []),
                "genetic_counseling_rationale": risk_analysis.get("genetic_counseling_rationale", ""),
                "cancer_specific_risks": risk_analysis.get("cancer_specific_risks", {}),
                "protective_factors": risk_analysis.get("protective_factors", []),
                "confidence": risk_analysis.get("confidence", 0.8)
            }
        
        report = RiskReport(
            patient_name=patient_name,
            generated_date=datetime.now(),
            overall_risk_summary=risk_analysis["summary"],
            recommendations=recommendations,
            next_steps=[
                "Discuss this report with your primary care physician",
                "Schedule recommended screenings based on your age and risk level",
                "Update your family history if new diagnoses occur",
                "Consider genetic counseling if high-risk patterns are identified" if risk_analysis.get("genetic_counseling_recommended") else "Monitor family health history for updates"
            ],
            disclaimer="This report is for informational purposes only and does not replace professional medical advice. Always consult with your healthcare provider for personalized medical recommendations.",
            ai_insights=ai_insights_dict,
            genetic_counseling_recommended=risk_analysis.get("genetic_counseling_recommended"),
            key_risk_factors=risk_analysis.get("key_factors"),
            current_lifestyle_recommendations=risk_analysis.get("protective_factors")
        )
        
        return report
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing family history: {str(e)}")

@app.post("/get-ai-insights")
async def get_ai_insights(
    report: RiskReport,
    additional_questions: Annotated[List[str], Body(description="Additional questions from the user")] = None
):
    """
    Get personalized AI insights about the risk report using Featherless AI.
    This endpoint takes the generated report and provides deeper analysis and answers to user questions.
    """
    if not FEATHERLESS_API_KEY or not FEATHERLESS_API_KEY.strip():
        return {
            "insights": ["AI insights not available - API key not configured"],
            "answers": [],
            "recommendations": ["Consult with your healthcare provider for personalized guidance"]
        }
    
    try:
        # Prepare comprehensive prompt for AI insights
        questions_text = ""
        if additional_questions:
            questions_text = f"\n\nADDITIONAL QUESTIONS TO ADDRESS:\n" + "\n".join([f"- {q}" for q in additional_questions])
        
        insights_prompt = f"""
        You are a medical AI providing personalized insights about a cancer risk assessment report. 
        
        PATIENT REPORT SUMMARY:
        - Patient: {report.patient_name}
        - Overall Risk: {report.overall_risk_summary}
        - Generated: {report.generated_date}
        
        SCREENING RECOMMENDATIONS:
        {format_recommendations_for_ai(report.recommendations)}
        
        NEXT STEPS RECOMMENDED:
        {chr(10).join([f"- {step}" for step in report.next_steps])}
        {questions_text}
        
        PROVIDE PERSONALIZED INSIGHTS:
        1. Explain what the risk levels mean in practical terms
        2. Highlight the most important actions for this specific patient
        3. Address any lifestyle factors that could help
        4. Explain when to be concerned and seek immediate care
        5. Clarify any confusing medical terms
        6. Answer any additional questions asked
        
        RESPOND IN JSON FORMAT:
        {{
            "key_insights": [
                "Most important insight for this patient",
                "Practical explanation of risk levels",
                "Lifestyle recommendations"
            ],
            "priority_actions": [
                "Most urgent action to take",
                "Second priority action"
            ],
            "lifestyle_recommendations": [
                "Specific lifestyle change 1",
                "Specific lifestyle change 2"
            ],
            "when_to_worry": [
                "Warning sign 1 to watch for",
                "Warning sign 2 to watch for"
            ],
            "question_answers": [
                {{"question": "user question", "answer": "detailed answer"}}
            ],
            "medical_terms_explained": [
                {{"term": "medical term", "explanation": "simple explanation"}}
            ]
        }}
        """
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{FEATHERLESS_BASE_URL}/chat/completions",
                headers={"Authorization": f"Bearer {FEATHERLESS_API_KEY}"},
                json={
                    "model": "meta-llama/Meta-Llama-3.1-8B-Instruct",
                    "messages": [
                        {
                            "role": "system", 
                            "content": "You are a medical AI assistant providing patient education and insights about cancer risk assessments. Always provide accurate, helpful, and reassuring guidance while emphasizing the importance of professional medical care."
                        },
                        {"role": "user", "content": insights_prompt}
                    ],
                    "temperature": 0.2,
                    "max_tokens": 1500
                },
                timeout=30.0
            )
            response.raise_for_status()
            
            ai_response = response.json()["choices"][0]["message"]["content"]
            return parse_ai_insights(ai_response)
            
    except Exception as e:
        print(f"AI Insights error: {e}")
        return {
            "insights": ["Unable to generate AI insights at this time"],
            "answers": [],
            "recommendations": ["Please consult with your healthcare provider for personalized guidance"]
        }

def format_recommendations_for_ai(recommendations: List[ScreeningRecommendation]) -> str:
    """Format screening recommendations for AI analysis."""
    formatted = []
    for rec in recommendations:
        formatted.append(f"""
{rec.cancer_type.value.title()} Cancer:
- Risk Level: {rec.risk_level.value.replace('_', ' ').title()}
- Start Screening: Age {rec.recommended_age_start}
- Frequency: {rec.screening_frequency}
- Method: {rec.screening_method}
- Rationale: {rec.rationale}""")
    return "\n".join(formatted)

def parse_ai_insights(ai_response: str) -> dict:
    """Parse AI insights response."""
    import json
    import re
    
    try:
        # Try to extract JSON from the response
        json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
        if json_match:
            json_str = json_match.group()
            parsed = json.loads(json_str)
            return {
                "insights": parsed.get("key_insights", []),
                "priority_actions": parsed.get("priority_actions", []),
                "lifestyle_recommendations": parsed.get("lifestyle_recommendations", []),
                "when_to_worry": parsed.get("when_to_worry", []),
                "question_answers": parsed.get("question_answers", []),
                "medical_terms_explained": parsed.get("medical_terms_explained", [])
            }
    except Exception as e:
        print(f"Error parsing AI insights: {e}")
    
    # Fallback response
    return {
        "insights": ["AI analysis completed - consult healthcare provider for interpretation"],
        "priority_actions": ["Schedule appointment with primary care physician"],
        "lifestyle_recommendations": ["Maintain healthy diet and regular exercise"],
        "when_to_worry": ["Contact doctor if you notice any unusual symptoms"],
        "question_answers": [],
        "medical_terms_explained": []
    }

async def analyze_symptoms_with_ai(symptoms: str, user_location: Optional[str] = None) -> dict:
    """Analyze general health symptoms using Featherless AI"""
    if not FEATHERLESS_API_KEY or not FEATHERLESS_API_KEY.strip():
        return {
            "summary": "AI analysis unavailable. Please consult a healthcare provider.",
            "recommendations": ["Consult with your primary care physician"],
            "vitamins": [],
            "urgency_level": "moderate"
        }
    
    async with httpx.AsyncClient() as client:
        analysis_prompt = f"""
        You are a medical AI assistant. Analyze these symptoms and provide helpful guidance:
        
        SYMPTOMS: {symptoms}
        LOCATION: {user_location or "Not specified"}
        
        Provide a comprehensive analysis in JSON format:
        {{
            "summary": "Brief analysis of symptoms",
            "urgency_level": "low|moderate|high|emergency",
            "recommendations": [
                "Specific actionable recommendation 1",
                "Specific actionable recommendation 2"
            ],
            "vitamins": [
                {{"name": "Vitamin D", "reason": "May help with fatigue"}},
                {{"name": "B12", "reason": "Supports energy levels"}}
            ],
            "lifestyle_changes": ["Change 1", "Change 2"],
            "when_to_see_doctor": "Specific guidance on when to seek medical care",
            "possible_conditions": ["Condition 1 (not a diagnosis)", "Condition 2"]
        }}
        
        IMPORTANT: Be helpful but always emphasize this is not a diagnosis. Recommend seeing a doctor for persistent or severe symptoms.
        """
        
        try:
            response = await client.post(
                f"{FEATHERLESS_BASE_URL}/chat/completions",
                headers={"Authorization": f"Bearer {FEATHERLESS_API_KEY}"},
                json={
                    "model": "meta-llama/Meta-Llama-3.1-8B-Instruct",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a helpful medical AI assistant. Provide accurate health information but always emphasize the importance of professional medical care. Respond with valid JSON only."
                        },
                        {"role": "user", "content": analysis_prompt}
                    ],
                    "temperature": 0.2,
                    "max_tokens": 1500
                },
                timeout=25.0
            )
            
            if response.status_code == 200:
                ai_response = response.json()["choices"][0]["message"]["content"]
                return parse_symptom_analysis(ai_response)
            else:
                return get_fallback_symptom_analysis()
                
        except Exception as e:
            print(f"Symptom analysis error: {e}")
            return get_fallback_symptom_analysis()

def parse_symptom_analysis(ai_response: str) -> dict:
    """Parse AI symptom analysis response"""
    import json
    import re
    
    try:
        # Clean and extract JSON
        json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
        if json_match:
            parsed = json.loads(json_match.group())
            return {
                "summary": parsed.get("summary", "Analysis completed"),
                "urgency_level": parsed.get("urgency_level", "moderate"),
                "recommendations": parsed.get("recommendations", []),
                "vitamins": parsed.get("vitamins", []),
                "lifestyle_changes": parsed.get("lifestyle_changes", []),
                "when_to_see_doctor": parsed.get("when_to_see_doctor", "Consult a doctor if symptoms persist"),
                "possible_conditions": parsed.get("possible_conditions", [])
            }
    except:
        pass
    
    return get_fallback_symptom_analysis()

def get_fallback_symptom_analysis() -> dict:
    """Fallback symptom analysis"""
    return {
        "summary": "Thank you for sharing your symptoms. For a proper evaluation, please consult with a healthcare provider.",
        "urgency_level": "moderate",
        "recommendations": [
            "Schedule an appointment with your primary care physician",
            "Keep a symptom diary noting when symptoms occur",
            "Stay hydrated and get adequate rest"
        ],
        "vitamins": [
            {"name": "Multivitamin", "reason": "General nutritional support"},
            {"name": "Vitamin D", "reason": "Supports immune function"}
        ],
        "lifestyle_changes": [
            "Maintain a balanced diet",
            "Get 7-9 hours of sleep",
            "Exercise regularly"
        ],
        "when_to_see_doctor": "See a doctor if symptoms worsen or persist for more than a week",
        "possible_conditions": []
    }

# @app.post("/generate-audio-report")
# async def generate_audio_report(
#     report: RiskReport,
#     voice_settings: Annotated[dict, Body(description="ElevenLabs voice configuration")] = None
# ):
#     """
#     Generate audio version of the risk report using ElevenLabs TTS.
#     """
#     try:
#         # Convert report to readable text
#         report_text = format_report_for_audio(report)
        
#         # Generate audio using ElevenLabs
#         audio_url = await generate_audio_with_elevenlabs(report_text, voice_settings)
        
#         return {
#             "audio_url": audio_url,
#             "text": report_text,
#             "duration_estimate": len(report_text.split()) * 0.5
#         }
        
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error generating audio: {str(e)}")

# TinyFish Integration Functions
async def tinyfish_get_guidelines(family_history: FamilyHistoryInput) -> dict:
    """
    Use TinyFish Fetch API to get current USPSTF guidelines.
    TinyFish fetches and extracts content from USPSTF website pages.
    """
    if not TINYFISH_API_KEY or not TINYFISH_API_KEY.strip():
        print("⚠️ TinyFish API key not configured, using mock data")
        return await mock_uspstf_guidelines(family_history)
    
    async with httpx.AsyncClient() as client:
        # Get cancer types that have family history + always include breast/colorectal
        cancer_types_with_history = set()
        for member in family_history.family_members:
            cancer_types_with_history.add(member.cancer_type)
        
        # Always include these common screenings
        cancer_types_with_history.add(CancerType.BREAST)
        cancer_types_with_history.add(CancerType.COLORECTAL)
        
        # Add gender-appropriate screenings
        if family_history.patient_info.sex.lower() == "female":
            cancer_types_with_history.add(CancerType.CERVICAL)
        if family_history.patient_info.sex.lower() == "male":
            cancer_types_with_history.add(CancerType.PROSTATE)
        
        print(f"🔍 TinyFish fetching guidelines for: {[ct.value for ct in cancer_types_with_history]}")
        
        # USPSTF URLs for different cancer screening guidelines
        cancer_url_map = {
            "breast": "https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/breast-cancer-screening",
            "colorectal": "https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/colorectal-cancer-screening",
            "lung": "https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/lung-cancer-screening",
            "prostate": "https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/prostate-cancer-screening",
            "cervical": "https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/cervical-cancer-screening",
            "melanoma": "https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/skin-cancer-screening"
        }
        
        # Build list of URLs to fetch
        uspstf_urls = []
        for cancer_type in cancer_types_with_history:
            if cancer_type.value in cancer_url_map:
                uspstf_urls.append(cancer_url_map[cancer_type.value])
        
        # Limit to max 4 URLs to avoid timeout
        uspstf_urls = uspstf_urls[:4]
        
        print(f"🌐 TinyFish fetching {len(uspstf_urls)} URLs: {uspstf_urls}")
        
        try:
            # Use TinyFish Fetch API to get USPSTF content
            fetch_request = {
                "urls": uspstf_urls,
                "format": "markdown"
            }
            
            print(f"📤 TinyFish request payload: {fetch_request}")
            print(f"📤 TinyFish API endpoint: {TINYFISH_BASE_URL}")
            
            response = await client.post(
                TINYFISH_BASE_URL,
                headers={
                    "X-API-Key": TINYFISH_API_KEY,
                    "Content-Type": "application/json"
                },
                json=fetch_request,
                timeout=30.0  # Reduced timeout - 30 seconds max
            )
            
            print(f"📥 TinyFish response status: {response.status_code}")
            
            if response.status_code != 200:
                error_text = response.text
                print(f"❌ TinyFish API error response: {error_text}")
                return await mock_uspstf_guidelines(family_history)
            
            result = response.json()
            print(f"✅ TinyFish API response received")
            
            # Parse the fetched USPSTF content
            if "results" in result and result["results"]:
                print(f"📄 TinyFish returned {len(result['results'])} results")
                parsed_guidelines = parse_uspstf_content(result["results"], list(cancer_types_with_history))
                
                # Fill in missing cancer types with defaults
                all_cancer_types = [
                    CancerType.BREAST, CancerType.COLORECTAL, CancerType.LUNG,
                    CancerType.CERVICAL, CancerType.PROSTATE, CancerType.MELANOMA,
                    CancerType.OVARIAN, CancerType.PANCREATIC
                ]
                for cancer_type in all_cancer_types:
                    if cancer_type.value not in parsed_guidelines:
                        parsed_guidelines[cancer_type.value] = get_default_guideline(cancer_type.value)
                
                return parsed_guidelines
            else:
                print(f"⚠️ TinyFish returned no results")
                return await mock_uspstf_guidelines(family_history)
                
        except httpx.TimeoutException as e:
            print(f"❌ TinyFish timeout after 30s - falling back to mock data")
            return await mock_uspstf_guidelines(family_history)
        except Exception as e:
            print(f"❌ TinyFish API error: {type(e).__name__}: {e}")
            return await mock_uspstf_guidelines(family_history)
    
    async with httpx.AsyncClient() as client:
        # Get ALL major cancer types for comprehensive screening recommendations
        # Not just those with family history
        all_cancer_types = [
            CancerType.BREAST,
            CancerType.COLORECTAL,
            CancerType.LUNG,
            CancerType.CERVICAL,
            CancerType.PROSTATE,
            CancerType.MELANOMA
        ]
        
        print(f"🔍 TinyFish fetching guidelines for ALL cancer types: {[ct.value for ct in all_cancer_types]}")
        
        # USPSTF URLs for different cancer screening guidelines
        uspstf_urls = []
        cancer_url_map = {
            "breast": "https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/breast-cancer-screening",
            "colorectal": "https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/colorectal-cancer-screening",
            "lung": "https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/lung-cancer-screening",
            "prostate": "https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/prostate-cancer-screening",
            "cervical": "https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/cervical-cancer-screening",
            "melanoma": "https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/skin-cancer-screening"
        }
        
        # Build list of URLs to fetch for ALL cancer types
        uspstf_urls = []
        for cancer_type in all_cancer_types:
            if cancer_type.value in cancer_url_map:
                uspstf_urls.append(cancer_url_map[cancer_type.value])
        
        print(f"🌐 TinyFish fetching URLs: {uspstf_urls}")
        
        try:
            # Use TinyFish Fetch API to get USPSTF content
            fetch_request = {
                "urls": uspstf_urls,
                "format": "markdown"
            }
            
            print(f"📤 TinyFish request payload: {fetch_request}")
            print(f"📤 TinyFish API endpoint: {TINYFISH_BASE_URL}")
            print(f"📤 TinyFish API key present: {bool(TINYFISH_API_KEY)}")
            
            response = await client.post(
                TINYFISH_BASE_URL,
                headers={
                    "X-API-Key": TINYFISH_API_KEY,
                    "Content-Type": "application/json"
                },
                json=fetch_request,
                timeout=60.0  # Increased timeout for web scraping
            )
            
            print(f"📥 TinyFish response status: {response.status_code}")
            
            if response.status_code != 200:
                error_text = response.text
                print(f"❌ TinyFish API error response: {error_text}")
                print(f"❌ Response headers: {response.headers}")
                response.raise_for_status()
            
            result = response.json()
            print(f"✅ TinyFish API response received")
            
            # Check for errors in the response
            if "errors" in result and result["errors"]:
                print(f"⚠️ TinyFish returned errors: {result['errors']}")
            
            # Parse the fetched USPSTF content
            if "results" in result and result["results"]:
                print(f"📄 TinyFish returned {len(result['results'])} results")
                # Log first result for debugging
                if result["results"]:
                    first_result = result["results"][0]
                    print(f"📄 First result URL: {first_result.get('url')}")
                    print(f"📄 First result title: {first_result.get('title')}")
                    print(f"📄 First result text length: {len(first_result.get('text', ''))} chars")
                return parse_uspstf_content(result["results"], all_cancer_types)
            else:
                print(f"⚠️ TinyFish returned no results in response: {result}")
                return await mock_uspstf_guidelines(family_history)
                
        except httpx.HTTPStatusError as e:
            print(f"❌ TinyFish HTTP error: {e.response.status_code}")
            print(f"❌ Response body: {e.response.text}")
            return await mock_uspstf_guidelines(family_history)
        except httpx.TimeoutException as e:
            print(f"❌ TinyFish timeout error: {e}")
            return await mock_uspstf_guidelines(family_history)
        except Exception as e:
            print(f"❌ TinyFish API error: {type(e).__name__}: {e}")
            import traceback
            print(f"❌ Traceback: {traceback.format_exc()}")
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
    if not FEATHERLESS_API_KEY or not FEATHERLESS_API_KEY.strip():
        # Fallback to rule-based analysis if Featherless not configured
        return calculate_rule_based_risk(family_history)
    
    async with httpx.AsyncClient() as client:
        # Prepare comprehensive data for AI analysis
        analysis_prompt = f"""
        You are a medical AI specializing in cancer risk assessment. Analyze this family history and provide personalized risk insights.

        PATIENT INFORMATION:
        - Age: {family_history.patient_info.age} years old
        - Sex: {family_history.patient_info.sex}
        - Personal cancer history: {family_history.patient_info.personal_cancer_history}
        - Ethnicity: {family_history.patient_info.ethnicity or 'Not specified'}

        FAMILY CANCER HISTORY:
        {format_family_history_for_ai(family_history.family_members)}

        CURRENT USPSTF GUIDELINES (from TinyFish):
        {format_uspstf_for_ai(uspstf_data)}

        ANALYSIS REQUIRED:
        1. Calculate personalized risk level for EACH cancer type separately (low/moderate/high/very_high)
        2. For cancers WITH family history: assess as moderate/high/very_high based on relationship and age
        3. For cancers WITHOUT family history: assess as low risk
        4. Identify key risk factors and protective factors
        5. Assess hereditary cancer syndrome probability
        6. Provide age-appropriate recommendations
        7. Determine if genetic counseling is recommended

        RESPOND IN THIS EXACT JSON FORMAT:
        {{
            "overall_risk_level": "low|moderate|high|very_high",
            "risk_summary": "Detailed explanation of overall risk assessment",
            "cancer_specific_risks": {{
                "breast": {{
                    "risk_level": "low|moderate|high|very_high",
                    "rationale": "Explanation for breast cancer risk"
                }},
                "colorectal": {{
                    "risk_level": "low|moderate|high|very_high",
                    "rationale": "Explanation for colorectal cancer risk"
                }},
                "lung": {{
                    "risk_level": "low",
                    "rationale": "No family history"
                }},
                "cervical": {{
                    "risk_level": "low",
                    "rationale": "No family history"
                }},
                "prostate": {{
                    "risk_level": "low",
                    "rationale": "No family history"
                }},
                "melanoma": {{
                    "risk_level": "low",
                    "rationale": "No family history"
                }},
                "ovarian": {{
                    "risk_level": "low",
                    "rationale": "No family history"
                }},
                "pancreatic": {{
                    "risk_level": "low",
                    "rationale": "No family history"
                }}
            }},
            "key_risk_factors": ["factor1", "factor2"],
            "protective_factors": ["factor1", "factor2"],
            "genetic_counseling_recommended": true/false,
            "genetic_counseling_rationale": "Why genetic counseling is/isn't recommended",
            "personalized_insights": [
                "Insight 1 specific to this patient",
                "Insight 2 about family patterns",
                "Insight 3 about screening timing"
            ],
            "confidence_level": 0.85
        }}
        
        IMPORTANT: 
        - Provide risk assessment for ALL 8 cancer types listed above
        - Cancers WITH family history should be moderate/high/very_high
        - Cancers WITHOUT family history should be low
        - First-degree relatives (parent/sibling) with early diagnosis (<50) = high/very_high risk
        - Second-degree relatives (grandparent/aunt/uncle) = moderate risk
        """
        
        try:
            print(f"📡 Calling Featherless AI API...")
            response = await client.post(
                f"{FEATHERLESS_BASE_URL}/chat/completions",
                headers={"Authorization": f"Bearer {FEATHERLESS_API_KEY}"},
                json={
                    "model": "meta-llama/Meta-Llama-3.1-8B-Instruct",
                    "messages": [
                        {
                            "role": "system", 
                            "content": "You are a medical AI assistant specializing in cancer genetics and risk assessment. Provide accurate, evidence-based analysis following current medical guidelines. Always respond with valid JSON."
                        },
                        {"role": "user", "content": analysis_prompt}
                    ],
                    "temperature": 0.1,
                    "max_tokens": 2000
                },
                timeout=30.0
            )
            response.raise_for_status()
            print(f"✅ Featherless AI API call successful")
            
            ai_response = response.json()["choices"][0]["message"]["content"]
            print(f"📝 Featherless AI response length: {len(ai_response)} chars")
            return parse_ai_risk_analysis(ai_response)
            
        except Exception as e:
            print(f"❌ Featherless AI error: {e}")
            return calculate_rule_based_risk(family_history)

# Helper functions
def format_family_history_for_ai(family_members: List[FamilyMember]) -> str:
    """Format family history data for AI processing."""
    if not family_members:
        return "No family history of cancer reported."
    
    formatted = []
    for member in family_members:
        status = "alive" if member.is_alive else "deceased"
        current_age_info = f", currently {member.current_age}" if member.current_age else ""
        formatted.append(
            f"- {member.relationship.value.replace('_', ' ').title()}: {member.cancer_type.value} cancer diagnosed at age {member.age_at_diagnosis} ({status}{current_age_info})"
        )
    return "\n".join(formatted)

def format_uspstf_for_ai(uspstf_data: dict) -> str:
    """Format USPSTF guidelines for AI analysis."""
    if not uspstf_data:
        return "No specific USPSTF guidelines retrieved."
    
    formatted = []
    for cancer_type, guidelines in uspstf_data.items():
        formatted.append(f"""
{cancer_type.title()} Cancer Screening:
- Standard screening age: {guidelines.get('standard_age', 'Not specified')}
- High-risk screening age: {guidelines.get('high_risk_age', 'Not specified')}
- Frequency: {guidelines.get('frequency', 'Not specified')}
- Method: {guidelines.get('method', 'Not specified')}""")
    return "\n".join(formatted)

def parse_ai_risk_analysis(ai_response: str) -> dict:
    """Parse AI response into structured risk analysis."""
    import json
    import re
    
    try:
        # Clean up the response - remove markdown code blocks if present
        cleaned_response = ai_response.strip()
        if cleaned_response.startswith("```"):
            cleaned_response = re.sub(r'```json\s*|\s*```', '', cleaned_response)
        
        # Try to extract JSON from the response
        json_match = re.search(r'\{.*\}', cleaned_response, re.DOTALL)
        if json_match:
            json_str = json_match.group()
            
            # Try to fix common JSON issues
            # Fix missing closing braces
            open_braces = json_str.count('{')
            close_braces = json_str.count('}')
            if open_braces > close_braces:
                json_str += '}' * (open_braces - close_braces)
            
            parsed = json.loads(json_str)
            
            # Ensure required fields exist
            return {
                "risk_level": parsed.get("overall_risk_level", "moderate"),
                "summary": parsed.get("risk_summary", "Risk assessment completed based on family history."),
                "cancer_specific_risks": parsed.get("cancer_specific_risks", {}),
                "key_factors": parsed.get("key_risk_factors", []),
                "protective_factors": parsed.get("protective_factors", []),
                "genetic_counseling_recommended": parsed.get("genetic_counseling_recommended", False),
                "genetic_counseling_rationale": parsed.get("genetic_counseling_rationale", ""),
                "personalized_insights": parsed.get("personalized_insights", []),
                "confidence": parsed.get("confidence_level", 0.8)
            }
    except Exception as e:
        print(f"Error parsing AI response: {e}")
        print(f"AI Response was: {ai_response[:500]}")  # Only print first 500 chars
    
    # Fallback parsing if JSON fails
    risk_level = "moderate"
    if "very high" in ai_response.lower() or "very_high" in ai_response.lower():
        risk_level = "very_high"
    elif "high" in ai_response.lower():
        risk_level = "high"
    elif "low" in ai_response.lower():
        risk_level = "low"
    
    return {
        "risk_level": risk_level,
        "summary": "AI analysis completed. Consult with healthcare provider for detailed interpretation.",
        "cancer_specific_risks": {},
        "key_factors": ["Family history of cancer"],
        "protective_factors": [],
        "genetic_counseling_recommended": "genetic" in ai_response.lower(),
        "genetic_counseling_rationale": "Based on family history patterns",
        "personalized_insights": ["Personalized analysis available - consult healthcare provider"],
        "confidence": 0.7
    }

def parse_tinyfish_agent_result(agent_result, cancer_types) -> dict:
    """Parse TinyFish Agent API result into our expected format."""
    import json
    import re
    
    guidelines = {}
    
    try:
        # The agent result might be a string containing JSON or already parsed
        if isinstance(agent_result, str):
            # Try to extract JSON from the string
            json_match = re.search(r'\{.*\}', agent_result, re.DOTALL)
            if json_match:
                agent_result = json.loads(json_match.group())
        
        if isinstance(agent_result, dict):
            # Map the agent's response to our format
            for cancer_type in cancer_types:
                cancer_key = cancer_type.value
                
                # Check various possible keys the agent might use
                possible_keys = [
                    cancer_key,
                    cancer_key.title(),
                    cancer_key.replace("_", " ").title(),
                    f"{cancer_key}_cancer",
                    f"{cancer_key.title()} Cancer"
                ]
                
                agent_data = None
                for key in possible_keys:
                    if key in agent_result:
                        agent_data = agent_result[key]
                        break
                
                if agent_data:
                    guidelines[cancer_key] = {
                        "standard_age": agent_data.get("standard_age") or agent_data.get("Standard Age") or 50,
                        "high_risk_age": agent_data.get("high_risk_age") or agent_data.get("High‑Risk Age") or agent_data.get("High-Risk Age") or 40,
                        "frequency": agent_data.get("frequency") or agent_data.get("Frequency") or "Consult physician",
                        "method": agent_data.get("method") or agent_data.get("Method") or "Standard screening",
                        "grade": agent_data.get("grade") or agent_data.get("Grade") or "N/A"
                    }
                else:
                    # Use default if not found
                    guidelines[cancer_key] = get_default_guideline(cancer_key)
        
        # If no guidelines were parsed, use defaults
        if not guidelines:
            for cancer_type in cancer_types:
                guidelines[cancer_type.value] = get_default_guideline(cancer_type.value)
        
        return guidelines
        
    except Exception as e:
        print(f"Error parsing TinyFish agent result: {e}")
        # Return default guidelines for all requested cancer types
        return {ct.value: get_default_guideline(ct.value) for ct in cancer_types}

def parse_uspstf_content(fetch_results, cancer_types) -> dict:
    """Parse USPSTF content fetched by TinyFish into our expected format."""
    guidelines = {}
    
    try:
        # Process each fetched page
        for result in fetch_results:
            url = result.get("url", "")
            text = result.get("text", "")
            
            # Determine which cancer type this page is about
            cancer_type = None
            if "breast-cancer" in url:
                cancer_type = "breast"
            elif "colorectal-cancer" in url:
                cancer_type = "colorectal"
            elif "lung-cancer" in url:
                cancer_type = "lung"
            elif "prostate-cancer" in url:
                cancer_type = "prostate"
            elif "cervical-cancer" in url:
                cancer_type = "cervical"
            
            if cancer_type and text:
                # Extract key information from the USPSTF text
                guideline = extract_screening_info(text, cancer_type)
                guidelines[cancer_type] = guideline
                print(f"📄 Parsed {cancer_type}: standard_age={guideline.get('standard_age')}, method={guideline.get('method')}")
        
        # Fill in any missing cancer types with defaults
        for cancer_type in cancer_types:
            if cancer_type.value not in guidelines:
                guidelines[cancer_type.value] = get_default_guideline(cancer_type.value)
                print(f"📄 Using default for {cancer_type.value}")
        
        return guidelines
        
    except Exception as e:
        print(f"Error parsing USPSTF content: {e}")
        # Return default guidelines for all requested cancer types
        return {ct.value: get_default_guideline(ct.value) for ct in cancer_types}

def extract_screening_info(text: str, cancer_type: str) -> dict:
    """Extract screening information from USPSTF text content."""
    import re
    
    text_lower = text.lower()
    
    # Default values
    guideline = get_default_guideline(cancer_type)
    
    # Look for specific age recommendations based on cancer type
    # Use regex to find age patterns more accurately
    
    # For breast cancer, look for "women aged 40" or "starting at age 40"
    if cancer_type == "breast":
        # Look for the main recommendation age
        if re.search(r'women aged? (40|50)', text_lower):
            match = re.search(r'women aged? (\d+)', text_lower)
            if match:
                guideline["standard_age"] = int(match.group(1))
        # Biennial screening for women 40-74
        if "40 to 74" in text_lower or "40-74" in text_lower:
            guideline["standard_age"] = 40
    
    elif cancer_type == "colorectal":
        # Look for "adults aged 45" or "starting at 45"
        if re.search(r'adults? aged? 45', text_lower) or "starting at 45" in text_lower:
            guideline["standard_age"] = 45
        elif "45 to 75" in text_lower or "45-75" in text_lower:
            guideline["standard_age"] = 45
    
    elif cancer_type == "cervical":
        # Cervical screening starts at 21
        if "age 21" in text_lower or "aged 21" in text_lower:
            guideline["standard_age"] = 21
    
    elif cancer_type == "lung":
        # Lung screening typically 50-80
        if "50 to 80" in text_lower or "50-80" in text_lower or "aged 50" in text_lower:
            guideline["standard_age"] = 50
    
    elif cancer_type == "prostate":
        # Prostate screening discussion 55-69
        if "55 to 69" in text_lower or "55-69" in text_lower:
            guideline["standard_age"] = 55
    
    elif cancer_type == "melanoma":
        # Skin cancer screening - no specific USPSTF age, use default
        pass
    
    # Look for frequency information
    if "annual" in text_lower or "every year" in text_lower:
        guideline["frequency"] = "Annually"
    elif "biennial" in text_lower or "every 2 years" in text_lower or "every two years" in text_lower:
        guideline["frequency"] = "Every 2 years"
    elif "every 3 years" in text_lower or "every three years" in text_lower:
        guideline["frequency"] = "Every 3 years"
    elif "every 5 years" in text_lower or "every five years" in text_lower:
        guideline["frequency"] = "Every 5 years"
    elif "every 10 years" in text_lower or "every ten years" in text_lower:
        guideline["frequency"] = "Every 10 years"
    
    # Look for screening methods
    if cancer_type == "breast" and ("mammography" in text_lower or "mammogram" in text_lower):
        guideline["method"] = "Mammography"
    elif cancer_type == "colorectal" and ("colonoscopy" in text_lower):
        guideline["method"] = "Colonoscopy"
    elif cancer_type == "cervical" and ("pap" in text_lower or "cytology" in text_lower):
        guideline["method"] = "Pap smear"
    elif cancer_type == "lung" and ("ct" in text_lower or "computed tomography" in text_lower):
        guideline["method"] = "Low-dose CT scan"
    elif cancer_type == "prostate" and ("psa" in text_lower):
        guideline["method"] = "PSA test"
    
    return guideline

def get_default_guideline(cancer_type: str) -> dict:
    """Get default screening guidelines for a cancer type."""
    defaults = {
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
        },
        "lung": {
            "standard_age": 50,
            "high_risk_age": 45,
            "frequency": "Annually",
            "method": "Low-dose CT scan"
        },
        "prostate": {
            "standard_age": 55,
            "high_risk_age": 45,
            "frequency": "Every 2 years",
            "method": "PSA test"
        },
        "cervical": {
            "standard_age": 21,
            "high_risk_age": 21,
            "frequency": "Every 3 years",
            "method": "Pap smear"
        },
        "melanoma": {
            "standard_age": 35,
            "high_risk_age": 25,
            "frequency": "Annually",
            "method": "Skin exam"
        },
        "ovarian": {
            "standard_age": 50,
            "high_risk_age": 30,
            "frequency": "Consult physician",
            "method": "Consult physician"
        },
        "pancreatic": {
            "standard_age": 50,
            "high_risk_age": 40,
            "frequency": "Consult physician",
            "method": "Consult physician"
        }
    }
    
    return defaults.get(cancer_type, {
        "standard_age": 50,
        "high_risk_age": 40,
        "frequency": "Consult physician",
        "method": "Standard screening"
    })

async def mock_uspstf_guidelines(family_history: FamilyHistoryInput) -> dict:
    """Mock USPSTF guidelines for development/testing."""
    return {
        "breast": {
            "standard_age": 40,  # USPSTF actual age (displayed as 50 in UI)
            "high_risk_age": 30,
            "frequency": "Every 2 years",
            "method": "Mammography"
        },
        "colorectal": {
            "standard_age": 45,
            "high_risk_age": 40,
            "frequency": "Every 10 years",
            "method": "Colonoscopy"
        },
        "lung": {
            "standard_age": 50,
            "high_risk_age": 45,
            "frequency": "Annually",
            "method": "Low-dose CT scan"
        },
        "cervical": {
            "standard_age": 21,
            "high_risk_age": 21,
            "frequency": "Every 3 years",
            "method": "Pap smear"
        },
        "prostate": {
            "standard_age": 50,
            "high_risk_age": 45,
            "frequency": "Every 2 years",
            "method": "PSA test"
        },
        "melanoma": {
            "standard_age": 35,
            "high_risk_age": 25,
            "frequency": "Annually",
            "method": "Skin exam"
        },
        "ovarian": {
            "standard_age": 50,
            "high_risk_age": 30,
            "frequency": "Consult physician",
            "method": "Consult physician"
        },
        "pancreatic": {
            "standard_age": 50,
            "high_risk_age": 40,
            "frequency": "Consult physician",
            "method": "Consult physician"
        }
    }

def calculate_rule_based_risk(family_history: FamilyHistoryInput) -> dict:
    """Fallback rule-based risk calculation."""
    risk_score = 0
    key_factors = []
    
    for member in family_history.family_members:
        # Higher weight for closer relatives
        if member.relationship in [RelationshipType.PARENT, RelationshipType.SIBLING]:
            risk_score += 0.4
            key_factors.append(f"{member.relationship.value} with {member.cancer_type.value} cancer")
        elif member.relationship == RelationshipType.GRANDPARENT:
            risk_score += 0.2
            key_factors.append(f"{member.relationship.value} with {member.cancer_type.value} cancer")
        
        # Much higher weight for very early diagnosis (suggests genetic factors)
        if member.age_at_diagnosis < 30:
            risk_score += 0.5
            key_factors.append(f"Very early diagnosis at age {member.age_at_diagnosis}")
        elif member.age_at_diagnosis < 50:
            risk_score += 0.2
            key_factors.append(f"Early diagnosis at age {member.age_at_diagnosis}")
    
    # Determine risk level and appropriate summary
    if risk_score > 0.8:
        risk_level = "very_high"
        summary = "Your family history indicates very high cancer risk due to early-onset cancer in close relatives. Genetic counseling and enhanced screening are strongly recommended."
    elif risk_score > 0.5:
        risk_level = "high" 
        summary = "Your family history indicates elevated cancer risk requiring enhanced screening and possible genetic counseling."
    elif risk_score > 0.3:
        risk_level = "moderate"
        summary = "Your family history shows moderate cancer risk with some screening modifications recommended."
    else:
        risk_level = "low"
        summary = "Your family history indicates average cancer risk with standard screening recommendations."
    
    return {
        "risk_level": risk_level, 
        "summary": summary,
        "key_factors": key_factors,
        "risk_score": risk_score
    }

async def generate_screening_recommendations(
    patient_info: PatientInfo, 
    risk_analysis: dict,
    uspstf_data: dict
) -> List[ScreeningRecommendation]:
    """Generate personalized screening recommendations for ALL cancer types."""
    recommendations = []

    # USPSTF standard ages
    USPSTF_STANDARD_AGES = {
        "breast": 40,  # USPSTF standard is 40 (will show as 50 in UI for display)
        "colorectal": 45,
        "lung": 50,
        "cervical": 21,
        "prostate": 50,
        "melanoma": 35,
        "ovarian": 50,
        "pancreatic": 50,
    }

    # Standard screening methods
    STANDARD_METHODS = {
        "breast": "Mammography",
        "colorectal": "Colonoscopy",
        "lung": "Low-dose CT scan",
        "cervical": "Pap smear",
        "prostate": "PSA test",
        "melanoma": "Skin exam",
        "ovarian": "Consult physician",
        "pancreatic": "Consult physician",
    }

    # Standard frequencies
    STANDARD_FREQUENCIES = {
        "breast": "Every 2 years",
        "colorectal": "Every 10 years",
        "lung": "Annually",
        "cervical": "Every 3 years",
        "prostate": "Every 2 years",
        "melanoma": "Annually",
        "ovarian": "Consult physician",
        "pancreatic": "Consult physician",
    }

    def parse_age_from_guideline(value) -> int | None:
        """Parse age from TinyFish guideline value which may be string like '50 to 80' or int."""
        if value is None:
            return None
        if isinstance(value, int):
            return value
        if isinstance(value, str):
            import re
            nums = re.findall(r'\d+', value)
            if nums:
                return int(nums[0])
        return None

    # Get cancer-specific risks from AI analysis
    cancer_specific_risks = risk_analysis.get("cancer_specific_risks", {})
    
    # Process ALL cancer types, not just those with family history
    all_cancer_types = ["breast", "colorectal", "lung", "cervical", "prostate", "melanoma", "ovarian", "pancreatic"]
    
    for cancer_type in all_cancer_types:
        # Skip gender-inappropriate screenings
        if cancer_type == "breast" and patient_info.sex.lower() == "male":
            continue
        if cancer_type == "cervical" and patient_info.sex.lower() == "male":
            continue
        if cancer_type == "prostate" and patient_info.sex.lower() == "female":
            continue
        if cancer_type == "ovarian" and patient_info.sex.lower() == "male":
            continue

        # Get guidelines from TinyFish data or use defaults
        guidelines = uspstf_data.get(cancer_type, {})
        
        # Determine risk level for THIS specific cancer type
        cancer_risk_info = cancer_specific_risks.get(cancer_type, {})
        cancer_risk_level_str = cancer_risk_info.get("risk_level", "low")
        
        # Map string to enum
        risk_level_map = {
            "low": RiskLevel.LOW,
            "moderate": RiskLevel.MODERATE,
            "high": RiskLevel.HIGH,
            "very_high": RiskLevel.VERY_HIGH
        }
        cancer_risk_level = risk_level_map.get(cancer_risk_level_str, RiskLevel.LOW)
        
        # Get standard age for this cancer - prioritize TinyFish data
        tinyfish_standard_age = parse_age_from_guideline(guidelines.get("standard_age"))
        fallback_standard_age = USPSTF_STANDARD_AGES.get(cancer_type, 50)
        
        # Use TinyFish age if available, otherwise use our known USPSTF ages
        standard_age = tinyfish_standard_age if tinyfish_standard_age else fallback_standard_age
        
        print(f"🎯 {cancer_type}: risk_level={cancer_risk_level_str}, TinyFish={tinyfish_standard_age}, Fallback={fallback_standard_age}, Using standard={standard_age}")
        
        # Calculate personalized start age based on risk
        if cancer_risk_level in [RiskLevel.HIGH, RiskLevel.VERY_HIGH]:
            # High risk: start 10 years earlier, minimum 25
            calculated_age = standard_age - 10
            recommended_start_age = max(calculated_age, 25)
            print(f"   ✅ High risk: {standard_age} - 10 = {calculated_age}, max(25) → {recommended_start_age}")
        elif cancer_risk_level == RiskLevel.MODERATE:
            # Moderate risk: start 5 years earlier
            calculated_age = standard_age - 5
            recommended_start_age = max(calculated_age, 25)
            print(f"   ⚠️ Moderate risk: {standard_age} - 5 = {calculated_age}, max(25) → {recommended_start_age}")
        else:
            # Low risk: use standard USPSTF age
            recommended_start_age = standard_age
            print(f"   ℹ️ Low risk: using standard age {recommended_start_age}")

        # Get screening method and frequency
        method = guidelines.get("method") or STANDARD_METHODS.get(cancer_type, "Standard screening")
        frequency = guidelines.get("frequency") or STANDARD_FREQUENCIES.get(cancer_type, "Consult physician")

        # Build rationale - construct it ourselves to ensure accuracy
        if cancer_risk_level in [RiskLevel.HIGH, RiskLevel.VERY_HIGH]:
            risk_description = "high" if cancer_risk_level == RiskLevel.HIGH else "very high"
            # Get the AI's explanation but rebuild the age comparison
            ai_explanation = cancer_risk_info.get("rationale", "")
            
            # Build accurate rationale
            if ai_explanation and "family history" in ai_explanation.lower():
                # Extract just the family history part, not the age comparison
                rationale = ai_explanation.split(".")[0] + "."
            else:
                rationale = f"{risk_description.title()} risk based on family history."
            
            # Add accurate age comparison
            if recommended_start_age < standard_age:
                rationale += f" Personalized screening recommended at age {recommended_start_age} (USPSTF standard is {standard_age})."
            else:
                rationale += f" Screening recommended at age {recommended_start_age}."
                
        elif cancer_risk_level == RiskLevel.MODERATE:
            ai_explanation = cancer_risk_info.get("rationale", "")
            if ai_explanation and "family history" in ai_explanation.lower():
                rationale = ai_explanation.split(".")[0] + "."
            else:
                rationale = "Moderate risk based on family history."
            
            if recommended_start_age < standard_age:
                rationale += f" Screening recommended at age {recommended_start_age} (USPSTF standard is {standard_age})."
            else:
                rationale += f" Screening recommended at age {recommended_start_age}."
        else:
            rationale = f"No family history of {cancer_type} cancer. Follow standard USPSTF screening starting at age {standard_age}."
        
        # Add age-specific guidance
        if patient_info.age < 18:
            rationale += f" Genetic counseling recommended now. Screening will begin at age {recommended_start_age}."
        elif patient_info.age < recommended_start_age:
            years_until = recommended_start_age - patient_info.age
            rationale += f" You are {patient_info.age}, so screening begins in {years_until} year{'s' if years_until != 1 else ''}."
        else:
            rationale += f" You are at or above screening age — discuss with your doctor."

        recommendation = ScreeningRecommendation(
            cancer_type=CancerType(cancer_type),
            risk_level=cancer_risk_level,
            recommended_age_start=recommended_start_age,
            screening_frequency=frequency,
            screening_method=method,
            rationale=rationale
        )
        recommendations.append(recommendation)

    return recommendations

# def format_report_for_audio(report: RiskReport) -> str:
#     """Format the risk report for audio narration."""
#     text_parts = [
#         f"Cancer Screening Report for {report.patient_name}",
#         f"Generated on {report.generated_date.strftime('%B %d, %Y')}",
#         "",
#         "Overall Risk Summary:",
#         report.overall_risk_summary,
#         "",
#         "Screening Recommendations:"
#     ]
    
#     for rec in report.recommendations:
#         text_parts.extend([
#             f"{rec.cancer_type.value.title()} Cancer:",
#             f"Risk Level: {rec.risk_level.value.replace('_', ' ').title()}",
#             f"Start screening at age {rec.recommended_age_start}",
#             f"Frequency: {rec.screening_frequency}",
#             f"Method: {rec.screening_method}",
#             ""
#         ])
    
#     return "\n".join(text_parts)

# async def generate_audio_with_elevenlabs(text: str, voice_settings: dict = None) -> str:
#     """Generate audio using ElevenLabs TTS API."""
#     if not ELEVENLABS_API_KEY:
#         return "https://mock-audio-url.com/report.mp3"
    
#     async with httpx.AsyncClient() as client:
#         try:
#             response = await client.post(
#                 "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM",
#                 headers={
#                     "Accept": "audio/mpeg",
#                     "Content-Type": "application/json",
#                     "xi-api-key": ELEVENLABS_API_KEY
#                 },
#                 json={
#                     "text": text,
#                     "model_id": "eleven_monolingual_v1",
#                     "voice_settings": voice_settings or {
#                         "stability": 0.5,
#                         "similarity_boost": 0.5
#                     }
#                 }
#             )
#             response.raise_for_status()
            
#             # In production, you'd save the audio file and return a URL
#             return "https://your-storage.com/generated-audio.mp3"
            
#         except Exception as e:
#             print(f"ElevenLabs API error: {e}")
#             return "https://mock-audio-url.com/report.mp3"