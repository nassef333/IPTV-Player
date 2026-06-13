'use client';

import Link from 'next/link';
import { Tv, Film, Clapperboard, Heart, Settings, AlertCircle } from 'lucide-react';
import { useFavorites } from '@/lib/useFavorites';
import { usePlaylistUrl } from '@/lib/usePlaylistUrl';
import { useLanguage } from '@/lib/i18n';
import LanguageToggle from '@/components/LanguageToggle';
import ThemeToggle from '@/components/ThemeToggle';

const SECTIONS = [
  {
    id: 'live',
    labelKey: 'common.liveTV',
    href: '/browse/live',
    icon: Tv,
    gradient: 'from-blue-600 to-blue-900',
    bg: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?q=80&w=2070',
  },
  {
    id: 'movies',
    labelKey: 'common.movies',
    href: '/browse/movies',
    icon: Film,
    gradient: 'from-red-600 to-red-900',
    bg: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070',
  },
  {
    id: 'series',
    labelKey: 'common.series',
    href: '/browse/series',
    icon: Clapperboard,
    gradient: 'from-purple-600 to-purple-900',
    bg: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?q=80&w=2070',
  },
] as const;

export default function Home() {
  const { favorites } = useFavorites();
  const { t, direction } = useLanguage();
  const { playlistUrl, isLoaded: credentialsLoaded } = usePlaylistUrl();

  const hasCredentials = playlistUrl && playlistUrl.length > 0;

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col" dir={direction}>
      {/* Header */}
      <header className="px-4 sm:px-6 md:px-8 py-4 md:py-6 flex items-center justify-between border-b border-border/10 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-accent rounded-lg flex items-center justify-center shadow-lg shadow-accent/20">
            <Tv size={18} className="text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white">مشهد</h1>
        </div>
        {/* Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageToggle />
          <ThemeToggle />
          {/* Settings */}
          <Link href="/settings"
            className="flex items-center gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 text-xs sm:text-sm font-medium text-white/90 hover:text-white backdrop-blur-sm">
            <Settings size={16} className="text-white/60" />
            <span className="hidden sm:inline">{t('common.settings')}</span>
          </Link>
          {/* Favorites shortcut */}
          <Link href="/favorites"
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 text-xs sm:text-sm font-medium text-white/90 hover:text-white backdrop-blur-sm">
            <Heart size={16} className={favorites.length > 0 ? 'text-accent fill-accent' : 'text-white/40'} />
            <span className="hidden sm:inline">{t('common.favorites')}</span>
            {favorites.length > 0 && (
              <span className="bg-accent text-white text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full">
                {favorites.length}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Hero text */}
      <div className="px-4 sm:px-6 md:px-10 mb-8 md:mb-12 mt-6 md:mt-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 text-white">{t('common.whatDoYouWantToWatch')}</h2>
        <p className="text-white/60 text-base sm:text-lg md:text-xl">{t('common.chooseSection')}</p>
        
        {/* Warning if no credentials */}
        {credentialsLoaded && !hasCredentials && (
          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle size={20} className="text-yellow-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-yellow-200 font-medium mb-1">{t('common.addPlaylistSettings')}</p>
              <p className="text-yellow-200/70 text-sm">
                {t('common.addPlaylistHint')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Section cards */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 px-4 sm:px-6 md:px-10 pb-8 md:pb-12">
        {SECTIONS.map(({ id, labelKey, href, icon: Icon, gradient, bg }) => (
          <Link
            key={id}
            href={href}
            className="group relative rounded-2xl overflow-hidden aspect-[4/3] cursor-pointer shadow-2xl hover:shadow-accent/20 transition-all duration-300"
          >
            {/* Background image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bg}
              alt={labelKey}
              className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 group-hover:scale-110 transition-all duration-700"
            />
            {/* Gradient overlay */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-70 group-hover:opacity-80 transition-opacity duration-300`}
            />
            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-end p-4 sm:p-6 md:p-8">
              <Icon size={40} className="mb-3 md:mb-4 opacity-90" />
              <p className="text-xs sm:text-sm text-white/80 mb-1.5 md:mb-2 font-medium">{t(labelKey)}</p>
              <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 md:mb-4">{t(labelKey)}</h3>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-white/70 group-hover:text-white transition-colors">
                <span className="font-medium">{t('common.browseCategories')}</span>
                <span className="group-hover:translate-x-2 transition-transform">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}