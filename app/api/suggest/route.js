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
    const {
      name,
      version,
      loader,
      memoryReq,
      category,
      tags,
      description,
      link,
      suggestedBy,
      deviceId,
      fingerprint
    } = body;

    const ip = getClientIp(req);
    const newPack = await storage.suggestPack({
      name,
      version,
      loader,
      memoryReq,
      category,
      tags,
      description,
      link,
      suggestedBy,
      ip,
      deviceId,
      fingerprint
    });

    const stats = await storage.getStats();
    return NextResponse.json({ success: true, pack: newPack, stats });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
