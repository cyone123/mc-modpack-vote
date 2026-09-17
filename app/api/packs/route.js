import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const packs = storage.getPacks();
    const stats = storage.getStats();
    return NextResponse.json({ success: true, packs, stats });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
