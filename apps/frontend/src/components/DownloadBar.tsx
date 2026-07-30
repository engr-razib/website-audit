"use client";

import React from "react";
import { Download, FileSpreadsheet, FileCode, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";
import { getExcelDownloadUrl, getJsonDownloadUrl } from "@/lib/api";

interface DownloadBarProps {
  jobId: string;
}

export function DownloadBar({ jobId }: DownloadBarProps) {
  const excelUrl = getExcelDownloadUrl(jobId);
  const jsonUrl = getJsonDownloadUrl(jobId);

  return (
    <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-gradient-to-r from-emerald-50 via-white to-slate-50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm dark:shadow-none">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Full Audit Complete & Ready to Download</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Download styled 6-worksheet Excel workbook or complete structured JSON report.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <a href={excelUrl} download>
          <Button variant="glow" size="sm" className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Download Excel (.xlsx)
          </Button>
        </a>
        <a href={jsonUrl} download>
          <Button variant="outline" size="sm">
            <FileCode className="mr-2 h-4 w-4" />
            Download JSON
          </Button>
        </a>
      </div>
    </div>
  );
}
