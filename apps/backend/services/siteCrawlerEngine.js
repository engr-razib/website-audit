const { chromium } = require('playwright');
const axios = require('axios');
const xml2js = require('xml2js');
const path = require('path');
const fs = require('fs');
const { classifyFont } = require('./fontClassificationService');

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

async function fetchSitemapUrls(sitemapUrl) {
    console.log(`[+] Fetching XML Sitemap: ${sitemapUrl}`);
    let xmlData = null;

    let browser = null;
    try {
        browser = await chromium.launch({ headless: true, args: ['--disable-web-security'] });
        const context = await browser.newContext({ userAgent: HEADERS['User-Agent'] });
        const page = await context.newPage();
        const res = await page.goto(sitemapUrl, { waitUntil: 'commit', timeout: 20000 });
        xmlData = await res.text();
        await context.close();
    } catch (pwErr) {
        console.warn(`[!] Playwright sitemap fetch warning (${pwErr.message}). Retrying via Axios...`);
        try {
            const response = await axios.get(sitemapUrl, { headers: HEADERS, timeout: 15000 });
            xmlData = response.data;
        } catch (axiosErr) {
            console.error(`[!] Axios sitemap fetch also failed: ${axiosErr.message}`);
            throw axiosErr;
        }
    } finally {
        if (browser) await browser.close();
    }

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

async function auditSinglePage(browser, url, targetFontName = "Dinot", screenshotsDir = null, ssCounter = { val: 1 }) {
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
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
        await page.waitForTimeout(1000);

        const evaluatedData = await page.evaluate((targetFont) => {
            const fontLower = targetFont.toLowerCase();

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

                ctas.push({
                    tagName: el.tagName.toLowerCase(),
                    text: text.slice(0, 80),
                    href: el.href || el.getAttribute('action') || 'N/A',
                    fontFamily: style.fontFamily,
                    fontSize: style.fontSize,
                    fontWeight: style.fontWeight,
                    color: style.color,
                    backgroundColor: style.backgroundColor,
                    borderRadius: style.borderRadius,
                    padding: style.padding,
                    boxShadow: style.boxShadow,
                    selector
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

                images.push({
                    src: src.slice(0, 150),
                    alt: hasAlt ? alt.trim() : '(Missing Alt Tag)',
                    hasAlt,
                    width: img.naturalWidth || img.width || 0,
                    height: img.naturalHeight || img.height || 0,
                    parentTag,
                    selector
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

                headings.push({
                    level: h.tagName.toLowerCase(),
                    text: text.slice(0, 100),
                    fontFamily: style.fontFamily,
                    fontSize: style.fontSize,
                    fontWeight: style.fontWeight,
                    color: style.color,
                    lineHeight: style.lineHeight,
                    textTransform: style.textTransform,
                    selector: h.id ? `${h.tagName.toLowerCase()}#${h.id}` : h.tagName.toLowerCase()
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
            // 6. Target Font (Dinot) Audit
            // -------------------------------------------------------------
            const targetFontElems = [];
            const candidates = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, a, button, li, span, strong, b, em, td, th, label, input, div');

            for (let i = 0; i < candidates.length; i++) {
                const el = candidates[i];
                const style = window.getComputedStyle(el);
                if (!style || style.display === 'none' || style.visibility === 'hidden') continue;

                const fontFamily = style.fontFamily || '';
                if (!fontFamily.toLowerCase().includes(fontLower)) continue;

                const tagName = el.tagName.toLowerCase();
                const fullText = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ');
                if (!fullText) continue;

                const elementId = 'font-elem-' + targetFontElems.length;
                el.setAttribute('data-font-audit-id', elementId);

                targetFontElems.push({
                    elementId,
                    tagName,
                    selector: tagName + (el.id ? `#${el.id}` : ''),
                    fontFamily,
                    fontWeight: style.fontWeight || '400',
                    textSnippet: fullText.slice(0, 60)
                });
            }

            const targetFontStyles = [];
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

            return {
                detectedFonts: Array.from(detectedFonts),
                ctas,
                images,
                headings,
                seo,
                targetFontElems,
                targetFontStyles
            };
        }, targetFontName);

        // Process Font Classifications
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

                match.screenshotPath = ssSaved ? ssPath : 'N/A';
                pageResult.targetFontElements.push(match);
            }
        } else {
            pageResult.targetFontElements = evaluatedData.targetFontElems || [];
        }

        pageResult.targetFontStylesheets = evaluatedData.targetFontStyles || [];

    } catch (err) {
        console.error(`  [!] Error auditing URL (${url}):`, err.message);
    } finally {
        await context.close();
    }

    return pageResult;
}

module.exports = {
    fetchSitemapUrls,
    auditSinglePage
};
