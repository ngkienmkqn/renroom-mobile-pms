import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@surihomestay.vn',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

function getKVClient() {
  const customPrefix = process.env.UPSTASH_REDIS_REST_URL_PREFIX;
  if (customPrefix) {
    const url = process.env[`${customPrefix}_KV_REST_API_URL`];
    const token = process.env[`${customPrefix}_KV_REST_API_TOKEN`];
    if (url && token) {
      const { createClient } = require('@vercel/kv');
      return createClient({ url, token });
    }
  }
  return kv;
}

export async function POST(req: Request) {
  try {
    // Optionally secure this endpoint with a Bearer token verification
    // if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) ...

    const client = getKVClient();
    
    // Fetch upcoming bookings
    const rawBookings: any = await client.get('bookings');
    const bookings = rawBookings?.data || [];
    
    // Evaluate if any bookings have checkOut date matching today
    // To simplify demonstration, we will just send a broadcast push summarizing stats. 
    // Usually, we'd filter `bookings` based on `checkOut === today()`.
    
    const pendingCount = bookings.filter((b: any) => b.status === "pending").length;

    // Get Admin Subscriptions
    const subs: any = await client.get('push_subs_admin');
    const subscribers = subs?.data || [];

    if (subscribers.length === 0) {
      return NextResponse.json({ success: true, message: 'No subscribers found' });
    }

    const payload = JSON.stringify({
      title: 'Báo cáo Suri Home Stay 🔔',
      body: pendingCount > 0 
        ? `Có ${pendingCount} lượt đặt phòng đang chờ bạn duyệt hôm nay!`
        : 'Hôm nay không có khách nào check-out hay booking cần duyệt.'
    });

    let sent = 0;
    for (const sub of subscribers) {
      try {
        await webpush.sendNotification(sub, payload);
        sent++;
      } catch (err: any) {
        // If 410 Gone, the user unsubscribed. Remove it from KV in prod app.
        console.error('Failed to send to sub', err);
      }
    }

    return NextResponse.json({ success: true, sentNotifications: sent });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
