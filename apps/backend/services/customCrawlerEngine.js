const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { chromium } = require('playwright');
const AdmZip = require('adm-zip');
const { crawlInternalUrls } = require('./siteCrawlerEngine');
const { isUrlAllowed } = require('./robotsService');

// Helper to sanitize filename
function getSafeImageFilename(url, contentType, index) {
    let filename = '';
    try {
        const parsed = new URL(url);
        filename = path.basename(parsed.pathname);
    } catch (e) {
        filename = `image_${index}`;
    }
    
    filename = decodeURIComponent(filename).trim();
    filename = filename.replace(/[/\\?%*:|"<>]/g, '_');
    
    let ext = path.extname(filename).toLowerCase();
    let base = path.basename(filename, ext);
    
    const standardExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico', '.tiff'];
    if (!ext || !standardExts.includes(ext)) {
        if (contentType) {
            const mimeToExt = {
                'image/jpeg': '.jpg',
                'image/jpg': '.jpg',
                'image/png': '.png',
                'image/gif': '.gif',
                'image/webp': '.webp',
                'image/svg+xml': '.svg',
                'image/bmp': '.bmp',
                'image/x-icon': '.ico',
                'image/vnd.microsoft.icon': '.ico',
                'image/tiff': '.tiff'
            };
            ext = mimeToExt[contentType.toLowerCase().split(';')[0].trim()] || '.png';
        } else {
            ext = '.png';
        }
    }
    
    if (!base) {
        base = `image_${index}`;
    }
    
    return `${base}${ext}`;
}

/**
 * Parses the first row of the provided Excel sheet buffer to return headers
 */
async function parseExcelHeaders(fileBuffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
        throw new Error('No worksheets found in the Excel template.');
    }
    
    const headers = [];
    const firstRow = worksheet.getRow(1);
    
    // Read headers up to columnCount to preserve order
    for (let i = 1; i <= worksheet.columnCount; i++) {
        const val = firstRow.getCell(i).value;
        if (val !== undefined && val !== null) {
            headers.push(val.toString().trim());
        }
    }
    
    if (headers.length === 0) {
        throw new Error('No headers found in the first row of the Excel template.');
    }
    return headers;
}

/**
 * Core Custom Crawling Engine
 */
async function runCustomCrawl({
    jobId,
    url,
    crawlOption,
    maxPages,
    containerSelector,
    mappings,
    excelTemplateBuffer,
    jobDir,
    browserlessKey,
    updateProgress
}) {
    const imagesDir = path.join(jobDir, 'images');
    if (crawlOption === 'data-and-images') {
        fs.mkdirSync(imagesDir, { recursive: true });
    }

    // 1. Parse excel headers
    const headers = await parseExcelHeaders(excelTemplateBuffer);
    
    // Check robots.txt compliance for starting URL
    const allowed = await isUrlAllowed(url, 'AuditBot');
    if (!allowed) {
        throw new Error(`The target URL is disallowed by the website's robots.txt policy.`);
    }
    
    // 2. Launch browser
    let browser = null;
    let page = null;
    if (browserlessKey) {
        try {
            browser = await chromium.connectOverCDP(`wss://chrome.browserless.io?token=${browserlessKey}`);
            console.log('[+] Connected to Browserless CDP for custom crawling');
        } catch (e) {
            console.error('[!] Browserless connection failed for custom crawl, using local browser:', e.message);
        }
    }

    if (!browser) {
        try {
            browser = await chromium.launch({
                headless: true,
                args: ['--disable-web-security', '--no-sandbox']
            });
            console.log('[+] Launched local Playwright browser for custom crawling');
        } catch (e) {
            console.warn('[!] Failed to launch local Playwright. Falling back to static axios/cheerio engine');
        }
    }

    if (browser) {
        try {
            const context = await browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (compatible; AuditBot/1.0; +https://audit.razib.bd/bot)'
            });
            page = await context.newPage();
        } catch (e) {
            console.error('[!] Failed to create browser context:', e.message);
        }
    }

    // 3. Resolve pages to crawl
    let urlsToCrawl = [url];
    if (maxPages > 1) {
        try {
            urlsToCrawl = await crawlInternalUrls(browser, url, maxPages);
        } catch (err) {
            console.error('[!] Crawl internal URLs failed:', err.message);
        }
    }
    
    // Ensure starting URL is first
    urlsToCrawl = Array.from(new Set([url, ...urlsToCrawl])).slice(0, maxPages);
    
    const crawledData = [];
    const imageDownloadQueue = [];

    // Helper to download an image from a URL
    const downloadImage = async (imgUrl, destPath, browserPage) => {
        let buffer = null;
        let contentType = null;
        let success = false;

        if (browserPage) {
            try {
                const result = await browserPage.evaluate(async (srcUrl) => {
                    try {
                        const res = await fetch(srcUrl);
                        if (!res.ok) throw new Error(`HTTP ${res.status}`);
                        const arrayBuf = await res.arrayBuffer();
                        const bytes = new Uint8Array(arrayBuf);
                        let binary = '';
                        const len = bytes.length;
                        const chunk = 8192;
                        for (let idx = 0; idx < len; idx += chunk) {
                            const slice = bytes.subarray(idx, Math.min(idx + chunk, len));
                            binary += String.fromCharCode.apply(null, slice);
                        }
                        return { success: true, base64: btoa(binary), contentType: res.headers.get('content-type') };
                    } catch (e) {
                        return { success: false, error: e.message };
                    }
                }, imgUrl);

                if (result.success) {
                    buffer = Buffer.from(result.base64, 'base64');
                    contentType = result.contentType;
                    success = true;
                }
            } catch (err) {
                // Ignore and try fallback
            }
        }

        if (!success) {
            try {
                const response = await axios.get(imgUrl, {
                    responseType: 'arraybuffer',
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (compatible; AuditBot/1.0; +https://audit.razib.bd/bot)'
                    }
                });
                buffer = Buffer.from(response.data);
                contentType = response.headers['content-type'];
                success = true;
            } catch (err) {
                console.error(`[-] Failed to download image via axios fallback: ${imgUrl}`, err.message);
            }
        }

        if (success && buffer) {
            fs.writeFileSync(destPath, buffer);
            return { filename: path.basename(destPath), size: buffer.length };
        }
        throw new Error('Image download failed');
    };

    // 4. Crawl each page
    for (let i = 0; i < urlsToCrawl.length; i++) {
        const currentUrl = urlsToCrawl[i];
        updateProgress(i + 1, urlsToCrawl.length, currentUrl, crawledData);

        let itemsOnPage = [];

        if (page) {
            try {
                await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
                // Playwright extraction
                itemsOnPage = await page.evaluate(({ containerSelector, headers, mappings, currentUrl }) => {
                    const items = [];
                    const containers = containerSelector ? document.querySelectorAll(containerSelector) : [document.body];
                    
                    containers.forEach(container => {
                        const row = {};
                        row['Page URL'] = currentUrl;
                        
                        headers.forEach(header => {
                            const mapping = mappings[header];
                            if (mapping && mapping.selector) {
                                const cellEl = container.querySelector(mapping.selector);
                                if (cellEl) {
                                    if (mapping.type === 'text') {
                                        row[header] = cellEl.textContent.trim();
                                    } else if (mapping.type === 'attr' && mapping.attrName) {
                                        // Resolve relative URLs in browser
                                        if (mapping.attrName === 'src' && cellEl.src) {
                                            row[header] = cellEl.src;
                                        } else if (mapping.attrName === 'href' && cellEl.href) {
                                            row[header] = cellEl.href;
                                        } else {
                                            row[header] = cellEl.getAttribute(mapping.attrName) || '';
                                        }
                                    }
                                } else {
                                    row[header] = '';
                                }
                            } else {
                                row[header] = '';
                            }
                        });
                        items.push(row);
                    });
                    return items;
                }, { containerSelector, headers, mappings, currentUrl });
            } catch (err) {
                console.error(`[!] Playwright custom extraction failed for ${currentUrl}:`, err.message);
                // Fallback to Cheerio for this page
                itemsOnPage = await extractCheerio(currentUrl, containerSelector, headers, mappings);
            }
        } else {
            // Cheerio engine
            itemsOnPage = await extractCheerio(currentUrl, containerSelector, headers, mappings);
        }

        // Process rows and collect image urls if data-and-images
        for (const item of itemsOnPage) {
            crawledData.push(item);
            
            if (crawlOption === 'data-and-images') {
                const rowIndex = crawledData.length - 1;
                // Scan all columns for images
                for (const header of headers) {
                    const mapping = mappings[header];
                    const val = item[header];
                    const isImgField = mapping && mapping.type === 'attr' && mapping.attrName === 'src';
                    const looksLikeUrl = val && typeof val === 'string' && val.startsWith('http');
                    
                    if ((isImgField || header.toLowerCase().includes('image') || header.toLowerCase().includes('photo')) && looksLikeUrl) {
                        imageDownloadQueue.push({
                            url: val,
                            rowIndex,
                            headerName: header
                        });
                    }
                }
            }
        }
    }

    // 5. Close browser
    if (browser) {
        try {
            await browser.close();
        } catch (e) {}
    }

    // 6. Download queued images
    if (crawlOption === 'data-and-images' && imageDownloadQueue.length > 0) {
        // Re-launch browser context for downloads to speed up/bypass blockers
        let downloadBrowser = null;
        let downloadPage = null;
        try {
            if (browserlessKey) {
                downloadBrowser = await chromium.connectOverCDP(`wss://chrome.browserless.io?token=${browserlessKey}`);
            } else {
                downloadBrowser = await chromium.launch({ headless: true });
            }
            if (downloadBrowser) {
                const ctx = await downloadBrowser.newContext();
                downloadPage = await ctx.newPage();
            }
        } catch (e) {
            console.warn('[!] Failed to launch browser for image downloads, using axios only.');
        }

        for (let idx = 0; idx < imageDownloadQueue.length; idx++) {
            const task = imageDownloadQueue[idx];
            
            // Wait 100ms to avoid flooding the server with image requests
            await new Promise(resolve => setTimeout(resolve, 100));

            try {
                // Generate a safe unique filename
                const safeName = getSafeImageFilename(task.url, null, idx + 1);
                const destFilename = `row_${task.rowIndex + 1}_${task.headerName.replace(/\s+/g, '_')}_${safeName}`;
                const destPath = path.join(imagesDir, destFilename);
                
                await downloadImage(task.url, destPath, downloadPage);
                
                // Update dataset to include local image link
                crawledData[task.rowIndex][`${task.headerName} (Local Path)`] = `images/${destFilename}`;
            } catch (err) {
                console.error(`[-] Failed to download image ${task.url}:`, err.message);
                crawledData[task.rowIndex][`${task.headerName} (Local Path)`] = 'DOWNLOAD_FAILED';
            }
        }

        if (downloadBrowser) {
            try {
                await downloadBrowser.close();
            } catch (e) {}
        }
    }

    // 7. Write to Excel file
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(excelTemplateBuffer);
    const worksheet = workbook.worksheets[0];
    
    // Clear rows below headers
    while (worksheet.rowCount > 1) {
        worksheet.removeRow(2);
    }

    // Add extra headers for metadata if not present
    const updatedHeaders = [...headers];
    if (!updatedHeaders.includes('Page URL')) {
        updatedHeaders.push('Page URL');
        worksheet.getRow(1).getCell(headers.length + 1).value = 'Page URL';
    }

    if (crawlOption === 'data-and-images') {
        // Add columns for local paths
        headers.forEach(h => {
            const isImgField = mappings[h] && mappings[h].type === 'attr' && mappings[h].attrName === 'src';
            if (isImgField || h.toLowerCase().includes('image') || h.toLowerCase().includes('photo')) {
                const label = `${h} (Local Path)`;
                if (!updatedHeaders.includes(label)) {
                    updatedHeaders.push(label);
                    worksheet.getRow(1).getCell(updatedHeaders.length).value = label;
                }
            }
        });
    }

    // Format header row
    const headerRow = worksheet.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
        cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F497D' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = {
            top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
            left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
            bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
            right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
        };
    });

    // Populate rows
    crawledData.forEach((row, rIdx) => {
        const rowValues = [];
        updatedHeaders.forEach(header => {
            rowValues.push(row[header] !== undefined ? row[header] : '');
        });
        
        const addedRow = worksheet.addRow(rowValues);
        addedRow.height = 24;
        const isEven = rIdx % 2 === 1;
        const rowBgColor = isEven ? 'FFF2F5F9' : 'FFFFFFFF';
        
        addedRow.eachCell((cell) => {
            cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF333333' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBgColor } };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
            };
            cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        });
    });

    // Auto-fit column widths
    worksheet.columns.forEach(column => {
        let maxLen = 12;
        column.eachCell({ includeEmpty: true }, (cell) => {
            const val = cell.value ? cell.value.toString() : '';
            if (val.length > maxLen) {
                maxLen = Math.min(val.length, 50);
            }
        });
        column.width = maxLen + 2;
    });

    const excelFilename = `custom_crawled_data_${jobId.slice(0, 8)}.xlsx`;
    const excelPath = path.join(jobDir, excelFilename);
    await workbook.xlsx.writeFile(excelPath);

    let zipPath = null;
    if (crawlOption === 'data-and-images') {
        const zipFilename = `custom_crawl_${jobId.slice(0, 8)}.zip`;
        zipPath = path.join(jobDir, zipFilename);
        
        const zip = new AdmZip();
        // Add Excel report at zip root
        zip.addLocalFile(excelPath);
        // Add images folder
        if (fs.existsSync(imagesDir) && fs.readdirSync(imagesDir).length > 0) {
            zip.addLocalFolder(imagesDir, 'images');
        }
        zip.writeZip(zipPath);
    }

    return {
        excelPath,
        zipPath,
        headers: updatedHeaders,
        data: crawledData
    };
}

/**
 * Cheerio Extraction Fallback
 */
async function extractCheerio(url, containerSelector, headers, mappings) {
    try {
        console.log(`[+] Extracting data via Axios + Cheerio: ${url}`);
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (compatible; AuditBot/1.0; +https://audit.razib.bd/bot)'
            },
            timeout: 15000
        });

        const $ = cheerio.load(response.data);
        const items = [];
        const containers = containerSelector ? $(containerSelector) : [$('body')];
        
        const absoluteUrl = (relative) => {
            if (!relative) return '';
            try {
                return new URL(relative, url).toString();
            } catch (e) {
                return relative;
            }
        };

        if (containerSelector) {
            containers.each((idx, el) => {
                const row = {};
                row['Page URL'] = url;
                
                headers.forEach(header => {
                    const mapping = mappings[header];
                    if (mapping && mapping.selector) {
                        const cellEl = $(el).find(mapping.selector);
                        if (cellEl.length > 0) {
                            if (mapping.type === 'text') {
                                row[header] = cellEl.text().trim();
                            } else if (mapping.type === 'attr' && mapping.attrName) {
                                let attrVal = cellEl.attr(mapping.attrName) || '';
                                if (mapping.attrName === 'src' || mapping.attrName === 'href') {
                                    attrVal = absoluteUrl(attrVal);
                                }
                                row[header] = attrVal;
                            }
                        } else {
                            row[header] = '';
                        }
                    } else {
                        row[header] = '';
                    }
                });
                items.push(row);
            });
        } else {
            // Whole page as single container
            const row = {};
            row['Page URL'] = url;
            headers.forEach(header => {
                const mapping = mappings[header];
                if (mapping && mapping.selector) {
                    const cellEl = $(mapping.selector);
                    if (cellEl.length > 0) {
                        if (mapping.type === 'text') {
                            row[header] = cellEl.text().trim();
                        } else if (mapping.type === 'attr' && mapping.attrName) {
                            let attrVal = cellEl.attr(mapping.attrName) || '';
                            if (mapping.attrName === 'src' || mapping.attrName === 'href') {
                                attrVal = absoluteUrl(attrVal);
                            }
                            row[header] = attrVal;
                        }
                    } else {
                        row[header] = '';
                    }
                } else {
                    row[header] = '';
                }
            });
            items.push(row);
        }
        return items;
    } catch (err) {
        console.error(`[-] Cheerio custom extraction failed for ${url}:`, err.message);
        return [];
    }
}

module.exports = {
    parseExcelHeaders,
    runCustomCrawl
};
