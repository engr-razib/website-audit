"use client";

import React from "react";
import { Badge } from "./ui/badge";
import { Heading } from "lucide-react";

interface HeadingItem {
  tag?: string;
  text?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  url?: string;
}

interface HeadingAuditTableProps {
  headings: HeadingItem[];
}

export function HeadingAuditTable({ headings = [] }: HeadingAuditTableProps) {
  if (headings.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 rounded-xl border border-slate-800 bg-slate-950/40">
        No headings detected on the audited pages.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3 font-semibold">Level</th>
              <th className="p-3 font-semibold">Heading Text</th>
              <th className="p-3 font-semibold">Font Family</th>
              <th className="p-3 font-semibold">Size & Weight</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {headings.slice(0, 50).map((h, idx) => {
              const tag = (h.tag || "h2").toUpperCase();
              const isH1 = tag === "H1";

              return (
                <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-3">
                    <Badge variant={isH1 ? "purple" : "secondary"} className="font-mono text-[10px]">
                      {tag}
                    </Badge>
                  </td>
                  <td className="p-3 font-medium text-white max-w-md truncate">
                    {h.text || "Empty Heading"}
                  </td>
                  <td className="p-3 text-slate-400">{h.fontFamily?.split(",")[0] || "Default"}</td>
                  <td className="p-3 text-slate-400">
                    {h.fontSize || ""} / {h.fontWeight || "400"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
