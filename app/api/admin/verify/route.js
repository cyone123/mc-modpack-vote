import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json();
    const { password } = body;
    const valid = storage.verifyAdmin(password);
    return NextResponse.json({ success: valid, message: valid ? "密码正确" : "管理密码错误" });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
