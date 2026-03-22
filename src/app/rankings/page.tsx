"use client";

import { useEffect, useState } from "react";
import { getAllLeaderboards, getHackathons } from "@/lib/storage";
import type { Leaderboard, Hackathon } from "@/lib/types";
import { Medal, Trophy } from "lucide-react";

interface GlobalEntry {
  rank: number;
  teamName: string;
  hackathonTitle: string;
  hackathonSlug: string;
  score: number;
  submittedAt: string;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Medal size={20} className="text-yellow-500" />;
  if (rank === 2) return <Medal size={20} className="text-gray-400" />;
  if (rank === 3) return <Medal size={20} className="text-amber-600" />;
  return <span className="text-sm font-semibold text-muted-foreground">{rank}</span>;
}

export default function RankingsPage() {
  const [entries, setEntries] = useState<GlobalEntry[]>([]);

  useEffect(() => {
    const leaderboards = getAllLeaderboards();
    const hackathons = getHackathons();
    const hackathonMap = Object.fromEntries(hackathons.map((h) => [h.slug, h.title]));

    const all: GlobalEntry[] = leaderboards.flatMap((lb) =>
      lb.entries.map((e) => ({
        rank: 0,
        teamName: e.teamName,
        hackathonTitle: hackathonMap[lb.hackathonSlug] ?? lb.hackathonSlug,
        hackathonSlug: lb.hackathonSlug,
        score: e.score,
        submittedAt: e.submittedAt,
      }))
    );

    // Sort by score descending and assign global rank
    all.sort((a, b) => b.score - a.score);
    all.forEach((e, i) => { e.rank = i + 1; });

    setEntries(all);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-full bg-primary/10">
          <Trophy size={24} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">글로벌 랭킹</h1>
          <p className="text-muted-foreground text-sm">전체 해커톤 참가 기록 기반 통합 순위</p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">아직 등록된 제출 내역이 없습니다.</div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground w-16">순위</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">팀명</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground hidden md:table-cell">해커톤</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">점수</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground hidden sm:table-cell">제출일</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr
                  key={i}
                  className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${e.rank <= 3 ? "bg-primary/5" : ""}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center w-8">
                      <RankBadge rank={e.rank} />
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{e.teamName}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell max-w-[200px] truncate">
                    {e.hackathonTitle}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-primary">
                    {e.score < 1 ? e.score.toFixed(4) : e.score.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground hidden sm:table-cell">
                    {new Date(e.submittedAt).toLocaleDateString("ko-KR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
