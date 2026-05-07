import { NextResponse } from 'next/server';
import webpush from 'web-push';
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

export async function POST() {
  try {
    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

    if (!vapidPublic || !vapidPrivate) {
      return NextResponse.json({
        success: false,
        error: 'VAPID keys chưa được cấu hình. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY trong Vercel Environment Variables.',
        missingKeys: { public: !vapidPublic, private: !vapidPrivate }
      }, { status: 500 });
    }

    webpush.setVapidDetails(
      'mailto:admin@surihomestay.vn',
      vapidPublic,
      vapidPrivate
    );

    const client = getClient();
    if (!client) {
      return NextResponse.json({ success: false, error: 'KV not configured' }, { status: 500 });
    }

    let subs: any = await client.get('push_subs_admin');
    const subscribers = Array.isArray(subs) ? subs : (subs?.data || []);
    
    if (subscribers.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Chưa có thiết bị nào đăng ký. Vào Settings > Bật "Báo di động (Push)" trước.'
      }, { status: 404 });
    }

    const payload = JSON.stringify({
      title: '🔔 Test Suri Home Stay',
      body: 'Push Notification đang hoạt động tốt! — ' + new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
    });

    const results = [];
    const expiredIndices: number[] = [];

    for (let i = 0; i < subscribers.length; i++) {
      try {
        await webpush.sendNotification(subscribers[i], payload);
        results.push({ index: i, status: 'ok' });
      } catch (err: any) {
        results.push({ index: i, status: 'failed', error: err.message, statusCode: err.statusCode });
        if (err.statusCode === 410 || err.statusCode === 404) {
          expiredIndices.push(i);
        }
      }
    }

    // Clean up expired subscriptions
    if (expiredIndices.length > 0) {
      const cleaned = subscribers.filter((_: any, idx: number) => !expiredIndices.includes(idx));
      await client.set('push_subs_admin', cleaned);
    }

    return NextResponse.json({ success: true, results, totalSubs: subscribers.length - expiredIndices.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
