"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  Database,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Link2,
  Settings,
  HelpCircle,
  Eye,
  ChevronDown
} from "lucide-react";
import {
  parseExcelHeaders,
  startCustomCrawlJob,
  getCustomCrawlJobStatus,
  getCustomCrawlExcelDownloadUrl,
  getCustomCrawlZipDownloadUrl,
  CustomCrawlMapping,
  CustomCrawlJobStatus
} from "@/lib/api";

export default function CustomCrawlerPage() {
  // Input fields state
  const [webpageUrl, setWebpageUrl] = useState("");
  const [crawlOption, setCrawlOption] = useState<"data" | "data-and-images">("data");
  const [maxPages, setMaxPages] = useState<number>(5);
  const [containerSelector, setContainerSelector] = useState("");
  
  // File state
  const [xlsxFile, setXlsxFile] = useState<File | null>(null);
  const [xlsxBase64, setXlsxBase64] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, CustomCrawlMapping>>({});
  
  // App state
  const [loadingHeaders, setLoadingHeaders] = useState(false);
  const [startingCrawl, setStartingCrawl] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<CustomCrawlJobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up polling timer on unmount
  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
    };
  }, []);

  const loadSandboxConfig = () => {
    const guidesUrl = typeof window !== "undefined" 
      ? window.location.origin + "/guides/" 
      : "http://localhost:3001/guides/";
    setWebpageUrl(guidesUrl);
    setContainerSelector('[data-testid="guide-card"]');
    setSuccess("Sandbox demo configuration loaded! Download the sample template and drag & drop it below.");
    setError(null);
  };

  // Convert Excel file to base64 and parse headers
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setXlsxFile(file);
    setLoadingHeaders(true);
    setError(null);
    setSuccess(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64 = (event.target?.result as string).split(",")[1];
        setXlsxBase64(base64);

        const res = await parseExcelHeaders(base64);
        setHeaders(res.headers);

        // Generate smart default mappings
        const defaultMappings: Record<string, CustomCrawlMapping> = {};
        res.headers.forEach((h) => {
          const lower = h.toLowerCase().trim();
          
          // Match our pre-built sandbox template headers
          if (lower === "guide id") {
            defaultMappings[h] = { selector: '[data-testid="guide-card"]', type: "attr", attrName: "id" };
          } else if (lower === "category") {
            defaultMappings[h] = { selector: '[data-testid="guide-category"]', type: "text" };
          } else if (lower === "read time") {
            defaultMappings[h] = { selector: '[data-testid="guide-read-time"]', type: "text" };
          } else if (lower === "guide title") {
            defaultMappings[h] = { selector: '[data-testid="guide-title"]', type: "text" };
          } else if (lower === "summary overview") {
            defaultMappings[h] = { selector: '[data-testid="guide-summary"]', type: "text" };
          } else if (lower.includes("image") || lower.includes("photo") || lower.includes("pic") || lower.includes("thumb") || lower.includes("src")) {
            defaultMappings[h] = { selector: "img", type: "attr", attrName: "src" };
          } else if (lower.includes("link") || lower.includes("url") || lower.includes("href") || lower.includes("website")) {
            defaultMappings[h] = { selector: "a", type: "attr", attrName: "href" };
          } else if (lower.includes("title") || lower.includes("name")) {
            defaultMappings[h] = { selector: "h1, h2, h3, .title, .name", type: "text" };
          } else if (lower.includes("price")) {
            defaultMappings[h] = { selector: ".price", type: "text" };
          } else if (lower.includes("desc") || lower.includes("detail") || lower.includes("body")) {
            defaultMappings[h] = { selector: "p, .description, .detail", type: "text" };
          } else {
            defaultMappings[h] = { selector: "", type: "text" };
          }
        });
        setMappings(defaultMappings);
        setSuccess(`Successfully parsed ${res.headers.length} columns from Excel template!`);
      } catch (err: any) {
        setError(err.message || "Failed to read Excel headers. Make sure it is a valid .xlsx file.");
        setHeaders([]);
        setXlsxFile(null);
        setXlsxBase64(null);
      } finally {
        setLoadingHeaders(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleMappingChange = (header: string, field: keyof CustomCrawlMapping, value: string) => {
    setMappings((prev) => ({
      ...prev,
      [header]: {
        ...prev[header],
        [field]: value,
      },
    }));
  };

  // Poll Job Status
  const startPolling = useCallback((jobId: string) => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
    }

    const poll = async () => {
      try {
        const status = await getCustomCrawlJobStatus(jobId);
        setJobStatus(status);

        if (status.status === "completed" || status.status === "failed") {
          if (pollingTimerRef.current) {
            clearInterval(pollingTimerRef.current);
            pollingTimerRef.current = null;
          }
        }
      } catch (err: any) {
        console.error("Failed to poll status:", err);
        setError(`Failed to fetch crawler status: ${err.message}`);
        if (pollingTimerRef.current) {
          clearInterval(pollingTimerRef.current);
          pollingTimerRef.current = null;
        }
      }
    };

    pollingTimerRef.current = setInterval(poll, 800);
    poll(); // run immediately
  }, []);

  const handleStartCrawl = async () => {
    if (!webpageUrl.trim()) {
      setError("Webpage URL is required.");
      return;
    }
    if (!xlsxBase64) {
      setError("Excel template file is required.");
      return;
    }
    
    // Check if mappings are incomplete
    const incomplete = Object.entries(mappings).some(([h, m]) => !m.selector.trim());
    if (incomplete) {
      setError("Please configure a CSS Selector for all mapped columns.");
      return;
    }

    setStartingCrawl(true);
    setError(null);
    setSuccess(null);
    setJobStatus(null);

    try {
      const res = await startCustomCrawlJob({
        url: webpageUrl.trim(),
        crawlOption,
        maxPages,
        containerSelector: containerSelector.trim() || undefined,
        mappings,
        xlsxBase64,
      });

      setActiveJobId(res.jobId);
      startPolling(res.jobId);
    } catch (err: any) {
      setError(err.message || "Failed to initiate crawl job.");
    } finally {
      setStartingCrawl(false);
    }
  };

  const handleReset = () => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    setActiveJobId(null);
    setJobStatus(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 space-y-8 pb-16"
    >
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-6 transition-colors">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Home
            </Link>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
            Custom Crawling & Data Extraction
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Upload an Excel template, map columns to webpage selectors, and extract structured datasets and images in bulk.
          </p>
        </div>

        {activeJobId && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm transition-all duration-200 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            New Crawl
          </button>
        )}
      </div>

      {/* Global Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 flex gap-3 text-sm text-red-600 dark:text-red-400"
          >
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <h4 className="font-bold">Error Encountered</h4>
              <p className="mt-0.5">{error}</p>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 flex gap-3 text-sm text-emerald-600 dark:text-emerald-400"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <div>
              <h4 className="font-bold">Success</h4>
              <p className="mt-0.5">{success}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!activeJobId ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings Column */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-6 shadow-md shadow-slate-100/50 dark:shadow-none backdrop-blur-xl space-y-5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
                <Settings className="h-4 w-4 text-blue-500" />
                Crawl Configuration
              </h3>

              {/* URL Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  Starting URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Link2 className="h-4 w-4" />
                  </div>
                  <input
                    type="url"
                    value={webpageUrl}
                    onChange={(e) => setWebpageUrl(e.target.value)}
                    placeholder="https://example.com/products"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Template Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Excel Template File (.xlsx)
                </label>
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl p-4 bg-slate-50 dark:bg-slate-950 transition-colors relative cursor-pointer group text-center">
                  <input
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <FileSpreadsheet className={`h-8 w-8 ${xlsxFile ? "text-emerald-500 animate-bounce" : "text-slate-400 group-hover:text-blue-500"} transition-colors`} />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {xlsxFile ? xlsxFile.name : "Select or Drop Template"}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      We will extract row-1 headers to build mapper mappings.
                    </p>
                  </div>
                </div>
              </div>

              {/* Container Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  Item Container Selector (Optional)
                  <span className="text-[10px] text-slate-400 font-normal hover:text-slate-600" title="CSS Selector matching each card / item. Leave empty if there is only 1 item per page.">
                    <HelpCircle className="h-3 w-3 inline" />
                  </span>
                </label>
                <input
                  type="text"
                  value={containerSelector}
                  onChange={(e) => setContainerSelector(e.target.value)}
                  placeholder="e.g. .product-card"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* Max Pages */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Max Pages to Crawl
                </label>
                <select
                  value={maxPages}
                  onChange={(e) => setMaxPages(parseInt(e.target.value))}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value={1}>1 page (Single page scan)</option>
                  <option value={5}>5 pages</option>
                  <option value={10}>10 pages</option>
                  <option value={20}>20 pages</option>
                </select>
              </div>

              {/* Crawl Mode Options */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Crawling Option
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCrawlOption("data")}
                    className={`px-3 py-2 rounded-xl border font-semibold text-xs transition-all cursor-pointer ${
                      crawlOption === "data"
                        ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-950"
                    }`}
                  >
                    Data Crawling
                  </button>
                  <button
                    type="button"
                    onClick={() => setCrawlOption("data-and-images")}
                    className={`px-3 py-2 rounded-xl border font-semibold text-xs transition-all cursor-pointer ${
                      crawlOption === "data-and-images"
                        ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-950"
                    }`}
                  >
                    Data & Images
                  </button>
                </div>
              </div>

              {/* Start Button */}
              <button
                onClick={handleStartCrawl}
                disabled={startingCrawl || loadingHeaders || headers.length === 0}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {startingCrawl ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4" />
                    Start Crawling
                  </>
                )}
              </button>
            </div>

            {/* Sandbox Testing Guide Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-purple-50/50 dark:from-blue-950/25 dark:via-indigo-950/15 dark:to-purple-950/25 p-6 shadow-md backdrop-blur-xl space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-2">
                <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />
                Quick Test Sandbox
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Don't have a template? Test this feature instantly using our pre-built Excel template on the website's own guides/documentation list!
              </p>
              
              <div className="space-y-3 pt-1">
                {/* Step 1: Download Template */}
                <a
                  href="/custom_crawl_template.xlsx"
                  download
                  className="flex items-center justify-between w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all group"
                >
                  <span className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 text-[10px]">1</span>
                    Download Excel Template
                  </span>
                  <Download className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-500 group-hover:scale-110 transition-all" />
                </a>

                {/* Step 2: Auto-Load Sandbox Config */}
                <button
                  type="button"
                  onClick={loadSandboxConfig}
                  className="flex items-center justify-between w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 text-[10px]">2</span>
                    Load Sandbox Settings
                  </span>
                  <Link2 className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-500 group-hover:rotate-45 transition-all" />
                </button>
              </div>

              <div className="rounded-lg bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 dark:border-blue-500/20 p-3 text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                💡 <strong>How to test:</strong> Click button (2) above to auto-configure settings. Then upload the downloaded Excel template. The selectors map automatically. Hit <strong>Start Crawling</strong>!
              </div>
            </div>
          </div>

          {/* Mapper Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-6 shadow-md shadow-slate-100/50 dark:shadow-none backdrop-blur-xl min-h-[400px] flex flex-col">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3 mb-5">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                Column CSS Selector Mapping
              </h3>

              {loadingHeaders ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10 space-y-3">
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    Parsing Excel column headers...
                  </p>
                </div>
              ) : headers.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10 text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-slate-400">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <div className="max-w-md">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">No columns mapped</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Upload an Excel template containing column headers in the first row. We will automatically load the fields for customization.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 flex-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 bg-blue-500/5 border border-blue-500/10 p-3 rounded-xl">
                    ℹ️ For each column extracted from your spreadsheet, enter the CSS selector. Choose whether to grab the inner text or an attribute value (like <code>src</code> or <code>href</code>).
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
                    {headers.map((header) => {
                      const mapping = mappings[header] || { selector: "", type: "text" };
                      return (
                        <div
                          key={header}
                          className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-slate-200 dark:hover:border-slate-700/80 transition-colors space-y-3"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[200px]" title={header}>
                              {header}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-slate-400 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-md">
                              Column
                            </span>
                          </div>

                          {/* Selector Input */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500">CSS Selector</label>
                            <input
                              type="text"
                              value={mapping.selector}
                              onChange={(e) => handleMappingChange(header, "selector", e.target.value)}
                              placeholder="e.g. .title, img, a"
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none text-xs"
                            />
                          </div>

                          {/* Extract Type */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500">Type</label>
                              <select
                                value={mapping.type}
                                onChange={(e) => handleMappingChange(header, "type", e.target.value as "text" | "attr")}
                                className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-xs focus:outline-none"
                              >
                                <option value="text">Inner Text</option>
                                <option value="attr">Attribute</option>
                              </select>
                            </div>

                            {mapping.type === "attr" && (
                              <div>
                                <label className="text-[10px] font-bold text-slate-500">Attr Name</label>
                                <input
                                  type="text"
                                  value={mapping.attrName || ""}
                                  onChange={(e) => handleMappingChange(header, "attrName", e.target.value)}
                                  placeholder="e.g. src, href, title"
                                  className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-xs focus:outline-none"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Crawling Execution Progress and Results */
        <div className="space-y-8">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Job ID: {activeJobId.slice(0, 8)}...
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
                  {jobStatus?.status === "running" && <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />}
                  {jobStatus?.status === "completed" && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                  {jobStatus?.status === "failed" && <XCircle className="h-5 w-5 text-red-500" />}
                  Custom Crawl Status: <span className="capitalize text-blue-600 dark:text-blue-400">{jobStatus?.status || "pending"}</span>
                </h3>
              </div>

              {jobStatus?.status === "completed" && (
                <div className="flex gap-2">
                  <a
                    href={getCustomCrawlExcelDownloadUrl(activeJobId)}
                    download
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm hover:scale-[1.02] transition-transform cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Excel
                  </a>
                  {crawlOption === "data-and-images" && (
                    <a
                      href={getCustomCrawlZipDownloadUrl(activeJobId)}
                      download
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm hover:scale-[1.02] transition-transform cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download ZIP (Excel + Photos)
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Progress Details */}
            {jobStatus && (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Crawling Progress</span>
                  <span>{jobStatus.progress.percent}% ({jobStatus.progress.current} / {jobStatus.progress.total} pages)</span>
                </div>

                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${jobStatus.progress.percent}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                {jobStatus.progress.currentUrl && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-2xl bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Active URL:</span> {jobStatus.progress.currentUrl}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Table Preview */}
          {jobStatus && jobStatus.data && jobStatus.data.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-xl space-y-4 overflow-hidden"
            >
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-500" />
                Live Extracted Dataset Preview ({jobStatus.data.length} records)
              </h3>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl max-h-[400px]">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold uppercase border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-800">SL</th>
                      <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-800">Page URL</th>
                      {jobStatus.headers.map((h) => {
                        if (h === "Page URL") return null;
                        return (
                          <th key={h} className="px-4 py-3 border-r border-slate-200 dark:border-slate-800">
                            {h}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
                    {jobStatus.data.map((row, idx) => (
                      <tr
                        key={idx}
                        className={`${
                          idx % 2 === 1 ? "bg-slate-50/40 dark:bg-slate-950/20" : "bg-transparent"
                        } hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors`}
                      >
                        <td className="px-4 py-3 font-semibold text-slate-400 border-r border-slate-150 dark:border-slate-850">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3 truncate max-w-[200px] border-r border-slate-150 dark:border-slate-850" title={row["Page URL"]}>
                          {row["Page URL"]}
                        </td>
                        {jobStatus.headers.map((h) => {
                          if (h === "Page URL") return null;
                          const cellVal = row[h];
                          
                          // Handle preview for links or images
                          const isImg = h.toLowerCase().includes("image") || h.toLowerCase().includes("photo") || (mappings[h] && mappings[h].type === "attr" && mappings[h].attrName === "src");
                          const isUrl = cellVal && typeof cellVal === "string" && cellVal.startsWith("http");

                          return (
                            <td key={h} className="px-4 py-3 border-r border-slate-150 dark:border-slate-850">
                              {isImg && isUrl ? (
                                <div className="flex items-center gap-2 max-w-[250px]">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={cellVal}
                                    alt="Preview"
                                    className="h-8 w-8 object-cover rounded-lg border border-slate-250 dark:border-slate-750"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = "none";
                                    }}
                                  />
                                  <span className="truncate" title={cellVal}>{cellVal}</span>
                                </div>
                              ) : isUrl ? (
                                <a
                                  href={cellVal}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline truncate block max-w-[250px]"
                                  title={cellVal}
                                >
                                  {cellVal}
                                </a>
                              ) : (
                                <span className="block max-w-[250px] truncate" title={cellVal !== undefined ? String(cellVal) : ""}>
                                  {cellVal !== undefined ? String(cellVal) : ""}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}
