"use client";

import React, { useState } from "react";
import { FileSpreadsheet, FileCode, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { API_BASE, getExcelDownloadUrl, getJsonDownloadUrl } from "@/lib/api";

interface DownloadBarProps {
  jobId?: string | null;
  auditData?: any;
}

export function DownloadBar({ jobId, auditData }: DownloadBarProps) {
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [downloadingJson, setDownloadingJson] = useState(false);

  const handleDownloadExcel = async () => {
    setDownloadingExcel(true);
    try {
      let res: Response;
      let filename = `website_audit_report_${Date.now()}.xlsx`;

      if (jobId) {
        const excelUrl = getExcelDownloadUrl(jobId);
        res = await fetch(excelUrl);
        filename = `website_audit_report_${jobId.slice(0, 8)}.xlsx`;
      } else if (auditData) {
        res = await fetch(`${API_BASE}/audit/export/excel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(auditData),
        });
        filename = `website_audit_report_quick_scan.xlsx`;
      } else {
        throw new Error("No audit data available to download.");
      }

      if (!res.ok) {
        throw new Error("Failed to download Excel file. Server returned an error.");
      }

      const arrayBuffer = await res.arrayBuffer();
      const blob = new Blob([arrayBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || "Failed to download Excel file.");
    } finally {
      setDownloadingExcel(false);
    }
  };

  const handleDownloadJson = async () => {
    setDownloadingJson(true);
    try {
      let blob: Blob;
      let filename = `website_audit_report_${Date.now()}.json`;

      if (jobId) {
        const jsonUrl = getJsonDownloadUrl(jobId);
        const res = await fetch(jsonUrl);
        if (!res.ok) throw new Error("JSON report file not available.");
        const arrayBuffer = await res.arrayBuffer();
        blob = new Blob([arrayBuffer], { type: "application/json" });
        filename = `website_audit_report_${jobId.slice(0, 8)}.json`;
      } else if (auditData) {
        const jsonString = JSON.stringify(auditData, null, 2);
        blob = new Blob([jsonString], { type: "application/json" });
        filename = `website_audit_report_quick_scan.json`;
      } else {
        throw new Error("No audit data available to download.");
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || "Failed to download JSON file.");
    } finally {
      setDownloadingJson(false);
    }
  };

  return (
    <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-gradient-to-r from-emerald-50 via-white to-slate-50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm dark:shadow-none">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
            Audit Complete & Ready to Export
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Download styled 6-worksheet Excel workbook (.xlsx) or raw JSON report.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Button
          onClick={handleDownloadExcel}
          disabled={downloadingExcel}
          variant="glow"
          size="sm"
          className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white cursor-pointer"
        >
          {downloadingExcel ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Excel...
            </>
          ) : (
            <>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Download Excel (.xlsx)
            </>
          )}
        </Button>

        <Button
          onClick={handleDownloadJson}
          disabled={downloadingJson}
          variant="outline"
          size="sm"
          className="cursor-pointer"
        >
          {downloadingJson ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Preparing JSON...
            </>
          ) : (
            <>
              <FileCode className="mr-2 h-4 w-4" />
              Download JSON
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

