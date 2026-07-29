const cheerio = require('cheerio');
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
        const response = await axios.get(sitemapUrl, { headers: HEADERS, timeout: 30000 });
        xmlData = response.data;
    } catch (err) {
        console.error(`[!] Axios sitemap fetch failed: ${err.message}`);
        throw err;
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
            fs.writeFileSync(fallback, buffer);
            console.log(`[!] Primary Excel file locked. Saved to fallback: ${fallback}`);
        } else {
            throw e;
        }
    }
}

async function auditSinglePage(browser, url, index, total, screenshotCounterRef) {
    const elementFindings = [];
    const styleFindings = [];

    try {
        console.log(`[${index}/${total}] Auditing: ${url}`);
        const response = await axios.get(url, { headers: HEADERS, timeout: 25000 });
        const html = response.data;
        const $ = cheerio.load(html);

        const fontLower = FINDING_FONT.toLowerCase();

        // 1. Rendered DOM Elements Audit
        const candidates = $('h1, h2, h3, h4, h5, h6, p, a, button, li, span, strong, b, em, td, th, label, input, div');

        candidates.each((i, el) => {
            const tagName = el.tagName.toLowerCase();
            const inlineStyles = parseInlineStyles($(el).attr('style'));
            const fontFamily = inlineStyles['font-family'] || '';

            if (!fontFamily.toLowerCase().includes(fontLower)) {
                return;
            }

            let directText = '';
            $(el).contents().each((j, child) => {
                if (child.nodeType === 3) { // TEXT_NODE
                    directText += $(child).text();
                }
            });
            directText = directText.trim().replace(/\s+/g, ' ');

            const fullText = ($(el).text() || '').trim().replace(/\s+/g, ' ');
            if (!fullText) return;

            if (tagName === 'div') {
                const hasStructuredChild = $(el).find('h1, h2, h3, h4, h5, h6, p, a, button').length > 0;
                if (hasStructuredChild || !directText) {
                    return;
                }
            }

            const className = $(el).attr('class') || '';
            let selector = tagName;
            const id = $(el).attr('id');
            if (id) selector += `#${id}`;
            if (className) {
                const cleanClasses = className.split(/\s+/).filter(c => c && !c.includes('et_pb_column') && !c.includes('et_pb_row'));
                if (cleanClasses.length > 0) {
                    selector += '.' + cleanClasses.slice(0, 2).join('.');
                }
            }

            elementFindings.push({
                url,
                elementId: `font-elem-${elementFindings.length}`,
                tagName,
                className: className || '(None)',
                selector,
                fontFamily,
                fontWeight: inlineStyles['font-weight'] || '400',
                textSnippet: fullText.slice(0, 60),
                screenshotPath: 'N/A'
            });
        });

        // 2. CSS Stylesheet & Rule Audit
        $('style').each((i, el) => {
            const cssText = $(el).text();
            if (cssText.toLowerCase().includes(fontLower)) {
                const rules = cssText.split('}');
                rules.forEach(rule => {
                    if (rule.toLowerCase().includes(fontLower)) {
                        const parts = rule.split('{');
                        const selector = parts[0].trim() || 'Style Block';
                        const cssRuleSnippet = parts[1] ? parts[1].trim() : '';
                        const classesAndIds = [];
                        const matches = selector.match(/[\.#][a-zA-Z0-9_-]+/g);
                        if (matches) {
                            classesAndIds.push(...matches);
                        }

                        styleFindings.push({
                            url,
                            stylesheetName: 'Inline Style Tag',
                            filePath: 'Inline Style Tag',
                            selector,
                            classOrIdName: classesAndIds.length > 0 ? Array.from(new Set(classesAndIds)).join(', ') : '(None / Tag / @font-face)',
                            cssRuleSnippet: `${selector} { ${cssRuleSnippet} }`.slice(0, 250)
                        });
                    }
                });
            }
        });

        if (elementFindings.length > 0 || styleFindings.length > 0) {
            console.log(`  [OK] ${url}: Found ${elementFindings.length} elements & ${styleFindings.length} stylesheet rules referencing "${FINDING_FONT}"`);
        }

    } catch (e) {
        console.error(`  [!] Error auditing ${url}: ${e.message}`);
    }

    return { elementFindings, styleFindings };
}

async function main() {
    console.log(`========================================`);
    console.log(`[+] Target Font to Audit: "${FINDING_FONT}"`);
    console.log(`[+] Excel Output Report: ${EXCEL_OUTPUT}`);
    console.log(`========================================\n`);

    const urls = await fetchSitemapUrls(SITEMAP_URL);
    if (!urls || urls.length === 0) {
        console.error("[!] No URLs found to audit.");
        return;
    }

    const allElementFindings = [];
    const allStyleFindings = [];

    const seenElemKeys = new Set();
    const seenStyleKeys = new Set();
    const screenshotCounterRef = { val: 1 };

    for (let i = 0; i < urls.length; i += CONCURRENCY) {
        const batch = urls.slice(i, i + CONCURRENCY);
        const batchPromises = batch.map((url, idx) => auditSinglePage(null, url, i + idx + 1, urls.length, screenshotCounterRef));
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

    console.log(`\n========================================`);
    console.log(`[+] Total Unique ${FINDING_FONT} Element Records: ${allElementFindings.length}`);
    console.log(`[+] Total Unique ${FINDING_FONT} Stylesheet Rule Records: ${allStyleFindings.length}`);
    console.log(`========================================\n`);

    await exportToExcel(allElementFindings, allStyleFindings, EXCEL_OUTPUT);
}

main().then(() => {
    console.log("[✓] Node.js Static Font Audit Finished Successfully.");
}).catch(err => {
    console.error("[!] Script Execution Error:", err);
});
