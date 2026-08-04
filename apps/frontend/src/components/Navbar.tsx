"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Server, Sparkles, Activity, Globe, Key, Home, LayoutDashboard, BookOpen, FileText, Sun, Moon, Image as ImageIcon } from "lucide-react";
import { checkBackendHealth, API_BASE, checkBrowserlessConnection, getBrowserlessKeyStatus, syncBrowserlessKeyWithBackend } from "@/lib/api";
import { motion } from "framer-motion";
import { Badge } from "./ui/badge";
import { BrowserlessKeyModal } from "./BrowserlessKeyModal";
import { useTheme } from "./ThemeProvider";

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "connected" | "failed" | "not_configured" | "invalid_key">("idle");
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [keyConfigured, setKeyConfigured] = useState(false);

  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [showInvalidWarning, setShowInvalidWarning] = useState(false);

  // Non-blocking background health check — loads site content first, checks backend in background
  useEffect(() => {
    let isMounted = true;
    let intervalId: any = null;

    const check = async () => {
      try {
        const res = await checkBackendHealth();
        if (!isMounted) return;
        if (res) {
          setStatus("online");
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        } else {
          setStatus("offline");
          if (!intervalId) {
            intervalId = setInterval(check, 15000);
          }
        }
      } catch (err) {
        if (!isMounted) return;
        setStatus("offline");
        if (!intervalId) {
          intervalId = setInterval(check, 15000);
        }
      }
    };

    // Defer check to background after site DOM renders
    const timer = setTimeout(() => {
      check();
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  // Load key configured status in background once backend is online
  useEffect(() => {
    let isMounted = true;
    if (status === "online") {
      const timer = setTimeout(() => {
        if (!isMounted) return;
        setTestStatus("testing");
        syncBrowserlessKeyWithBackend().then(async (s) => {
          if (!isMounted) return;
          setKeyConfigured(s?.configured || false);
          if (s?.configured) {
            try {
              const data = await checkBrowserlessConnection();
              if (!isMounted) return;
              if (data.status === "CONNECTED") {
                setTestStatus("connected");
                setTestMessage(`Connected! Chrome version: ${data.version}`);
              } else if (data.status === "INVALID_KEY") {
                setTestStatus("invalid_key");
                setTestMessage(data.message || "API key is invalid or expired.");
              } else if (data.status === "NOT_CONFIGURED") {
                setTestStatus("not_configured");
                setTestMessage(data.message || "No API key configured.");
                setKeyConfigured(false);
              } else {
                setTestStatus("failed");
                setTestMessage(data.message || "Connection failed.");
              }
            } catch {
              if (!isMounted) return;
              setTestStatus("failed");
              setTestMessage("Failed to check API key connection.");
            }
          } else {
            setTestStatus("idle");
          }
        }).catch(() => {
          if (!isMounted) return;
          setTestStatus("idle");
        });
      }, 200);

      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }
  }, [status]);

  // const handleTestBrowserless = useCallback(async () => {
  //   setTestStatus("testing");
  //   setTestMessage(null);
  //   try {
  //     const data = await checkBrowserlessConnection();
  //     if (data.status === "CONNECTED") {
  //       setTestStatus("connected");
  //       setTestMessage(`Connected! Chrome version: ${data.version}`);
  //       setKeyConfigured(true);
  //     } else if (data.status === "NOT_CONFIGURED") {
  //       setTestStatus("not_configured");
  //       setTestMessage("No API key configured. Click 'Set API Key' to add one.");
  //       setShowInvalidWarning(false);
  //       setModalOpen(true);
  //     } else if (data.status === "INVALID_KEY") {
  //       setTestStatus("invalid_key");
  //       setTestMessage(data.message || "API key is invalid or expired.");
  //       setShowInvalidWarning(true);
  //       setModalOpen(true);
  //     } else {
  //       setTestStatus("failed");
  //       setTestMessage(data.message || "Connection failed.");
  //       setShowInvalidWarning(true);
  //       setModalOpen(true);
  //     }
  //   } catch (err: any) {
  //     setTestStatus("failed");
  //     setTestMessage("Failed to connect to API endpoint");
  //   }
  // }, []);

  const handleOpenKeyModal = () => {
    setShowInvalidWarning(false);
    setModalOpen(true);
  };

  const handleKeySaved = async () => {
    setModalOpen(false);
    setTestStatus("testing");
    setTestMessage(null);
    try {
      const statusRes = await syncBrowserlessKeyWithBackend();
      setKeyConfigured(statusRes.configured);
      if (statusRes.configured) {
        const data = await checkBrowserlessConnection();
        if (data.status === "CONNECTED") {
          setTestStatus("connected");
          setTestMessage(`Connected! Chrome version: ${data.version}`);
        } else if (data.status === "INVALID_KEY") {
          setTestStatus("invalid_key");
          setTestMessage(data.message || "API key is invalid or expired.");
        } else {
          setTestStatus("failed");
          setTestMessage(data.message || "Connection failed after save.");
        }
      } else {
        setTestStatus("idle");
      }
    } catch {
      setTestStatus("idle");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/80 backdrop-blur-xl transition-colors">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo & Navigation */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col items-start justify-start">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  Website Audit
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                    by Razib Hossain
                </span>
              </div>
            </Link>

            
            
          </div>

          {/* Right Toolbar Controls */}
          <div className="flex items-center gap-2">
            

            {/* <div className="hidden xl:flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <Server className="h-3.5 w-3.5 text-slate-500" />
              <span>Backend API: {API_BASE.replace('/api', '').replace('http://', '').replace('https://', '')}</span>
            </div> */}

            {status === "online" && (
              <div className="flex items-center gap-2">
                {/* Set API Key button */}
                <button
                  onClick={handleOpenKeyModal}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    keyConfigured
                      ? "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-700/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                      : "bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 animate-pulse"
                  }`}
                  title={keyConfigured ? "Manage Browserless API Key" : "Set up Browserless API Key for full browser auditing"}
                >
                  <Key className="h-3 w-3" />
                  {keyConfigured ? "API Key" : "Set API Key"}
                </button>

                {/* Test Browserless button */}
                {/* <button
                  onClick={handleTestBrowserless}
                  disabled={testStatus === "testing"}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 transition-all cursor-pointer"
                  title={testMessage || "Test Browserless.io API connection"}
                >
                  {testStatus === "testing" ? (
                    <Activity className="h-3 w-3 animate-spin text-slate-400" />
                  ) : (
                    <Globe className="h-3 w-3 text-slate-500" />
                  )}
                  Test Browserless
                </button> */}

                {/* Status badge */}
                {testStatus === "testing" && (
                  <span className="text-[10px] font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-2.5 py-1 rounded-full border border-blue-300 dark:border-blue-500/20 flex items-center gap-1">
                    <Activity className="h-3 w-3 animate-spin text-blue-500" />
                    Checking Key...
                  </span>
                )}
                {testStatus === "connected" && (
                  <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-500/20 flex items-center gap-1" title={testMessage || ''}>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    API Key Connected
                  </span>
                )}
                {testStatus === "invalid_key" && (
                  <button
                    onClick={handleOpenKeyModal}
                    className="text-[10px] font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-2.5 py-1 rounded-full border border-red-300 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors"
                    title={testMessage || ''}
                  >
                    ✗ Invalid Key
                  </button>
                )}
                {testStatus === "not_configured" && (
                  <button
                    onClick={handleOpenKeyModal}
                    className="text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors"
                    title={testMessage || ''}
                  >
                    Not Configured
                  </button>
                )}
                {testStatus === "failed" && (
                  <button
                    onClick={handleOpenKeyModal}
                    className="text-[10px] font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-2.5 py-1 rounded-full border border-red-300 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors"
                    title={testMessage || ''}
                  >
                    Failed
                  </button>
                )}
              </div>
            )}

            {status === "checking" && (
              <Badge variant="secondary" className="gap-1.5 py-1">
                <Activity className="h-3 w-3 animate-spin text-slate-400" />
                Checking Backend...
              </Badge>
            )}

            {status === "online" && (
               <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-500/20 flex items-center gap-1" title={testMessage || ''}>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Backend Connected
                  </span>
            )}

            {status === "offline" && (
              <Badge variant="destructive" className="gap-1.5 py-1">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                Backend Offline
              </Badge>
            )}
          </div>

          {/* Main Nav Items */}
          <nav 
            className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800/80 text-xs font-medium"
            onMouseLeave={() => setHoveredPath(null)}
          >
            {[
              { label: "Home", href: "/", icon: Home },
              { label: "Audit Center", href: "/audit", icon: LayoutDashboard },
              { label: "Image Downloader", href: "/image-downloader", icon: ImageIcon },
              { label: "Case Study", href: "/case-study", icon: BookOpen },
              { label: "Guides", href: "/guides", icon: FileText },
            ].map((item) => {
              const Icon = item.icon;
              const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(item.href + "/");
              const isHovered = hoveredPath === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onMouseEnter={() => setHoveredPath(item.href)}
                  className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    active
                      ? `${!mounted ? "bg-blue-600" : ""} text-white font-semibold`
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {/* Liquid Active Background Pill */}
                  {mounted && active && (
                    <motion.div
                      layoutId="navbar-active-pill"
                      className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-md shadow-blue-500/20"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}

                  {/* Liquid Hover Pill (for non-active items) */}
                  {mounted && !active && isHovered && (
                    <motion.div
                      layoutId="navbar-hover-pill"
                      className="absolute inset-0 bg-slate-200/80 dark:bg-slate-800/80 rounded-lg"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}

                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon className={`h-3.5 w-3.5 ${active ? "text-white" : "text-slate-500 dark:text-slate-400"}`} />
                    {item.label}
                  </span>
                </Link>
              );
            })}
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer relative z-10"
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-700" />
              )}
            </button>
          </nav>

          
        </div>
      </header>

      {/* Browserless API Key Modal */}
      <BrowserlessKeyModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onKeySaved={handleKeySaved}
        showInvalidWarning={showInvalidWarning}
      />
    </>
  );
}
