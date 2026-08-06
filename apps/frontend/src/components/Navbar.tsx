"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Server, Sparkles, Activity, Globe, Key, Home, LayoutDashboard, BookOpen, FileText, Sun, Moon, Image as ImageIcon, ChevronDown, Mail, Menu, X, Database } from "lucide-react";
import { checkBackendHealth, API_BASE, checkBrowserlessConnection, getBrowserlessKeyStatus, syncBrowserlessKeyWithBackend, BROWSERLESS_ENABLED } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isActiveUsage, setIsActiveUsage] = useState(false);

  useEffect(() => {
    const handleActivity = (e: Event) => {
      const active = (e as CustomEvent).detail?.active;
      setIsActiveUsage(!!active);
    };
    window.addEventListener('app-activity-status', handleActivity);
    return () => window.removeEventListener('app-activity-status', handleActivity);
  }, []);

  // Auto-close mobile menu on page navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Template Switcher & Alert Toast states
  const [activeTemplate, setActiveTemplate] = useState("Modern Slate (Default)");
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const templates = ["Modern Slate (Default)", "Glassmorphism UI", "High Contrast", "Neo-Brutalism"];

  const handleTemplateChange = (tpl: string) => {
    setActiveTemplate(tpl);
    setTemplateDropdownOpen(false);
    setAlertMessage(`Template changed to "${tpl}"`);
    setTimeout(() => {
      setAlertMessage(null);
    }, 3000);
  };

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

  // Load key configured status in background once backend is online.
  // Skipped entirely when BROWSERLESS_ENABLED=false (local development).
  useEffect(() => {
    if (!BROWSERLESS_ENABLED) return; // local dev — no key needed
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
        {/* Topbar */}
        <div className="w-full border-b border-blue-500/30 bg-blue-500/10  py-1.5 px-4 sm:px-6 lg:px-8 text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 transition-colors">
          <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-end gap-2 px-4 sm:px-6 lg:px-8">

            {/* Right section: Links (Case Study, Guides), API Key Config, Template Switcher */}
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              {/* API Key button — only shown when Browserless is enabled (production) */}
              {BROWSERLESS_ENABLED && status === "online" && (
                <button
                  onClick={handleOpenKeyModal}
                  className={`flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer ${
                    keyConfigured
                      ? "text-indigo-600 dark:text-indigo-400 font-bold"
                      : "text-amber-600 dark:text-amber-500 font-bold animate-pulse"
                  }`}
                  title={keyConfigured ? "Manage Browserless API Key" : "Set up Browserless API Key"}
                >
                  <Key className="h-3 w-3 shrink-0" />
                  {keyConfigured ? "API Key" : "Set API Key"}
                </button>
              )}

               {/* Left section: Connection states */}
            <div className="flex items-center gap-3">
              {/* Backend Health Status indicator */}
              {status === "checking" && (
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Activity className="h-3 w-3 animate-spin text-slate-400" />
                  Checking Backend...
                </span>
              )}
              {status === "online" && (
                <span
                  className={`flex items-center gap-1.5 font-bold transition-all ${
                    isActiveUsage
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                  title={isActiveUsage ? "Backend API is actively processing a job" : "Backend API service is online"}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${isActiveUsage ? "bg-blue-500 animate-ping" : "bg-emerald-500 animate-pulse"}`} />
                  {isActiveUsage ? "Backend Connected (In Use)" : "Backend Connected"}
                </span>
              )}
              {status === "offline" && (
                <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400" title="Backend API service is offline">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  Backend Offline
                </span>
              )}

             

              {/* API Key Connection badge — only shown when Browserless is enabled (production) */}
              {BROWSERLESS_ENABLED && status === "online" && (
                <div className="flex items-center">
                  {testStatus === "testing" && (
                    <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                      <Activity className="h-3 w-3 animate-spin text-blue-500" />
                      Checking API Key...
                    </span>
                  )}
                  {testStatus === "connected" && (
                    <span
                      className={`flex items-center gap-1.5 font-bold transition-all ${
                        isActiveUsage
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                      title={isActiveUsage ? "CDP session is actively running a browser automation job" : (testMessage || '')}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${isActiveUsage ? "bg-blue-500 animate-ping" : "bg-emerald-500 animate-pulse"}`} />
                      {isActiveUsage ? "API Key Connected (In Use)" : "API Key Connected"}
                    </span>
                  )}
                  {testStatus === "invalid_key" && (
                    <button
                      onClick={handleOpenKeyModal}
                      className="text-red-600 dark:text-red-400 hover:underline cursor-pointer flex items-center gap-1"
                      title={testMessage || ''}
                    >
                      ✗ API Key Invalid
                    </button>
                  )}
                  {testStatus === "not_configured" && (
                    <button
                      onClick={handleOpenKeyModal}
                      className="text-amber-600 dark:text-amber-500 hover:underline cursor-pointer flex items-center gap-1"
                      title={testMessage || ''}
                    >
                      ! API Key Not Configured
                    </button>
                  )}
                  {testStatus === "failed" && (
                    <button
                      onClick={handleOpenKeyModal}
                      className="text-red-600 dark:text-red-400 hover:underline cursor-pointer flex items-center gap-1"
                      title={testMessage || ''}
                    >
                      ✗ API Key Check Failed
                    </button>
                  )}
                </div>
              )}
            </div>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5 group">
               <Link href="/">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              </Link>
              <div className="flex flex-col items-start justify-start">
                <Link href="/">
                  <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                    Website Audit
                  </h1>
                </Link>
                <Link href="https://www.razib.bd" target="_blank">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                  by Razib Hossain
                </span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Toolbar Controls (Theme Toggle & Main Navigation) */}
          <div className="flex items-center gap-4">
            {/* Main Nav Items */}
            <nav 
              className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800/80 text-xs font-semibold"
              onMouseLeave={() => setHoveredPath(null)}
            >
              {[
                { label: "Home", href: "/", icon: Home },
                { label: "Audit Center", href: "/audit", icon: LayoutDashboard },
                { label: "Bulk Image Downloader", href: "/image-downloader", icon: ImageIcon },
                { label: "Custom Crawling", href: "/custom-crawler", icon: Database },
                { label: "Case Study", href: "/case-study", icon: FileText },
                { label: "Guides", href: "/guides", icon: BookOpen },
                { label: "Contact", href: "/contact", icon: Mail },
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

            {/* Mobile Controls (Theme Toggle & Hamburger Trigger) */}
            <div className="flex lg:hidden items-center gap-2">
              {/* Mobile Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
                aria-label="Toggle Theme"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 text-amber-400" />
                ) : (
                  <Moon className="h-4 w-4 text-slate-700" />
                )}
              </button>

              {/* Hamburger Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="lg:hidden border-t border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl overflow-hidden"
            >
              <div className="px-4 pt-2.5 pb-6 space-y-1.5 sm:px-6">
                {[
                  { label: "Home", href: "/", icon: Home },
                  { label: "Audit Center", href: "/audit", icon: LayoutDashboard },
                  { label: "Bulk Image Downloader", href: "/image-downloader", icon: ImageIcon },
                  { label: "Custom Crawling", href: "/custom-crawler", icon: Database },
                  { label: "Case Study", href: "/case-study", icon: FileText },
                  { label: "Guides", href: "/guides", icon: BookOpen },
                  { label: "Contact", href: "/contact", icon: Mail },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        active
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/10"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/60 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${active ? "text-white" : "text-slate-500 dark:text-slate-400"}`} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Floating Success Alert Toast for template switcher */}
      <AnimatePresence>
        {alertMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-800 dark:border-slate-200 text-xs font-semibold"
          >
            <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
            <span>{alertMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Browserless API Key Modal — only rendered when Browserless is enabled (production) */}
      {BROWSERLESS_ENABLED && (
        <BrowserlessKeyModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onKeySaved={handleKeySaved}
          showInvalidWarning={showInvalidWarning}
        />
      )}
    </>
  );
}
