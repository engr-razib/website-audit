"use client";

import React from "react";
import { Type, MousePointer, Image, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent } from "./ui/card";

interface SummaryCardsProps {
  summary: {
    totalPagesAudited: number;
    uniqueFontsFound: number;
    totalCTAsFound: number;
    missingAltImagesCount: number;
    targetFontElementMatches?: number;
    targetFontStyleMatches?: number;
  };
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const targetMatches = (summary.targetFontElementMatches || 0) + (summary.targetFontStyleMatches || 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <Card className="border-slate-800 bg-slate-900/60">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Pages Audited</span>
            <FileText className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-white">{summary.totalPagesAudited}</div>
            <div className="text-[11px] text-slate-400"> crawled pages</div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900/60">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Unique Fonts</span>
            <Type className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-white">{summary.uniqueFontsFound}</div>
            <div className="text-[11px] text-slate-400"> font families</div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900/60">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">CTA Buttons</span>
            <MousePointer className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-white">{summary.totalCTAsFound}</div>
            <div className="text-[11px] text-slate-400"> button elements</div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900/60">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Missing Alt Tags</span>
            <Image className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-white">{summary.missingAltImagesCount}</div>
            <div className="text-[11px] text-slate-400"> images without alt</div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900/60 col-span-2 md:col-span-1">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Target Font Hits</span>
            {targetMatches > 0 ? (
              <AlertCircle className="h-4 w-4 text-red-400" />
            ) : (
              <CheckCircle className="h-4 w-4 text-emerald-400" />
            )}
          </div>
          <div className="mt-2">
            <div className={`text-2xl font-bold ${targetMatches > 0 ? "text-red-400" : "text-emerald-400"}`}>
              {targetMatches}
            </div>
            <div className="text-[11px] text-slate-400"> target font instances</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
