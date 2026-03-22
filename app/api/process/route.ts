import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  const { input, context } = await req.json();

  if (!input || input.trim().length === 0) {
    return NextResponse.json(
      { error: 'Input is required' },
      { status: 400 }
    );
  }

  try {
    console.log('🧠 Processing input:', input);

    // Use Gemini to understand intent and route to appropriate action
    const model = genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const prompt = `You are an intelligent router for a spatial brainstorming canvas with multiple AI agents.

User input: "${input}"

Current canvas context:
- Number of existing nodes: ${context?.nodeCount || 0}
- Existing topics: ${context?.topics?.join(', ') || 'none'}

Analyze the user's intent and route to the appropriate AI agent.

Available actions:
1. "brainstorm" - Generate creative ideas (user wants to explore, ideate, brainstorm)
2. "research" - Find facts, data, insights (user wants to learn or understand something)
3. "plan" - Create a timeline, task list, or project plan (user wants structure, steps, logistics)
4. "write" - Draft a document, email, or message (user wants written content or outreach)
5. "mockup" - Create a UI mockup, website design, or slide layout (user wants visual design)
6. "note" - Simple note to add to canvas (user is just capturing a quick thought)

Return JSON with this EXACT structure:
{
  "action": "brainstorm" | "research" | "plan" | "write" | "mockup" | "note",
  "parameters": {
    "topic": "main topic extracted from input",
    "count": 3-5,
    "focus": "specific aspect to focus on"
  },
  "summary": "One sentence describing what will happen"
}

Rules:
- Default to "brainstorm" if intent is unclear
- Use "plan" for logistics, timelines, schedules, checklists, project management
- Use "write" for emails, outreach, drafts, documents, messaging
- Use "mockup" for UI design, wireframes, slides, presentations, website layouts
- Extract the core topic/theme from the input
- count should be 3-5 for brainstorm/research, 1 for note/write/mockup/plan
- summary should be actionable and clear`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    console.log('Gemini routing response:', text);

    const data = JSON.parse(text);

    // Validate response structure
    if (!data.action || !data.parameters) {
      throw new Error('Invalid routing response structure');
    }

    return NextResponse.json({
      action: data.action,
      parameters: data.parameters,
      summary: data.summary,
      originalInput: input,
    });

  } catch (error: any) {
    console.error('❌ Process error:', error);

    // Fallback to simple note action if routing fails
    return NextResponse.json({
      action: 'note',
      parameters: {
        topic: input,
        count: 1,
        focus: 'capture thought',
      },
      summary: 'Adding your thought to the canvas',
      originalInput: input,
      error: error.message,
    });
  }
}
