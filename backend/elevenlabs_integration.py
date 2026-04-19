"""
ElevenLabs Speech-to-Text and Text-to-Speech Integration for FamilyScreen AI
Provides voice input capabilities for family history and health assistant
"""

import os
from typing import Optional
from elevenlabs import ElevenLabs
import httpx

def get_elevenlabs_client() -> Optional[ElevenLabs]:
    """Initialize ElevenLabs client with API key from environment"""
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        return None
    return ElevenLabs(api_key=api_key)

async def transcribe_audio(audio_file_bytes: bytes, filename: str = "audio.webm") -> dict:
    """
    Transcribe audio file to text using ElevenLabs Scribe v2 Speech-to-Text API
    
    Args:
        audio_file_bytes: Raw audio file bytes
        filename: Original filename (helps with format detection)
    
    Returns:
        dict with 'text' key containing transcription or 'error' key
    """
    try:
        api_key = os.getenv("ELEVENLABS_API_KEY")
        if not api_key:
            return {
                "error": "ElevenLabs API key not configured",
                "text": ""
            }
        
        print(f"🔑 ElevenLabs API key found: {api_key[:10]}...")
        print(f"📁 Transcribing file: {filename}, size: {len(audio_file_bytes)} bytes")
        
        # ElevenLabs Scribe v2 Speech-to-Text API endpoint
        async with httpx.AsyncClient() as client:
            # IMPORTANT: ElevenLabs expects the parameter to be named "file" not "audio"
            files = {
                "file": (filename, audio_file_bytes, "audio/webm"),
            }
            headers = {
                "xi-api-key": api_key
            }
            
            # Optional parameters for better transcription
            data = {
                "model_id": "scribe_v2",  # Use Scribe v2 model
                "language_code": "en",     # English
            }
            
            print(f"📡 Calling ElevenLabs API: https://api.elevenlabs.io/v1/speech-to-text")
            response = await client.post(
                "https://api.elevenlabs.io/v1/speech-to-text",
                files=files,
                data=data,
                headers=headers,
                timeout=30.0
            )
            
            print(f"📥 Response status: {response.status_code}")
            print(f"📥 Response body: {response.text[:500]}")
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "text": result.get("text", ""),
                    "error": None
                }
            else:
                error_detail = response.text
                return {
                    "error": f"ElevenLabs STT error: {response.status_code} - {error_detail}",
                    "text": ""
                }
                
    except Exception as e:
        print(f"❌ Exception in transcribe_audio: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "error": f"Transcription failed: {str(e)}",
            "text": ""
        }

# Text-to-Speech using ElevenLabs
async def text_to_speech(text: str, voice_id: str = "21m00Tcm4TlvDq8ikWAM") -> Optional[bytes]:
    """
    Convert text to speech using ElevenLabs TTS
    
    Args:
        text: Text to convert to speech
        voice_id: ElevenLabs voice ID (default is Rachel voice)
    
    Returns:
        Audio bytes or None if failed
    """
    try:
        client = get_elevenlabs_client()
        if not client:
            return None
        
        # Generate speech using v2 SDK
        response = client.text_to_speech.convert(
            voice_id=voice_id,
            text=text,
            model_id="eleven_monolingual_v1"
        )
        
        # Collect audio bytes from iterator
        audio_bytes = b"".join(response)
        return audio_bytes
        
    except Exception as e:
        print(f"TTS failed: {str(e)}")
        return None
