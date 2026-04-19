"use client"

import { useState } from "react"
import { Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export function UpgradeButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleUpgrade = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`${API_BASE_URL}/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_email: "user@example.com", // TODO: Replace with actual user email when auth is added
          user_id: `user_${Date.now()}`, // TODO: Replace with actual user ID when auth is added
          success_url: `${window.location.origin}/success`,
          cancel_url: `${window.location.origin}`,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create checkout session")
      }

      const data = await response.json()
      
      // Redirect to Stripe Checkout
      window.location.href = data.checkout_url
    } catch (error) {
      console.error("Upgrade error:", error)
      alert("Failed to start checkout. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleUpgrade}
      disabled={isLoading}
      size="lg"
      className="w-full sm:w-auto"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 size-4" />
          Upgrade to Premium - $15/month
        </>
      )}
    </Button>
  )
}
