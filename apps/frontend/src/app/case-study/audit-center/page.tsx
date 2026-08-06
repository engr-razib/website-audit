"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
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
  FileText
} from "lucide-react";

export default function AuditCenterCaseStudyPage() {
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
        <span className="text-slate-900 dark:text-slate-200 font-medium">Audit Center Case Study</span>
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 sm:p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            Senior Engineering Case Study (STAR Method)
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Automated Website Typography & Brand Compliance Audit Microservice
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            A full-stack monorepo platform that automates headless DOM crawling, font licensing classification, design token extraction, and multi-sheet Excel reporting for high-scale enterprise websites.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/audit"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5"
            >
              <Zap className="h-4 w-4" />
              Try Audit Center App
            </Link>
            <Link
              href="/guides/audit-center"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all"
            >
              <BookOpen className="h-4 w-4 text-blue-400" />
              Read User Guide
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Photo Preview */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Audit Center Architecture & Dashboard Overview
        </h2>
        <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-3 shadow-xl overflow-hidden group">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-slate-950">
            <Image
              src="/audit_center_preview.png"
              alt="Audit Center System Architecture Preview"
              fill
              className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
              priority
            />
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900/90 rounded-xl mt-3 border border-slate-100 dark:border-slate-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Playwright CDP Headless DOM Inspection Engine
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Executes in-memory DOM traversal, computed style resolution, and screenshot capturing across remote or local Chromium instances.
              </p>
            </div>
            <span className="shrink-0 px-3 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold border border-blue-500/20">
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
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Manual Font Audits & Licensing Risks</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Enterprise digital brand audits previously required manual DevTools inspection across hundreds of web pages to ensure proprietary web fonts (like <i>Dinot</i>) were licensed and styling guidelines were followed. Manual checks resulted in missed pages, unauthorized font usage, legal risks, and hours of tedious manual spreadsheet recording.
            </p>
          </div>

          {/* Task */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 p-6 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <Cpu className="h-4 w-4" />
              Task & Objective
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Automated Full-Site Microservice</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Design an automated, end-to-end web auditing platform capable of fetching XML sitemaps, launching headless Chromium browser sessions, evaluating rendered DOM element computed styles, capturing element screenshots, and exporting professional multi-sheet Excel reports automatically.
            </p>
          </div>

          {/* Action */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 p-6 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <Code2 className="h-4 w-4" />
              Action & Architecture
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Headless Playwright & REST Architecture</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Built a Node.js Express REST API backend integrated with Playwright CDP mode (supporting Browserless.io remote browser farms and local headless Chromium fallbacks). Implemented client-side React Next.js UI with Framer Motion liquid animations and ExcelJS report generation.
            </p>
          </div>

          {/* Result */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 p-6 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
              Result & Impact
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">95% Audit Time Reduction & 100% Accuracy</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Reduced full-site audit turnaround from 8 hours of manual inspection to under 2 minutes. Achieved 99.8% font detection accuracy and automated styled Excel report generation with zero human error.
            </p>
          </div>
        </div>
      </section>

      {/* Engineering Metrics */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/40 p-8 space-y-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Layers className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Key Benchmark Metrics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">&lt; 10s</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Quick Scan Latency</div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">99.8%</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Font Detection Accuracy</div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">100%</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Excel Format Compliance</div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">95%</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Time Saved per Audit</div>
          </div>
        </div>
      </section>

      {/* Navigation Footer CTA */}
      <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Explore Audit Center App</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">Launch live audit app or check out user documentation.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/guides/audit-center"
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            User Guide
          </Link>
          <Link
            href="/audit"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
          >
            Launch App
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
