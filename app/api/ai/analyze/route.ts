import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { nodes } = await req.json();

    if (!nodes || nodes.length < 2) {
      return NextResponse.json({ connections: [], clusters: [] });
    }

    // Try different model names in case gemini-3.0-flash doesn't exist
    const modelNames = ['gemini-3.0-flash', 'gemini-2.0-flash-exp', 'gemini-1.5-flash'];
    let model;

    for (const modelName of modelNames) {
      try {
        model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        });
        console.log(`✅ Using Gemini model: ${modelName}`);
        break;
      } catch (e) {
        console.log(`⚠️ Model ${modelName} not available, trying next...`);
        continue;
      }
    }

    if (!model) {
      throw new Error('No available Gemini model found');
    }

    const prompt = `You are a semantic analysis engine for a spatial brainstorming tool.

Given these thoughts, identify which ones are semantically related and group them into clusters.

Thoughts:
${nodes.map((n: any, i: number) => `${i}. "${n.text}" (id: ${n.id})`).join('\n')}

Analyze the semantic relationships and return JSON with this EXACT structure:

{
  "connections": [
    {"from": "node_id_1", "to": "node_id_2", "strength": 0.8}
  ],
  "clusters": [
    {"nodeIds": ["id1", "id2", "id3"], "label": "Short label"}
  ]
}

Rules:
- strength is 0 to 1, where 1 = very strongly related
- ONLY include connections with strength > 0.4
- Cluster labels MUST be 2-4 words maximum
- Each node can belong to at most ONE cluster
- Don't force connections — if thoughts are truly unrelated, return empty arrays
- Focus on semantic meaning, not just keyword matching
- Related thoughts should have similar themes, concepts, or goals`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    console.log('Gemini response:', text);

    const data = JSON.parse(text);

    // Validate response structure
    if (!data.connections || !data.clusters) {
      throw new Error('Invalid response structure');
    }

    // Filter weak connections
    const filteredConnections = data.connections.filter(
      (c: any) => c.strength > 0.4
    );

    return NextResponse.json({
      connections: filteredConnections,
      clusters: data.clusters,
    });
  } catch (error: any) {
    console.error('Analyze error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze nodes', details: error.message },
      { status: 500 }
    );
  }
}
