import { NextRequest, NextResponse } from 'next/server';
import { getVodInfo } from '@/lib/xtream';

export async function GET(req: NextRequest) {
  const vodId = req.nextUrl.searchParams.get('vod_id');
  const playlistUrl = req.nextUrl.searchParams.get('playlistUrl');
  
  if (!vodId) {
    return NextResponse.json({ error: 'vod_id is required' }, { status: 400 });
  }
  
  if (!playlistUrl) {
    return NextResponse.json({ error: 'playlistUrl is required' }, { status: 400 });
  }
  
  try {
    // Parse credentials from playlist URL and convert to API URL format
    const url = new URL(playlistUrl);
    const baseUrl = `${url.protocol}//${url.host}`;
    const username = url.searchParams.get('username') || '';
    const password = url.searchParams.get('password') || '';
    
    // Convert get.php to player_api.php for Xtream API
    const apiUrl = `${baseUrl}/player_api.php?username=${username}&password=${password}`;
    
    const info = await getVodInfo(Number(vodId), baseUrl, username, password);
    return NextResponse.json(info, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
