import { NextRequest, NextResponse } from 'next/server';
import { getSeriesInfo } from '@/lib/xtream';

export async function GET(req: NextRequest) {
  const seriesId = req.nextUrl.searchParams.get('series_id');
  if (!seriesId) {
    return NextResponse.json({ error: 'series_id is required' }, { status: 400 });
  }

  try {
    const info = await getSeriesInfo(parseInt(seriesId, 10));
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
