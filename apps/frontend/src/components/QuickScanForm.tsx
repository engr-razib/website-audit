"use client";

import React, { useState } from "react";
import { Zap, Search, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { startQuickScan } from "@/lib/api";

interface QuickScanFormProps {
  onScanComplete: (data: any) => void;
}

export function QuickScanForm({ onScanComplete }: QuickScanFormProps) {
  const [url, setUrl] = useState("https://razib.bd");
  const [fontName, setFontName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);

    try {
      const res = await startQuickScan({ url, fontName });
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
              <label className="text-xs font-medium text-slate-300">Target Font Name</label>
              <Input
                value={fontName}
                onChange={(e) => setFontName(e.target.value)}
                placeholder="Enter your font name"
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
