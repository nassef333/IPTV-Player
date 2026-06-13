import { NextRequest, NextResponse } from 'next/server';
import { getVodStreamUrl } from '@/lib/xtream';

export async function GET(req: NextRequest) {
  const streamId = req.nextUrl.searchParams.get('stream_id');
  const ext = req.nextUrl.searchParams.get('ext') || 'mkv';
  if (!streamId) {
    return NextResponse.json({ error: 'stream_id required' }, { status: 400 });
  }
  const url = getVodStreamUrl(Number(streamId), ext);
  return NextResponse.json({ url });
}
