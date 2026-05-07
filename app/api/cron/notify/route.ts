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
    const privKey = process.env.VAPID_PRIVATE_KEY;
    const pubKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
    
    if (!privKey || !pubKey) {
      return NextResponse.json({ success: false, error: 'VAPID keys chưa cấu hình' }, { status: 400 });
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
    
    // Fetch Data
    const bookingsRaw: any = await client.get('bookings');
    const allBookings = Array.isArray(bookingsRaw) ? bookingsRaw : (bookingsRaw?.data || []);
    
    const settingsRaw: any = await client.get('admin_notif_settings');
    const settings = settingsRaw?.data || settingsRaw || {};
    const notifCheckin = settings.notifCheckin ?? true;
    const notifPayment = settings.notifPayment ?? true;
    const notifReport = settings.notifReport ?? false;
    const notifTiming = settings.notifTiming || '1h'; // 'exact', '1h', '2h'

    let notifiedEvents: string[] = await client.get('notified_events') || [];
    
    // Clean up old events (keep only last 200 to prevent KV bloat)
    if (notifiedEvents.length > 200) {
      notifiedEvents = notifiedEvents.slice(-200);
    }

    const nowMs = Date.now();
    let timingMs = 60 * 60 * 1000; // 1h
    if (notifTiming === '2h') timingMs = 2 * 60 * 60 * 1000;
    if (notifTiming === 'exact') timingMs = 0;

    const payloadsToSend: any[] = [];
    const newNotifiedEvents = [...notifiedEvents];

    if (notifCheckin) {
      for (const b of allBookings) {
        if (b.status === 'cancelled') continue;
        
        // Parse time as VN Time (UTC+7)
        if (b.checkIn) {
          const ciTime = new Date(`${b.checkIn}+07:00`).getTime();
          const diff = ciTime - nowMs;
          if (diff <= timingMs && diff > -2 * 60 * 60 * 1000) { // Trong khung giờ, không gửi nếu đã quá 2h
            const eventId = `ci_${b.id}`;
            if (!newNotifiedEvents.includes(eventId)) {
              payloadsToSend.push({
                title: `🛎️ Khách sắp Check-in!`,
                body: `Khách ${b.guestName} sắp nhận phòng ${b.room} lúc ${b.checkIn.split('T')[1] || b.checkIn}.`,
              });
              newNotifiedEvents.push(eventId);
            }
          }
        }

        if (b.checkOut) {
          const coTime = new Date(`${b.checkOut}+07:00`).getTime();
          const diff = coTime - nowMs;
          if (diff <= timingMs && diff > -2 * 60 * 60 * 1000) {
            const eventId = `co_${b.id}`;
            if (!newNotifiedEvents.includes(eventId)) {
              payloadsToSend.push({
                title: `🧹 Sắp trả phòng!`,
                body: `Khách ${b.guestName} trả phòng ${b.room} lúc ${b.checkOut.split('T')[1] || b.checkOut}. Vui lòng dọn dẹp.`,
              });
              newNotifiedEvents.push(eventId);
            }
          }
        }
      }
    }

    // Daily Report (21:00 VN Time)
    if (notifReport) {
      const vnNow = new Date(nowMs + 7 * 60 * 60 * 1000);
      const h = vnNow.getUTCHours();
      const todayStr = `${vnNow.getUTCFullYear()}-${String(vnNow.getUTCMonth()+1).padStart(2,'0')}-${String(vnNow.getUTCDate()).padStart(2,'0')}`;
      
      if (h >= 21) {
        const eventId = `report_${todayStr}`;
        if (!newNotifiedEvents.includes(eventId)) {
          const todayCheckIns = allBookings.filter((b: any) => b.checkIn?.startsWith(todayStr) && b.status !== 'cancelled').length;
          const todayCheckOuts = allBookings.filter((b: any) => b.checkOut?.startsWith(todayStr) && b.status !== 'cancelled').length;
          
          payloadsToSend.push({
            title: `📊 Báo cáo ngày ${todayStr}`,
            body: `Hôm nay có ${todayCheckIns} check-in và ${todayCheckOuts} check-out.`
          });
          newNotifiedEvents.push(eventId);
        }
      }
    }

    // Update KV if changed
    if (newNotifiedEvents.length > notifiedEvents.length) {
      await client.set('notified_events', newNotifiedEvents);
    }

    if (payloadsToSend.length === 0) {
      return NextResponse.json({ success: true, message: 'No events to notify right now.' });
    }

    // Get Admin Subscriptions
    const subs: any = await client.get('push_subs_admin');
    const subscribers = Array.isArray(subs) ? subs : (subs?.data || []);

    if (subscribers.length === 0) {
      return NextResponse.json({ success: true, message: 'No push subscribers found.' });
    }

    let sent = 0;
    const failed: string[] = [];
    for (const payload of payloadsToSend) {
      const pushData = JSON.stringify(payload);
      for (const sub of subscribers) {
        try {
          await webpush.sendNotification(sub, pushData);
          sent++;
        } catch (err: any) {
          failed.push(err.statusCode?.toString() || 'unknown');
        }
      }
    }

    return NextResponse.json({ success: true, sentNotifications: sent, payloads: payloadsToSend });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
