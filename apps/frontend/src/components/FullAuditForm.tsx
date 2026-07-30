"use client";

import React, { useState } from "react";
import { Globe, Layers, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select } from "./ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { startFullAudit } from "@/lib/api";

interface FullAuditFormProps {
  onJobStarted: (jobId: string, findingValue: string) => void;
}

export function FullAuditForm({ onJobStarted }: FullAuditFormProps) {
  const [urlMode, setUrlMode] = useState<"sitemap" | "crawl" | "list">("sitemap");
  const [sitemapUrl, setSitemapUrl] = useState("https://razib.bd/sitemap.xml");
  const [crawlUrl, setCrawlUrl] = useState("https://razib.bd");
  const [urlListText, setUrlListText] = useState("https://razib.bd\nhttps://razib.bd/about");

  const [findingType, setFindingType] = useState<"font" | "image" | "text" | "cta" | "all">("font");
  const [findingValue, setFindingValue] = useState("");
  const [maxPages, setMaxPages] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (urlMode === "sitemap" && !sitemapUrl) return;
    if (urlMode === "crawl" && !crawlUrl) return;
    if (urlMode === "list" && !urlListText) return;

    setLoading(true);
    setError(null);

    const payload: any = {
      findingType,
      findingValue: findingValue || (findingType === "font" ? "Dinot" : ""),
      fontName: findingValue || (findingType === "font" ? "Dinot" : ""),
      maxPages: Math.min(Number(maxPages), 50),
    };

    if (urlMode === "sitemap") {
      payload.sitemapUrl = sitemapUrl;
    } else if (urlMode === "crawl") {
      payload.crawlUrl = crawlUrl;
    } else if (urlMode === "list") {
      const urls = urlListText
        .split("\n")
        .map((u) => u.trim())
        .filter((u) => u.length > 0);
      payload.urls = urls;
    }

    try {
      const res = await startFullAudit(payload);
      if (res.jobId) {
        onJobStarted(res.jobId, findingValue);
      }
    } catch (err: any) {
      setError(err.message || "Failed to start full site audit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-slate-200 dark:border-indigo-900/30 bg-white/80 dark:bg-slate-900/80 shadow-md dark:shadow-xl backdrop-blur-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-slate-900 dark:text-white">
          <Globe className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          Full Website Crawler & Audit
        </CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400">
          Crawl sitemap URLs, recursively crawl internal website pages, or scan a custom list of URLs asynchronously.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Crawler URL Input Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Crawler Input Mode</label>
            <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 self-start w-fit">
              <button
                type="button"
                onClick={() => setUrlMode("sitemap")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  urlMode === "sitemap"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Sitemap XML
              </button>
              <button
                type="button"
                onClick={() => setUrlMode("crawl")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  urlMode === "crawl"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Crawl Website
              </button>
              <button
                type="button"
                onClick={() => setUrlMode("list")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  urlMode === "list"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Enter URL List
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            {/* Conditional Input Field based on mode */}
            <div className="md:col-span-3 space-y-1.5">
              {urlMode === "sitemap" && (
                <>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">XML Sitemap URL</label>
                  <Input
                    value={sitemapUrl}
                    onChange={(e) => setSitemapUrl(e.target.value)}
                    placeholder="https://razib.bd/sitemap.xml"
                    required
                  />
                </>
              )}
              {urlMode === "crawl" && (
                <>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Main Website URL</label>
                  <Input
                    value={crawlUrl}
                    onChange={(e) => setCrawlUrl(e.target.value)}
                    placeholder="https://razib.bd"
                    required
                  />
                </>
              )}
              {urlMode === "list" && (
                <>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">List of URLs (One per line)</label>
                  <textarea
                    value={urlListText}
                    onChange={(e) => setUrlListText(e.target.value)}
                    placeholder="https://razib.bd&#10;https://razib.bd/about"
                    className="flex min-h-[44px] w-full rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950/80 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all font-mono"
                    rows={6}
                    required
                  />
                </>
              )}
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
          
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Max Pages (Max 50)</label>
              <Input
                type="number"
                min={1}
                max={50}
                value={maxPages}
                onChange={(e) => {
                  let val = Number(e.target.value);
                  if (val > 50) val = 50;
                  setMaxPages(val);
                }}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 text-xs rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-300">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            variant="default"
            className="w-full md:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initiating Site Audit...
              </>
            ) : (
              <>
                <Layers className="mr-2 h-4 w-4" />
                Start Full Site Audit
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
