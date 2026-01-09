import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cleanPhoneNumber } from '@/lib/whatsapp';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Voice Profile interface
interface VoiceProfile {
  tone_label: string;
  keywords: string[];
  sentence_style: string;
  vocabulary_level: string;
  perspective: string;
  emoji_policy: string;
  rules: string[];
  forbidden_words: string[];
  sample_snippet: string;
}

/**
 * Constructs a style guide prompt from the voice profile
 * This is injected into the AI's system prompt for content generation
 */
function buildStyleGuide(profile: VoiceProfile): string {
  return `
WRITING STYLE GUIDE:
- Voice Persona: "${profile.tone_label}"
- Tone Keywords: ${profile.keywords.join(', ')}
- Sentence Style: ${profile.sentence_style}
- Vocabulary Level: ${profile.vocabulary_level}
- Perspective: ${profile.perspective}
- Emoji Policy: ${profile.emoji_policy}

Writing Rules:
${profile.rules.map(rule => `- ${rule}`).join('\n')}

Words to AVOID: ${profile.forbidden_words.join(', ') || 'None specified'}

Example of this voice: "${profile.sample_snippet}"
`.trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      description,
      language = 'en',
      voiceProfile,
      whatsappPhone,
      whatsappMessage,
      market = 'GLOBAL',
      user_images = []
    } = body;

    if (!description || description.trim().length < 20) {
      return NextResponse.json(
        { error: 'Description must be at least 20 characters' },
        { status: 400 }
      );
    }

    // Get auth token from Supabase session
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return NextResponse.json(
        { error: 'Please log in to generate a website', requiresAuth: true },
        { status: 401 }
      );
    }

    // Build the request payload for backend
    const backendPayload: {
      description: string;
      language: string;
      style_guide?: string;
      voice_profile?: VoiceProfile;
      whatsapp_number?: string;
      whatsapp_message?: string;
      whatsapp_enabled?: boolean;
      user_images?: string[];
    } = {
      description,
      language
    };

    // Add voice profile / style guide if provided
    if (voiceProfile) {
      backendPayload.style_guide = buildStyleGuide(voiceProfile);
      backendPayload.voice_profile = voiceProfile;
    }

    // Add WhatsApp settings if provided
    if (whatsappPhone) {
      backendPayload.whatsapp_number = cleanPhoneNumber(whatsappPhone);
      backendPayload.whatsapp_message = whatsappMessage || '';
      backendPayload.whatsapp_enabled = true;
    }

    // Add user images if provided (India market feature)
    if (user_images && user_images.length > 0) {
      backendPayload.user_images = user_images;
    }

    // Call backend API with auth token and market header
    const response = await fetch(`${BACKEND_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'x-market': market  // NEW: Market header for backend logic
      },
      body: JSON.stringify(backendPayload)
    });

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Backend returned non-JSON response:', await response.text());
      return NextResponse.json(
        { error: 'Backend service is unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json(data, { status: 201 });
    } else if (response.status === 401) {
      return NextResponse.json(
        { error: 'Please log in to generate a website', requiresAuth: true },
        { status: 401 }
      );
    } else if (response.status === 402) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please purchase more credits.', insufficientCredits: true },
        { status: 402 }
      );
    } else {
      return NextResponse.json(
        { error: data.detail || 'Failed to generate website' },
        { status: response.status }
      );
    }

  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate website' },
      { status: 500 }
    );
  }
}
