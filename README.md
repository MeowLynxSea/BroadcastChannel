# BroadcastChannel 🌟

**Turn your Telegram Channel into a Super Awesome MicroBlog! 🎉**

---

English | [简体中文](./README.zh-cn.md)

## ✨ Features

- **🚀 Turn your Telegram Channel into a MicroBlog**
- **🔍 Powerful Search System** - Find anything with our fuzzy search magic!
- **💬 Complete Comment System** - Chat with your readers! Support for both SQLite & File storage!
- **🎨 NEO-BRUTALISM Design** - Super cool, bold, and beautiful UI that stands out!
- **📱 SEO friendly** `/sitemap.xml`
- **⚡ 0 JS on the browser side**
- **📡 RSS and RSS JSON** `/rss.xml` `/rss.json`

## 🧱 Tech Stack

- Framework: [Astro](https://astro.build/) ⚡
- CMS: [Telegram Channels](https://telegram.org/tour/channels) 📱
- Search: [Fuse.js](https://fusejs.io/) 🔍
- Comments: SQLite & File Storage 💾
- Style: NEO-BRUTALISM Design System 🎨
- Original Template: [Sepia](https://github.com/Planetable/SiteTemplateSepia) (but we totally transformed it! 🪄)

## 🎉 What's New?

This version has been totally revamped with amazing new features! Here's what makes it special:

### ✨ Amazing New Features Added
- **💬 Full Comment System**: Let your readers chat! Includes user info collection, nested replies, and both SQLite/file storage options!
- **🔍 Advanced Search**: Powered by Fuse.js fuzzy search with caching, search statistics, and auto-indexing!
- **🎨 NEO-BRUTALISM UI**: Complete design overhaul with bold borders, sharp corners, and awesome shadows!
- **📱 Better Mobile Experience**: Responsive design that looks great on all devices!
- **🔧 Developer Tools**: Added health checks, search management scripts, and proxy development mode!

### 🪄 Design Transformation
Gone is the soft, traditional look! We've embraced the awesome NEO-BRUTALISM style:
- **Sharp corners only** - No more boring rounded corners!
- **Bold black borders** - Because edges should be seen!
- **Cool hard shadows** - Everything pops off the page!
- **Monospace fonts** - Techy and beautiful!
- **Grid backgrounds** - Subtle but cool patterns!

### 🚀 Performance Improvements
- **Smarter caching** - Everything loads faster!
- **Optimized components** - Cleaner, faster, better!
- **Search indexing** - Content is instantly searchable!

### 🔧 Technical Enhancements
- **Comment System Architecture**: Modular design with adapters for SQLite and file storage
- **Search Infrastructure**: LRU caching, rate limiting, and automated index management
- **Component Optimization**: Split monolithic components into reusable, focused pieces
- **Font Loading System**: Dynamic font optimization with fallback strategies
- **API Endpoints**: New RESTful APIs for comments, search status, and avatar handling

### 🛠️ Development Tools Added
- **Health Check Script**: Monitor system status and performance metrics
- **Search Management Scripts**: Initialize, update, and clean search indexes
- **Proxy Development Mode**: Easy development with Telegram API proxy
- **Enhanced ESLint Configuration**: Better code quality and consistency

Enjoy this totally transformed experience! 🌈✨

## ⚒️ Configuration

```env
## Telegram Channel Username, must be configured. The string of characters following t.me/
CHANNEL=miantiao_me

## Language and timezone settings, language options see [dayjs](https://github.com/iamkun/dayjs/tree/dev/src/locale)
LOCALE=en
TIMEZONE=America/New_York

## Social media usernames
TELEGRAM=ccbikai
TWITTER=ccbikai
GITHUB=ccbikai
MASTODON=mastodon.social/@Mastodon
BLUESKY=bsky.app

## The following two social media need to be URLs
DISCORD=https://DISCORD.com
PODCAST=https://PODCAST.com

## Header and footer code injection, supports HTML
FOOTER_INJECT=FOOTER_INJECT
HEADER_INJECT=HEADER_INJECT

## SEO configuration options, can prevent search engines from indexing content
NO_FOLLOW=false
NO_INDEX=false

## Sentry configuration options, collect server-side errors
SENTRY_AUTH_TOKEN=SENTRY_AUTH_TOKEN
SENTRY_DSN=SENTRY_DSN
SENTRY_PROJECT=SENTRY_PROJECT

## Telegram host name and static resource proxy, not recommended to modify
HOST=telegram.dog
STATIC_PROXY=

## Enable Google Site Search
GOOGLE_SEARCH_SITE=memo.miantiao.me

## Enable tags page, separate tags with commas
TAGS=tag1,tag2,tag3

## Show comments
COMMENTS=true

## List of links in the Links page, Separate using commas and semicolons
LINKS=Title1,URL1;Title2,URL3;Title3,URL3;

## Sidebar Navigation Item, Separate using commas and semicolons
NAVS=Title1,URL1;Title2,URL3;Title3,URL3;

## Enable RSS beautify
RSS_BEAUTIFY=true
```

## 🙋🏻 FAQs

1. Why is the content empty after deployment? 😱
   - Check if the channel is public, it must be public
   - The channel username is a string, not a number
   - Turn off the "Restricting Saving Content" setting in the channel
   - Redeploy after modifying environment variables
   - Telegram blocks public display of some sensitive channels, you can verify by visiting `https://t.me/s/channelusername`.

2. How do I enable comments? 💬
   - Just set `COMMENTS=true` in your environment variables! Easy peasy!

3. How does the search work? 🔍
   - Our magic fuzzy search finds anything! Run `pnpm init-search` after deployment to build the index!

4. What's NEO-BRUTALISM? 🎨
   - It's our super cool design system with bold borders, no rounded corners, and awesome shadows! It makes your blog stand out! ✨

## ☕ Sponsor Original Creator

1. [Follow me on Telegram](https://t.me/miantiao_me) 📱
2. [Follow me on 𝕏](https://404.li/kai) 🐦
3. [Sponsor me on GitHub](https://github.com/sponsors/ccbikai) ❤️

---

## 🌟 Fork Author & Sponsor

**Forked with love by [MeowLynxSea](https://github.com/MeowLynxSea)** 💖

Enjoy this enhanced version? Consider supporting my work! 🎁

📱 [Sponsor me on 爱发电](https://ifdian.net/@meowdream) - Buy me a bubble tea! 🧋
