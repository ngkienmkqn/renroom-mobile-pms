import { NextResponse } from 'next/server';

/**
 * Endpoint: POST /api/webhooks/channex
 * Purpose: Receives booking events and availability syncs from an OTA Channel Manager (like Channex or Beds24)
 * and updates the central Supabase database. This enables Next.js to map third-party bookings (Airbnb, Agoda)
 * smoothly into a single source of truth without needing a heavy long-running server.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Log the payload to the serverless edge execution console (Vercel)
    console.log("🔔 [Webhook Received] from Channel Manager:", body);

    const eventType = body?.event; // e.g. "booking_new", "booking_cancel"

    if (eventType === "booking_new") {
      // TODO: Verify webhook signature/token for security here
      
      // TODO: Map payload to Supabase 'bookings' schema
      // const reservation = body.payload;
      // await supabase.from('bookings').insert({ ... })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Webhook processed elegantly on Vercel Edge" 
    }, { status: 200 });

  } catch (error) {
    console.error("❌ [Webhook Error]:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Internal Server Error" 
    }, { status: 500 });
  }
}
