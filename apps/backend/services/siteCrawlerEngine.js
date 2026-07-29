const cheerio = require('cheerio');
const axios = require('axios');
const xml2js = require('xml2js');
const path = require('path');
const fs = require('fs');
const { classifyFont } = require('./fontClassificationService');

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

function parseInlineStyles(styleAttr) {
    const styles = {};
    if (!styleAttr) return styles;
    styleAttr.split(';').forEach(p => {
        const parts = p.split(':');
        if (parts.length >= 2) {
            styles[parts[0].trim().toLowerCase()] = parts.slice(1).join(':').trim();
        }
    });
    return styles;
}

// Helper to parse Sitemap XML data
async function parseSitemapXml(xmlData) {
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlData);

    let rawUrls = [];
    if (result.urlset && result.urlset.url) {
        rawUrls = result.urlset.url.map(u => u.loc[0].trim());
    } else if (result.sitemapindex && result.sitemapindex.sitemap) {
        rawUrls = result.sitemapindex.sitemap.map(s => s.loc[0].trim());
    }

    const ignoredExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf', '.css', '.js', '.xml'];
    const pageUrls = rawUrls.filter(u => {
        const clean = u.toLowerCase().split('?')[0];
        return !ignoredExts.some(ext => clean.endsWith(ext));
    });

    return Array.from(new Set(pageUrls));
}

// Cheerio Sitemap Fetch Fallback
async function fetchSitemapUrlsCheerio(sitemapUrl) {
    console.log(`[+] Fetching XML Sitemap via Axios: ${sitemapUrl}`);
    try {
        const response = await axios.get(sitemapUrl, { headers: HEADERS, timeout: 20000 });
        return await parseSitemapXml(response.data);
    } catch (axiosErr) {
        console.error(`[!] Axios sitemap fetch failed: ${axiosErr.message}`);
        throw axiosErr;
    }
}

// Dual Mode Sitemap Fetch
async function fetchSitemapUrls(browser, sitemapUrl) {
    if (browser) {
        try {
            console.log(`[+] Fetching XML Sitemap via Playwright Browser: ${sitemapUrl}`);
            const context = await browser.newContext({ userAgent: HEADERS['User-Agent'] });
            const page = await context.newPage();
            const res = await page.goto(sitemapUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
            
            if (res && (res.status() === 401 || res.status() === 403)) {
                throw new Error(`Blocked by server (HTTP Status ${res.status()})`);
            }
            
            const xmlData = await res.text();
            await context.close();
            return await parseSitemapXml(xmlData);
        } catch (err) {
            console.warn(`[!] Playwright sitemap fetch failed (${err.message}). Retrying via Axios...`);
            return fetchSitemapUrlsCheerio(sitemapUrl);
        }
    } else {
        return fetchSitemapUrlsCheerio(sitemapUrl);
    }
}

// Cheerio Crawling Fallback
async function crawlInternalUrlsCheerio(startUrl, maxPages) {
    console.log(`[+] Crawling internal URLs via Axios + Cheerio: ${startUrl}`);
    const urls = new Set();
    urls.add(startUrl);

    try {
        const startDomain = new URL(startUrl).hostname;
        const queue = [startUrl];
        const visited = new Set();

        while (queue.length > 0 && urls.size < maxPages) {
            const currentUrl = queue.shift();
            if (visited.has(currentUrl)) continue;
            visited.add(currentUrl);

            try {
                console.log(`    [-] Crawling link: ${currentUrl} (Queue size: ${queue.length}, Total found: ${urls.size})`);
                const response = await axios.get(currentUrl, { headers: HEADERS, timeout: 15000 });
                const html = response.data;
                const $ = cheerio.load(html);

                const pageLinks = [];
                $('a').each((i, el) => {
                    const href = $(el).attr('href');
                    if (href) pageLinks.push(href);
                });

                for (const link of pageLinks) {
                    try {
                        const parsedLink = new URL(link, startUrl);
                        parsedLink.hash = '';
                        const cleanLink = parsedLink.toString();

                        if (parsedLink.hostname === startDomain) {
                            const ignoredExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf', '.css', '.js', '.xml', '.zip', '.tar', '.gz'];
                            const cleanPath = parsedLink.pathname.toLowerCase();
                            const isIgnored = ignoredExts.some(ext => cleanPath.endsWith(ext));

                            if (!isIgnored && !urls.has(cleanLink) && !visited.has(cleanLink)) {
                                urls.add(cleanLink);
                                if (urls.size >= maxPages) {
                                    break;
                                }
                                queue.push(cleanLink);
                            }
                        }
                    } catch (e) {}
                }
            } catch (err) {
                console.warn(`[!] Error crawling page ${currentUrl}: ${err.message}`);
            }
        }
    } catch (err) {
        console.error(`[!] Error during crawl:`, err);
    }

    return Array.from(urls);
}

// Dual Mode Crawling
async function crawlInternalUrls(browser, startUrl, maxPages) {
    if (browser) {
        console.log(`[+] Crawling internal URLs via Playwright Browser: ${startUrl}`);
        const urls = new Set();
        urls.add(startUrl);

        try {
            const context = await browser.newContext({ userAgent: HEADERS['User-Agent'] });
            const page = await context.newPage();
            const startDomain = new URL(startUrl).hostname;
            const queue = [startUrl];
            const visited = new Set();

            while (queue.length > 0 && urls.size < maxPages) {
                const currentUrl = queue.shift();
                if (visited.has(currentUrl)) continue;
                visited.add(currentUrl);

                try {
                    console.log(`    [-] Crawling link: ${currentUrl} (Queue size: ${queue.length}, Total found: ${urls.size})`);
                    const res = await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
                    if (res && (res.status() === 401 || res.status() === 403)) {
                        throw new Error(`Blocked by server (HTTP Status ${res.status()})`);
                    }

                    const pageLinks = await page.evaluate(() => {
                        return Array.from(document.querySelectorAll('a'))
                            .map(a => a.href)
                            .filter(Boolean);
                    });

                    for (const link of pageLinks) {
                        try {
                            const parsedLink = new URL(link);
                            parsedLink.hash = '';
                            const cleanLink = parsedLink.toString();

                            if (parsedLink.hostname === startDomain) {
                                const ignoredExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf', '.css', '.js', '.xml', '.zip', '.tar', '.gz'];
                                const cleanPath = parsedLink.pathname.toLowerCase();
                                const isIgnored = ignoredExts.some(ext => cleanPath.endsWith(ext));

                                if (!isIgnored && !urls.has(cleanLink) && !visited.has(cleanLink)) {
                                    urls.add(cleanLink);
                                    if (urls.size >= maxPages) {
                                        break;
                                    }
                                    queue.push(cleanLink);
                                }
                            }
                        } catch (e) {}
                    }
                } catch (err) {
                    console.warn(`[!] Error crawling page via Playwright ${currentUrl}: ${err.message}. Retrying static cheerio on this URL...`);
                    // Retry individual page crawl via Cheerio
                    try {
                        const response = await axios.get(currentUrl, { headers: HEADERS, timeout: 15000 });
                        const $ = cheerio.load(response.data);
                        $('a').each((i, el) => {
                            const href = $(el).attr('href');
                            if (href) {
                                try {
                                    const parsedLink = new URL(href, currentUrl);
                                    parsedLink.hash = '';
                                    const cleanLink = parsedLink.toString();
                                    if (parsedLink.hostname === startDomain) {
                                        const cleanPath = parsedLink.pathname.toLowerCase();
                                        const isIgnored = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf', '.css', '.js', '.xml'].some(ext => cleanPath.endsWith(ext));
                                        if (!isIgnored && !urls.has(cleanLink) && !visited.has(cleanLink)) {
                                            urls.add(cleanLink);
                                            queue.push(cleanLink);
                                        }
                                    }
                                } catch (e) {}
                            }
                        });
                    } catch (cheerioErr) {
                        console.error(`      [!] Static crawl retry also failed for ${currentUrl}: ${cheerioErr.message}`);
                    }
                }
            }
            await context.close();
        } catch (err) {
            console.error(`[!] Playwright crawling crashed: ${err.message}. Falling back to Axios + Cheerio...`);
            return crawlInternalUrlsCheerio(startUrl, maxPages);
        }
        return Array.from(urls);
    } else {
        return crawlInternalUrlsCheerio(startUrl, maxPages);
    }
}

// Playwright Browserless CDP Mode Audit Functionality
async function auditSinglePagePlaywright(browser, url, findingType, findingValue, screenshotsDir, ssCounter) {
    let realFindingType = findingType;
    let realFindingValue = findingValue;
    if (findingType !== 'font' && findingType !== 'image' && findingType !== 'text' && findingType !== 'cta' && findingType !== 'all') {
        realFindingType = 'font';
        realFindingValue = findingType;
    }

    const context = await browser.newContext({ userAgent: HEADERS['User-Agent'], viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    const pageResult = {
        url,
        fonts: [],
        ctas: [],
        images: [],
        headings: [],
        seo: null,
        targetFontElements: [],
        targetFontStylesheets: []
    };

    try {
        const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
        if (res && (res.status() === 401 || res.status() === 403)) {
            throw new Error(`Blocked by server (HTTP Status ${res.status()})`);
        }

        await page.waitForTimeout(1000);

        const evaluatedData = await page.evaluate(({ findingType, findingValue }) => {
            const fontLower = (findingValue || '').toLowerCase();

            // -------------------------------------------------------------
            // 1. Font Families Audit
            // -------------------------------------------------------------
            const detectedFonts = new Set();
            const allElements = document.querySelectorAll('*');
            allElements.forEach(el => {
                const style = window.getComputedStyle(el);
                if (style && style.fontFamily) {
                    detectedFonts.add(style.fontFamily);
                }
            });

            // -------------------------------------------------------------
            // 2. Button & CTA Design Audit
            // -------------------------------------------------------------
            const ctaNodes = document.querySelectorAll('button, a.btn, a.button, a.et_pb_button, input[type="submit"], input[type="button"], [role="button"], .cta');
            const ctas = [];
            ctaNodes.forEach(el => {
                const style = window.getComputedStyle(el);
                if (!style || style.display === 'none' || style.visibility === 'hidden') return;

                const text = (el.innerText || el.value || el.textContent || '').trim().replace(/\s+/g, ' ');
                if (!text) return;

                let selector = el.tagName.toLowerCase();
                if (el.id) selector += `#${el.id}`;
                if (el.className && typeof el.className === 'string') {
                    const cleanClasses = el.className.split(/\s+/).filter(c => c && !c.includes('et_pb_column'));
                    if (cleanClasses.length > 0) selector += '.' + cleanClasses.slice(0, 2).join('.');
                }

                const relevantProps = ['font-family', 'font-size', 'font-weight', 'color', 'background-color', 'border-radius', 'padding'];
                let cssStyles = '';
                for (const prop of relevantProps) {
                    const val = style.getPropertyValue(prop);
                    if (val) cssStyles += `${prop}: ${val}; `;
                }

                ctas.push({
                    tagName: el.tagName.toLowerCase(),
                    text: text.slice(0, 80),
                    href: el.href || el.getAttribute('action') || '',
                    fontFamily: style.fontFamily,
                    fontSize: style.fontSize,
                    fontWeight: style.fontWeight,
                    color: style.color,
                    backgroundColor: style.backgroundColor,
                    borderRadius: style.borderRadius,
                    padding: style.padding,
                    boxShadow: style.boxShadow,
                    selector,
                    outerHTML: el.outerHTML.slice(0, 2000),
                    cssStyles
                });
            });

            // -------------------------------------------------------------
            // 3. Images Audit (Missing Alt Tags)
            // -------------------------------------------------------------
            const imgNodes = document.querySelectorAll('img');
            const images = [];
            let withAltCount = 0;

            imgNodes.forEach(img => {
                const src = img.src || img.getAttribute('data-src') || '';
                const alt = img.getAttribute('alt');
                const hasAlt = alt !== null && alt.trim() !== '';
                if (hasAlt) withAltCount++;

                let parentTag = img.parentElement ? img.parentElement.tagName.toLowerCase() : 'body';
                let selector = 'img';
                if (img.id) selector += `#${img.id}`;
                if (img.className && typeof img.className === 'string') {
                    const classes = img.className.split(/\s+/).filter(Boolean);
                    if (classes.length > 0) selector += '.' + classes[0];
                }

                const style = window.getComputedStyle(img);
                const relevantProps = ['width', 'height', 'object-fit', 'border', 'border-radius', 'margin', 'padding', 'display'];
                let cssStyles = '';
                if (style) {
                    for (const prop of relevantProps) {
                        const val = style.getPropertyValue(prop);
                        if (val) cssStyles += `${prop}: ${val}; `;
                    }
                }

                images.push({
                    src: src,
                    alt: hasAlt ? alt.trim() : '(Missing Alt Tag)',
                    hasAlt,
                    width: img.naturalWidth || img.width || 0,
                    height: img.naturalHeight || img.height || 0,
                    parentTag,
                    selector,
                    outerHTML: img.outerHTML.slice(0, 2000),
                    cssStyles
                });
            });

            // -------------------------------------------------------------
            // 4. Heading H1-H6 Audit
            // -------------------------------------------------------------
            const headingNodes = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
            const headings = [];
            headingNodes.forEach(h => {
                const style = window.getComputedStyle(h);
                if (!style || style.display === 'none') return;

                const text = (h.innerText || h.textContent || '').trim().replace(/\s+/g, ' ');
                if (!text) return;

                const relevantProps = ['font-family', 'font-size', 'font-weight', 'color', 'line-height', 'text-transform', 'margin', 'padding'];
                let cssStyles = '';
                for (const prop of relevantProps) {
                    const val = style.getPropertyValue(prop);
                    if (val) cssStyles += `${prop}: ${val}; `;
                }

                headings.push({
                    level: h.tagName.toLowerCase(),
                    text: text.slice(0, 100),
                    fontFamily: style.fontFamily,
                    fontSize: style.fontSize,
                    fontWeight: style.fontWeight,
                    color: style.color,
                    lineHeight: style.lineHeight,
                    textTransform: style.textTransform,
                    selector: h.id ? `${h.tagName.toLowerCase()}#${h.id}` : h.tagName.toLowerCase(),
                    outerHTML: h.outerHTML.slice(0, 2000),
                    cssStyles
                });
            });

            // -------------------------------------------------------------
            // 5. SEO Rules Audit
            // -------------------------------------------------------------
            const titleEl = document.querySelector('title');
            const metaDescEl = document.querySelector('meta[name="description"]');
            const canonicalEl = document.querySelector('link[rel="canonical"]');
            const ogTitleEl = document.querySelector('meta[property="og:title"]');
            const ogDescEl = document.querySelector('meta[property="og:description"]');
            const ogImageEl = document.querySelector('meta[property="og:image"]');

            const h1s = Array.from(headingNodes).filter(h => h.tagName.toLowerCase() === 'h1');
            const h2s = Array.from(headingNodes).filter(h => h.tagName.toLowerCase() === 'h2');
            const h3s = Array.from(headingNodes).filter(h => h.tagName.toLowerCase() === 'h3');

            const title = titleEl ? titleEl.innerText.trim() : '';
            const metaDescription = metaDescEl ? metaDescEl.getAttribute('content') || '' : '';
            const canonicalUrl = canonicalEl ? canonicalEl.getAttribute('href') || '' : '';

            const seo = {
                title,
                titleLength: title.length,
                isTitleValid: title.length >= 30 && title.length <= 60,
                metaDescription,
                metaDescLength: metaDescription.length,
                isMetaDescValid: metaDescription.length >= 50 && metaDescription.length <= 160,
                h1Count: h1s.length,
                h2Count: h2s.length,
                h3Count: h3s.length,
                hasSingleH1: h1s.length === 1,
                hasCanonical: !!canonicalUrl,
                canonicalUrl,
                ogTitle: ogTitleEl ? ogTitleEl.getAttribute('content') || '' : '',
                ogDescription: ogDescEl ? ogDescEl.getAttribute('content') || '' : '',
                ogImage: ogImageEl ? ogImageEl.getAttribute('content') || '' : '',
                totalImages: imgNodes.length,
                imagesWithAlt: withAltCount,
                imagesMissingAlt: imgNodes.length - withAltCount,
                altCoveragePercent: imgNodes.length > 0 ? Math.round((withAltCount / imgNodes.length) * 100) : 100
            };

            // -------------------------------------------------------------
            // 6. Target Finding (Font, Image, Text, CTA, All) Audit
            // -------------------------------------------------------------
            const targetFontElems = [];
            const findingTypeLower = (findingType || 'font').toLowerCase();
            const findingValueLower = (findingValue || '').toLowerCase();

            const matchesSearch = (text, search) => {
                if (!search) return true;
                return text.toLowerCase().includes(search);
            };

            const runFontFinding = () => {
                const candidates = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, a, button, li, span, strong, b, em, td, th, label, input, div');
                for (let i = 0; i < candidates.length; i++) {
                    if (targetFontElems.length >= 100) break;
                    const el = candidates[i];
                    const style = window.getComputedStyle(el);
                    if (!style || style.display === 'none' || style.visibility === 'hidden') continue;

                    const fontFamily = style.fontFamily || '';
                    if (!findingValueLower && !fontFamily) continue;
                    if (findingValueLower && !matchesSearch(fontFamily, findingValueLower)) continue;

                    const tagName = el.tagName.toLowerCase();
                    const fullText = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ');
                    if (!fullText) continue;

                    const elementId = 'font-elem-' + targetFontElems.length;
                    el.setAttribute('data-font-audit-id', elementId);

                    const relevantProps = [
                        'font-family', 'font-size', 'font-weight', 'font-style',
                        'color', 'background-color', 'border', 'border-radius', 'padding'
                    ];
                    let cssStyles = '';
                    for (const prop of relevantProps) {
                        const val = style.getPropertyValue(prop);
                        if (val) cssStyles += `${prop}: ${val}; `;
                    }

                    targetFontElems.push({
                        elementId,
                        tagName,
                        selector: tagName + (el.id ? `#${el.id}` : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.split(/\s+/).filter(Boolean).slice(0, 2).join('.') : ''),
                        fontFamily,
                        fontWeight: style.fontWeight || '400',
                        textSnippet: fullText.slice(0, 60),
                        outerHTML: el.outerHTML.slice(0, 2000),
                        cssStyles,
                        matchType: 'Font'
                    });
                }
            };

            const runImageFinding = () => {
                const imagesList = document.querySelectorAll('img');
                imagesList.forEach(img => {
                    if (targetFontElems.length >= 100) return;
                    const src = img.src || img.getAttribute('data-src') || '';
                    if (!matchesSearch(src, findingValueLower)) return;

                    const elementId = 'img-elem-' + targetFontElems.length;
                    img.setAttribute('data-font-audit-id', elementId);

                    const style = window.getComputedStyle(img);
                    const relevantProps = ['width', 'height', 'object-fit', 'border', 'border-radius', 'margin', 'padding', 'display'];
                    let cssStyles = '';
                    if (style) {
                        for (const prop of relevantProps) {
                            const val = style.getPropertyValue(prop);
                            if (val) cssStyles += `${prop}: ${val}; `;
                        }
                    }

                    targetFontElems.push({
                        elementId: `img-elem-${targetFontElems.length}`,
                        tagName: 'img',
                        selector: 'img' + (img.id ? `#${img.id}` : '') + (img.className && typeof img.className === 'string' ? '.' + img.className.split(/\s+/).filter(Boolean).slice(0, 2).join('.') : ''),
                        fontFamily: '',
                        fontWeight: '',
                        textSnippet: src.split('/').pop() || src,
                        outerHTML: img.outerHTML.slice(0, 2000),
                        cssStyles,
                        matchType: 'Image'
                    });
                });
            };

            const runTextFinding = () => {
                const allElems = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, button, li, td, th, label, div');
                allElems.forEach(el => {
                    if (targetFontElems.length >= 100) return;
                    const text = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ');
                    if (!text) return;

                    if (matchesSearch(text, findingValueLower)) {
                        const hasChildWithText = Array.from(el.children).some(child => {
                            const childText = (child.innerText || child.textContent || '').trim().replace(/\s+/g, ' ');
                            return childText && matchesSearch(childText, findingValueLower);
                        });
                        if (!hasChildWithText) {
                            const elementId = 'text-elem-' + targetFontElems.length;
                            el.setAttribute('data-font-audit-id', elementId);

                            const style = window.getComputedStyle(el);
                            const relevantProps = ['font-family', 'font-size', 'font-weight', 'color', 'background-color', 'padding', 'margin', 'display'];
                            let cssStyles = '';
                            if (style) {
                                for (const prop of relevantProps) {
                                    const val = style.getPropertyValue(prop);
                                    if (val) cssStyles += `${prop}: ${val}; `;
                                }
                            }

                            targetFontElems.push({
                                elementId: `text-elem-${targetFontElems.length}`,
                                tagName: el.tagName.toLowerCase(),
                                selector: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.split(/\s+/).filter(Boolean).slice(0, 2).join('.') : ''),
                                fontFamily: style ? style.fontFamily : '',
                                fontWeight: style ? style.fontWeight : '',
                                textSnippet: text.slice(0, 100),
                                outerHTML: el.outerHTML.slice(0, 2000),
                                cssStyles,
                                matchType: 'Text'
                            });
                        }
                    }
                });
            };

            const runCtaFinding = () => {
                const ctaNodes = document.querySelectorAll('button, a.btn, a.button, a.et_pb_button, input[type="submit"], input[type="button"], [role="button"], .cta');
                ctaNodes.forEach(el => {
                    if (targetFontElems.length >= 100) return;
                    const text = (el.innerText || el.value || el.textContent || '').trim().replace(/\s+/g, ' ');
                    if (!text) return;
                    if (!matchesSearch(text, findingValueLower)) return;

                    const elementId = 'cta-elem-' + targetFontElems.length;
                    el.setAttribute('data-font-audit-id', elementId);

                    const style = window.getComputedStyle(el);
                    const relevantProps = ['font-family', 'font-size', 'font-weight', 'color', 'background-color', 'border-radius', 'padding'];
                    let cssStyles = '';
                    if (style) {
                        for (const prop of relevantProps) {
                            const val = style.getPropertyValue(prop);
                            if (val) cssStyles += `${prop}: ${val}; `;
                        }
                    }

                    targetFontElems.push({
                        elementId: `cta-elem-${targetFontElems.length}`,
                        tagName: el.tagName.toLowerCase(),
                        selector: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.split(/\s+/).filter(Boolean).slice(0, 2).join('.') : ''),
                        fontFamily: style ? style.fontFamily : '',
                        fontWeight: style ? style.fontWeight : '',
                        textSnippet: text.slice(0, 100),
                        outerHTML: el.outerHTML.slice(0, 2000),
                        cssStyles,
                        matchType: 'CTA Button'
                    });
                });
            };

            if (findingTypeLower === 'font') {
                runFontFinding();
            } else if (findingTypeLower === 'image') {
                runImageFinding();
            } else if (findingTypeLower === 'text') {
                runTextFinding();
            } else if (findingTypeLower === 'cta') {
                runCtaFinding();
            } else if (findingTypeLower === 'all') {
                runFontFinding();
                runImageFinding();
                runTextFinding();
                runCtaFinding();
            }

            // -------------------------------------------------------------
            // 7. Stylesheet Search for Target Font
            // -------------------------------------------------------------
            const targetFontStyles = [];
            if (findingTypeLower === 'font' && fontLower) {
                function searchRules(rules, sheetName, sheetPath) {
                    if (!rules) return;
                    for (let i = 0; i < rules.length; i++) {
                        const r = rules[i];
                        if (r.cssRules) searchRules(r.cssRules, sheetName, sheetPath);

                        const cssText = r.cssText || '';
                        if (cssText.toLowerCase().includes(fontLower)) {
                            const selector = r.selectorText || (r.type === 5 ? '@font-face' : 'Rule');
                            const matches = r.selectorText ? r.selectorText.match(/[\.#][a-zA-Z0-9_-]+/g) : null;

                            targetFontStyles.push({
                                stylesheetName: sheetName,
                                filePath: sheetPath,
                                selector,
                                classOrIdName: matches ? Array.from(new Set(matches)).join(', ') : '(Tag / @font-face)',
                                cssRuleSnippet: cssText.trim().replace(/\s+/g, ' ').slice(0, 250)
                            });
                        }
                    }
                }

                Array.from(document.styleSheets).forEach(sheet => {
                    let sheetPath = sheet.href || 'Inline Style Tag';
                    let sheetName = 'Inline Style Tag';
                    if (sheet.href) {
                        try {
                            sheetName = new URL(sheet.href).pathname.split('/').pop() || sheet.href;
                        } catch (e) {
                            sheetName = sheet.href;
                        }
                    }

                    try {
                        if (sheet.cssRules) searchRules(sheet.cssRules, sheetName, sheetPath);
                    } catch (err) {}
                });
            }

            return {
                detectedFonts: Array.from(detectedFonts),
                ctas,
                images,
                headings,
                seo,
                targetFontElems,
                targetFontStyles
            };
        }, { findingType: realFindingType, findingValue: realFindingValue });

        if (evaluatedData && evaluatedData.detectedFonts) {
            pageResult.fonts = evaluatedData.detectedFonts.map(fStr => ({
                rawFontFamily: fStr,
                ...classifyFont(fStr)
            }));
        }

        pageResult.ctas = evaluatedData.ctas || [];
        pageResult.images = evaluatedData.images || [];
        pageResult.headings = evaluatedData.headings || [];
        pageResult.seo = evaluatedData.seo || null;

        // Process Target Font Screenshots
        if (evaluatedData.targetFontElems && screenshotsDir) {
            for (const match of evaluatedData.targetFontElems) {
                const ssNum = ssCounter.val++;
                const ssFilename = `target_font_${ssNum.toString().padStart(3, '0')}.png`;
                const ssPath = path.join(screenshotsDir, ssFilename);
                let ssSaved = false;

                try {
                    const elemHandle = await page.$(`[data-font-audit-id="${match.elementId}"]`);
                    if (elemHandle) {
                        await elemHandle.screenshot({ path: ssPath, timeout: 3000 });
                        ssSaved = true;
                    }
                } catch (e) {}

                match.screenshotPath = ssSaved ? ssPath : '';
                pageResult.targetFontElements.push(match);
            }
        } else {
            pageResult.targetFontElements = evaluatedData.targetFontElems || [];
        }

        pageResult.targetFontStylesheets = evaluatedData.targetFontStyles || [];

    } catch (err) {
        console.error(`  [!] Error auditing URL via Playwright (${url}):`, err.message);
        throw err; // Propagate the error so the wrapper function falls back to Cheerio
    } finally {
        await context.close();
    }

    return pageResult;
}

// Cheerio Static HTML Mode Audit Functionality
async function auditSinglePageCheerio(url, findingType, findingValue) {
    let realFindingType = findingType;
    let realFindingValue = findingValue;
    if (findingType !== 'font' && findingType !== 'image' && findingType !== 'text' && findingType !== 'cta' && findingType !== 'all') {
        realFindingType = 'font';
        realFindingValue = findingType;
    }

    const pageResult = {
        url,
        fonts: [],
        ctas: [],
        images: [],
        headings: [],
        seo: null,
        targetFontElements: [],
        targetFontStylesheets: []
    };

    try {
        console.log(`[+] Auditing URL via Cheerio: ${url}`);
        const response = await axios.get(url, { headers: HEADERS, timeout: 25000 });
        const html = response.data;
        const $ = cheerio.load(html);

        // 1. Font Families Audit
        const detectedFonts = new Set();
        $('[style]').each((i, el) => {
            const inlineStyles = parseInlineStyles($(el).attr('style'));
            if (inlineStyles['font-family']) {
                inlineStyles['font-family'].split(',').forEach(f => {
                    const cleaned = f.trim().replace(/['"]/g, '').trim();
                    if (cleaned) detectedFonts.add(cleaned);
                });
            }
        });

        $('style').each((i, el) => {
            const styleText = $(el).text();
            const fontMatches = styleText.match(/font-family\s*:\s*([^;\}]+)/gi);
            if (fontMatches) {
                fontMatches.forEach(m => {
                    const val = m.split(':')[1].trim();
                    val.split(',').forEach(f => {
                        const cleaned = f.trim().replace(/['"]/g, '').replace(/!important/i, '').trim();
                        if (cleaned) detectedFonts.add(cleaned);
                    });
                });
            }
        });

        // 2. Button & CTA Design Audit
        const ctaNodes = $('button, a.btn, a.button, a.et_pb_button, input[type="submit"], input[type="button"], [role="button"], .cta');
        const ctas = [];
        ctaNodes.each((i, el) => {
            const inlineStyles = parseInlineStyles($(el).attr('style'));
            const text = ($(el).text() || $(el).attr('value') || '').trim().replace(/\s+/g, ' ');
            if (!text) return;

            const id = $(el).attr('id');
            const className = $(el).attr('class');
            let selector = el.tagName.toLowerCase();
            if (id) selector += `#${id}`;
            if (className) {
                const cleanClasses = className.split(/\s+/).filter(c => c && !c.includes('et_pb_column'));
                if (cleanClasses.length > 0) selector += '.' + cleanClasses.slice(0, 2).join('.');
            }

            const relevantProps = ['font-family', 'font-size', 'font-weight', 'color', 'background-color', 'border-radius', 'padding'];
            let cssStyles = '';
            relevantProps.forEach(prop => {
                if (inlineStyles[prop]) {
                    cssStyles += `${prop}: ${inlineStyles[prop]}; `;
                } else {
                    cssStyles += `${prop}: ; `;
                }
            });

            ctas.push({
                tagName: el.tagName.toLowerCase(),
                text: text.slice(0, 80),
                href: $(el).attr('href') || $(el).attr('action') || '',
                fontFamily: inlineStyles['font-family'] || '',
                fontSize: inlineStyles['font-size'] || '',
                fontWeight: inlineStyles['font-weight'] || '',
                color: inlineStyles['color'] || '',
                backgroundColor: inlineStyles['background-color'] || '',
                borderRadius: inlineStyles['border-radius'] || '',
                padding: inlineStyles['padding'] || '',
                boxShadow: inlineStyles['box-shadow'] || '',
                selector,
                outerHTML: $.html(el).slice(0, 2000),
                cssStyles
            });
        });

        // 3. Images Audit
        const imgNodes = $('img');
        const images = [];
        let withAltCount = 0;
        imgNodes.each((i, img) => {
            const src = $(img).attr('src') || $(img).attr('data-src') || '';
            const alt = $(img).attr('alt');
            const hasAlt = alt !== undefined && alt !== null && alt.trim() !== '';
            if (hasAlt) withAltCount++;

            const parentTag = $(img).parent() && $(img).parent()[0] ? $(img).parent()[0].tagName.toLowerCase() : 'body';
            const id = $(img).attr('id');
            const className = $(img).attr('class');
            const selector = 'img' + (id ? `#${id}` : '') + (className ? `.${className.trim().split(/\s+/)[0]}` : '');

            const inlineStyles = parseInlineStyles($(img).attr('style'));
            const width = parseInt($(img).attr('width')) || (inlineStyles['width'] ? parseInt(inlineStyles['width']) : 0);
            const height = parseInt($(img).attr('height')) || (inlineStyles['height'] ? parseInt(inlineStyles['height']) : 0);

            const relevantProps = ['width', 'height', 'object-fit', 'border', 'border-radius', 'margin', 'padding', 'display'];
            let cssStyles = '';
            relevantProps.forEach(prop => {
                if (inlineStyles[prop]) {
                    cssStyles += `${prop}: ${inlineStyles[prop]}; `;
                } else {
                    cssStyles += `${prop}: ; `;
                }
            });

            images.push({
                src: src,
                alt: hasAlt ? alt.trim() : '(Missing Alt Tag)',
                hasAlt,
                width,
                height,
                parentTag,
                selector,
                outerHTML: $.html(img).slice(0, 2000),
                cssStyles
            });
        });

        // 4. Heading H1-H6 Audit
        const headingNodes = $('h1, h2, h3, h4, h5, h6');
        const headings = [];
        headingNodes.each((i, h) => {
            const text = $(h).text().trim().replace(/\s+/g, ' ');
            if (!text) return;

            const id = $(h).attr('id');
            const className = $(h).attr('class');
            const selector = h.tagName.toLowerCase() + (id ? `#${id}` : '') + (className ? `.${className.trim().split(/\s+/)[0]}` : '');

            const inlineStyles = parseInlineStyles($(h).attr('style'));
            const relevantProps = ['font-family', 'font-size', 'font-weight', 'color', 'line-height', 'text-transform', 'margin', 'padding'];
            let cssStyles = '';
            relevantProps.forEach(prop => {
                if (inlineStyles[prop]) {
                    cssStyles += `${prop}: ${inlineStyles[prop]}; `;
                } else {
                    cssStyles += `${prop}: ; `;
                }
            });

            headings.push({
                level: h.tagName.toLowerCase(),
                text: text.slice(0, 100),
                fontFamily: inlineStyles['font-family'] || '',
                fontSize: inlineStyles['font-size'] || '',
                fontWeight: inlineStyles['font-weight'] || '',
                color: inlineStyles['color'] || '',
                lineHeight: inlineStyles['line-height'] || '',
                textTransform: inlineStyles['text-transform'] || '',
                selector,
                outerHTML: $.html(h).slice(0, 2000),
                cssStyles
            });
        });

        // 5. SEO Rules Audit
        const title = $('title').first().text().trim();
        const metaDescription = $('meta[name="description"]').first().attr('content') || '';
        const canonicalUrl = $('link[rel="canonical"]').first().attr('href') || '';
        const ogTitle = $('meta[property="og:title"]').first().attr('content') || '';
        const ogDescription = $('meta[property="og:description"]').first().attr('content') || '';
        const ogImage = $('meta[property="og:image"]').first().attr('content') || '';

        const h1s = headingNodes.filter((i, el) => el.tagName.toLowerCase() === 'h1');
        const h2s = headingNodes.filter((i, el) => el.tagName.toLowerCase() === 'h2');
        const h3s = headingNodes.filter((i, el) => el.tagName.toLowerCase() === 'h3');

        const seo = {
            title,
            titleLength: title.length,
            isTitleValid: title.length >= 30 && title.length <= 60,
            metaDescription,
            metaDescLength: metaDescription.length,
            isMetaDescValid: metaDescription.length >= 50 && metaDescription.length <= 160,
            h1Count: h1s.length,
            h2Count: h2s.length,
            h3Count: h3s.length,
            hasSingleH1: h1s.length === 1,
            hasCanonical: !!canonicalUrl,
            canonicalUrl,
            ogTitle,
            ogDescription,
            ogImage,
            totalImages: imgNodes.length,
            imagesWithAlt: withAltCount,
            imagesMissingAlt: imgNodes.length - withAltCount,
            altCoveragePercent: imgNodes.length > 0 ? Math.round((withAltCount / imgNodes.length) * 100) : 100
        };

        // 6. Target Finding Audit
        const targetFontElems = [];
        const findingTypeLower = realFindingType.toLowerCase();
        const findingValueLower = (realFindingValue || '').toLowerCase();

        const matchesSearch = (text, search) => {
            if (!search) return true;
            return text.toLowerCase().includes(search);
        };

        const runFontFinding = () => {
            $('*').each((i, el) => {
                if (targetFontElems.length >= 100) return;
                const tagName = el.tagName.toLowerCase();
                if (['script', 'style', 'html', 'head', 'meta', 'link'].includes(tagName)) return;

                const inlineStyles = parseInlineStyles($(el).attr('style'));
                const fontFamily = inlineStyles['font-family'] || '';
                
                if (!findingValueLower && !fontFamily) return;
                if (findingValueLower && !matchesSearch(fontFamily, findingValueLower)) return;

                const fullText = $(el).text().trim().replace(/\s+/g, ' ');
                if (!fullText) return;

                const id = $(el).attr('id');
                const className = $(el).attr('class');
                const selector = tagName + (id ? `#${id}` : '') + (className ? `.${className.trim().split(/\s+/)[0]}` : '');

                targetFontElems.push({
                    elementId: `font-elem-${targetFontElems.length}`,
                    tagName,
                    selector,
                    fontFamily,
                    fontWeight: inlineStyles['font-weight'] || '',
                    textSnippet: fullText.slice(0, 60),
                    outerHTML: $.html(el).slice(0, 2000),
                    cssStyles: $(el).attr('style') || '',
                    matchType: 'Font'
                });
            });
        };

        const runImageFinding = () => {
            $('img').each((i, img) => {
                if (targetFontElems.length >= 100) return;
                const src = $(img).attr('src') || $(img).attr('data-src') || '';
                if (!matchesSearch(src, findingValueLower)) return;

                const id = $(img).attr('id');
                const className = $(img).attr('class');
                const selector = 'img' + (id ? `#${id}` : '') + (className ? `.${className.trim().split(/\s+/)[0]}` : '');

                targetFontElems.push({
                    elementId: `img-elem-${targetFontElems.length}`,
                    tagName: 'img',
                    selector,
                    fontFamily: '',
                    fontWeight: '',
                    textSnippet: src.split('/').pop() || src,
                    outerHTML: $.html(img).slice(0, 2000),
                    cssStyles: $(img).attr('style') || '',
                    matchType: 'Image'
                });
            });
        };

        const runTextFinding = () => {
            $('*').each((i, el) => {
                if (targetFontElems.length >= 100) return;
                const tagName = el.tagName.toLowerCase();
                if (['script', 'style', 'html', 'head', 'meta', 'link'].includes(tagName)) return;

                const text = $(el).text().trim().replace(/\s+/g, ' ');
                if (!text) return;

                if (matchesSearch(text, findingValueLower)) {
                    const hasChildWithText = $(el).children().toArray().some(child => {
                        const childText = $(child).text().trim().replace(/\s+/g, ' ');
                        return childText && matchesSearch(childText, findingValueLower);
                    });
                    if (!hasChildWithText) {
                        const id = $(el).attr('id');
                        const className = $(el).attr('class');
                        const selector = tagName + (id ? `#${id}` : '') + (className ? `.${className.trim().split(/\s+/)[0]}` : '');

                        const inlineStyles = parseInlineStyles($(el).attr('style'));

                        targetFontElems.push({
                            elementId: `text-elem-${targetFontElems.length}`,
                            tagName,
                            selector,
                            fontFamily: inlineStyles['font-family'] || '',
                            fontWeight: inlineStyles['font-weight'] || '',
                            textSnippet: text.slice(0, 100),
                            outerHTML: $.html(el).slice(0, 2000),
                            cssStyles: $(el).attr('style') || '',
                            matchType: 'Text'
                        });
                    }
                }
            });
        };

        const runCtaFinding = () => {
            ctaNodes.each((i, el) => {
                if (targetFontElems.length >= 100) return;
                const text = ($(el).text() || $(el).attr('value') || '').trim().replace(/\s+/g, ' ');
                if (!text) return;
                if (!matchesSearch(text, findingValueLower)) return;

                const id = $(el).attr('id');
                const className = $(el).attr('class');
                const selector = el.tagName.toLowerCase() + (id ? `#${id}` : '') + (className ? `.${className.trim().split(/\s+/)[0]}` : '');

                const inlineStyles = parseInlineStyles($(el).attr('style'));

                targetFontElems.push({
                    elementId: `cta-elem-${targetFontElems.length}`,
                    tagName: el.tagName.toLowerCase(),
                    selector,
                    fontFamily: inlineStyles['font-family'] || '',
                    fontWeight: inlineStyles['font-weight'] || '',
                    textSnippet: text.slice(0, 100),
                    outerHTML: $.html(el).slice(0, 2000),
                    cssStyles: $(el).attr('style') || '',
                    matchType: 'CTA Button'
                });
            });
        };

        if (findingTypeLower === 'font') {
            runFontFinding();
        } else if (findingTypeLower === 'image') {
            runImageFinding();
        } else if (findingTypeLower === 'text') {
            runTextFinding();
        } else if (findingTypeLower === 'cta') {
            runCtaFinding();
        } else if (findingTypeLower === 'all') {
            runFontFinding();
            runImageFinding();
            runTextFinding();
            runCtaFinding();
        }

        // 7. Stylesheet Search for Target Font
        const targetFontStyles = [];
        if (findingTypeLower === 'font' && findingValueLower) {
            $('style').each((i, el) => {
                const cssText = $(el).text();
                if (cssText.toLowerCase().includes(findingValueLower)) {
                    const rules = cssText.split('}');
                    rules.forEach(rule => {
                        if (rule.toLowerCase().includes(findingValueLower)) {
                            const parts = rule.split('{');
                            const selector = parts[0].trim() || 'Style Block';
                            const cssRuleSnippet = parts[1] ? parts[1].trim() : '';
                            targetFontStyles.push({
                                stylesheetName: 'Inline Style Tag',
                                filePath: 'Inline Style Tag',
                                selector,
                                classOrIdName: selector.match(/[\.#][a-zA-Z0-9_-]+/g) ? selector.match(/[\.#][a-zA-Z0-9_-]+/g).join(', ') : '(Tag / @font-face)',
                                cssRuleSnippet: `${selector} { ${cssRuleSnippet} }`.slice(0, 250)
                            });
                        }
                    });
                }
            });
        }

        // Process Font Classifications
        if (detectedFonts.size > 0) {
            pageResult.fonts = Array.from(detectedFonts).map(fStr => ({
                rawFontFamily: fStr,
                ...classifyFont(fStr)
            }));
        }

        pageResult.ctas = ctas;
        pageResult.images = images;
        pageResult.headings = headings;
        pageResult.seo = seo;
        pageResult.targetFontElements = targetFontElems.map(el => {
            el.screenshotPath = '';
            return el;
        });
        pageResult.targetFontStylesheets = targetFontStyles;

    } catch (err) {
        console.error(`  [!] Error auditing URL via Cheerio (${url}):`, err.message);
    }

    return pageResult;
}

// Router function selecting Cheerio or Playwright browser connection based on environment and status
async function auditSinglePage(browser, url, findingType = "font", findingValue = "Dinot", screenshotsDir = null, ssCounter = { val: 1 }) {
    if (browser) {
        try {
            return await auditSinglePagePlaywright(browser, url, findingType, findingValue, screenshotsDir, ssCounter);
        } catch (pwErr) {
            console.warn(`[!] Playwright audit failed for ${url} (${pwErr.message}). Retrying via Cheerio static parser...`);
            return await auditSinglePageCheerio(url, findingType, findingValue);
        }
    } else {
        return await auditSinglePageCheerio(url, findingType, findingValue);
    }
}

module.exports = {
    fetchSitemapUrls,
    crawlInternalUrls,
    auditSinglePage
};
