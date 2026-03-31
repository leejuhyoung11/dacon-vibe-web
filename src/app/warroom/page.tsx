"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMyTeams, getHackathons } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { signInWithGoogle } from "@/lib/auth";
import type { Team, Hackathon } from "@/lib/types";
import type { Session, AuthChangeEvent } from "@supabase/supabase-js";
import { LogIn, Shield } from "lucide-react";

function getDDay(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function DDayBadge({ dday }: { dday: number }) {
  if (dday < 0) return <span className="text-xs text-muted-foreground">마감됨</span>;
  const color = dday <= 3 ? "text-red-500" : dday <= 7 ? "text-orange-500" : "text-muted-foreground";
  return <span className={`text-xs font-semibold ${color}`}>D-{dday}</span>;
}

export default function WarroomListPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [hackathonMap, setHackathonMap] = useState<Record<string, Hackathon>>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  useEffect(() => {
    supabase.auth.getSession().then((res: { data: { session: Session | null } }) => {
      setIsLoggedIn(!!res.data.session?.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e: AuthChangeEvent, session: Session | null) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [myTeams, hackathons] = await Promise.all([getMyTeams(), getHackathons()]);
        setTeams(myTeams);
        const map: Record<string, Hackathon> = {};
        hackathons.forEach((h) => { map[h.slug] = h; });
        setHackathonMap(map);
        setStatus("loaded");
      } catch {
        setStatus("error");
      }
    }
    load();
  }, [isLoggedIn]);

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground">로딩중...</div>;
  }
  if (status === "error") {
    return <div className="flex items-center justify-center min-h-[40vh] text-destructive">오류가 발생했습니다.</div>;
  }

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 flex flex-col items-center gap-4 text-center">
        <Shield size={48} className="text-muted-foreground" />
        <h1 className="text-xl font-bold">작전실은 로그인 후 이용할 수 있습니다</h1>
        <button
          onClick={() => signInWithGoogle()}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <LogIn size={14} /> Google 로그인
        </button>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 flex flex-col items-center gap-4 text-center">
        <Shield size={48} className="text-muted-foreground" />
        <h1 className="text-xl font-bold">아직 작전실이 없어요</h1>
        <p className="text-muted-foreground text-sm">팀을 만들면 작전실이 자동으로 생성됩니다.</p>
        <Link href="/camp" className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
          팀 만들러 가기
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">작전실</h1>
        <p className="text-muted-foreground text-sm mt-1">내가 속한 팀의 협업 공간</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => {
          const hackathon = team.hackathonSlug ? hackathonMap[team.hackathonSlug] : undefined;
          const deadline = hackathon?.period.submissionDeadlineAt;
          const dday = deadline ? getDDay(deadline) : null;
          const isUrgent = dday !== null && dday >= 0 && dday <= 3;

          return (
            <Link
              key={team.teamCode}
              href={`/warroom/${team.teamCode}`}
              className={`rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow ${
                isUrgent ? "border-red-400" : "border-border"
              }`}
            >
              {/* color bar */}
              <div className="h-1.5 bg-primary" />

              <div className="p-5 flex flex-col gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">{hackathon?.title ?? team.hackathonSlug}</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">{team.name}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(team.memberCount, 5) }).map((_, i) => (
                      <span key={i} className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center -ml-1 first:ml-0 border-2 border-card">
                        {team.name[0]}
                      </span>
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">{team.memberCount}명</span>
                  </div>
                  {deadline && dday !== null && <DDayBadge dday={dday} />}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    isUrgent
                      ? "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                      : hackathon?.status === "ended"
                      ? "bg-muted text-muted-foreground"
                      : "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                  }`}>
                    {isUrgent ? "마감 임박" : hackathon?.status === "ended" ? "완료됨" : "진행 중"}
                  </span>
                  <span className="text-xs text-primary font-semibold">작전실 입장 →</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
