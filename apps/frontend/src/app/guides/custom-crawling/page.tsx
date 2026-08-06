"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Database,
  FileSpreadsheet,
  Upload,
  Layers,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Sparkles,
  Zap,
  Sliders,
  FolderArchive,
  FileText,
  ShieldAlert,
  Code2
} from "lucide-react";

export default function CustomCrawlingGuidePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-16 space-y-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
        <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/guides" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          Guides
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-slate-200 font-medium">Custom Crawling Guide</span>
      </div>

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 sm:p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
            <Database className="h-3.5 w-3.5" />
            Excel-Driven Crawler & Data Scraper Manual
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Custom Crawling: Excel Template Data Extraction Guide
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Upload custom Excel templates defining columns and CSS selectors (Row 1 headers, Row 2 selectors) to crawl targeted data, monitor progress in real-time, preview extracted rows, and download enriched Excel workbooks and image ZIP archives.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/custom-crawler"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/30 transition-all transform hover:-translate-y-0.5"
            >
              <Upload className="h-4 w-4" />
              Launch Custom Crawler Tool
            </Link>
            <Link
              href="/case-study/custom-crawling"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all"
            >
              <FileText className="h-4 w-4 text-emerald-400" />
              Read Custom Crawling Case Study
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Preview Image Card */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          Custom Crawler Dashboard Interface
        </h2>
        <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-3 shadow-xl overflow-hidden group">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-slate-950">
            <Image
              src="/custom_crawling_preview.png"
              alt="Custom Crawler Interface Preview"
              fill
              className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
              priority
            />
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900/90 rounded-xl mt-3 border border-slate-100 dark:border-slate-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Excel Template Column Mapping & Crawler Dashboard
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Parses uploaded Excel files, detects CSS selector rules, crawls internal URLs asynchronously, and embeds embedded config rules into exported reports.
              </p>
            </div>
            <span className="shrink-0 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              Excel Scraper Engine
            </span>
          </div>
        </div>
      </section>

      {/* How Custom Crawling Works */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            How Custom Crawling Works (4 Simple Steps)
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Learn how to format your Excel template file and run automated web scraping jobs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 p-5 space-y-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
              01
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Download Sample Excel</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Download the pre-formatted Excel template containing example headers in Row 1 and CSS selectors in Row 2.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 p-5 space-y-3">
            <div className="h-8 w-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-xs">
              02
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Define Columns & Selectors</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Set Row 1 to column names (e.g. <span className="font-semibold">Product Title, Price, Image</span>) and Row 2 to CSS selectors (e.g. <code className="text-emerald-500">h1.title, .price, .gallery img</code>).
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 p-5 space-y-3">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
              03
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Upload & Start Crawling</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Upload your XLSX file, specify target start URL and max pages, then trigger the headless Playwright crawler.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 p-5 space-y-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
              04
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Export Results & Images</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Preview results on screen, download populated multi-sheet Excel reports, and save all extracted images in a ZIP bundle.
            </p>
          </div>
        </div>
      </section>

      {/* Advanced Capabilities */}
      <section className="space-y-6">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Advanced Capabilities
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 p-6 space-y-4">
            <div className="p-2.5 w-fit rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Embedded _CRAWL_CONFIG_ Sheet</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Every exported Excel report automatically embeds a hidden configuration sheet preserving your column rules so you can re-upload any past output Excel file to re-run the crawl instantly!
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 p-6 space-y-4">
            <div className="p-2.5 w-fit rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Robots.txt & Disclaimer Enforcement</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Includes optional disclaimer validation and automatic <code className="text-teal-500">robots.txt</code> compliance checks to ensure ethical crawling protocols.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 p-6 space-y-4">
            <div className="p-2.5 w-fit rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FolderArchive className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Extracted Image ZIP Packaging</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Automatically captures all target image elements matched by your selectors, downloads high-resolution binaries, and packages them in a neat ZIP archive.
            </p>
          </div>
        </div>
      </section>

      {/* Navigation Footer CTA */}
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ready for custom data extraction?</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">Launch Custom Crawler or read the engineering case study.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/case-study/custom-crawling"
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Read Case Study
          </Link>
          <Link
            href="/custom-crawler"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
          >
            Launch Custom Crawler
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
