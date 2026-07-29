"use client";

import React, { useEffect, useState, useRef } from "react";
import { Activity, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { getJobStatus, JobStatusResponse } from "@/lib/api";

interface JobStatusTrackerProps {
  jobId: string;
  onJobComplete: (jobData: JobStatusResponse) => void;
}

export function JobStatusTracker({ jobId, onJobComplete }: JobStatusTrackerProps) {
  const [job, setJob] = useState<JobStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Keep a stable reference to the latest callback to avoid restarting the polling effect
  const onJobCompleteRef = useRef(onJobComplete);
  useEffect(() => {
    onJobCompleteRef.current = onJobComplete;
  }, [onJobComplete]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const poll = async () => {
      try {
        const data = await getJobStatus(jobId);
        setJob(data);

        if (data.status === "completed") {
          onJobCompleteRef.current(data);
        } else if (data.status === "failed") {
          setError(data.error || "Job failed during execution");
        } else {
          timer = setTimeout(poll, 1500);
        }
      } catch (err: any) {
        setError("Failed to fetch job progress");
      }
    };

    poll();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [jobId]);

  if (error) {
    return (
      <Card className="border-red-900/50 bg-red-950/20">
        <CardContent className="p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
          <div className="text-sm text-red-200">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!job) {
    return (
      <Card className="border-slate-800 bg-slate-900/80">
        <CardContent className="p-4 flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-blue-400 animate-spin shrink-0" />
          <div className="text-sm text-slate-300">Initializing background crawler task...</div>
        </CardContent>
      </Card>
    );
  }

  const { progress, status } = job;
  const isCompleted = status === "completed";

  return (
    <Card className="border-blue-900/40 bg-slate-900/90 glow-blue">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : (
              <Activity className="h-5 w-5 text-blue-400 animate-spin" />
            )}
            <span className="text-sm font-semibold text-white">
              {isCompleted ? "Audit Completed Successfully" : `Crawling Page ${progress.current} of ${progress.total}`}
            </span>
          </div>
          <Badge variant={isCompleted ? "success" : "default"}>
            {status.toUpperCase()} ({progress.percent}%)
          </Badge>
        </div>

        <Progress value={progress.percent} />

        <div className="text-xs text-slate-400 flex justify-between truncate">
          <span className="truncate max-w-lg">
            {progress.currentUrl ? `Current: ${progress.currentUrl}` : `Job ID: ${jobId}`}
          </span>
          <span className="shrink-0 pl-2">Job #{jobId.slice(0, 8)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
