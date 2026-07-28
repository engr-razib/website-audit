"use client";

import React from "react";
import { Heart, ExternalLink, Sparkles } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-xl py-6 text-xs text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span>
            © {currentYear} Website Audit AI. All rights reserved.
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-300">
          <span>Developed with</span>
          <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" />
          <span>by</span>
          <a
            href="https://razib.bd/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-white hover:text-blue-400 transition-colors inline-flex items-center gap-1 group underline underline-offset-4 decoration-blue-500/50"
          >
            Md. Razib Hossain
            <ExternalLink className="h-3 w-3 text-slate-400 group-hover:text-blue-400 transition-colors" />
          </a>
        </div>
      </div>
    </footer>
  );
}
