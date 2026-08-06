"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ImageIcon,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Cpu,
  Zap,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  Code2,
  BookOpen,
  Server,
  TrendingUp,
  Download,
  FolderArchive
} from "lucide-react";

export default function ImageDownloaderCaseStudyPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-16 space-y-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
        <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/case-study" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          Case Studies
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-slate-200 font-medium">Bulk Image Downloader Case Study</span>
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 sm:p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            Senior Engineering Case Study (STAR Method)
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Enterprise Bulk Image Extraction & Media Download Microservice
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            A high-throughput parallel image scraping engine built to parse HTML DOM trees, extract high-resolution media assets, enforce custom CSS selector boundaries, filter out tracking pixels, and package files into structured ZIP archives.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/image-downloader"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-lg shadow-purple-500/30 transition-all transform hover:-translate-y-0.5"
            >
              <Download className="h-4 w-4" />
              Try Image Downloader App
            </Link>
            <Link
              href="/guides/image-downloader"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all"
            >
              <BookOpen className="h-4 w-4 text-purple-400" />
              Read User Guide
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Photo Preview */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          Bulk Image Scraper System Preview
        </h2>
        <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-3 shadow-xl overflow-hidden group">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-slate-950">
            <Image
              src="/image_downloader_preview.png"
              alt="Image Downloader System Architecture Preview"
              fill
              className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
              priority
            />
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900/90 rounded-xl mt-3 border border-slate-100 dark:border-slate-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Parallel Stream Downloader & ZIP Packaging Engine
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pipes fetched media buffer streams directly into AdmZip archives while maintaining natural image dimensions and metadata in an Excel sheet.
              </p>
            </div>
            <span className="shrink-0 px-3 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-semibold border border-purple-500/20">
              STAR Method Analysis
            </span>
          </div>
        </div>
      </section>

      {/* STAR Method Breakdown Grid */}
      <section className="space-y-8">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          STAR Engineering Breakdown
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Situation */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 p-6 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <ShieldAlert className="h-4 w-4" />
              Situation & Challenge
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Manual Image Downloading & Noise</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              E-commerce visual asset managers and digital marketers needed to extract hundreds of product photos from supplier websites. Manual right-clicking took hours and browser extensions clogged downloads with tracking pixels, logos, site icons, and low-res thumbnails.
            </p>
          </div>

          {/* Task */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 p-6 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              <Cpu className="h-4 w-4" />
              Task & Objective
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">High-Speed Targeted Asset Downloader</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Engineered a fast, server-side media extraction engine capable of fetching web pages, evaluating container boundaries via custom CSS selectors, filtering out icons using resolution constraints, and streaming full-res binaries into a downloadable ZIP package.
            </p>
          </div>

          {/* Action */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 p-6 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <Code2 className="h-4 w-4" />
              Action & Architecture
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cheerio & Axios Concurrent Streaming Engine</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Utilized Axios and Cheerio for rapid DOM parsing with a Playwright fallback for JavaScript-rendered SPAs. Implemented concurrency throttles to bypass rate limits, image header validation to inspect natural dimensions, and dynamic ZIP generation using AdmZip.
            </p>
          </div>

          {/* Result */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 p-6 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
              Result & Impact
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">100% Noise Elimination & 5x Speedup</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Eliminated 100% of unwanted tracking pixels and icons through dimension thresholding. Reduced media extraction time for 200+ product images from 45 minutes of manual labor to under 15 seconds.
            </p>
          </div>
        </div>
      </section>

      {/* Engineering Metrics */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/40 p-8 space-y-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Layers className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          Key Benchmark Metrics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">&lt; 15s</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Batch Scrape Time (100+ images)</div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">100%</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Tracker/Pixel Filtering</div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="text-3xl font-extrabold text-pink-600 dark:text-pink-400">5x</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Download Concurrency Speedup</div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">Zero</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Corrupted Image Files</div>
          </div>
        </div>
      </section>

      {/* Navigation Footer CTA */}
      <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Explore Bulk Image Downloader</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">Launch image scraper tool or read the user guide.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/guides/image-downloader"
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            User Guide
          </Link>
          <Link
            href="/image-downloader"
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition-all flex items-center gap-1.5"
          >
            Launch App
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
