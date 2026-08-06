"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { QuickScanForm } from "@/components/QuickScanForm";
import { FullAuditForm } from "@/components/FullAuditForm";
import { JobStatusTracker } from "@/components/JobStatusTracker";
import { SummaryCards } from "@/components/SummaryCards";
import { FontAuditTable } from "@/components/FontAuditTable";
import { ButtonAuditGrid } from "@/components/ButtonAuditGrid";
import { MissingAltTable } from "@/components/MissingAltTable";
import { HeadingAuditTable } from "@/components/HeadingAuditTable";
import { TargetMatchesTable } from "@/components/TargetMatchesTable";
import { DownloadBar } from "@/components/DownloadBar";
import { PagesAuditedTable } from "@/components/PagesAuditedTable";
import { SeoAuditTable } from "@/components/SeoAuditTable";
import { AuditChartsOverview } from "@/components/AuditChartsOverview";
import { Type, MousePointer, Image, Heading, Zap, Globe, Sparkles, FileText, ArrowLeft, SearchCheck, BarChart3, RefreshCw } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { JobStatusResponse, getJsonDownloadUrl } from "@/lib/api";

export default function AuditPage() {
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [auditData, setAuditData] = useState<any>(null);
  const [jobSummary, setJobSummary] = useState<any>(null);
  const [mode, setMode] = useState<"quick" | "full">("quick");
  const [submittedFindingValue, setSubmittedFindingValue] = useState<string>("");

  // Dispatch active status to topbar connections
  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent('app-activity-status', { detail: { active: !!activeJobId } }));
    return () => {
      window.dispatchEvent(new CustomEvent('app-activity-status', { detail: { active: false } }));
    };
  }, [activeJobId]);

  // Quick Scan handler
  const handleQuickScanComplete = useCallback((quickScanResult: any, findingValue: string) => {
    setSubmittedFindingValue(findingValue);
    setAuditData(quickScanResult);
    setActiveJobId(null);
    // Derive summary metrics for quick scan
    const fonts = quickScanResult.fonts || [];
    const ctas = quickScanResult.ctas || [];
    const images = (quickScanResult.images || []).filter((i: any) => !i.hasAlt);

    setJobSummary({
      totalPagesAudited: 1,
      uniqueFontsFound: fonts.length,
      totalCTAsFound: ctas.length,
      missingAltImagesCount: images.length,
      targetFontElementMatches: (quickScanResult.targetFontElements || []).length,
      targetFontStyleMatches: (quickScanResult.targetFontStylesheets || []).length,
    });
  }, []);

  // Async job started handler
  const handleJobStarted = useCallback((jobId: string, findingValue: string) => {
    setSubmittedFindingValue(findingValue);
    setActiveJobId(jobId);
    setAuditData(null);
    setJobSummary(null);
  }, []);

  // Async job finished handler
  const handleJobCompleted = useCallback(async (jobData: JobStatusResponse) => {
    if (jobData.summary) {
      setJobSummary(jobData.summary);
    }
    try {
      const res = await fetch(getJsonDownloadUrl(jobData.jobId));
      if (res.ok) {
        const fullData = await res.json();
        setAuditData(fullData);
      }
    } catch (e) {
      console.error("Failed to load completed audit JSON", e);
    }
  }, []);

  // Reset overall audit results
  const handleResetResults = useCallback(() => {
    setAuditData(null);
    setJobSummary(null);
    setActiveJobId(null);
    setSubmittedFindingValue("");
  }, []);

  // Calculate normalized display lists
  const fontList = (auditData?.fontSummary || auditData?.fonts || []).map((f: any) => ({
    ...f,
    url: f.url || (f.urls ? f.urls[0] : auditData?.url),
    urls: f.urls || (f.url ? [f.url] : (auditData?.url ? [auditData.url] : []))
  }));
  const ctaList = (auditData?.allCTAs || auditData?.ctas || []).map((c: any) => ({ ...c, url: c.url || auditData?.url }));
  const missingAltList = (auditData?.allMissingAltImages || (auditData?.images || []).filter((i: any) => !i.hasAlt)).map((img: any) => ({ ...img, url: img.url || auditData?.url }));
  const headingList = (auditData?.allHeadings || auditData?.headings || []).map((h: any) => ({ ...h, url: h.url || auditData?.url }));
  const targetMatchesList = (auditData?.allTargetMatches || auditData?.targetFontElements || []).map((m: any) => ({ ...m, url: m.url || auditData?.url }));
  const pagesList = auditData?.pages || (auditData ? [auditData] : []);
  const seoList = auditData?.pages
    ? auditData.pages.map((p: any) => ({ url: p.url, ...p.seo }))
    : (auditData?.seo ? [{ url: auditData.url, ...auditData.seo }] : []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 space-y-8 pb-16"
    >
      {/* Top Banner & Mode Selector */}
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
            Audit Center
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Audit website font licensing, CTA design, accessibility alt image tags and SEO tags.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {auditData && (
            <button
              onClick={handleResetResults}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Clear active audit results"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
              Clear Results
            </button>
          )}

          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-300 dark:border-slate-800 transition-colors">
            <button
              onClick={() => setMode("quick")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === "quick"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              Quick Scan
            </button>
            <button
              onClick={() => setMode("full")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === "full"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              Sitemap Crawler
            </button>
          </div>
        </div>
      </div>

      {/* Input Form Cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          {mode === "quick" ? (
            <QuickScanForm onScanComplete={handleQuickScanComplete} />
          ) : (
            <FullAuditForm onJobStarted={handleJobStarted} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Job Status Tracker */}
      {activeJobId && (
        <JobStatusTracker jobId={activeJobId} onJobComplete={handleJobCompleted} />
      )}

      {/* Download Bar for Completed Audit Scans */}
      {auditData && <DownloadBar jobId={activeJobId} auditData={auditData} />}

      {/* Executive Summary Metrics */}
      {jobSummary && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <SummaryCards summary={jobSummary} />
        </motion.div>
      )}

      {/* Audit Data Breakdown Tabs */}
      {auditData && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Tabs defaultValue="charts">
            <TabsList className="flex flex-wrap gap-1">
              <TabsTrigger value="charts" className="gap-2">
                <BarChart3 className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                Overview
              </TabsTrigger>
              {submittedFindingValue && (
                <TabsTrigger value="matches" className="gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                  Finding Matches ({targetMatchesList.length})
                </TabsTrigger>
              )}
              <TabsTrigger value="pages" className="gap-2">
                <FileText className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                Summary ({pagesList.length})
              </TabsTrigger>
              <TabsTrigger value="fonts" className="gap-2">
                <Type className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                Font Families ({fontList.length})
              </TabsTrigger>
              <TabsTrigger value="ctas" className="gap-2">
                <MousePointer className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                CTA ({ctaList.length})
              </TabsTrigger>
              <TabsTrigger value="images" className="gap-2">
                <Image className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                Missing Alt Images ({missingAltList.length})
              </TabsTrigger>
              <TabsTrigger value="headings" className="gap-2">
                <Heading className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                Headings ({headingList.length})
              </TabsTrigger>
              <TabsTrigger value="seo" className="gap-2">
                <SearchCheck className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                SEO ({seoList.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="charts">
              <AuditChartsOverview
                summary={jobSummary}
                fontList={fontList}
                ctaList={ctaList}
                missingAltList={missingAltList}
                headingList={headingList}
                seoList={seoList}
                pagesList={pagesList}
                targetMatchesList={targetMatchesList}
              />
            </TabsContent>

            {submittedFindingValue && (
              <TabsContent value="matches">
                <TargetMatchesTable matches={targetMatchesList} jobId={activeJobId} />
              </TabsContent>
            )}

            <TabsContent value="fonts">
              <FontAuditTable fonts={fontList} />
            </TabsContent>

            <TabsContent value="ctas">
              <ButtonAuditGrid ctas={ctaList} />
            </TabsContent>

            <TabsContent value="images">
              <MissingAltTable images={missingAltList} />
            </TabsContent>

            <TabsContent value="headings">
              <HeadingAuditTable headings={headingList} />
            </TabsContent>

            <TabsContent value="seo">
              <SeoAuditTable seoList={seoList} />
            </TabsContent>

            <TabsContent value="pages">
              <PagesAuditedTable pages={pagesList} />
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </motion.div>
  );
}
