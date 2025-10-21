import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!process.env.UPLOAD_SECRET || token !== process.env.UPLOAD_SECRET) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const deviceId = req.nextUrl.searchParams.get('deviceId') || 'bilinmiyor';
  const hostname = req.headers.get('x-hostname') || null;
  const ip = (req as any).ip || req.headers.get('x-forwarded-for') || null;

  const contentType = req.headers.get('content-type') || 'image/jpeg';
  const key = 'screens/' + encodeURIComponent(deviceId) + '/' + Date.now() + '.jpg';

  const arrayBuffer = await req.arrayBuffer();

  const blob = await put(key, arrayBuffer, {
    contentType,
    access: 'public',
  });

  await sql`
    insert into screenshots (device_id, file_url, ip, hostname)
    values (${deviceId}, ${blob.url}, ${ip}, ${hostname})
  `;

  return NextResponse.json({ ok: true, url: blob.url });
}

