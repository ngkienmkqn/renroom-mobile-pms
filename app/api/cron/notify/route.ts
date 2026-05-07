import { NextResponse } from 'next/server';
import { createClient } from '@vercel/kv';
import webpush from 'web-push';

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
    const privKey = process.env.VAPID_PRIVATE_KEY;
    const pubKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
    
    if (!privKey || !pubKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'VAPID keys chưa được cấu hình. Cần set NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY trong Vercel Environment Variables rồi Redeploy.',
        help: 'Vào Vercel Dashboard > Project > Settings > Environment Variables'
      }, { status: 400 });
    }

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:admin@surihomestay.vn',
      pubKey,
      privKey
    );

    const client = getClient();
    if (!client) {
      return NextResponse.json({ success: false, error: 'KV not configured' }, { status: 500 });
    }
    
    // Fetch upcoming bookings for smart notification
    const bookings: any = await client.get('bookings');
    const allBookings = Array.isArray(bookings) ? bookings : (bookings?.data || []);
    
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Find today's check-ins and check-outs
    const todayCheckIns = allBookings.filter((b: any) => b.checkIn?.startsWith(todayStr) && b.status !== 'cancelled');
    const todayCheckOuts = allBookings.filter((b: any) => b.checkOut?.startsWith(todayStr) && b.status !== 'cancelled');
    const pendingCount = allBookings.filter((b: any) => b.status === 'pending').length;

    // Build notification message
    const parts: string[] = [];
    if (todayCheckOuts.length > 0) {
      const rooms = todayCheckOuts.map((b: any) => b.room).join(', ');
      parts.push(`🧹 ${todayCheckOuts.length} phòng cần dọn hôm nay (${rooms})`);
    }
    if (todayCheckIns.length > 0) {
      const guests = todayCheckIns.map((b: any) => b.guestName).join(', ');
      parts.push(`🛎️ ${todayCheckIns.length} khách check-in (${guests})`);
    }
    if (pendingCount > 0) {
      parts.push(`⏳ ${pendingCount} booking đang chờ duyệt`);
    }
    
    const body = parts.length > 0 
      ? parts.join('\n')
      : '✅ Hôm nay không có check-in/check-out nào.';

    const payload = JSON.stringify({
      title: `🏠 Suri Home Stay — ${todayStr}`,
      body
    });

    // Get Admin Subscriptions
    const subs: any = await client.get('push_subs_admin');
    const subscribers = Array.isArray(subs) ? subs : (subs?.data || []);

    if (subscribers.length === 0) {
      return NextResponse.json({ success: true, message: 'No subscribers found. Vào Settings > Bật Push Notification trước.' });
    }

    let sent = 0;
    const failed: string[] = [];
    for (const sub of subscribers) {
      try {
        await webpush.sendNotification(sub, payload);
        sent++;
      } catch (err: any) {
        console.error('Failed to send push:', err.statusCode, err.body);
        failed.push(err.statusCode?.toString() || 'unknown');
      }
    }

    return NextResponse.json({ success: true, sentNotifications: sent, failedCount: failed.length, payload: JSON.parse(payload) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
