"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  User,
  MessageSquare,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Globe,
  ExternalLink,
  MapPin,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [formState, setFormState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("razibdpi@gmail.com");
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setFormState("error");
      setErrorMessage("Please fill in all fields.");
      return;
    }

    setFormState("submitting");

    // Simulate API request
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setFormState("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setFormState("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-16 space-y-12">
      {/* Top Header & Breadcrumb */}
      <div className="border-b border-slate-200 dark:border-slate-800/80 pb-8 space-y-4 transition-colors">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-slate-200 font-medium">Contact</span>
        </div>

        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            Get in Touch
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Let&apos;s Build Something Amazing Together
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
            Have questions about the Website Audit tool, need custom extensions, or want to collaborate on a full-stack project? Reach out below.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Contact Info Sidebar - 5 cols */}
        <div className="lg:col-span-5 space-y-6">
          <div className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 p-6 sm:p-8 text-white shadow-2xl backdrop-blur-xl">
            {/* Background glow effects */}
            <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Contact Details</h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Feel free to use the contact form, copy the email directly, or visit my professional portfolio site.
                </p>
              </div>

              {/* Detail Cards */}
              <div className="space-y-4">
                {/* Email Address */}
                <div className="flex flex-col p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 hover:border-blue-500/50 transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
                      <Mail className="h-4.5 w-4.5" />
                    </div>
                    <button
                      onClick={handleCopyEmail}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 transition-colors"
                      title="Copy Email Address"
                    >
                      {copiedEmail ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedEmail ? "Copied!" : "Copy"}</span>
                    </button>
                  </div>
                  <div className="mt-3">
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Email Address</span>
                    <a href="mailto:razibdpi@gmail.com" className="block text-sm font-bold text-white group-hover:text-blue-300 transition-colors font-mono mt-0.5">
                      razibdpi@gmail.com
                    </a>
                  </div>
                </div>

                {/* Website / Portfolio */}
                <div className="flex flex-col p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 hover:border-purple-500/50 transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400">
                      <Globe className="h-4.5 w-4.5" />
                    </div>
                    <a
                      href="https://www.razib.bd/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 font-semibold transition-colors"
                    >
                      <span>Visit</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                  <div className="mt-3">
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Portfolio Website</span>
                    <a
                      href="https://www.razib.bd/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm font-bold text-white group-hover:text-purple-300 transition-colors font-mono mt-0.5"
                    >
                      www.razib.bd
                    </a>
                  </div>
                </div>

                {/* Location */}
                <div className="flex flex-col p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 hover:border-emerald-500/50 transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400">
                      <MapPin className="h-4.5 w-4.5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Location</span>
                    <span className="block text-sm font-bold text-white group-hover:text-emerald-300 transition-colors mt-0.5">
                      Dhaka, Bangladesh
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form - 7 cols */}
        <div className="lg:col-span-7">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-none space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Send a Message</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Have an inquiry or custom request? Fill out the form and I will get back to you as soon as possible.
              </p>
            </div>

            <AnimatePresence mode="wait">
              {formState === "success" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 flex flex-col items-center justify-center text-center space-y-4 py-12"
                >
                  <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 dark:text-white">Message Sent Successfully!</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm">
                      Thank you for reaching out. I have received your message and will respond to you via email shortly.
                    </p>
                  </div>
                  <Button
                    onClick={() => setFormState("idle")}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    Send Another Message
                  </Button>
                </motion.div>
              ) : (
                <motion.form
                  key="contact-form"
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {formState === "error" && (
                    <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label htmlFor="name" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        Full Name
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        disabled={formState === "submitting"}
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        Email Address
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        disabled={formState === "submitting"}
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="space-y-1.5">
                    <label htmlFor="subject" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                      Subject
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      placeholder="Custom audit rules, business inquiry, etc."
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      disabled={formState === "submitting"}
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-1.5">
                    <label htmlFor="message" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-slate-400" />
                      Your Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      placeholder="Hi Razib, I would like to inquire about..."
                      className="flex w-full rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950/80 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all resize-none"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      disabled={formState === "submitting"}
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="glow"
                    className="w-full text-sm h-11"
                    disabled={formState === "submitting"}
                  >
                    {formState === "submitting" ? (
                      <>
                        <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Sending Message...
                      </>
                    ) : (
                      <>
                        Send Message
                        <Send className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
