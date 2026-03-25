"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getHackathons, getTeams, getAllLeaderboards } from "@/lib/storage";
import { Trophy, Users, FileText, ArrowRight } from "lucide-react";

export default function HomePage() {
  const [stats, setStats] = useState({ hackathons: 0, teams: 0, submissions: 0 });

  useEffect(() => {
    async function load() {
      try {
        const [hackathons, teams, leaderboards] = await Promise.all([
          getHackathons(),
          getTeams(),
          getAllLeaderboards(),
        ]);
        const submissions = leaderboards.reduce((acc, lb) => acc + lb.entries.length, 0);
        setStats({ hackathons: hackathons.length, teams: teams.length, submissions });
      } catch {
        // 통계 로드 실패 시 0으로 유지
      }
    }
    load();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[560px] flex items-center bg-gradient-to-br from-lime-950 via-green-900 to-lime-800">
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Glow blobs */}
        <div className="absolute top-10 right-20 w-72 h-72 rounded-full bg-lime-400/10 blur-3xl" />
        <div className="absolute bottom-10 left-20 w-56 h-56 rounded-full bg-green-400/10 blur-3xl" />

        <div className="relative mx-auto w-full max-w-6xl px-4 py-24 text-white">
          {/* Announcement pill */}
          <div className="inline-flex items-center gap-2 mb-8 rounded-full bg-lime-400/20 border border-lime-400/30 px-4 py-1.5 text-sm text-lime-200">
            <span className="text-lime-400 font-mono text-xs">&gt;_</span>
            {stats.hackathons > 0
              ? `${stats.hackathons}개 해커톤 · ${stats.teams}개 팀 · ${stats.submissions}건 제출`
              : "해커톤 플랫폼에 오신 것을 환영합니다"}
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 max-w-2xl">
            해커톤으로{" "}
            <span className="text-lime-400">성장하는</span>
            <br />
            여정을 시작하세요
          </h1>

          <p className="text-lg text-lime-100/80 mb-10 max-w-xl leading-relaxed">
            AI·데이터 전문가들이 모여 도전하고, 팀을 만들고,
            <br />
            함께 성과를 만들어가는 해커톤 플랫폼입니다.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4">
            <Link
              href="/hackathons"
              className="inline-flex items-center gap-2 rounded-lg bg-lime-400 px-6 py-3 font-semibold text-lime-950 hover:bg-lime-300 transition-colors"
            >
              해커톤 보기
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/camp"
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3 font-semibold text-white hover:bg-white/10 transition-colors"
            >
              팀 찾기
            </Link>
          </div>
        </div>
      </section>

      {/* Stats cards */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: <Trophy size={28} className="text-primary" />, value: `${stats.hackathons}개`, label: "해커톤", sub: "등록된 대회" },
            { icon: <Users size={28} className="text-primary" />, value: `${stats.teams}팀`, label: "팀 모집", sub: "활동 중인 팀" },
            { icon: <FileText size={28} className="text-primary" />, value: `${stats.submissions}건`, label: "총 제출", sub: "리더보드 집계" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl bg-card border border-border shadow-sm p-8 flex flex-col items-center text-center gap-3"
            >
              <div className="p-3 rounded-full bg-primary/10">{s.icon}</div>
              <p className="text-3xl font-bold text-foreground">{s.value}</p>
              <div>
                <p className="font-semibold text-foreground">{s.label}</p>
                <span className="text-xs text-muted-foreground mt-0.5 inline-block border border-border rounded px-2 py-0.5">
                  {s.sub}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
