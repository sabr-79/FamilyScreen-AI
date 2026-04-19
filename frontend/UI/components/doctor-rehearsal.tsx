"use client"

import { useState, useCallback } from "react"
import { ConversationProvider, useConversation } from "@elevenlabs/react"
import { Phone, PhoneOff, Stethoscope, Mic } from "lucide-react"

const AGENT_ID = "agent_8201kpjcvj24fpy9kps84s8gr1jw"

interface Message {
  role: "user" | "agent"
  text: string
}

function RehearsalUI() {
  const [messages, setMessages] = useState<Message[]>([])
  const [hasStarted, setHasStarted] = useState(false)

  const conversation = useConversation({
    onConnect: () => console.log("Connected to Dr. Chen"),
    onDisconnect: () => console.log("Call ended"),
    onMessage: (message: { source: string; message: string }) => {
      setMessages((prev) => [
        ...prev,
        { role: message.source === "user" ? "user" : "agent", text: message.message },
      ])
    },
    onError: (error: unknown) => console.error("Conversation error:", error),
  })

  const startCall = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      await conversation.startSession({ agentId: AGENT_ID, connectionType: "websocket" })
      setHasStarted(true)
      setMessages([])
    } catch (err) {
      console.error("Failed to start:", err)
      alert("Please allow microphone access to talk to Dr. Chen.")
    }
  }, [conversation])

  const endCall = useCallback(async () => {
    await conversation.endSession()
    setHasStarted(false)
  }, [conversation])

  const isConnected = conversation.status === "connected"
  const isConnecting = conversation.status === "connecting"

  return (
    <div style={{ background: "white", border: "0.5px solid #e2e8f0", borderRadius: 16, padding: 32, boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -8px rgba(15,23,42,0.08)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, #2563EB, #1E3A8A)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px -2px rgba(37,99,235,0.4)" }}>
          <Stethoscope size={22} color="white" />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "#2563EB" }}>AI Rehearsal</div>
          <h3 style={{ fontFamily: "'Georgia', serif", fontSize: 24, fontWeight: 600, color: "#0A1F44", margin: "2px 0 0" }}>Practice with Dr. Chen</h3>
        </div>
      </div>

      <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6, margin: "0 0 24px" }}>
        Before your real doctor visit, rehearse the conversation with an AI physician. Ask questions, hear what to expect, and walk in prepared.
      </p>

      {!hasStarted && !isConnected && !isConnecting && (
        <button onClick={startCall} style={{ width: "100%", background: "#0A1F44", color: "white", border: 0, padding: "16px 24px", borderRadius: 12, fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", boxShadow: "0 6px 20px -4px rgba(10,31,68,0.4)" }}>
          <Phone size={18} />
          Start Rehearsal Call
        </button>
      )}

      {isConnecting && (
        <div style={{ padding: "16px", textAlign: "center", color: "#64748b", fontSize: 14, border: "0.5px dashed #cbd5e1", borderRadius: 12 }}>
          Connecting to Dr. Chen...
        </div>
      )}

      {isConnected && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", background: conversation.isSpeaking ? "#EFF6FF" : "#F0FDF4", border: "0.5px solid rgba(34,197,94,0.2)", borderRadius: 12, marginBottom: 16 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: conversation.isSpeaking ? "#2563EB" : "#22c55e" }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: "#0A1F44" }}>
              {conversation.isSpeaking ? "Dr. Chen is speaking..." : "Listening — speak now"}
            </span>
            <Mic size={16} color="#64748b" style={{ marginLeft: "auto" }} />
          </div>
          <button onClick={endCall} style={{ width: "100%", background: "transparent", color: "#DC2626", border: "0.5px solid #DC2626", padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}>
            <PhoneOff size={16} />
            End Call
          </button>
        </div>
      )}

      {messages.length > 0 && (
        <div style={{ marginTop: 20, padding: 16, background: "#f8fafc", borderRadius: 12, maxHeight: 240, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: "85%", padding: "10px 14px", borderRadius: 12, background: msg.role === "user" ? "#2563EB" : "white", color: msg.role === "user" ? "white" : "#0f172a", fontSize: 14, lineHeight: 1.5, border: msg.role === "agent" ? "0.5px solid #e2e8f0" : "none" }}>
                {msg.role === "agent" && (
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>Dr. Chen</div>
                )}
                {msg.text}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function DoctorRehearsal() {
  return (
    <ConversationProvider>
      <RehearsalUI />
    </ConversationProvider>
  )
}
