import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { clusterLabel, thoughts, nodeIds } = await req.json();

    // Try different model names
    const modelNames = ['gemini-3.0-flash', 'gemini-2.0-flash-exp', 'gemini-1.5-flash'];
    let model;

    for (const modelName of modelNames) {
      try {
        model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.9, // Higher temperature for creativity
          },
        });
        break;
      } catch (e) {
        continue;
      }
    }

    if (!model) {
      throw new Error('No available Gemini model found');
    }

    const prompt = `You are a creative brainstorming partner.

Given this cluster of related thoughts about "${clusterLabel}":
${thoughts.map((t: string, i: number) => `${i}. "${t}"`).join('\n')}

Generate 2-3 new ideas that:
- Build on these thoughts in unexpected ways
- Challenge assumptions or suggest new angles
- Propose concrete next steps or actions
- Are creative but grounded in the existing context

Return JSON with this structure:
{
  "ideas": [
    {
      "text": "Your idea here",
      "relatedToIndices": [0, 2]
    }
  ]
}

Rules:
- Each idea MUST be under 20 words
- Be specific and actionable, not generic
- relatedToIndices should reference which input thoughts (by index) this idea builds on
- Make connections that aren't obvious`;

    const result = await model.generateContent(prompt);
    const data = JSON.parse(result.response.text());

    // Map indices to actual node IDs
    const ideas = data.ideas.map((idea: any) => ({
      text: idea.text,
      relatedNodeIds: idea.relatedToIndices.map((idx: number) => nodeIds[idx]).filter(Boolean),
    }));

    return NextResponse.json({ ideas });
  } catch (error: any) {
    console.error('Brainstorm error:', error);
    return NextResponse.json(
      { error: 'Failed to brainstorm', details: error.message },
      { status: 500 }
    );
  }
}
