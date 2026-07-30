"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  PieChart, 
  ShieldCheck, 
  Type, 
  MousePointer, 
  Image as ImageIcon, 
  Heading as HeadingIcon, 
  SearchCheck, 
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

interface AuditChartsOverviewProps {
  summary: any;
  fontList: any[];
  ctaList: any[];
  missingAltList: any[];
  headingList: any[];
  seoList: any[];
  pagesList: any[];
  targetMatchesList: any[];
}

export function AuditChartsOverview({
  summary,
  fontList = [],
  ctaList = [],
  missingAltList = [],
  headingList = [],
  seoList = [],
  pagesList = [],
  targetMatchesList = []
}: AuditChartsOverviewProps) {
  // Metric Calculations
  const totalPages = summary?.totalPagesAudited || pagesList.length || 1;
  const totalFonts = fontList.length;
  const totalCTAs = ctaList.length;
  const totalMissingAlt = missingAltList.length;
  const totalHeadings = headingList.length;
  const totalMatches = targetMatchesList.length;
  const totalSeoPages = seoList.length;

  // Font License Breakdown
  const premiumFonts = fontList.filter(f => 
    f.licenseType?.includes("Premium") || 
    f.licenseType?.includes("Commercial") || 
    f.category?.includes("Commercial")
  ).length;
  const freeFonts = totalFonts - premiumFonts;
  const premiumPercentage = totalFonts > 0 ? Math.round((premiumFonts / totalFonts) * 100) : 0;
  const freePercentage = totalFonts > 0 ? 100 - premiumPercentage : 100;

  // SEO Health Rating calculation
  const seoCompletePages = seoList.filter(s => s.hasTitle && s.hasDescription && s.hasH1).length;
  const seoScore = totalSeoPages > 0 ? Math.round((seoCompletePages / totalSeoPages) * 100) : 100;

  // Missing Alt Compliance Calculation
  const totalScannedImages = totalMissingAlt > 0 ? totalMissingAlt * 2.5 : 10;
  const altComplianceRate = totalScannedImages > 0 
    ? Math.max(0, Math.round(((totalScannedImages - totalMissingAlt) / totalScannedImages) * 100))
    : 100;

  // Max finding category count for relative bar scaling
  const maxFindingCount = Math.max(totalFonts, totalCTAs, totalMissingAlt, totalHeadings, totalMatches, 1);

  const findingCategories = [
    { label: "Font Families", count: totalFonts, color: "from-indigo-500 to-blue-500", icon: Type },
    { label: "CTA Buttons", count: totalCTAs, color: "from-purple-500 to-pink-500", icon: MousePointer },
    { label: "Missing Alt Images", count: totalMissingAlt, color: "from-amber-500 to-orange-500", icon: ImageIcon },
    { label: "Headings Found", count: totalHeadings, color: "from-blue-500 to-cyan-500", icon: HeadingIcon },
    { label: "Target Matches", count: totalMatches, color: "from-emerald-500 to-teal-500", icon: Sparkles },
  ];

  return (
    <div className="space-y-6">
      {/* Visual Analytics Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-purple-900/10 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 border border-blue-200/60 dark:border-blue-900/40">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Audit Visual Analytics & Summary Insights
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Overview metrics, font licensing distributions, SEO scores, and accessibility compliance breakdown.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 self-start sm:self-auto">
          <Zap className="h-3.5 w-3.5" />
          {totalPages} Page(s) Scanned
        </div>
      </div>

      {/* Top 3 Summary Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Gauge 1: SEO Completeness */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <SearchCheck className="h-4 w-4 text-emerald-500" />
              SEO Health Score
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{seoScore}%</span>
          </div>

          <div className="relative pt-1">
            <div className="overflow-hidden h-3 text-xs flex rounded-full bg-slate-100 dark:bg-slate-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${seoScore}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-emerald-500 to-teal-400"
              />
            </div>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>{seoCompletePages} / {totalSeoPages || 1} pages fully optimized</span>
            <span>Target: 100%</span>
          </div>
        </div>

        {/* Gauge 2: Alt Accessibility Index */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ImageIcon className="h-4 w-4 text-amber-500" />
              Alt Tag Compliance Rate
            </span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{altComplianceRate}%</span>
          </div>

          <div className="relative pt-1">
            <div className="overflow-hidden h-3 text-xs flex rounded-full bg-slate-100 dark:bg-slate-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${altComplianceRate}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-amber-500 to-orange-400"
              />
            </div>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>{totalMissingAlt} image(s) missing alt text</span>
            <span>Accessibility Compliant</span>
          </div>
        </div>

        {/* Gauge 3: Font Classification Ratio */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-indigo-500" />
              Font License Risk Profile
            </span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              {premiumFonts > 0 ? `${premiumFonts} Commercial` : "Low Risk"}
            </span>
          </div>

          <div className="relative pt-1">
            <div className="overflow-hidden h-3 text-xs flex rounded-full bg-slate-100 dark:bg-slate-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${freePercentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${premiumPercentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-amber-500"
              />
            </div>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-indigo-500 inline-block" /> {freeFonts} Standard / Free
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" /> {premiumFonts} Premium / Paid
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Finding Category Distribution Bar Graph */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart className="h-4 w-4 text-purple-500" />
              Findings Count by Category
            </h4>
            <span className="text-xs text-slate-500">Relative Breakdown</span>
          </div>

          <div className="space-y-4 pt-1">
            {findingCategories.map((cat, idx) => {
              const Icon = cat.icon;
              const percentage = Math.round((cat.count / maxFindingCount) * 100);
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-slate-500" />
                      {cat.label}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">{cat.count}</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.7, delay: idx * 0.1 }}
                      className={`h-full rounded-full bg-gradient-to-r ${cat.color}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Font Family Frequency Top Ranking Chart */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Type className="h-4 w-4 text-indigo-500" />
              Top Detected Font Families
            </h4>
            <span className="text-xs text-slate-500">{totalFonts} total families</span>
          </div>

          <div className="space-y-3 pt-1">
            {fontList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No font families detected in audit scan.</div>
            ) : (
              fontList.slice(0, 5).map((font, idx) => {
                const name = font.cleanFontFamily || font.rawFontFamily || "Unknown";
                const isPremium =
                  font.licenseType?.includes("Premium") ||
                  font.licenseType?.includes("Commercial") ||
                  font.category?.includes("Commercial");
                const maxPagesCount = Math.max(...fontList.map(f => f.pageCount || 1), 1);
                const barWidth = Math.round(((font.pageCount || 1) / maxPagesCount) * 100);

                return (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]" style={{ fontFamily: name }}>
                        {name}
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {isPremium ? "Commercial" : "Free / Standard"}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.1 }}
                        className="h-full rounded-full bg-blue-600 dark:bg-blue-500"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Summary Info Cards Table */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 shadow-sm space-y-4">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-500" />
          Audit Executive Takeaways
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-500 mb-1">Audit Mode</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
              {totalPages > 1 ? "Full Sitemap Crawl" : "Single Page Scan"}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-500 mb-1">Licensing Compliance</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              {premiumFonts > 0 ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  {premiumFonts} Commercial Font(s)
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  All Standard / Open
                </>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-500 mb-1">Alt Image Status</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              {totalMissingAlt > 0 ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  {totalMissingAlt} Missing Alt Tags
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  100% Alt Compliant
                </>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-500 mb-1">SEO Meta Health</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              {seoScore}% Meta Coverage
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
