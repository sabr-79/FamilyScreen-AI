"use client"

import { ShieldCheck, ArrowRight, FileText, Sparkles, Users } from "lucide-react"
import { FamilyHistoryForm } from "@/components/family-history-form"
import { HealthAssistant } from "@/components/health-assistant"
import { UpgradeButton } from "@/components/upgrade-button"
import { SponsorsSection } from "@/components/sponsors-section"
import { VoiceGuidedFormExample } from "@/components/voice-guided-form-example"

export default function FamilyScreenAI() {
  const isPremium = false

  return (
    <main className="min-h-screen bg-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── NAV ── */}
      <header style={{
        background: "rgba(255,255,255,0.95)",
        borderBottom: "0.5px solid #e2e8f0",
        padding: "14px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: "#0A1F44", borderRadius: 7,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <span style={{ fontFamily: "'Georgia', serif", fontSize: 19, fontWeight: 600, color: "#0A1F44" }}>
            FamilyScreen <span style={{ color: "#2563EB", fontStyle: "italic" }}>AI</span>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 14 }}>
          <span style={{ color: "#0A1F44", fontWeight: 600 }}>Home</span>
          <a href="#assessment" style={{ color: "#64748b", textDecoration: "none" }}>Assessment</a>
          <a href="#how-it-works" style={{ color: "#64748b", textDecoration: "none" }}>How it works</a>
          {!isPremium && (
            <UpgradeButton />
          )}
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{
        background: "linear-gradient(145deg, #0A1F44 0%, #112A5C 55%, #1E3A8A 100%)",
        color: "white",
        padding: "72px 48px 88px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Grid overlay */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 85%)",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 85%)",
        }} />
        {/* Glow */}
        <div style={{
          position: "absolute", top: -120, right: -60,
          width: 520, height: 520,
          background: "radial-gradient(circle, rgba(37,99,235,0.35) 0%, transparent 60%)",
          filter: "blur(40px)", pointerEvents: "none",
        }} />

        <div style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "1.15fr 1fr",
          gap: 56,
          alignItems: "center",
          maxWidth: 1100,
          margin: "0 auto",
        }}>
          {/* Left */}
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              border: "0.5px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.05)",
              padding: "6px 14px", borderRadius: 999,
              fontSize: 13, color: "#cbd5e1",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80", display: "inline-block" }} />
              USPSTF-aligned clinical guidance
            </div>

            <h1 style={{
              fontFamily: "'Georgia', serif",
              fontSize: 64, fontWeight: 600,
              lineHeight: 1.02, letterSpacing: "-0.02em",
              margin: "24px 0 0",
            }}>
              FamilyScreen <span style={{ color: "#60A5FA", fontStyle: "italic" }}>AI</span>
            </h1>

            <p style={{ margin: "20px 0 0", fontSize: 19, lineHeight: 1.5, color: "#cbd5e1", maxWidth: 480 }}>
              Know your cancer risk before it&apos;s too late.<br />
              Powered by AI and USPSTF guidelines.
            </p>

            <div style={{ marginTop: 36, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href="#assessment" style={{
                background: "#2563EB", color: "white",
                border: 0, padding: "14px 28px", borderRadius: 10,
                fontSize: 16, fontWeight: 600,
                display: "inline-flex", alignItems: "center", gap: 10,
                boxShadow: "0 6px 24px -4px rgba(37,99,235,0.6)",
                textDecoration: "none",
              }}>
                Get Started
                <ArrowRight size={18} />
              </a>
              <a href="#how-it-works" style={{
                background: "transparent", color: "white",
                border: "0.5px solid rgba(255,255,255,0.25)",
                padding: "14px 22px", borderRadius: 10,
                fontSize: 15, fontWeight: 500,
                display: "inline-flex", alignItems: "center", gap: 8,
                textDecoration: "none",
              }}>
                <FileText size={16} />
                How it works
              </a>
            </div>

            {/* Real stats only */}
            <div style={{ marginTop: 56, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32, maxWidth: 480 }}>
              <div>
                <div style={{ fontFamily: "'Georgia', serif", fontSize: 30, fontWeight: 600 }}>9</div>
                <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>Cancer types screened</div>
              </div>
              <div>
                <div style={{ fontFamily: "'Georgia', serif", fontSize: 30, fontWeight: 600 }}>100%</div>
                <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>USPSTF-aligned</div>
              </div>
              <div>
                <div style={{ fontFamily: "'Georgia', serif", fontSize: 30, fontWeight: 600 }}>&lt;2 min</div>
                <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>Assessment time</div>
              </div>
            </div>
          </div>

          {/* Right — floating mock report card */}
          <div style={{
            background: "white", padding: 24, borderRadius: 16,
            color: "#0f172a", transform: "rotate(1.2deg)",
            boxShadow: "0 30px 60px -20px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 26, height: 26, background: "#0A1F44", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: "#0A1F44" }}>CLINICAL REPORT</span>
              </div>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>Sample</span>
            </div>
            <div style={{ fontFamily: "'Georgia', serif", fontSize: 17, fontWeight: 600, color: "#0A1F44", marginBottom: 16 }}>Personalized risk assessment</div>
            {[
              { label: "Colorectal", color: "#CA8A04", pct: "58%" },
              { label: "Breast", color: "#DC2626", pct: "82%" },
              { label: "Lung", color: "#16A34A", pct: "22%" },
            ].map((item) => (
              <div key={item.label} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</span>
                  <span style={{ fontSize: 12, color: item.color, fontWeight: 600 }}>
                    {item.pct === "82%" ? "High" : item.pct === "58%" ? "Moderate" : "Low"}
                  </span>
                </div>
                <div style={{ height: 6, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: item.pct, height: "100%", background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ background: "#f8fafc", padding: "72px 48px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", color: "#2563EB" }}>How it works</div>
            <h2 style={{ fontFamily: "'Georgia', serif", fontSize: 44, fontWeight: 600, color: "#0A1F44", margin: "12px 0 16px", letterSpacing: "-0.02em" }}>
              Clinical screening, simplified.
            </h2>
            <p style={{ color: "#64748b", fontSize: 15, margin: 0 }}>Three steps to a personalized, clinician-ready risk profile.</p>
          </div>

          <div style={{ marginTop: 48, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              {
                icon: <Users size={20} />,
                num: "01",
                title: "Share your family history",
                desc: "Tell us about relatives who have been diagnosed with cancer and at what age.",
              },
              {
                icon: <Sparkles size={20} />,
                num: "02",
                title: "AI risk modeling",
                desc: "Our model adjusts USPSTF screening ages based on your personal risk factors.",
              },
              {
                icon: <FileText size={20} />,
                num: "03",
                title: "Personalized report",
                desc: "Get a clinical-grade report showing when to screen for each cancer type.",
              },
            ].map((step) => (
              <div key={step.num} style={{
                border: "0.5px solid #e2e8f0", background: "white",
                borderRadius: 16, padding: 28,
                boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 4px 16px -4px rgba(15,23,42,0.06)",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 11,
                    background: "#EFF6FF", color: "#2563EB",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {step.icon}
                  </div>
                  <span style={{ fontFamily: "'Georgia', serif", fontSize: 14, color: "#64748b" }}>{step.num}</span>
                </div>
                <h3 style={{ fontFamily: "'Georgia', serif", fontSize: 20, fontWeight: 600, color: "#0A1F44", margin: "20px 0 8px" }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VOICE TEST SECTION (DEMO) ── */}
      <section style={{ background: "white", padding: "56px 48px" }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", color: "#2563EB" }}>🎙️ Voice Demo</div>
            <h2 style={{ fontFamily: "'Georgia', serif", fontSize: 42, fontWeight: 600, color: "#0A1F44", margin: "12px 0 16px", letterSpacing: "-0.02em" }}>
              Try Voice-Guided Input
            </h2>
            <p style={{ color: "#64748b", fontSize: 15, margin: 0 }}>
              AI reads questions out loud. You can respond by voice or typing.
            </p>
          </div>

          <VoiceGuidedFormExample />
        </div>
      </section>

      {/* ── ASSESSMENT SECTION ── */}
      <section id="assessment" style={{ background: "#f8fafc", padding: "56px 48px 72px" }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", color: "#2563EB" }}>Assessment</div>
            <h2 style={{ fontFamily: "'Georgia', serif", fontSize: 42, fontWeight: 600, color: "#0A1F44", margin: "12px 0 16px", letterSpacing: "-0.02em" }}>
              Family Cancer History
            </h2>
            <p style={{ color: "#64748b", fontSize: 15, margin: 0 }}>Your family&apos;s health history helps identify screening needs.</p>
          </div>

          {/* HIPAA banner */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 12,
            border: "0.5px solid rgba(37,99,235,0.2)", background: "#EFF6FF",
            padding: "16px 18px", borderRadius: 12, marginBottom: 28,
          }}>
            <ShieldCheck size={20} color="#2563EB" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0A1F44" }}>Your privacy is protected</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>All information is encrypted and handled in accordance with HIPAA guidelines.</div>
            </div>
          </div>

          <FamilyHistoryForm />
        </div>
      </section>

      {/* ── PREMIUM HEALTH ASSISTANT ── */}
      <section style={{ background: "white", padding: "56px 48px" }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <HealthAssistant isPremium={isPremium} onUpgrade={() => {}} />
        </div>
      </section>

      {/* ── SPONSORS SECTION ── */}
      <SponsorsSection />

      {/* ── FOOTER ── */}
      <footer style={{ background: "#0A1F44", color: "#cbd5e1", padding: "32px 48px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            fontSize: 12, color: "#64748b", flexWrap: "wrap", gap: 8,
          }}>
            <span>© {new Date().getFullYear()} FamilyScreen AI. All rights reserved.</span>
            <span>For informational use only. Not a substitute for medical advice.</span>
          </div>
        </div>
      </footer>
    </main>
  )
}
