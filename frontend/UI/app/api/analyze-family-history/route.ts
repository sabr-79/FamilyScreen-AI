import { NextRequest, NextResponse } from 'next/server'

// Use 127.0.0.1 instead of localhost to avoid DNS resolution issues in Next.js API routes
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://127.0.0.1:8000'

export async function POST(request: NextRequest) {
  try {
    console.log('[API Route] Starting request processing')
    console.log('[API Route] Backend URL:', BACKEND_URL)
    
    const body = await request.json()
    console.log('[API Route] Request body received:', JSON.stringify(body).substring(0, 200))
    
    // Extract patient name from body for query parameter
    const patientName = body.patient_name || 'Patient'
    delete body.patient_name // Remove from body since it goes in query params
    
    const backendUrl = `${BACKEND_URL}/analyze-family-history?patient_name=${encodeURIComponent(patientName)}`
    console.log('[API Route] Calling backend:', backendUrl)
    
    // Forward request to Python backend with timeout
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      // Add signal for timeout (90 seconds for TinyFish scraping)
      signal: AbortSignal.timeout(90000)
    })
    
    console.log('[API Route] Backend response status:', backendResponse.status)
    
    if (!backendResponse.ok) {
      const errorText = await backendResponse.text()
      console.error('[API Route] Backend error:', errorText)
      return NextResponse.json(
        { error: 'Backend analysis failed', details: errorText },
        { status: backendResponse.status }
      )
    }
    
    const result = await backendResponse.json()
    console.log('[API Route] Success - returning result')
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('[API Route] Error caught:', error)
    
    // Provide more detailed error information
    let errorMessage = 'Unknown error'
    let errorDetails = ''
    
    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = error.stack || ''
      
      // Check for specific error types
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout - backend took too long to respond'
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Cannot connect to backend - is it running on port 8000?'
      } else if (error.message.includes('fetch failed')) {
        errorMessage = 'Network error connecting to backend. Check if backend is running at ' + BACKEND_URL
      }
    }
    
    console.error('[API Route] Error message:', errorMessage)
    console.error('[API Route] Error details:', errorDetails)
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: errorMessage,
        details: errorDetails,
        backendUrl: BACKEND_URL
      },
      { status: 500 }
    )
  }
}