const { chromium } = require('playwright');
const ExcelJS = require('exceljs');
const axios = require('axios');
const xml2js = require('xml2js');
const path = require('path');
const fs = require('fs');

// Target Font Configuration (Dynamic via FINDING_FONT variable or Environment Variable)
const FINDING_FONT = process.env.FINDING_FONT || "Dinot";
const FONT_SLUG = FINDING_FONT.toLowerCase().replace(/[^a-z0-9_-]/g, '_');

const SITEMAP_URL = "https://carbissolutions.com/page-sitemap.xml";
const SCRIPT_DIR = __dirname;
const EXCEL_OUTPUT = path.join(SCRIPT_DIR, `carbissolutions_playwright_${FONT_SLUG}_audit.xlsx`);
const SCREENSHOTS_DIR = path.join(SCRIPT_DIR, `${FONT_SLUG}_font_screenshots`);
const CONCURRENCY = 4;

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function fetchSitemapUrls(sitemapUrl) {
    console.log(`[+] Fetching XML Sitemap: ${sitemapUrl}`);
    let xmlData = null;
    
    // Attempt 1: Axios with 30s timeout
    try {
        const response = await axios.get(sitemapUrl, { headers: HEADERS, timeout: 30000 });
        xmlData = response.data;
    } catch (err) {
        console.warn(`[!] Axios sitemap fetch failed (${err.message}). Retrying via Playwright Chromium...`);
    }

    // Attempt 2: Playwright fallback if Axios failed
    if (!xmlData) {
        let browser = null;
        try {
            browser = await chromium.launch({ headless: true, args: ['--disable-web-security'] });
            const context = await browser.newContext({ userAgent: HEADERS['User-Agent'] });
            const page = await context.newPage();
            const res = await page.goto(sitemapUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
            xmlData = await res.text();
            await context.close();
        } catch (pwErr) {
            console.error(`[!] Playwright sitemap fetch also failed: ${pwErr.message}`);
            throw pwErr;
        } finally {
            if (browser) await browser.close();
        }
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

    const deduped = Array.from(new Set(pageUrls));
    console.log(`[+] Found ${deduped.length} web page URLs to audit.`);
    return deduped;
}

async function exportToExcel(elementRecords, styleRecords, filename) {
    console.log(`[+] Exporting ${elementRecords.length} element record(s) and ${styleRecords.length} stylesheet rule record(s) into Excel report: ${filename}`);

    const workbook = new ExcelJS.Workbook();

    // -------------------------------------------------------------
    // Worksheet 1: Rendered DOM Elements Font Audit
    // -------------------------------------------------------------
    const elemWorksheet = workbook.addWorksheet(`${FINDING_FONT} Element Audit`);
    elemWorksheet.views = [{ state: 'frozen', ySplit: 1, showGridLines: true }];

    const elemHeaders = [
        'SL',
        'Target Page URL',
        'HTML Tag Name',
        'CSS Class Name / Selector',
        'Target Content / Text Snippet',
        'Computed Font Family',
        'Computed Font Weight',
        'Screenshot Reference'
    ];

    const elemColWidths = [8, 45, 15, 35, 42, 32, 18, 55];

    const elemHeaderRow = elemWorksheet.addRow(elemHeaders);
    elemHeaderRow.height = 28;
    elemHeaderRow.eachCell((cell, colNum) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F497D' } };
        cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = {
            top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
            left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
            bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
            right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
        };
        elemWorksheet.getColumn(colNum).width = elemColWidths[colNum - 1];
    });

    for (let idx = 0; idx < elementRecords.length; idx++) {
        const rec = elementRecords[idx];
        const rowValues = [
            Number(idx + 1),
            String(rec.url || ''),
            String(rec.tagName || ''),
            String(rec.selector || ''),
            String(rec.textSnippet || ''),
            String(rec.fontFamily || ''),
            String(rec.fontWeight || ''),
            String(rec.screenshotPath || 'N/A')
        ];

        const row = elemWorksheet.addRow(rowValues);
        row.height = 24;
        const isEven = idx % 2 === 1;
        const rowBgColor = isEven ? 'FFF2F5F9' : 'FFFFFFFF';

        row.eachCell((cell, colNumber) => {
            cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF333333' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBgColor } };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
            };

            if (colNumber === 1 || colNumber === 3 || colNumber === 7) {
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            } else {
                cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
            }
        });
    }

    // -------------------------------------------------------------
    // Worksheet 2: CSS Stylesheets Font Audit
    // -------------------------------------------------------------
    const styleWorksheet = workbook.addWorksheet(`${FINDING_FONT} Stylesheet Audit`);
    styleWorksheet.views = [{ state: 'frozen', ySplit: 1, showGridLines: true }];

    const styleHeaders = [
        'SL',
        'Target Page URL',
        'Stylesheet Name',
        'Stylesheet File Path / URL',
        'Class / ID Name',
        'Full CSS Selector',
        'CSS Rule Snippet'
    ];

    const styleColWidths = [8, 45, 30, 60, 30, 35, 65];

    const styleHeaderRow = styleWorksheet.addRow(styleHeaders);
    styleHeaderRow.height = 28;
    styleHeaderRow.eachCell((cell, colNum) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F497D' } };
        cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = {
            top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
            left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
            bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
            right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
        };
        styleWorksheet.getColumn(colNum).width = styleColWidths[colNum - 1];
    });

    for (let idx = 0; idx < styleRecords.length; idx++) {
        const rec = styleRecords[idx];
        const rowValues = [
            Number(idx + 1),
            String(rec.url || ''),
            String(rec.stylesheetName || ''),
            String(rec.filePath || ''),
            String(rec.classOrIdName || ''),
            String(rec.selector || ''),
            String(rec.cssRuleSnippet || '')
        ];

        const row = styleWorksheet.addRow(rowValues);
        row.height = 24;
        const isEven = idx % 2 === 1;
        const rowBgColor = isEven ? 'FFF2F5F9' : 'FFFFFFFF';

        row.eachCell((cell, colNumber) => {
            cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF333333' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBgColor } };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
            };

            if (colNumber === 1 || colNumber === 3 || colNumber === 5) {
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            } else {
                cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
            }
        });
    }

    try {
        const buffer = await workbook.xlsx.writeBuffer();
        fs.writeFileSync(filename, buffer);
        console.log(`[OK] Successfully wrote Excel report to disk: ${filename}`);
    } catch (e) {
        if (e.code === 'EBUSY' || e.code === 'EPERM') {
            const fallback = filename.replace('.xlsx', '_v2.xlsx');
            const buffer = await workbook.xlsx.writeBuffer();
            fs.writeFileSync(fallback, fallback ? buffer : buffer);
            console.log(`[!] Primary Excel file locked. Saved to fallback: ${fallback}`);
        } else {
            throw e;
        }
    }
}

async function auditSinglePage(browser, url, index, total, screenshotCounterRef) {
    const context = await browser.newContext({ userAgent: HEADERS['User-Agent'], viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const elementFindings = [];
    const styleFindings = [];

    try {
        console.log(`[${index}/${total}] Auditing: ${url}`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
        await page.waitForTimeout(1500);

        const auditData = await page.evaluate((targetFontName) => {
            const elemResults = [];
            const styleResults = [];
            const fontLower = targetFontName.toLowerCase();

            // 1. Rendered DOM Elements Audit
            const candidates = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, a, button, li, span, strong, b, em, td, th, label, input, div');

            for (let i = 0; i < candidates.length; i++) {
                const el = candidates[i];
                const style = window.getComputedStyle(el);
                if (!style || style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
                    continue;
                }

                const fontFamily = style.fontFamily || '';
                if (!fontFamily.toLowerCase().includes(fontLower)) {
                    continue;
                }

                const tagName = el.tagName.toLowerCase();

                let directText = '';
                for (const child of el.childNodes) {
                    if (child.nodeType === Node.TEXT_NODE) {
                        directText += child.textContent;
                    }
                }
                directText = directText.trim().replace(/\s+/g, ' ');

                const fullText = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ');
                if (!fullText) continue;

                if (tagName === 'div') {
                    const hasStructuredChild = el.querySelector('h1, h2, h3, h4, h5, h6, p, a, button');
                    if (hasStructuredChild || !directText) {
                        continue;
                    }
                }

                const className = typeof el.className === 'string' ? el.className.trim() : '';
                let selector = tagName;
                if (el.id) selector += `#${el.id}`;
                if (className) {
                    const cleanClasses = className.split(/\s+/).filter(c => c && !c.includes('et_pb_column') && !c.includes('et_pb_row'));
                    if (cleanClasses.length > 0) {
                        selector += '.' + cleanClasses.slice(0, 2).join('.');
                    }
                }

                const elementId = 'font-elem-' + elemResults.length;
                el.setAttribute('data-font-audit-id', elementId);

                try {
                    el.style.outline = '3px solid #E63946';
                    el.style.outlineOffset = '2px';
                    el.style.backgroundColor = 'rgba(230, 57, 70, 0.12)';
                    el.style.transition = 'all 0.3s ease';

                    const badge = document.createElement('span');
                    badge.className = 'font-audit-badge';
                    badge.innerText = `[${targetFontName}: ${fontFamily} | Weight: ${style.fontWeight}]`;
                    badge.style.position = 'absolute';
                    badge.style.top = '-22px';
                    badge.style.left = '0';
                    badge.style.backgroundColor = '#E63946';
                    badge.style.color = '#FFFFFF';
                    badge.style.fontSize = '11px';
                    badge.style.fontFamily = 'Segoe UI, sans-serif';
                    badge.style.fontWeight = 'bold';
                    badge.style.padding = '2px 6px';
                    badge.style.borderRadius = '3px';
                    badge.style.zIndex = '999999';
                    badge.style.pointerEvents = 'none';

                    if (el.style.position === 'static' || !el.style.position) {
                        el.style.position = 'relative';
                    }
                    el.appendChild(badge);
                } catch(e){}

                elemResults.push({
                    elementId,
                    tagName,
                    className: className || '(None)',
                    selector,
                    fontFamily,
                    fontWeight: style.fontWeight || '400',
                    textSnippet: fullText.slice(0, 60)
                });
            }

            // 2. CSS Stylesheet & Rule Audit
            function searchRules(rules, stylesheetName, filePath) {
                if (!rules) return;
                for (let i = 0; i < rules.length; i++) {
                    const r = rules[i];
                    if (r.cssRules) {
                        searchRules(r.cssRules, stylesheetName, filePath);
                    }
                    const cssText = r.cssText || '';
                    if (cssText.toLowerCase().includes(fontLower)) {
                        const selector = r.selectorText || (r.type === 5 ? '@font-face' : (r.name ? `@keyframes ${r.name}` : 'Rule'));
                        const classesAndIds = [];
                        if (r.selectorText) {
                            const matches = r.selectorText.match(/[\.#][a-zA-Z0-9_-]+/g);
                            if (matches) {
                                classesAndIds.push(...matches);
                            }
                        }

                        styleResults.push({
                            stylesheetName,
                            filePath,
                            selector,
                            classOrIdName: classesAndIds.length > 0 ? Array.from(new Set(classesAndIds)).join(', ') : '(None / Tag / @font-face)',
                            cssRuleSnippet: cssText.trim().replace(/\s+/g, ' ').slice(0, 250)
                        });
                    }
                }
            }

            const sheets = Array.from(document.styleSheets);
            sheets.forEach((sheet) => {
                let filePath = sheet.href || 'Inline Style Tag';
                let stylesheetName = 'Inline Style Tag';
                if (sheet.href) {
                    try {
                        const u = new URL(sheet.href);
                        stylesheetName = u.pathname.split('/').pop() || sheet.href;
                    } catch(e) {
                        stylesheetName = sheet.href;
                    }
                } else if (sheet.ownerNode && sheet.ownerNode.id) {
                    stylesheetName = `Inline <style id="${sheet.ownerNode.id}">`;
                }

                try {
                    if (sheet.cssRules) {
                        searchRules(sheet.cssRules, stylesheetName, filePath);
                    }
                } catch(err) {
                    // CORS or security restriction fallback
                }
            });

            return { elemResults, styleResults };
        }, FINDING_FONT);

        const pageElemMatches = auditData ? auditData.elemResults : [];
        const pageStyleMatches = auditData ? auditData.styleResults : [];

        if (pageElemMatches.length > 0 || pageStyleMatches.length > 0) {
            console.log(`  [OK] ${url}: Found ${pageElemMatches.length} rendered element(s) & ${pageStyleMatches.length} stylesheet rule(s) referencing "${FINDING_FONT}"`);
        }

        // Process Element Screenshots
        if (pageElemMatches && pageElemMatches.length > 0) {
            for (const match of pageElemMatches) {
                const urlSlug = url.replace(/https?:\/\//, '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 25);
                const ssNum = screenshotCounterRef.val++;
                const screenshotFilename = `${FONT_SLUG}_${ssNum.toString().padStart(3, '0')}_${urlSlug}_${match.tagName}.png`;
                let screenshotPath = path.join(SCREENSHOTS_DIR, screenshotFilename);

                let ssSaved = false;
                try {
                    const elemHandle = await page.$(`[data-font-audit-id="${match.elementId}"]`);
                    if (elemHandle) {
                        await elemHandle.scrollIntoViewIfNeeded();
                        await page.waitForTimeout(200);
                        await elemHandle.screenshot({ path: screenshotPath, timeout: 4000 });
                        ssSaved = true;
                    }
                } catch (e) {}

                if (!ssSaved) {
                    try {
                        await page.screenshot({ path: screenshotPath, timeout: 4000 });
                        ssSaved = true;
                    } catch (e) {
                        screenshotPath = "Screenshot unavailable";
                    }
                }

                match.screenshotPath = ssSaved ? screenshotPath : "N/A";
                elementFindings.push({ url, ...match });
            }
        }

        // Process Style Findings
        if (pageStyleMatches && pageStyleMatches.length > 0) {
            for (const sMatch of pageStyleMatches) {
                styleFindings.push({ url, ...sMatch });
            }
        }

    } catch (e) {
        console.error(`  [!] Error auditing ${url}: ${e.message}`);
    } finally {
        await context.close();
    }

    return { elementFindings, styleFindings };
}

async function main() {
    console.log(`========================================`);
    console.log(`[+] Target Font to Audit: "${FINDING_FONT}"`);
    console.log(`[+] Excel Output Report: ${EXCEL_OUTPUT}`);
    console.log(`[+] Screenshots Folder: ${SCREENSHOTS_DIR}`);
    console.log(`========================================\n`);

    const urls = await fetchSitemapUrls(SITEMAP_URL);
    if (!urls || urls.length === 0) {
        console.error("[!] No URLs found to audit.");
        return;
    }

    const isHeadless = process.env.HEADLESS !== 'false';
    console.log(`[+] Launching Playwright Chromium Browser (Headless: ${isHeadless}, Concurrency: ${CONCURRENCY})...`);
    const browser = await chromium.launch({ headless: isHeadless, args: ['--disable-web-security'] });

    const allElementFindings = [];
    const allStyleFindings = [];

    const seenElemKeys = new Set();
    const seenStyleKeys = new Set();
    const screenshotCounterRef = { val: 1 };

    for (let i = 0; i < urls.length; i += CONCURRENCY) {
        const batch = urls.slice(i, i + CONCURRENCY);
        const batchPromises = batch.map((url, idx) => auditSinglePage(browser, url, i + idx + 1, urls.length, screenshotCounterRef));
        const batchResults = await Promise.all(batchPromises);

        batchResults.forEach(res => {
            if (res && res.elementFindings) {
                res.elementFindings.forEach(match => {
                    const key = `${match.url}|${match.tagName}|${match.selector}|${match.fontFamily}|${match.fontWeight}|${match.textSnippet}`;
                    if (!seenElemKeys.has(key)) {
                        seenElemKeys.add(key);
                        allElementFindings.push(match);
                    }
                });
            }

            if (res && res.styleFindings) {
                res.styleFindings.forEach(sMatch => {
                    const sKey = `${sMatch.url}|${sMatch.stylesheetName}|${sMatch.filePath}|${sMatch.selector}|${sMatch.cssRuleSnippet}`;
                    if (!seenStyleKeys.has(sKey)) {
                        seenStyleKeys.add(sKey);
                        allStyleFindings.push(sMatch);
                    }
                });
            }
        });
    }

    await browser.close();

    console.log(`\n========================================`);
    console.log(`[+] Total Unique ${FINDING_FONT} Element Records: ${allElementFindings.length}`);
    console.log(`[+] Total Unique ${FINDING_FONT} Stylesheet Rule Records: ${allStyleFindings.length}`);
    console.log(`[+] Screenshots Saved to: ${SCREENSHOTS_DIR}`);
    console.log(`========================================\n`);

    await exportToExcel(allElementFindings, allStyleFindings, EXCEL_OUTPUT);
}

main().then(() => {
    console.log("[✓] Node.js Dynamic Font Audit Finished Successfully.");
}).catch(err => {
    console.error("[!] Script Execution Error:", err);
});
