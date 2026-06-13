export interface Channel {
  id: string;
  name: string;
  logo: string;
  group: string;
  url: string;
  type: 'live' | 'movie' | 'series';
}

export interface Group {
  name: string;
  channels: Channel[];
}

export interface FilterOptions {
  search: string;
  group: string;
  type: 'all' | 'live' | 'movie' | 'series';
}
