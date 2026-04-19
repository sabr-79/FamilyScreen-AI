# FamilyScreen AI 🧬

### AI-Powered Cancer Risk Assessment & Personalized Screening Recommendations

An intelligent health application that analyzes family cancer history and generates personalized screening recommendations using AI agents and USPSTF guidelines.

**Developed by Ridwaan A and Sabirin M for the o1 Summit Hackathon**

<img width="1661" height="757" alt="FamilyScreen AI Dashboard" src="https://github.com/user-attachments/assets/0a340193-470c-4912-8a68-adfaf628cd80" />

**Hosted on**: Render (Backend) and Vercel (Frontend)

---

## 🌟 Features

### Core Functionality
- **Family History Analysis**: Input detailed family cancer history with relationship types, cancer types, and diagnosis ages
- **AI-Powered Risk Assessment**: Uses Featherless AI (Meta-Llama-3.1-8B) to analyze hereditary cancer risk patterns
- **Personalized Screening Ages**: Calculates customized screening start ages based on family history
- **USPSTF Guidelines Integration**: Fetches current screening guidelines using TinyFish web agent
- **Comprehensive Reports**: Generates detailed reports covering 7-8 cancer types (gender-appropriate)
- **Voice Features**: Text-to-speech report reading and voice input powered by ElevenLabs
- **Doctor Visit Rehearsal**: Practice conversations with an AI doctor before your real appointment

### Cancer Types Covered
- Breast Cancer
- Colorectal Cancer
- Cervical Cancer
- Lung Cancer
- Prostate Cancer
- Melanoma (Skin Cancer)
- Ovarian Cancer
- Pancreatic Cancer

### Risk Calculation Logic
- **High Risk** (first-degree relative): Start screening 10 years earlier than standard (minimum age 25)
- **Moderate Risk** (second-degree relative): Start screening 5 years earlier than standard
- **Low Risk** (no family history): Follow standard USPSTF screening ages

---

## 🏗️ Architecture

### Tech Stack

**Frontend**
- Next.js 16.2.0 with React 19
- TypeScript
- Tailwind CSS + shadcn/ui components
- Deployed on Vercel

**Backend**
- FastAPI (Python)
- Async/await architecture
- Pydantic for data validation
- Deployed on Render

**AI & External Services**
- **Featherless AI**: Risk analysis and personalized insights
- **TinyFish**: Autonomous web agent for fetching USPSTF guidelines
- **ElevenLabs**: Voice transcription (Scribe v2) and text-to-speech
- **Stripe**: Premium subscription management
- **Kiro**: Development environment and AI assistance

---

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- pnpm (or npm/yarn)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create `.env` file** with your API keys:
   ```env
   FEATHERLESS_API_KEY=your_featherless_key_here
   TINYFISH_API_KEY=your_tinyfish_key_here
   ELEVENLABS_API_KEY=your_elevenlabs_key_here
   STRIPE_SECRET_KEY=your_stripe_secret_key_here
   STRIPE_PRICE_ID=your_stripe_price_id_here
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
   ENVIRONMENT=development
   DEBUG=True
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
   ```

5. **Run the backend**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

   Backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend/UI
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Create `.env.local` file**:
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Run the development server**
   ```bash
   pnpm dev
   ```

   Frontend will be available at `http://localhost:3000`

---

## 📡 API Endpoints

### Main Endpoints

**POST** `/analyze-family-history`
- Analyzes family cancer history and generates personalized screening recommendations
- Uses TinyFish to fetch USPSTF guidelines
- Uses Featherless AI for risk analysis
- Returns comprehensive risk report with recommendations

**POST** `/transcribe-audio`
- Transcribes audio to text using ElevenLabs Scribe v2
- Supports 90+ languages

**POST** `/text-to-speech`
- Converts text to speech using ElevenLabs TTS
- Returns audio for browser playback

**POST** `/analyze-symptoms`
- Premium feature: Analyzes general health symptoms
- Provides recommendations and vitamin suggestions

### Stripe Integration

**POST** `/create-checkout-session` - Creates Stripe checkout session  
**POST** `/create-portal-session` - Creates customer portal session  
**GET** `/subscription-status/{customer_id}` - Gets subscription status  
**POST** `/webhook/stripe` - Handles Stripe webhook events

---

## 🔒 Security & Privacy

- **HIPAA-Compliant Design**: All health information is encrypted and handled securely
- **No Data Storage**: Patient information is not stored on servers
- **Environment Variables**: All API keys and secrets stored in environment variables
- **CORS Protection**: Configured allowed origins for API access
- **Input Validation**: Comprehensive validation using Pydantic models

---

## 📋 Terms of Use & Privacy

**By using FamilyScreen AI, you agree to the following:**

### Data Usage
- Your family health history information will be processed by third-party AI systems (Featherless AI and TinyFish) to generate personalized screening recommendations
- Data is transmitted securely and used solely for the purpose of generating your risk assessment
- **No personal health information is stored on our servers** - all analysis is performed in real-time
- We do not sell, share, or distribute your health information to third parties beyond the AI services required for analysis

### AI Processing
- Featherless AI analyzes your family history patterns and calculates risk levels
- TinyFish autonomously fetches current USPSTF screening guidelines
- ElevenLabs processes voice input/output if you use voice features
- All AI processing is done securely through encrypted connections

### Your Responsibilities
- Provide accurate family health history information
- Discuss all screening recommendations with your healthcare provider
- Do not use this service as a replacement for professional medical advice
- Understand that AI-generated recommendations are informational only

### Limitations
- This service does not diagnose medical conditions
- Recommendations are based on family history and may not account for all risk factors
- USPSTF guidelines are general population recommendations and may not apply to all individuals
- Genetic testing and counseling may be recommended for high-risk individuals

**By clicking "Generate My AI Screening Report," you acknowledge that you have read and agree to these terms.**

---

## 🧪 How It Works

### 1. Data Collection
User inputs personal information and family cancer history

### 2. TinyFish Agent
Autonomously fetches current USPSTF screening guidelines

### 3. Featherless AI Analysis
Analyzes family history patterns and calculates cancer-specific risk levels

### 4. Recommendation Generation
Calculates personalized screening ages based on risk

### 5. Report Delivery
Visual report with risk levels, screening ages, and AI-powered insights

---

## 📊 Example Use Case

**Patient**: 32-year-old female  
**Family History**: Mother diagnosed with breast cancer at age 30

**Results**:
- **Breast Cancer**: High risk → Start screening at age 30 (standard is 40)
- **Colorectal Cancer**: Low risk → Start screening at age 45 (standard)
- **Other cancers**: Low risk → Standard USPSTF ages

---

## 🤝 Contributing

This project was developed for the o1 Summit Hackathon. Contributions, issues, and feature requests are welcome!

---

## 🙏 Acknowledgments

- **Featherless AI** for powerful LLM inference
- **TinyFish** for autonomous web agent capabilities
- **ElevenLabs** for voice AI technology
- **Kiro** for AI-powered development environment
- **Stripe** for payment processing
- **USPSTF** for evidence-based screening guidelines

---

## ⚠️ Medical Disclaimer

This application is for informational purposes only and does not replace professional medical advice. Always consult with your healthcare provider for personalized medical recommendations. The screening recommendations are based on family history analysis and USPSTF guidelines but should be discussed with a qualified healthcare professional before making any medical decisions.

---

## 📞 Contact

**Developers**: Ridwaan A and Sabirin M

For questions or support, please open an issue on GitHub.
