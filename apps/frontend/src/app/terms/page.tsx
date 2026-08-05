"use client";

import React from "react";
import Link from "next/link";
import { Scale, ShieldAlert, Sparkles } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-8 pb-16 space-y-12">
      {/* Top Header & Breadcrumb */}
      <div className="border-b border-slate-200 dark:border-slate-800/80 pb-8 space-y-4 transition-colors">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-slate-200 font-medium">Terms of Service</span>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-xs font-semibold">
            <Scale className="h-3.5 w-3.5" />
            Legal &amp; Compliance Policy
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Terms of Service &amp; Disclaimer
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
            Last Updated: August 6, 2026. Please read these terms carefully before using our Website Audit and Crawling engine.
          </p>
        </div>
      </div>

      {/* Terms Content Sections */}
      <div className="space-y-8 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs">1</span>
            Acceptance of Terms
          </h2>
          <p>
            By accessing and using this Website Audit Platform (the &quot;Service&quot;), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree to these terms, you must immediately cease all use of this Service.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs">2</span>
            Authorized Auditing &amp; Crawling Policy
          </h2>
          <p>
            Our Service offers automated SEO, performance, accessibility, and design audits (including font classifications, CTA button token scans, and image assets retrieval).
          </p>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2 text-slate-800 dark:text-slate-200">
            <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400 text-sm">
              <ShieldAlert className="h-4 w-4" />
              IMPORTANT COMPLIANCE MANDATE:
            </div>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
              <li>You may only submit websites that you own, operate, or have express written permission to scan.</li>
              <li>You must respect the target website&apos;s <code>robots.txt</code> instructions. Our automated backend crawler rejects URLs blocked by robots policies.</li>
              <li>You must not execute audits at rate speeds designed to cause a Denial of Service (DoS) or server overload on any target host.</li>
            </ul>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs">3</span>
            No Warranty &amp; Accuracy Disclaimer
          </h2>
          <p>
            The Service and all generated reports (including Excel spreadsheets) are provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis:
          </p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li><strong>Font Licensing Classifications:</strong> While we detect and estimate whether a font is free (e.g. Google Fonts) or commercial, this classification is for auditing purposes only and does NOT constitute formal legal advice. You must verify and purchase licenses directly from the font creators or authorized vendors.</li>
            <li><strong>Audit Metrics:</strong> We do not guarantee that the audit results are completely error-free, exhaustive, or compliant with all legal standards (such as full WCAG ADA guidelines).</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs">4</span>
            Limitation of Liability
          </h2>
          <p>
            In no event shall the platform owner, developers, or affiliates be liable for any direct, indirect, incidental, special, or consequential damages. This includes, but is not limited to:
          </p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>Any IP blocklisting or firewalls triggered by target hosting providers during scans.</li>
            <li>Target server outages, latency spikes, or bandwidth costs caused by crawling operations.</li>
            <li>Copyright disputes or licensing violations arising from images or font files crawled, exported, or downloaded by users.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs">5</span>
            Contact Information
          </h2>
          <p>
            If you have any questions or require support regarding these terms, please contact the developer:
          </p>
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm">
            <p className="font-semibold text-slate-900 dark:text-white">Md. Razib Hossain</p>
            <p className="text-slate-600 dark:text-slate-400">Email: <a href="mailto:razibdpi@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">razibdpi@gmail.com</a></p>
            <p className="text-slate-600 dark:text-slate-400">Website: <a href="https://www.razib.bd/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">www.razib.bd</a></p>
          </div>
        </section>
      </div>
    </div>
  );
}
