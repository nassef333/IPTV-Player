import { NextRequest, NextResponse } from 'next/server';
import { getSeries } from '@/lib/xtream';

export async function GET(req: NextRequest) {
  const categoryId = req.nextUrl.searchParams.get('category_id') ?? undefined;
  const baseUrl = req.nextUrl.searchParams.get('baseUrl') ?? undefined;
  const username = req.nextUrl.searchParams.get('username') ?? undefined;
  const password = req.nextUrl.searchParams.get('password') ?? undefined;

  try {
    const series = await getSeries(categoryId, baseUrl, username, password);
    // Xtream API returns { channels: [...] } for series, extract the array
    const streams = Array.isArray(series) ? series : (series as any)?.channels || [];
    return NextResponse.json(streams, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
