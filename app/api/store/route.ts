import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  
  if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 });
  
  if (!process.env.KV_REST_API_URL) {
    // Graceful fallback for local env when KV is not linked
    return NextResponse.json({ data: [] });
  }

  try {
    const data = await kv.get(key);
    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('KV GET Error:', error);
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key, data } = body;
    
    if (!key || data === undefined) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    
    if (!process.env.KV_REST_API_URL) {
      // Graceful local fallback to simulate success but discard
      return NextResponse.json({ success: true, warning: 'KV Not Linked' });
    }

    await kv.set(key, data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('KV POST Error:', error);
    return NextResponse.json({ error: 'Failed to write to KV' }, { status: 500 });
  }
}
