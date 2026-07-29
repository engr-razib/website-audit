"use client";

import React, { useState } from "react";
import { Zap, Search, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select } from "./ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { startQuickScan } from "@/lib/api";

interface QuickScanFormProps {
  onScanComplete: (data: any) => void;
}

export function QuickScanForm({ onScanComplete }: QuickScanFormProps) {
  const [url, setUrl] = useState("https://razib.bd");
  const [findingType, setFindingType] = useState<"all" | "font" | "image" | "text" | "cta">("font");
  const [findingValue, setFindingValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);

    try {
      const res = await startQuickScan({
        url,
        findingType,
        findingValue: findingValue || (findingType === "font" ? "Dinot" : "")
      });
      if (res.auditResult) {
        onScanComplete(res.auditResult);
      }
    } catch (err: any) {
      setError(err.message || "Failed to scan page");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-blue-900/30 bg-slate-900/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-white">
          <Zap className="h-5 w-5 text-amber-400 fill-amber-400/20" />
          Single Page Quick Scan
        </CardTitle>
        <CardDescription className="text-slate-400">
          Run an instant synchronous audit on any single URL to analyze fonts, CTAs, alt tags, and SEO tags.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Target Page URL</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://razib.bd"
                  className="pl-9"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Finding Type</label>
              <Select
                value={findingType}
                onChange={(e) => setFindingType(e.target.value as any)}
                className="bg-slate-950 text-slate-200 border-slate-800"
              >
                <option value="all" className="bg-slate-900 text-white">All Findings</option>
                <option value="font" className="bg-slate-900 text-white">Font Family</option>
                <option value="image" className="bg-slate-900 text-white">Image Name / Src</option>
                <option value="text" className="bg-slate-900 text-white">Text Content</option>
                <option value="cta" className="bg-slate-900 text-white">Button with CTA Text</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                {findingType === "all" && "Search Substring (Optional)"}
                {findingType === "font" && "Target Font Family (Optional)"}
                {findingType === "image" && "Image Filename/URL (Optional)"}
                {findingType === "text" && "Text in Page (Optional)"}
                {findingType === "cta" && "Button CTA Text (Optional)"}
              </label>
              <Input
                value={findingValue}
                onChange={(e) => setFindingValue(e.target.value)}
                placeholder={
                  findingType === "all" ? "Leave empty for all elements" :
                  findingType === "font" ? "e.g. Dinot (Empty for all)" :
                  findingType === "image" ? "e.g. logo.png (Empty for all)" :
                  findingType === "text" ? "e.g. Register (Empty for all)" :
                  "e.g. Submit (Empty for all)"
                }
              />
            </div>
          </div>

          {error && (
            <div className="p-3 text-xs rounded-lg bg-red-950/50 border border-red-800/50 text-red-300">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            variant="glow"
            className="w-full md:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Crawling & Analyzing Page...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Run Quick Scan
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
