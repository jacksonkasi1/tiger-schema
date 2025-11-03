import { OpenAIStream, OpenAIStreamPayload } from '@/lib/openai-stream';

export const runtime = 'edge';

export async function POST(req: Request): Promise<Response> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return new Response('Missing OpenAI API key', { status: 500 });
    }

    const { schema, query } = (await req.json()) as {
      schema?: string;
      query?: string;
    };

    if (!query) {
      return new Response('No query in the request', { status: 400 });
    }

    const payload: OpenAIStreamPayload = {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are Postgres & Supabase expert. Translate given natural language query into SQL without changing the case of the entries given.',
        },
        {
          role: 'user',
          content: `### Postgres SQL tables, with their properties:\n#${schema}\n### ${query}\n`,
        },
      ],
      temperature: 0.7,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      max_tokens: 200,
      stream: true,
      n: 1,
    };

    const stream = await OpenAIStream(payload);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
