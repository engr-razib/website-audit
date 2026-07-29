"use client";

import React from "react";
import { Badge } from "./ui/badge";
import { ExternalLink, Cpu } from "lucide-react";

interface PageItem {
  url: string;
  engine?: string;
  fonts?: any[];
  ctas?: any[];
  images?: any[];
  headings?: any[];
}

interface PagesAuditedTableProps {
  pages: PageItem[];
}

export function PagesAuditedTable({ pages = [] }: PagesAuditedTableProps) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3 font-semibold">Page URL</th>
                <th className="p-3 font-semibold">Audit Engine</th>
                <th className="p-3 font-semibold text-center">Fonts</th>
                <th className="p-3 font-semibold text-center">CTAs</th>
                <th className="p-3 font-semibold text-center">No-Alt Img</th>
                <th className="p-3 font-semibold text-center">Headings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {pages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    No pages audited.
                  </td>
                </tr>
              ) : (
                pages.map((p, idx) => {
                  const noAltCount = (p.images || []).filter((i: any) => !i.hasAlt).length;
                  const engine = p.engine || "Playwright";
                  const isPlaywright = engine.includes("Playwright");

                  return (
                    <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 font-medium text-white max-w-sm truncate">
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 hover:text-blue-400 hover:underline transition-all"
                        >
                          {p.url}
                          <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                        </a>
                      </td>
                      <td className="p-3">
                        <Badge variant={isPlaywright ? "success" : "secondary"} className="gap-1 py-0.5">
                          <Cpu className="h-3 w-3 shrink-0" />
                          {engine}
                        </Badge>
                      </td>
                      <td className="p-3 text-center font-mono text-slate-400">{(p.fonts || []).length}</td>
                      <td className="p-3 text-center font-mono text-slate-400">{(p.ctas || []).length}</td>
                      <td className="p-3 text-center font-mono text-slate-400">{noAltCount}</td>
                      <td className="p-3 text-center font-mono text-slate-400">{(p.headings || []).length}</td>
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
