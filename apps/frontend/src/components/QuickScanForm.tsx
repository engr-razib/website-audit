"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Search, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select } from "./ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { startQuickScan } from "@/lib/api";

interface QuickScanFormProps {
  onScanComplete: (data: any, findingValue: string) => void;
}

export function QuickScanForm({ onScanComplete }: QuickScanFormProps) {
  const [url, setUrl] = useState("https://razib.bd");
  const [findingType, setFindingType] = useState<"font" | "image" | "text" | "cta" | "all">("font");
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
        onScanComplete(res.auditResult, findingValue);
      }
    } catch (err: any) {
      setError(err.message || "Failed to scan page");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-blue-200 dark:border-blue-900/30 bg-white/80 dark:bg-slate-900/80 shadow-md dark:shadow-xl backdrop-blur-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-slate-900 dark:text-white">
          <Zap className="h-5 w-5 text-amber-500 fill-amber-500/20" />
          Single Page Quick Scan
        </CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400">
          Run an instant synchronous audit on any single URL to analyze fonts, CTAs, alt tags, and SEO tags.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Target Page URL</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
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
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Finding Type</label>
              <Select
                value={findingType}
                onChange={(e) => setFindingType(e.target.value as any)}
              >
                <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Findings</option>
                <option value="font" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Font Family</option>
                <option value="image" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Image Name / Src</option>
                <option value="text" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Text Content</option>
                <option value="cta" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Button with CTA Text</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
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
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-3 text-xs rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-300"
            >
              {error}
            </motion.div>
          )}

          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button
              type="submit"
              disabled={loading}
              variant="glow"
              className="w-full md:w-auto cursor-pointer"
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
          </motion.div>
        </form>
      </CardContent>
    </Card>
  );
}

