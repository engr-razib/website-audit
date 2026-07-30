"use client";

import React, { useState } from "react";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Search, ExternalLink } from "lucide-react";

interface SeoItem {
  url?: string;
  title?: string;
  titleLength?: number;
  isTitleValid?: boolean;
  metaDescription?: string;
  metaDescLength?: number;
  isMetaDescValid?: boolean;
  h1Count?: number;
  hasSingleH1?: boolean;
  hasCanonical?: boolean;
  canonicalUrl?: string;
  altCoveragePercent?: number;
}

interface SeoAuditTableProps {
  seoList: SeoItem[];
}

export function SeoAuditTable({ seoList = [] }: SeoAuditTableProps) {
  const [search, setSearch] = useState("");

  const filtered = seoList.filter((item) => {
    const url = item.url || "";
    const title = item.title || "";
    const meta = item.metaDescription || "";
    const query = search.toLowerCase();
    return (
      url.toLowerCase().includes(query) ||
      title.toLowerCase().includes(query) ||
      meta.toLowerCase().includes(query)
    );
  });

  if (seoList.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
        No SEO audit data available for the audited pages.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <Input
            placeholder="Search page URL, title, or meta description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400">
          Showing {filtered.length} of {seoList.length} audited page SEO rules
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 overflow-hidden shadow-sm dark:shadow-none">
        <div className="max-h-[520px] overflow-auto relative">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 shadow-sm">
              <tr>
                <th className="p-3 font-semibold w-12 text-center">SL</th>
                <th className="p-3 font-semibold max-w-xs">Target Page URL</th>
                <th className="p-3 font-semibold">Page Title Text (30-60 chars)</th>
                <th className="p-3 font-semibold">Meta Description (50-160 chars)</th>
                <th className="p-3 font-semibold text-center">H1 Count</th>
                <th className="p-3 font-semibold text-center">Canonical Tag</th>
                <th className="p-3 font-semibold text-center">Alt Coverage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">
                    No SEO records found matching your filter.
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => {
                  const titleLen = item.titleLength ?? (item.title ? item.title.length : 0);
                  const isTitleOk = item.isTitleValid ?? (titleLen >= 30 && titleLen <= 60);

                  const metaLen = item.metaDescLength ?? (item.metaDescription ? item.metaDescription.length : 0);
                  const isMetaOk = item.isMetaDescValid ?? (metaLen >= 50 && metaLen <= 160);

                  const h1Count = item.h1Count ?? 0;
                  const isH1Ok = item.hasSingleH1 ?? (h1Count === 1);

                  const hasCanonical = item.hasCanonical ?? !!item.canonicalUrl;
                  const altPercent = item.altCoveragePercent ?? 100;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                      <td className="p-3 font-medium text-slate-900 dark:text-white max-w-xs truncate">
                        {item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-all"
                          >
                            <span className="truncate">{item.url}</span>
                            <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="p-3 max-w-xs">
                        <div className="space-y-1">
                          <div className="font-medium text-slate-900 dark:text-slate-100 truncate" title={item.title || "(Missing Title)"}>
                            {item.title || <span className="text-red-500 italic">(Missing Title)</span>}
                          </div>
                          <Badge variant={isTitleOk ? "success" : "warning"} className="text-[10px] py-0">
                            {titleLen} chars ({isTitleOk ? "Valid" : titleLen < 30 ? "Too Short" : "Too Long"})
                          </Badge>
                        </div>
                      </td>
                      <td className="p-3 max-w-xs">
                        <div className="space-y-1">
                          <div className="text-slate-600 dark:text-slate-400 truncate" title={item.metaDescription || "(Missing Meta Description)"}>
                            {item.metaDescription || <span className="text-red-500 italic">(Missing Description)</span>}
                          </div>
                          <Badge variant={isMetaOk ? "success" : "warning"} className="text-[10px] py-0">
                            {metaLen} chars ({isMetaOk ? "Valid" : metaLen < 50 ? "Too Short" : "Too Long"})
                          </Badge>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant={isH1Ok ? "success" : "destructive"} className="text-[10px]">
                          {h1Count} H1 ({isH1Ok ? "OK" : h1Count === 0 ? "Missing" : "Multiple"})
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant={hasCanonical ? "success" : "secondary"} className="text-[10px]">
                          {hasCanonical ? "YES" : "NO"}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant={altPercent >= 100 ? "success" : altPercent >= 80 ? "warning" : "destructive"} className="text-[10px]">
                          {altPercent}%
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
