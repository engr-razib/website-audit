import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative h-3 w-full overflow-hidden rounded-full bg-slate-800/80 border border-slate-700/50",
        className
      )}
      {...props}
    >
      <div
        className="h-full w-full flex-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-300 ease-in-out"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </div>
  )
);
Progress.displayName = "Progress";

export { Progress };
