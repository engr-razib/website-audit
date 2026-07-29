"use client";

import React, { useState } from "react";
import { Badge } from "./ui/badge";
import { ExternalLink, Sparkles, Image, MousePointer, Type, Eye } from "lucide-react";
import { API_BASE } from "@/lib/api";

interface TargetMatchItem {
  elementId?: string;
  tagName?: string;
  selector?: string;
  fontFamily?: string;
  fontWeight?: string;
  textSnippet?: string;
  outerHTML?: string;
  cssStyles?: string;
  screenshotName?: string;
  matchType?: string;
  url?: string;
}

interface TargetMatchesTableProps {
  matches: TargetMatchItem[];
  jobId?: string | null;
}

export function TargetMatchesTable({ matches = [], jobId = null }: TargetMatchesTableProps) {
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  if (matches.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 rounded-xl border border-slate-800 bg-slate-950/40">
        No matched elements found for the selected finding criteria. Try checking your search term or running a new scan.
      </div>
    );
  }

  const backendBase = API_BASE.replace("/api", "");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5 text-indigo-400 font-medium">
          <Sparkles className="h-4 w-4" />
          <span>Found {matches.length} matching element(s)</span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3 font-semibold w-12 text-center">SL</th>
                <th className="p-3 font-semibold w-32">Match Type</th>
                <th className="p-3 font-semibold w-40">Tag / Selector</th>
                <th className="p-3 font-semibold w-48">Text Snippet</th>
                <th className="p-3 font-semibold">Full HTML Tag</th>
                <th className="p-3 font-semibold">Relevant CSS Styles</th>
                {jobId && <th className="p-3 font-semibold w-24 text-center">Screenshot</th>}
                <th className="p-3 font-semibold max-w-xs">Page URL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {matches.map((m, idx) => {
                const isFont = m.matchType === "Font";
                const isImg = m.matchType === "Image";
                const isCTA = m.matchType === "CTA Button";

                return (
                  <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                    <td className="p-3">
                      <Badge variant={isFont ? "success" : isCTA ? "purple" : isImg ? "warning" : "default"}>
                        {m.matchType || "Target Match"}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="space-y-1">
                        <span className="font-mono text-[10px] text-white bg-slate-900 border border-slate-800 px-1 py-0.5 rounded">
                          &lt;{m.tagName || "div"}&gt;
                        </span>
                        <div className="font-mono text-[10px] text-slate-400 truncate max-w-[150px]" title={m.selector}>
                          {m.selector}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 max-w-[180px] truncate" title={m.textSnippet}>
                      {m.textSnippet || "N/A"}
                    </td>
                    <td className="p-3">
                      <div className="max-h-16 overflow-y-auto text-[10px] font-mono p-1.5 bg-slate-950 rounded border border-slate-900 text-emerald-400 w-64 max-w-xs whitespace-pre-wrap scrollbar-thin">
                        {m.outerHTML}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="max-h-16 overflow-y-auto text-[10px] font-mono p-1.5 bg-slate-950 rounded border border-slate-900 text-blue-400 w-64 max-w-xs whitespace-pre-wrap scrollbar-thin">
                        {m.cssStyles}
                      </div>
                    </td>
                    {jobId && (
                      <td className="p-3 text-center">
                        {m.screenshotName && m.screenshotName !== "N/A" ? (
                          <button
                            type="button"
                            onClick={() => setSelectedScreenshot(`${backendBase}/outputs/${jobId}/${m.screenshotName}`)}
                            className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-1 rounded border border-indigo-500/25"
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500">N/A</span>
                        )}
                      </td>
                    )}
                    <td className="p-3 text-slate-400 max-w-xs truncate">
                      {m.url ? (
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 hover:text-blue-400 transition-colors truncate"
                        >
                          <span className="truncate">{m.url}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedScreenshot && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedScreenshot(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl p-2">
            <img 
              src={selectedScreenshot} 
              alt="Element Screenshot" 
              className="max-w-full max-h-[75vh] object-contain rounded-lg border border-slate-950" 
            />
            <div className="mt-2 text-center text-xs text-slate-400 font-mono">
              Click anywhere to close preview
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
