import { NextRequest, NextResponse } from 'next/server';
import { getSeries, setXtreamCredentials } from '@/lib/xtream';

// Fetch ALL series across all categories and support search/sort/paginate
export async function GET(req: NextRequest) {
  const playlistUrl = req.nextUrl.searchParams.get('playlistUrl');
  const q         = req.nextUrl.searchParams.get('q')?.trim().toLowerCase() ?? '';
  const ratingMin = parseFloat(req.nextUrl.searchParams.get('rating_min') ?? '0');
  const yearMin   = parseInt(req.nextUrl.searchParams.get('year_min') ?? '0');
  const sort      = req.nextUrl.searchParams.get('sort') ?? 'newest'; // newest | oldest | rating | name
  const page      = Math.max(1, parseInt(req.nextUrl.searchParams.get('page')  ?? '1'));
  const limit     = Math.min(200, Math.max(1, parseInt(req.nextUrl.searchParams.get('limit') ?? '48')));

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

    // Passing no categoryId fetches all series across every category
    const all = await getSeries(undefined, baseUrl, username, password);

    // ── Filter ────────────────────────────────────────────────────────────────
    let results = all.filter((s) => {
      if (q && !s.name.toLowerCase().includes(q)) return false;
      if ((s.rating_5based ?? 0) < ratingMin)     return false;
      if (yearMin > 0 && s.releaseDate) {
        const releaseYear = new Date(s.releaseDate).getFullYear();
        if (releaseYear < yearMin) return false;
      }
      return true;
    });

    // ── Sort ──────────────────────────────────────────────────────────────────
    results = results.sort((a, b) => {
      switch (sort) {
        case 'newest':  return parseInt(b.last_modified) - parseInt(a.last_modified);
        case 'oldest':  return parseInt(a.last_modified) - parseInt(b.last_modified);
        case 'rating':  return (b.rating_5based ?? 0) - (a.rating_5based ?? 0);
        case 'name':    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        default:        return 0;
      }
    });

    // ── Paginate ──────────────────────────────────────────────────────────────
    const total      = results.length;
    const totalPages = Math.ceil(total / limit);
    const offset     = (page - 1) * limit;
    const items      = results.slice(offset, offset + limit);

    return NextResponse.json(
      { items, total, page, totalPages, limit },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=120',
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
