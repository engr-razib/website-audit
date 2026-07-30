"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Globe, MessageSquare, ExternalLink, Copy, Check, Sparkles, Send } from "lucide-react";

interface ContactSectionProps {
  className?: string;
}

export function ContactSection({ className = "" }: ContactSectionProps) {
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("razibdpi@gmail.com");
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <section className={`relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 p-8 sm:p-12 text-white shadow-2xl backdrop-blur-xl ${className}`}>
      {/* Background glow effects */}
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto space-y-8 text-center">
        {/* Header Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold shadow-sm"
        >
          <MessageSquare className="h-4 w-4 text-blue-400" />
          <span>Contact With Me</span>
        </motion.div>

        {/* Headline & Pitch */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Have any Idea or need customization? <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Let&apos;s talk.
            </span>
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Whether you need custom web auditing tools, full-stack microservices, design token integration, or enterprise customization — I am available to help.
          </p>
        </motion.div>

        {/* Contact Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left"
        >
          {/* Email Card */}
          <div className="flex flex-col justify-between p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 hover:border-blue-500/50 transition-all group backdrop-blur-md">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
                  <Mail className="h-5 w-5" />
                </div>
                <button
                  onClick={handleCopyEmail}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded-md bg-slate-800 border border-slate-700 transition-colors"
                  title="Copy Email Address"
                >
                  {copiedEmail ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedEmail ? "Copied!" : "Copy"}</span>
                </button>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium">Send an Email</span>
                <p className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors font-mono">
                  razibdpi@gmail.com
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-700/40 mt-3">
              <a
                href="mailto:razibdpi@gmail.com?subject=Inquiry%20from%20Website%20Audit%20Platform"
                className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
              >
                <span>Direct Email</span>
                <Send className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Portfolio Card */}
          <div className="flex flex-col justify-between p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 hover:border-purple-500/50 transition-all group backdrop-blur-md">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400">
                  <Globe className="h-5 w-5" />
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                  Portfolio
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium">Md. Razib Hossain</span>
                <p className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors font-mono">
                  www.razib.bd
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-700/40 mt-3">
              <a
                href="https://www.razib.bd/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
              >
                <span>Visit My Portfolio</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
