const ExcelJS = require('exceljs');
const fs = require('fs');

async function generateExcelReport(fullAuditData, filePath) {
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

    function applyRowStyles(row, isEven, aligns = [], rowHeight = 24) {
        if (rowHeight) {
            row.height = rowHeight;
        }
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
            const align = aligns[colNum - 1] || 'left';
            cell.alignment = { horizontal: align, vertical: 'middle', wrapText: true };
        });
    }

    // -------------------------------------------------------------
    // Worksheet 1: Executive Summary Dashboard
    // -------------------------------------------------------------
    const summarySheet = workbook.addWorksheet('Executive Summary');
    summarySheet.views = [{ showGridLines: true }];
    summarySheet.getColumn(1).width = 35;
    summarySheet.getColumn(2).width = 45;

    const titleRow = summarySheet.addRow(['Website Comprehensive Audit Report', '']);
    titleRow.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FF1F497D' } };
    summarySheet.addRow([]);

    const totalPages = fullAuditData.pages ? fullAuditData.pages.length : 0;
    const uniqueFonts = fullAuditData.fontSummary ? fullAuditData.fontSummary.length : 0;
    const premiumFontsCount = fullAuditData.fontSummary ? fullAuditData.fontSummary.filter(f => f.isPremium).length : 0;
    const missingAltImagesCount = fullAuditData.allMissingAltImages ? fullAuditData.allMissingAltImages.length : 0;
    const totalCTAs = fullAuditData.allCTAs ? fullAuditData.allCTAs.length : 0;

    const metrics = [
        ['Total Pages Audited', totalPages],
        ['Unique Font Families Found', uniqueFonts],
        ['Premium / Commercial Fonts Found', premiumFontsCount],
        ['Free / Google / System Fonts Found', uniqueFonts - premiumFontsCount],
        ['Total Buttons & CTAs Discovered', totalCTAs],
        ['Total Images Missing Alt Tags', missingAltImagesCount],
        ['Target Element / Finding Matches', fullAuditData.targetFontElementCount || 0],
        ['Target Stylesheet Hits', fullAuditData.targetFontStyleCount || 0]
    ];

    metrics.forEach(([label, val], idx) => {
        const row = summarySheet.addRow([label, val]);
        row.height = 24;
        row.getCell(1).font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF1F497D' } };
        row.getCell(2).font = { name: 'Segoe UI', size: 11, bold: true };
    });

    // -------------------------------------------------------------
    // Worksheet 2: Font Families Audit (Free vs Premium)
    // -------------------------------------------------------------
    const fontSheet = workbook.addWorksheet('Font Families Audit');
    fontSheet.views = [{ state: 'frozen', ySplit: 1, showGridLines: true }];
    const fontHeaders = ['SL', 'Primary Font Name', 'Raw Font Declaration', 'Category Classification', 'Is Premium Font?', 'Usage Page Count'];
    const fontColWidths = [8, 30, 45, 30, 20, 20];
    const fHeaderRow = fontSheet.addRow(fontHeaders);
    fHeaderRow.height = 28;
    fHeaderRow.eachCell((cell, colNum) => {
        Object.assign(cell, headerStyle);
        fontSheet.getColumn(colNum).width = fontColWidths[colNum - 1];
    });

    (fullAuditData.fontSummary || []).forEach((f, idx) => {
        const row = fontSheet.addRow([
            idx + 1,
            f.primaryFont,
            f.rawFontFamily,
            f.category,
            f.isPremium ? 'YES (Premium)' : 'NO (Free)',
            f.pageCount
        ]);
        applyRowStyles(row, idx % 2 === 1, ['center', 'left', 'left', 'center', 'center', 'center']);
    });

    // -------------------------------------------------------------
    // Worksheet 3: Button & CTA Designs
    // -------------------------------------------------------------
    const ctaSheet = workbook.addWorksheet('Button & CTA Designs');
    ctaSheet.views = [{ state: 'frozen', ySplit: 1, showGridLines: true }];
    const ctaHeaders = ['SL', 'Target Page URL', 'Element Tag', 'CTA Text Snippet', 'Font Family', 'Font Size', 'Font Weight', 'Text Color', 'Background Color', 'Border Radius', 'Padding', 'Selector', 'Full HTML Tag', 'Relevant CSS Styles'];
    const ctaColWidths = [8, 40, 15, 30, 25, 12, 12, 18, 20, 15, 15, 25, 55, 55];
    const cHeaderRow = ctaSheet.addRow(ctaHeaders);
    cHeaderRow.height = 28;
    cHeaderRow.eachCell((cell, colNum) => {
        Object.assign(cell, headerStyle);
        ctaSheet.getColumn(colNum).width = ctaColWidths[colNum - 1];
    });

    (fullAuditData.allCTAs || []).forEach((c, idx) => {
        const row = ctaSheet.addRow([
            idx + 1,
            c.url,
            c.tagName,
            c.text,
            c.fontFamily,
            c.fontSize,
            c.fontWeight,
            c.color,
            c.backgroundColor,
            c.borderRadius,
            c.padding,
            c.selector,
            c.outerHTML || '',
            c.cssStyles || ''
        ]);
        applyRowStyles(row, idx % 2 === 1, ['center', 'left', 'center', 'left', 'left', 'center', 'center', 'center', 'center', 'center', 'center', 'left', 'left', 'left'], 45);
    });

    // -------------------------------------------------------------
    // Worksheet 4: Missing Alt Tag Images
    // -------------------------------------------------------------
    const imgSheet = workbook.addWorksheet('Missing Alt Tag Images');
    imgSheet.views = [{ state: 'frozen', ySplit: 1, showGridLines: true }];
    const imgHeaders = ['SL', 'Target Page URL', 'Image Source URL', 'Alt Tag Status', 'Natural Dimensions', 'Parent Element Tag', 'CSS Selector', 'Full HTML Tag', 'Relevant CSS Styles'];
    const imgColWidths = [8, 40, 55, 20, 20, 18, 25, 55, 55];
    const iHeaderRow = imgSheet.addRow(imgHeaders);
    iHeaderRow.height = 28;
    iHeaderRow.eachCell((cell, colNum) => {
        Object.assign(cell, headerStyle);
        imgSheet.getColumn(colNum).width = imgColWidths[colNum - 1];
    });

    (fullAuditData.allMissingAltImages || []).forEach((img, idx) => {
        const row = imgSheet.addRow([
            idx + 1,
            img.url,
            img.src,
            'MISSING ALT TAG',
            `${img.width} x ${img.height} px`,
            img.parentTag,
            img.selector,
            img.outerHTML || '',
            img.cssStyles || ''
        ]);
        applyRowStyles(row, idx % 2 === 1, ['center', 'left', 'left', 'center', 'center', 'center', 'left', 'left', 'left'], 45);
    });

    // -------------------------------------------------------------
    // Worksheet 5: Heading Typography (H1-H6)
    // -------------------------------------------------------------
    const headSheet = workbook.addWorksheet('Heading Typography (H1-H6)');
    headSheet.views = [{ state: 'frozen', ySplit: 1, showGridLines: true }];
    const headHeaders = ['SL', 'Target Page URL', 'Heading Tag', 'Heading Text Snippet', 'Font Family', 'Font Size', 'Font Weight', 'Color', 'Line Height', 'Text Transform', 'Full HTML Tag', 'Relevant CSS Styles'];
    const headColWidths = [8, 40, 15, 35, 25, 12, 12, 18, 15, 18, 55, 55];
    const hHeaderRow = headSheet.addRow(headHeaders);
    hHeaderRow.height = 28;
    hHeaderRow.eachCell((cell, colNum) => {
        Object.assign(cell, headerStyle);
        headSheet.getColumn(colNum).width = headColWidths[colNum - 1];
    });

    (fullAuditData.allHeadings || []).forEach((h, idx) => {
        const row = headSheet.addRow([
            idx + 1,
            h.url,
            h.level,
            h.text,
            h.fontFamily,
            h.fontSize,
            h.fontWeight,
            h.color,
            h.lineHeight,
            h.textTransform,
            h.outerHTML || '',
            h.cssStyles || ''
        ]);
        applyRowStyles(row, idx % 2 === 1, ['center', 'left', 'center', 'left', 'left', 'center', 'center', 'center', 'center', 'center', 'left', 'left'], 45);
    });

    // -------------------------------------------------------------
    // Worksheet 6: SEO Rules Audit
    // -------------------------------------------------------------
    const seoSheet = workbook.addWorksheet('SEO Rules Audit');
    seoSheet.views = [{ state: 'frozen', ySplit: 1, showGridLines: true }];
    const seoHeaders = ['SL', 'Target Page URL', 'Page Title Text', 'Title Length (30-60)', 'Meta Description', 'Meta Length (50-160)', 'H1 Count (Single H1)', 'Canonical Tag Present', 'Alt Coverage (%)'];
    const seoColWidths = [8, 40, 35, 18, 45, 18, 20, 20, 18];
    const sHeaderRow = seoSheet.addRow(seoHeaders);
    sHeaderRow.height = 28;
    sHeaderRow.eachCell((cell, colNum) => {
        Object.assign(cell, headerStyle);
        seoSheet.getColumn(colNum).width = seoColWidths[colNum - 1];
    });

    (fullAuditData.pages || []).forEach((p, idx) => {
        const s = p.seo || {};
        const row = seoSheet.addRow([
            idx + 1,
            p.url,
            s.title || '(Missing Title)',
            `${s.titleLength || 0} chars (${s.isTitleValid ? 'Valid' : 'Invalid'})`,
            s.metaDescription || '(Missing Meta Description)',
            `${s.metaDescLength || 0} chars (${s.isMetaDescValid ? 'Valid' : 'Invalid'})`,
            `${s.h1Count || 0} (${s.hasSingleH1 ? 'OK' : 'Issue'})`,
            s.hasCanonical ? 'YES' : 'NO',
            `${s.altCoveragePercent || 100}%`
        ]);
        applyRowStyles(row, idx % 2 === 1, ['center', 'left', 'left', 'center', 'left', 'center', 'center', 'center', 'center']);
    });

    // -------------------------------------------------------------
    // Worksheet 7: Target Finding Matches
    // -------------------------------------------------------------
    const matchesSheet = workbook.addWorksheet('Finding Matches');
    matchesSheet.views = [{ state: 'frozen', ySplit: 1, showGridLines: true }];
    const matchHeaders = ['SL', 'Target Page URL', 'Match Type', 'Element Tag', 'Selector', 'Snippet / Detail', 'Full HTML Tag', 'Relevant CSS Styles'];
    const matchColWidths = [8, 40, 18, 15, 30, 35, 55, 55];
    const mHeaderRow = matchesSheet.addRow(matchHeaders);
    mHeaderRow.height = 28;
    mHeaderRow.eachCell((cell, colNum) => {
        Object.assign(cell, headerStyle);
        matchesSheet.getColumn(colNum).width = matchColWidths[colNum - 1];
    });

    let matchIdx = 0;
    (fullAuditData.pages || []).forEach(p => {
        (p.targetFontElements || []).forEach(m => {
            const row = matchesSheet.addRow([
                ++matchIdx,
                p.url,
                m.matchType || 'N/A',
                m.tagName,
                m.selector,
                m.textSnippet,
                m.outerHTML || '',
                m.cssStyles || ''
            ]);
            applyRowStyles(row, matchIdx % 2 === 1, ['center', 'left', 'center', 'center', 'left', 'left', 'left', 'left'], 45);
        });
    });

    // Write file
    const buffer = await workbook.xlsx.writeBuffer();
    fs.writeFileSync(filePath, buffer);
    return filePath;
}

module.exports = {
    generateExcelReport
};
