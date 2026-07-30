"use client";

import React from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { ContactSection } from "@/components/ContactSection";
import {
  Sparkles,
  ArrowRight,
  Zap,
  Globe,
  Type,
  MousePointer,
  Image,
  Heading,
  FileSpreadsheet,
  ShieldCheck,
  Search,
  Download,
  BookOpen,
  Layers,
  BarChart3,
  Award,
  CheckCircle2,
} from "lucide-react";

export default function LandingPage() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-16 space-y-20"
    >
      {/* 🚀 Hero Section */}
      <motion.section
        variants={itemVariants}
        className="relative overflow-hidden pt-6 pb-12 rounded-3xl bg-white/70 dark:bg-slate-900/40 border border-slate-300 dark:border-slate-800/80 p-8 sm:p-12 text-center space-y-8 shadow-sm dark:shadow-none transition-colors backdrop-blur-xl"
      >
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-blue-600/15 to-purple-600/15 blur-3xl pointer-events-none rounded-full animate-pulse-glow" />

        {/* Badge */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-xs font-medium shadow-sm"
        >
          <Sparkles className="h-3.5 w-3.5" />
          6-in-1 Automated Website Quality &amp; Font Audit Engine
        </motion.div>

        {/* Headline */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white ">
            Audit Your Full Site <br /> 
            <span className="text-4xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-300 dark:to-purple-400 bg-clip-text text-transparent">
              Font Licensing, Button Design &amp; Web Compliance{" "}
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-300 dark:to-purple-400 bg-clip-text text-transparent">
              In Seconds
            </span>
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed max-w-3xl mx-auto">
            A full-stack platform that automates headless DOM crawling, font licensing classification, design token extraction, and multi-sheet Excel reporting.
          </p>
        </div>

        {/* Hero CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/audit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-base shadow-xl shadow-blue-500/25 transition-all transform group cursor-pointer"
            >
              <Zap className="h-5 w-5 fill-white text-white" />
              Start Now
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/case-study"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-semibold text-sm transition-all"
            >
              <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Read Case Study
            </Link>
          </motion.div>
        </div>

        {/* Quick Highlights Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-slate-300 dark:border-slate-800/80 text-left">
          <div className="p-3 space-y-1">
            <div className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Zap className="h-5 w-5 text-amber-500 dark:text-amber-400" /> &lt;60 Sec
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Ultra-fast Headless Scanning</div>
          </div>
          <div className="p-3 space-y-1">
            <div className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Type className="h-5 w-5 text-indigo-500 dark:text-indigo-400" /> 100% Font
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Licensing Tier Detection</div>
          </div>
          <div className="p-3 space-y-1">
            <div className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <FileSpreadsheet className="h-5 w-5 text-emerald-500 dark:text-emerald-400" /> 6 Worksheets
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Styled Excel Workbook Export</div>
          </div>
          <div className="p-3 space-y-1">
            <div className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Globe className="h-5 w-5 text-blue-500 dark:text-blue-400" /> Full Sitemap
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Multi-page Background Crawling</div>
          </div>
        </div>
      </motion.section>

      {/* ⚡ Built for speed. Designed for everyone section */}
      <motion.section
        variants={itemVariants}
        className="rounded-3xl bg-gradient-to-r from-blue-900/20 via-indigo-900/20 to-purple-900/20 dark:from-slate-900/80 dark:to-slate-900/90 border border-blue-500/20 p-8 sm:p-10 shadow-lg text-center space-y-6 backdrop-blur-xl"
      >
        <div className="space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="h-3.5 w-3.5" /> High-Performance Audit
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Built for speed. Designed for everyone.
          </h2>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-4xl mx-auto pt-2">
          {[
            "Free Forever",
            "No Signup",
            "Private in Browser",
            "Unlimited Use",
            "No Watermarks",
            "Mobile Friendly",
            "Instant Excel Downloads",
          ].map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/90 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 shadow-sm text-slate-900 dark:text-slate-100 font-semibold text-sm"
            >
              <span className="text-emerald-500 dark:text-emerald-400 font-bold">✓</span>
              <span>{item}</span>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* 🌟 Application Features Section */}
      <section className="space-y-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Platform Capability</h2>
          <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">Comprehensive 6-in-1 Audit Features</h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Everything digital agencies, brand managers, and frontend developers need to audit web properties.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 hover:border-indigo-500/50 transition-all space-y-4 group shadow-sm dark:shadow-none">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform">
              <Type className="h-6 w-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">1. Font Licensing &amp; Classification</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Extracts computed DOM typography and classifies fonts into <strong>Free / Google / System</strong> fonts versus <strong>Premium / Commercial</strong> fonts (e.g. Futura, Proxima Nova, Helvetica).
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 hover:border-purple-500/50 transition-all space-y-4 group shadow-sm dark:shadow-none">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 group-hover:scale-110 transition-transform">
              <MousePointer className="h-6 w-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">2. CTA Design Token Extractor</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Scans all call-to-action elements (<code className="text-purple-600 dark:text-purple-300 font-mono">button</code>, <code className="text-purple-600 dark:text-purple-300 font-mono">a.btn</code>, <code className="text-purple-600 dark:text-purple-300 font-mono">input[type=submit]</code>) to audit font size, weight, colors, padding, and border radius.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 hover:border-amber-500/50 transition-all space-y-4 group shadow-sm dark:shadow-none">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
              <Image className="h-6 w-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">3. Accessibility (Alt Tag) Inspector</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Identifies images missing <code className="text-amber-600 dark:text-amber-300 font-mono">alt</code> tags or containing empty text attributes across site subpages to ensure WCAG compliance.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 hover:border-blue-500/50 transition-all space-y-4 group shadow-sm dark:shadow-none">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
              <Heading className="h-6 w-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">4. Heading Typography Hierarchy</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Inspects heading tags (<code className="text-blue-600 dark:text-blue-300 font-mono">H1</code> through <code className="text-blue-600 dark:text-blue-300 font-mono">H6</code>) for proper semantic page structure and CSS token consistency.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 hover:border-emerald-500/50 transition-all space-y-4 group shadow-sm dark:shadow-none">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">5. SEO &amp; Head Tag Rules</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Audits page titles, meta descriptions, viewport configurations, and canonical URL tags to improve search ranking readiness.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 hover:border-teal-500/50 transition-all space-y-4 group shadow-sm dark:shadow-none">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">6. Multi-Sheet Excel Export</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Generates executive-ready Excel workbooks (<code className="text-teal-600 dark:text-teal-300 font-mono">.xlsx</code>) with 6 formatted tabs: Executive Summary, Font Families, CTAs, Missing Alt Tags, Headings, and SEO.
            </p>
          </div>
        </div>
      </section>

      {/* 💡 Key Benefits Section */}
      <section className="p-8 rounded-3xl bg-white/80 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 space-y-8 shadow-sm dark:shadow-none transition-colors">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Why Choose Website Audit AI</h2>
          <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">Key Business &amp; Technical Benefits</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Legal Risk &amp; Copyright Protection</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Prevent expensive font foundry copyright claims by catching unlicensed commercial web fonts before launching or client handover.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Layers className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Strict Design Token Enforcement</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Ensure developers adhere to brand design system guidelines across all subpages by auditing button padding, typography hierarchy, and colors.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Instant Executive Deliverables</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Save hours of manually building client audit reports. Download styled, multi-worksheet Excel spreadsheets ready for client presentation.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Globe className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Scalable Sitemap Automation</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Provide an XML sitemap URL to crawl and audit dozens of site pages asynchronously without clogging browser tabs or timing out.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 📘 How to Use Instructions */}
      <section className="space-y-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">User Guide</h2>
          <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">How to Use Website Audit AI</h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Follow these 3 simple steps to complete your first website audit in under a minute.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Step 1 */}
          <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 space-y-4 relative shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-base shadow-md">
                1
              </div>
              <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">Select Your Audit Mode</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Open the <strong>Audit Control Center</strong>. Choose <strong>Quick Scan</strong> to audit a single web page instantly, or select <strong>Sitemap Crawler</strong> to analyze a full XML sitemap.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 space-y-4 relative shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-base shadow-md">
                2
              </div>
              <Search className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">Input Target URL &amp; Options</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Enter your website URL (e.g. <code className="text-indigo-600 dark:text-indigo-300 font-mono">https://example.com</code>). Optionally, enter a target font name to highlight specific font matches or configure your Browserless API Key.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 space-y-4 relative shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white font-bold text-base shadow-md">
                3
              </div>
              <Download className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">Analyze Results &amp; Export</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Inspect font classifications, CTA button grids, missing alt tags, and heading hierarchy tables directly in the dashboard tabs or click <strong>Download Excel Report</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* 📬 Contact With Me Section */}
      <ContactSection />

      {/* 🏁 Bottom Call-to-Action Banner */}
      <div className="p-10 rounded-3xl bg-gradient-to-r from-blue-900/90 via-indigo-900/80 to-purple-900/90 dark:from-blue-900/50 dark:via-indigo-900/40 dark:to-purple-900/50 border border-blue-500/40 text-center space-y-6 shadow-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-semibold">
          <Award className="h-3.5 w-3.5 text-blue-300" />
          Ready to Audit Your Website?
        </div>
        <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
          Launch Your Website Audit Now
        </h3>
        <p className="text-slate-200 text-sm max-w-xl mx-auto leading-relaxed">
          Run your quick scan or full sitemap audit right now to uncover font licenses, design tokens, and accessibility tags.
        </p>
        <div>
          <Link
            href="/audit"
            className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-lg shadow-xl shadow-blue-500/30 transition-all transform hover:-translate-y-1 cursor-pointer"
          >
            <Zap className="h-5 w-5 fill-white text-white" />
            Start Now - Audit Control Center
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

