"use client";

import { useEffect, useState } from "react";
import { getHackathons } from "@/lib/storage";
import type { Hackathon } from "@/lib/types";
import HackathonListItem from "@/components/hackathon/HackathonListItem";
import { Trophy } from "lucide-react";

type Filter = "all" | "ongoing" | "upcoming" | "ended";
type Status = "loading" | "loaded" | "error";

export default function HackathonsPage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    async function load() {
      try {
        const data = await getHackathons();
        setHackathons(data);
        setStatus("loaded");
      } catch {
        setStatus("error");
      }
    }
    load();
  }, []);

  const filtered = filter === "all" ? hackathons : hackathons.filter((h) => h.status === filter);

  const filterTabs: { key: Filter; label: string }[] = [
    { key: "all", label: "전체" },
    { key: "ongoing", label: "진행중" },
    { key: "upcoming", label: "예정" },
    { key: "ended", label: "종료" },
  ];

  return (
    <div>
      {/* Hero section */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-14 flex items-center justify-between gap-8">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground mb-3">도전으로 기회를 얻으세요</h1>
            <p className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
              <Trophy size={16} className="text-primary" />
              {hackathons.length}개 해커톤
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6 max-w-md">
              AI와 새로운 생각으로 팀과 함께 어려운 문제를 해결해요.
              <br />
              모두가 함께 성장하고 능력을 검증받는 수많은 기회가 있어요.
            </p>
            <div className="flex gap-3">
              <button className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:opacity-80 transition-opacity">
                참여 방법 알아보기
              </button>
              <button
                onClick={() => document.getElementById("list")?.scrollIntoView({ behavior: "smooth" })}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                해커톤 찾아보기
              </button>
            </div>
          </div>
          <div className="hidden md:flex items-center justify-center text-8xl select-none shrink-0">
            🏔️🚀
          </div>
        </div>
      </section>

      {/* Filter + List */}
      <section id="list" className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex gap-1 mb-6 border-b border-border">
          {filterTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                filter === t.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {status === "loading" && (
          <div className="py-20 text-center text-muted-foreground">로딩중...</div>
        )}
        {status === "error" && (
          <div className="py-20 text-center text-destructive">데이터를 불러오는 중 오류가 발생했습니다.</div>
        )}
        {status === "loaded" && filtered.length === 0 && (
          <div className="py-20 text-center text-muted-foreground">데이터 없음</div>
        )}
        {status === "loaded" && filtered.length > 0 && (
          <div className="divide-y divide-border">
            {filtered.map((h) => (
              <HackathonListItem key={h.slug} hackathon={h} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
