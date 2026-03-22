import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { branchLabel, branchDescription, agentPersonality, rootIdea } = await req.json();

    const model = genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',
      generationConfig: {
        temperature: 0.8,
        responseMimeType: 'application/json',
      },
    });

    // Run doc and mockup in parallel — cuts time roughly in half
    const docPromise = model.generateContent(`You are an AI agent on the "${branchLabel}" aspect of "${rootIdea}".
Personality: ${agentPersonality}
Description: ${branchDescription}

Return JSON with this EXACT structure:
{
  "thinkingSteps": ["short step 1", "short step 2", "short step 3"],
  "title": "2-4 word title",
  "summary": "One sentence summary",
  "content": "2-3 paragraphs with actionable insights. Use **bold** for key terms. Separate paragraphs with \\n\\n."
}

Rules:
- thinkingSteps: exactly 3 short messages under 8 words each
- content: 150-250 words, specific to "${branchLabel}" for "${rootIdea}"`);

    const mockupPromise = model.generateContent(`You are a senior product designer building a focused, data-driven mini tool for "${branchLabel}" within the context of "${rootIdea}".

Return JSON with this EXACT structure:
{ "html": "<!DOCTYPE html>...</html>" }

DESIGN RULES — follow these strictly, they are what separates great from generic:

Typography:
- Use system-ui or -apple-system, NOT Google Fonts
- One strong display size (28-36px) for the main number/stat/heading
- Body text at 13-14px, line-height 1.5
- Labels at 11px uppercase tracking-widest, color: #888
- No more than 3 font sizes total

Color:
- Pick ONE accent color appropriate to the topic. Use it sparingly (1-2 elements max)
- Background: #f8f8f6 or #0f0f0f (light or dark theme — pick one, commit to it)
- Text: high contrast — #111 on light, #f0f0f0 on dark
- No gradients on backgrounds. No rainbow palettes. No glassmorphism.
- Borders: 1px solid rgba(0,0,0,0.08) or rgba(255,255,255,0.08)

Layout:
- Dense, information-rich. Not spacious and airy.
- Use a grid or flex layout with real content, not placeholder lorem ipsum
- Cards with subtle borders, NOT drop shadows everywhere
- No border-radius above 8px except for pill badges (999px)

Interaction (pick ONE that fits the content):
- A filterable/sortable list
- A progress tracker with real milestones
- A metric dashboard with 3-4 real KPIs and a simple bar or sparkline (pure CSS or canvas)
- A timeline of events/phases
- A comparison matrix or scoring table
- A checklist with completion state

Content must be REAL and SPECIFIC to "${branchLabel}" for "${rootIdea}" — actual numbers, names, phases, metrics. Not "Item 1", "Metric A".

Technical:
- Complete HTML from <!DOCTYPE html> to </html>
- All CSS in a <style> tag
- Vanilla JS only, no libraries
- No external resources whatsoever
- Under 4000 characters total`);

    const [docResult, mockupResult] = await Promise.all([docPromise, mockupPromise]);

    const docData = JSON.parse(docResult.response.text());
    const mockupData = JSON.parse(mockupResult.response.text());

    return NextResponse.json({
      thinkingSteps: docData.thinkingSteps || [`Analyzing ${branchLabel}...`, 'Gathering insights...', 'Done.'],
      deliverables: [
        {
          title: docData.title || branchLabel,
          summary: docData.summary || '',
          content: docData.content || '',
          type: 'doc',
        },
        {
          title: `${branchLabel} Dashboard`,
          summary: `An interactive overview of ${branchLabel}.`,
          html: mockupData.html || '',
          type: 'mockup',
        },
      ],
    });
  } catch (error: any) {
    console.error('Agent think error:', error);

    return NextResponse.json({
      thinkingSteps: ['Analyzing...', 'Gathering insights...', 'Preparing findings...'],
      deliverables: [
        {
          title: 'Analysis',
          summary: 'A preliminary overview.',
          content: 'Analysis is being prepared.',
          type: 'doc',
        },
      ],
    });
  }
}
