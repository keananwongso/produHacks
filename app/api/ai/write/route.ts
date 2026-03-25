import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const topic = body.topic;
    const count = Math.min(Number(body.count) || 1, 10);
    const focus = body.focus || '';

    if (!topic || typeof topic !== 'string' || topic.length > 1000) {
      return NextResponse.json({ error: 'A valid topic is required' }, { status: 400 });
    }

    console.log('✍️ Creating write task:', topic);

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({ type: 'write', input: { topic, count, focus } })
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to create task:', error);
      return NextResponse.json(
        { error: 'Failed to create write task' },
        { status: 500 }
      );
    }

    console.log('✅ Task created:', task.id);
    return NextResponse.json({ taskId: task.id });
  } catch (error: any) {
    console.error('Write error:', error);
    return NextResponse.json(
      { error: 'Failed to write' },
      { status: 500 }
    );
  }
}
