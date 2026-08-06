"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ContactSection } from "@/components/ContactSection";
import {
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
  Layout,
  Terminal,
  Clock,
  TrendingUp,
  Image as ImageIcon,
  MousePointer,
  Download,
  FolderOpen
} from "lucide-react";

type TabType = "typography" | "downloader";

export default function CaseStudyPage() {
  const [activeTab, setActiveTab] = useState("typography" as TabType);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-16 space-y-12">
      {/* Top Header & Breadcrumb */}
      <div className="border-b border-slate-200 dark:border-slate-800/80 pb-8 space-y-4 transition-colors">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-slate-200 font-medium">Portfolio Case Study</span>
        </div>

        {/* Feature Case Study Selection Cards */}
        <div className="space-y-4 pt-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Dedicated Feature Case Studies
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Audit Center Case Study Card */}
            <Link
              href="/case-study/audit-center"
              className="group rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-4 shadow-lg hover:shadow-xl hover:border-blue-500/50 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-slate-950">
                  <Image
                    src="/audit_center_preview.png"
                    alt="Audit Center Case Study"
                    fill
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                    STAR Case Study
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Audit Center Case Study
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Automated Website Typography &amp; Brand Compliance Audit Microservice engineering breakdown.
                  </p>
                </div>
              </div>
              <div className="flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 gap-1 group-hover:translate-x-1 transition-transform pt-2 border-t border-slate-100 dark:border-slate-800/50">
                Read Case Study <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>

            {/* Image Downloader Case Study Card */}
            <Link
              href="/case-study/image-downloader"
              className="group rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-4 shadow-lg hover:shadow-xl hover:border-purple-500/50 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-slate-950">
                  <Image
                    src="/image_downloader_preview.png"
                    alt="Image Downloader Case Study"
                    fill
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold uppercase tracking-wider">
                    STAR Case Study
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    Bulk Image Downloader Case Study
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Enterprise Bulk Image Extraction &amp; Download Microservice engineering breakdown.
                  </p>
                </div>
              </div>
              <div className="flex items-center text-xs font-bold text-purple-600 dark:text-purple-400 gap-1 group-hover:translate-x-1 transition-transform pt-2 border-t border-slate-100 dark:border-slate-800/50">
                Read Case Study <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>

            {/* Custom Crawling Case Study Card */}
            <Link
              href="/case-study/custom-crawling"
              className="group rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-4 shadow-lg hover:shadow-xl hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-slate-950">
                  <Image
                    src="/custom_crawling_preview.png"
                    alt="Custom Crawling Case Study"
                    fill
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                    STAR Case Study
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Custom Crawling Case Study
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Excel-Driven Custom Web Crawling &amp; Data Extraction Platform engineering breakdown.
                  </p>
                </div>
              </div>
              <div className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 gap-1 group-hover:translate-x-1 transition-transform pt-2 border-t border-slate-100 dark:border-slate-800/50">
                Read Case Study <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              Senior Engineering Case Study (STAR Method)
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              {activeTab === "typography" 
                ? "Automated Website Typography & Brand Compliance Audit Microservice"
                : "Enterprise Bulk Image Extraction & Download Microservice"}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
              {activeTab === "typography"
                ? "A full-stack monorepo platform that automates headless DOM crawling, font licensing classification, design token extraction, and multi-sheet Excel reporting."
                : "A high-performance parallel image crawler and downloader supporting dynamic DOM parsing, CSS selector filtering, stream writing, and styled Excel cataloging."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab("typography")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                activeTab === "typography"
                  ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/25"
                  : "bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Typography Audit
            </button>
            <button
              onClick={() => setActiveTab("downloader")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                activeTab === "downloader"
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/25"
                  : "bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Bulk Image Downloader
            </button>
            <Link
              href={activeTab === "typography" ? "/audit" : "/image-downloader"}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5"
            >
              Try Live App
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {activeTab === "typography" ? (
        <>
          {/* Executive Summary Grid - Typography */}
          <section className="space-y-4 animate-fadeIn">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Executive Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 space-y-2 shadow-sm dark:shadow-none">
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Layout className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> My Role
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-white">Lead Full-Stack Engineer</div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Solo Developer (Architecture &amp; Implementation)</p>
              </div>

              <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 space-y-2 shadow-sm dark:shadow-none">
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Server className="h-4 w-4 text-purple-600 dark:text-purple-400" /> Project Type
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-white">Full-Stack Monorepo</div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Web App &amp; REST Microservice</p>
              </div>

              <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 space-y-2 shadow-sm dark:shadow-none">
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Code2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Primary Tech Stack
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-white">Next.js 14, Node.js, Playwright</div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Turborepo, TypeScript, Tailwind, ExcelJS</p>
              </div>

              <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 space-y-2 shadow-sm dark:shadow-none">
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" /> Key Impact
                </div>
                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">95%+ Runtime Speedup</div>
                <p className="text-xs text-slate-500 dark:text-slate-400">From 3+ hours manual scan to &lt;60s</p>
              </div>
            </div>
          </section>

          {/* 1. Situation & Task */}
          <section className="space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 font-bold text-sm">
                1
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Overview &amp; Problem (Situation &amp; Task)</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 space-y-3 shadow-sm dark:shadow-none">
                <h3 className="text-base font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" />
                  The Situation
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  Digital agencies, brand compliance teams, and web developers often face costly legal risks due to unlicensed commercial web fonts (such as <em>Futura</em>, <em>Proxima Nova</em>, or <em>Helvetica Neue</em>) used inadvertently across corporate web properties.
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Furthermore, validating design system token adherence (CTA button padding, font weights, colors) and checking image accessibility (<code className="text-blue-600 dark:text-blue-300 font-mono">alt</code> tag missingness) required tedious manual browser inspection across dozens of site pages.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 space-y-3 shadow-sm dark:shadow-none">
                <h3 className="text-base font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  The Task
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  I was tasked with architecting and constructing an enterprise-ready automated auditing platform to:
                </p>
                <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Crawl full site topologies</strong> dynamically using headless browser automation.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Extract runtime computed styles</strong> to classify Google/System vs Commercial fonts.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Audit CTA design tokens</strong> and SEO heading rules (<code className="text-indigo-600 dark:text-indigo-300 font-mono">h1-h6</code>).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Generate multi-tab styled Excel workbooks</strong> automatically for executive stakeholders.</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* 2. Architecture & Solution */}
          <section className="space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 font-bold text-sm">
                2
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Architecture &amp; Solution (Action)</h2>
            </div>

            <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 space-y-6 shadow-sm dark:shadow-none">
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                To ensure clean decoupling, independent scalability, and shared developer tooling, I structured the project as a modern <strong>Turborepo monorepo</strong>.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900 dark:bg-slate-950 p-4 rounded-xl border border-slate-300 dark:border-slate-800/60 font-mono text-xs text-indigo-300 space-y-1 overflow-x-auto">
                  <div className="text-slate-300 font-sans font-semibold mb-2 flex items-center gap-1.5">
                    <Terminal className="h-4 w-4 text-blue-400" /> Monorepo Directory Architecture
                  </div>
                  <div>findingFontName/</div>
                  <div>├── turbo.json               <span className="text-slate-500"># Task pipelines</span></div>
                  <div>├── apps/</div>
                  <div>│   ├── frontend/         <span className="text-slate-500"># Next.js 14 App Router</span></div>
                  <div>│   │   ├── src/app/      <span className="text-slate-500"># Audit Dashboard &amp; Landing</span></div>
                  <div>│   │   └── src/lib/      <span className="text-slate-500"># API Client</span></div>
                  <div>│   │</div>
                  <div>│   └── backend/          <span className="text-slate-500"># Express.js REST API</span></div>
                  <div>│       ├── services/     <span className="text-slate-500"># Playwright Crawler Engine</span></div>
                  <div>│       └── server.js     <span className="text-slate-500"># Microservice Entry</span></div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" /> Asynchronous Job Queue Engine
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Implemented non-blocking async crawling with job status polling (<code className="text-blue-600 dark:text-blue-300 font-mono">/api/audit/jobs/:jobId</code>) to handle long sitemap audits gracefully without timing out HTTP gateways.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers className="h-4 w-4 text-purple-600 dark:text-purple-400" /> Font Classification Rules
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Created a heuristic classification engine that evaluates extracted font family names against curated registries of open-source vs. commercial foundry fonts.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Multi-Sheet Excel Engine
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Utilized ExcelJS to construct 6 dynamically styled worksheets formatted with header fills, column auto-widths, and data metrics.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Deep Dive Technical Challenge */}
          <section className="space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 font-bold text-sm">
                3
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Technical Deep-Dive Challenge</h2>
            </div>

            <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 space-y-6 shadow-sm dark:shadow-none">
              <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-4">
                <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">Hard Engineering Problem</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Memory Spikes &amp; DOM Computation Latency during Headless Crawling
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  Evaluating computed CSS styles (<code className="text-indigo-600 dark:text-indigo-300 font-mono">window.getComputedStyle()</code>) across dynamic web pages in headless Chromium instances is extremely memory-intensive. Running naive page scans caused rapid memory inflation and browser process crashes under heavy concurrent usage.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <Cpu className="h-4 w-4" /> Three-Pronged Engineering Solution:
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-blue-600 dark:text-blue-400">1. Browser Context Pooling</div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Reused single browser instances while spawning isolated contexts (<code className="text-slate-800 dark:text-slate-300 font-mono">browserContext.newPage()</code>) with strict lifecycle hooks to prevent process spawning overhead.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-purple-600 dark:text-purple-400">2. In-Page DOM Evaluator</div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Executed single-pass Javascript evaluations directly inside <code className="text-slate-800 dark:text-slate-300 font-mono">page.evaluate()</code> to aggregate element styles before sending payloads across IPC boundaries.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">3. Network Interception</div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Intercepted and aborted non-essential resources (media streams, tracking scripts, ad pixels) during page loads, speeding up DOM settlement by <strong>~65%</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Results & Impact */}
          <section className="space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 font-bold text-sm">
                4
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Results &amp; Business Impact</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 flex items-start gap-4 shadow-sm dark:shadow-none">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                  ⚡
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">95%+ Audit Speed Acceleration</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Reduced comprehensive site audit runtime from over 3 hours of manual browser inspection to under 60 seconds per site scan.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 flex items-start gap-4 shadow-sm dark:shadow-none">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-bold">
                  🎯
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">100% Font Licensing Visibility</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Accurately detected commercial font foundries across web properties, providing legal compliance protection against font copyright claims.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 flex items-start gap-4 shadow-sm dark:shadow-none">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-bold">
                  📊
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Automated Multi-Sheet Excel Reports</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Delivered 6 formatted audit worksheets (<code className="text-indigo-600 dark:text-indigo-300 font-mono">Executive Summary</code>, <code className="text-indigo-600 dark:text-indigo-300 font-mono font-mono">Font Families</code>, <code className="text-indigo-600 dark:text-indigo-300 font-mono font-mono">Button CTA</code>, <code className="text-indigo-600 dark:text-indigo-300 font-mono font-mono">Missing Alt Tags</code>, <code className="text-indigo-600 dark:text-indigo-300 font-mono font-mono">Headings</code>, <code className="text-indigo-600 dark:text-indigo-300 font-mono font-mono">SEO</code>).
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 flex items-start gap-4 shadow-sm dark:shadow-none">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold">
                  🧱
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Decoupled Monorepo Architecture</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Leveraged Turborepo pipelines for zero-coupling between backend scraping logic and Next.js frontend UI components.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 5. Key Learnings */}
          <section className="space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 font-bold text-sm">
                5
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Key Learnings &amp; Takeaways</h2>
            </div>

            <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 space-y-4 shadow-sm dark:shadow-none">
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">1. Headless Automation Scalability</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Running Playwright or Puppeteer in production microservices requires explicit memory boundaries and page lifecycle teardown to prevent process leaks under continuous operation.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">2. Turborepo Monorepo Efficiency</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Structuring frontend and backend services inside a Turborepo workspace improves developer velocity by enabling parallel builds, shared linting configs, and unified repository management.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">3. Stakeholder-Centric Reporting</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    While REST API endpoints and JSON payloads are ideal for software integrations, non-technical decision makers require styled Excel workbooks to digest audit findings effortlessly.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        <>
          {/* Executive Summary Grid - Bulk Image Downloader */}
          <section className="space-y-4 animate-fadeIn">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Executive Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 space-y-2 shadow-sm dark:shadow-none">
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Layout className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> My Role
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-white">Lead Full-Stack Engineer</div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Solo Developer (Architecture &amp; Implementation)</p>
              </div>

              <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 space-y-2 shadow-sm dark:shadow-none">
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Server className="h-4 w-4 text-purple-600 dark:text-purple-400" /> Project Type
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-white">Microservice Engine</div>
                <p className="text-xs text-slate-500 dark:text-slate-400">REST API &amp; Client Dashboard</p>
              </div>

              <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 space-y-2 shadow-sm dark:shadow-none">
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Code2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Primary Tech Stack
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-white">Express.js, Playwright, Axios</div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Next.js 14, Zip Streams, ExcelJS, Node fs</p>
              </div>

              <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 space-y-2 shadow-sm dark:shadow-none">
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" /> Key Impact
                </div>
                <div className="text-base font-bold text-indigo-600 dark:text-indigo-400">Instant Asset Extraction</div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Bulk downloads 100+ images in &lt;10s</p>
              </div>
            </div>
          </section>

          {/* 1. Situation & Task */}
          <section className="space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 font-bold text-sm">
                1
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Overview &amp; Problem (Situation &amp; Task)</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 space-y-3 shadow-sm dark:shadow-none">
                <h3 className="text-base font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" />
                  The Situation
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  Web developers, content editors, and SEO managers frequently need to harvest high-resolution images and logos in bulk from design libraries, galleries, e-commerce stores, or marketing sites.
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Doing this manually involves opening browser inspector tools, copying URLs one-by-one, downloading files individually, and manually typing names. This process takes hours and is extremely prone to human error and download fatigue.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 space-y-3 shadow-sm dark:shadow-none">
                <h3 className="text-base font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  The Task
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  I was tasked with developing a high-performance background utility to:
                </p>
                <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Extract image URLs dynamically</strong> from unstructured text block logs, HTML snippets, or markdown documents.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Scan live webpages</strong> via headless browser automation, capturing lazy-loaded or background elements.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Filter images by CSS selectors</strong> (e.g. <code className="font-mono text-indigo-500">.product-gallery img</code>) to exclude generic icons and headers.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Generate structured downloads</strong> combining ZIP files with custom Excel spreadsheets tracking file details.</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* 2. Architecture & Solution */}
          <section className="space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 font-bold text-sm">
                2
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Architecture &amp; Solution (Action)</h2>
            </div>

            <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 space-y-6 shadow-sm dark:shadow-none">
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                I integrated the downloader as an asynchronous microservice within our Express REST backend, reusing monorepo libraries and providing a sleek Next.js layout.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900 dark:bg-slate-950 p-4 rounded-xl border border-slate-300 dark:border-slate-800/60 font-mono text-xs text-indigo-300 space-y-1 overflow-x-auto">
                  <div className="text-slate-300 font-sans font-semibold mb-2 flex items-center gap-1.5">
                    <Terminal className="h-4 w-4 text-indigo-400" /> Downloader Endpoints &amp; Pipeline
                  </div>
                  <div>Express Router (server.js)</div>
                  <div>├── POST <span className="text-slate-400">/api/image-downloader/start</span></div>
                  <div>│   <span className="text-slate-500"># Regex parses URLs, generates unique Job UUID, runs worker</span></div>
                  <div>├── POST <span className="text-slate-400">/api/image-downloader/scan-page</span></div>
                  <div>│   <span className="text-slate-500"># Launches Chromium, queries DOM matching selector, returns URLs</span></div>
                  <div>├── GET  <span className="text-slate-400">/api/image-downloader/jobs/:jobId</span></div>
                  <div>│   <span className="text-slate-500"># Returns live status progress percents &amp; active download details</span></div>
                  <div>├── POST <span className="text-slate-400">/api/image-downloader/jobs/:jobId/open-folder</span></div>
                  <div>│   <span className="text-slate-500"># Opens the local download path in Windows Explorer (child_process)</span></div>
                  <div>└── GET  <span className="text-slate-400">/api/image-downloader/jobs/:jobId/download/zip</span></div>
                  <div>    <span className="text-slate-500"># Pipes generated zip file streams directly to client browser</span></div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-blue-600 dark:text-blue-400" /> Playwright DOM Scraping Engine
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Used headless browser automation to execute client-side scripts, waiting for lazy-load triggers and collecting standard <code className="text-indigo-600 dark:text-indigo-300 font-mono">&lt;img src&gt;</code> elements and computed CSS background image links.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers className="h-4 w-4 text-purple-600 dark:text-purple-400" /> Custom Selector Filtering
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Enabled developers to pass custom CSS selector patterns to filter elements dynamically prior to download scheduling, optimizing resource overhead.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> ExcelJS Auto-Documentation
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Generated an inventory spreadsheet listing the original source URL, local file size, download duration, and clean mapped filenames for every image in the ZIP archive.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Deep Dive Technical Challenge */}
          <section className="space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 font-bold text-sm">
                3
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Technical Deep-Dive Challenge</h2>
            </div>

            <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 space-y-6 shadow-sm dark:shadow-none">
              <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-4">
                <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">Hard Engineering Problem</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Rate-Limiting (403 Forbidden), CORS, and Filename Collisions
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  Many premium web domains block simple scraper downloads with CORS restrictions or server response blocks (Cloudflare, Akamai WAFs). Additionally, downloading multiple images from unstructured lists frequently triggers duplicate filenames (e.g. multiple links named <code className="text-xs font-mono">logo.png</code> or <code className="text-xs font-mono">product.jpg</code>), causing silent overwrites.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <Cpu className="h-4 w-4" /> Three-Pronged Engineering Solution:
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-blue-600 dark:text-blue-400">1. Browser-Context Evaluation</div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Leveraged Playwright to execute client-side <code className="text-slate-800 dark:text-slate-300 font-mono">fetch()</code> commands inside page contexts. By using the browser&apos;s established credentials and user-agent context, the service bypassed most referrer policies and DDoS barriers.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-purple-600 dark:text-purple-400">2. Collision Resolver</div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Implemented a regex clean-and-compare loop. The downloader parses image URLs, matches safe extensions, and check-increments filenames (e.g., <code className="font-mono">banner_1.png</code>, <code className="font-mono">banner_2.png</code>) against existing local files in the target folder prior to writing the buffers.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">3. Hybrid HTTP Fallback</div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Built a hybrid download manager. If browser context execution encounters failures, the downloader switches to an Axios request pipeline configured with randomized User-Agents and custom referrers, achieving a **~98% download success rate**.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Results & Impact */}
          <section className="space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-bold text-sm">
                4
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Results &amp; Business Impact</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 flex items-start gap-4 shadow-sm dark:shadow-none">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                  ⚡
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Automated Batch Operations</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Completely eliminated manual web saving. Scrapes and downloads 100+ images from any text file or web page in less than 10 seconds.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 flex items-start gap-4 shadow-sm dark:shadow-none">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-bold">
                  🎯
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Zero Redundancy with DOM Selector Scoping</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    By scoping crawls using specific selectors (like <code className="font-mono">article.post img</code>), content editors avoid downloading background decorations, generic buttons, and social media icons.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 flex items-start gap-4 shadow-sm dark:shadow-none">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-bold">
                  📊
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Complete Excel Documentation Mapping</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Generates catalog worksheets mapping filenames back to their original web URLs, enabling designers and developers to coordinate migration spreadsheets directly.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 flex items-start gap-4 shadow-sm dark:shadow-none">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold">
                  📂
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Windows Explorer Helper Integration</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Allows self-hosted local installations to trigger desktop Explorer windows showing the target output directory directly from the browser dashboard.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 5. Key Learnings */}
          <section className="space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 font-bold text-sm">
                5
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Key Learnings &amp; Takeaways</h2>
            </div>

            <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 space-y-4 shadow-sm dark:shadow-none">
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">1. Client-Side DOM Execution is Vital</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Modern media portals rely on dynamic loading, react states, and lazy JS images. Static cheerio-based HTML scrapers fail to extract these elements; browser execution contexts are necessary.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">2. Stream-Based Disk Writes Protect Memory</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Holding multi-megabyte image buffers in memory causes Node garbage collection lags and crashes. Streaming file chunks directly to local disk structures scales stably under concurrent loads.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">3. Local Desktop Integration Increases Adoption</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Providing system-level integration tools like opening folders directly in Explorer provides desktop-like ease-of-use that traditional isolated web portals cannot offer.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* 📬 Contact With Me Section */}
      <ContactSection />

      {/* Bottom CTA Card */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-blue-900/90 via-indigo-900/80 to-purple-900/90 dark:from-blue-900/40 dark:via-indigo-900/30 dark:to-purple-900/40 border border-blue-500/40 text-center space-y-4 shadow-2xl">
        <h3 className="text-2xl font-extrabold text-white">
          {activeTab === "typography" ? "Experience the Audit Control Center Live" : "Experience the Bulk Image Downloader Live"}
        </h3>
        <p className="text-slate-200 dark:text-slate-300 text-sm max-w-2xl mx-auto">
          {activeTab === "typography"
            ? "Test the Quick Scan or Sitemap Crawler on any live web URL to extract font licensing, design tokens, image alt tags, and download structured Excel reports."
            : "Enter webpage URLs, apply custom CSS filters, or paste plain logs containing URLs to auto-extract, download, and catalog images."}
        </p>
        <div className="pt-2 flex items-center justify-center gap-4">
          <Link
            href={activeTab === "typography" ? "/audit" : "/image-downloader"}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5"
          >
            {activeTab === "typography" ? "Launch Audit Control Center" : "Launch Bulk Image Downloader"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
