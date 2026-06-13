import { NextRequest, NextResponse } from 'next/server';
import { getVodStreams, setXtreamCredentials } from '@/lib/xtream';

// Fetch ALL movies using category_id=all and cache aggressively
// This endpoint is used by the advanced search page
export async function GET(req: NextRequest) {
  const playlistUrl = req.nextUrl.searchParams.get('playlistUrl');
  const q = req.nextUrl.searchParams.get('q')?.trim().toLowerCase() ?? '';
  const ratingMin = parseFloat(req.nextUrl.searchParams.get('rating_min') ?? '0');
  const ratingMax = parseFloat(req.nextUrl.searchParams.get('rating_max') ?? '5');
  const yearMin = parseInt(req.nextUrl.searchParams.get('year_min') ?? '0');
  const sort = req.nextUrl.searchParams.get('sort') ?? 'newest'; // newest | oldest | rating | name
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(req.nextUrl.searchParams.get('limit') ?? '48')));

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

    // 'all' fetches every VOD stream across all categories
    const all = await getVodStreams('all', baseUrl, username, password);

    // ── Filter ────────────────────────────────────────────────────────────────
    let results = all.filter((m) => {
      if (q && !m.name.toLowerCase().includes(q)) return false;
      const r = m.rating_5based ?? 0;
      if (r < ratingMin || r > ratingMax) return false;
      if (yearMin > 0) {
        const addedYear = new Date(parseInt(m.added) * 1000).getFullYear();
        if (addedYear < yearMin) return false;
      }
      return true;
    });

    // ── Sort ──────────────────────────────────────────────────────────────────
    results = results.sort((a, b) => {
      switch (sort) {
        case 'newest':
          return parseInt(b.added) - parseInt(a.added);
        case 'oldest':
          return parseInt(a.added) - parseInt(b.added);
        case 'rating':
          return (b.rating_5based ?? 0) - (a.rating_5based ?? 0);
        case 'name':
          return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        default:
          return 0;
      }
    });

    // ── Paginate ──────────────────────────────────────────────────────────────
    const total = results.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const pageItems = results.slice(offset, offset + limit);

    return NextResponse.json(
      { items: pageItems, total, page, totalPages, limit },
      {
        headers: {
          // Cache for 10 minutes — all-stream list is large, don't re-fetch on every keystroke
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
