"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ImageIcon,
  Download,
  Filter,
  Layers,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Sparkles,
  Zap,
  Sliders,
  FolderArchive,
  FileText
} from "lucide-react";

export default function ImageDownloaderGuidePage() {
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
        <span className="text-slate-900 dark:text-slate-200 font-medium">Bulk Image Downloader Guide</span>
      </div>

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 sm:p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold">
            <ImageIcon className="h-3.5 w-3.5" />
            Media & Image Scraper Manual
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Bulk Image Downloader: Extraction & Cataloging Guide
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Extract, filter, preview, and download images in bulk from any website with CSS selector filtering, dimension constraints, zip packaging, and Excel metadata cataloging.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/image-downloader"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-lg shadow-purple-500/30 transition-all transform hover:-translate-y-0.5"
            >
              <Download className="h-4 w-4" />
              Launch Bulk Image Downloader
            </Link>
            <Link
              href="/case-study/image-downloader"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all"
            >
              <FileText className="h-4 w-4 text-purple-400" />
              Read Image Downloader Case Study
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Preview Image Card */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          Bulk Image Downloader Interface
        </h2>
        <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-3 shadow-xl overflow-hidden group">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-slate-950">
            <Image
              src="/image_downloader_preview.png"
              alt="Bulk Image Downloader Interface Preview"
              fill
              className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
              priority
            />
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900/90 rounded-xl mt-3 border border-slate-100 dark:border-slate-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Live Image Scraper & Download Gallery
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Filters out tiny icons/trackers with minimum dimension rules and bundles high-res images into a structured ZIP archive.
              </p>
            </div>
            <span className="shrink-0 px-3 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-semibold border border-purple-500/20">
              Scraper & Gallery
            </span>
          </div>
        </div>
      </section>

      {/* How to Download Images Step-by-Step */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            How to Bulk Download Images
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Follow this step-by-step workflow to scrape and save target assets in bulk.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 p-5 space-y-3">
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
              01
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Target Web Page URL</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Enter any target web address (e.g., product page, blog post, or gallery).
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 p-5 space-y-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
              02
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">CSS Selector (Optional)</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Restrict extraction to specific containers (e.g. <code className="text-purple-500">.product-gallery</code> or <code className="text-purple-500">article img</code>).
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 p-5 space-y-3">
            <div className="h-8 w-8 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold text-xs">
              03
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Dimension Thresholds</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Set minimum width/height (e.g., 200px) to eliminate 1x1 tracking pixels and decorative icons.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 p-5 space-y-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
              04
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Download ZIP & Excel</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Download all images as a structured ZIP file alongside an Excel catalog containing dimensions and alt tags.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="space-y-6">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Key Capabilities & Features
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Filter className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Smart Selector Filtering</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Target exact page sections with standard CSS selectors such as <code className="text-xs text-purple-500">.main-content img</code>, <code className="text-xs text-purple-500">#hero-banner</code>, or <code className="text-xs text-purple-500">picture source</code>.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <FolderArchive className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">ZIP Archive & Excel Export</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Bundles all fetched image files with clean standardized file names into a downloadable ZIP archive, accompanied by an Excel metadata sheet listing image sizes, natural dimensions, and alt texts.
            </p>
          </div>
        </div>
      </section>

      {/* Navigation Footer CTA */}
      <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ready to download image assets?</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">Try Bulk Image Downloader now or view the technical case study.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/case-study/image-downloader"
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Read Case Study
          </Link>
          <Link
            href="/image-downloader"
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition-all flex items-center gap-1.5"
          >
            Launch Downloader
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
