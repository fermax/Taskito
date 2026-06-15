import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createRateLimiter } from '@/lib/rate-limit'
import { z } from 'zod'

const rateLimiter = createRateLimiter({ interval: 60_000, maxRequests: 10 })

const RequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(10000),
  })).max(50),
  context: z.array(z.object({
    title: z.string().max(200),
    priority: z.string(),
    due_date: z.string(),
  })).max(100).optional(),
})

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in first.' }, { status: 401 })
    }

    const rateLimitResult = rateLimiter.check(user.id)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before sending another message.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000)),
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }

    const origin = req.headers.get('origin')
    const allowedOrigins = [process.env.NEXT_PUBLIC_APP_URL, 'http://localhost:3000']
    if (origin && !allowedOrigins.includes(origin)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const rawBody = await req.json()
    const parsed = RequestSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    const { messages, context } = parsed.data
    const apiKey = process.env.AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'AI API Key not configured' }, { status: 500 });
    }

    const systemPrompt = `You are the Taskito AI assistant, a professional productivity coach. 
    Your goal is to help users stay organized and productive.
    
    Capabilities:
    1. Break down large tasks into smaller, manageable sub-tasks.
    2. Analyze the user's current task list (provided in context) and suggest priorities.
    3. Answer productivity-related questions with actionable advice.
    
    Context about user's tasks: ${JSON.stringify(context)}
    
    Guidelines:
    - Be concise and direct.
    - Use bullet points for task breakdowns.
    - Be encouraging but firm about productivity.
    - If the user asks to break down a task, provide a numbered list of steps.`;

    const openrouterMessages: { role: string; content: string }[] = [
      { role: 'system', content: systemPrompt },
    ];

    for (const m of messages) {
      const role = m.role === 'assistant' ? 'assistant' : 'user';
      openrouterMessages.push({ role, content: m.content });
    }

    const body = JSON.stringify({
      model: 'openai/gpt-4o-mini',
      messages: openrouterMessages,
    });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Taskito',
      },
      body,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('OpenRouter error:', response.status, text);
      return NextResponse.json({ error: 'AI service temporarily unavailable' }, { status: 502 });
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      return NextResponse.json({ error: 'AI returned an empty response' }, { status: 500 });
    }

    const messageContent = data.choices[0].message.content;
    return NextResponse.json(
      { message: messageContent },
      {
        headers: {
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
        },
      }
    )
  } catch (error) {
    console.error('AI API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
