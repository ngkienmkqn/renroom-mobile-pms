import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import webpush from 'web-push';

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
    const privKey = process.env.VAPID_PRIVATE_KEY;
    const pubKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
    
    if (!privKey || !pubKey) {
      return NextResponse.json({ success: false, error: 'Khoá VAPID Key chưa được nạp vào hệ thống. Bạn cần "Redeploy" Vercel để áp dụng khoá.' }, { status: 400 });
    }

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:admin@surihomestay.vn',
      pubKey,
      privKey
    );

    const client = getKVClient();
    
    // Fetch upcoming bookings
    const rawBookings: any = await client.get('bookings');
    const bookings = rawBookings?.data || [];
    
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
        console.error('Failed to send to sub', err);
      }
    }

    return NextResponse.json({ success: true, sentNotifications: sent });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
