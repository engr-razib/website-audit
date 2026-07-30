"use client";

import React, { useState } from "react";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Search, ShieldAlert, Sparkles, ExternalLink } from "lucide-react";

interface FontItem {
  cleanFontFamily?: string;
  rawFontFamily?: string;
  category?: string;
  licenseType?: string;
  usageContext?: string;
  pageCount?: number;
  url?: string;
  urls?: string[];
}

interface FontAuditTableProps {
  fonts: FontItem[];
}

export function FontAuditTable({ fonts = [] }: FontAuditTableProps) {
  const [search, setSearch] = useState("");

  const filtered = fonts.filter((f) => {
    const name = f.cleanFontFamily || f.rawFontFamily || "";
    const url = f.url || (f.urls ? f.urls.join(" ") : "");
    const query = search.toLowerCase();
    return name.toLowerCase().includes(query) || url.toLowerCase().includes(query);
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <Input
            placeholder="Search font family name or URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400">
          Showing {filtered.length} of {fonts.length} unique font families
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 overflow-hidden shadow-sm dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-900/90 text-slate-700 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3 font-semibold">Font Family</th>
                <th className="p-3 font-semibold">Classification / License</th>
                <th className="p-3 font-semibold">Usage Context</th>
                <th className="p-3 font-semibold">Page Frequency</th>
                <th className="p-3 font-semibold">Font Sample Preview</th>
                <th className="p-3 font-semibold max-w-xs">Target Page URL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    No fonts found matching your filter.
                  </td>
                </tr>
              ) : (
                filtered.map((font, idx) => {
                  const name = font.cleanFontFamily || font.rawFontFamily || "Unknown";
                  const isPremium =
                    font.licenseType?.includes("Premium") ||
                    font.licenseType?.includes("Commercial") ||
                    font.category?.includes("Commercial");

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                        {isPremium ? (
                          <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
                        ) : (
                          <Sparkles className="h-4 w-4 text-blue-500 shrink-0" />
                        )}
                        {name?.trim() ? (
                            <ul className="text-wrap list-decimal list-inside">
                              {name
                                .split(',')
                                .map((item) => item.trim())
                                .filter(Boolean)
                                .map((item, index) => (
                                  <li key={index}>{item}</li>
                                ))}
                            </ul>
                          ) : null}
                      </td>
                      <td className="p-3 w-[18%] overflow-hidden truncate" title={font.licenseType || font.category || (isPremium ? "Premium Font" : "Free / Standard")}>
                        <Badge variant={isPremium ? "warning" : "success"}>
                          {font.licenseType || font.category || (isPremium ? "Premium Font" : "Free / Standard")}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 overflow-hidden truncate" title={font.usageContext || "Rendered DOM Elements"}>{font.usageContext || "Rendered DOM Elements"}</td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-900 dark:text-white">{font.pageCount || 1}</span> page(s)
                      </td>
                      <td className="p-3 text-sm text-slate-800 dark:text-slate-200" style={{ fontFamily: name }}>
                        The quick brown fox jumps over the lazy dog
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {font.url ? (
                          <a
                            href={font.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-all truncate"
                          >
                            <span className="truncate">{font.url}</span>
                            <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                          </a>
                        ) : font.urls && font.urls.length > 0 ? (
                          <div className="space-y-0.5">
                            {font.urls.slice(0, 2).map((u: string, i: number) => (
                              <a
                                key={i}
                                href={u}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-all truncate text-[11px]"
                              >
                                <span className="truncate">{u}</span>
                                <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                              </a>
                            ))}
                            {font.urls.length > 2 && (
                              <span className="text-[10px] text-slate-500">+{font.urls.length - 2} more pages</span>
                            )}
                          </div>
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
