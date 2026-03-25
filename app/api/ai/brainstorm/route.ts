import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Support both old and new interfaces
    const topic = body.topic || body.clusterLabel;
    const count = Math.min(Number(body.count) || 3, 10);
    const focus = body.focus || '';

    if (!topic || typeof topic !== 'string' || topic.length > 1000) {
      return NextResponse.json(
        { error: 'A valid topic is required' },
        { status: 400 }
      );
    }

    console.log('🧠 Creating brainstorm task:', topic, '| Count:', count);

    // Create task in Supabase (Fetch.ai agent will pick it up)
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        type: 'brainstorm',
        input: { topic, count, focus }
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to create task:', error);
      return NextResponse.json(
        { error: 'Failed to create brainstorm task' },
        { status: 500 }
      );
    }

    console.log('✅ Task created:', task.id);

    // Return task ID so frontend can track it
    return NextResponse.json({ taskId: task.id });

  } catch (error: any) {
    console.error('Brainstorm error:', error);
    return NextResponse.json(
      { error: 'Failed to brainstorm' },
      { status: 500 }
    );
  }
}
