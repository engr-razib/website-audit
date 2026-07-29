"use client";

import React from "react";
import { MousePointer, Code2 } from "lucide-react";
import { Badge } from "./ui/badge";

interface CTAItem {
  text?: string;
  tag?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  backgroundColor?: string;
  color?: string;
  borderRadius?: string;
  padding?: string;
  selector?: string;
  url?: string;
}

interface ButtonAuditGridProps {
  ctas: CTAItem[];
}

export function ButtonAuditGrid({ ctas = [] }: ButtonAuditGridProps) {
  if (ctas.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 rounded-xl border border-slate-800 bg-slate-950/40">
        No Call-To-Action (CTA) buttons detected on the audited pages.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {ctas.slice(0, 30).map((cta, idx) => {
        const bg = cta.backgroundColor || "transparent";
        const color = cta.color || "#ffffff";

        return (
          <div
            key={idx}
            className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px]">
                  &lt;{cta.tag || "button"}&gt;
                </Badge>
                <span className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]">
                  {cta.selector || ".btn"}
                </span>
              </div>

              {/* Render Simulated CTA Preview */}
              <div className="py-3 flex items-center justify-center rounded-lg bg-slate-950/80 border border-slate-800/80">
                <button
                  type="button"
                  style={{
                    backgroundColor: bg,
                    color: color,
                    fontFamily: cta.fontFamily,
                    fontSize: cta.fontSize,
                    fontWeight: cta.fontWeight,
                    borderRadius: cta.borderRadius,
                    padding: cta.padding || "8px 16px",
                  }}
                  className="max-w-full truncate shadow-sm pointer-events-none"
                >
                  {cta.text || "Click Here"}
                </button>
              </div>
            </div>

            {/* Design Tokens Breakdown */}
            <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/40">
              <div>
                <span className="text-slate-500">Font:</span> {cta.fontFamily?.split(",")[0] || "Default"}
              </div>
              <div>
                <span className="text-slate-500">Size/Weight:</span> {cta.fontSize || "16px"} / {cta.fontWeight || "400"}
              </div>
              <div>
                <span className="text-slate-500">Radius:</span> {cta.borderRadius || "0px"}
              </div>
              <div>
                <span className="text-slate-500">Padding:</span> {cta.padding || ""}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
