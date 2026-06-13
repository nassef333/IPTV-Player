<div align="center">

<img src="https://capsule-render.vercel.app/api?type=venom&color=0:0f0c29,50:302b63,100:24243e&height=300&section=header&text=IPTV%20PLAYER&fontSize=80&fontColor=ffffff&fontAlignY=55&desc=Stream%20Everything.%20Everywhere.%20Instantly.&descAlignY=75&descSize=20&descColor=a78bfa&animation=fadeIn" width="100%"/>

<br/>

[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-a78bfa?style=for-the-badge)](LICENSE)

<br/>

> **A next-generation IPTV web player** — live channels, blockbuster movies, and binge-worthy series,  
> all in one sleek, blazing-fast interface.

<br/>

---

</div>

## 🌌 What Is This?

**IPTV Player** is a modern, open-source streaming platform built for people who want the full entertainment experience — live TV, movies, and TV shows — directly in their browser. Load any M3U playlist and you're instantly inside your own personal streaming service.

No subscriptions. No setup hell. Just stream.

---

## ✨ Feature Highlights

<table>
<tr>
<td width="50%">

### 📡 Live TV
Full support for live channel streaming with real-time playback. Browse channels by category, search instantly, and save your favorites for one-click access.

</td>
<td width="50%">

### 🎬 Movies
A fully organized movie library with smart categorization. Browse by genre, search by title, and jump straight into playback — no friction.

</td>
</tr>
<tr>
<td width="50%">

### 📺 TV Series
Season-by-season, episode-by-episode navigation for TV series. Keep track of where you left off and pick up right where you stopped.

</td>
<td width="50%">

### 🔍 Smart Search
A unified search bar that queries across channels, movies, and series simultaneously. Results appear as you type.

</td>
</tr>
<tr>
<td width="50%">

### ⭐ Favorites
Bookmark anything — channels, movies, or episodes — with a single click. Your favorites persist locally across sessions.

</td>
<td width="50%">

### 🌙 Dark / Light Mode
Designed from the ground up for both dark cinema mode and crisp light mode. Switches instantly with full system preference support.

</td>
</tr>
<tr>
<td width="50%">

### 🌍 Multi-Language
Full support for **Arabic** and **English** with proper RTL layout for Arabic. Switch languages on the fly from the top bar.

</td>
<td width="50%">

### 📱 Fully Responsive
Pixel-perfect experience from 4K monitors to mobile phones. Every layout element adapts to your screen.

</td>
</tr>
</table>

---

## ⚙️ Tech Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                        IPTV PLAYER STACK                        │
├──────────────────────────┬──────────────────────────────────────┤
│  Framework               │  Next.js 16 (App Router)            │
│  UI Library              │  React 19                           │
│  Language                │  TypeScript 5                       │
│  Styling                 │  Tailwind CSS v4                    │
│  Video Engine            │  Media Chrome + hls.js              │
│  Icons                   │  Lucide React                       │
│  Playlist Parsing        │  Custom M3U / M3U8 Parser           │
│  State & Storage         │  React Hooks + LocalStorage         │
│  i18n                    │  Custom i18n (AR / EN)              │
└──────────────────────────┴──────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** `v20` or higher
- **npm**, **yarn**, or **pnpm**

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/iptv.git
cd iptv

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open your browser at → **[http://localhost:3000](http://localhost:3000)**

### Production Build

```bash
npm run build
npm start
```

---

## 🎯 How To Use

**1. Add your M3U playlist**
Paste any M3U or M3U8 URL into the input field on the home screen. The player parses it automatically and organizes everything into channels, movies, and series.

**2. Browse & Search**
Use the top navigation to switch between Live TV, Movies, and Series. Use the search bar to find anything instantly.

**3. Play content**
Click on any channel, movie, or episode to launch the built-in video player with full HLS support.

**4. Manage Favorites**
Hit the ★ icon on any item to add it to your Favorites tab for quick access later.

**5. Customize**
Toggle dark/light mode and switch between Arabic and English from the top toolbar — your preferences are saved automatically.

---

## 📁 Project Structure

```
iptv/
├── public/                    # Static assets
└── src/
    ├── app/                   # Next.js App Router pages
    │   ├── api/
    │   │   ├── channels/      # Live TV API routes
    │   │   └── movies/        # Movies API routes
    │   ├── browse/            # Browse page
    │   ├── favorites/         # Favorites page
    │   └── Player.tsx         # Core video player
    ├── components/
    │   ├── LanguageToggle.tsx # AR / EN switcher
    │   └── ThemeToggle.tsx    # Dark / light toggle
    ├── lib/
    │   ├── m3uParser.ts       # M3U / M3U8 playlist parser
    │   ├── useFavorites.ts    # Favorites hook
    │   └── i18n/              # Translation files
    └── types/                 # TypeScript type definitions
```

---

## 🌐 Environment Variables

Create a `.env.local` file in the root directory:

```env
# Optional — override the default API base URL
NEXT_PUBLIC_API_URL=your_api_url_here
```

---

## 🤝 Contributing

Contributions are welcome and appreciated. Here's how to get involved:

1. **Fork** the repository
2. **Create** your feature branch → `git checkout -b feature/your-feature`
3. **Commit** your changes → `git commit -m "feat: add your feature"`
4. **Push** to your branch → `git push origin feature/your-feature`
5. **Open** a Pull Request and describe what you've added

Please keep PRs focused and well-described. Bug reports and feature ideas are always welcome via [Issues](../../issues).

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for full details.

---

## 🙌 Credits & Acknowledgements

| Tool | Role |
|------|------|
| [Next.js](https://nextjs.org/) | The backbone of the entire app |
| [Media Chrome](https://media-chrome.org/) | Customizable, powerful video player |
| [hls.js](https://github.com/video-dev/hls.js/) | Seamless HLS stream playback |
| [Tailwind CSS](https://tailwindcss.com/) | Beautiful, utility-first styling |
| [Lucide React](https://lucide.dev/) | Clean, consistent icon library |

---

<div align="center">

<br/>

**Built with ❤️ for movie lovers, series addicts, and live TV fans**

<br/>

[![⬆ Back to Top](https://img.shields.io/badge/⬆_Back_to_Top-302b63?style=for-the-badge)](#-iptv-player)

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f0c29,50:302b63,100:24243e&height=120&section=footer" width="100%"/>

</div>