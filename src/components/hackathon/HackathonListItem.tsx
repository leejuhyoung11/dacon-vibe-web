import Link from "next/link";
import type { Hackathon } from "@/lib/types";

function getDday(endAt: string): string {
  const diff = Math.ceil((new Date(endAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "종료";
  if (diff === 0) return "D-day";
  return `D-${diff}`;
}

function StatusBadge({ status }: { status: Hackathon["status"] }) {
  const map = {
    ongoing: { label: "진행중", color: "bg-green-500" },
    upcoming: { label: "예정", color: "bg-lime-400" },
    ended: { label: "마감", color: "bg-gray-400" },
  };
  const { label, color } = map[status];
  return (
    <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

export default function HackathonListItem({ hackathon }: { hackathon: Hackathon }) {
  const dday = getDday(hackathon.period.endAt);

  return (
    <Link href={hackathon.links.detail} className="group block">
      <div className="flex items-center gap-4 py-5 px-2 hover:bg-muted/40 rounded-lg transition-colors">
        {/* Thumbnail */}
        <div className="shrink-0 w-[80px] h-[80px] rounded-xl overflow-hidden border border-border bg-muted">
          <img
            src={hackathon.thumbnailUrl}
            alt={hackathon.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-[15px] leading-snug group-hover:text-primary transition-colors line-clamp-1">
            {hackathon.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
            {hackathon.tags.join(" · ")}
          </p>
        </div>

        {/* Right: status + meta */}
        <div className="shrink-0 text-right space-y-1">
          <StatusBadge status={hackathon.status} />
          <p className="text-xs text-muted-foreground">
            {hackathon.status === "ended"
              ? new Date(hackathon.period.endAt).toLocaleDateString("ko-KR")
              : `종료까지 ${dday}`}
          </p>
        </div>
      </div>
    </Link>
  );
}
