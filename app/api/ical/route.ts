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

const parseVnTime = (dateStr: string | undefined | null) => {
  if (!dateStr) return 0;
  if (dateStr.endsWith('Z') || dateStr.includes('+')) return new Date(dateStr).getTime();
  if (!dateStr.includes('T')) return new Date(`${dateStr}T14:00:00+07:00`).getTime();
  const parts = dateStr.split('T');
  const timePart = parts[1].length === 5 ? `${parts[1]}:00` : parts[1];
  return new Date(`${parts[0]}T${timePart}+07:00`).getTime();
};

const formatDateForICal = (ms: number) => {
  const d = new Date(ms);
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

export async function GET(req: Request) {
  try {
    const client = getClient();
    if (!client) {
      return new Response('KV not configured', { status: 500 });
    }

    const bookingsRaw: any = await client.get('bookings');
    const allBookings = Array.isArray(bookingsRaw) ? bookingsRaw : (bookingsRaw?.data || []);

    let icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Suri HomeStay//PMS//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Suri HomeStay',
      'X-WR-TIMEZONE:Asia/Ho_Chi_Minh',
      'X-PUBLISHED-TTL:PT15M' // Hint cho app lịch tự động quét mỗi 15 phút
    ];

    const nowStr = formatDateForICal(Date.now());

    for (const b of allBookings) {
      if (b.status === 'cancelled') continue;
      if (!b.checkIn || !b.checkOut) continue;

      const ciMs = parseVnTime(b.checkIn);
      const coMs = parseVnTime(b.checkOut);
      
      // Bỏ qua các booking lỗi không tính toán được giờ
      if (isNaN(ciMs) || isNaN(coMs)) continue;

      const uid = `${b.id}@surihomestay.vn`;
      const dtStart = formatDateForICal(ciMs);
      const dtEnd = formatDateForICal(coMs);
      const statusStr = b.status === 'pending' ? 'Chờ duyệt' : 'Đã xác nhận';
      
      const description = `Khách: ${b.guestName}\\nNguồn: ${b.source || 'Trực tiếp'}\\nTrạng thái: ${statusStr}\\nTiền phòng: ${b.amount || '0'}đ\\nĐã cọc: ${b.deposit || '0'}đ`;

      icalContent.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${nowStr}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${b.room} - ${b.guestName}`,
        `DESCRIPTION:${description}`,
        `LOCATION:Suri HomeStay`,
        `STATUS:CONFIRMED`,
        'END:VEVENT'
      );
    }

    icalContent.push('END:VCALENDAR');

    return new Response(icalContent.join('\\r\\n'), {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="surihomestay.ics"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error: any) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}
