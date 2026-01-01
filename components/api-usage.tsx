"use client";

import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { cn } from "@/lib/utils";
import { Progress } from "./ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

type UsageData = {
  used: number;
  limit: number;
  remaining: number;
  userType: "guest" | "regular";
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ApiUsage({ className }: { className?: string }) {
  const { data, isLoading } = useSWR<UsageData>("/api/usage", fetcher, {
    refreshInterval: 60000, // Refresh every minute
    revalidateOnFocus: true,
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading || !data) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5",
          className
        )}
      >
        <div className="size-4 animate-pulse rounded bg-muted-foreground/20" />
        <div className="h-3 w-16 animate-pulse rounded bg-muted-foreground/20" />
      </div>
    );
  }

  const percentage = Math.round((data.used / data.limit) * 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = data.remaining === 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex cursor-default items-center gap-2 rounded-md px-3 py-1.5 text-xs transition-colors",
              isAtLimit
                ? "bg-destructive/10 text-destructive"
                : isNearLimit
                  ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                  : "bg-muted/50 text-muted-foreground",
              className
            )}
          >
            <MessageCircle className="size-3.5" />
            <span className="font-medium tabular-nums">
              {data.used}/{data.limit}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="w-56 p-3" side="bottom">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Daily Usage</span>
              <span className="font-medium">{percentage}%</span>
            </div>
            <Progress className="h-2" value={percentage} />
            <p className="text-xs text-muted-foreground">
              {isAtLimit
                ? "You've reached your daily limit. Try again tomorrow."
                : `${data.remaining} messages remaining today`}
            </p>
            {data.userType === "guest" && (
              <p className="text-xs text-muted-foreground">
                Sign in for more messages
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
