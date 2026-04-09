import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

function getKVClient() {
  const customPrefix = process.env.UPSTASH_REDIS_REST_URL_PREFIX;
  if (customPrefix) {
    // If running in a marketplace linked project with prefix
    const url = process.env[`${customPrefix}_KV_REST_API_URL`];
    const token = process.env[`${customPrefix}_KV_REST_API_TOKEN`];
    if (url && token) {
      const { createClient } = require('@vercel/kv');
      return createClient({ url, token });
    }
  }
  // Default KV
  return kv;
}

export async function POST(req: Request) {
  try {
    const subscription = await req.json();
    const client = getKVClient();

    // In a real multi-user app, you'd store an array of subs per user
    // Here we just store an array of admin push subscriptions globally
    let subs: any = await client.get('push_subs_admin');
    if (!subs || !Array.isArray(subs.data)) subs = { data: [] };

    // Prevent duplicates by comparing endpoint
    const exists = subs.data.some((s: any) => s.endpoint === subscription.endpoint);
    if (!exists) {
      subs.data.push(subscription);
      await client.set('push_subs_admin', subs);
    }
    
    return NextResponse.json({ success: true, message: 'Subscribed to push' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
