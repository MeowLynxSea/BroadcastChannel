# 广播频道 🌟

**将你的 Telegram Channel 变成超酷微博客！🎉**

---

[English](./README.md) | 简体中文

## ✨ 特性

- **🚀 将 Telegram Channel 转为微博客**
- **🔍 强大的搜索系统** - 用我们的模糊搜索魔法找到任何内容！
- **💬 完整的评论系统** - 与读者互动！支持 SQLite 和文件存储！
- **🎨 NEO-BRUTALISM 设计** - 超酷、大胆、美丽的UI，让你脱颖而出！
- **📱 SEO 友好** `/sitemap.xml`
- **⚡ 浏览器端 0 JS**
- **📡 提供超级 RSS 和 RSS JSON** `/rss.xml` `/rss.json`

## 🧱 技术栈

- 框架：[Astro](https://astro.build/) ⚡
- 内容管理系统：[Telegram Channels](https://telegram.org/tour/channels) 📱
- 搜索引擎：[Fuse.js](https://fusejs.io/) 🔍
- 评论系统：SQLite 和文件存储 💾
- 样式：NEO-BRUTALISM 设计系统 🎨
- 原始模板：[Sepia](https://github.com/Planetable/SiteTemplateSepia)（但我们完全改造了它！🪄）

## 🎉 新鲜出炉

这个版本已经完全改造，加入了超棒的新功能！以下是它的特别之处：

### ✨ 惊人的新功能
- **💬 完整评论系统**: 让读者互动！包含用户信息收集、嵌套回复、SQLite/文件存储双选项！
- **🔍 高级搜索**: 由 Fuse.js 驱动的模糊搜索，带缓存、搜索统计和自动索引！
- **🎨 NEO-BRUTALISM UI**: 完全设计大改造，粗边框、直角、超棒阴影！
- **📱 更好的移动体验**: 响应式设计，所有设备都看起来很棒！
- **🔧 开发者工具**: 添加了健康检查、搜索管理脚本和代理开发模式！

### 🪄 设计大变身
再见柔和的传统外观！我们拥抱超酷的 NEO-BRUTALISM 风格：
- **只有直角** - 告别无聊的圆角！
- **粗黑边框** - 因为边缘就该被看见！
- **酷炫硬阴影** - 一切都从页面中跳出来！
- **等宽字体** - 科技感十足还很美！
- **网格背景** - 微妙但很酷的图案！

### 🚀 性能提升
- **更智能的缓存** - 一切加载更快！
- **优化组件** - 更干净、更快速、更美好！
- **搜索索引** - 内容即时可搜索！

### 🔧 技术增强
- **评论系统架构**: 模块化设计，支持 SQLite 和文件存储适配器
- **搜索基础设施**: LRU 缓存、请求频率限制和自动化索引管理
- **组件优化**: 将单体组件拆分为可重用的专注模块
- **字体加载系统**: 动态字体优化与回退策略
- **API 端点**: 新增评论、搜索状态和头像处理的 RESTful API

### 🛠️ 开发工具
- **健康检查脚本**: 监控系统状态和性能指标
- **搜索管理脚本**: 初始化、更新和清理搜索索引
- **代理开发模式**: 使用 Telegram API 代理轻松开发
- **增强的 ESLint 配置**: 更好的代码质量和一致性

享受这个完全改造的体验吧！🌈✨

## ⚒️ 配置

```env
## Telegram 频道用户名，必须配置。 t.me/ 后面那串字符
CHANNEL=miantiao_me

## 语言和时区设置，语言选项见[dayjs](https://github.com/iamkun/dayjs/tree/dev/src/locale)
LOCALE=zh-cn
TIMEZONE=Asia/Shanghai

## 社交媒体用户名
TELEGRAM=ccbikai
TWITTER=ccbikai
GITHUB=ccbikai

## 下面两个社交媒体需要为 URL
DISCORD=https://DISCORD.com
PODCASRT=https://PODCASRT.com

## 头部尾部代码注入，支持 HTML
FOOTER_INJECT=FOOTER_INJECT
HEADER_INJECT=HEADER_INJECT

## SEO 配置项，可不让搜索引擎索引内容
NO_FOLLOW=false
NO_INDEX=false

## Sentry 配置项，收集服务端报错
SENTRY_AUTH_TOKEN=SENTRY_AUTH_TOKEN
SENTRY_DSN=SENTRY_DSN
SENTRY_PROJECT=SENTRY_PROJECT

## Telegram 主机名称和静态资源代理，不建议修改
HOST=telegram.dog
STATIC_PROXY=

## 启用谷歌站内搜索
GOOGLE_SEARCH_SITE=memo.miantiao.me

## 启用标签页, 标签使用英文逗号分割
TAGS=标签A,标签B,标签C

## 展示评论
COMMENTS=true

## 链接页面中的超链接, 使用英文逗号和分号分割
LINKS=Title1,URL1;Title2,URL3;Title3,URL3;

## 侧边栏导航项, 使用英文逗号和分号分割
NAVS=Title1,URL1;Title2,URL3;Title3,URL3;

## 启用 RSS 美化
RSS_BEAUTIFY=true
```

## 🙋🏻 常问问题

1. 为什么部署后内容为空？😱
   - 检查频道是否是公开的，必须是公开的
   - 频道用户名是字符串，不是数字
   - 关闭频道 Restricting Saving Content 设置项
   - 修改完环境变量后需要重新部署
   - Telegram 会屏蔽一些敏感频道的公开展示， 可以通过访问 `https://t.me/s/频道用户名` 确认

2. 怎么开启评论功能？💬
   - 在环境变量中设置 `COMMENTS=true` 就行啦！超简单的！

3. 搜索功能怎么用？🔍
   - 我们神奇的模糊搜索能找到任何东西！部署后运行 `pnpm init-search` 构建搜索索引！

4. 什么是 NEO-BRUTALISM？🎨
   - 这是我们的超酷设计系统，有粗边框、无圆角和超棒的阴影！让你的博客脱颖而出！✨

## ☕ 赞助原作者

1. [在 Telegram 关注我](https://t.me/miantiao_me) 📱
2. [在 𝕏 上关注我](https://404.li/x) 🐦
3. [在 GitHub 赞助我](https://github.com/sponsors/ccbikai) ❤️

---

## 🌟 Fork 作者 & 赞助

**由 [MeowLynxSea](https://github.com/MeowLynxSea) 用爱改编 💖**

喜欢这个增强版？考虑支持我的工作！🎁

📱 [在爱发电赞助我](https://ifdian.net/@meowdream) - 请我喝杯奶茶吧！🧋
