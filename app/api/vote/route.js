import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

export const dynamic = 'force-dynamic';

function getClientIp(req) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { packId, playerId, playerName, deviceId, fingerprint } = body;
    if (!packId) {
      return NextResponse.json({ success: false, error: "缺少整合包ID" }, { status: 400 });
    }
    const ip = getClientIp(req);
    const result = await storage.vote({ packId, playerId, playerName, ip, deviceId, fingerprint });
    const stats = await storage.getStats();
    return NextResponse.json({ success: true, ...result, stats });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
