"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Key, X, ExternalLink, CheckCircle2, XCircle, Loader2, ChevronRight, Globe, AlertTriangle, Trash2, HardDrive } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { saveBrowserlessKey, getBrowserlessKeyStatus, getStoredBrowserlessKey, removeStoredBrowserlessKey } from "@/lib/api";

interface BrowserlessKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: () => void;
  /** If true, show a warning that the current key is invalid/expired */
  showInvalidWarning?: boolean;
}

const STEPS = [
  {
    number: 1,
    title: "Create a Free Account",
    description: "Go to browserless.io and sign up for a free account.",
    detail: "The free tier includes 6 hours/month of browser time — more than enough for audits.",
    link: "https://www.browserless.io/sign-up",
    linkLabel: "Sign up at Browserless.io →",
    icon: "🌐",
  },
  {
    number: 2,
    title: "Go to Your Dashboard",
    description: "After signing in, navigate to your Browserless dashboard.",
    detail: "You'll find the API key management section in the top navigation or under Account Settings.",
    link: "https://account.browserless.io/api-keys",
    linkLabel: "Open Dashboard →",
    icon: "📋",
  },
  {
    number: 3,
    title: "Copy Your API Key",
    description: "Find your API key on the dashboard and copy it.",
    detail: "It looks like a long alphanumeric string, e.g. abc123...xyz. Click to copy and paste it below.",
    link: null,
    linkLabel: null,
    icon: "🔑",
  },
  {
    number: 4,
    title: "Paste & Save Below",
    description: "Paste the key in the input field below and click Save API Key.",
    detail: "We'll test the connection before saving to make sure it works.",
    link: null,
    linkLabel: null,
    icon: "✅",
  },
];

export function BrowserlessKeyModal({ isOpen, onClose, onKeySaved, showInvalidWarning = false }: BrowserlessKeyModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState<"idle" | "testing" | "saved" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [currentKeyStatus, setCurrentKeyStatus] = useState<{ configured: boolean; maskedKey: string | null } | null>(null);
  const [storedInLocalStorage, setStoredInLocalStorage] = useState(false);

  const loadKeyStatus = useCallback(async () => {
    try {
      const stored = getStoredBrowserlessKey();
      setStoredInLocalStorage(!!stored);
      if (stored) {
        setApiKey(stored);
      }
      const s = await getBrowserlessKeyStatus();
      setCurrentKeyStatus(s);
    } catch {
      setCurrentKeyStatus({ configured: false, maskedKey: null });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadKeyStatus();
      setStatus("idle");
      setMessage(null);
    }
  }, [isOpen, loadKeyStatus]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setMessage("Please paste your Browserless API key.");
      setStatus("error");
      return;
    }
    setStatus("testing");
    setMessage("Connecting to Browserless.io to verify your key…");
    try {
      const result = await saveBrowserlessKey(apiKey.trim());
      if (result.status === "SAVED") {
        setStatus("saved");
        setMessage(result.message || "API key saved to Local Storage and backend successfully!");
        setStoredInLocalStorage(true);
        await loadKeyStatus();
        setTimeout(() => {
          onKeySaved();
        }, 1500);
      } else {
        setStatus("error");
        setMessage(result.error || "Failed to save the API key.");
      }
    } catch {
      setStatus("error");
      setMessage("Could not reach the backend. Is the server running?");
    }
  };

  const handleClearLocalStorage = () => {
    removeStoredBrowserlessKey();
    setStoredInLocalStorage(false);
    setApiKey("");
    setMessage("Key removed from browser Local Storage.");
    setStatus("idle");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative z-10 w-full max-w-5xl rounded-2xl border border-slate-700/60 bg-slate-900/95 shadow-2xl shadow-black/80 overflow-hidden backdrop-blur-xl"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-blue-950/90 via-slate-900 to-indigo-950/90 px-6 py-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25">
                  <Key className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Browserless.io API Key
                    {storedInLocalStorage && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <HardDrive className="h-3 w-3" /> Saved in Local Storage
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-400">Configure remote browser connection stored locally in your browser</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Invalid Key Warning */}
              {showInvalidWarning && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-950/40 border border-red-800/50">
                  <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-300">API Key Not Working</p>
                    <p className="text-xs text-red-400/80 mt-0.5">
                      The current Browserless API key is invalid or expired. Please enter a new API key to continue using browser-based audits.
                    </p>
                  </div>
                </div>
              )}

              {/* Current Key Status */}
              {currentKeyStatus && (
                <div className={`flex items-center justify-between p-3.5 rounded-xl border text-xs ${
                  currentKeyStatus.configured
                    ? "bg-emerald-950/30 border-emerald-800/40 text-emerald-300"
                    : "bg-slate-800/40 border-slate-700/40 text-slate-400"
                }`}>
                  <div className="flex items-center gap-3">
                    {currentKeyStatus.configured ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-slate-500 shrink-0" />
                    )}
                    <span>
                      {currentKeyStatus.configured
                        ? <>Active key: <code className="font-mono text-emerald-200">{currentKeyStatus.maskedKey}</code></>
                        : "No API key configured yet"}
                    </span>
                  </div>
                  {storedInLocalStorage && (
                    <button
                      onClick={handleClearLocalStorage}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-red-950/60 hover:text-red-300 hover:border-red-800/50 border border-slate-700 transition-colors"
                      title="Clear key from Local Storage"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-slate-400 hover:text-red-400" />
                      Clear Local Storage
                    </button>
                  )}
                </div>
              )}

              {/* Step-by-step Guide */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-400" />
                  How to get your Browserless API key
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {STEPS.map((step) => (
                    <div
                      key={step.number}
                      className="flex gap-3 p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/30 hover:border-slate-600/50 transition-all hover:bg-slate-800/80"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600/20 border border-blue-500/30 text-xs font-bold text-blue-400">
                        {step.number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{step.icon}</span>
                          <p className="text-sm font-semibold text-white">{step.title}</p>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{step.description}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{step.detail}</p>
                        {step.link && (
                          <a
                            href={step.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            {step.linkLabel}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-600 shrink-0 mt-1" />
                    </div>
                  ))}
                </div>
              </div>

              {/* API Key Input */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-300 block">
                    Paste Your API Key
                  </label>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <HardDrive className="h-3 w-3 text-blue-400" /> Saved securely in Local Storage
                  </span>
                </div>
                <div className="relative">
                  <Key className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setStatus("idle");
                      setMessage(null);
                    }}
                    placeholder="Paste your Browserless API key here…"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all font-mono"
                    onKeyDown={(e) => e.key === "Enter" && handleSave()}
                    disabled={status === "testing" || status === "saved"}
                  />
                </div>

                {/* Status Message */}
                {message && (
                  <div className={`flex items-start gap-2 p-3 rounded-lg text-xs border ${
                    status === "saved"
                      ? "bg-emerald-950/40 border-emerald-800/40 text-emerald-300"
                      : status === "error"
                      ? "bg-red-950/40 border-red-800/40 text-red-300"
                      : "bg-blue-950/40 border-blue-800/40 text-blue-300"
                  }`}>
                    {status === "saved" && <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />}
                    {status === "error" && <XCircle className="h-4 w-4 shrink-0 mt-0.5" />}
                    {status === "testing" && <Loader2 className="h-4 w-4 shrink-0 mt-0.5 animate-spin" />}
                    <span>{message}</span>
                  </div>
                )}

                {/* Save Button */}
                <button
                  onClick={handleSave}
                  disabled={status === "testing" || status === "saved" || !apiKey.trim()}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                    status === "saved"
                      ? "bg-emerald-600 text-white cursor-default"
                      : status === "testing"
                      ? "bg-blue-700/70 text-white cursor-not-allowed"
                      : !apiKey.trim()
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 cursor-pointer"
                  }`}
                >
                  {status === "testing" && <Loader2 className="h-4 w-4 animate-spin" />}
                  {status === "saved" && <CheckCircle2 className="h-4 w-4" />}
                  {status === "idle" && <Key className="h-4 w-4" />}
                  {status === "error" && <Key className="h-4 w-4" />}
                  {status === "testing" ? "Testing & Saving to Local Storage…" : status === "saved" ? "Key Saved to Local Storage!" : "Save API Key to Local Storage"}
                </button>
              </div>

              {/* Footer note */}
              <div className="text-xs text-slate-500 bg-slate-800/30 rounded-lg p-3 border border-slate-800/50">
                <strong className="text-slate-400">💡 Why Browserless & Local Storage?</strong> Storing your Browserless key locally ensures your browser environment remains configured across website reloads without re-entering it. Browserless enables full headless Chrome execution to accurately audit computed typography, CTA buttons, and images.
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

