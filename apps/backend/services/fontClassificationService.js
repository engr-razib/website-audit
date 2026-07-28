/**
 * Font Classification Service
 * Categorizes web font families into Free / Open Source (Google Fonts & System) vs Premium / Commercial fonts.
 */

const FREE_GOOGLE_AND_SYSTEM_FONTS = new Set([
    'barlow', 'roboto', 'open sans', 'lato', 'montserrat', 'poppins', 'inter',
    'source sans pro', 'raleway', 'ubuntu', 'nunito', 'playfair display',
    'merriweather', 'pt sans', 'rubik', 'work sans', 'oswald', 'lora', 'quicksand',
    'noto sans', 'cabin', 'fira sans', 'inconsolata', 'mukta', 'syne', 'Outfit',
    'arial', 'helvetica', 'times new roman', 'georgia', 'courier new', 'verdana',
    'tahoma', 'trebuchet ms', 'impact', 'comic sans ms', 'sans-serif', 'serif',
    'monospace', 'cursive', 'fantasy', '-apple-system', 'blinkmacsystemfont',
    'segoe ui', 'system-ui'
]);

const KNOWN_PREMIUM_FONTS = new Set([
    'dinot', 'dinot-black', 'dinot-bold', 'dinot-medium', 'proxima nova', 'gotham',
    'futura', 'helvetica neue', 'avenir', 'avenir next', 'brandon grotesque',
    'ff din', 'din 1451', 'circular', 'gill sans', 'clarendon', 'baskerville',
    'frutiger', 'trade gothic', 'univers', 'bodoni', 'optima', 'ff meta',
    'myriad pro', 'minion pro', 'caslon', 'bickham script', 'rockwell'
]);

function cleanFontName(fontFamily) {
    if (!fontFamily) return '';
    return fontFamily
        .split(',')[0]
        .replace(/['"]/g, '')
        .trim();
}

function classifyFont(fontFamilyStr) {
    const primaryFont = cleanFontName(fontFamilyStr);
    if (!primaryFont) return { primaryFont: 'Unknown', category: 'Unknown', isPremium: false };

    const fontLower = primaryFont.toLowerCase();

    for (const freeFont of FREE_GOOGLE_AND_SYSTEM_FONTS) {
        if (fontLower.includes(freeFont)) {
            return {
                primaryFont,
                category: 'Free / Google / System Font',
                isPremium: false
            };
        }
    }

    for (const premFont of KNOWN_PREMIUM_FONTS) {
        if (fontLower.includes(premFont)) {
            return {
                primaryFont,
                category: 'Premium / Commercial Font',
                isPremium: true
            };
        }
    }

    // Default classification for unknown custom web fonts
    return {
        primaryFont,
        category: 'Custom / Unclassified Font',
        isPremium: false
    };
}

module.exports = {
    classifyFont,
    cleanFontName
};
