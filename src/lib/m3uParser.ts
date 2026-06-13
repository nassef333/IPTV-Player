import { Channel, Group } from '@/types';

export function parseM3U(content: string): Channel[] {
  const channels: Channel[] = [];
  const lines = content.split('\n');

  let currentInfo: Partial<Channel> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('#EXTINF:')) {
      // Match #EXTINF with any duration value (not just -1)
      const infoMatch = line.match(/#EXTINF:[^,\s]*\s*(.*?)(?:,(.*))?$/);
      if (infoMatch) {
        const attrsPart = infoMatch[1] || '';
        // Channel name is everything after the last comma
        const commaIdx = line.lastIndexOf(',');
        const name =
          commaIdx !== -1 ? line.slice(commaIdx + 1).trim() : 'Unknown';

        const tvgId = extractAttribute(attrsPart, 'tvg-id');
        const tvgName = extractAttribute(attrsPart, 'tvg-name');
        const tvgLogo = extractAttribute(attrsPart, 'tvg-logo');
        const groupTitle = extractAttribute(attrsPart, 'group-title');

        currentInfo = {
          id: tvgId ? `${tvgId}-${channels.length}` : `${Date.now()}-${channels.length}`,
          name: name || tvgName || 'Unknown',
          logo: tvgLogo || '',
          group: groupTitle || 'Uncategorized',
          type: determineType(groupTitle || '', name || ''),
        };
      }
    } else if (line.startsWith('http') || line.startsWith('rtmp') || line.startsWith('rtsp')) {
      if (currentInfo.name) {
        channels.push({
          ...currentInfo,
          url: line,
        } as Channel);
        currentInfo = {};
      }
    }
  }

  return channels;
}

function extractAttribute(line: string, attr: string): string {
  const regex = new RegExp(`${attr}="([^"]*)"`, 'i');
  const match = line.match(regex);
  return match ? match[1] : '';
}

function determineType(group: string, name: string): 'live' | 'movie' | 'series' {
  const groupLower = group.toLowerCase();
  const nameLower = name.toLowerCase();

  if (
    groupLower.includes('movie') ||
    groupLower.includes('film') ||
    groupLower.includes('أفلام') ||
    groupLower.includes('افلام') ||
    nameLower.includes(' movie') ||
    nameLower.includes(' film')
  ) {
    return 'movie';
  }

  if (
    groupLower.includes('series') ||
    groupLower.includes('مسلسل') ||
    groupLower.includes('مسلسلات') ||
    groupLower.includes('show') ||
    groupLower.includes('season')
  ) {
    return 'series';
  }

  return 'live';
}

export function groupChannels(channels: Channel[]): Group[] {
  const groupMap = new Map<string, Channel[]>();

  channels.forEach((channel) => {
    if (!groupMap.has(channel.group)) {
      groupMap.set(channel.group, []);
    }
    groupMap.get(channel.group)!.push(channel);
  });

  return Array.from(groupMap.entries())
    .map(([name, chans]) => ({ name, channels: chans }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function filterChannels(
  channels: Channel[],
  options: { search: string; group: string; type: 'all' | 'live' | 'movie' | 'series' }
): Channel[] {
  return channels.filter((channel) => {
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      const matchesSearch =
        channel.name.toLowerCase().includes(searchLower) ||
        channel.group.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    if (options.group && options.group !== 'all' && channel.group !== options.group) {
      return false;
    }

    if (options.type !== 'all' && channel.type !== options.type) {
      return false;
    }

    return true;
  });
}
