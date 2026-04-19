import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Extract patient name from body for query parameter
    const patientName = body.patient_name || 'Patient'
    delete body.patient_name // Remove from body since it goes in query params
    
    // Forward request to Python backend
    const backendResponse = await fetch(`${BACKEND_URL}/analyze-family-history?patient_name=${encodeURIComponent(patientName)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })
    
    if (!backendResponse.ok) {
      const errorText = await backendResponse.text()
      console.error('Backend error:', errorText)
      return NextResponse.json(
        { error: 'Backend analysis failed', details: errorText },
        { status: backendResponse.status }
      )
    }
    
    const result = await backendResponse.json()
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}