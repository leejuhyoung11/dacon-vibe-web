"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getTeams, getHackathons, addTeam } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { signInWithGoogle } from "@/lib/auth";
import type { Session, AuthChangeEvent } from "@supabase/supabase-js";
import type { Team, Hackathon } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Users, ExternalLink, Plus, X, LogIn } from "lucide-react";
import { Suspense } from "react";

function CampContent() {
  const searchParams = useSearchParams();
  const hackathonFilter = searchParams.get("hackathon") ?? "all";

  const [teams, setTeams] = useState<Team[]>([]);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [selectedHackathon, setSelectedHackathon] = useState(hackathonFilter);
  const [openOnly, setOpenOnly] = useState(false);
  const [roleFilter, setRoleFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", intro: "", lookingFor: "", contactUrl: "", hackathonSlug: hackathonFilter !== "all" ? hackathonFilter : "" });
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [teamData, hackathonData] = await Promise.all([
          getTeams(),
          getHackathons(),
        ]);
        setTeams(teamData);
        setHackathons(hackathonData);
        setStatus("loaded");
      } catch {
        setStatus("error");
      }
    }
    load();

    supabase.auth.getSession().then((res: { data: { session: Session | null } }) => {
      setIsLoggedIn(!!res.data.session?.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  const allRoles = Array.from(new Set(teams.flatMap((t) => t.lookingFor)));

  const filtered = teams.filter((t) => {
    if (selectedHackathon !== "all" && t.hackathonSlug !== selectedHackathon) return false;
    if (openOnly && !t.isOpen) return false;
    if (roleFilter && !t.lookingFor.includes(roleFilter)) return false;
    return true;
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!isLoggedIn) {
      setFormError("팀을 만들려면 로그인이 필요합니다.");
      return;
    }
    try {
      const team: Team = {
        teamCode: `T-${Date.now()}`,
        hackathonSlug: form.hackathonSlug,
        name: form.name,
        isOpen: true,
        memberCount: 1,
        lookingFor: form.lookingFor.split(",").map((s) => s.trim()).filter(Boolean),
        intro: form.intro,
        contact: { type: "link", url: form.contactUrl },
        createdAt: new Date().toISOString(),
      };
      await addTeam(team);
      const updated = await getTeams();
      setTeams(updated);
      setShowForm(false);
      setForm({ name: "", intro: "", lookingFor: "", contactUrl: "", hackathonSlug: "" });
    } catch {
      setFormError("팀 등록에 실패했습니다. 다시 시도해 주세요.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">팀 모집</h1>
          <p className="text-muted-foreground text-sm mt-1">함께할 팀원을 찾거나, 새로운 팀을 만들어보세요.</p>
        </div>
        <button
          onClick={() => {
            if (!isLoggedIn) { setShowForm(false); return; }
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          팀 만들기
        </button>
      </div>

      {/* 로그인 필요 알림 */}
      {!isLoggedIn && (
        <div className="mb-6 rounded-xl border border-border bg-muted/40 p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">팀 만들기와 제출은 로그인 후 이용할 수 있습니다.</p>
          <button
            onClick={() => signInWithGoogle()}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 shrink-0"
          >
            <LogIn size={12} /> Google 로그인
          </button>
        </div>
      )}

      {/* Team creation form */}
      {showForm && isLoggedIn && (
        <div className="mb-6 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">새 팀 등록</h2>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
          </div>
          {formError && (
            <p className="text-sm text-destructive mb-3">{formError}</p>
          )}
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">팀 이름 *</label>
              <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="팀 이름" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">해커톤</label>
              <select value={form.hackathonSlug} onChange={(e) => setForm((f) => ({ ...f, hackathonSlug: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">선택하세요</option>
                {hackathons.map((h) => <option key={h.slug} value={h.slug}>{h.title}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">팀 소개 *</label>
              <textarea required value={form.intro} onChange={(e) => setForm((f) => ({ ...f, intro: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                rows={2} placeholder="팀 소개를 입력하세요" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">모집 역할 (쉼표로 구분)</label>
              <input value={form.lookingFor} onChange={(e) => setForm((f) => ({ ...f, lookingFor: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Frontend, Designer" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">연락처 URL *</label>
              <input required value={form.contactUrl} onChange={(e) => setForm((f) => ({ ...f, contactUrl: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="https://open.kakao.com/..." />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <button type="submit" className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
                팀 등록
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={selectedHackathon}
          onChange={(e) => setSelectedHackathon(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">전체 해커톤</option>
          {hackathons.map((h) => <option key={h.slug} value={h.slug}>{h.title}</option>)}
        </select>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} className="accent-primary" />
          모집 중만
        </label>

        {allRoles.length > 0 && (
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">모든 역할</option>
            {allRoles.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        )}

        <span className="self-center text-sm text-muted-foreground">{filtered.length}팀</span>
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((team) => (
            <div key={team.teamCode} className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">{team.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{team.teamCode}</p>
                </div>
                <Badge variant={team.isOpen ? "default" : "secondary"} className={team.isOpen ? "bg-green-500 text-white text-xs" : "text-xs"}>
                  {team.isOpen ? "모집중" : "마감"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{team.intro}</p>
              {team.lookingFor.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {team.lookingFor.map((r) => (
                    <Badge key={r} variant="outline" className="text-xs">{r}</Badge>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users size={12} /> {team.memberCount}명
                </span>
                <a href={team.contact.url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                  연락하기 <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CampPage() {
  return (
    <Suspense>
      <CampContent />
    </Suspense>
  );
}
