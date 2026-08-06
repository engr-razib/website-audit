const axios = require('axios');

// Cache to store parsed robots rules per domain origin
// Format: Map of origin -> rules array
const robotsCache = new Map();

// Helper to standardise headers
const ROBOTS_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (compatible; AuditBot/1.0; +https://audit.razib.bd/bot)'
};

/**
 * Parses raw robots.txt content into structured rules using a state machine
 */
function parseRobotsTxt(content) {
    const lines = content.split(/\r?\n/);
    const rules = [];
    let currentAgents = [];
    let lastKey = null;

    for (let line of lines) {
        // Strip comments and trim whitespace
        line = line.split('#')[0].trim();
        if (!line) continue;

        const separatorIdx = line.indexOf(':');
        if (separatorIdx === -1) continue;

        const key = line.slice(0, separatorIdx).trim().toLowerCase();
        const value = line.slice(separatorIdx + 1).trim();

        if (key === 'user-agent') {
            if (lastKey !== 'user-agent') {
                currentAgents = [];
            }
            currentAgents.push(value.toLowerCase());
            lastKey = 'user-agent';
        } else if (key === 'disallow' || key === 'allow') {
            if (currentAgents.length > 0) {
                for (const agent of currentAgents) {
                    rules.push({
                        userAgent: agent,
                        type: key, // 'allow' or 'disallow'
                        path: value
                    });
                }
            }
            lastKey = key;
        } else {
            lastKey = key;
        }
    }

    return rules;
}

/**
 * Retrieves and parses robots.txt for a given domain
 */
async function getRobotsRules(domainUrl) {
    try {
        const parsedUrl = new URL(domainUrl);
        const origin = parsedUrl.origin;

        if (robotsCache.has(origin)) {
            return robotsCache.get(origin);
        }

        const robotsUrl = `${origin}/robots.txt`;
        console.log(`[+] Fetching robots.txt rules from: ${robotsUrl}`);
        
        let content = '';
        try {
            const response = await axios.get(robotsUrl, { 
                headers: ROBOTS_HEADERS, 
                timeout: 10000,
                validateStatus: (status) => status === 200 
            });
            content = response.data;
        } catch (err) {
            // If robots.txt is missing (e.g. 404) or fails, standard crawler behavior is to allow everything
            console.log(`[-] robots.txt not found or inaccessible for ${origin} (${err.message}). Defaulting to allow all.`);
            content = '';
        }

        const rules = parseRobotsTxt(content);
        robotsCache.set(origin, rules);
        return rules;
    } catch (e) {
        console.error(`[!] Error getting robots rules for ${domainUrl}:`, e.message);
        return [];
    }
}

/**
 * Checks if a specific URL is allowed for crawling
 */
async function isUrlAllowed(url, botUserAgent = 'auditbot') {
    if (process.env.NEXT_PUBLIC_DISCLAIMER_ENABLED === 'false') {
        return true;
    }
    try {
        const parsedUrl = new URL(url);
        const rules = await getRobotsRules(url);
        const path = parsedUrl.pathname + parsedUrl.search;

        const agentLower = botUserAgent.toLowerCase();
        
        // Filter rules that apply to this bot or to '*'
        let relevantRules = rules.filter(r => r.userAgent === agentLower);
        if (relevantRules.length === 0) {
            relevantRules = rules.filter(r => r.userAgent === '*');
        }

        if (relevantRules.length === 0) {
            return true; // No rules, allowed
        }

        // Sort rules so more specific paths (longer) take precedence
        let allowed = true;
        let maxMatchLength = -1;

        for (const rule of relevantRules) {
            const rulePath = rule.path;
            if (!rulePath) {
                // Empty disallow rule (e.g. Disallow: ) means ALLOW everything
                if (rule.type === 'disallow') {
                    allowed = true;
                    maxMatchLength = 0;
                }
                continue;
            }

            // Check if URL path matches rule path
            let regexStr = rulePath
                .replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') // escape regex characters
                .replace(/\\\*/g, '.*'); // replace wildcards
            
            if (!regexStr.startsWith('^')) {
                regexStr = '^' + regexStr;
            }

            const ruleRegex = new RegExp(regexStr);
            if (ruleRegex.test(path)) {
                if (rulePath.length > maxMatchLength) {
                    maxMatchLength = rulePath.length;
                    allowed = (rule.type === 'allow');
                }
            }
        }

        return allowed;
    } catch (e) {
        console.error(`[!] Error checking robots.txt for URL ${url}:`, e.message);
        return true; // Default to allow on error
    }
}

module.exports = {
    isUrlAllowed,
    getRobotsRules
};
