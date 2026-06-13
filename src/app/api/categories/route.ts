import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const playlistUrl = req.nextUrl.searchParams.get('playlistUrl');
    const section = req.nextUrl.searchParams.get('section') || 'live';

    if (!playlistUrl) {
      return NextResponse.json(
        { error: 'Playlist URL is required', categories: [] },
        { status: 400 }
      );
    }

    // Build API URL based on section
    // Convert get.php to player_api.php
    let apiUrl = playlistUrl;
    if (apiUrl.includes('/get.php')) {
      apiUrl = apiUrl.replace('/get.php', '/player_api.php');
    }
    
    const url = new URL(apiUrl);
    const action = section === 'live' ? 'get_live_categories' : 
                   section === 'movies' ? 'get_vod_categories' : 
                   'get_series_categories';
    
    url.searchParams.set('action', action);

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
      throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
    }

    const content = await response.text();

    if (!content || content.trim().length === 0) {
      throw new Error('Categories response is empty');
    }

    // Parse JSON response
    let data;
    try {
      data = JSON.parse(content);
    } catch (e) {
      throw new Error('Failed to parse categories JSON');
    }

    const categories = data || [];

    return NextResponse.json(
      { categories },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching categories:', message);
    return NextResponse.json(
      { error: `Failed to fetch categories: ${message}`, categories: [] },
      { status: 500 }
    );
  }
}
