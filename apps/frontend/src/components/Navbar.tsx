"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, Server, Sparkles, Activity, Globe } from "lucide-react";
import { checkBackendHealth, API_BASE, checkBrowserlessConnection } from "@/lib/api";
import { Badge } from "./ui/badge";

export function Navbar() {
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "connected" | "failed" | "error">("idle");
  const [testMessage, setTestMessage] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: any = null;

    const check = async () => {
      try {
        await checkBackendHealth();
        setStatus("online");
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      } catch (err) {
        setStatus("offline");
        if (!intervalId) {
          intervalId = setInterval(check, 15000);
        }
      }
    };

    check();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  const handleTestBrowserless = async () => {
    setTestStatus("testing");
    setTestMessage(null);
    try {
      const data = await checkBrowserlessConnection();
      if (data.status === "CONNECTED") {
        setTestStatus("connected");
        setTestMessage(`Connected! Chrome version: ${data.version}`);
      } else if (data.status === "ERROR") {
        setTestStatus("error");
        setTestMessage(data.message);
      } else {
        setTestStatus("failed");
        setTestMessage(data.message);
      }
    } catch (err: any) {
      setTestStatus("failed");
      setTestMessage("Failed to connect to API endpoint");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md shadow-blue-500/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Website Audit AI <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">v1.0 Monorepo</span>
            </h1>
            <p className="text-xs text-slate-400">Font Classification, CTA Design, Alt Tag & SEO Compliance Scanner</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <Server className="h-3.5 w-3.5 text-slate-400" />
            <span>Backend API: {API_BASE.replace('/api', '').replace('http://', '').replace('https://', '')}</span>
          </div>

          {status === "online" && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleTestBrowserless}
                disabled={testStatus === "testing"}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-50 transition-all cursor-pointer"
                title={testMessage || "Test Browserless.io API connection"}
              >
                {testStatus === "testing" ? (
                  <Activity className="h-3 w-3 animate-spin text-slate-400" />
                ) : (
                  <Globe className="h-3 w-3 text-slate-400" />
                )}
                Test Browserless
              </button>

              {testStatus === "connected" && (
                <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/20 px-2.5 py-1 rounded border border-emerald-500/20" title={testMessage || ''}>
                  Browserless OK
                </span>
              )}
              {testStatus === "failed" && (
                <span className="text-[10px] font-medium text-red-400 bg-red-950/20 px-2.5 py-1 rounded border border-red-500/20" title={testMessage || ''}>
                  Failed
                </span>
              )}
              {testStatus === "error" && (
                <span className="text-[10px] font-medium text-amber-400 bg-amber-950/20 px-2.5 py-1 rounded border border-amber-500/20" title={testMessage || ''}>
                  Not Configured
                </span>
              )}
            </div>
          )}

          {status === "checking" && (
            <Badge variant="secondary" className="gap-1.5 py-1">
              <Activity className="h-3 w-3 animate-spin text-slate-400" />
              Checking API...
            </Badge>
          )}

          {status === "online" && (
            <Badge variant="success" className="gap-1.5 py-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              API Connected
            </Badge>
          )}

          {status === "offline" && (
            <Badge variant="destructive" className="gap-1.5 py-1">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              API Offline
            </Badge>
          )}
        </div>
      </div>
    </header>
  );
}
