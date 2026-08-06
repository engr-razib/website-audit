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
  ChevronDown,
  Crosshair,
  X as XIcon,
  Plus,
  Trash2,
  Upload,
  Compass
} from "lucide-react";
import {
  parseExcelHeaders,
  startCustomCrawlJob,
  getCustomCrawlJobStatus,
  getCustomCrawlExcelDownloadUrl,
  getCustomCrawlZipDownloadUrl,
  getCustomCrawlSampleTemplateUrl,
  CustomCrawlMapping,
  CustomCrawlJobStatus,
  API_BASE
} from "@/lib/api";

export default function CustomCrawlerPage() {
  // Input fields state
  const [urlsText, setUrlsText] = useState(""); // textarea: one URL per line
  const [crawlOption, setCrawlOption] = useState<"data" | "data-and-images">("data");
  
  // Dynamic columns builder state
  const [columns, setColumns] = useState<Array<{ name: string; selector: string; type: "text" | "attr"; attrName?: string; domainOverrides?: Record<string, string> }>>([
    { name: "Product Name", selector: "", type: "text" },
    { name: "Price", selector: "", type: "text" },
    { name: "Image URL", selector: "", type: "attr", attrName: "src" }
  ]);
  const [newColumnInput, setNewColumnInput] = useState("");
  
  // App state
  const [startingCrawl, setStartingCrawl] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<CustomCrawlJobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Visual selector picker states
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [activePickerColIndex, setActivePickerColIndex] = useState<number | null>(null);
  const [previewUrlIndex, setPreviewUrlIndex] = useState(0);

  // Uploaded XLSX & Data Appending State
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedDataset, setUploadedDataset] = useState<Record<string, any>[] | null>(null);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [invalidColumnIndices, setInvalidColumnIndices] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize picker mode (mapping vs browse mode) with iframe window
  useEffect(() => {
    if (isPickerOpen && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'SET_PICKER_MODE',
        active: activePickerColIndex !== null
      }, '*');
    }
  }, [activePickerColIndex, isPickerOpen]);

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError("Please upload a valid Excel file (.xlsx)");
      return;
    }

    setIsParsingExcel(true);
    setError(null);
    setSuccess(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      const len = bytes.byteLength;
      const chunk = 8192;
      for (let i = 0; i < len; i += chunk) {
        const slice = bytes.subarray(i, Math.min(i + chunk, len));
        binary += String.fromCharCode.apply(null, Array.from(slice));
      }
      const base64 = btoa(binary);

      const parsedPkg = await parseExcelHeaders(base64);
      setUploadedFileName(file.name);

      if (parsedPkg.existingData && parsedPkg.existingData.length > 0) {
        setUploadedDataset(parsedPkg.existingData);
      } else {
        setUploadedDataset(null);
      }

      // Extract 1st row as columns list and map related rules from XLSX file
      if (parsedPkg.headers && parsedPkg.headers.length > 0) {
        const cleanHeaders = parsedPkg.headers.filter(h => h !== "Page URL" && !h.endsWith("(Local Path)"));
        
        const newCols = cleanHeaders.map(headerName => {
          const rule = parsedPkg.mappings?.[headerName];
          const isImg = headerName.toLowerCase().includes("image") || headerName.toLowerCase().includes("photo");
          
          return {
            name: headerName,
            selector: rule?.selector || "",
            type: (rule?.type || (isImg ? "attr" : "text")) as "text" | "attr",
            attrName: rule?.attrName || (isImg ? "src" : undefined),
            domainOverrides: rule?.domainOverrides
          };
        });

        if (newCols.length > 0) {
          setColumns(newCols);
        }

        if (parsedPkg.savedUrls && parsedPkg.savedUrls.length > 0) {
          setUrlsText(parsedPkg.savedUrls.join("\n"));
        }

        const dataMsg = parsedPkg.existingData && parsedPkg.existingData.length > 0 
          ? ` plus ${parsedPkg.existingData.length} existing dataset rows ready to append!` 
          : ".";
        
        const rulesCount = newCols.filter(c => c.selector).length;
        const rulesMsg = rulesCount > 0 ? ` and restored ${rulesCount} selector rules` : "";

        setSuccess(`Uploaded "${file.name}": Extracted ${newCols.length} columns from 1st row${rulesMsg}${dataMsg}`);
      }
    } catch (err: any) {
      setError(`Failed to parse uploaded Excel file: ${err.message}`);
    } finally {
      setIsParsingExcel(false);
      if (e.target) e.target.value = "";
    }
  };

  // Dispatch active status to topbar connections
  useEffect(() => {
    const isJobActive = startingCrawl || (jobStatus !== null && (jobStatus.status === "running" || jobStatus.status === "pending"));
    window.dispatchEvent(new CustomEvent('app-activity-status', { detail: { active: isJobActive } }));
    return () => {
      window.dispatchEvent(new CustomEvent('app-activity-status', { detail: { active: false } }));
    };
  }, [startingCrawl, jobStatus]);

  // Parse textarea lines into a clean URL array
  const getParsedUrls = () =>
    urlsText
      .split("\n")
      .map(l => l.trim())
      .filter(l => l.startsWith("http"));

  // Helper to extract unique domains from starting URLs
  const getUniqueDomains = () => {
    const urls = getParsedUrls();
    const domains = urls.map(url => {
      try {
        const hostname = new URL(url).hostname;
        return hostname.replace(/^www\./i, "");
      } catch (e) {
        return "";
      }
    }).filter(Boolean);
    return Array.from(new Set(domains));
  };

  // Clean up polling timer on unmount
  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
    };
  }, []);

  // Listen for selector picked from the visual picker iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'SELECTOR_PICKED' && isPickerOpen && activePickerColIndex !== null) {
        const { selector, tagName, attrHint } = e.data;
        
        let activeDomain = "";
        try {
          const previewUrl = getParsedUrls()[previewUrlIndex];
          if (previewUrl) {
            activeDomain = new URL(previewUrl).hostname.replace(/^www\./i, "");
          }
        } catch (err) {}

        const uniqueDomains = getUniqueDomains();
        const hasMultipleDomains = uniqueDomains.length > 1;

        // Update mapped selector for current active column
        setColumns(prev => prev.map((col, idx) => {
          if (idx === activePickerColIndex) {
            const updatedCol = { ...col };
            
            if (attrHint && attrHint !== 'text') {
              updatedCol.type = 'attr';
              updatedCol.attrName = attrHint;
            } else {
              updatedCol.type = 'text';
            }

            if (hasMultipleDomains && activeDomain) {
              const overrides = { ...(col.domainOverrides || {}) };
              overrides[activeDomain] = selector;
              updatedCol.domainOverrides = overrides;
              // Set default selector too if it is currently empty
              if (!col.selector) {
                updatedCol.selector = selector;
              }
            } else {
              updatedCol.selector = selector;
            }
            return updatedCol;
          }
          return col;
        }));

        // Auto-advance to the next column in sequence that needs mapping
        setActivePickerColIndex(prevIdx => {
          if (prevIdx === null) return null;
          const nextIdx = prevIdx + 1;
          return nextIdx < columns.length ? nextIdx : null;
        });
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [isPickerOpen, activePickerColIndex, columns.length, previewUrlIndex, urlsText]);

  const loadSandboxConfig = () => {
    const guidesUrl = typeof window !== "undefined" 
      ? window.location.origin + "/guides/" 
      : "http://localhost:3001/guides/";
    setUrlsText(guidesUrl);
    setColumns([
      { name: "Guide ID", selector: '[data-testid="guide-card"]', type: "attr", attrName: "id" },
      { name: "Category", selector: '[data-testid="guide-category"]', type: "text" },
      { name: "Read Time", selector: '[data-testid="guide-read-time"]', type: "text" },
      { name: "Guide Title", selector: '[data-testid="guide-title"]', type: "text" },
      { name: "Summary Overview", selector: '[data-testid="guide-summary"]', type: "text" }
    ]);
    setSuccess("Sandbox demo configuration loaded! Open Visual Picker to inspect or Start Crawling.");
    setError(null);
  };



  // Add a new column to mapping configuration
  const handleAddColumn = (nameStr = "") => {
    const name = (nameStr || newColumnInput).trim();
    if (!name) return;
    if (columns.some(col => col.name.toLowerCase() === name.toLowerCase())) {
      setError(`Column "${name}" already exists.`);
      return;
    }
    setColumns(prev => [...prev, { name, selector: "", type: "text" }]);
    setNewColumnInput("");
    setError(null);
  };

  // Remove column mapping
  const handleRemoveColumn = (index: number) => {
    setColumns(prev => prev.filter((_, i) => i !== index));
  };

  // Update specific column configuration values
  const handleUpdateColumn = (index: number, field: string, value: any) => {
    setColumns(prev => prev.map((col, i) => i === index ? { ...col, [field]: value } : col));
    if (invalidColumnIndices.includes(index)) {
      setInvalidColumnIndices(prev => prev.filter(i => i !== index));
    }
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
    const urlList = getParsedUrls();
    if (urlList.length === 0) {
      setError("Please enter at least one valid URL (one per line, starting with http:// or https://).");
      return;
    }
    if (columns.length === 0) {
      setError("Please define at least one column to extract.");
      return;
    }

    // Check for invalid columns (empty column name or empty selector)
    const invalidIndices: number[] = [];
    columns.forEach((col, idx) => {
      if (!col.name.trim() || !col.selector.trim()) {
        invalidIndices.push(idx);
      }
    });

    if (invalidIndices.length > 0) {
      setInvalidColumnIndices(invalidIndices);
      setError(`Please ensure all columns have both a Column Name and a CSS selector. Invalid columns are highlighted in red below.`);
      return;
    }
    setInvalidColumnIndices([]);

    setStartingCrawl(true);
    setError(null);
    setSuccess(null);
    setJobStatus(null);

    // Build mappings object from UI columns
    const mappings: Record<string, CustomCrawlMapping> = {};
    columns.forEach(col => {
      mappings[col.name.trim()] = {
        selector: col.selector.trim(),
        type: col.type,
        attrName: col.attrName ? col.attrName.trim() : undefined,
        domainOverrides: col.domainOverrides
      };
    });

    try {
      const res = await startCustomCrawlJob({
        urls: urlList,
        crawlOption,
        maxPages: 1, // Crawl only the exact given URLs
        mappings,
        existingData: uploadedDataset || undefined
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
    setUploadedFileName(null);
    setUploadedDataset(null);
  };

  return (
    <>
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

              {/* Excel Template & Data Upload Box */}
              <div className="space-y-2 p-3.5 rounded-xl border border-dashed border-blue-500/30 bg-blue-50/30 dark:bg-blue-950/20">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                    Upload Excel (.xlsx)
                  </label>
                  {uploadedFileName && (
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFileName(null);
                        setUploadedDataset(null);
                      }}
                      className="text-[10px] font-semibold text-red-500 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <XIcon className="h-3 w-3" /> Clear
                    </button>
                  )}
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleExcelUpload}
                  className="hidden"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isParsingExcel}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm truncate"
                  >
                    {isParsingExcel ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                        <span>Parsing...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span className="truncate">{uploadedFileName ? `Loaded: ${uploadedFileName}` : "Upload XLSX"}</span>
                      </>
                    )}
                  </button>

                  <a
                    href={getCustomCrawlSampleTemplateUrl()}
                    download="sample_custom_crawl_template.xlsx"
                    className="w-full py-2 px-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-semibold text-emerald-700 dark:text-emerald-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm truncate"
                    title="Download sample XLSX file with Crawled Data, Crawl Rules, and Demo URLs"
                  >
                    <Download className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="truncate">Sample Template</span>
                  </a>
                </div>

                {uploadedDataset && (
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-md">
                    <span>📌</span>
                    <span>{uploadedDataset.length} existing row(s) loaded. Next crawl results will append!</span>
                  </div>
                )}
                
                <p className="text-[10px] text-slate-400 leading-tight">
                  Upload an XLSX file to auto-populate column selector rules and append new crawl data.
                </p>
              </div>

              {/* Multi-URL Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5" />
                  Starting URLs
                  {getParsedUrls().length > 0 && (
                    <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      {getParsedUrls().length} URL{getParsedUrls().length !== 1 ? 's' : ''}
                    </span>
                  )}
                </label>
                <textarea
                  value={urlsText}
                  onChange={(e) => setUrlsText(e.target.value)}
                  rows={5}
                  spellCheck={false}
                  placeholder={`https://example.com/product-1\nhttps://example.com/product-2\nhttps://example.com/product-3`}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono resize-y leading-relaxed"
                />
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span>💡</span>
                  <span>One URL per line. Each line is crawled separately and all results are merged into one sheet.</span>
                </p>
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
                disabled={startingCrawl || columns.length === 0 || getParsedUrls().length === 0}
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
                Test the crawler instantly by loading the sandbox configuration on the website's own guides/documentation list page!
              </p>
              
              <div className="space-y-3 pt-1">
                {/* Auto-Load Sandbox Config */}
                <button
                  type="button"
                  onClick={loadSandboxConfig}
                  className="flex items-center justify-between w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 text-[10px]">✨</span>
                    Load Sandbox Settings
                  </span>
                  <Link2 className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-500 group-hover:rotate-45 transition-all" />
                </button>
              </div>

              <div className="rounded-lg bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 dark:border-blue-500/20 p-3 text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                💡 <strong>How it works:</strong> Click "Load Sandbox Settings" to populate demo URLs and columns. Open the visual picker or hit <strong>Start Crawling</strong>!
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

              <div className="space-y-6 flex-1 flex flex-col">
                {/* Column Add / Preset Controls */}
                <div className="flex flex-col sm:flex-row gap-3 items-end bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Add Custom Column</label>
                    <input
                      type="text"
                      value={newColumnInput}
                      onChange={(e) => setNewColumnInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddColumn(); } }}
                      placeholder="e.g. Discount Price"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddColumn()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Column
                  </button>
                </div>

                {/* Main Visual Picker Button Trigger */}
                {getParsedUrls().length > 0 && columns.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setActivePickerColIndex(0);
                      setIsPickerOpen(true);
                    }}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <Crosshair className="h-4 w-4 text-white animate-pulse" />
                    Open Visual Selector Picker
                  </button>
                )}

                {columns.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-10 text-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-slate-400">
                      <FileSpreadsheet className="h-6 w-6" />
                    </div>
                    <div className="max-w-md">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">No Columns Defined</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Use the form above to add custom extraction columns or load the Quick Test Sandbox settings.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 flex-1">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 bg-blue-500/5 border border-blue-500/10 p-3 rounded-xl flex items-center gap-2">
                      <span>🎯</span>
                      <span>Enter selectors manually below, or click <strong>Open Visual Selector Picker</strong> to click-to-map visually.</span>
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
                      {columns.map((col, idx) => {
                        const isInvalid = invalidColumnIndices.includes(idx) || (error !== null && (!col.name.trim() || !col.selector.trim()));
                        return (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border transition-all space-y-3 relative group ${
                            isInvalid
                              ? "border-red-500/80 bg-red-500/5 ring-2 ring-red-500/30 shadow-md shadow-red-500/10 dark:border-red-500 dark:bg-red-950/20"
                              : "border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 hover:border-slate-200 dark:hover:border-slate-800"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5">
                              {/* Editable Column Name */}
                              <input
                                type="text"
                                value={col.name}
                                onChange={(e) => handleUpdateColumn(idx, "name", e.target.value)}
                                className={`text-xs font-bold bg-transparent border-b hover:border-slate-300 focus:border-blue-500 focus:outline-none w-[150px] ${
                                  !col.name.trim() ? "border-red-400 text-red-500 placeholder-red-400 font-bold" : "text-slate-900 dark:text-white border-transparent"
                                }`}
                                placeholder="Column Name (Required)"
                              />
                              {isInvalid && (
                                <span className="text-[9px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 shrink-0">
                                  ⚠️ Incomplete
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {/* Individual visual picker shortcut */}
                              {getParsedUrls().length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActivePickerColIndex(idx);
                                    setIsPickerOpen(true);
                                  }}
                                  title="Visually pick selector for this column"
                                  className="p-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 cursor-pointer"
                                >
                                  <Crosshair className="h-3 w-3" />
                                </button>
                              )}
                              {/* Delete column button */}
                              <button
                                type="button"
                                onClick={() => handleRemoveColumn(idx)}
                                title="Remove Column"
                                className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 cursor-pointer"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          {/* Selector Input */}
                          {/* Selector Input */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Default CSS Selector</label>
                            <input
                              type="text"
                              value={col.selector}
                              onChange={(e) => handleUpdateColumn(idx, "selector", e.target.value)}
                              placeholder="e.g. .product-title, img, a"
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none text-xs"
                            />
                          </div>

                          {/* Domain Specific Overrides */}
                          {getUniqueDomains().length > 1 && (
                            <div className="mt-2 p-2.5 rounded-lg bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 space-y-2">
                              <label className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">Domain Specific Overrides</label>
                              {getUniqueDomains().map(dom => (
                                <div key={dom} className="flex items-center gap-2 text-[10px]">
                                  <span className="font-mono text-slate-500 truncate w-24" title={dom}>{dom}:</span>
                                  <input
                                    type="text"
                                    value={col.domainOverrides?.[dom] || ""}
                                    onChange={(e) => {
                                      const overrides = { ...(col.domainOverrides || {}) };
                                      overrides[dom] = e.target.value;
                                      handleUpdateColumn(idx, "domainOverrides", overrides);
                                    }}
                                    placeholder="Use default"
                                    className="flex-1 px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] text-slate-850 dark:text-white focus:outline-none font-mono"
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Extract Type */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Type</label>
                              <select
                                value={col.type}
                                onChange={(e) => handleUpdateColumn(idx, "type", e.target.value as "text" | "attr")}
                                className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-xs focus:outline-none"
                              >
                                <option value="text">Inner Text</option>
                                <option value="attr">Attribute</option>
                              </select>
                            </div>

                            {col.type === "attr" && (
                              <div>
                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Attr Name</label>
                                <input
                                  type="text"
                                  value={col.attrName || ""}
                                  onChange={(e) => handleUpdateColumn(idx, "attrName", e.target.value)}
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
                          const matchingCol = columns.find(c => c.name === h);
                          const isImg = h.toLowerCase().includes("image") || h.toLowerCase().includes("photo") || (matchingCol && matchingCol.type === "attr" && matchingCol.attrName === "src");
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

    {/* ── Visual Selector Picker Modal ───────────────────────────── */}
    <AnimatePresence>
      {isPickerOpen && getParsedUrls().length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col md:flex-row"
          style={{ background: 'rgba(2,8,23,0.96)' }}
        >
          {/* Main Web Page Preview Area */}
          <div className="flex-1 flex flex-col h-full border-r border-slate-800">
            {/* Modal header bar */}
            <div className="flex items-center gap-3 px-5 py-3 bg-slate-950 border-b border-slate-800 shrink-0">
              <Crosshair className="h-5 w-5 text-indigo-400 animate-pulse" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Visual Selector Picker</p>
                {getUniqueDomains().length > 1 ? (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400">Preview Site:</span>
                    <select
                      value={previewUrlIndex}
                      onChange={(e) => setPreviewUrlIndex(parseInt(e.target.value))}
                      className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    >
                      {getParsedUrls().map((url, idx) => (
                        <option key={idx} value={idx}>{url}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="text-xs text-slate-300 truncate font-mono">
                    {getParsedUrls()[0]}
                  </p>
                )}
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                Hover elements in the preview and click to select
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPickerOpen(false);
                  setActivePickerColIndex(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition-all cursor-pointer shrink-0"
              >
                Done & Apply
              </button>
            </div>

            {/* Iframe Pre-loader / Preview Container */}
            <div className="flex-1 relative bg-white">
              <iframe
                ref={iframeRef}
                src={`${API_BASE}/custom-crawler/preview?url=${encodeURIComponent(getParsedUrls()[previewUrlIndex] || getParsedUrls()[0])}`}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin"
                title="Visual Selector Picker"
                onLoad={() => {
                  if (iframeRef.current?.contentWindow) {
                    iframeRef.current.contentWindow.postMessage({
                      type: 'SET_PICKER_MODE',
                      active: activePickerColIndex !== null
                    }, '*');
                  }
                }}
              />
            </div>
          </div>

          {/* Sidebar - Column Mapper & Visual Feedback */}
          <div className="w-full md:w-80 bg-slate-900 border-t md:border-t-0 border-slate-800 flex flex-col h-[300px] md:h-full shrink-0">
            <div className="p-4 border-b border-slate-850 shrink-0">
              <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Settings className="h-4 w-4 text-indigo-400" />
                Columns Map Helper
              </h4>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                Click a column below to activate mapping, or select <strong>Browse / Data Explore</strong> to interact with page links and tabs.
              </p>
            </div>

            {/* Mode & Deselect Banner */}
            <div className="p-3 bg-slate-950/80 border-b border-slate-850 shrink-0 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Mode:</span>
                {activePickerColIndex !== null ? (
                  <button
                    type="button"
                    onClick={() => setActivePickerColIndex(null)}
                    className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/30 text-[10px] font-bold transition-all cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                    Mapping #{activePickerColIndex + 1} (Click to Deselect)
                  </button>
                ) : (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Page Browse Active
                  </span>
                )}
              </div>

              {/* Dedicated Browse Mode Button */}
              <button
                type="button"
                onClick={() => setActivePickerColIndex(null)}
                className={`w-full p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  activePickerColIndex === null
                    ? "border-emerald-500/50 bg-emerald-500/10 shadow-sm shadow-emerald-500/10"
                    : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`p-1.5 rounded-lg ${activePickerColIndex === null ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"}`}>
                    <Compass className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">Browse / Data Explore Mode</p>
                    <p className="text-[9px] text-slate-400 truncate">Deselect columns & click page tabs/links</p>
                  </div>
                </div>
                {activePickerColIndex === null && (
                  <span className="text-[9px] font-extrabold uppercase text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30 shrink-0">
                    Active
                  </span>
                )}
              </button>
            </div>

            {/* Columns List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {columns.map((col, idx) => {
                const isActive = idx === activePickerColIndex;
                const uniqueDomains = getUniqueDomains();
                const hasMultipleDomains = uniqueDomains.length > 1;
                
                let activeDomain = "";
                try {
                  const previewUrl = getParsedUrls()[previewUrlIndex];
                  if (previewUrl) {
                    activeDomain = new URL(previewUrl).hostname.replace(/^www\./i, "");
                  }
                } catch (e) {}

                const hasOverride = hasMultipleDomains && activeDomain && col.domainOverrides?.[activeDomain];
                
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (activePickerColIndex === idx) {
                        setActivePickerColIndex(null); // Deselect if already active
                      } else {
                        setActivePickerColIndex(idx);
                      }
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer relative group flex flex-col gap-1.5 ${
                      isActive
                        ? "border-indigo-500 bg-indigo-500/10 shadow-sm shadow-indigo-500/10"
                        : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white truncate max-w-[165px]">
                        {col.name || `Column ${idx + 1}`}
                      </span>
                      {isActive ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePickerColIndex(null);
                          }}
                          className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/20 hover:bg-indigo-500/30 px-2 py-0.5 rounded-md border border-indigo-500/30 transition-colors"
                          title="Click to deselect (Switch to Browse mode)"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
                          Target ✕
                        </button>
                      ) : hasOverride || (!hasMultipleDomains && col.selector) ? (
                        <span className="text-[9px] font-bold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/15">
                          Mapped
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold uppercase text-slate-500 bg-slate-850 px-2 py-0.5 rounded-md border border-slate-800">
                          Empty
                        </span>
                      )}
                    </div>

                    {hasMultipleDomains && activeDomain ? (
                      <div className="space-y-1">
                        <div className="text-[8px] text-slate-400 font-bold uppercase">
                          Override for {activeDomain}:
                        </div>
                        {col.domainOverrides?.[activeDomain] ? (
                          <div className="text-[10px] font-mono text-indigo-300 dark:text-indigo-400 truncate bg-slate-950 p-1.5 rounded-lg border border-slate-850">
                            {col.domainOverrides[activeDomain]}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-500 italic bg-slate-950/30 p-1.5 rounded border border-dashed border-slate-850">
                            Click webpage to map this site
                          </div>
                        )}
                        {col.selector && (
                          <div className="text-[8px] text-slate-500 truncate">
                            Default: {col.selector}
                          </div>
                        )}
                      </div>
                    ) : col.selector ? (
                      <div className="text-[10px] font-mono text-indigo-300 dark:text-indigo-400 truncate bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                        {col.selector}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 italic">
                        Click element on page to map
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add Column inside Picker */}
            <div className="p-4 border-t border-slate-850 bg-slate-950/40 shrink-0 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New column name..."
                  id="picker-new-col"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const target = e.currentTarget;
                      handleAddColumn(target.value);
                      target.value = "";
                    }
                  }}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("picker-new-col") as HTMLInputElement;
                    if (el && el.value.trim()) {
                      handleAddColumn(el.value);
                      el.value = "";
                    }
                  }}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
