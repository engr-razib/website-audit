"use client";

import React, { useState } from "react";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Search, ExternalLink } from "lucide-react";

interface HeadingItem {
  tag?: string;
  level?: string;
  text?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  url?: string;
}

interface HeadingAuditTableProps {
  headings: HeadingItem[];
}

export function HeadingAuditTable({ headings = [] }: HeadingAuditTableProps) {
  const [search, setSearch] = useState("");

  const filtered = headings.filter((h) => {
    const text = h.text || "";
    const font = h.fontFamily || "";
    const url = h.url || "";
    const query = search.toLowerCase();
    return (
      text.toLowerCase().includes(query) ||
      font.toLowerCase().includes(query) ||
      url.toLowerCase().includes(query)
    );
  });

  if (headings.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
        No headings detected on the audited pages.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <Input
            placeholder="Search heading text, font family, or URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400">
          Showing {filtered.length} of {headings.length} detected headings
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 overflow-hidden shadow-sm dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-900/90 text-slate-700 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3 font-semibold w-12 text-center">SL</th>
                <th className="p-3 font-semibold w-16">Level</th>
                <th className="p-3 font-semibold">Heading Text</th>
                <th className="p-3 font-semibold">Font Family</th>
                <th className="p-3 font-semibold">Size & Weight</th>
                <th className="p-3 font-semibold max-w-xs">Target Page URL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    No headings found matching your filter.
                  </td>
                </tr>
              ) : (
                filtered.slice(0, 100).map((h, idx) => {
                  const tag = (h.tag || h.level || "h2").toUpperCase();
                  const isH1 = tag === "H1";

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                      <td className="p-3">
                        <Badge variant={isH1 ? "purple" : "secondary"} className="font-mono text-[10px]">
                          {tag}
                        </Badge>
                      </td>
                      <td className="p-3 font-medium text-slate-900 dark:text-white max-w-md truncate" title={h.text}>
                        {h.text || "Empty Heading"}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{h.fontFamily?.split(",")[0] || "Default"}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        {h.fontSize || ""} / {h.fontWeight || "400"}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {h.url ? (
                          <a
                            href={h.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-all truncate"
                          >
                            <span className="truncate">{h.url}</span>
                            <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
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
