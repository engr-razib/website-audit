const axios = require('axios');
const cheerio = require('cheerio');
const ExcelJS = require('exceljs');
const path = require('path');

const PRODUCT_URL = 'https://www.revoo-ev.com.bd/product-a/18.html';
const BASE_URL = 'https://www.revoo-ev.com.bd';

async function scrapeRevooA10() {
    console.log('[+] Fetching REVOO A10 product page...');
    
    const response = await axios.get(PRODUCT_URL, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 20000
    });

    const $ = cheerio.load(response.data);
    const data = {};

    // ── Basic Product Info ──────────────────────────────────────────
    data['Product Name']    = $('section.proinfobox-sec1 h1.f_tit').text().trim() || 'REVOO A10';
    data['Tagline']         = $('section.proinfobox-sec1 p.f_text').first().text().trim();
    data['Product URL']     = PRODUCT_URL;
    
    // SEO Meta
    data['Page Title']      = $('title').text().trim();
    data['Meta Description']= $('meta[name="description"]').attr('content') || '';
    data['Meta Keywords']   = $('meta[name="keywords"]').attr('content') || '';

    // ── Hero Highlights (Key Specs from sec2) ───────────────────────
    const highlights = [];
    $('section.proinfobox-sec2 .f_jt .li').each((i, el) => {
        const label = $(el).find('.f_text').text().trim();
        const value = $(el).find('h3.f_t2').text().trim();
        if (label && value) {
            highlights.push(`${label}: ${value}`);
        }
    });
    data['Key Highlights']  = highlights.join(' | ');
    data['Top Speed']       = 'UP TO 35KM/H';
    data['Range Per Charge']= '65-75KM';
    data['Battery']         = '48V26Ah (Graphene Battery)';

    // ── Full Specifications Table ─────────────────────────────────
    $('section.proinfobox-sec9 .f_tabel table tr').each((i, el) => {
        const cells = $(el).find('td');
        if (cells.length >= 2) {
            const key = $(cells[0]).text().trim();
            const val = $(cells[1]).text().trim().replace(/\s+/g, ' ');
            if (key && val) {
                data[key] = val;
            }
        }
    });

    // ── Design Features (sec3 slider) ────────────────────────────
    const designFeatures = [];
    $('section.proinfobox-sec3 .swiper-slide .font h3.f_tit').each((i, el) => {
        const text = $(el).text().trim();
        if (text) designFeatures.push(text);
    });
    data['Design Features'] = designFeatures.join(' | ');

    // ── Savings Data Attributes ───────────────────────────────────
    const savingsEl = $('.f_poss.gm_pro_compute_ajax_param');
    if (savingsEl.length) {
        data['Battery Voltage (V)']   = savingsEl.attr('data-v') || '';
        data['Battery Amp-hour (Ah)'] = savingsEl.attr('data-a') || '';
        data['Max Endurance (km)']    = savingsEl.attr('data-endurance') || '';
        data['Electricity Price (BDT/unit)'] = savingsEl.attr('data-price-electricity') || '';
    }

    // ── Images ───────────────────────────────────────────────────
    const images = [];

    // OG/main product image
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) images.push(ogImage);

    // Hero section product image
    $('section.proinfobox-sec1 .f_tu picture.f_img img').each((i, el) => {
        const src = $(el).attr('src');
        if (src) {
            const abs = src.startsWith('http') ? src : BASE_URL + src;
            if (!images.includes(abs)) images.push(abs);
        }
    });

    // Colour swatch images
    $('section.proinfobox-sec1 .f_skin picture.f_ig img').each((i, el) => {
        const src = $(el).attr('src');
        if (src) {
            const abs = src.startsWith('http') ? src : BASE_URL + src;
            if (!images.includes(abs)) images.push(abs);
        }
    });

    // Spec table image (colour photo)
    $('section.proinfobox-sec9 .f_tabel table td img').each((i, el) => {
        const src = $(el).attr('src');
        if (src) {
            const abs = src.startsWith('http') ? src : BASE_URL + src;
            if (!images.includes(abs)) images.push(abs);
        }
    });

    // Banner image
    $('section.probanner picture img').each((i, el) => {
        const src = $(el).attr('src');
        if (src) {
            const abs = src.startsWith('http') ? src : BASE_URL + src;
            if (!images.includes(abs)) images.push(abs);
        }
    });

    images.forEach((img, idx) => {
        data[`Image URL ${idx + 1}`] = img;
    });

    // ── Social / Contact ─────────────────────────────────────────
    const phones = [];
    $('.f_tel p').each((i, el) => phones.push($(el).text().trim()));
    data['Phone Numbers'] = phones.join(' | ');

    // ── Video ────────────────────────────────────────────────────
    const videoBtn = $('a.f_videobtn');
    if (videoBtn.length) {
        const videoSrc = videoBtn.attr('data-video-src') || '';
        data['Product Video'] = videoSrc ? (videoSrc.startsWith('http') ? videoSrc : BASE_URL + videoSrc) : '';
    }

    return data;
}

async function generateExcel(productData) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Website Audit Tool';
    workbook.created = new Date();

    // ── Sheet 1: Product Summary ──────────────────────────────────
    const summarySheet = workbook.addWorksheet('Product Summary');

    const summaryTitle = summarySheet.addRow(['REVOO A10 – Electric Bike Product Information']);
    summaryTitle.getCell(1).font = { name: 'Segoe UI', bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    summaryTitle.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D2137' } };
    summaryTitle.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    summarySheet.mergeCells('A1:C1');
    summaryTitle.height = 36;

    summarySheet.addRow([]);

    const headerRow = summarySheet.addRow(['Field', 'Value', 'Notes']);
    headerRow.height = 28;
    headerRow.eachCell((cell, colNum) => {
        cell.font = { name: 'Segoe UI', bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
            top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
            bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        };
    });

    summarySheet.columns = [
        { key: 'field', width: 32 },
        { key: 'value', width: 60 },
        { key: 'notes', width: 30 }
    ];

    const categoryGroups = {
        '🏷️ Basic Info': ['Product Name', 'Tagline', 'Product URL', 'Page Title', 'Meta Description', 'Meta Keywords'],
        '⚡ Key Performance': ['Top Speed', 'Range Per Charge', 'Battery', 'Key Highlights'],
        '🔧 Full Specifications': ['Top Speed', 'Max Range', 'Batteries', 'Charging Time(hrs)', 'Motor',
            'Electricity Consumption', 'Controllers', 'Tyres', 'Brakes', 'Shocks',
            'Dimensions(L*W*H)', 'Wheel Base', 'Ground Clearance', 'Dry Weight', 'Color'],
        '🎨 Features': ['Design Features'],
        '🔋 Energy & Savings': ['Battery Voltage (V)', 'Battery Amp-hour (Ah)', 'Max Endurance (km)', 'Electricity Price (BDT/unit)'],
        '📞 Contact & Media': ['Phone Numbers', 'Product Video'],
    };

    // Track rendered fields to add images separately
    const renderedFields = new Set();
    let rowIdx = 0;
    
    for (const [category, fields] of Object.entries(categoryGroups)) {
        // Category separator
        const catRow = summarySheet.addRow([category, '', '']);
        catRow.getCell(1).font = { name: 'Segoe UI', bold: true, size: 11, color: { argb: 'FF0D47A1' } };
        catRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
        catRow.height = 24;
        summarySheet.mergeCells(`A${catRow.number}:C${catRow.number}`);

        fields.forEach((field, i) => {
            if (productData[field] !== undefined && !renderedFields.has(field)) {
                renderedFields.add(field);
                const dataRow = summarySheet.addRow([field, productData[field], '']);
                dataRow.height = 22;
                const isEven = rowIdx % 2 === 0;
                dataRow.eachCell((cell) => {
                    cell.font = { name: 'Segoe UI', size: 10 };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF5F9FF' } };
                    cell.alignment = { vertical: 'middle', wrapText: true };
                    cell.border = {
                        bottom: { style: 'hair', color: { argb: 'FFE0E0E0' } },
                    };
                });
                dataRow.getCell(1).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1565C0' } };
                rowIdx++;
            }
        });

        summarySheet.addRow([]);
    }

    // ── Sheet 2: Images ──────────────────────────────────────────
    const imagesSheet = workbook.addWorksheet('Product Images');
    imagesSheet.columns = [
        { key: 'type', width: 20 },
        { key: 'url', width: 100 },
    ];

    const imgHeaderRow = imagesSheet.addRow(['Image Type', 'Image URL']);
    imgHeaderRow.height = 28;
    imgHeaderRow.eachCell((cell) => {
        cell.font = { name: 'Segoe UI', bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    const imageTypes = ['OG / Main Image', 'Product Hero Image', 'Colour Swatch 1', 'Colour Swatch 2', 'Colour Specification', 'Banner Image'];
    let imgIdx = 1;
    while (productData[`Image URL ${imgIdx}`]) {
        const imageRow = imagesSheet.addRow([
            imageTypes[imgIdx - 1] || `Image ${imgIdx}`,
            productData[`Image URL ${imgIdx}`]
        ]);
        imageRow.height = 20;
        const isEven = imgIdx % 2 === 0;
        imageRow.eachCell((cell) => {
            cell.font = { name: 'Segoe UI', size: 10 };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? 'FFF5F9FF' : 'FFFFFFFF' } };
            cell.alignment = { vertical: 'middle', wrapText: true };
        });
        imgIdx++;
    }

    // ── Sheet 3: Specifications ───────────────────────────────────
    const specSheet = workbook.addWorksheet('Specifications Table');
    specSheet.columns = [
        { key: 'spec', width: 30 },
        { key: 'value', width: 55 },
    ];

    const specHeaderRow = specSheet.addRow(['Specification', 'Value']);
    specHeaderRow.height = 28;
    specHeaderRow.eachCell((cell) => {
        cell.font = { name: 'Segoe UI', bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    const specs = [
        ['Top Speed', productData['Top Speed']],
        ['Max Range', productData['Max Range']],
        ['Batteries', productData['Batteries']],
        ['Charging Time', productData['Charging Time(hrs)']],
        ['Motor', productData['Motor']],
        ['Electricity Consumption', productData['Electricity Consumption']],
        ['Controllers', productData['Controllers']],
        ['Tyres', productData['Tyres']],
        ['Brakes', productData['Brakes']],
        ['Shocks', productData['Shocks']],
        ['Dimensions (L×W×H)', productData['Dimensions(L*W*H)']],
        ['Wheel Base', productData['Wheel Base']],
        ['Ground Clearance', productData['Ground Clearance']],
        ['Dry Weight', productData['Dry Weight']],
    ];

    specs.forEach(([spec, val], i) => {
        if (val) {
            const row = specSheet.addRow([spec, val]);
            row.height = 22;
            const isEven = i % 2 === 0;
            row.eachCell((cell) => {
                cell.font = { name: 'Segoe UI', size: 10 };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF0F4FF' } };
                cell.alignment = { vertical: 'middle', wrapText: true };
                cell.border = { bottom: { style: 'hair', color: { argb: 'FFCFD8DC' } } };
            });
            row.getCell(1).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0D47A1' } };
        }
    });

    // ── Output ────────────────────────────────────────────────────
    const outputPath = path.join(__dirname, 'revoo_a10_product_info.xlsx');
    await workbook.xlsx.writeFile(outputPath);
    console.log(`\n[✓] Excel file generated: ${outputPath}`);
    return outputPath;
}

async function main() {
    try {
        const data = await scrapeRevooA10();
        console.log('\n[✓] Scraped product data:');
        console.table(Object.fromEntries(
            Object.entries(data)
                .filter(([k]) => !k.startsWith('Image URL') && !k.startsWith('Meta'))
                .slice(0, 20)
        ));
        await generateExcel(data);
    } catch (err) {
        console.error('[!] Error:', err.message);
        process.exit(1);
    }
}

main();
