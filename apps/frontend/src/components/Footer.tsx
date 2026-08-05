"use client";

import React from "react";
import Link from "next/link";
import { Heart, ExternalLink, Sparkles, BookOpen, FileText, Home, LayoutDashboard, Mail, Scale } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl pt-12 pb-8 text-xs text-slate-600 dark:text-slate-400 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white text-sm">Website Audit</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Full website quality platform automating font licensing, CTA token auditing, accessibility compliance, and Excel report generation.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">Platform Pages</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <Home className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                  Home
                </Link>
              </li>
              <li>
                <Link href="/audit" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <LayoutDashboard className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                  Audit Center
                </Link>
              </li>
              <li>
                <Link href="/case-study" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400">
                  <BookOpen className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  Website Case Study (STAR)
                </Link>
              </li>
              <li>
                <Link href="/guides" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 font-medium text-indigo-600 dark:text-indigo-400">
                  <FileText className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  Audit &amp; Compliance Guides
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                  <Mail className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
                  <Scale className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  Terms &amp; Compliance
                </Link>
              </li>
            </ul>
          </div>

          {/* Audit Capabilities */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">Audit Suites</h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                Font Classification &amp; Licensing
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                CTA Design Token Inspector
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Missing Alt Tag Compliance
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Multi-Sheet Excel Export (.xlsx)
              </li>
            </ul>
          </div>

          {/* Developer / Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">Contact &amp; Customization</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Have an idea or need custom website auditing features? Let&apos;s talk.
            </p>
            <div className="space-y-1.5 pt-1">
              <div>
                <a
                  href="mailto:razibdpi@gmail.com"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  ✉ razibdpi@gmail.com
                </a>
              </div>
              <div>
                <a
                  href="https://www.razib.bd/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-900 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-semibold"
                >
                  🌐 Md. Razib Hossain (www.razib.bd)
                  <ExternalLink className="h-3 w-3 text-slate-400" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Value Highlights Banner */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800/80 space-y-3">
          <h5 className="text-center font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-200">
            Experience the freedom to audit.
          </h5>
          <div className="flex flex-wrap items-center justify-center gap-2.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
            <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm text-slate-900 dark:text-slate-200">
              <span>🎁</span> Try it Free
            </span>
            <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm text-slate-900 dark:text-slate-200">
              <span>🙌</span> Zero Friction Entry
            </span>
            <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm text-slate-900 dark:text-slate-200">
              <span>🔒</span> Secure &amp; Private
            </span>
            <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm text-slate-900 dark:text-slate-200">
              <span>📈</span> Scalable Usage
            </span>
            <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm text-slate-900 dark:text-slate-200">
              <span>✨</span> Professional Results
            </span>
            <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm text-slate-900 dark:text-slate-200">
              <span>📱</span> Any Device, Anywhere
            </span>
            <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm text-slate-900 dark:text-slate-200">
              <span>⬇️</span> Instant Results &amp; Downloads
            </span>
          </div>
        </div>

        {/* Compliance & Legal Disclaimer */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800/80 text-center max-w-7xl mx-auto">
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
            Disclaimer: This auditing tool is designed for website owners, managers, and authorized developers to analyze and test their own websites. Users are solely responsible for ensuring compliance with the Terms of Service, robots.txt directives, and copyrights of any target domains scanned or resources&nbsp;downloaded.
          </p>
        </div>

        {/* Bottom copyright bar */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>
            © {currentYear} Website Audit. All rights reserved.
          </span>

          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span>Developed with</span>
            <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" />
            <span>by</span>
            <a
              href="https://razib.bd/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-1 group underline underline-offset-4 decoration-blue-500/50"
            >
              Md. Razib Hossain
              <ExternalLink className="h-3 w-3 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
