'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  direction: 'rtl' | 'ltr';
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: {
    'common.favorites': 'Favorites',
    'common.settings': 'Settings',
    'common.whatDoYouWantToWatch': 'What do you want to watch?',
    'common.chooseSection': 'Choose a section to explore',
    'common.browseCategories': 'Browse categories',
    'common.liveTV': 'Live TV',
    'common.movies': 'Movies',
    'common.series': 'Series',
    'common.invalidSection': 'Invalid section',
    'common.language': 'Mashhad',
    'common.categories': 'categories',
    'common.searchAllMovies': 'Search all movies',
    'common.searchAllSeries': 'Search all series',
    'common.searchCategories': 'Search categories',
    'common.noCategories': 'No categories',
    'common.all': 'All',
    'common.selectCategory': 'Select a category',
    'common.channels': 'channels',
    'common.of': 'of',
    'common.allCategories': 'all categories',
    'common.searchChannels': 'Search channels',
    'common.retry': 'Retry',
    'common.removeFromFavorites': 'Remove from favorites',
    'common.addToFavorites': 'Add to favorites',
    'common.play': 'Play',
    'common.noResultsFor': 'No results for',
    'common.noItemsInThisCategory': 'No items in this category',
    'common.clearSearch': 'Clear search',
    'common.search': 'Search',
    'common.enterSearchTerm': 'Enter a search term and click Search',
    'common.searchForMovies': 'Search for movies',
    'common.enterMovieName': 'Enter a movie name and click Search',
    'common.searchForSeries': 'Search for series',
    'common.enterSeriesName': 'Enter a series name and click Search',
    'common.moviesFound': 'movies found',
    'common.seriesFound': 'series found',
    'common.noMoviesFound': 'No movies found',
    'common.noSeriesFound': 'No series found',
    'common.loadingMovies': 'Loading movies…',
    'common.loadingSeries': 'Loading series…',
    'common.sortBy': 'Sort by',
    'common.minRating': 'Min rating',
    'common.year': 'Year',
    'common.reset': 'Reset',
    'common.newestFirst': 'Newest first',
    'common.oldestFirst': 'Oldest first',
    'common.topRated': 'Top rated',
    'common.az': 'A → Z',
    'common.noFavoritesYet': 'No favorites yet',
    'common.noFavoritesHint': 'Start adding content to your favorites to see it here',
    'common.browseContent': 'Browse content',
    'common.deleteFromFavorites': 'Remove from favorites',
    'common.delete': 'Delete',
    'common.cancel': 'Cancel',
    'common.noElementsInThisSection': 'No elements in this section',
    'common.addPlaylistSettings': 'You must add playlist settings first',
    'common.addPlaylistHint': 'Click the "Settings" button above to add your playlist URL or Xtream Codes credentials.',
  },
  ar: {
    'common.favorites': 'المفضلة',
    'common.settings': 'الإعدادات',
    'common.whatDoYouWantToWatch': 'ماذا تريد أن تشاهد؟',
    'common.chooseSection': 'اختر قسمًا للاستكشاف',
    'common.browseCategories': 'تصفح الفئات',
    'common.liveTV': 'تلفزيون مباشر',
    'common.movies': 'أفلام',
    'common.series': 'مسلسلات',
    'common.invalidSection': 'قسم غير صالح',
    'common.language': 'مشهد',
    'common.categories': 'فئات',
    'common.searchAllMovies': 'بحث في جميع الأفلام',
    'common.searchAllSeries': 'بحث في جميع المسلسلات',
    'common.searchCategories': 'بحث في الفئات',
    'common.noCategories': 'لا توجد فئات',
    'common.all': 'الكل',
    'common.selectCategory': 'اختر فئة',
    'common.channels': 'قنوات',
    'common.of': 'من',
    'common.allCategories': 'جميع الفئات',
    'common.searchChannels': 'بحث في القنوات',
    'common.retry': 'إعادة المحاولة',
    'common.removeFromFavorites': 'إزالة من المفضلة',
    'common.addToFavorites': 'إضافة للمفضلة',
    'common.play': 'تشغيل',
    'common.noResultsFor': 'لا توجد نتائج لـ',
    'common.noItemsInThisCategory': 'لا توجد عناصر في هذه الفئة',
    'common.clearSearch': 'مسح البحث',
    'common.search': 'بحث',
    'common.enterSearchTerm': 'أدخل كلمة البحث واضغط على بحث',
    'common.searchForMovies': 'البحث عن أفلام',
    'common.enterMovieName': 'أدخل اسم الفيلم واضغط على بحث',
    'common.searchForSeries': 'البحث عن مسلسلات',
    'common.enterSeriesName': 'أدخل اسم المسلسل واضغط على بحث',
    'common.moviesFound': 'فيلم تم العثور عليه',
    'common.seriesFound': 'مسلسل تم العثور عليه',
    'common.noMoviesFound': 'لم يتم العثور على أفلام',
    'common.noSeriesFound': 'لم يتم العثور على مسلسلات',
    'common.loadingMovies': 'جاري تحميل الأفلام…',
    'common.loadingSeries': 'جاري تحميل المسلسلات…',
    'common.sortBy': 'ترتيب حسب',
    'common.minRating': 'الحد الأدنى للتقييم',
    'common.year': 'السنة',
    'common.reset': 'إعادة تعيين',
    'common.newestFirst': 'الأحدث أولاً',
    'common.oldestFirst': 'الأقدم أولاً',
    'common.topRated': 'الأعلى تقييماً',
    'common.az': 'أ → ي',
    'common.noFavoritesYet': 'لا توجد مفضلات بعد',
    'common.noFavoritesHint': 'ابدأ بإضافة المحتوى إلى المفضلة ليظهر هنا',
    'common.browseContent': 'تصفح المحتوى',
    'common.deleteFromFavorites': 'إزالة من المفضلة',
    'common.delete': 'حذف',
    'common.cancel': 'إلغاء',
    'common.noElementsInThisSection': 'لا توجد عناصر في هذا القسم',
    'common.addPlaylistSettings': 'يجب إضافة إعدادات البلاي ليست أولاً',
    'common.addPlaylistHint': 'اضغط على زر "الإعدادات" في الأعلى لإضافة رابط البلاي ليست أو بيانات Xtream Codes الخاصة بك.',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  const direction: 'rtl' | 'ltr' = language === 'ar' ? 'rtl' : 'ltr';

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, direction, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return { t: context.t, language: context.language };
}
