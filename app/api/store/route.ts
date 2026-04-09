import { createClient } from '@vercel/kv';
import { NextResponse } from 'next/server';

// Dynamically resolve Upstash/KV environment vars even if user set a custom Prefix (e.g. surihomestay_KV_...)
const getClient = () => {
  const envKeys = Object.keys(process.env);
  
  const urlKey = envKeys.find(k => k === 'KV_REST_API_URL' || k.endsWith('_KV_REST_API_URL') || k === 'UPSTASH_REDIS_REST_URL' || k.endsWith('_UPSTASH_REDIS_REST_URL'));
  const tokenKey = envKeys.find(k => k === 'KV_REST_API_TOKEN' || k.endsWith('_KV_REST_API_TOKEN') || k === 'UPSTASH_REDIS_REST_TOKEN' || k.endsWith('_UPSTASH_REDIS_REST_TOKEN'));
  
  const url = urlKey ? process.env[urlKey] : undefined;
  const token = tokenKey ? process.env[tokenKey] : undefined;
  
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
