"use client";

import React from "react";
import { motion } from "framer-motion";
import { Type, MousePointer, Image, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent } from "./ui/card";

interface SummaryCardsProps {
  summary: {
    totalPagesAudited: number;
    uniqueFontsFound: number;
    totalCTAsFound: number;
    missingAltImagesCount: number;
    targetFontElementMatches?: number;
    targetFontStyleMatches?: number;
  };
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const targetMatches = (summary.targetFontElementMatches || 0) + (summary.targetFontStyleMatches || 0);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 md:grid-cols-5 gap-3"
    >
      <motion.div variants={item} whileHover={{ y: -3, scale: 1.02 }} transition={{ duration: 0.2 }}>
        <Card className="border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 shadow-sm dark:shadow-lg">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span className="text-xs font-medium">Pages Audited</span>
              <FileText className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{summary.totalPagesAudited}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400"> crawled pages</div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item} whileHover={{ y: -3, scale: 1.02 }} transition={{ duration: 0.2 }}>
        <Card className="border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 shadow-sm dark:shadow-lg">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span className="text-xs font-medium">Unique Fonts</span>
              <Type className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{summary.uniqueFontsFound}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400"> font families</div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item} whileHover={{ y: -3, scale: 1.02 }} transition={{ duration: 0.2 }}>
        <Card className="border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 shadow-sm dark:shadow-lg">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span className="text-xs font-medium">CTA Buttons</span>
              <MousePointer className="h-4 w-4 text-purple-500 dark:text-purple-400" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{summary.totalCTAsFound}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400"> button elements</div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item} whileHover={{ y: -3, scale: 1.02 }} transition={{ duration: 0.2 }}>
        <Card className="border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 shadow-sm dark:shadow-lg">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span className="text-xs font-medium">Missing Alt Tags</span>
              <Image className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{summary.missingAltImagesCount}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400"> images without alt</div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item} whileHover={{ y: -3, scale: 1.02 }} transition={{ duration: 0.2 }} className="col-span-2 md:col-span-1">
        <Card className="border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 shadow-sm dark:shadow-lg">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span className="text-xs font-medium">Target Font Hits</span>
              {targetMatches > 0 ? (
                <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
              ) : (
                <CheckCircle className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
              )}
            </div>
            <div className="mt-2">
              <div className={`text-2xl font-bold ${targetMatches > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                {targetMatches}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400"> target font instances</div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

