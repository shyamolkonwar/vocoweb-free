import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/**
 * POST /api/voice/analyze
 * Analyzes user's text sample to extract their unique writing style
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { textSample } = body;

        if (!textSample || textSample.trim().length < 50) {
            return NextResponse.json(
                { error: 'Please provide at least 50 characters of sample text' },
                { status: 400 }
            );
        }

        // The Style Extractor System Prompt
        const styleExtractorPrompt = `You are a Linguistic Analyst. Your job is to analyze the STYLE of the following text, NOT the content.

Analyze the text and extract the following stylistic patterns:

1. **Tone**: What 2-3 adjectives best describe the voice? (e.g., "warm", "professional", "enthusiastic")
2. **Sentence Structure**: Are sentences short/punchy or long/flowing?
3. **Vocabulary Level**: Simple (Grade 6-8), Moderate, or Complex?
4. **Perspective**: First person (I/We) or Third person?
5. **Emoji Usage**: None, Sparse, or Heavy? What emojis are used?
6. **Key Phrases**: Any signature phrases or patterns?
7. **Things to Avoid**: Words or phrases this voice would NEVER use

Based on your analysis, create a "Voice Profile" that another AI can use to write in this exact style.

TEXT TO ANALYZE:
"""
${textSample}
"""

Respond ONLY with a valid JSON object in this exact format:
{
  "tone_label": "A creative 2-3 word label like 'The Friendly Expert' or 'The Bold Innovator'",
  "keywords": ["adjective1", "adjective2", "adjective3"],
  "sentence_style": "Short and punchy" or "Flowing and detailed",
  "vocabulary_level": "Simple" or "Moderate" or "Complex",
  "perspective": "First person (We/I)" or "Third person",
  "emoji_policy": "Description of emoji usage or 'None'",
  "rules": [
    "Specific writing rule based on the sample",
    "Another specific rule",
    "A third rule"
  ],
  "forbidden_words": ["word1", "word2"],
  "sample_snippet": "A short 5-10 word example phrase that captures this voice"
}`;

        // Call the backend to analyze
        const response = await fetch(`${BACKEND_URL}/api/voice/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text_sample: textSample,
                system_prompt: styleExtractorPrompt
            })
        });

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            // Fallback: Use a mock analysis for now (until backend is ready)
            const mockProfile = generateMockProfile(textSample);
            return NextResponse.json(mockProfile, { status: 200 });
        }

        const data = await response.json();

        if (response.ok) {
            return NextResponse.json(data, { status: 200 });
        } else {
            // Fallback to mock if backend fails
            const mockProfile = generateMockProfile(textSample);
            return NextResponse.json(mockProfile, { status: 200 });
        }

    } catch (error) {
        console.error('Voice analysis error:', error);
        // Return a sensible error
        return NextResponse.json(
            { error: 'Failed to analyze voice. Please try again.' },
            { status: 500 }
        );
    }
}

/**
 * Generate a mock voice profile based on simple text analysis
 * This is a fallback until the LLM backend is ready
 */
function generateMockProfile(text: string) {
    const wordCount = text.split(/\s+/).length;
    const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim()).length;
    const avgWordsPerSentence = wordCount / Math.max(sentenceCount, 1);

    const hasEmojis = /[\u{1F300}-\u{1F9FF}]/u.test(text);
    const usesFirstPerson = /\b(I|we|my|our|me)\b/i.test(text);
    const hasExclamations = (text.match(/!/g) || []).length > 2;

    // Determine tone based on analysis
    let toneLabel = "The Professional";
    let keywords = ["clear", "informative", "professional"];

    if (hasExclamations && hasEmojis) {
        toneLabel = "The Enthusiastic Creator";
        keywords = ["energetic", "friendly", "engaging"];
    } else if (hasExclamations) {
        toneLabel = "The Passionate Expert";
        keywords = ["confident", "direct", "passionate"];
    } else if (avgWordsPerSentence < 12) {
        toneLabel = "The Straight-Talker";
        keywords = ["concise", "direct", "no-nonsense"];
    }

    return {
        tone_label: toneLabel,
        keywords: keywords,
        sentence_style: avgWordsPerSentence < 15 ? "Short and punchy" : "Flowing and detailed",
        vocabulary_level: "Moderate",
        perspective: usesFirstPerson ? "First person (We/I)" : "Third person",
        emoji_policy: hasEmojis ? "Uses emojis to add personality" : "Minimal emoji usage",
        rules: [
            usesFirstPerson ? "Use 'We' to create connection with reader" : "Maintain professional third-person perspective",
            avgWordsPerSentence < 15 ? "Keep sentences short and impactful" : "Use detailed explanations when needed",
            hasExclamations ? "Use exclamation marks to show enthusiasm" : "Keep tone measured and professional"
        ],
        forbidden_words: ["synergy", "paradigm", "leverage", "utilize"],
        sample_snippet: text.split(/[.!?]/)[0]?.trim().slice(0, 50) + "..." || "Sample text here"
    };
}
