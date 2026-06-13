'use client';

import { useState } from 'react';
import { Settings, Save, Trash2, Check, AlertCircle } from 'lucide-react';
import { usePlaylistUrl } from '@/lib/usePlaylistUrl';
import { useLanguage } from '@/lib/i18n';
import LanguageToggle from '@/components/LanguageToggle';
import ThemeToggle from '@/components/ThemeToggle';
import Link from 'next/link';

export default function SettingsPage() {
  const { playlistUrl, updatePlaylistUrl, clearPlaylistUrl, isLoaded } = usePlaylistUrl();
  const { t, direction } = useLanguage();
  const [inputUrl, setInputUrl] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  const handleSave = () => {
    if (!inputUrl.trim()) {
      setError('الرجاء إدخال رابط البلاي ليست');
      return;
    }

    if (!inputUrl.startsWith('http://') && !inputUrl.startsWith('https://')) {
      setError('الرابط يجب أن يبدأ بـ http:// أو https://');
      return;
    }

    updatePlaylistUrl(inputUrl.trim());
    setShowSuccess(true);
    setError('');
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleClear = () => {
    clearPlaylistUrl();
    setInputUrl('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col" dir={direction}>
      {/* Header */}
      <header className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex items-center justify-between border-b border-border/10 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-accent rounded-lg flex items-center justify-center shadow-lg shadow-accent/20">
              <Settings size={20} className="text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white">{t('common.settings')}</h1>
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 sm:px-6 md:px-10 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
          {/* Playlist URL Section */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Settings size={24} />
              إعدادات البلاي ليست
            </h2>
            
            {/* Current URL */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white/70 mb-2">
                الرابط الحالي
              </label>
              <div className="bg-black/30 border border-white/10 rounded-lg p-4">
                {playlistUrl ? (
                  <p className="text-sm text-white/90 break-all font-mono">
                    {playlistUrl}
                  </p>
                ) : (
                  <p className="text-sm text-white/40 italic">لم يتم تعيين رابط البلاي ليست بعد</p>
                )}
              </div>
            </div>

            {/* Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white/70 mb-2">
                رابط البلاي ليست الجديد
              </label>
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => {
                  setInputUrl(e.target.value);
                  setError('');
                }}
                placeholder="https://example.com/playlist.m3u"
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                dir="ltr"
              />
              {error && (
                <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium transition-all duration-200"
              >
                <Save size={18} />
                حفظ الرابط
              </button>
              <button
                onClick={handleClear}
                className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg font-medium transition-all duration-200"
              >
                <Trash2 size={18} />
                مسح الرابط
              </button>
            </div>

            {/* Success message */}
            {showSuccess && (
              <div className="flex items-center gap-2 mt-4 text-green-400 text-sm">
                <Check size={16} />
                تم حفظ الإعدادات بنجاح
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-200">
              <strong className="text-blue-100">ملاحظة:</strong> أدخل رابط M3U للبلاي ليست الخاص بك. 
              سيتم تحميل جميع الأفلام والمسلسلات والقنوات من هذا الرابط.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
