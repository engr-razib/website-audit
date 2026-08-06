"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Database,
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
  Upload,
  FolderArchive
} from "lucide-react";

export default function CustomCrawlingCaseStudyPage() {
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
        <span className="text-slate-900 dark:text-slate-200 font-medium">Custom Crawling Case Study</span>
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 sm:p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            Senior Engineering Case Study (STAR Method)
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Excel-Driven Custom Web Crawling & Data Extraction Platform
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            A flexible template-driven Web Scraping & Data Mining engine that parses user-defined Excel columns and CSS selectors, executes asynchronous site crawls, embeds configuration metadata for round-trip execution, and exports multi-sheet reports with media zip bundles.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/custom-crawler"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/30 transition-all transform hover:-translate-y-0.5"
            >
              <Upload className="h-4 w-4" />
              Try Custom Crawler App
            </Link>
            <Link
              href="/guides/custom-crawling"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all"
            >
              <BookOpen className="h-4 w-4 text-emerald-400" />
              Read User Guide
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Photo Preview */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Database className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          Custom Crawler Architecture & Dashboard Overview
        </h2>
        <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-3 shadow-xl overflow-hidden group">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-slate-950">
            <Image
              src="/custom_crawling_preview.png"
              alt="Custom Crawler System Architecture Preview"
              fill
              className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
              priority
            />
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900/90 rounded-xl mt-3 border border-slate-100 dark:border-slate-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Dynamic Excel Template Parser & Headless Crawler Engine
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Parses uploaded XLSX spreadsheets, executes automated Playwright web page traversal, populates custom data columns, and embeds hidden config metadata sheets.
              </p>
            </div>
            <span className="shrink-0 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
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
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Rigid Custom Scraping Scripts</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Business analysts and market research teams needed custom data points (like product specifications, prices, disclaimers, and gallery images) extracted across multi-page websites. Creating custom Python or Node scraper scripts for every new client project required expensive developer intervention and maintenance.
            </p>
          </div>

          {/* Task */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 p-6 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <Cpu className="h-4 w-4" />
              Task & Objective
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Zero-Code Excel Template Crawler</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Build a non-technical user interface allowing non-developers to upload standard Excel templates defining target column headers (Row 1) and CSS selectors (Row 2), configure ethics/robots.txt compliance rules, track crawling progress asynchronously, and download populated reports.
            </p>
          </div>

          {/* Action */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 p-6 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <Code2 className="h-4 w-4" />
              Action & Architecture
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">ExcelJS Schema Parser & _CRAWL_CONFIG_ Round-Trip</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Created an Excel template schema engine in ExcelJS that reads user-defined headers and selectors, generates custom crawler jobs, and embeds a hidden <code className="text-emerald-500">_CRAWL_CONFIG_</code> metadata sheet into every output file so previous workbooks can be re-uploaded to resume or re-run crawls without re-configuring rules.
            </p>
          </div>

          {/* Result */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 p-6 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              <TrendingUp className="h-4 w-4" />
              Result & Impact
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">100% Zero-Developer Scraping Capability</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Empowered non-technical teams to set up and execute custom web crawling jobs in under 2 minutes without writing a single line of code. Reduced data extraction turnaround time from days to minutes.
            </p>
          </div>
        </div>
      </section>

      {/* Engineering Metrics */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/40 p-8 space-y-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Layers className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          Key Benchmark Metrics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">100%</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Zero-Code Setup</div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="text-3xl font-extrabold text-teal-600 dark:text-teal-400">10x</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Workflow Velocity Speedup</div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">Roundtrip</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Config Persistence</div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">100%</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Robots.txt Ethical Compliance</div>
          </div>
        </div>
      </section>

      {/* Navigation Footer CTA */}
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Explore Custom Crawler App</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">Launch custom web scraper or read user setup documentation.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/guides/custom-crawling"
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            User Guide
          </Link>
          <Link
            href="/custom-crawler"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
          >
            Launch App
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
