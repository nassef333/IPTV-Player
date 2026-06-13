import { NextRequest, NextResponse } from 'next/server';
import { parseM3U, groupChannels } from '@/lib/m3uParser';

export async function GET(req: NextRequest) {
  try {
    const playlistUrl = req.nextUrl.searchParams.get('playlistUrl');
    const section = req.nextUrl.searchParams.get('section') || 'live';
    const categoryId = req.nextUrl.searchParams.get('categoryId');

    if (!playlistUrl) {
      return NextResponse.json(
        { error: 'Playlist URL is required', channels: [], total: 0 },
        { status: 400 }
      );
    }

    // Convert get.php to player_api.php for API requests
    let apiUrl = playlistUrl;
    if (apiUrl.includes('/get.php')) {
      apiUrl = apiUrl.replace('/get.php', '/player_api.php');
    }
    
    const url = new URL(apiUrl);
    
    // Use Xtream Codes API for category-specific requests
    if (categoryId) {
      const action = section === 'live' ? 'get_live_streams' : 
                     section === 'movies' ? 'get_vod_streams' : 
                     'get_series';
      url.searchParams.set('action', action);
      url.searchParams.set('category_id', categoryId);
    } else {
      // Fallback to M3U for full playlist (backward compatibility)
      if (!url.searchParams.has('type')) {
        url.searchParams.set('type', 'm3u_plus');
      }
      if (!url.searchParams.has('output')) {
        url.searchParams.set('output', 'm3u8');
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60_000); // 60s timeout

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': '*/*',
        'Referer': url.origin,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch playlist: ${response.status} ${response.statusText}`);
    }

    const content = await response.text();

    if (!content || content.trim().length === 0) {
      throw new Error('Playlist is empty (server returned no content)');
    }

    let channels;

    if (categoryId) {
      // Parse JSON response from Xtream Codes API
      try {
        const data = JSON.parse(content);
        // Xtream API returns { channels: [...] } format for series, extract the array
        channels = Array.isArray(data) ? data : (data?.channels || []);
      } catch (e) {
        throw new Error('Failed to parse streams JSON');
      }
    } else {
      // Parse M3U format
      channels = parseM3U(content);
    }

    return NextResponse.json(
      { channels, total: channels.length },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching channels:', message);
    return NextResponse.json(
      { error: `Failed to fetch channels: ${message}`, channels: [], total: 0 },
      { status: 500 }
    );
  }
}
