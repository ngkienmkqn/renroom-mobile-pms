import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { kv } from '@vercel/kv';

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

export async function POST() {
  try {
    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

    if (!vapidPublic || !vapidPrivate) {
      return NextResponse.json({
        success: false,
        error: 'VAPID keys chưa được cấu hình trên server. Hãy set NEXT_PUBLIC_VAPID_PUBLIC_KEY và VAPID_PRIVATE_KEY trong Vercel Environment Variables.'
      }, { status: 500 });
    }

    webpush.setVapidDetails(
      'mailto:admin@surihomestay.vn',
      vapidPublic,
      vapidPrivate
    );

    const client = getKVClient();
    let subs: any = await client.get('push_subs_admin');
    if (!subs || !Array.isArray(subs.data) || subs.data.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Chưa có thiết bị nào đăng ký nhận thông báo. Hãy bật "Báo di động" trước.'
      }, { status: 404 });
    }

    const payload = JSON.stringify({
      title: '🔔 Test Suri Home Stay',
      body: 'Push Notification đang hoạt động tốt! — ' + new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
    });

    const results = [];
    const failedEndpoints: number[] = [];

    for (let i = 0; i < subs.data.length; i++) {
      try {
        await webpush.sendNotification(subs.data[i], payload);
        results.push({ endpoint: subs.data[i].endpoint, status: 'ok' });
      } catch (err: any) {
        results.push({ endpoint: subs.data[i].endpoint, status: 'failed', error: err.message });
        // If subscription expired (410 Gone or 404), mark for removal
        if (err.statusCode === 410 || err.statusCode === 404) {
          failedEndpoints.push(i);
        }
      }
    }

    // Clean up expired subscriptions
    if (failedEndpoints.length > 0) {
      subs.data = subs.data.filter((_: any, idx: number) => !failedEndpoints.includes(idx));
      await client.set('push_subs_admin', subs);
    }

    return NextResponse.json({ success: true, results, totalSubs: subs.data.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
