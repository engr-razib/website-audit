const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { chromium } = require('playwright');
const { fetchSitemapUrls, auditSinglePage } = require('./services/siteCrawlerEngine');
const { generateExcelReport } = require('./services/excelExportService');
const { cleanOutputs } = require('./cleanup_outputs');

// Run automatic output cleanup on server startup & schedule every 6 hours (cleaning files > 24 hours)
cleanOutputs();
setInterval(() => {
    cleanOutputs();
}, 6 * 60 * 60 * 1000);


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
 * 2. POST /api/audit/full - Full Website Sitemap Audit (Asynchronous)
 */
app.post('/api/audit/full', async (req, res) => {
    const { sitemapUrl, fontName = "Dinot", maxPages = 100 } = req.body;

    if (!sitemapUrl) {
        return res.status(400).json({ error: 'sitemapUrl parameter is required' });
    }

    const jobId = uuidv4();
    const jobDir = path.join(OUTPUTS_DIR, jobId);
    fs.mkdirSync(jobDir, { recursive: true });

    jobs[jobId] = {
        jobId,
        status: 'pending',
        progress: { current: 0, total: 0, currentUrl: '', percent: 0 },
        sitemapUrl,
        fontName,
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
        try {
            const urls = await fetchSitemapUrls(sitemapUrl);
            const targetUrls = urls.slice(0, maxPages);
            jobs[jobId].progress.total = targetUrls.length;

            const browser = await chromium.launch({ headless: true, args: ['--disable-web-security'] });
            const pageResults = [];
            const ssCounter = { val: 1 };

            for (let i = 0; i < targetUrls.length; i++) {
                const url = targetUrls[i];
                jobs[jobId].progress.current = i + 1;
                jobs[jobId].progress.currentUrl = url;
                jobs[jobId].progress.percent = Math.round(((i + 1) / targetUrls.length) * 100);

                const res = await auditSinglePage(browser, url, fontName, jobDir, ssCounter);
                pageResults.push(res);
            }

            await browser.close();

            // Aggregating Summary Metrics
            const fontMap = new Map();
            const allCTAs = [];
            const allMissingAltImages = [];
            const allHeadings = [];
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

                targetElemCount += (p.targetFontElements || []).length;
                targetStyleCount += (p.targetFontStylesheets || []).length;
            });

            const fullAuditData = {
                jobId,
                sitemapUrl,
                fontName,
                auditedAt: new Date().toISOString(),
                pages: pageResults,
                fontSummary: Array.from(fontMap.values()),
                allCTAs,
                allMissingAltImages,
                allHeadings,
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
    const { url, fontName = "Dinot" } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'url parameter is required' });
    }

    try {
        const browser = await chromium.launch({ headless: true, args: ['--disable-web-security'] });
        const auditResult = await auditSinglePage(browser, url, fontName);
        await browser.close();

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

