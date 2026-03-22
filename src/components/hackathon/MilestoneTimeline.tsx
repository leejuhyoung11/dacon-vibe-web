import type { Milestone } from "@/lib/types";
import { CheckCircle, Circle, Clock } from "lucide-react";

function getMilestoneStatus(at: string): "done" | "current" | "upcoming" {
  const now = Date.now();
  const t = new Date(at).getTime();
  if (t < now - 1000 * 60 * 60 * 24) return "done";
  if (t < now + 1000 * 60 * 60 * 24) return "current";
  return "upcoming";
}

function getDday(at: string): string {
  const diff = Math.ceil((new Date(at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "완료";
  if (diff === 0) return "오늘";
  return `D-${diff}`;
}

export default function MilestoneTimeline({ milestones }: { milestones: Milestone[] }) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />

      <div className="space-y-6 pl-12">
        {milestones.map((m, i) => {
          const status = getMilestoneStatus(m.at);
          return (
            <div key={i} className="relative">
              {/* Icon */}
              <div className="absolute -left-12 flex items-center justify-center w-8 h-8">
                {status === "done" ? (
                  <CheckCircle size={20} className="text-primary" />
                ) : status === "current" ? (
                  <Clock size={20} className="text-amber-500 animate-pulse" />
                ) : (
                  <Circle size={20} className="text-border" />
                )}
              </div>

              <div className={`rounded-lg border p-4 ${status === "current" ? "border-amber-400 bg-amber-50 dark:bg-amber-950/20" : "border-border bg-card"}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className={`font-medium text-sm ${status === "done" ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {m.name}
                  </p>
                  <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded ${
                    status === "done" ? "bg-muted text-muted-foreground" :
                    status === "current" ? "bg-amber-400 text-amber-950" :
                    "bg-primary/10 text-primary"
                  }`}>
                    {getDday(m.at)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(m.at).toLocaleString("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
