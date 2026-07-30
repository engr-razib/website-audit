"use client";

import React, { useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";

interface CTAItem {
  text?: string;
  tag?: string;
  tagName?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  backgroundColor?: string;
  color?: string;
  borderRadius?: string;
  padding?: string;
  selector?: string;
  url?: string;
  cssStyles?: string;
}

interface ButtonAuditGridProps {
  ctas: CTAItem[];
}

export function ButtonAuditGrid({ ctas = [] }: ButtonAuditGridProps) {
  const [search, setSearch] = useState("");

  const filtered = ctas.filter((cta) => {
    const text = cta.text || "";
    const selector = cta.selector || "";
    const url = cta.url || "";
    const css = cta.cssStyles || "";
    const query = search.toLowerCase();
    return (
      text.toLowerCase().includes(query) ||
      selector.toLowerCase().includes(query) ||
      url.toLowerCase().includes(query) ||
      css.toLowerCase().includes(query)
    );
  });

  const getButtonStyle = (cta: CTAItem): React.CSSProperties => {
    const styleObj: React.CSSProperties = {
      backgroundColor: cta.backgroundColor || "transparent",
      color: cta.color || "inherit",
      fontFamily: cta.fontFamily,
      fontSize: cta.fontSize,
      fontWeight: cta.fontWeight,
      borderRadius: cta.borderRadius,
      padding: cta.padding || "6px 12px",
    };

    if (cta.cssStyles) {
      const rules = cta.cssStyles.split(";");
      for (const rule of rules) {
        const [k, v] = rule.split(":").map((s) => s.trim());
        if (k && v) {
          const camelKey = k.replace(/-([a-z])/g, (_, g) => g.toUpperCase());
          (styleObj as any)[camelKey] = v;
        }
      }
    }
    return styleObj;
  };

  if (ctas.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
        No Call-To-Action (CTA) buttons detected on the audited pages.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <Input
            placeholder="Search CTA text, selector, or style..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400">
          Showing {filtered.length} of {ctas.length} CTA button elements
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 overflow-hidden shadow-sm dark:shadow-none">
        <div className="max-h-[520px] overflow-auto relative">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 shadow-sm">
              <tr>
                <th className="p-3 font-semibold w-12 text-center">SL</th>
                <th className="p-3 font-semibold">Simulated Button Preview</th>
                <th className="p-3 font-semibold">Tag & Selector</th>
                <th className="p-3 font-semibold">CTA Text</th>
                <th className="p-3 font-semibold">Style</th>
                <th className="p-3 font-semibold max-w-xs">Target Page URL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    No CTA buttons found matching your filter.
                  </td>
                </tr>
              ) : (
                filtered.map((cta, idx) => {
                  const tag = cta.tag || cta.tagName || "button";
                  const buttonStyle = getButtonStyle(cta);

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                      <td className="p-3">
                        <div className="py-2 px-3 inline-flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                          <button
                            type="button"
                            style={buttonStyle}
                            className="max-w-[200px] truncate shadow-sm pointer-events-none text-xs"
                          >
                            {cta.text || "Click Here"}
                          </button>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <Badge variant="outline" className="text-[10px]">
                            &lt;{tag}&gt;
                          </Badge>
                          <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[150px]" title={cta.selector}>
                            {cta.selector || ".btn"}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white max-w-[180px] truncate" title={cta.text}>
                        {cta.text || "Click Here"}
                      </td>
                      <td className="p-3">
                        <div className="space-y-1 max-w-xs">
                          {cta.cssStyles ? (
                            <div className="max-h-20 overflow-y-auto text-[10px] font-mono p-1.5 bg-slate-900 dark:bg-slate-950 rounded border border-slate-800 text-blue-400 whitespace-pre-wrap scrollbar-thin">
                              {cta.cssStyles}
                            </div>
                          ) : (
                            <div className="space-y-0.5 text-[11px]">
                              <div><span className="text-slate-500">Font:</span> {cta.fontFamily?.split(",")[0] || "Default"}</div>
                              <div><span className="text-slate-500">Specs:</span> {cta.fontSize || "16px"} / {cta.fontWeight || "400"}</div>
                              <div><span className="text-slate-500">Box:</span> r:{cta.borderRadius || "0px"} | p:{cta.padding || "auto"}</div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {cta.url ? (
                          <a
                            href={cta.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-all truncate"
                          >
                            <span className="truncate">{cta.url}</span>
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
