import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json();
    const { packId, password } = body;
    const pack = storage.togglePin(packId, password);
    return NextResponse.json({ success: true, pack });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 403 });
  }
}
