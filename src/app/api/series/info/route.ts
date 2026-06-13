import { NextRequest, NextResponse } from 'next/server';
import { getSeriesInfo, setXtreamCredentials } from '@/lib/xtream';

export async function GET(req: NextRequest) {
  const seriesId = req.nextUrl.searchParams.get('series_id');
  const playlistUrl = req.nextUrl.searchParams.get('playlistUrl');

  if (!seriesId) {
    return NextResponse.json({ error: 'series_id is required' }, { status: 400 });
  }

  if (!playlistUrl) {
    return NextResponse.json({ error: 'Playlist URL is required' }, { status: 400 });
  }

  try {
    // Extract credentials from playlist URL
    const url = new URL(playlistUrl);
    const baseUrl = url.origin;
    const username = url.username || url.searchParams.get('username') || '';
    const password = url.password || url.searchParams.get('password') || '';

    if (!username || !password) {
      return NextResponse.json({ error: 'Invalid playlist URL: missing credentials' }, { status: 400 });
    }

    // Set credentials for this request
    setXtreamCredentials(baseUrl, username, password);

    const info = await getSeriesInfo(parseInt(seriesId, 10), baseUrl, username, password);
    return NextResponse.json(info, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
