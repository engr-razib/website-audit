"use client";

import React, { useState, useCallback } from "react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Type, MousePointer, Image, Heading, Code2, Zap, Globe, Sparkles, FileText } from "lucide-react";
import { JobStatusResponse, getJsonDownloadUrl } from "@/lib/api";
import { PagesAuditedTable } from "@/components/PagesAuditedTable";

export default function AuditDashboardPage() {
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [auditData, setAuditData] = useState<any>(null);
  const [jobSummary, setJobSummary] = useState<any>(null);
  const [mode, setMode] = useState<"quick" | "full">("quick");
  const [submittedFindingValue, setSubmittedFindingValue] = useState<string>("");

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

  // Calculate normalized display lists
  const fontList = auditData?.fontSummary || auditData?.fonts || [];
  const ctaList = auditData?.allCTAs || auditData?.ctas || [];
  const missingAltList = auditData?.allMissingAltImages || (auditData?.images || []).filter((i: any) => !i.hasAlt);
  const headingList = auditData?.allHeadings || auditData?.headings || [];
  const targetMatchesList = auditData?.allTargetMatches || auditData?.targetFontElements || [];
  const pagesList = auditData?.pages || (auditData ? [auditData] : []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
      {/* Top Banner & Mode Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Audit Control Center
          </h2>
          <p className="text-sm text-slate-400">
            Audit website font licensing, CTA design tokens, accessibility alt tags, and SEO tags.
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800 self-start md:self-auto">
          <button
            onClick={() => setMode("quick")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === "quick"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
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
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            Sitemap Crawler
          </button>
        </div>
      </div>

      {/* Input Form Cards */}
      {mode === "quick" ? (
        <QuickScanForm onScanComplete={handleQuickScanComplete} />
      ) : (
        <FullAuditForm onJobStarted={handleJobStarted} />
      )}

      {/* Job Status Tracker */}
      {activeJobId && (
        <JobStatusTracker jobId={activeJobId} onJobComplete={handleJobCompleted} />
      )}

      {/* Download Bar for Completed Jobs */}
      {activeJobId && auditData && <DownloadBar jobId={activeJobId} />}

      {/* Executive Summary Metrics */}
      {jobSummary && <SummaryCards summary={jobSummary} />}

      {/* Audit Data Breakdown Tabs */}
      {auditData && (
        <div className="space-y-4">
          <Tabs defaultValue={submittedFindingValue ? "matches" : "fonts"}>
            <TabsList>
              {submittedFindingValue && (
                <TabsTrigger value="matches" className="gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  Finding Matches ({targetMatchesList.length})
                </TabsTrigger>
              )}
              <TabsTrigger value="fonts" className="gap-2">
                <Type className="h-4 w-4 text-indigo-400" />
                Font Families ({fontList.length})
              </TabsTrigger>
              <TabsTrigger value="ctas" className="gap-2">
                <MousePointer className="h-4 w-4 text-purple-400" />
                CTA ({ctaList.length})
              </TabsTrigger>
              <TabsTrigger value="images" className="gap-2">
                <Image className="h-4 w-4 text-amber-400" />
                Missing Alt Images ({missingAltList.length})
              </TabsTrigger>
              <TabsTrigger value="headings" className="gap-2">
                <Heading className="h-4 w-4 text-blue-400" />
                Headings ({headingList.length})
              </TabsTrigger>
              <TabsTrigger value="pages" className="gap-2">
                <FileText className="h-4 w-4 text-blue-400" />
                Pages Audited ({pagesList.length})
              </TabsTrigger>
              <TabsTrigger value="json" className="gap-2">
                <Code2 className="h-4 w-4 text-slate-400" />
                Payload
              </TabsTrigger>
            </TabsList>

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

            <TabsContent value="pages">
              <PagesAuditedTable pages={pagesList} />
            </TabsContent>

            <TabsContent value="json">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 max-h-96 overflow-auto">
                <pre className="text-xs font-mono text-emerald-400">
                  {JSON.stringify(auditData, null, 2)}
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
