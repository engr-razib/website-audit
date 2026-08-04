const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { chromium } = require('playwright');
const { fetchSitemapUrls, crawlInternalUrls, auditSinglePage } = require('./services/siteCrawlerEngine');
const { generateExcelReport } = require('./services/excelExportService');
const { cleanOutputs } = require('./cleanup_outputs');

// Run automatic output cleanup on server startup & schedule every 6 hours (cleaning files > 24 hours)
cleanOutputs();
setInterval(() => {
    cleanOutputs();
}, 6 * 60 * 60 * 1000).unref();

// Mutable runtime API key — can be updated via POST /api/settings/browserless-key
let BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY || '2UyXC7OcLU2mwm77ae4b055adfcec31aa0333d1979976e9cb';


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

const server = app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`[🚀] Website Audit REST API Microservice running on Port ${PORT}`);
    console.log(`[+] Health Check: http://localhost:${PORT}/api/health`);
    console.log(`[+] Quick Scan: POST http://localhost:${PORT}/api/audit/quick-scan`);
    console.log(`[+] Full Site Audit: POST http://localhost:${PORT}/api/audit/full`);
    console.log(`=======================================================`);
});

module.exports = { app, server };

