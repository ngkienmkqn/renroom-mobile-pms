import { createClient } from '@vercel/kv';
import { NextResponse } from 'next/server';

// Fallback to Upstash keys if Vercel KV keys are not configured due to the recent Vercel marketplace update
const getClient = () => {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) return null;
  return createClient({ url, token });
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  
  if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 });
  
  const client = getClient();
  if (!client) {
    // Graceful fallback for local env when KV/Upstash is not linked
    return NextResponse.json({ data: [] });
  }

  try {
    const data = await client.get(key);
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
    
    const client = getClient();
    if (!client) {
      // Graceful local fallback to simulate success but discard
      return NextResponse.json({ success: true, warning: 'KV Not Linked' });
    }

    await client.set(key, data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('KV POST Error:', error);
    return NextResponse.json({ error: 'Failed to write to KV' }, { status: 500 });
  }
}
