<div align="center">

# 📺 IPTV Web Player

**تطبيق ويب حديث لمشاهدة القنوات التلفزيونية والأفلام والمسلسلات عبر بروتوكول IPTV**

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

</div>

---

## ✨ المميزات

### 🎯 الوظائف الأساسية
- **📺 تشغيل القنوات الحية** - دعم كامل لقنوات البث المباشر
- **🎬 مكتبة الأفلام** - تصفح ومشاهدة الأفلام بسهولة
- **📺 المسلسلات** - متابعة المسلسلات المفضلة
- **🔍 بحث متقدم** - البحث في القنوات والأفلام والمسلسلات
- **📁 تصنيف ذكي** - تنظيم المحتوى حسب الفئات

### 🎨 تجربة المستخدم
- **🌙 الوضع الليلي** - دعم كامل للثيمات الفاتحة والداكنة
- **🌍 تعدد اللغات** - دعم اللغة العربية والإنجليزية
- **⭐ المفضلة** - حفظ القنوات والمحتوى المفضل
- **📱 متجاوب** - يعمل على جميع الأجهزة والشاشات
- **⚡ سريع** - أداء عالي وتحميل سريع

### 🔧 تقني
- **🎥 مشغل فيديو متقدم** - باستخدام Media Chrome
- **📡 دعم HLS** - تشغيل تدفقات HLS باستخدام hls.js
- **📋 M3U Parser** - تحليل قوائم التشغيل M3U/M3U8
- **🛡️ معالجة الأخطاء** - إدارة شاملة للأخطاء
- **💾 تخزين محلي** - حفظ الإعدادات والمفضلة

---

## 🚀 البدء السريع

### المتطلبات
- Node.js 20 أو أحدث
- npm أو yarn أو pnpm

### التثبيت

```bash
# استنساخ المشروع
git clone https://github.com/yourusername/iptv.git
cd iptv

# تثبيت الاعتماديات
npm install
# أو
yarn install
# أو
pnpm install
```

### التشغيل

```bash
# تشغيل بيئة التطوير
npm run dev
# أو
yarn dev
# أو
pnpm dev
```

افتح المتصفح على [http://localhost:3000](http://localhost:3000)

### البناء للإنتاج

```bash
# بناء المشروع
npm run build

# تشغيل النسخة الإنتاجية
npm start
```

---

## 📖 الاستخدام

### إضافة قائمة تشغيل M3U

1. افتح التطبيق
2. أدخل رابط قائمة التشغيل M3U/M3U8
3. سيتم تحليل القائمة تلقائياً
4. استمتع بمشاهدة المحتوى

### الميزات التفاعلية

- **البحث**: استخدم شريط البحث للعثور على القنوات أو الأفلام
- **التصفية**: تصفية المحتوى حسب الفئة أو النوع
- **المفضلة**: أضف المحتوى المفضل لقائمة المفضلة
- **اللغة**: غير اللغة من الزر الموجود في الشريط العلوي
- **الثيم**: بدّل بين الوضع الفاتح والداكن

---

## 🛠️ التقنيات المستخدمة

### الواجهة الأمامية
- **[Next.js 16](https://nextjs.org/)** - إطار عمل React
- **[React 19](https://react.dev/)** - مكتبة واجهة المستخدم
- **[TypeScript](https://www.typescriptlang.org/)** - لغة البرمجة
- **[Tailwind CSS 4](https://tailwindcss.com/)** - إطار عمل التصميم

### مشغل الفيديو
- **[Media Chrome](https://media-chrome.org/)** - مشغل فيديو مخصص
- **[hls.js](https://github.com/video-dev/hls.js/)** - دعم HLS

### الأدوات المساعدة
- **[Lucide React](https://lucide.dev/)** - مكتبة الأيقونات
- **[clsx](https://github.com/lukeed/clsx)** - إدارة الكلاسات
- **[tailwind-merge](https://github.com/dcastilloc/tailwind-merge)** - دمج Tailwind

---

## 📁 هيكل المشروع

```
iptv/
├── public/                 # الملفات الثابتة
├── src/
│   ├── app/               # صفحات Next.js
│   │   ├── api/          # API Routes
│   │   │   ├── channels/ # قنوات البث
│   │   │   └── movies/   # الأفلام
│   │   ├── browse/       # صفحة التصفح
│   │   ├── favorites/    # صفحة المفضلة
│   │   └── Player.tsx    # مشغل الفيديو
│   ├── components/       # المكونات المشتركة
│   │   ├── LanguageToggle.tsx
│   │   └── ThemeToggle.tsx
│   ├── lib/              # المكتبات المساعدة
│   │   ├── m3uParser.ts  # محلل M3U
│   │   ├── i18n/         # الترجمة
│   │   └── useFavorites.ts
│   └── types/            # تعريفات TypeScript
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## 🔧 التكوين

### متغيرات البيئة

يمكنك إضافة متغيرات البيئة في ملف `.env.local`:

```env
# إعدادات اختيارية
NEXT_PUBLIC_API_URL=your_api_url
```

---

## 🤝 المساهمة

نرحب بالمساهمات! إذا كنت تريد المساهمة في هذا المشروع:

1. Fork المشروع
2. أنشئ فرع للميزة (`git checkout -b feature/AmazingFeature`)
3. Commit التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. Push للفرع (`git push origin feature/AmazingFeature`)
5. افتح Pull Request

---

## 📝 الترخيص

هذا المشروع مرخص تحت ترخيص MIT - راجع ملف [LICENSE](LICENSE) للتفاصيل

---

## 🙏 شكر وتقدير

- [Next.js](https://nextjs.org/) - إطار العمل الرائع
- [Media Chrome](https://media-chrome.org/) - مشغل الفيديو الممتاز
- [Tailwind CSS](https://tailwindcss.com/) - إطار التصميم القوي
- [Lucide](https://lucide.dev/) - الأيقونات الجميلة

---

<div align="center">

**صُنع بـ ❤️ لمحبي الترفيه**

[⬆ العودة للأعلى](#-iptv-web-player)

</div>
