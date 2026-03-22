import type { LeaderboardEntry } from "@/lib/types";
import { Medal } from "lucide-react";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Medal size={20} className="text-yellow-500" />;
  if (rank === 2) return <Medal size={20} className="text-gray-400" />;
  if (rank === 3) return <Medal size={20} className="text-amber-600" />;
  return <span className="text-sm font-semibold text-muted-foreground w-5 text-center">{rank}</span>;
}

export default function LeaderboardTable({
  entries,
  note,
}: {
  entries: LeaderboardEntry[];
  note?: string;
}) {
  if (entries.length === 0) {
    return <p className="text-center py-12 text-muted-foreground">아직 제출 내역이 없습니다.</p>;
  }

  const hasBreakdown = entries.some((e) => e.scoreBreakdown);
  const hasArtifacts = entries.some((e) => e.artifacts);

  return (
    <div className="space-y-3">
      {note && <p className="text-xs text-muted-foreground border border-border rounded-lg px-3 py-2 bg-muted/40">{note}</p>}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground w-12">순위</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">팀명</th>
              <th className="px-4 py-3 text-right font-semibold text-muted-foreground">점수</th>
              {hasBreakdown && (
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground hidden md:table-cell">
                  참가자 / 심사위원
                </th>
              )}
              {hasArtifacts && (
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground hidden lg:table-cell">
                  제출물
                </th>
              )}
              <th className="px-4 py-3 text-right font-semibold text-muted-foreground hidden sm:table-cell">제출일</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr
                key={i}
                className={`border-b border-border last:border-0 transition-colors hover:bg-muted/30 ${
                  entry.rank <= 3 ? "bg-primary/5" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center">
                    <RankBadge rank={entry.rank} />
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-foreground">{entry.teamName}</td>
                <td className="px-4 py-3 text-right font-bold text-primary">
                  {typeof entry.score === "number" && entry.score < 1
                    ? entry.score.toFixed(4)
                    : entry.score.toFixed(1)}
                </td>
                {hasBreakdown && (
                  <td className="px-4 py-3 text-right text-muted-foreground text-xs hidden md:table-cell">
                    {entry.scoreBreakdown
                      ? `${entry.scoreBreakdown.participant} / ${entry.scoreBreakdown.judge}`
                      : "—"}
                  </td>
                )}
                {hasArtifacts && (
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    <div className="flex items-center justify-center gap-2">
                      {entry.artifacts?.webUrl && (
                        <a href={entry.artifacts.webUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                          🔗 웹
                        </a>
                      )}
                      {entry.artifacts?.pdfUrl && (
                        <a href={entry.artifacts.pdfUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                          📄 PDF
                        </a>
                      )}
                    </div>
                  </td>
                )}
                <td className="px-4 py-3 text-right text-xs text-muted-foreground hidden sm:table-cell">
                  {new Date(entry.submittedAt).toLocaleDateString("ko-KR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
