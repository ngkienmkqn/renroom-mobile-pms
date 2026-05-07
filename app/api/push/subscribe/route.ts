import { NextResponse } from 'next/server';
import { createClient } from '@vercel/kv';

export const dynamic = 'force-dynamic';

const getClient = () => {
  const envKeys = Object.keys(process.env);
  const urlKey = envKeys.find(k => k === 'KV_REST_API_URL' || k.endsWith('_KV_REST_API_URL') || k === 'UPSTASH_REDIS_REST_URL' || k.endsWith('_UPSTASH_REDIS_REST_URL'));
  const tokenKey = envKeys.find(k => k === 'KV_REST_API_TOKEN' || k.endsWith('_KV_REST_API_TOKEN') || k === 'UPSTASH_REDIS_REST_TOKEN' || k.endsWith('_UPSTASH_REDIS_REST_TOKEN'));
  const url = urlKey ? process.env[urlKey] : undefined;
  const token = tokenKey ? process.env[tokenKey] : undefined;
  if (!url || !token) return null;
  return createClient({ url, token });
};

export async function POST(req: Request) {
  try {
    const subscription = await req.json();
    const client = getClient();
    if (!client) {
      return NextResponse.json({ success: false, error: 'KV not configured' }, { status: 500 });
    }

    // Store array of admin push subscriptions
    let subs: any = await client.get('push_subs_admin');
    if (!Array.isArray(subs)) subs = [];

    // Prevent duplicates by comparing endpoint
    const exists = subs.some((s: any) => s.endpoint === subscription.endpoint);
    if (!exists) {
      subs.push(subscription);
      await client.set('push_subs_admin', subs);
    }
    
    return NextResponse.json({ success: true, message: 'Subscribed to push', totalSubs: subs.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
