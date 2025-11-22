<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  
  <xsl:template match="/">
    <xsl:variable name="title"><xsl:value-of select="/rss/channel/title"/></xsl:variable>
    <xsl:variable name="description"><xsl:value-of select="/rss/channel/description"/></xsl:variable>
    <xsl:variable name="link"><xsl:value-of select="/rss/channel/link"/></xsl:variable>
    
    <html class="nb-body">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta name="referrer" content="unsafe-url"/>
        <title><xsl:value-of select="$title"/></title>
        
        <!-- RemixIcon for NEO-BRUTALISM style -->
        <link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet"/>
        
        <style>
          :root {
            --bg-color: #ffffff;
            --fg-color: #000000;
            --accent-color: #ff5500;
            --gray-light: #f0f0f0;
            --border-width: 2px;
            --border-radius: 0px;
            --shadow-distance: 4px;
            --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif;
            --font-mono: "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", "Source Code Pro", "Courier New", Courier, monospace;
            --secondary-color: #666666;
          }
          
          * {
            box-sizing: border-box;
          }
          
          body {
            margin: 0;
            padding: 0;
            background-color: var(--bg-color);
            color: var(--fg-color);
            font-family: var(--font-mono);
            line-height: 1.5;
            overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          /* Decorative grid background */
          body::before {
            content: "";
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image:
              linear-gradient(var(--fg-color) 1px, transparent 1px),
              linear-gradient(90deg, var(--fg-color) 1px, transparent 1px);
            background-size: 40px 40px;
            opacity: 0.03;
            z-index: -1;
            pointer-events: none;
          }
          
          h1, h2, h3, h4, h5, h6 {
            font-family: var(--font-sans);
            font-weight: 900;
            text-transform: uppercase;
            margin-top: 0;
            letter-spacing: -0.5px;
          }
          
          .nb-box {
            border: var(--border-width) solid var(--fg-color);
            background: var(--bg-color);
            box-shadow: var(--shadow-distance) var(--shadow-distance) 0 var(--fg-color);
          }
          
          .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 12px 24px;
            font-family: var(--font-mono);
            font-weight: bold;
            text-transform: uppercase;
            text-decoration: none;
            cursor: pointer;
            border: var(--border-width) solid var(--fg-color);
            background: var(--bg-color);
            color: var(--fg-color);
            box-shadow: var(--shadow-distance) var(--shadow-distance) 0 var(--fg-color);
            transition: all 0.2s ease;
            font-size: 1rem;
          }
          
          .btn:hover {
            color: var(--accent-color);
            border-color: var(--accent-color);
            transform: translate(-2px, -2px);
            box-shadow: calc(var(--shadow-distance) + 2px) calc(var(--shadow-distance) + 2px) 0 var(--accent-color);
          }
          
          .btn:active {
            transform: translate(var(--shadow-distance), var(--shadow-distance));
            box-shadow: 0 0 0 var(--fg-color);
            color: var(--accent-color);
            background: var(--bg-color);
          }
          
          a:link, a:visited {
            color: var(--fg-color);
            text-decoration: none;
            border-bottom: var(--border-width) solid var(--fg-color);
            transition: border-color 0.2s ease;
            line-break: loose;
          }
          
          a:hover {
            border-bottom-color: var(--accent-color);
            color: var(--accent-color);
          }
          
          .subscribe-link {
            color: var(--accent-color);
            font-weight: bold;
            text-decoration: none;
            border-bottom: none;
            transition: all 0.2s ease;
          }
          
          .subscribe-link:hover {
            color: var(--bg-color);
            background-color: var(--accent-color);
            padding: 2px 4px;
            margin: -2px -4px;
          }
          
          article {
            margin-bottom: 2rem;
            padding: 1.5rem;
            border-left: var(--border-width) solid var(--fg-color);
            transition: all 0.3s ease;
          }
          
          article:hover {
            border-left-color: var(--accent-color);
            box-shadow: calc(var(--shadow-distance) + 2px) calc(var(--shadow-distance) + 2px) 0 var(--accent-color);
            transform: translate(-2px, -2px);
          }
          
          .article-title {
            font-family: var(--font-sans);
            font-size: 1.5rem;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: -0.5px;
            margin-bottom: 0.5rem;
          }
          
          .article-date {
            color: var(--secondary-color);
            font-size: 0.875rem;
            font-weight: 500;
            margin-bottom: 1rem;
            display: block;
          }
          
          .article-content {
            font-size: 1rem;
            line-height: 1.6;
            margin-bottom: 1rem;
          }
          
          .article-content p {
            margin-top: 0;
            margin-bottom: 1rem;
          }
          
          .article-content p:last-child {
            margin-bottom: 0;
          }
          
          .read-more {
            color: var(--accent-color);
            font-weight: bold;
            text-transform: uppercase;
            text-decoration: none;
            border-bottom: var(--border-width) solid var(--accent-color);
            padding-bottom: 2px;
            transition: all 0.2s ease;
          }
          
          .read-more:hover {
            background-color: var(--accent-color);
            color: var(--bg-color);
            padding: 4px 8px;
            margin: -4px -8px;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem 1rem;
          }
          
          header {
            text-align: center;
            padding: 3rem 0;
            margin-bottom: 2rem;
            border-bottom: var(--border-width) solid var(--fg-color);
          }
          
          .title {
            font-size: 3rem;
            line-height: 0.9;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: -0.5px;
            margin-bottom: 1rem;
            position: relative;
            display: inline-block;
          }
          
          .title::after {
            content: "_";
            animation: blink 1s infinite;
            color: var(--accent-color);
          }
          
          @keyframes blink { 50% { opacity: 0; } }
          
          .description {
            font-size: 1.125rem;
            margin-bottom: 2rem;
            color: var(--secondary-color);
          }
          
          .subscribe-info {
            font-size: 0.875rem;
            color: var(--secondary-color);
            padding: 0 2rem;
          }
          
          footer {
            text-align: center;
            padding: 2rem 0;
            margin-top: 3rem;
            border-top: var(--border-width) solid var(--fg-color);
          }
          
          .footer-info {
            font-size: 0.875rem;
            color: var(--secondary-color);
            margin-bottom: 1rem;
          }
          
          .footer-links {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-bottom: 1rem;
          }
          
          .footer-links a {
            font-size: 0.875rem;
            color: var(--secondary-color);
            text-decoration: none;
            border-bottom: none;
            padding: 4px 8px;
            border: var(--border-width) solid var(--fg-color);
            transition: all 0.2s ease;
          }
          
          .footer-links a:hover {
            color: var(--accent-color);
            border-color: var(--accent-color);
            transform: translate(-2px, -2px);
            box-shadow: var(--shadow-distance) var(--shadow-distance) 0 var(--accent-color);
          }
        </style>
      </head>
    
    <body>
      <div class="container">
        <header class="nb-box">
          <h1 class="title">
            <xsl:value-of select="$title"/>
          </h1>
          <p class="description">
            <xsl:value-of select="$description"/>
          </p>
          <div class="subscribe-info">
            <p>
              This RSS feed for the
              <a class="btn" title="{$title}" href="{$link}" target="_blank" rel="noopener noreferrer">
                <i class="ri-rss-line" style="margin-right: 8px;"></i>
                <xsl:value-of select="$title"/>
              </a>
              website.
            </p>
            <p class="subscribe-links" style="display: none; margin-top: 1rem;">
              You can subscribe this RSS feed by
              <a class="subscribe-link" title="Feedly" data-href="https://feedly.com/i/subscription/feed/" target="_blank" rel="noopener noreferrer">
                <i class="ri-rss-line" style="margin-right: 4px;"></i>Feedly
              </a>,
              <a class="subscribe-link" title="Inoreader" data-href="https://www.inoreader.com/feed/" target="_blank" rel="noopener noreferrer">
                <i class="ri-rss-line" style="margin-right: 4px;"></i>Inoreader
              </a>,
              <a class="subscribe-link" title="Newsblur" data-href="https://www.newsblur.com/?url=" target="_blank" rel="noopener noreferrer">
                <i class="ri-rss-line" style="margin-right: 4px;"></i>Newsblur
              </a>,
              <a class="subscribe-link" title="Follow" data-href="follow://add?url=" rel="noopener noreferrer">
                <i class="ri-rss-line" style="margin-right: 4px;"></i>Follow
              </a>,
              <a class="subscribe-link" title="RSS Reader" data-href="feed:" data-raw="true" rel="noopener noreferrer">
                <i class="ri-rss-line" style="margin-right: 4px;"></i>RSS Reader
              </a>
              or
              <a class="subscribe-link" title="{$title} 's feed source" data-href="" data-raw="true" rel="noopener noreferrer">
                <i class="ri-code-line" style="margin-right: 4px;"></i>View Source
              </a>.
            </p>
          </div>
        </header>
        
        <main>
          <xsl:choose>
            <xsl:when test="/rss/channel/item">
              <xsl:for-each select="/rss/channel/item">
                <article>
                  <xsl:if test="title">
                    <h2 class="article-title">
                      <xsl:value-of select="title" disable-output-escaping="yes"/>
                    </h2>
                  </xsl:if>
                  <xsl:if test="pubDate">
                    <time class="article-date">
                      <i class="ri-calendar-line" style="margin-right: 4px;"></i>
                      <xsl:value-of select="pubDate"/>
                    </time>
                  </xsl:if>
                  <div class="article-content">
                    <p>
                      <xsl:choose>
                        <xsl:when test="description">
                          <xsl:value-of select="description" disable-output-escaping="yes"/>
                        </xsl:when>
                      </xsl:choose>
                    </p>
                  </div>
                  <xsl:if test="link">
                    <a class="read-more" href="{link}" target="_blank" rel="noopener noreferrer">
                      <i class="ri-arrow-right-line" style="margin-right: 4px;"></i>
                      Read More
                    </a>
                  </xsl:if>
                </article>
              </xsl:for-each>
            </xsl:when>
            <xsl:when test="/atom:feed/atom:entry">
              <xsl:for-each select="/atom:feed/atom:entry">
                <article>
                  <xsl:if test="atom:title">
                    <h2 class="article-title">
                      <xsl:value-of select="atom:title" disable-output-escaping="yes"/>
                    </h2>
                  </xsl:if>
                  <xsl:if test="atom:updated">
                    <time class="article-date">
                      <i class="ri-calendar-line" style="margin-right: 4px;"></i>
                      <xsl:value-of select="atom:updated"/>
                    </time>
                  </xsl:if>
                  <div class="article-content">
                    <p>
                      <xsl:choose>
                        <xsl:when test="atom:summary">
                          <xsl:value-of select="atom:summary" disable-output-escaping="yes"/>
                        </xsl:when>
                        <xsl:when test="atom:content">
                          <xsl:value-of select="atom:content" disable-output-escaping="yes"/>
                        </xsl:when>
                      </xsl:choose>
                    </p>
                  </div>
                  <xsl:if test="atom:link/@href">
                    <a class="read-more" href="{atom:link/@href}" target="_blank" rel="noopener noreferrer">
                      <i class="ri-arrow-right-line" style="margin-right: 4px;"></i>
                      Read More
                    </a>
                  </xsl:if>
                </article>
              </xsl:for-each>
            </xsl:when>
          </xsl:choose>
        </main>
        
        <footer class="nb-box">
          <div class="footer-info">
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 1rem;">
              <i class="ri-rss-line" style="font-size: 1.5rem; color: var(--accent-color);"></i>
              <span style="font-weight: bold; font-size: 1.25rem;">RSS</span>
              <span style="color: var(--accent-color); font-weight: bold; font-size: 1.25rem;">BEAUTY</span>
            </div>
            <p>Make Your RSS Beautiful</p>
          </div>
          <div class="footer-links">
            <a href="https://github.com/ccbikai/RSS.Beauty" target="_blank" title="GitHub">
              <i class="ri-github-line" style="margin-right: 4px;"></i>GitHub
            </a>
            <a href="https://404.li/kai" target="_blank" title="X/Twitter">
              <i class="ri-twitter-x-line" style="margin-right: 4px;"></i>X/Twitter
            </a>
          </div>
          <div class="footer-info">
            <p>Made with ❤️‍🔥 By <a href="https://html.zone" target="_blank" title="HTML.ZONE" style="color: var(--accent-color); border-bottom-color: var(--accent-color);">HTML.ZONE</a></p>
          </div>
        </footer>
      </div>
      
      <script>
        document.addEventListener('DOMContentLoaded', function () {
          document.querySelectorAll('a[data-href]').forEach(function (a) {
            const url = new URL(location.href)
            const feed = url.searchParams.get('url') || location.href
            const raw = a.getAttribute('data-raw')
            if (raw) {
              a.href = a.getAttribute('data-href') + feed
            } else {
              a.href = a.getAttribute('data-href') + encodeURIComponent(feed)
            }
          })
          document.querySelector('.subscribe-links').style.display = 'block'
        })
      </script>
    </body>
  </html>
</xsl:template>
</xsl:stylesheet>