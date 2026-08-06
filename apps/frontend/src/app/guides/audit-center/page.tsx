"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Zap,
  Globe,
  Sliders,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Sparkles,
  Search,
  Type,
  MousePointer,
  ImageIcon,
  ShieldCheck,
  Code2,
  FileText
} from "lucide-react";

export default function AuditCenterGuidePage() {
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
        <span className="text-slate-900 dark:text-slate-200 font-medium">Audit Center User Guide</span>
      </div>

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 sm:p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold">
            <LayoutDashboard className="h-3.5 w-3.5" />
            Comprehensive User Guide & Manual
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Audit Center: Typography & Brand Compliance Scanner
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Master the Audit Center to inspect typography tokens, font family declarations, CTA button styles, text copy, and alt text across single pages or entire XML sitemaps.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/audit"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5"
            >
              <Zap className="h-4 w-4" />
              Launch Audit Center App
            </Link>
            <Link
              href="/case-study/audit-center"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all"
            >
              <FileText className="h-4 w-4 text-blue-400" />
              Read Audit Center Case Study
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Preview Image Card */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Audit Center Interface Overview
        </h2>
        <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-3 shadow-xl overflow-hidden group">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-slate-950">
            <Image
              src="/audit_center_preview.png"
              alt="Audit Center Interface Preview"
              fill
              className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
              priority
            />
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900/90 rounded-xl mt-3 border border-slate-100 dark:border-slate-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Live Audit Scanner Dashboard
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Supports Quick Synchronous Scan (under 10s) and Asynchronous Sitemap XML Crawling with live job progress updates.
              </p>
            </div>
            <span className="shrink-0 px-3 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold border border-blue-500/20">
              Interactive Dashboard
            </span>
          </div>
        </div>
      </section>

      {/* Step-by-Step Workflow */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Step-by-Step Audit Workflow
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Follow this simple process to audit single pages or whole websites for font licensing, text copy, and accessibility compliance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 p-6 space-y-4 hover:border-blue-500/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                01
              </div>
              <Globe className="h-5 w-5 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Enter Target URL</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Enter any valid web URL (e.g., <code className="text-blue-600 dark:text-blue-400">https://example.com</code>) or an XML Sitemap URL (e.g., <code className="text-blue-600 dark:text-blue-400">https://example.com/sitemap.xml</code>).
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 p-6 space-y-4 hover:border-blue-500/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                02
              </div>
              <Sliders className="h-5 w-5 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Select Finding Type & Filter</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Select finding category (Font Family, Image Src, Text Copy, Button CTA) and optionally enter a specific target font name like <span className="font-semibold text-slate-900 dark:text-slate-200">"Dinot"</span> or leave empty for ALL.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 p-6 space-y-4 hover:border-blue-500/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                03
              </div>
              <FileSpreadsheet className="h-5 w-5 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Review & Export Excel</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Analyze the live interactive summary cards, DOM element table, screenshot gallery, and export a multi-sheet styled Excel report with one click.
            </p>
          </div>
        </div>
      </section>

      {/* Core Audit Modes */}
      <section className="space-y-6">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Supported Audit Modes
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Quick Scan (Single Page)</h3>
                <p className="text-xs text-slate-500">Synchronous scan under 10 seconds</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Evaluates a single target web page in real-time. Immediately extracts element computed styles, font family declarations, buttons, and accessibility tags without queueing background jobs.
            </p>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Instant execution for quick QA checks
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Generates design token statistics & style breakdown
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Full Site Sitemap Audit</h3>
                <p className="text-xs text-slate-500">Asynchronous background worker engine</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Fetches and parses entire <code className="text-xs text-indigo-500">sitemap.xml</code> trees, spawning headless Playwright browser workers to crawl dozens or hundreds of URLs concurrently.
            </p>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Live progress bar & real-time polling updates
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Automated zip archive of captured element screenshots
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Navigation Footer CTA */}
      <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ready to start auditing?</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">Try out Audit Center or explore the technical case study.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/case-study/audit-center"
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Read Case Study
          </Link>
          <Link
            href="/audit"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
          >
            Launch Audit Center
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
