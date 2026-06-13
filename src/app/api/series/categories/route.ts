import { NextRequest, NextResponse } from 'next/server';
import { getSeriesCategories } from '@/lib/xtream';

export async function GET(req: NextRequest) {
  try {
    const baseUrl = req.nextUrl.searchParams.get('baseUrl') ?? undefined;
    const username = req.nextUrl.searchParams.get('username') ?? undefined;
    const password = req.nextUrl.searchParams.get('password') ?? undefined;

    const categories = await getSeriesCategories(baseUrl, username, password);
    return NextResponse.json(categories, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
