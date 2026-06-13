import { NextRequest, NextResponse } from 'next/server';
import { getVodStreams } from '@/lib/xtream';

export async function GET(req: NextRequest) {
  const categoryId = req.nextUrl.searchParams.get('category_id') ?? undefined;
  const baseUrl = req.nextUrl.searchParams.get('baseUrl') ?? undefined;
  const username = req.nextUrl.searchParams.get('username') ?? undefined;
  const password = req.nextUrl.searchParams.get('password') ?? undefined;

  try {
    const streams = await getVodStreams(categoryId, baseUrl, username, password);
    return NextResponse.json(streams, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
