"use client";

import React, { useState } from "react";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Search, ShieldAlert, Sparkles } from "lucide-react";

interface FontItem {
  cleanFontFamily?: string;
  rawFontFamily?: string;
  category?: string;
  licenseType?: string;
  usageContext?: string;
  pageCount?: number;
}

interface FontAuditTableProps {
  fonts: FontItem[];
}

export function FontAuditTable({ fonts = [] }: FontAuditTableProps) {
  const [search, setSearch] = useState("");

  const filtered = fonts.filter((f) => {
    const name = f.cleanFontFamily || f.rawFontFamily || "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search font family name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
        <div className="text-xs text-slate-400">
          Showing {filtered.length} of {fonts.length} unique font families
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3 font-semibold">Font Family</th>
                <th className="p-3 font-semibold">Classification / License</th>
                <th className="p-3 font-semibold">Usage Context</th>
                <th className="p-3 font-semibold">Page Frequency</th>
                <th className="p-3 font-semibold">Font Sample Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
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
                    <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 font-medium text-white flex items-center gap-2">
                        {isPremium ? (
                          <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
                        ) : (
                          <Sparkles className="h-4 w-4 text-blue-400 shrink-0" />
                        )}
                        <span>{name}</span>
                      </td>
                      <td className="p-3">
                        <Badge variant={isPremium ? "warning" : "success"}>
                          {font.licenseType || font.category || (isPremium ? "Premium Font" : "Free / Standard")}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-400">{font.usageContext || "Rendered DOM Elements"}</td>
                      <td className="p-3">
                        <span className="font-semibold text-white">{font.pageCount || 1}</span> page(s)
                      </td>
                      <td className="p-3 text-sm" style={{ fontFamily: name }}>
                        The quick brown fox jumps over the lazy dog
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
