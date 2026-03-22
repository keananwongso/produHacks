import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { topic, count = 1, focus = '' } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    console.log('🎨 Creating mockup task:', topic);

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({ type: 'mockup', input: { topic, count, focus } })
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to create task:', error);
      return NextResponse.json(
        { error: 'Failed to create mockup task', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Task created:', task.id);
    return NextResponse.json({ taskId: task.id });
  } catch (error: any) {
    console.error('Mockup error:', error);
    return NextResponse.json(
      { error: 'Failed to create mockup', details: error.message },
      { status: 500 }
    );
  }
}
