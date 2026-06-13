import { NextRequest, NextResponse } from 'next/server';
import { getLiveStreamUrl } from '@/lib/xtream';

export async function GET(req: NextRequest) {
  const streamId = req.nextUrl.searchParams.get('stream_id');
  if (!streamId) {
    return NextResponse.json({ error: 'stream_id required' }, { status: 400 });
  }
  const url = getLiveStreamUrl(Number(streamId));
  return NextResponse.json({ url });
}
