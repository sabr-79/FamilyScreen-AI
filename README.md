# FamilyScreen AI

**An AI-powered cancer screening recommendation platform developed for the o1 Summit Hackathon**

Developed by **Ridwaan A** and **Sabirin M**

<img width="1661" height="757" alt="FamilyScreen AI Dashboard" src="https://github.com/user-attachments/assets/0a340193-470c-4912-8a68-adfaf628cd80" />

## 🌐 Live Demo

- **Frontend:** [familyscreenai.vercel.app](https://familyscreenai.vercel.app)
- **Backend API:** [familyscreen-ai.onrender.com](https://familyscreen-ai.onrender.com)

---

## 🎯 What is FamilyScreen AI?

FamilyScreen AI analyzes your family cancer history and generates personalized screening recommendations based on USPSTF guidelines. Using AI agents and real-time web scraping, it provides:

- **Personalized screening ages** adjusted for your family history
- **Risk assessment** for 8 major cancer types
- **AI-powered analysis** using Featherless AI
- **Real-time USPSTF guidelines** via TinyFish web scraping
- **Voice rehearsal** with AI an doctor powered by ElevenLabs

---

## 🏗️ Architecture

### Frontend (Next.js 14)
- **Framework:** Next.js 14 with App Router
- **UI:** React + TailwindCSS + shadcn/ui
- **Deployment:** Vercel
- **Voice:** ElevenLabs Conversational AI

### Backend (FastAPI)
- **Framework:** Python FastAPI
- **AI Analysis:** Featherless AI (Llama 3.1)
- **Web Scraping:** TinyFish Fetch API
- **Voice:** ElevenLabs STT/TTS
- **Payments:** Stripe
- **Deployment:** Render

### AI Agents & Services
1. **TinyFish** - Autonomous web scraping for USPSTF guidelines
2. **Featherless AI** - Risk analysis and personalized recommendations
3. **ElevenLabs** - Voice transcription and conversational AI

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- Python 3.9+
- API Keys for: Featherless, TinyFish, ElevenLabs, Stripe

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/familyscreen-ai.git
cd familyscreen-ai
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your API keys

# Run backend
uvicorn main:app --reload --port 8000
```

**Backend will run at:** `http://127.0.0.1:8000`

### 3. Frontend Setup

```bash
cd frontend/UI

# Install dependencies
pnpm install

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://127.0.0.1:8000" > .env.local
echo "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key" >> .env.local

# Run frontend
pnpm dev
```

**Frontend will run at:** `http://localhost:3000`

---


## 🎨 Features

### ✅ Core Features
- Family cancer history form with multiple relatives
- AI-powered risk analysis for 8 cancer types
- Personalized screening age recommendations
- Real-time USPSTF guideline scraping
- Printable PDF reports
- Text-to-speech report reading

### 🎤 Voice Features (Premium)
- Voice-guided form input
- AI doctor rehearsal (Dr. Chen)
- Speech-to-text transcription
- Text-to-speech responses

### 💳 Premium Features
- AI health assistant for symptom analysis
- Unlimited family members
- Priority support
- Stripe subscription management

---

## 🛠️ Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- TailwindCSS
- shadcn/ui
- ElevenLabs React SDK

**Backend:**
- Python 3.9+
- FastAPI
- httpx (async HTTP)
- Pydantic
- python-dotenv

**AI & Services:**
- Featherless AI (Llama 3.1-8B)
- TinyFish Fetch API
- ElevenLabs (STT/TTS/Conversational AI)
- Stripe (Payments)

**Deployment:**
- Vercel (Frontend)
- Render (Backend)

---

## 📊 How It Works

1. **User Input:** Patient enters age, sex, and family cancer history
2. **TinyFish Scraping:** Fetches current USPSTF screening guidelines (3-4 URLs, ~30s)
3. **Featherless AI Analysis:** Analyzes family patterns and calculates risk levels
4. **Recommendation Generation:** Adjusts screening ages based on risk:
   - High risk: Standard age - 10 years (min 25)
   - Moderate risk: Standard age - 5 years
   - Low risk: Standard USPSTF age
5. **Report Display:** Shows personalized recommendations with rationale

---

## 🔒 Security & Privacy

- All API keys stored in environment variables
- No patient data stored on servers
- Real-time analysis only
- HTTPS encryption in production
- CORS configured for specific origins
- Input validation and sanitization

---

## 🐛 Troubleshooting

### Backend not responding
```bash
# Check if backend is running
curl http://127.0.0.1:8000/health

# Check logs for errors
# Look for TinyFish timeout or API key issues
```
---

## 📝 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

Built for the **o1 Summit Hackathon** using:
- [Featherless AI](https://featherless.ai) - AI inference
- [TinyFish](https://tinyfish.ai) - Web scraping agent
- [ElevenLabs](https://elevenlabs.io) - Voice AI
- [Kiro](https://kiro.ai) - Development environment
- [Stripe](https://stripe.com) - Payment processing


---

## 🔗 Links

- **Live App:** https://familyscreenai.vercel.app
- **Backend API:** https://familyscreen-ai.onrender.com
- **GitHub:** https://github.com/sabr-79/FamilyScreen-AI

---

**⚠️ Medical Disclaimer:** This tool is for informational purposes only and does not replace professional medical advice. Always consult with your healthcare provider for personalized medical recommendations. 
