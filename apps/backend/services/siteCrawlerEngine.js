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

async function fetchSitemapUrls(sitemapUrl) {
    console.log(`[+] Fetching XML Sitemap (Axios Static): ${sitemapUrl}`);
    let xmlData = null;

    try {
        const response = await axios.get(sitemapUrl, { headers: HEADERS, timeout: 20000 });
        xmlData = response.data;
    } catch (axiosErr) {
        console.error(`[!] Axios sitemap fetch failed: ${axiosErr.message}`);
        throw axiosErr;
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

async function crawlInternalUrls(startUrl, maxPages) {
    console.log(`[+] Crawling internal URLs (Axios + Cheerio) starting from: ${startUrl}`);
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

async function auditSinglePage(browser, url, findingType = "font", findingValue = "Dinot", screenshotsDir = null, ssCounter = { val: 1 }) {
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
        console.log(`[+] Auditing URL (Axios + Cheerio): ${url}`);
        const response = await axios.get(url, { headers: HEADERS, timeout: 25000 });
        const html = response.data;
        const $ = cheerio.load(html);

        // -------------------------------------------------------------
        // 1. Font Families Audit (Scan inline styles & style tags)
        // -------------------------------------------------------------
        const detectedFonts = new Set();

        // Scan inline styles
        $('[style]').each((i, el) => {
            const inlineStyles = parseInlineStyles($(el).attr('style'));
            if (inlineStyles['font-family']) {
                inlineStyles['font-family'].split(',').forEach(f => {
                    const cleaned = f.trim().replace(/['"]/g, '').trim();
                    if (cleaned) detectedFonts.add(cleaned);
                });
            }
        });

        // Scan internal style tags
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

        // -------------------------------------------------------------
        // 2. Button & CTA Design Audit
        // -------------------------------------------------------------
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
                    cssStyles += `${prop}: N/A; `;
                }
            });

            ctas.push({
                tagName: el.tagName.toLowerCase(),
                text: text.slice(0, 80),
                href: $(el).attr('href') || $(el).attr('action') || 'N/A',
                fontFamily: inlineStyles['font-family'] || 'N/A (CSS অডিট অনুপস্থিত)',
                fontSize: inlineStyles['font-size'] || 'N/A',
                fontWeight: inlineStyles['font-weight'] || 'N/A',
                color: inlineStyles['color'] || 'N/A',
                backgroundColor: inlineStyles['background-color'] || 'N/A',
                borderRadius: inlineStyles['border-radius'] || 'N/A',
                padding: inlineStyles['padding'] || 'N/A',
                boxShadow: inlineStyles['box-shadow'] || 'N/A',
                selector,
                outerHTML: $.html(el).slice(0, 2000),
                cssStyles
            });
        });

        // -------------------------------------------------------------
        // 3. Images Audit (Missing Alt Tags)
        // -------------------------------------------------------------
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
                    cssStyles += `${prop}: N/A; `;
                }
            });

            images.push({
                src: src.slice(0, 150),
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

        // -------------------------------------------------------------
        // 4. Heading H1-H6 Audit
        // -------------------------------------------------------------
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
                    cssStyles += `${prop}: N/A; `;
                }
            });

            headings.push({
                level: h.tagName.toLowerCase(),
                text: text.slice(0, 100),
                fontFamily: inlineStyles['font-family'] || 'N/A (CSS অডিট অনুপস্থিত)',
                fontSize: inlineStyles['font-size'] || 'N/A',
                fontWeight: inlineStyles['font-weight'] || 'N/A',
                color: inlineStyles['color'] || 'N/A',
                lineHeight: inlineStyles['line-height'] || 'N/A',
                textTransform: inlineStyles['text-transform'] || 'N/A',
                selector,
                outerHTML: $.html(h).slice(0, 2000),
                cssStyles
            });
        });

        // -------------------------------------------------------------
        // 5. SEO Rules Audit
        // -------------------------------------------------------------
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

        // -------------------------------------------------------------
        // 6. Target Finding (Font, Image, Text, CTA, All) Audit
        // -------------------------------------------------------------
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
                
                // If target is empty, we only match elements that explicitly declare inline font-family
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
                    fontWeight: inlineStyles['font-weight'] || 'N/A',
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

                const inlineStyles = parseInlineStyles($(img).attr('style'));

                targetFontElems.push({
                    elementId: `img-elem-${targetFontElems.length}`,
                    tagName: 'img',
                    selector,
                    fontFamily: 'N/A',
                    fontWeight: 'N/A',
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
                            fontFamily: inlineStyles['font-family'] || 'N/A',
                            fontWeight: inlineStyles['font-weight'] || 'N/A',
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
                    fontFamily: inlineStyles['font-family'] || 'N/A',
                    fontWeight: inlineStyles['font-weight'] || 'N/A',
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

        // -------------------------------------------------------------
        // 7. Stylesheet Search for Target Font (Regex Matching)
        // -------------------------------------------------------------
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
        } else {
            pageResult.fonts = [];
        }

        pageResult.ctas = ctas;
        pageResult.images = images;
        pageResult.headings = headings;
        pageResult.seo = seo;
        pageResult.targetFontElements = targetFontElems.map(el => {
            el.screenshotPath = 'N/A';
            return el;
        });
        pageResult.targetFontStylesheets = targetFontStyles;

    } catch (err) {
        console.error(`  [!] Error auditing URL (${url}):`, err.message);
    }

    return pageResult;
}

module.exports = {
    fetchSitemapUrls,
    crawlInternalUrls,
    auditSinglePage
};
