const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { chromium } = require('playwright');
const { fetchSitemapUrls, crawlInternalUrls, auditSinglePage } = require('./services/siteCrawlerEngine');
const { generateExcelReport } = require('./services/excelExportService');
const { cleanOutputs } = require('./cleanup_outputs');
const { parseExcelHeaders, parseExcelPackage, appendCrawlConfigSheet, runCustomCrawl } = require('./services/customCrawlerEngine');

// Run automatic output cleanup on server startup & schedule every 6 hours (cleaning files > 24 hours)
cleanOutputs();
setInterval(() => {
    cleanOutputs();
}, 6 * 60 * 60 * 1000).unref();

const DEFAULT_BROWSERLESS_KEY = '2UyXC7OcLU2mwm77ae4b055adfcec31aa0333d1979976e9cb';

// Mutable runtime API key — can be updated via POST /api/settings/browserless-key
// In live server (NODE_ENV === 'production'), Browserless.io API key is set by default.
// In local development, leave BROWSERLESS_API_KEY unset so local Playwright Chromium is used instead.
let BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY || (process.env.NODE_ENV === 'production' ? DEFAULT_BROWSERLESS_KEY : '');



const app = express();
const PORT = process.env.PORT || 3000;
const OUTPUTS_DIR = path.join(__dirname, 'outputs');

if (!fs.existsSync(OUTPUTS_DIR)) {
    fs.mkdirSync(OUTPUTS_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/outputs', express.static(OUTPUTS_DIR));

// In-Memory Background Jobs State
const jobs = {};

/**
 * 1. Health Check Endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        service: 'Website Audit Microservice REST API',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

/**
 * 1b. Test Browserless.io API Key Connection Endpoint
 */
app.get('/api/health/browserless', async (req, res) => {
    // Accept key from query param, body, or fall back to configured key
    const keyToTest = req.query.key || BROWSERLESS_API_KEY;

    if (!keyToTest) {
        return res.json({
            status: 'NOT_CONFIGURED',
            message: 'No Browserless API key configured. Please set your API key.'
        });
    }

    try {
        const { chromium } = require('playwright');
        console.log("[+] Testing connection to Browserless.io CDP...");
        const browser = await chromium.connectOverCDP(`wss://chrome.browserless.io?token=${keyToTest}`, { timeout: 10000 });
        const version = browser.version();
        await browser.close();
        
        return res.json({
            status: 'CONNECTED',
            message: 'Successfully connected to Browserless.io remote browser!',
            version,
            keyConfigured: true
        });
    } catch (err) {
        console.error("[!] Browserless.io connection test failed:", err.message);
        const isAuthError = err.message.includes('403') || err.message.includes('401') || err.message.includes('Unauthorized') || err.message.includes('invalid token');
        return res.status(200).json({
            status: isAuthError ? 'INVALID_KEY' : 'FAILED',
            message: isAuthError 
                ? 'API key is invalid or expired. Please update your Browserless API key.'
                : `Failed to connect to Browserless.io: ${err.message}`,
            keyConfigured: !!BROWSERLESS_API_KEY
        });
    }
});

/**
 * 1c. POST /api/settings/browserless-key — Save a new Browserless API key at runtime
 */
app.post('/api/settings/browserless-key', async (req, res) => {
    const { apiKey } = req.body;
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 8) {
        return res.status(400).json({ error: 'A valid API key is required (minimum 8 characters).' });
    }

    // Test the key before saving
    try {
        const { chromium } = require('playwright');
        console.log("[+] Validating new Browserless API key...");
        const browser = await chromium.connectOverCDP(`wss://chrome.browserless.io?token=${apiKey.trim()}`, { timeout: 10000 });
        await browser.close();

        // Key is valid — save it
        BROWSERLESS_API_KEY = apiKey.trim();
        console.log("[✓] New Browserless API key saved and verified.");
        return res.json({ status: 'SAVED', message: 'Browserless API key saved and verified successfully!' });
    } catch (err) {
        const isAuthError = err.message.includes('403') || err.message.includes('401') || err.message.includes('Unauthorized') || err.message.includes('invalid token');
        return res.status(400).json({
            status: isAuthError ? 'INVALID_KEY' : 'CONNECTION_FAILED',
            error: isAuthError
                ? 'The API key appears to be invalid or expired. Please check it and try again.'
                : `Could not connect to Browserless.io: ${err.message}`
        });
    }
});

/**
 * 1d. GET /api/settings/browserless-key/status — Get current key status (masked)
 */
app.get('/api/settings/browserless-key/status', (req, res) => {
    if (!BROWSERLESS_API_KEY) {
        return res.json({ configured: false, maskedKey: null });
    }
    const masked = BROWSERLESS_API_KEY.slice(0, 6) + '••••••••' + BROWSERLESS_API_KEY.slice(-4);
    return res.json({ configured: true, maskedKey: masked });
});

/**
 * 2. POST /api/audit/full - Full Website Sitemap Audit (Asynchronous)
 */
app.post('/api/audit/full', async (req, res) => {
    const { sitemapUrl, crawlUrl, urls, findingType = "font", findingValue, fontName, maxPages = 50 } = req.body;
    let val = "";
    if (findingValue !== undefined) {
        val = findingValue;
    } else if (fontName !== undefined) {
        val = fontName;
    } else {
        val = "Dinot";
    }

    if (!sitemapUrl && !crawlUrl && (!urls || !Array.isArray(urls) || urls.length === 0)) {
        return res.status(400).json({ error: 'Either sitemapUrl, crawlUrl, or urls parameter is required' });
    }

    const jobId = uuidv4();
    const jobDir = path.join(OUTPUTS_DIR, jobId);
    fs.mkdirSync(jobDir, { recursive: true });

    jobs[jobId] = {
        jobId,
        status: 'pending',
        progress: { current: 0, total: 0, currentUrl: '', percent: 0 },
        sitemapUrl: sitemapUrl || crawlUrl || (urls ? urls[0] : ''),
        fontName: val,
        findingType,
        findingValue: val,
        createdAt: new Date().toISOString(),
        completedAt: null,
        excelPath: null,
        jsonPath: null,
        summary: null,
        error: null
    };

    // Asynchronous Execution Queue
    (async () => {
        jobs[jobId].status = 'running';

        let browser = null;
        try {
            if (BROWSERLESS_API_KEY) {
                try {
                    browser = await chromium.connectOverCDP(`wss://chrome.browserless.io?token=${BROWSERLESS_API_KEY}`);
                    console.log("[+] Connected to Browserless.io CDP successfully for sitemap & crawling.");
                } catch (e) {
                    console.error("[!] Failed to connect to Browserless.io CDP, will try local Playwright:", e.message);
                }
            }
            if (!browser) {
                try {
                    browser = await chromium.launch({ headless: true, args: ['--disable-web-security'] });
                    console.log("[+] Launched local Playwright Chromium successfully for sitemap & crawling.");
                } catch (e) {
                    console.warn("[!] Failed to launch local Playwright Chromium. Falling back to static Axios/Cheerio for crawling:", e.message);
                }
            }
        } catch (err) {
            console.error("[!] Browser initialization crashed, using static fallbacks:", err.message);
        }

        try {
            let targetUrls = [];
            if (urls && Array.isArray(urls) && urls.length > 0) {
                targetUrls = urls.slice(0, maxPages);
            } else if (crawlUrl) {
                const crawled = await crawlInternalUrls(browser, crawlUrl, maxPages);
                targetUrls = crawled.slice(0, maxPages);
            } else if (sitemapUrl) {
                const fetched = await fetchSitemapUrls(browser, sitemapUrl);
                targetUrls = fetched.slice(0, maxPages);
            }

            jobs[jobId].progress.total = targetUrls.length;

            const pageResults = [];
            const ssCounter = { val: 1 };

            for (let i = 0; i < targetUrls.length; i++) {
                const url = targetUrls[i];
                jobs[jobId].progress.current = i + 1;
                jobs[jobId].progress.currentUrl = url;
                jobs[jobId].progress.percent = Math.round(((i + 1) / targetUrls.length) * 100);

                const res = await auditSinglePage(browser, url, findingType, val, jobDir, ssCounter);
                pageResults.push(res);
            }

            if (browser) {
                await browser.close();
            }

            // Aggregating Summary Metrics
            const fontMap = new Map();
            const allCTAs = [];
            const allMissingAltImages = [];
            const allHeadings = [];
            const allTargetMatches = [];
            let targetElemCount = 0;
            let targetStyleCount = 0;

            pageResults.forEach(p => {
                // Fonts aggregation
                (p.fonts || []).forEach(f => {
                    const key = f.rawFontFamily;
                    if (!fontMap.has(key)) {
                        fontMap.set(key, { ...f, pageCount: 1, url: p.url, urls: [p.url] });
                    } else {
                        const existing = fontMap.get(key);
                        existing.pageCount++;
                        if (existing.urls && !existing.urls.includes(p.url)) {
                            existing.urls.push(p.url);
                        }
                    }
                });

                // CTAs aggregation
                (p.ctas || []).forEach(c => allCTAs.push({ url: p.url, ...c }));

                // Missing Alt Images aggregation
                (p.images || []).filter(img => !img.hasAlt).forEach(img => allMissingAltImages.push({ url: p.url, ...img }));

                // Headings aggregation
                (p.headings || []).forEach(h => allHeadings.push({ url: p.url, ...h }));

                // Target Matches aggregation
                (p.targetFontElements || []).forEach(m => allTargetMatches.push({ url: p.url, ...m }));

                targetElemCount += (p.targetFontElements || []).length;
                targetStyleCount += (p.targetFontStylesheets || []).length;
            });

            const fullAuditData = {
                jobId,
                sitemapUrl: sitemapUrl || crawlUrl || (urls ? urls[0] : ''),
                fontName: val,
                findingType,
                findingValue: val,
                auditedAt: new Date().toISOString(),
                pages: pageResults,
                fontSummary: Array.from(fontMap.values()),
                allCTAs,
                allMissingAltImages,
                allHeadings,
                allTargetMatches,
                targetFontElementCount: targetElemCount,
                targetFontStyleCount: targetStyleCount
            };

            // Save JSON Report
            const jsonPath = path.join(jobDir, 'report.json');
            fs.writeFileSync(jsonPath, JSON.stringify(fullAuditData, null, 2));

            // Generate Excel Multi-tab Report
            const excelPath = path.join(jobDir, `website_audit_report_${jobId.slice(0, 8)}.xlsx`);
            await generateExcelReport(fullAuditData, excelPath);

            jobs[jobId].status = 'completed';
            jobs[jobId].completedAt = new Date().toISOString();
            jobs[jobId].excelPath = excelPath;
            jobs[jobId].jsonPath = jsonPath;
            jobs[jobId].summary = {
                totalPagesAudited: pageResults.length,
                uniqueFontsFound: fontMap.size,
                totalCTAsFound: allCTAs.length,
                missingAltImagesCount: allMissingAltImages.length,
                targetFontElementMatches: targetElemCount,
                targetFontStyleMatches: targetStyleCount
            };
        } catch (err) {
            console.error(`[!] Job ${jobId} Failed:`, err);
            jobs[jobId].status = 'failed';
            jobs[jobId].error = err.message;
        }
    })();

    res.status(202).json({
        message: 'Website Audit Job started successfully',
        jobId,
        statusUrl: `/api/audit/jobs/${jobId}`
    });
});

/**
 * 3. POST /api/audit/quick-scan - Single Page Instant Audit (Synchronous)
 */
app.post('/api/audit/quick-scan', async (req, res) => {
    const { url, findingType = "font", findingValue, fontName } = req.body;
    let val = "";
    if (findingValue !== undefined) {
        val = findingValue;
    } else if (fontName !== undefined) {
        val = fontName;
    } else {
        val = "Dinot";
    }

    if (!url) {
        return res.status(400).json({ error: 'url parameter is required' });
    }

    try {
        let browser = null;
        if (BROWSERLESS_API_KEY) {
            try {
                browser = await chromium.connectOverCDP(`wss://chrome.browserless.io?token=${BROWSERLESS_API_KEY}`);
                console.log("[+] Connected to Browserless.io CDP for quick scan.");
            } catch (e) {
                console.error("[!] Failed to connect to Browserless.io, falling back to static parser:", e.message);
            }
        } else {
            console.log("[+] Running quick scan locally using Cheerio.");
        }

        const auditResult = await auditSinglePage(browser, url, findingType, val);

        if (browser) {
            await browser.close();
        }

        res.json({
            status: 'success',
            auditedUrl: url,
            auditResult
        });
    } catch (err) {
        res.status(500).json({ error: 'Quick scan failed', details: err.message });
    }
});

/**
 * 4. GET /api/audit/jobs/:jobId - Get Background Job Status
 */
app.get('/api/audit/jobs/:jobId', (req, res) => {
    const { jobId } = req.params;
    const job = jobs[jobId];

    if (!job) {
        return res.status(404).json({ error: 'Audit job not found' });
    }

    res.json({
        jobId: job.jobId,
        status: job.status,
        progress: job.progress,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
        summary: job.summary,
        downloadUrls: job.status === 'completed' ? {
            excel: `/api/audit/jobs/${jobId}/download/excel`,
            json: `/api/audit/jobs/${jobId}/download/json`
        } : null,
        error: job.error
    });
});

/**
 * 5. GET /api/audit/jobs/:jobId/download/excel - Download Excel Report
 */
app.get('/api/audit/jobs/:jobId/download/excel', (req, res) => {
    const { jobId } = req.params;
    const job = jobs[jobId];

    if (!job || job.status !== 'completed' || !job.excelPath || !fs.existsSync(job.excelPath)) {
        return res.status(404).json({ error: 'Excel report not available' });
    }

    const filename = `website_audit_report_${jobId.slice(0, 8)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    res.sendFile(path.resolve(job.excelPath));
});

/**
 * 5b. POST /api/audit/export/excel - On-Demand Excel Report Generation
 */
app.post('/api/audit/export/excel', async (req, res) => {
    const auditData = req.body;
    if (!auditData) {
        return res.status(400).json({ error: 'auditData is required' });
    }

    try {
        const tempId = uuidv4().slice(0, 8);
        const tempPath = path.join(OUTPUTS_DIR, `website_audit_report_${tempId}.xlsx`);
        await generateExcelReport(auditData, tempPath);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="website_audit_report_${tempId}.xlsx"`);
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

        res.sendFile(tempPath, () => {
            fs.unlink(tempPath, () => {});
        });
    } catch (err) {
        console.error("[!] On-demand Excel generation failed:", err);
        res.status(500).json({ error: 'Failed to generate Excel report', details: err.message });
    }
});

/**
 * 6. GET /api/audit/jobs/:jobId/download/json - Download JSON Report
 */
app.get('/api/audit/jobs/:jobId/download/json', (req, res) => {
    const { jobId } = req.params;
    const job = jobs[jobId];

    if (!job || job.status !== 'completed' || !job.jsonPath || !fs.existsSync(job.jsonPath)) {
        return res.status(404).json({ error: 'JSON report not available' });
    }

    const jsonFilename = `website_audit_report_${jobId.slice(0, 8)}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${jsonFilename}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.sendFile(path.resolve(job.jsonPath));
});

/**
 * 7. POST /api/audit/outputs/cleanup - Automatic Outputs Cleanup Endpoint
 */
app.post('/api/audit/outputs/cleanup', (req, res) => {
    const { maxAgeHours, forceAll = false } = req.body || {};
    const maxAgeMs = maxAgeHours ? maxAgeHours * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const removedCount = cleanOutputs(maxAgeMs, forceAll);

    res.json({
        status: 'success',
        message: 'Outputs cleanup executed successfully',
        removedItemsCount: removedCount
    });
});

// Serve frontend static files if present and handle SPA client-side routing on page reload
const frontendStaticPaths = [
    path.join(__dirname, 'public_html'),
    path.join(__dirname, '../frontend/out'),
    path.join(__dirname, '../frontend')
];

for (const staticDir of frontendStaticPaths) {
    if (fs.existsSync(staticDir)) {
        app.use(express.static(staticDir));
        app.get(/.*/, (req, res, next) => {
            if (req.path.startsWith('/api') || req.path.startsWith('/outputs')) return next();
            
            // Check direct file (e.g. /dashboard.html)
            const cleanPath = req.path.endsWith('/') ? req.path.slice(0, -1) : req.path;
            const htmlFile = path.join(staticDir, `${cleanPath}.html`);
            if (fs.existsSync(htmlFile)) return res.sendFile(htmlFile);

            // Check subfolder index (e.g. /dashboard/index.html)
            const subIndexFile = path.join(staticDir, cleanPath, 'index.html');
            if (fs.existsSync(subIndexFile)) return res.sendFile(subIndexFile);

            // Fallback to main index.html
            const rootIndex = path.join(staticDir, 'index.html');
            if (fs.existsSync(rootIndex)) return res.sendFile(rootIndex);
            
            next();
        });
        break;
    }
}

// Image Downloader Imports & State
const { generateImageDownloadReport } = require('./services/excelExportService');
const AdmZip = require('adm-zip');
const { exec } = require('child_process');
const axios = require('axios');

const downloadJobs = {};

// Helper to extract URLs from text
function extractUrlsFromText(text) {
    if (!text) return [];
    const matches = text.match(/(https?:\/\/[^\s"'>\)]+)/gi) || [];
    return matches.map(url => {
        let cleanUrl = url;
        if (/[.,;:?]$/.test(cleanUrl) && !cleanUrl.includes('?') && !cleanUrl.includes('=')) {
            cleanUrl = cleanUrl.slice(0, -1);
        }
        return cleanUrl;
    }).filter(url => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    });
}

// Helper to get safe filename
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
 * Image Downloader Endpoints
 */

// 1. Start Image Download Job
app.post('/api/image-downloader/start', (req, res) => {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text content containing URLs is required' });
    }

    const urls = extractUrlsFromText(text);
    if (urls.length === 0) {
        return res.status(400).json({ error: 'No valid URLs found in the text area' });
    }

    const jobId = uuidv4();
    const jobDir = path.join(OUTPUTS_DIR, `downloads-${jobId}`);
    const imagesDir = path.join(jobDir, 'images');

    fs.mkdirSync(imagesDir, { recursive: true });

    downloadJobs[jobId] = {
        jobId,
        status: 'pending',
        progress: { current: 0, total: urls.length, currentUrl: '', percent: 0 },
        details: urls.map(url => ({
            url,
            status: 'pending',
            filename: null,
            size: null,
            error: null,
            durationMs: null
        })),
        createdAt: new Date().toISOString(),
        completedAt: null,
        zipPath: null,
        excelPath: null,
        localFolderPath: jobDir,
        error: null
    };

    // Run async downloader background job
    (async () => {
        const job = downloadJobs[jobId];
        job.status = 'running';

        let browser = null;
        let page = null;
        try {
            browser = await chromium.launch({ 
                headless: true, 
                args: [
                    '--disable-blink-features=AutomationControlled',
                    '--disable-web-security',
                    '--no-sandbox'
                ] 
            });
            const context = await browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            });
            page = await context.newPage();
            
            // Navigate to first domain to establish cookies & headers context if possible
            if (urls.length > 0) {
                try {
                    const parsedUrl = new URL(urls[0]);
                    await page.goto(parsedUrl.origin, { waitUntil: 'domcontentloaded', timeout: 15000 });
                } catch (e) {
                    // ignore
                }
            }
        } catch (err) {
            console.error("[!] Failed to launch browser for image downloads, using static axios fallback:", err.message);
        }

        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            const detail = job.details[i];
            job.progress.current = i + 1;
            job.progress.currentUrl = url;
            job.progress.percent = Math.round(((i + 1) / urls.length) * 100);
            
            detail.status = 'downloading';
            const startTime = Date.now();

            let buffer = null;
            let contentType = null;
            let downloadSucceeded = false;

            // Method A: Download using stealth Playwright browser context to bypass Cloudflare 403s
            if (page) {
                try {
                    const result = await page.evaluate(async (imgUrl) => {
                        try {
                            const res = await fetch(imgUrl);
                            if (!res.ok) throw new Error(`HTTP ${res.status}`);
                            const arrayBuf = await res.arrayBuffer();
                            
                            // Chunked conversion to base64
                            const bytes = new Uint8Array(arrayBuf);
                            const len = bytes.length;
                            let binary = '';
                            const chunk = 8192;
                            for (let idx = 0; idx < len; idx += chunk) {
                                const slice = bytes.subarray(idx, Math.min(idx + chunk, len));
                                binary += String.fromCharCode.apply(null, slice);
                            }
                            return { success: true, base64: btoa(binary), contentType: res.headers.get('content-type') };
                        } catch (e) {
                            return { success: false, error: e.message };
                        }
                    }, url);

                    if (result.success) {
                        buffer = Buffer.from(result.base64, 'base64');
                        contentType = result.contentType;
                        downloadSucceeded = true;
                    } else {
                        console.warn(`[-] Playwright download failed for ${url}, error: ${result.error}`);
                    }
                } catch (err) {
                    console.error(`[-] Playwright download threw exception for ${url}:`, err.message);
                }
            }

            // Method B: Fallback to standard Axios request
            if (!downloadSucceeded) {
                try {
                    console.log(`[+] Attempting static Axios fallback for download of ${url}...`);
                    const response = await axios.get(url, {
                        responseType: 'arraybuffer',
                        timeout: 15000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                        }
                    });
                    contentType = response.headers['content-type'];
                    buffer = Buffer.from(response.data);
                    downloadSucceeded = true;
                } catch (err) {
                    console.error(`[-] Axios download failed for ${url}:`, err.message);
                    detail.status = 'failed';
                    detail.error = err.message;
                    detail.durationMs = Date.now() - startTime;
                    continue; // skip file save
                }
            }

            // File Save
            try {
                // Ensure it is an image
                if (contentType && !contentType.toLowerCase().startsWith('image/')) {
                    console.warn(`[!] URL content-type is not image: ${contentType} for ${url}`);
                }

                const filename = getSafeImageFilename(url, contentType, i + 1);
                
                // Resolve name collisions in job directory
                let destFilename = filename;
                let destPath = path.join(imagesDir, destFilename);
                let counter = 1;
                const fileExt = path.extname(filename);
                const fileBase = path.basename(filename, fileExt);
                while (fs.existsSync(destPath)) {
                    destFilename = `${fileBase}_${counter}${fileExt}`;
                    destPath = path.join(imagesDir, destFilename);
                    counter++;
                }

                fs.writeFileSync(destPath, buffer);

                detail.status = 'completed';
                detail.filename = destFilename;
                detail.size = buffer.length;
                detail.durationMs = Date.now() - startTime;
            } catch (err) {
                console.error(`[-] Failed to save image from ${url}:`, err.message);
                detail.status = 'failed';
                detail.error = err.message;
                detail.durationMs = Date.now() - startTime;
            }
        }

        // Close Playwright browser
        if (browser) {
            try {
                await browser.close();
                console.log("[+] Playwright download browser closed successfully.");
            } catch (e) {}
        }

        // Job finished compiling reports
        try {
            // 1. Generate Excel Report
            const excelFilename = `website_images_report_${jobId.slice(0, 8)}.xlsx`;
            const excelPath = path.join(jobDir, excelFilename);
            await generateImageDownloadReport(job, excelPath);
            job.excelPath = excelPath;

            // 2. Create ZIP archive
            const zipFilename = `images_download_${jobId.slice(0, 8)}.zip`;
            const zipPath = path.join(jobDir, zipFilename);
            
            const zip = new AdmZip();
            // Add images folder contents as images/
            zip.addLocalFolder(imagesDir, 'images');
            // Add excel sheet at the root of the ZIP
            zip.addLocalFile(excelPath);
            zip.writeZip(zipPath);
            job.zipPath = zipPath;

            job.status = 'completed';
            job.completedAt = new Date().toISOString();
        } catch (err) {
            console.error('[!] Failed to compile zip/excel for image downloader job:', err);
            job.status = 'failed';
            job.error = `Failed to generate report or archive: ${err.message}`;
            job.completedAt = new Date().toISOString();
        }
    })();

    res.json({
        message: 'Batch Image Downloader job started successfully',
        jobId
    });
});

// 2. Get Image Download Job Status
app.get('/api/image-downloader/jobs/:jobId', (req, res) => {
    const { jobId } = req.params;
    const job = downloadJobs[jobId];

    if (!job) {
        return res.status(404).json({ error: 'Image downloader job not found' });
    }

    res.json({
        jobId: job.jobId,
        status: job.status,
        progress: job.progress,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
        details: job.details.map(d => ({
            url: d.url,
            status: d.status,
            filename: d.filename,
            size: d.size,
            error: d.error,
            durationMs: d.durationMs,
            previewUrl: d.status === 'completed' ? `/outputs/downloads-${jobId}/images/${d.filename}` : null
        })),
        downloadUrls: job.status === 'completed' ? {
            zip: `/api/image-downloader/jobs/${jobId}/download/zip`,
            excel: `/api/image-downloader/jobs/${jobId}/download/excel`
        } : null,
        localFolderPath: job.localFolderPath,
        error: job.error
    });
});

// 3. Download ZIP Archive
app.get('/api/image-downloader/jobs/:jobId/download/zip', (req, res) => {
    const { jobId } = req.params;
    const job = downloadJobs[jobId];

    if (!job || job.status !== 'completed' || !job.zipPath || !fs.existsSync(job.zipPath)) {
        return res.status(404).json({ error: 'ZIP archive not available' });
    }

    const filename = `images_download_${jobId.slice(0, 8)}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    res.sendFile(path.resolve(job.zipPath));
});

// 4. Download Excel Report
app.get('/api/image-downloader/jobs/:jobId/download/excel', (req, res) => {
    const { jobId } = req.params;
    const job = downloadJobs[jobId];

    if (!job || job.status !== 'completed' || !job.excelPath || !fs.existsSync(job.excelPath)) {
        return res.status(404).json({ error: 'Excel report not available' });
    }

    const filename = `website_images_report_${jobId.slice(0, 8)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    res.sendFile(path.resolve(job.excelPath));
});

// 5. Open Local Folder (Windows)
app.post('/api/image-downloader/jobs/:jobId/open-folder', (req, res) => {
    const { jobId } = req.params;
    const job = downloadJobs[jobId];

    if (!job || !job.localFolderPath || !fs.existsSync(job.localFolderPath)) {
        return res.status(404).json({ error: 'Local folder not available' });
    }

    const folderPath = path.resolve(job.localFolderPath);
    console.log(`[+] Opening local folder: ${folderPath}`);

    exec(`explorer.exe "${folderPath}"`, (err) => {
        if (err) {
            console.error(`[!] Failed to open local folder:`, err);
            return res.status(500).json({ error: 'Failed to open local folder', details: err.message });
        }
        res.json({ success: true, message: 'Local folder opened successfully in Windows Explorer' });
    });
});

// 6. Scan Webpage for Images
app.post('/api/image-downloader/scan-page', async (req, res) => {
    const { url, selector } = req.body;
    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'A valid webpage URL is required' });
    }

    try {
        new URL(url);
    } catch {
        return res.status(400).json({ error: 'Invalid URL format' });
    }

    let browser = null;
    let playwrightScanSucceeded = false;
    let extractedUrls = [];

    // Attempt local Playwright image extraction (forced local to bypass Cloudflare datacenter IP blocking)
    try {
        try {
            browser = await chromium.launch({ 
                headless: true, 
                args: [
                    '--disable-blink-features=AutomationControlled',
                    '--disable-web-security',
                    '--no-sandbox'
                ] 
            });
            console.log("[+] Launched local Playwright Chromium successfully for page scan (bypassing Browserless to avoid datacenter IP blocks).");
        } catch (e) {
            console.warn("[!] Failed to launch local Playwright Chromium. Fallback to Cheerio:", e.message);
        }

        if (browser) {
            const context = await browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            });
            const page = await context.newPage();
            await page.setViewportSize({ width: 1280, height: 1000 });
            await page.goto(url, { waitUntil: 'networkidle', timeout: 25000 });

            // Extract all image elements from DOM
            const rawUrls = await page.evaluate((sel) => {
                const list = [];
                const root = sel ? document.querySelector(sel) : document;
                if (!root) return list;

                // Helper to parse srcset and select the highest resolution URL
                const getBestSrcFromSrcset = (srcset, defaultSrc) => {
                    if (!srcset) return defaultSrc;
                    try {
                        const candidates = srcset.split(',').map(item => {
                            const parts = item.trim().split(/\s+/);
                            const url = parts[0];
                            const descriptor = parts[1] || '';
                            
                            let value = 0;
                            let type = 'w';
                            
                            if (descriptor.endsWith('w')) {
                                value = parseInt(descriptor.slice(0, -1), 10) || 0;
                                type = 'w';
                            } else if (descriptor.endsWith('x')) {
                                value = parseFloat(descriptor.slice(0, -1)) || 0;
                                type = 'x';
                            } else {
                                value = 1;
                                type = 'x';
                            }
                            return { url, value, type };
                        });
                        
                        if (candidates.length === 0) return defaultSrc;
                        
                        const wCandidates = candidates.filter(c => c.type === 'w');
                        const xCandidates = candidates.filter(c => c.type === 'x');
                        
                        if (wCandidates.length > 0) {
                            wCandidates.sort((a, b) => b.value - a.value);
                            return wCandidates[0].url;
                        } else if (xCandidates.length > 0) {
                            xCandidates.sort((a, b) => b.value - a.value);
                            return xCandidates[0].url;
                        }
                    } catch (e) {}
                    return defaultSrc;
                };

                // img tags only
                root.querySelectorAll('img').forEach(img => {
                    let bestSrc = img.src;
                    const srcset = img.srcset || img.getAttribute('srcset') || img.getAttribute('data-srcset') || img.getAttribute('data-lazy-srcset');
                    
                    if (srcset) {
                        bestSrc = getBestSrcFromSrcset(srcset, bestSrc);
                    }
                    
                    if (!bestSrc) {
                        bestSrc = img.dataset.src || img.dataset.lazy || img.getAttribute('data-src') || img.getAttribute('data-lazy');
                    }
                    
                    if (bestSrc) list.push(bestSrc);
                });
                return list;
            }, selector);

            await page.close();
            await browser.close();

            const seen = new Set();
            rawUrls.forEach(src => {
                if (!src) return;
                try {
                    const abs = new URL(src, url).href;
                    if (!seen.has(abs)) {
                        seen.add(abs);
                        extractedUrls.push(abs);
                    }
                } catch (e) {}
            });

            playwrightScanSucceeded = true;
            console.log(`[✓] Playwright scan extracted ${extractedUrls.length} image URLs from ${url} (Selector: ${selector || 'None'})`);
        }
    } catch (err) {
        console.error("[!] Playwright scan failed, trying static axios/cheerio fallback:", err.message);
        if (browser) {
            try { await browser.close(); } catch (e) {}
        }
    }

    // Static HTML Axios/Cheerio Fallback
    if (!playwrightScanSucceeded) {
        try {
            console.log(`[+] Executing Cheerio static parsing fallback for ${url}...`);
            const cheerio = require('cheerio');
            const response = await axios.get(url, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            const $ = cheerio.load(response.data);
            const rawUrls = [];
            const root = selector ? $(selector) : $('html');

            const getBestSrcFromSrcset = (srcset, defaultSrc) => {
                if (!srcset) return defaultSrc;
                try {
                    const candidates = srcset.split(',').map(item => {
                        const parts = item.trim().split(/\s+/);
                        const url = parts[0];
                        const descriptor = parts[1] || '';
                        
                        let value = 0;
                        let type = 'w';
                        
                        if (descriptor.endsWith('w')) {
                            value = parseInt(descriptor.slice(0, -1), 10) || 0;
                            type = 'w';
                        } else if (descriptor.endsWith('x')) {
                            value = parseFloat(descriptor.slice(0, -1)) || 0;
                            type = 'x';
                        } else {
                            value = 1;
                            type = 'x';
                        }
                        return { url, value, type };
                    });
                    
                    if (candidates.length === 0) return defaultSrc;
                    
                    const wCandidates = candidates.filter(c => c.type === 'w');
                    const xCandidates = candidates.filter(c => c.type === 'x');
                    
                    if (wCandidates.length > 0) {
                        wCandidates.sort((a, b) => b.value - a.value);
                        return wCandidates[0].url;
                    } else if (xCandidates.length > 0) {
                        xCandidates.sort((a, b) => b.value - a.value);
                        return xCandidates[0].url;
                    }
                } catch (e) {}
                return defaultSrc;
            };

            if (root.length > 0) {
                root.find('img').each((i, el) => {
                    let bestSrc = $(el).attr('src');
                    const srcset = $(el).attr('srcset') || $(el).attr('data-srcset') || $(el).attr('data-lazy-srcset');
                    
                    if (srcset) {
                        bestSrc = getBestSrcFromSrcset(srcset, bestSrc);
                    }
                    
                    if (!bestSrc) {
                        bestSrc = $(el).attr('data-src') || $(el).attr('data-lazy');
                    }
                    
                    if (bestSrc) rawUrls.push(bestSrc);
                });
            }

            const seen = new Set();
            rawUrls.forEach(src => {
                if (!src) return;
                try {
                    const abs = new URL(src, url).href;
                    if (!seen.has(abs)) {
                        seen.add(abs);
                        extractedUrls.push(abs);
                    }
                } catch (e) {}
            });

            console.log(`[✓] Cheerio scan extracted ${extractedUrls.length} image URLs from ${url} (Selector: ${selector || 'None'})`);
        } catch (err) {
            console.error("[!] Cheerio scan failed:", err.message);
            return res.status(500).json({ error: 'Failed to extract images from webpage', details: err.message });
        }
    }

    res.json({
        status: 'success',
        source: playwrightScanSucceeded ? 'playwright' : 'cheerio',
        urls: extractedUrls
    });
});

// In-Memory Custom Crawler Jobs State
const customCrawlJobs = {};

/**
 * Custom Crawler Endpoints
 */

// 1. Parse Excel Package (Headers, Existing Dataset, and embedded _CRAWL_CONFIG_ rules)
app.post('/api/custom-crawler/parse-headers', async (req, res) => {
    const { fileBase64 } = req.body;
    if (!fileBase64) {
        return res.status(400).json({ error: 'Excel file as base64 string is required' });
    }

    try {
        const fileBuffer = Buffer.from(fileBase64, 'base64');
        const pkg = await parseExcelPackage(fileBuffer);
        res.json({
            headers: pkg.headers,
            existingData: pkg.existingData,
            mappings: pkg.mappings,
            savedUrls: pkg.savedUrls,
            hasConfigSheet: pkg.hasConfigSheet
        });
    } catch (err) {
        console.error('[!] Failed to parse Excel template:', err.message);
        res.status(400).json({ error: err.message || 'Failed to parse Excel file headers' });
    }
});

// 1b. Visual Selector Preview Proxy
// Fetches any URL server-side, rewrites relative paths, strips framing
// restrictions, and injects a click-capture overlay so the iframe can
// postMessage the picked CSS selector back to the parent.
app.get('/api/custom-crawler/preview', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send('<h2>URL query param is required</h2>');

    try {
        const targetUrl = new URL(url);
        const baseOrigin = targetUrl.origin;

        let html = '';
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                },
                timeout: 15000,
                responseType: 'text',
            });
            html = response.data;
        } catch (err) {
            console.log(`[!] Axios failed to fetch preview for ${url} (Status: ${err.response?.status}). Falling back to Playwright...`);
            let browser;
            try {
                if (BROWSERLESS_API_KEY) {
                    browser = await chromium.connectOverCDP(`wss://chrome.browserless.io?token=${BROWSERLESS_API_KEY}`);
                } else {
                    browser = await chromium.launch({ headless: true });
                }
                const page = await browser.newPage({ 
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
                });
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
                html = await page.content();
            } catch (pwErr) {
                console.error(`[!] Playwright fallback failed for preview:`, pwErr.message);
                throw pwErr;
            } finally {
                if (browser) await browser.close();
            }
        }

        // Helper to unwrap Next.js _next/image optimization URLs
        function unwrapNextImage(u) {
            if (!u) return u;
            try {
                if (u.includes('_next/image') && u.includes('url=')) {
                    const searchStr = u.includes('?') ? u.split('?')[1] : u;
                    const params = new URLSearchParams(searchStr);
                    const realUrl = params.get('url');
                    if (realUrl) return realUrl;
                }
            } catch (e) {}
            return u;
        }

        // Helper to convert any relative URL to full absolute URL based on target page URL
        function toAbsoluteUrl(u) {
            if (!u || typeof u !== 'string') return u;
            u = u.trim();
            if (!u || u.startsWith('data:') || u.startsWith('blob:') || u.startsWith('javascript:')) return u;
            
            const cleaned = unwrapNextImage(u);
            try {
                return new URL(cleaned, targetUrl.href).href;
            } catch (e) {
                return cleaned;
            }
        }

        // Strip pre-existing <base> tags to avoid conflicts
        html = html.replace(/<base[^>]*>/gi, '');

        // Add <base> tag so all relative paths resolve against target page URL / origin
        const baseHref = targetUrl.href;
        const baseTag = `<base href="${baseHref}">\n<meta name="referrer" content="no-referrer" />`;
        if (/<head[^>]*>/i.test(html)) {
            html = html.replace(/<head[^>]*>/i, (m) => m + '\n' + baseTag);
        } else {
            html = baseTag + html;
        }

        // Fix lazy loaded images and normalize data attributes
        html = html.replace(/loading=["']?lazy["']?/gi, '');
        html = html.replace(/data-lazy-src=/gi, 'src=');
        html = html.replace(/data-src=/gi, 'src=');
        html = html.replace(/data-original=/gi, 'src=');
        html = html.replace(/data-srcset=/gi, 'srcset=');

        // Rewrite all src, data-src attributes on img, source, link elements to absolute URLs
        html = html.replace(/(src|data-src|data-lazy-src|data-original)=["']([^"']+)["']/gi, (match, attr, val) => {
            return `${attr}="${toAbsoluteUrl(val)}"`;
        });

        // Rewrite srcset / data-srcset attributes to absolute URLs
        html = html.replace(/(srcset|data-srcset)=["']([^"']+)["']/gi, (match, attr, val) => {
            const parts = val.split(',').map(part => {
                const trimmed = part.trim().split(/\s+/);
                if (trimmed[0]) {
                    trimmed[0] = toAbsoluteUrl(trimmed[0]);
                }
                return trimmed.join(' ');
            });
            return `${attr}="${parts.join(', ')}"`;
        });

        // Rewrite inline background-image: url(...) styles to absolute URLs
        html = html.replace(/url\((['"]?)([^'")]+)\1\)/gi, (match, quote, val) => {
            if (val.startsWith('data:') || val.startsWith('blob:')) return match;
            return `url(${quote}${toAbsoluteUrl(val)}${quote})`;
        });

        // Build the injected click-capture + highlight script
        const injectScript = `
<style>
  #__audit_bar__ { position:fixed;bottom:0;left:0;right:0;z-index:2147483647;background:rgba(10,18,40,0.96);color:#93c5fd;padding:9px 16px;font-family:monospace;font-size:12px;border-top:2px solid #3b82f6;display:flex;gap:10px;align-items:center;pointer-events:none; }
  #__audit_bar__ span.tip { color:#60a5fa;font-weight:bold;white-space:nowrap; }
  #__audit_bar__ span.sel { flex:1;text-align:right;color:#a5f3fc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
  #__audit_hl__ { position:fixed;pointer-events:none;z-index:2147483646;background:rgba(59,130,246,0.18);outline:2px solid #3b82f6;box-sizing:border-box; }
</style>
<script>
(function(){
  var pickingActive = true;

  window.addEventListener('message', function(e){
    if (e.data && e.data.type === 'SET_PICKER_MODE') {
      pickingActive = !!e.data.active;
      var tip = document.querySelector('#__audit_bar__ .tip');
      var selSpan = document.getElementById('__audit_sel__');
      var hlEl = document.getElementById('__audit_hl__');
      if (!pickingActive) {
        if (hlEl) hlEl.style.display = 'none';
        if (tip) tip.innerHTML = '🔍 Browse / Data Explore Mode Active — Click links & tabs to explore';
        if (selSpan) selSpan.textContent = '';
      } else {
        if (tip) tip.innerHTML = '🎯 Click any element to pick its selector';
      }
    }
  });

  document.addEventListener('submit', function(e){ if (pickingActive) e.preventDefault(); }, true);

  var hl = document.createElement('div');
  hl.id = '__audit_hl__';
  var bar = document.createElement('div');
  bar.id = '__audit_bar__';
  bar.innerHTML = '<span class="tip">🎯 Click any element to pick its selector</span><span class="sel" id="__audit_sel__"></span>';

  function mount(){
    if(document.body){
      document.body.appendChild(hl);
      document.body.appendChild(bar);
    }
  }
  if(document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);

  function esc(s){ return typeof CSS!=='undefined'&&CSS.escape?CSS.escape(s):s.replace(/([\\!"#$%&'()*+,\\-./:;<=>?@[\\\\\\]^${'`'}{|}~])/g,'\\\\$1'); }

  function getSelector(el){
    if(!el||el===document.documentElement) return 'html';
    if(el===document.body) return 'body';
    if(el.id) return '#'+esc(el.id);
    var tag=el.tagName.toLowerCase();
    var cls='';
    if(el.classList&&el.classList.length){
      var good=Array.from(el.classList)
        .filter(function(c){ return c.length>1&&!/^(active|hover|focus|open|show|hide|visible|hidden|selected|disabled|loading|is-|js-)/.test(c); })
        .slice(0,3)
        .map(function(c){ return '.'+esc(c); });
      cls=good.join('');
    }
    var cand=tag+cls;
    try{
      if(cls&&document.querySelectorAll(cand).length===1) return cand;
      if(cls&&document.querySelectorAll(cls).length===1) return cls;
    }catch(e){}
    var parent=el.parentElement;
    if(parent){
      var sibs=Array.from(parent.children).filter(function(c){ return c.tagName===el.tagName; });
      var nth=sibs.length>1?':nth-of-type('+(sibs.indexOf(el)+1)+')':'';
      return getSelector(parent)+' > '+tag+cls+nth;
    }
    return cand;
  }

  document.addEventListener('mouseover', function(e){
    if (!pickingActive) return;
    var r=e.target.getBoundingClientRect();
    hl.style.top=(r.top+window.scrollY)+'px';
    hl.style.left=(r.left+window.scrollX)+'px';
    hl.style.width=r.width+'px';
    hl.style.height=r.height+'px';
    hl.style.display='block';
    var sel=getSelector(e.target);
    var s=document.getElementById('__audit_sel__');
    if(s) s.textContent=sel;
  }, true);

  document.addEventListener('click', function(e){
    if (!pickingActive) {
      return; // Browse mode: allow natural clicks on page elements/tabs
    }
    e.preventDefault(); e.stopPropagation();
    var el=e.target;
    var sel=getSelector(el);
    var tag=el.tagName.toLowerCase();
    var attrHint=tag==='img'?'src':(tag==='a'?'href':'text');
    window.parent.postMessage({ type:'SELECTOR_PICKED', selector:sel, tagName:tag, attrHint:attrHint }, '*');
  }, true);
})();
</script>`;

        if (/<\/body>/i.test(html)) {
            html = html.replace(/<\/body>/i, injectScript + '</body>');
        } else {
            html += injectScript;
        }

        // Strip headers that block iframe embedding
        res.removeHeader('X-Frame-Options');
        res.removeHeader('Content-Security-Policy');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.send(html);

    } catch (err) {
        const msg = err.message || 'Unknown error';
        res.status(500).send(`<!DOCTYPE html><html><head><base href="/"></head><body style="margin:0;font-family:system-ui,sans-serif;background:#0f172a;color:#f1f5f9;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:1rem;padding:2rem;box-sizing:border-box;text-align:center"><div style="font-size:3rem">⚠️</div><h2 style="color:#f87171;margin:0">Could not load preview</h2><p style="color:#94a3b8;max-width:480px">${msg}</p><p style="color:#64748b;font-size:0.8rem">The site may block proxying. Try opening the URL in Chrome DevTools (F12 → Inspector) to find selectors manually.</p></body></html>`);
    }
});

// 2. Start Custom Crawling Job
app.post('/api/custom-crawler/start', async (req, res) => {
    // Accept both legacy `url` (string) and new `urls` (array) fields, plus existingData
    let { url, urls, crawlOption = 'data', maxPages = 10, containerSelector, mappings, xlsxBase64, existingData = [] } = req.body;

    // Normalize to array
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
        if (url) {
            urls = [url];
        } else {
            return res.status(400).json({ error: 'At least one Starting URL is required (urls[] or url)' });
        }
    }

    // Trim & deduplicate
    urls = Array.from(new Set(urls.map(u => u.trim()).filter(Boolean)));
    if (urls.length === 0) {
        return res.status(400).json({ error: 'No valid URLs provided.' });
    }

    if (!mappings || typeof mappings !== 'object') {
        return res.status(400).json({ error: 'Mappings configuration is required' });
    }

    const jobId = uuidv4();
    const jobDir = path.join(OUTPUTS_DIR, `custom-crawl-${jobId}`);
    fs.mkdirSync(jobDir, { recursive: true });

    const totalUrls = urls.length;

    customCrawlJobs[jobId] = {
        jobId,
        status: 'pending',
        progress: { current: 0, total: 0, currentUrl: '', percent: 0 },
        urls,
        crawlOption,
        maxPages,
        createdAt: new Date().toISOString(),
        completedAt: null,
        excelPath: null,
        zipPath: null,
        headers: [],
        data: [],
        error: null
    };

    // Run asynchronously — loop through all URLs
    (async () => {
        const job = customCrawlJobs[jobId];
        job.status = 'running';

        try {
            const excelBuffer = xlsxBase64 ? Buffer.from(xlsxBase64, 'base64') : null;

            let mergedData = [];
            let mergedHeaders = [];
            let lastExcelPath = null;
            let lastZipPath = null;

            for (let i = 0; i < urls.length; i++) {
                const targetUrl = urls[i];

                // Create a sub-dir per URL to avoid image collisions
                const subDir = path.join(jobDir, `url_${i + 1}`);
                fs.mkdirSync(subDir, { recursive: true });

                console.log(`[+] Custom crawl job ${jobId}: Processing URL ${i + 1}/${urls.length}: ${targetUrl}`);

                const result = await runCustomCrawl({
                    jobId,
                    url: targetUrl,
                    crawlOption,
                    maxPages: parseInt(maxPages) || 10,
                    containerSelector,
                    mappings,
                    excelTemplateBuffer: excelBuffer,
                    existingData: i === 0 ? existingData : [], // Pass existingData on first iteration
                    jobDir: subDir,
                    browserlessKey: BROWSERLESS_API_KEY,
                    updateProgress: (current, total, currentUrl, dataSoFar) => {
                        // Combine per-URL progress into overall progress
                        const urlsDone = i;
                        const overallCurrent = urlsDone * (total || 1) + current;
                        const overallTotal = totalUrls * (total || 1);
                        job.progress = {
                            current: overallCurrent,
                            total: overallTotal,
                            currentUrl: `[URL ${i + 1}/${totalUrls}] ${currentUrl}`,
                            percent: overallTotal > 0 ? Math.round((overallCurrent / overallTotal) * 100) : 0
                        };
                        // Merge live preview data
                        job.data = [...mergedData, ...dataSoFar];
                    }
                });

                if (mergedHeaders.length === 0) {
                    mergedHeaders = result.headers;
                }
                mergedData = [...mergedData, ...result.data];
                lastExcelPath = result.excelPath;
                if (result.zipPath) lastZipPath = result.zipPath;
            }

            // If more than 1 URL was crawled, re-write a merged Excel from all data
            if (urls.length > 1 && mergedData.length > 0) {
                const ExcelJS = require('exceljs');
                const mergedWorkbook = new ExcelJS.Workbook();
                const ws = mergedWorkbook.addWorksheet('Crawled Data');

                // Write headers
                const allHeaders = mergedHeaders.includes('Page URL') 
                    ? mergedHeaders 
                    : ['Page URL', ...mergedHeaders];
                ws.addRow(allHeaders);
                ws.getRow(1).font = { bold: true };
                ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } };
                ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

                // Write data rows
                mergedData.forEach(row => {
                    const rowArr = allHeaders.map(h => row[h] || '');
                    ws.addRow(rowArr);
                });

                // Auto column widths
                ws.columns.forEach(col => { col.width = 30; });

                // Append configuration settings sheet to merged workbook
                appendCrawlConfigSheet(mergedWorkbook, mappings, urls);

                const mergedExcelPath = path.join(jobDir, 'merged_crawl_output.xlsx');
                await mergedWorkbook.xlsx.writeFile(mergedExcelPath);
                lastExcelPath = mergedExcelPath;
                console.log(`[+] Custom crawl job ${jobId}: Merged Excel written with ${mergedData.length} total rows.`);
            }

            // If data-and-images option was selected, pack the final ZIP containing the merged Excel and all images
            if (crawlOption === 'data-and-images' && lastExcelPath) {
                const AdmZip = require('adm-zip');
                const zip = new AdmZip();
                
                // Add the final merged Excel report at zip root
                zip.addLocalFile(lastExcelPath);
                
                // Add images from all crawled URLs to avoid collision
                for (let i = 0; i < urls.length; i++) {
                    const subDir = path.join(jobDir, `url_${i + 1}`);
                    const subImagesDir = path.join(subDir, 'images');
                    if (fs.existsSync(subImagesDir)) {
                        const files = fs.readdirSync(subImagesDir);
                        files.forEach(file => {
                            const filePath = path.join(subImagesDir, file);
                            // Prefix to guarantee uniqueness inside zip folder
                            const zipFilename = `url_${i + 1}_${file}`;
                            zip.addLocalFile(filePath, 'images', zipFilename);
                        });
                    }
                }
                
                const zipFilename = `custom_crawl_${jobId.slice(0, 8)}.zip`;
                const finalZipPath = path.join(jobDir, zipFilename);
                zip.writeZip(finalZipPath);
                lastZipPath = finalZipPath;
                console.log(`[+] Custom crawl job ${jobId}: Final unified ZIP written to ${finalZipPath}`);
            }

            job.excelPath = lastExcelPath;
            job.zipPath = lastZipPath;
            job.headers = mergedHeaders;
            job.data = mergedData;
            job.status = 'completed';
            job.completedAt = new Date().toISOString();
            job.progress = {
                current: mergedData.length,
                total: mergedData.length,
                currentUrl: `All ${totalUrls} URL(s) completed`,
                percent: 100
            };
        } catch (err) {
            console.error(`[!] Custom crawl job ${jobId} failed:`, err);
            job.status = 'failed';
            job.error = err.message || 'Crawl job failed unexpectedly';
            job.completedAt = new Date().toISOString();
        }
    })();

    res.json({
        message: 'Custom crawl job started successfully',
        jobId
    });
});

// 3. Get Custom Crawl Job Status
app.get('/api/custom-crawler/jobs/:jobId', (req, res) => {
    const { jobId } = req.params;
    const job = customCrawlJobs[jobId];

    if (!job) {
        return res.status(404).json({ error: 'Crawl job not found' });
    }

    res.json({
        jobId: job.jobId,
        status: job.status,
        progress: job.progress,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
        headers: job.headers,
        data: job.data,
        downloadUrls: job.status === 'completed' ? {
            excel: `/api/custom-crawler/jobs/${jobId}/download/excel`,
            zip: job.zipPath ? `/api/custom-crawler/jobs/${jobId}/download/zip` : null
        } : null,
        error: job.error
    });
});

// 4. Download custom crawled Excel
app.get('/api/custom-crawler/jobs/:jobId/download/excel', (req, res) => {
    const { jobId } = req.params;
    const job = customCrawlJobs[jobId];

    if (!job || job.status !== 'completed' || !job.excelPath || !fs.existsSync(job.excelPath)) {
        return res.status(404).json({ error: 'Excel file not available' });
    }

    const filename = `custom_crawled_data_${jobId.slice(0, 8)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    res.sendFile(path.resolve(job.excelPath));
});

// 5. Download custom crawled ZIP (Excel + Images)
app.get('/api/custom-crawler/jobs/:jobId/download/zip', (req, res) => {
    const { jobId } = req.params;
    const job = customCrawlJobs[jobId];

    if (!job || job.status !== 'completed' || !job.zipPath || !fs.existsSync(job.zipPath)) {
        return res.status(404).json({ error: 'ZIP file not available' });
    }

    const filename = `custom_crawled_archive_${jobId.slice(0, 8)}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    res.sendFile(path.resolve(job.zipPath));
});

// 6. Download Sample Custom Crawler Excel Template (with Crawled Data and Crawl Rules)
app.get('/api/custom-crawler/download-sample-template', async (req, res) => {
    try {
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Website Audit Microservice API';

        const headerStyle = {
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F497D' } },
            font: { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } },
            alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
            border: {
                top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
            }
        };

        // Sheet 1: Crawled Data
        const dataSheet = workbook.addWorksheet('Crawled Data');
        dataSheet.views = [{ state: 'frozen', ySplit: 1, showGridLines: true }];
        
        const dataHeaders = ['Product Title', 'Category', 'Read Time', 'Product Image', 'Page URL'];
        const dHeaderRow = dataSheet.addRow(dataHeaders);
        dHeaderRow.height = 28;
        dHeaderRow.eachCell(cell => Object.assign(cell, headerStyle));

        const sampleRows = [
            ['Custom Crawler Guide', 'Documentation', '5 min read', 'https://audit.razib.bd/images/custom-crawl.png', 'https://audit.razib.bd/guides/custom-crawler'],
            ['Font Audit Case Study', 'Case Study', '8 min read', 'https://audit.razib.bd/images/font-audit.png', 'https://audit.razib.bd/guides/font-audit'],
            ['Image Scraper Tutorial', 'Tutorials', '4 min read', 'https://audit.razib.bd/images/image-scraper.png', 'https://audit.razib.bd/guides/image-scraper']
        ];

        sampleRows.forEach((rVals, idx) => {
            const row = dataSheet.addRow(rVals);
            row.height = 24;
            const isEven = idx % 2 === 1;
            const rowBgColor = isEven ? 'FFF2F5F9' : 'FFFFFFFF';
            row.eachCell((cell, colNum) => {
                cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF333333' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBgColor } };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                    left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                    bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                    right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
                };
                cell.alignment = { horizontal: colNum === 4 || colNum === 5 ? 'left' : 'center', vertical: 'middle' };
            });
        });

        dataSheet.columns.forEach(col => { col.width = 30; });

        // Sheet 2: Crawl Rules
        const rulesSheet = workbook.addWorksheet('Crawl Rules');
        rulesSheet.views = [{ showGridLines: true }];

        const titleRow = rulesSheet.addRow(['Crawler Feature Rules & Selector Configuration', '', '', '', '']);
        titleRow.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FF1F497D' } };
        rulesSheet.addRow([]);

        const rHRow = rulesSheet.addRow(['Column Name', 'CSS Selector', 'Extract Type', 'Attribute Name', 'Domain Overrides']);
        rHRow.height = 26;
        rHRow.eachCell(cell => Object.assign(cell, headerStyle));

        const sampleRules = [
            ['Product Title', '[data-testid="guide-title"]', 'text', '', ''],
            ['Category', '[data-testid="guide-category"]', 'text', '', ''],
            ['Read Time', '[data-testid="guide-read-time"]', 'text', '', ''],
            ['Product Image', '[data-testid="guide-card"] img', 'attr', 'src', JSON.stringify({ 'example.com': 'img.product-img' })]
        ];

        sampleRules.forEach(rVals => {
            const row = rulesSheet.addRow(rVals);
            row.height = 22;
            row.eachCell((cell, cIdx) => {
                cell.font = { name: 'Segoe UI', size: 10 };
                cell.alignment = { horizontal: cIdx === 1 || cIdx === 2 ? 'left' : 'center', vertical: 'middle' };
            });
        });

        rulesSheet.addRow([]);
        const urlTitleRow = rulesSheet.addRow(['Starting URLs List', '', '', '', '']);
        urlTitleRow.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FF1F497D' } };
        const demoUrls = ['https://audit.razib.bd/guides/'];
        demoUrls.forEach(u => {
            const uRow = rulesSheet.addRow([u]);
            uRow.getCell(1).font = { name: 'Segoe UI', size: 10, color: { argb: 'FF2563EB' } };
        });

        rulesSheet.columns.forEach((col, idx) => {
            col.width = idx === 0 ? 25 : idx === 1 ? 35 : idx === 4 ? 35 : 20;
        });

        // Sheet 3: _CRAWL_CONFIG_ (hidden)
        const sampleMappings = {
            'Product Title': { selector: '[data-testid="guide-title"]', type: 'text' },
            'Category': { selector: '[data-testid="guide-category"]', type: 'text' },
            'Read Time': { selector: '[data-testid="guide-read-time"]', type: 'text' },
            'Product Image': { selector: '[data-testid="guide-card"] img', type: 'attr', attrName: 'src', domainOverrides: { 'example.com': 'img.product-img' } }
        };
        appendCrawlConfigSheet(workbook, sampleMappings, demoUrls);

        const filename = 'sample_custom_crawl_template.xlsx';
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

        const buffer = await workbook.xlsx.writeBuffer();
        res.send(buffer);
    } catch (err) {
        console.error('[!] Failed to generate sample Excel template:', err.message);
        res.status(500).json({ error: 'Failed to generate sample Excel template' });
    }
});

const server = app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`[🚀] Website Audit REST API Microservice running on Port ${PORT}`);
    console.log(`[+] Health Check: http://localhost:${PORT}/api/health`);
    console.log(`[+] Quick Scan: POST http://localhost:${PORT}/api/audit/quick-scan`);
    console.log(`[+] Full Site Audit: POST http://localhost:${PORT}/api/audit/full`);
    console.log(`=======================================================`);
});

module.exports = { app, server };

