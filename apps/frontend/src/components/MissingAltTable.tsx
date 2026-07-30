"use client";

import React from "react";
import { Badge } from "./ui/badge";
import { Image, ExternalLink, AlertTriangle } from "lucide-react";

interface MissingAltImage {
  src?: string;
  parentTag?: string;
  naturalWidth?: number;
  naturalHeight?: number;
  url?: string;
}

interface MissingAltTableProps {
  images: MissingAltImage[];
}

export function MissingAltTable({ images = [] }: MissingAltTableProps) {
  if (images.length === 0) {
    return (
      <div className="p-8 text-center text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-950/20 flex flex-col items-center gap-2">
        <span className="text-lg font-semibold">Great Job! 100% Alt Tag Coverage</span>
        <span className="text-xs text-emerald-600 dark:text-emerald-300/80">No images missing alt attributes were found across audited pages.</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
          <AlertTriangle className="h-4 w-4" />
          <span>Found {images.length} image(s) missing alt tags</span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 overflow-hidden shadow-sm dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-900/90 text-slate-700 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3 font-semibold">Image Source (src)</th>
                <th className="p-3 font-semibold">Parent Tag</th>
                <th className="p-3 font-semibold">Dimensions</th>
                <th className="p-3 font-semibold max-w-xs">Target Page URL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {images.map((img, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="p-3 font-mono text-[11px] text-slate-800 dark:text-slate-200 max-w-md">
                    <div className="flex items-center gap-3">
                      {img.src ? (
                        <div className="relative h-10 w-10 shrink-0 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center">
                          <img 
                            src={img.src} 
                            alt="Preview" 
                            className="h-full w-full object-contain hover:scale-125 transition-transform duration-150"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (img.url && !target.src.startsWith('http') && !target.src.startsWith('data:')) {
                                try {
                                  const base = new URL(img.url).origin;
                                  target.src = new URL(img.src || '', base).toString();
                                  return;
                                } catch (err) {}
                              }
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <Image className="h-5 w-5 text-slate-400 dark:text-slate-500 shrink-0" />
                      )}
                      <span className="truncate max-w-xs font-semibold text-slate-900 dark:text-slate-300" title={img.src}>
                        {img.src || ""}
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className="text-[10px]">
                      &lt;{img.parentTag || "div"}&gt;
                    </Badge>
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">
                    {img.naturalWidth && img.naturalHeight ? `${img.naturalWidth} × ${img.naturalHeight} px` : "Dynamic"}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                    {img.url ? (
                      <a
                        href={img.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                      >
                        <span className="truncate">{img.url}</span>
                        <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                      </a>
                    ) : (
                      ""
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
