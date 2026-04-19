"use client"

import { useState, useEffect, useRef } from "react"
import { Volume2, VolumeX, Mic, MicOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VoiceGuidedInputProps {
  label: string
  prompt: string // What the AI should say
  value: string
  onChange: (value: string) => void
  type?: "text" | "number" | "select"
  options?: { label: string; value: string }[]
  placeholder?: string
  autoSpeak?: boolean // Auto-speak prompt when component mounts
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export function VoiceGuidedInput({
  label,
  prompt,
  value,
  onChange,
  type = "text",
  options = [],
  placeholder,
  autoSpeak = false,
}: VoiceGuidedInputProps) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const hasSpokenRef = useRef(false)

  // Auto-speak prompt when component mounts (only once)
  useEffect(() => {
    if (autoSpeak && !hasSpokenRef.current && audioEnabled) {
      hasSpokenRef.current = true
      speakPrompt()
    }
  }, [autoSpeak, audioEnabled])

  const speakPrompt = async () => {
    if (isSpeaking) return

    try {
      setIsSpeaking(true)

      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }

      const response = await fetch(`${API_BASE_URL}/text-to-speech`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: prompt,
          voice_id: "21m00Tcm4TlvDq8ikWAM", // Rachel voice (calm, professional)
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate speech")
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      audioRef.current = audio

      audio.onended = () => {
        setIsSpeaking(false)
        URL.revokeObjectURL(audioUrl)
      }

      audio.onerror = () => {
        setIsSpeaking(false)
        URL.revokeObjectURL(audioUrl)
      }

      await audio.play()
    } catch (err) {
      console.error("Text-to-speech failed:", err)
      setIsSpeaking(false)
    }
  }

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setIsSpeaking(false)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" })
        await transcribeAudio(blob)
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    } catch (err) {
      console.error("Microphone access denied:", err)
      alert("Please allow microphone access to use voice input")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const transcribeAudio = async (audioBlob: Blob) => {
    const formData = new FormData()
    formData.append("audio", audioBlob, "recording.webm")

    try {
      setIsTranscribing(true)
      const response = await fetch(`${API_BASE_URL}/transcribe-audio`, {
        method: "POST",
        body: formData,
      })

      console.log("STT response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("STT API error:", response.status, errorText)
        alert(`Transcription failed: ${response.status} - ${errorText}`)
        return
      }

      const result = await response.json()
      console.log("STT result received:", result)
      
      if (result.success && result.text) {
        let transcribedText = result.text.trim()
        console.log("Raw transcribed text:", transcribedText)
        
        // For select inputs, try to match to an option
        if (type === "select" && options.length > 0) {
          const matchedOption = findBestMatch(transcribedText, options)
          if (matchedOption) {
            console.log("Matched to option:", matchedOption.value)
            onChange(matchedOption.value)
          } else {
            console.log("No match found for:", transcribedText)
            alert(`Could not match "${transcribedText}" to any option. Please try again or type manually.`)
          }
        } 
        // For number inputs, convert words to numbers
        else if (type === "number") {
          const numberValue = convertWordsToNumber(transcribedText)
          console.log("Converted to number:", numberValue)
          onChange(numberValue)
        }
        // For text inputs, use as-is
        else {
          console.log("Setting text value:", transcribedText)
          onChange(transcribedText)
        }
      } else {
        console.error("Transcription failed - missing success or text:", result)
        alert(`Transcription failed: ${result.error || "Unknown error"}`)
      }
    } catch (err) {
      console.error("Transcription exception:", err)
      alert(`Transcription error: ${err}`)
    } finally {
      setIsTranscribing(false)
    }
  }

  // Helper: Find best matching option for select inputs
  const findBestMatch = (text: string, options: { label: string; value: string }[]) => {
    const lowerText = text.toLowerCase().replace(/[^a-z0-9]/g, "")
    
    // Phonetic/homophone corrections for common mishearings
    const phoneticMap: { [key: string]: string } = {
      "mail": "male",
      "male": "male",
      "femail": "female",
      "femael": "female",
      "femaile": "female",
      "mother": "mother",
      "mutter": "mother",
      "father": "father",
      "farther": "father",
      "sister": "sister",
      "brother": "brother",
      "ant": "aunt",
      "awnt": "aunt",
      "uncle": "uncle",
      "unkle": "uncle",
      "cousin": "cousin",
      "cuzin": "cousin",
      "grandmother": "grandmother",
      "grandma": "grandmother",
      "grandfather": "grandfather",
      "grandpa": "grandfather",
      "breast": "breast",
      "brest": "breast",
      "colon": "colorectal",
      "colorectal": "colorectal",
      "lung": "lung",
      "prostate": "prostate",
      "prostrate": "prostate",
      "cervical": "cervical",
      "survical": "cervical",
      "melanoma": "melanoma",
      "melonoma": "melanoma",
      "ovarian": "ovarian",
      "pancreatic": "pancreatic",
      "pancreattic": "pancreatic",
    }
    
    // Apply phonetic correction
    const correctedText = phoneticMap[lowerText] || lowerText
    
    // Try exact match with corrected text
    for (const opt of options) {
      const lowerLabel = opt.label.toLowerCase().replace(/[^a-z0-9]/g, "")
      const lowerValue = opt.value.toLowerCase().replace(/[^a-z0-9]/g, "")
      if (correctedText === lowerLabel || correctedText === lowerValue) {
        return opt
      }
    }
    
    // Try partial match with corrected text
    for (const opt of options) {
      const lowerLabel = opt.label.toLowerCase().replace(/[^a-z0-9]/g, "")
      const lowerValue = opt.value.toLowerCase().replace(/[^a-z0-9]/g, "")
      if (lowerLabel.includes(correctedText) || correctedText.includes(lowerLabel) ||
          lowerValue.includes(correctedText) || correctedText.includes(lowerValue)) {
        return opt
      }
    }
    
    return null
  }

  // Helper: Convert spoken numbers to digits
  const convertWordsToNumber = (text: string): string => {
    const numberWords: { [key: string]: number } = {
      zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
      six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
      eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
      sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
      thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90
    }
    
    // Remove punctuation and convert to lowercase
    const cleaned = text.toLowerCase().replace(/[^a-z0-9\s-]/g, "")
    
    // Check if it's already a number
    if (/^\d+$/.test(cleaned.trim())) {
      return cleaned.trim()
    }
    
    // Handle compound numbers like "thirty-five" or "thirty five"
    const parts = cleaned.split(/[\s-]+/)
    let total = 0
    
    for (const part of parts) {
      if (numberWords[part] !== undefined) {
        total += numberWords[part]
      }
    }
    
    return total > 0 ? total.toString() : text
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <div className="flex items-center gap-2">
          {/* Toggle audio on/off */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setAudioEnabled(!audioEnabled)
              if (isSpeaking) stopSpeaking()
            }}
            className="h-8 w-8 p-0"
          >
            {audioEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>

          {/* Speak prompt button */}
          {audioEnabled && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={isSpeaking ? stopSpeaking : speakPrompt}
              disabled={isRecording || isTranscribing}
              className="h-8"
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="mr-1 h-3 w-3" />
                  Stop
                </>
              ) : (
                <>
                  <Volume2 className="mr-1 h-3 w-3" />
                  Hear Question
                </>
              )}
            </Button>
          )}

          {/* Voice input button */}
          <Button
            type="button"
            variant={isRecording ? "destructive" : "secondary"}
            size="sm"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isSpeaking || isTranscribing}
            className={`h-8 ${isRecording ? "animate-pulse" : ""}`}
          >
            {isTranscribing ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Processing...
              </>
            ) : isRecording ? (
              <>
                <MicOff className="mr-1 h-3 w-3" />
                Stop
              </>
            ) : (
              <>
                <Mic className="mr-1 h-3 w-3" />
                Voice
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Input field */}
      {type === "select" ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          disabled={isRecording || isTranscribing}
        >
          <option value="">Select...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          disabled={isRecording || isTranscribing}
        />
      )}

      {/* Recording indicator */}
      {isRecording && (
        <p className="text-xs text-muted-foreground animate-pulse">
          🎙️ Recording... Speak your answer clearly
        </p>
      )}

      {/* Transcribing indicator */}
      {isTranscribing && (
        <p className="text-xs text-muted-foreground">
          ⏳ Transcribing your response...
        </p>
      )}
    </div>
  )
}
