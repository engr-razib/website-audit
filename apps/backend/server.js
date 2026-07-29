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
let BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY || (process.env.NODE_ENV === 'production' ? '2UyXC7OcLU2mwm77ae4b055adfcec31aa0333d1979976e9cb' : null);


const app = express();
const PORT = process.env.PORT || 3000;
const OUTPUTS_DIR = path.join(__dirname, 'outputs');

if (!fs.existsSync(OUTPUTS_DIR)) {
    fs.mkdirSync(OUTPUTS_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json());
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
                        fontMap.set(key, { ...f, pageCount: 1 });
                    } else {
                        fontMap.get(key).pageCount++;
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

    res.download(job.excelPath);
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

    res.download(job.jsonPath);
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

const server = app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`[🚀] Website Audit REST API Microservice running on Port ${PORT}`);
    console.log(`[+] Health Check: http://localhost:${PORT}/api/health`);
    console.log(`[+] Quick Scan: POST http://localhost:${PORT}/api/audit/quick-scan`);
    console.log(`[+] Full Site Audit: POST http://localhost:${PORT}/api/audit/full`);
    console.log(`=======================================================`);
});

module.exports = { app, server };

