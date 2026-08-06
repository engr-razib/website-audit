"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Server,
  Sparkles,
  Activity,
  Globe,
  Key,
  Home,
  LayoutDashboard,
  BookOpen,
  FileText,
  Sun,
  Moon,
  Image as ImageIcon,
  ChevronDown,
  Mail,
  Menu,
  X,
  Database,
  Zap,
  Download
} from "lucide-react";
import { checkBackendHealth, API_BASE, checkBrowserlessConnection, getBrowserlessKeyStatus, syncBrowserlessKeyWithBackend, BROWSERLESS_ENABLED } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "./ui/badge";
import { BrowserlessKeyModal } from "./BrowserlessKeyModal";
import { useTheme } from "./ThemeProvider";

interface NavSubItem {
  label: string;
  href: string;
  desc: string;
  icon: any;
}

interface NavItem {
  label: string;
  href: string;
  icon: any;
  subItems?: NavSubItem[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Audit Center", href: "/audit", icon: LayoutDashboard },
  { label: "Bulk Image Downloader", href: "/image-downloader", icon: ImageIcon },
  { label: "Custom Crawling", href: "/custom-crawler", icon: Database },
  {
    label: "Case Study",
    href: "/case-study",
    icon: FileText,
    subItems: [
      { label: "All Case Studies", href: "/case-study", desc: "Overview & STAR portfolio cases", icon: Sparkles },
      { label: "Audit Center Case Study", href: "/case-study/audit-center", desc: "Typography & audit microservice", icon: LayoutDashboard },
      { label: "Image Downloader Case Study", href: "/case-study/image-downloader", desc: "Bulk media downloader microservice", icon: ImageIcon },
      { label: "Custom Crawling Case Study", href: "/case-study/custom-crawling", desc: "Excel template crawler engine", icon: Database },
    ],
  },
  {
    label: "Guides",
    href: "/guides",
    icon: BookOpen,
    subItems: [
      { label: "All Guides & Docs", href: "/guides", desc: "Complete user manual hub & FAQs", icon: BookOpen },
      { label: "Audit Center Guide", href: "/guides/audit-center", desc: "Typography & audit manual", icon: LayoutDashboard },
      { label: "Image Downloader Guide", href: "/guides/image-downloader", desc: "Bulk image scraping manual", icon: ImageIcon },
      { label: "Custom Crawling Guide", href: "/guides/custom-crawling", desc: "Excel crawler manual", icon: Database },
    ],
  },
  { label: "Contact", href: "/contact", icon: Mail },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "connected" | "failed" | "not_configured" | "invalid_key">("idle");
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [keyConfigured, setKeyConfigured] = useState(false);

  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMobileSubMenu, setExpandedMobileSubMenu] = useState<string | null>(null);
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
    setOpenDropdown(null);
  }, [pathname]);

  const [modalOpen, setModalOpen] = useState(false);
  const [showInvalidWarning, setShowInvalidWarning] = useState(false);

  useEffect(() => {
    setMounted(true);

    const checkStatus = async () => {
      try {
        const isOnline = await checkBackendHealth();
        setStatus(isOnline ? "online" : "offline");
      } catch {
        setStatus("offline");
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!BROWSERLESS_ENABLED) return;

    if (status === "online") {
      setTestStatus("testing");

      syncBrowserlessKeyWithBackend().then(async (s) => {
        setKeyConfigured(s.configured);
        if (!s.configured) {
          setTestStatus("not_configured");
          setTestMessage("No API key saved in browser storage or server environment.");
        } else {
          const data = await checkBrowserlessConnection();
          if (data.status === 'CONNECTED') {
            setTestStatus("connected");
            setTestMessage(data.message || "Connected to Browserless.io");
          } else {
            if (data.keyConfigured === false) {
              setTestStatus("not_configured");
              setTestMessage("No API key configured.");
            } else if (data.error && data.error.includes("invalid or expired")) {
              setTestStatus("invalid_key");
              setTestMessage(data.error);
            } else {
              setTestStatus("failed");
              setTestMessage(data.error || "Connection failed.");
            }
          }
        }
      }).catch(() => {
        setTestStatus("failed");
        setTestMessage("Failed to check Browserless status.");
      });
    } else {
      setTestStatus("idle");
      setTestMessage(null);
    }
  }, [status]);

  const handleOpenKeyModal = () => {
    setShowInvalidWarning(testStatus === "invalid_key");
    setModalOpen(true);
  };

  const handleKeySaved = async () => {
    setTestStatus("testing");
    const statusRes = await syncBrowserlessKeyWithBackend();
    setKeyConfigured(statusRes.configured);
    if (statusRes.configured) {
      const data = await checkBrowserlessConnection();
      if (data.status === 'CONNECTED') {
        setTestStatus("connected");
        setTestMessage(data.message || "Connected to Browserless.io");
      } else if (data.error && data.error.includes("invalid or expired")) {
        setTestStatus("invalid_key");
        setTestMessage(data.error);
      } else {
        setTestStatus("failed");
        setTestMessage(data.error || "Connection failed.");
      }
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/80 backdrop-blur-xl transition-colors">
        {/* Topbar */}
        <div className="w-full border-b border-blue-500/30 bg-blue-500/10 py-1.5 px-4 sm:px-6 lg:px-8 text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 transition-colors">
          <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-end gap-3 sm:gap-4 px-4 sm:px-6 lg:px-8">
            {/* Left section: Connection states */}
            <div className="flex items-center gap-3">
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

              {/* API Key Connection badge */}
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

            {/* Right section: Links & API Key Config */}
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
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
              onMouseLeave={() => {
                setHoveredPath(null);
                setOpenDropdown(null);
              }}
            >
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(item.href + "/");
                const isHovered = hoveredPath === item.href;
                const isDropdownOpen = openDropdown === item.href;

                return (
                  <div
                    key={item.href}
                    className="relative"
                    onMouseEnter={() => {
                      setHoveredPath(item.href);
                      if (item.subItems) setOpenDropdown(item.href);
                    }}
                  >
                    <Link
                      href={item.href}
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

                      {/* Liquid Hover Pill */}
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
                        {item.subItems && (
                          <ChevronDown className={`h-3 w-3 transition-transform ${isDropdownOpen ? "rotate-180 text-blue-500" : "opacity-60"}`} />
                        )}
                      </span>
                    </Link>

                    {/* Dropdown Menu Overlay */}
                    {item.subItems && isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full mt-2 w-64 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 p-2 shadow-2xl backdrop-blur-xl z-50 space-y-1"
                      >
                        {item.subItems.map((sub) => {
                          const SubIcon = sub.icon;
                          const subActive = pathname === sub.href;
                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              className={`flex items-start gap-3 p-2.5 rounded-xl transition-all ${
                                subActive
                                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20"
                                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                              }`}
                            >
                              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                                <SubIcon className="h-4 w-4" />
                              </div>
                              <div className="space-y-0.5">
                                <div className="text-xs font-bold leading-none">{sub.label}</div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{sub.desc}</div>
                              </div>
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                  </div>
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

            {/* Mobile Controls */}
            <div className="flex lg:hidden items-center gap-2">
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
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(item.href + "/");
                  const isExpanded = expandedMobileSubMenu === item.href;

                  return (
                    <div key={item.href} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Link
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                            active
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/10"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/60 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          <Icon className={`h-4 w-4 ${active ? "text-white" : "text-slate-500 dark:text-slate-400"}`} />
                          {item.label}
                        </Link>
                        {item.subItems && (
                          <button
                            onClick={() => setExpandedMobileSubMenu(isExpanded ? null : item.href)}
                            className="p-3 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                          >
                            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180 text-blue-500" : ""}`} />
                          </button>
                        )}
                      </div>

                      {/* Mobile Accordion Sub-items */}
                      {item.subItems && isExpanded && (
                        <div className="pl-6 space-y-1 border-l-2 border-slate-200 dark:border-slate-800 ml-4 py-1">
                          {item.subItems.map((sub) => {
                            const SubIcon = sub.icon;
                            const subActive = pathname === sub.href;
                            return (
                              <Link
                                key={sub.href}
                                href={sub.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                  subActive
                                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                }`}
                              >
                                <SubIcon className="h-3.5 w-3.5 text-blue-500" />
                                <div>
                                  <div className="font-semibold">{sub.label}</div>
                                  <div className="text-[10px] text-slate-500">{sub.desc}</div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Browserless API Key Modal */}
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
