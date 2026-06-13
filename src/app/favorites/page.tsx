'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Heart, Tv, Film, Clapperboard, Play,
  Trash2, X, Layers,
} from 'lucide-react';
import { useFavorites, FavoriteType } from '@/lib/useFavorites';
import { useLanguage } from '@/lib/i18n';
import LanguageToggle from '@/components/LanguageToggle';

const TYPE_META: Record<FavoriteType, { label: string; icon: React.ElementType; accent: string }> = {
  live:   { label: 'Live TV', icon: Tv,          accent: '#3b82f6' },
  movie:  { label: 'Movies',  icon: Film,         accent: '#ef4444' },
  series: { label: 'Series',  icon: Clapperboard, accent: '#a855f7' },
};

type Filter = 'all' | FavoriteType;

export default function FavoritesPage() {
  const router = useRouter();
  const { favorites, removeFavorite } = useFavorites();
  const [filter, setFilter] = useState<Filter>('all');
  const [confirmId, setConfirmId] = useState<{ id: number; type: FavoriteType } | null>(null);
  const { t, direction } = useLanguage();

  const displayed = filter === 'all'
    ? favorites
    : favorites.filter((f) => f.type === filter);

  // Sort newest first
  const sorted = [...displayed].sort((a, b) => b.added_at - a.added_at);

  function handleItemClick(item: (typeof favorites)[number]) {
    if (item.type === 'movie') {
      router.push(`/movie/${item.id}`);
    } else if (item.type === 'series') {
      router.push(`/series/${item.id}`);
    } else {
      // live — go to live browse section
      router.push(`/browse/live`);
    }
  }

  const counts: Record<Filter, number> = {
    all:    favorites.length,
    live:   favorites.filter((f) => f.type === 'live').length,
    movie:  favorites.filter((f) => f.type === 'movie').length,
    series: favorites.filter((f) => f.type === 'series').length,
  };

  return (
    <main className="min-h-screen bg-[#0e0e0e] text-white" dir={direction}>

      {/* ── header ── */}
      <header className="sticky top-0 z-30 bg-[#0e0e0e]/95 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/')} aria-label="Back"
          className="p-2 hover:bg-white/10 rounded-full transition shrink-0">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <Heart size={20} className="text-red-500 fill-red-500" />
          <h1 className="text-lg font-bold">{t('common.favorites')}</h1>
          {favorites.length > 0 && (
            <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
              {favorites.length}
            </span>
          )}
        </div>
        <LanguageToggle />
      </header>

      <div className="px-6 py-6 max-w-7xl mx-auto">

        {/* ── filter tabs ── */}
        {favorites.length > 0 && (
          <div className="flex gap-2 mb-8 flex-wrap">
            {(['all', 'live', 'movie', 'series'] as Filter[]).map((f) => {
              const meta = f === 'all' ? null : TYPE_META[f];
              const Icon = meta?.icon;
              const count = counts[f];
              if (f !== 'all' && count === 0) return null;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition border
                    ${filter === f
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'border-white/8 bg-white/4 text-white/50 hover:text-white hover:bg-white/8'}`}
                >
                  {Icon && <Icon size={14} style={filter === f && meta ? { color: meta.accent } : {}} />}
                  {f === 'all' ? t('common.all') : t(meta?.label as string)}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filter === f ? 'bg-white/15 text-white/70' : 'bg-white/5 text-white/30'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── empty state ── */}
        {favorites.length === 0 && (
          <div className="flex flex-col items-center justify-center py-40 gap-4 text-white/20">
            <Heart size={52} />
            <p className="text-lg font-medium">{t('common.noFavoritesYet')}</p>
            <p className="text-sm text-center max-w-xs">
              {t('common.noFavoritesHint')}
            </p>
            <button onClick={() => router.push('/')}
              className="mt-2 px-6 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-sm text-white/70 hover:text-white transition">
              {t('common.browseContent')}
            </button>
          </div>
        )}

        {/* ── live channels: list ── */}
        {(filter === 'all' || filter === 'live') && sorted.filter(f => f.type === 'live').length > 0 && (
          <section className="mb-10">
            {filter === 'all' && (
              <h2 className="text-xs uppercase tracking-widest text-white/30 font-semibold mb-4 flex items-center gap-2">
                <Tv size={13} style={{ color: TYPE_META.live.accent }} />
                {t('common.liveTV')}
              </h2>
            )}
            <div className="flex flex-col gap-1.5">
              {sorted.filter(f => f.type === 'live').map((item) => (
                <div key={`${item.id}-${item.type}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/8 transition group">
                  <button onClick={() => handleItemClick(item)} className="flex items-center gap-3 flex-1 text-left min-w-0">
                    <div className="w-12 h-9 rounded-lg bg-gray-800 flex-none overflow-hidden">
                      {item.cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.cover} alt={item.name}
                          className="w-full h-full object-contain"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Tv size={16} className="text-gray-600" />
                        </div>
                      )}
                    </div>
                    <span className="flex-1 text-sm font-medium truncate">{item.name}</span>
                  </button>
                  <button
                    onClick={() => setConfirmId({ id: item.id, type: item.type })}
                    aria-label="Remove from favorites"
                    className="p-2 rounded-full text-white/20 hover:text-red-400 hover:bg-white/8 opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button onClick={() => handleItemClick(item)}
                    className="p-2 rounded-full text-gray-600 hover:text-white hover:bg-white/8 opacity-0 group-hover:opacity-100 transition">
                    <Play size={15} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── movies: grid ── */}
        {(filter === 'all' || filter === 'movie') && sorted.filter(f => f.type === 'movie').length > 0 && (
          <section className="mb-10">
            {filter === 'all' && (
              <h2 className="text-xs uppercase tracking-widest text-white/30 font-semibold mb-4 flex items-center gap-2">
                <Film size={13} style={{ color: TYPE_META.movie.accent }} />
                {t('common.movies')}
              </h2>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
              {sorted.filter(f => f.type === 'movie').map((item) => (
                <div key={`${item.id}-${item.type}`} className="group flex flex-col gap-2">
                  <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-gray-800">
                    {item.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.cover} alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film size={28} className="text-gray-700" />
                      </div>
                    )}
                    {/* hover overlay */}
                    <button onClick={() => handleItemClick(item)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center">
                        <Play size={18} className="text-black ml-0.5" fill="black" />
                      </div>
                    </button>
                    {/* remove btn */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmId({ id: item.id, type: item.type }); }}
                      aria-label="Remove"
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-sm
                                 text-white/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <button onClick={() => handleItemClick(item)} className="text-left">
                    <p className="text-xs font-medium leading-snug line-clamp-2 text-white/80">{item.name}</p>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── series: grid ── */}
        {(filter === 'all' || filter === 'series') && sorted.filter(f => f.type === 'series').length > 0 && (
          <section className="mb-10">
            {filter === 'all' && (
              <h2 className="text-xs uppercase tracking-widest text-white/30 font-semibold mb-4 flex items-center gap-2">
                <Clapperboard size={13} style={{ color: TYPE_META.series.accent }} />
                {t('common.series')}
              </h2>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
              {sorted.filter(f => f.type === 'series').map((item) => (
                <div key={`${item.id}-${item.type}`} className="group flex flex-col gap-2">
                  <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-gray-800">
                    {item.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.cover} alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Clapperboard size={28} className="text-gray-700" />
                      </div>
                    )}
                    <button onClick={() => handleItemClick(item)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center">
                        <Play size={18} className="text-black ml-0.5" fill="black" />
                      </div>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmId({ id: item.id, type: item.type }); }}
                      aria-label="Remove"
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-sm
                                 text-white/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <button onClick={() => handleItemClick(item)} className="text-left">
                    <p className="text-xs font-medium leading-snug line-clamp-2 text-white/80">{item.name}</p>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* empty filtered */}
        {favorites.length > 0 && sorted.length === 0 && (
          <div className="flex flex-col items-center py-24 gap-3 text-white/20">
            <Layers size={36} />
            <p className="text-sm">{t('common.noElementsInThisSection')}</p>
          </div>
        )}
      </div>

      {/* ── confirm remove dialog ── */}
      {confirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmId(null)} />
          <div className="relative bg-[#1c1c1c] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-base font-semibold mb-2">{t('common.deleteFromFavorites')}</h3>
            <p className="text-sm text-white/50 mb-5">
              {favorites.find(f => f.id === confirmId.id && f.type === confirmId.type)?.name}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  removeFavorite(confirmId.id, confirmId.type);
                  setConfirmId(null);
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl text-sm font-semibold transition"
              >
                {t('common.delete')}
              </button>
              <button
                onClick={() => setConfirmId(null)}
                className="flex-1 py-2.5 bg-white/8 hover:bg-white/12 border border-white/10 rounded-xl text-sm font-semibold transition"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}