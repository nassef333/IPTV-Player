'use client';

import { useLanguage } from '@/lib/i18n';
import { Globe } from 'lucide-react';

export default function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 text-sm font-medium text-white/90 hover:text-white backdrop-blur-sm"
      title={language === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
    >
      <Globe size={16} className="text-white/60" />
      <span className="font-semibold">{language === 'ar' ? 'English' : 'العربية'}</span>
    </button>
  );
}
