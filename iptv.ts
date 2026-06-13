export interface IPTVItem {
  id: string;
  name: string;
  logo: string;
  url: string;
  group: string;
  type: 'movie' | 'series' | 'live';
}

export function parseM3U(content: string): IPTVItem[] {
  const items: IPTVItem[] = [];
  const lines = content.split('\n');
  let currentItem: Partial<IPTVItem> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('#EXTINF:')) {
      const info = line;
      const nameMatch = info.match(/,(.+)$/);
      const logoMatch = info.match(/tvg-logo="([^"]+)"/);
      const groupMatch = info.match(/group-title="([^"]+)"/);
      
      currentItem.name = nameMatch ? nameMatch[1] : 'Unknown';
      currentItem.logo = logoMatch ? logoMatch[1] : '';
      currentItem.group = groupMatch ? groupMatch[1] : 'Others';
      
      // تحديد النوع بناءً على المجموعة أو الاسم (تحسين بسيط)
      const groupLower = currentItem.group.toLowerCase();
      if (groupLower.includes('movie') || groupLower.includes('film')) {
        currentItem.type = 'movie';
      } else if (groupLower.includes('series') || groupLower.includes('مسلسل')) {
        currentItem.type = 'series';
      } else {
        currentItem.type = 'live';
      }
    } else if (line.startsWith('http')) {
      currentItem.url = line;
      currentItem.id = Math.random().toString(36).substr(2, 9);
      items.push(currentItem as IPTVItem);
      currentItem = {};
    }
  }
  return items;
}

export function groupByType(items: IPTVItem[]) {
  return {
    movies: items.filter(i => i.type === 'movie'),
    series: items.filter(i => i.type === 'series'),
    live: items.filter(i => i.type === 'live'),
  };
}