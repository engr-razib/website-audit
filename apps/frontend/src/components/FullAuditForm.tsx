"use client";

import React, { useState } from "react";
import { Globe, Layers, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { startFullAudit } from "@/lib/api";

interface FullAuditFormProps {
  onJobStarted: (jobId: string) => void;
}

export function FullAuditForm({ onJobStarted }: FullAuditFormProps) {
  const [sitemapUrl, setSitemapUrl] = useState("https://razib.bd/sitemap.xml");
  const [fontName, setFontName] = useState("");
  const [maxPages, setMaxPages] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sitemapUrl) return;

    setLoading(true);
    setError(null);

    try {
      const res = await startFullAudit({ sitemapUrl, fontName, maxPages: Number(maxPages) });
      if (res.jobId) {
        onJobStarted(res.jobId);
      }
    } catch (err: any) {
      setError(err.message || "Failed to start full site audit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-indigo-900/30 bg-slate-900/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-white">
          <Globe className="h-5 w-5 text-indigo-400" />
          Full Sitemap Crawler & Audit
        </CardTitle>
        <CardDescription className="text-slate-400">
          Parse an XML sitemap to audit multiple pages asynchronously with background job queue tracking and Excel export.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-slate-300">XML Sitemap URL</label>
              <Input
                value={sitemapUrl}
                onChange={(e) => setSitemapUrl(e.target.value)}
                placeholder="https://razib.bd/sitemap.xml"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Target Font</label>
              <Input
                value={fontName}
                onChange={(e) => setFontName(e.target.value)}
                placeholder="Enter your font name"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Max Pages</label>
              <Input
                type="number"
                min={1}
                max={200}
                value={maxPages}
                onChange={(e) => setMaxPages(Number(e.target.value))}
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
            variant="default"
            className="w-full md:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initiating Sitemap Audit...
              </>
            ) : (
              <>
                <Layers className="mr-2 h-4 w-4" />
                Start Full Sitemap Audit
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
