"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Search,
  Type,
  MousePointer,
  Image as ImageIcon,
  Globe,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Code2,
  Zap,
  ListFilter,
  Layers,
  FileText,
  Sliders,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface GuideArticle {
  id: string;
  category: "User Workflow" | "Font Licensing" | "CTA Design" | "Alt & SEO" | "Crawling & Reports";
  title: string;
  readTime: string;
  summary: string;
  icon: any;
  badgeColor: string;
  content: {
    overview: string;
    steps?: { stepNumber: number; title: string; desc: string }[];
    keyTakeaways: string[];
    codeSnippet?: string;
    bestPractices: string[];
  };
}

const GUIDES: GuideArticle[] = [
  {
    id: "step-by-step-audit-workflow",
    category: "User Workflow",
    title: "How to Input Website URL, Select Finding Type & Filter Font Names",
    readTime: "3 min read",
    summary:
      "A step-by-step guide on entering a target URL, picking finding types (Font, Image, Text, CTA), and searching for specific font families like Dinot or auditing all elements.",
    icon: Sliders,
    badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    content: {
      overview:
        "Running a website audit requires three simple inputs: your target URL, the type of element you want to inspect, and optional font search filters. Follow this exact 3-step sequence for fast and accurate results.",
      steps: [
        {
          stepNumber: 1,
          title: "Enter Target Website URL",
          desc: "Type or paste your page address (e.g. https://razib.bd or https://example.com/pricing).",
        },
        {
          stepNumber: 2,
          title: "Select Finding Type",
          desc: "Choose 'All Findings' for a full scan, 'Font Family' for typography/licensing, 'Image Name/Src' for alt tags, 'Text Content' for copy text, or 'Button with CTA Text' for CTA buttons.",
        },
        {
          stepNumber: 3,
          title: "Enter Font Name or Leave Empty",
          desc: "Enter a specific font family name (e.g. 'Dinot', 'Proxima Nova', 'Inter') to highlight target font elements and stylesheets. Leave completely empty to discover ALL font families and elements on the page.",
        },
      ],
      keyTakeaways: [
        "Empty Font Name field = Scans & lists 100% of all font families on the site.",
        "Specific Font Name field = Pinpoints specific target font occurrences and matching CSS declarations.",
        "Works seamlessly across both Quick Scan and Full Site Sitemap XML Crawlers.",
      ],
      codeSnippet: `// Example search parameter configuration:
Target Page URL: "https://razib.bd"
Finding Type:    "Font Family"
Target Font:     "Dinot" (Or leave empty for ALL fonts)`,
      bestPractices: [
        "Leave Font Name empty on your first audit to get a complete inventory of all fonts used.",
        "Enter exact font family names (case-insensitive) when auditing brand guidelines or licensing compliance.",
        "Ensure URLs include http:// or https:// protocol for accurate headless DOM parsing.",
      ],
    },
  },
  {
    id: "quick-scan-guide",
    category: "User Workflow",
    title: "Quick Scan Guide: Instant Single Page Synchronous Audit",
    readTime: "3 min read",
    summary:
      "Learn how to use Quick Scan to evaluate single landing pages, inspect button tokens, and find missing alt tags in under 10 seconds.",
    icon: Zap,
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    content: {
      overview:
        "Quick Scan performs a real-time, synchronous DOM inspection of any single web page URL. It is ideal for rapid developer checks, landing page QA, and instant visual reporting.",
      steps: [
        {
          stepNumber: 1,
          title: "Select 'Quick Scan' Tab in Audit Center",
          desc: "Navigate to the Audit Control Center (/dashboard) and choose the Single Page Quick Scan mode.",
        },
        {
          stepNumber: 2,
          title: "Configure Inputs & Click 'Start Quick Scan'",
          desc: "Input target URL, select finding type (All, Font, Image, Text, CTA), and set optional target font name.",
        },
        {
          stepNumber: 3,
          title: "Review Instant Interactive Results",
          desc: "Explore summary cards, unique font tables, CTA design token grids, missing alt image tables, and target element match highlights.",
        },
      ],
      keyTakeaways: [
        "Instant execution with zero wait time.",
        "Does not require background job queueing or sitemaps.",
        "Provides inline CSS stylesheet inspection for target fonts.",
      ],
      bestPractices: [
        "Use Quick Scan when testing live design updates or new landing pages before publishing.",
        "Check CTA button contrast ratios directly in the Button Audit Grid.",
      ],
    },
  },
  {
    id: "sitemap-xml-crawler-guide",
    category: "Crawling & Reports",
    title: "Sitemap XML Crawler Guide: Auditing Full Web Sitemaps",
    readTime: "5 min read",
    summary:
      "Step-by-step instructions on parsing sitemap.xml files to audit multi-page websites and export styled 6-worksheet Excel workbooks.",
    icon: Globe,
    badgeColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
    content: {
      overview:
        "The Sitemap XML Crawler automatically fetches and parses site sitemaps, extracting all published URLs to execute asynchronous multi-page background audits.",
      steps: [
        {
          stepNumber: 1,
          title: "Select 'Full Site Crawler' -> 'Sitemap XML' Mode",
          desc: "Switch to Full Site Crawler on the Audit Dashboard and click the 'Sitemap XML' input toggle.",
        },
        {
          stepNumber: 2,
          title: "Enter Sitemap XML Link & Max Page Limit",
          desc: "Paste your sitemap URL (e.g. https://razib.bd/sitemap.xml) and select max pages to crawl (1 to 50).",
        },
        {
          stepNumber: 3,
          title: "Track Asynchronous Progress & Download Excel",
          desc: "Monitor live progress percent in the Job Status Tracker, then click 'Download Excel Workbook (.xlsx)'.",
        },
      ],
      keyTakeaways: [
        "Audits up to 50 pages automatically in background jobs.",
        "Generates multi-sheet Excel reports (.xlsx) with styled summary headers.",
        "Extracts sitemap URLs recursively.",
      ],
      codeSnippet: `// Example Sitemap Audit Payload
{
  "sitemapUrl": "https://razib.bd/sitemap.xml",
  "findingType": "font",
  "findingValue": "Dinot",
  "maxPages": 25
}`,
      bestPractices: [
        "Verify your sitemap URL opens cleanly in a browser before submitting.",
        "Set max pages limit higher (e.g. 50 pages) for comprehensive agency client audits.",
      ],
    },
  },
  {
    id: "crawl-website-hyperlink-guide",
    category: "Crawling & Reports",
    title: "Crawl Website Guide: Recursive Hyperlink Crawler for Full Sites",
    readTime: "4 min read",
    summary:
      "How to audit websites that lack an XML sitemap by using our recursive internal link crawler.",
    icon: Layers,
    badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
    content: {
      overview:
        "When a target web property does not publish an XML sitemap, the Recursive Website Crawler starts at the root domain URL and follows internal HTML hyperlinks to build a full site page map.",
      steps: [
        {
          stepNumber: 1,
          title: "Select 'Crawl Website (Recursive)' Mode",
          desc: "In the Full Site Crawler form, select the 'Crawl Website' input button.",
        },
        {
          stepNumber: 2,
          title: "Enter Root Website Domain",
          desc: "Enter your home page or section URL (e.g. https://razib.bd).",
        },
        {
          stepNumber: 3,
          title: "Run Background Crawl Job",
          desc: "The crawler extracts internal <a> links, filters out external domains, and audits each internal page.",
        },
      ],
      keyTakeaways: [
        "No sitemap XML required.",
        "Automatically ignores external outbound domain links.",
        "Deep DOM execution for dynamic JavaScript-rendered internal links.",
      ],
      bestPractices: [
        "Ideal for single-page applications (SPAs) and custom web portals.",
        "Use with 'Font Family' finding type to catch unapproved fonts across internal sub-pages.",
      ],
    },
  },
  {
    id: "custom-url-list-guide",
    category: "Crawling & Reports",
    title: "Enter URL List Guide: Custom Multi-URL Batch Auditing",
    readTime: "3 min read",
    summary:
      "Learn how to audit a custom list of batch URLs line-by-line for campaign pages, staging environments, or multi-domain properties.",
    icon: FileText,
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    content: {
      overview:
        "Need to audit specific staging URLs, marketing landing pages, or cross-domain URLs? The Custom URL List input mode lets you paste a custom batch of URLs for parallel background scanning.",
      steps: [
        {
          stepNumber: 1,
          title: "Select 'Custom URL List' Mode",
          desc: "Click 'Custom URL List' in the Full Site Crawler control form.",
        },
        {
          stepNumber: 2,
          title: "Paste Line-Separated URL List",
          desc: "Paste one URL per line into the text box (e.g. https://razib.bd\\nhttps://razib.bd/about\\nhttps://razib.bd/case-study).",
        },
        {
          stepNumber: 3,
          title: "Launch Batch Audit & Export Excel",
          desc: "Click 'Start Full Site Audit' to enqueue all pasted URLs into a unified multi-sheet report.",
        },
      ],
      keyTakeaways: [
        "Audit exact URLs without crawling unwanted pages.",
        "Supports pasting cross-domain or staging URLs.",
        "Exports unified audit metrics across all specified URLs into one Excel workbook.",
      ],
      codeSnippet: `// Example pasted URL List
https://razib.bd
https://razib.bd/dashboard
https://razib.bd/case-study
https://razib.bd/guides`,
      bestPractices: [
        "Ensure each URL is placed on a separate new line.",
        "Use this mode when comparing production vs staging deployment pages.",
      ],
    },
  },
  {
    id: "font-licensing-compliance",
    category: "Font Licensing",
    title: "Web Font Licensing Classification & Web Embedding Compliance",
    readTime: "5 min read",
    summary:
      "Learn how to audit web font families, identify commercial font licensing risks, and classify Google Fonts vs system fonts.",
    icon: Type,
    badgeColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
    content: {
      overview:
        "Using unlicensed or improperly configured web fonts can lead to costly copyright litigation and brand inconsistency. Our engine analyzes compute styles, `@font-face` declarations, and stylesheet links to categorize every font family into clear licensing tiers.",
      keyTakeaways: [
        "Detect commercial fonts like Dinot, Helvetica, Proxima Nova, and Circular.",
        "Differentiate free Google Fonts / SIL Open Font License from proprietary commercial fonts.",
        "Extract embedded font formats (.woff2, .woff, .ttf, .eot) automatically.",
        "Map computed font families back to targeted CSS stylesheets.",
      ],
      codeSnippet: `/* Example CSS @font-face declaration checked during audit */
@font-face {
  font-family: 'Dinot-Bold';
  src: url('/fonts/dinot-bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}`,
      bestPractices: [
        "Always verify desktop vs web embedding license scope for custom brand fonts.",
        "Use font-display: swap to eliminate render-blocking text flashes.",
        "Audit font weight variants to avoid loading unnecessary multi-megabyte font files.",
      ],
    },
  },
  {
    id: "cta-design-token-audit",
    category: "CTA Design",
    title: "Call to Action (CTA) Button Tokens & WCAG Contrast Standards",
    readTime: "4 min read",
    summary:
      "Extract CTA button styling tokens (background, border, padding, hover effect) and verify accessibility compliance.",
    icon: MousePointer,
    badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
    content: {
      overview:
        "Call to Action buttons drive user conversions. Inconsistent padding, non-standard font choices, or low color contrast reduce user engagement and breach accessibility standards.",
      keyTakeaways: [
        "Inspect inline and stylesheet button styles across all interactive page elements.",
        "Verify button contrast against WCAG 2.1 Level AA minimum contrast ratio (4.5:1).",
        "Standardize button design tokens across desktop and mobile viewports.",
        "Identify orphan buttons missing hover/focus state feedback.",
      ],
      bestPractices: [
        "Maintain a minimum touch target size of 44x44 pixels for touch screens.",
        "Ensure call-to-action text clearly describes the user action.",
        "Use consistent primary, secondary, and ghost button styling tokens.",
      ],
    },
  },
  {
    id: "image-alt-tag-accessibility",
    category: "Alt & SEO",
    title: "Image Alt Tag Compliance & Screen Reader Accessibility",
    readTime: "4 min read",
    summary:
      "Discover how to audit missing alt attributes on content images, improve ADA compliance, and boost SEO rankings.",
    icon: ImageIcon,
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    content: {
      overview:
        "Search engine web crawlers and screen readers rely on image alt text to understand visual media. Missing alt text directly harms organic search visibility and web accessibility.",
      keyTakeaways: [
        "Automatically extract all <img> elements lacking 'alt' attribute attributes.",
        "Flag images with placeholder alt text (e.g. 'image.jpg' or 'untitled').",
        "Distinguish between decorative graphics (alt='') and key content images.",
        "Generate actionable Excel reports for web content teams.",
      ],
      bestPractices: [
        "Write descriptive, concise alt text that conveys image context.",
        "Avoid redundant phrases like 'image of' or 'photo of'.",
        "Mark purely decorative background patterns with alt='' or aria-hidden='true'.",
      ],
    },
  },
  {
    id: "excel-workbook-reporting",
    category: "Crawling & Reports",
    title: "Understanding 6-Worksheet Excel Audit Reports",
    readTime: "3 min read",
    summary:
      "A complete guide to navigating and sharing formatted Excel workbooks generated by our audit engine.",
    icon: FileSpreadsheet,
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    content: {
      overview:
        "Executive stakeholders require structured data downloads. Every full site audit generates a multi-tab Microsoft Excel workbook (.xlsx) formatted with headers, summary KPIs, and detailed URL tables.",
      keyTakeaways: [
        "Worksheet 1: Executive Overview & High-Level Metrics.",
        "Worksheet 2: Target Font & Style Matches by URL.",
        "Worksheet 3: Unique Font Family Inventory & Font-Face list.",
        "Worksheet 4: CTA Button Design Tokens & Color Specs.",
        "Worksheet 5: Missing Alt Image Inventory.",
        "Worksheet 6: All Audited Page URLs & Response Times.",
      ],
      bestPractices: [
        "Share the Executive Overview sheet directly with C-level stakeholders.",
        "Filter the Missing Alt Image sheet by page section for fast content updates.",
        "Keep exported JSON/Excel files archived for quarterly compliance comparisons.",
      ],
    },
  },
];

const FAQS = [
  {
    question: "How do I search for a specific font family like Dinot?",
    answer: "Select 'Font Family' as Finding Type and enter 'Dinot' (or any font name) in the Target Font field. The scanner will highlight all elements and stylesheets matching that typeface.",
  },
  {
    question: "What happens if I leave the Font Name field empty?",
    answer: "Leaving the field empty scans and inventories ALL font families, buttons, alt tags, and copy text across the entire target page or sitemap.",
  },
  {
    question: "What is the difference between Quick Scan and Full Site Sitemap XML Crawler?",
    answer: "Quick Scan audits a single web page synchronously in < 10 seconds. Sitemap XML Crawler parses site sitemaps to audit up to 50 internal pages in the background with a 6-worksheet Excel download.",
  },
  {
    question: "Can I crawl a website if it doesn't have a sitemap.xml file?",
    answer: "Yes! Choose the 'Crawl Website (Recursive)' mode under Full Site Crawler. The engine will discover and crawl internal links starting from the home domain.",
  },
  {
    question: "How do I audit a specific list of landing page URLs?",
    answer: "Use the 'Custom URL List' input mode under Full Site Crawler and paste your line-separated URLs into the text field.",
  },
];

export default function GuidesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const categories = ["All", "User Workflow", "Font Licensing", "CTA Design", "Alt & SEO", "Crawling & Reports"];

  const filteredGuides = GUIDES.filter((guide) => {
    const matchesCategory = selectedCategory === "All" || guide.category === selectedCategory;
    const matchesSearch =
      guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-16 space-y-12"
    >
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-purple-900/30 border border-blue-500/20 p-8 sm:p-12 text-center space-y-6 backdrop-blur-xl">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-xs font-semibold">
          <BookOpen className="h-4 w-4" />
          Platform Feature Guides &amp; User Manual
        </div>

        <div className="space-y-3 max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Website Audit &amp; Feature Guides
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed">
            Step-by-step instructions on entering URLs, selecting finding types, filtering font names, running Quick Scans, and crawling Sitemap XMLs.
          </p>
        </div>

        {/* Search & Category Filter */}
        <div className="max-w-2xl mx-auto space-y-4 pt-2">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guides by feature name, URL mode, or keyword..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/90 dark:bg-slate-950/90 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 🚀 Quick Start Guide Card: How to Run an Audit in 3 Steps */}
      <section className="rounded-3xl bg-gradient-to-r from-blue-900/20 via-indigo-900/20 to-purple-900/20 dark:from-slate-900/90 dark:to-slate-900/80 border border-blue-500/30 p-6 sm:p-8 space-y-6 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider mb-2">
              <CheckCircle2 className="h-3.5 w-3.5" /> Quick Input Workflow
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              How to Run an Audit: 3 Simple Steps
            </h2>
          </div>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-2"
          >
            Open Audit Control Center <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Step 1 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-sm">
                1
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Enter Website URL</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Enter the target page URL (e.g. <code className="text-blue-500 font-mono">https://razib.bd</code>) or sitemap XML link (e.g. <code className="text-blue-500 font-mono">https://razib.bd/sitemap.xml</code>).
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white font-bold text-sm">
                2
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Select Finding Type</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Choose <strong className="text-slate-900 dark:text-white">All Findings</strong>, <strong className="text-slate-900 dark:text-white">Font Family</strong>, <strong className="text-slate-900 dark:text-white">Image Name/Src</strong>, <strong className="text-slate-900 dark:text-white">Text Content</strong>, or <strong className="text-slate-900 dark:text-white">CTA Button Text</strong>.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-sm">
                3
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Enter Font Name or Empty</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Type a font family name like <code className="text-emerald-500 font-mono">Dinot</code> or <code className="text-emerald-500 font-mono">Inter</code> to filter specific typefaces, or <strong className="text-slate-900 dark:text-white">leave empty</strong> to audit ALL fonts &amp; elements.
            </p>
          </div>
        </div>
      </section>

      {/* Guides Grid */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Detailed Feature Guides ({filteredGuides.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredGuides.map((guide) => {
            const Icon = guide.icon;
            return (
              <motion.article
                key={guide.id}
                whileHover={{ y: -4 }}
                className="rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm dark:shadow-none backdrop-blur-xl flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${guide.badgeColor}`}>
                        {guide.category}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {guide.readTime}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
                      {guide.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {guide.summary}
                    </p>
                  </div>

                  {/* Detailed Step Sequence if Available */}
                  {guide.content.steps && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                        Step-by-Step Instructions:
                      </h4>
                      <div className="space-y-2">
                        {guide.content.steps.map((st) => (
                          <div key={st.stepNumber} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[10px]">
                                {st.stepNumber}
                              </span>
                              {st.title}
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 pl-7 text-[11px]">
                              {st.desc}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Guide Breakdown */}
                  <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {guide.content.overview}
                    </p>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                        Key Capabilities:
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                        {guide.content.keyTakeaways.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {guide.content.codeSnippet && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          <Code2 className="h-3.5 w-3.5" /> Code &amp; Configuration Example
                        </div>
                        <pre className="p-3 rounded-xl bg-slate-950 text-slate-200 text-xs overflow-x-auto border border-slate-800 font-mono">
                          {guide.content.codeSnippet}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group"
                  >
                    Run Live Audit <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      {/* Quick FAQ Section */}
      <section className="rounded-3xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold">
            <HelpCircle className="h-3.5 w-3.5" /> Common Questions
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Frequently Asked Questions</h3>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = expandedFaq === index;
            return (
              <div
                key={index}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(isOpen ? null : index)}
                  className="w-full p-4 text-left flex items-center justify-between font-semibold text-sm text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  <span>{faq.question}</span>
                  {isOpen ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                </button>
                {isOpen && (
                  <div className="p-4 pt-0 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-900">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Start Audit Call to Action */}
      <section className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 sm:p-10 text-white text-center space-y-6 shadow-xl">
        <div className="space-y-3 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold">Ready to Audit Your Website?</h2>
          <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
            Run an instant 6-in-1 quality audit on any single URL or full sitemap XML in under 60 seconds.
          </p>
        </div>
        <div className="flex justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-blue-600 hover:bg-slate-100 font-bold text-sm shadow-lg transition-all"
          >
            <Zap className="h-4 w-4 fill-blue-600 text-blue-600" />
            Launch Audit Control Center
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </motion.div>
  );
}
