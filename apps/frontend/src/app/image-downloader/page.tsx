"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Download, 
  FileSpreadsheet, 
  FolderOpen, 
  Image as ImageIcon, 
  Loader2, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Copy,
  Sparkles,
  Link2,
  Globe,
  Crosshair,
  Settings
} from "lucide-react";
import { 
  startImageDownloadJob, 
  getImageDownloadJobStatus, 
  openLocalFolder, 
  getZipDownloadUrl, 
  getImageExcelDownloadUrl,
  scanWebpageForImages,
  ImageDownloadJobStatus,
  ImageDownloadProgress,
  API_BASE
} from "@/lib/api";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

export default function ImageDownloaderPage() {
  const [inputText, setInputText] = useState("");
  const [detectedCount, setDetectedCount] = useState(0);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<ImageDownloadJobStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openingFolder, setOpeningFolder] = useState(false);
  const [folderOpenSuccess, setFolderOpenSuccess] = useState<string | null>(null);

  // New scanning states
  const [inputMethod, setInputMethod] = useState<"paste" | "scan">("paste");
  const [webpageUrl, setWebpageUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selector, setSelector] = useState("");
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Dispatch active status to topbar connections
  useEffect(() => {
    const isJobActive = loading || scanning || (jobStatus !== null && (jobStatus.status === "running" || jobStatus.status === "pending"));
    window.dispatchEvent(new CustomEvent('app-activity-status', { detail: { active: isJobActive } }));
    return () => {
      window.dispatchEvent(new CustomEvent('app-activity-status', { detail: { active: false } }));
    };
  }, [loading, scanning, jobStatus]);

  // Listen for selector picked from the visual picker iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'SELECTOR_PICKED' && isPickerOpen) {
        const { selector: pickedSelector } = e.data;
        setSelector(pickedSelector);
        setIsPickerOpen(false);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [isPickerOpen]);

  // Live URL counter
  useEffect(() => {
    if (!inputText.trim()) {
      setDetectedCount(0);
      return;
    }
    const matches = inputText.match(/(https?:\/\/[^\s"'>\)]+)/gi) || [];
    const validUrls = matches.filter(url => {
      let cleanUrl = url;
      if (/[.,;:?]$/.test(cleanUrl) && !cleanUrl.includes('?') && !cleanUrl.includes('=')) {
        cleanUrl = cleanUrl.slice(0, -1);
      }
      try {
        new URL(cleanUrl);
        return true;
      } catch {
        return false;
      }
    });
    setDetectedCount(validUrls.length);
  }, [inputText]);

  // Clean up polling timer on unmount
  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
    };
  }, []);

  // Poll Job Status
  const startPolling = useCallback((jobId: string) => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
    }

    const poll = async () => {
      try {
        const status = await getImageDownloadJobStatus(jobId);
        setJobStatus(status);

        if (status.status === "completed" || status.status === "failed") {
          if (pollingTimerRef.current) {
            clearInterval(pollingTimerRef.current);
            pollingTimerRef.current = null;
          }

          // Trigger automatic browser download for the ZIP file using location navigation (bypasses cross-origin click block)
          if (status.status === "completed") {
            const zipUrl = getZipDownloadUrl(jobId);
            window.location.href = zipUrl;
          }
        }
      } catch (err: any) {
        console.error("Failed to poll status:", err);
        setError(`Failed to fetch downloader status: ${err.message}`);
        if (pollingTimerRef.current) {
          clearInterval(pollingTimerRef.current);
          pollingTimerRef.current = null;
        }
      }
    };

    // Poll every 800ms for dynamic updates
    pollingTimerRef.current = setInterval(poll, 800);
    poll(); // run immediately
  }, []);

  const handleStartDownload = async () => {
    if (detectedCount === 0) return;
    setLoading(true);
    setError(null);
    setJobStatus(null);
    setFolderOpenSuccess(null);

    try {
      const res = await startImageDownloadJob(inputText);
      setActiveJobId(res.jobId);
      startPolling(res.jobId);
    } catch (err: any) {
      setError(err.message || "Failed to start image download job");
    } finally {
      setLoading(false);
    }
  };

  const handleScanWebpage = async () => {
    if (!webpageUrl.trim()) return;
    setScanning(true);
    setError(null);
    setScanSuccess(null);

    try {
      const res = await scanWebpageForImages(webpageUrl, selector);
      if (res.urls && res.urls.length > 0) {
        const urlsText = res.urls.join("\n");
        setInputText(urlsText);
        const successMsg = selector 
          ? `Successfully extracted ${res.urls.length} unique image URLs matching selector "${selector}"! Review them below or click Download Images.`
          : `Successfully extracted ${res.urls.length} unique image URLs from the page! Review them below or click Download Images.`;
        setScanSuccess(successMsg);
        setInputMethod("paste"); // Switch back so they can see/edit
      } else {
        setError("No images were found on the page. Try checking the URL or use a different site.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to extract images from website URL.");
    } finally {
      setScanning(false);
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
    setFolderOpenSuccess(null);
    setScanSuccess(null);
  };

  const formatSize = (bytes: number | null) => {
    if (bytes === null || bytes === undefined) return "N/A";
    if (bytes > 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    return `${(bytes / 1024).toFixed(2)} KB`;
  };

  // Pre-fill button examples for user
  const handleLoadSampleData = () => {
    const sample = `Hi Razib,
Here is a list of sample image URLs to test the batch image downloader:
1. Google logo: https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png
2. Git logo: https://git-scm.com/images/logos/downloads/Git-Icon-1788C.png
3. Unsplash beautiful picture: https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=500&auto=format&fit=crop&q=60
4. React logo: https://react.dev/images/og-home.png

This text contains both URLs and custom comments. The engine will auto-detect all 4 images.`;
    setInputText(sample);
  };

  const totalDownloadedSize = jobStatus?.details?.reduce((sum, d) => sum + (d.size || 0), 0) || 0;
  const successDownloads = jobStatus?.details?.filter(d => d.status === "completed").length || 0;
  const failedDownloads = jobStatus?.details?.filter(d => d.status === "failed").length || 0;

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
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-indigo-500" />
            Bulk Image Downloader
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Paste text containing multiple image URLs or enter a website URL. The tool will parse, download locally to a folder, and generate a ZIP archive with an Excel report.
          </p>
        </div>

        {activeJobId && (
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors self-start md:self-auto"
            title="Start new download batch"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            New Batch
          </button>
        )}
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-start gap-3 shadow-sm"
        >
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Execution Error</p>
            <p className="opacity-90">{error}</p>
          </div>
        </motion.div>
      )}

      {folderOpenSuccess && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-3 shadow-sm"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p className="font-medium">{folderOpenSuccess}</p>
        </motion.div>
      )}

      {/* Main Workflow Area */}
      <AnimatePresence mode="wait">
        {!activeJobId ? (
          <motion.div
            key="input-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Input card */}
            <div className="lg:col-span-2 rounded-3xl bg-white/70 dark:bg-slate-900/40 border border-slate-300 dark:border-slate-800/80 p-6 shadow-sm transition-colors backdrop-blur-xl space-y-4">
              
              {/* Tab Selector */}
              <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-300 dark:border-slate-800 transition-colors w-full sm:w-auto">
                <button
                  onClick={() => setInputMethod("paste")}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    inputMethod === "paste"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Paste Text &amp; Links
                </button>
                <button
                  onClick={() => setInputMethod("scan")}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    inputMethod === "scan"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" />
                  Scan Website URL
                </button>
              </div>

              {scanSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{scanSuccess}</span>
                </motion.div>
              )}

              {inputMethod === "paste" ? (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-indigo-500" />
                      Paste Content Containing Image URLs
                    </label>
                    
                    <button
                      onClick={handleLoadSampleData}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="h-3 w-3" />
                      Load Sample Data
                    </button>
                  </div>

                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste any text block, articles, HTML snippets, or raw lists of URLs here. The downloader will extract all links (e.g. http://example.com/image.jpg) automatically..."
                    rows={12}
                    className="w-full rounded-2xl border border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 p-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono resize-none text-slate-800 dark:text-slate-100"
                  />
                </div>
              ) : (
                <div className="space-y-4 py-2 animate-fadeIn">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Globe className="h-4 w-4 text-indigo-500" />
                      Scan Website for Images
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Enter a website URL to extract all standard and dynamically rendered images, including lazy-loaded pictures and computed background graphics.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch gap-3">
                    <input
                      type="url"
                      value={webpageUrl}
                      onChange={(e) => setWebpageUrl(e.target.value)}
                      placeholder="e.g. https://www.example.com/"
                      className="flex-1 rounded-xl border border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-800 dark:text-slate-100"
                    />
                    <button
                      onClick={handleScanWebpage}
                      disabled={scanning || !webpageUrl.trim()}
                      className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer ${
                        webpageUrl.trim() && !scanning
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg active:scale-98"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-300/35 dark:border-slate-700/35"
                      }`}
                    >
                      {scanning ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-white" />
                          Scanning DOM...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Extract Images
                        </>
                      )}
                    </button>
                  </div>

                  {/* Target Container Wrapper Selector (Visual Picker or Manual Input) */}
                  <div className="space-y-3 pt-2">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <span>Target Wrapper / Section (Optional)</span>
                      </label>
                      {webpageUrl.trim() && (
                        <button
                          type="button"
                          onClick={() => setIsPickerOpen(true)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold transition-all cursor-pointer border border-indigo-500/15"
                        >
                          <Crosshair className="h-3 w-3 animate-pulse" />
                          Visually Pick Wrapper Selector
                        </button>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={selector}
                        onChange={(e) => setSelector(e.target.value)}
                        placeholder="e.g. .gallery-container, #main-content, .product-images"
                        className="flex-1 rounded-xl border border-slate-350 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 transition-colors"
                      />
                      {selector && (
                        <button
                          type="button"
                          onClick={() => setSelector("")}
                          className="text-xs font-bold text-red-500 hover:underline cursor-pointer px-1"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {/* Selector presets */}
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] font-semibold text-slate-500">Presets:</span>
                      {['main', 'article', '.gallery', '#content'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setSelector(preset)}
                          className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-400 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {inputText && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        * There are currently <strong>{detectedCount}</strong> image URLs loaded in your active list. You can switch to the <strong>Paste Text &amp; Links</strong> tab above to view, modify, or add comments to them before downloading.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold transition-all ${
                    detectedCount > 0 
                      ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30" 
                      : "bg-slate-100 dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800"
                  }`}>
                    {detectedCount}
                  </span>
                  <span>URLs Detected</span>
                </div>

                <button
                  onClick={handleStartDownload}
                  disabled={detectedCount === 0 || loading}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer ${
                    detectedCount > 0 && !loading
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/25 active:scale-98"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-300/35 dark:border-slate-700/35"
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      Parsing...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download Images
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Instruction Card */}
            <div className="rounded-3xl bg-white/70 dark:bg-slate-900/40 border border-slate-300 dark:border-slate-800/80 p-6 shadow-sm transition-colors backdrop-blur-xl space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                How It Works
              </h3>
              
              <p>
                <strong>1. Choose input method:</strong> Paste raw text with links, OR enter a target website URL to scan and extract its images.
              </p>
              <p>
                <strong>2. Headless page scanning:</strong> When scanning a URL, the backend runs Playwright Chromium to load dynamic content and scripts, finding standard image nodes, lazy-loading links, and inline backgrounds.
              </p>
              <p>
                <strong>3. Review parsed images:</strong> Discovered images are loaded into your edit panel automatically so you can inspect them before running the batch queue.
              </p>
              <p>
                <strong>4. Automated Excel &amp; ZIP:</strong> Downloading files creates an outputs folder locally, generates an Excel report, and returns a single ZIP archive to the browser.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="status-dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Download Job Headers */}
            <div className="rounded-3xl bg-white/70 dark:bg-slate-900/40 border border-slate-300 dark:border-slate-800/80 p-6 shadow-sm transition-colors backdrop-blur-xl space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-mono">
                      Job: {activeJobId.slice(0, 8)}
                    </span>
                    <span className={`h-2.5 w-2.5 rounded-full ${
                      jobStatus?.status === 'completed'
                        ? 'bg-emerald-500 animate-pulse'
                        : jobStatus?.status === 'failed'
                        ? 'bg-red-500'
                        : 'bg-blue-500 animate-ping'
                    }`} />
                    <span className="text-sm font-semibold capitalize text-slate-700 dark:text-slate-300">
                      {jobStatus?.status || "Initializing..."}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Running batch download queue. Auto-saving in backend outputs directory.
                  </p>
                </div>

                {jobStatus?.status === "completed" && (
                  <div className="flex flex-wrap items-center gap-2.5">
                    <a
                      href={getZipDownloadUrl(activeJobId)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md hover:shadow-lg hover:shadow-blue-500/20 hover:scale-103 active:scale-98 transition-all"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download ZIP
                    </a>
                    
                    <a
                      href={getImageExcelDownloadUrl(activeJobId)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-950/20 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 font-bold text-xs hover:scale-103 active:scale-98 transition-all"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
                      Excel Report
                    </a>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {jobStatus?.progress && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <span>Downloading Assets...</span>
                    <span>
                      {jobStatus.progress.current} / {jobStatus.progress.total} Images ({jobStatus.progress.percent}%)
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-800/50">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: `${jobStatus.progress.percent}%` }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                  </div>
                  {jobStatus.progress.currentUrl && jobStatus.status === 'running' && (
                    <p className="text-[10px] text-slate-400 font-mono truncate max-w-full">
                      GET: {jobStatus.progress.currentUrl}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Metrics cards */}
            {jobStatus?.details && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/40 border border-slate-300 dark:border-slate-800/80 shadow-sm backdrop-blur-xl">
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total URLs</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {jobStatus.details.length}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/40 border border-slate-300 dark:border-slate-800/80 shadow-sm backdrop-blur-xl">
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Completed</div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                    {successDownloads}
                    {jobStatus.status === 'completed' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/40 border border-slate-300 dark:border-slate-800/80 shadow-sm backdrop-blur-xl">
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Failed</div>
                  <div className="text-2xl font-black text-red-600 dark:text-red-400 mt-1 flex items-center gap-1.5">
                    {failedDownloads}
                    {failedDownloads > 0 && <XCircle className="h-5 w-5 text-red-500" />}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/40 border border-slate-300 dark:border-slate-800/80 shadow-sm backdrop-blur-xl">
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Size</div>
                  <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                    {formatSize(totalDownloadedSize)}
                  </div>
                </div>
              </div>
            )}

            {/* List Details Table */}
            {jobStatus?.details && (
              <div className="rounded-3xl bg-white/70 dark:bg-slate-900/40 border border-slate-300 dark:border-slate-800/80 shadow-sm transition-colors backdrop-blur-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    Individual Download Queue
                  </h3>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded">
                    List Details
                  </span>
                </div>

                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/50 dark:bg-slate-900/20 text-slate-700 dark:text-slate-400 text-xs font-bold border-b border-slate-200 dark:border-slate-800">
                        <th className="py-3 px-4 w-12 text-center">SL</th>
                        <th className="py-3 px-4 w-20 text-center">Preview</th>
                        <th className="py-3 px-4">Original URL / File Name</th>
                        <th className="py-3 px-4 w-28 text-center">Size</th>
                        <th className="py-3 px-4 w-28 text-center">Time</th>
                        <th className="py-3 px-4 w-32 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                      {jobStatus.details.map((detail, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 text-xs text-slate-700 dark:text-slate-300 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-center text-slate-400">
                            {idx + 1}
                          </td>
                          
                          {/* Image Preview */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center">
                              {detail.status === 'completed' && detail.previewUrl ? (
                                <div className="h-10 w-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-slate-900/50 flex items-center justify-center group relative cursor-zoom-in">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={`http://localhost:3000${detail.previewUrl}`}
                                    alt="Preview"
                                    className="object-cover h-full w-full group-hover:scale-115 transition-transform duration-200"
                                  />
                                </div>
                              ) : detail.status === 'downloading' ? (
                                <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                              ) : (
                                <div className="h-10 w-10 rounded-lg border border-dashed border-slate-300 dark:border-slate-800 flex items-center justify-center text-slate-400">
                                  <ImageIcon className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Filename and Original URL */}
                          <td className="py-3.5 px-4 max-w-md truncate">
                            <div className="space-y-1">
                              {detail.filename ? (
                                <p className="font-bold text-slate-950 dark:text-white font-mono break-all truncate">
                                  {detail.filename}
                                </p>
                              ) : (
                                <p className="font-semibold text-slate-400 italic">
                                  Not generated yet
                                </p>
                              )}
                              <p className="text-[10px] text-slate-400 font-mono break-all truncate cursor-pointer hover:underline" title={detail.url}>
                                {detail.url}
                              </p>
                              {detail.error && (
                                <p className="text-[10px] text-red-500 flex items-center gap-1 font-medium bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 max-w-fit">
                                  <AlertCircle className="h-3 w-3 shrink-0" />
                                  {detail.error}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Size */}
                          <td className="py-3.5 px-4 text-center font-mono">
                            {formatSize(detail.size)}
                          </td>

                          {/* Time */}
                          <td className="py-3.5 px-4 text-center font-mono">
                            {detail.durationMs !== null ? `${detail.durationMs}ms` : 'N/A'}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                              detail.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                : detail.status === 'failed'
                                ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                                : detail.status === 'downloading'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                            }`}>
                              {detail.status === 'downloading' && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
                              {detail.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Visual Selector Picker Modal ───────────────────────────── */}
      <AnimatePresence>
        {isPickerOpen && webpageUrl.trim() && (
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
                  <p className="text-xs text-slate-300 truncate font-mono">
                    {webpageUrl}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                  Hover elements in the preview and click to select
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsPickerOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition-all cursor-pointer shrink-0"
                >
                  Done & Apply
                </button>
              </div>

              {/* Iframe Pre-loader / Preview Container */}
              <div className="flex-1 relative bg-white">
                <iframe
                  src={`${API_BASE}/custom-crawler/preview?url=${encodeURIComponent(webpageUrl)}`}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin"
                  title="Visual Selector Picker"
                />
              </div>
            </div>

            {/* Sidebar - Column Mapper & Visual Feedback */}
            <div className="w-full md:w-80 bg-slate-900 border-t md:border-t-0 border-slate-800 flex flex-col h-[300px] md:h-full shrink-0">
              <div className="p-4 border-b border-slate-850 shrink-0">
                <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Settings className="h-4 w-4 text-indigo-400" />
                  Picker Info
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                  Click any element in the webpage preview to automatically map its selector as the target image wrapper section.
                </p>
              </div>

              {/* Selection Card */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="p-4 rounded-xl border border-indigo-500 bg-indigo-500/10 shadow-sm shadow-indigo-500/10 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white">
                      Target Image Wrapper Selector
                    </span>
                    {selector ? (
                      <span className="text-[9px] font-bold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/15">
                        Mapped
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold uppercase text-slate-500 bg-slate-850 px-2 py-0.5 rounded-md border border-slate-855">
                        Empty
                      </span>
                    )}
                  </div>

                  {selector ? (
                    <div className="text-[10px] font-mono text-indigo-300 dark:text-indigo-400 break-all bg-slate-950 p-2 rounded-lg border border-slate-850">
                      {selector}
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-500 italic bg-slate-950/20 p-2 rounded border border-dashed border-slate-850">
                      Click element on page to map
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-4 border-t border-slate-850 bg-slate-950/40 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsPickerOpen(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white transition-all cursor-pointer text-center"
                >
                  Apply & Close
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
