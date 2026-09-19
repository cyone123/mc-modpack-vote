import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json();
    const { packId, playerName } = body;
    if (!packId || !playerName) {
      return NextResponse.json({ success: false, error: '缺少整合包ID或用户身份' }, { status: 400 });
    }
    const deleted = await storage.deleteUserPack({ packId, playerName });
    const stats = await storage.getStats();
    return NextResponse.json({ success: true, deleted, stats });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
