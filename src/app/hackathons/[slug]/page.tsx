"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getHackathonDetail, getHackathons, getLeaderboard, getTeamsByHackathon, addSubmission, getSubmissions } from "@/lib/storage";
import type { HackathonDetail, Hackathon, Leaderboard, Team, Submission } from "@/lib/types";
import MilestoneTimeline from "@/components/hackathon/MilestoneTimeline";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ExternalLink, Users, ChevronRight } from "lucide-react";

export default function HackathonDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [detail, setDetail] = useState<HackathonDetail | null>(null);
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  // Submit form state
  const [submitValues, setSubmitValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const d = getHackathonDetail(slug);
    const h = getHackathons().find((x) => x.slug === slug) ?? null;
    const lb = getLeaderboard(slug);
    const t = getTeamsByHackathon(slug);
    const s = getSubmissions(slug);
    setDetail(d);
    setHackathon(h);
    setLeaderboard(lb);
    setTeams(t);
    setSubmissions(s);
  }, [slug]);

  if (!detail || !hackathon) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground">
        해커톤 정보를 불러오는 중...
      </div>
    );
  }

  const { sections } = detail;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const sub: Submission = {
      id: crypto.randomUUID(),
      hackathonSlug: slug,
      teamName: "나의 팀",
      artifactType: sections.submit.allowedArtifactTypes[0],
      value: Object.values(submitValues).join(", "),
      submittedAt: new Date().toISOString(),
    };
    addSubmission(sub);
    setSubmissions((prev) => [...prev, sub]);
    setSubmitted(true);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="flex items-start gap-5 mb-8">
        <div className="w-20 h-20 rounded-xl overflow-hidden border border-border bg-muted shrink-0">
          <img src={hackathon.thumbnailUrl} alt={hackathon.title} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge
              variant={hackathon.status === "ongoing" ? "default" : "secondary"}
              className={hackathon.status === "ongoing" ? "bg-green-500 text-white" : ""}
            >
              {hackathon.status === "ongoing" ? "진행중" : hackathon.status === "upcoming" ? "예정" : "종료"}
            </Badge>
            {hackathon.tags.map((t) => (
              <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
            ))}
          </div>
          <h1 className="text-2xl font-bold text-foreground leading-snug">{detail.title}</h1>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto h-auto flex-wrap bg-muted/40 mb-6">
          {[
            { value: "overview", label: "개요" },
            { value: "eval", label: "평가" },
            { value: "schedule", label: "일정" },
            { value: "prize", label: "상금" },
            { value: "teams", label: "팀" },
            { value: "submit", label: "제출" },
            { value: "leaderboard", label: "리더보드" },
          ].map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="text-sm">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* 개요 */}
        <TabsContent value="overview" className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold text-lg mb-3">대회 소개</h2>
            <p className="text-muted-foreground leading-relaxed">{sections.overview.summary}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold text-lg mb-3">팀 구성 정책</h2>
            <div className="flex gap-6 text-sm">
              <div>
                <p className="text-muted-foreground">개인 참가</p>
                <p className="font-semibold mt-1">{sections.overview.teamPolicy.allowSolo ? "✅ 가능" : "❌ 불가"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">최대 팀 크기</p>
                <p className="font-semibold mt-1">{sections.overview.teamPolicy.maxTeamSize}인</p>
              </div>
            </div>
          </div>
          {sections.info.notice.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-6">
              <h2 className="font-semibold text-lg mb-3">공지 사항</h2>
              <ul className="space-y-2">
                {sections.info.notice.map((n, i) => (
                  <li key={i} className="text-sm text-foreground flex gap-2">
                    <span className="shrink-0 text-amber-500">•</span>
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>

        {/* 평가 */}
        <TabsContent value="eval" className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wide mb-1">평가 지표</p>
            <p className="text-2xl font-bold text-primary mb-2">{sections.eval.metricName}</p>
            <p className="text-muted-foreground text-sm">{sections.eval.description}</p>
          </div>
          {sections.eval.limits && (
            <div className="rounded-xl border border-border bg-card p-6 grid grid-cols-2 gap-4">
              {sections.eval.limits.maxRuntimeSec && (
                <div>
                  <p className="text-xs text-muted-foreground">최대 실행 시간</p>
                  <p className="font-semibold mt-1">{sections.eval.limits.maxRuntimeSec / 60}분</p>
                </div>
              )}
              {sections.eval.limits.maxSubmissionsPerDay && (
                <div>
                  <p className="text-xs text-muted-foreground">일일 최대 제출 수</p>
                  <p className="font-semibold mt-1">{sections.eval.limits.maxSubmissionsPerDay}회</p>
                </div>
              )}
            </div>
          )}
          {sections.eval.scoreDisplay && (
            <div className="rounded-xl border border-border bg-card p-6">
              <p className="font-semibold mb-4">투표 가중치</p>
              <div className="space-y-3">
                {sections.eval.scoreDisplay.breakdown.map((b) => (
                  <div key={b.key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground">{b.label}</span>
                      <span className="font-semibold text-primary">{b.weightPercent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${b.weightPercent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* 일정 */}
        <TabsContent value="schedule">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold text-lg mb-6">대회 일정</h2>
            <MilestoneTimeline milestones={sections.schedule.milestones} />
          </div>
        </TabsContent>

        {/* 상금 */}
        <TabsContent value="prize">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold text-lg mb-4">시상 내역</h2>
            <div className="space-y-3">
              {sections.prize.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {item.place === "1st" ? "🥇" : item.place === "2nd" ? "🥈" : item.place === "3rd" ? "🥉" : "🏅"}
                    </span>
                    <span className="font-semibold">{item.place}</span>
                  </div>
                  <span className="font-bold text-primary text-lg">
                    {(item.amountKRW / 10000).toLocaleString()}만원
                  </span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* 팀 */}
        <TabsContent value="teams" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">참여 팀 {teams.length}개</p>
            <Link
              href={sections.teams.listUrl}
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              팀 모집 전체 보기 <ChevronRight size={14} />
            </Link>
          </div>
          {teams.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">아직 등록된 팀이 없습니다.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {teams.map((team) => (
                <div key={team.teamCode} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-semibold text-foreground">{team.name}</p>
                    <Badge variant={team.isOpen ? "default" : "secondary"} className={team.isOpen ? "bg-green-500 text-white text-xs" : "text-xs"}>
                      {team.isOpen ? "모집중" : "마감"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{team.intro}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {team.lookingFor.map((r) => (
                      <Badge key={r} variant="outline" className="text-xs">{r}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users size={12} />
                      {team.memberCount}명
                    </span>
                    <a href={team.contact.url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline">
                      연락하기 <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 제출 */}
        <TabsContent value="submit" className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold text-lg mb-3">제출 안내</h2>
            <ul className="space-y-2 mb-6">
              {sections.submit.guide.map((g, i) => (
                <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                  <span className="shrink-0 text-primary font-bold">{i + 1}.</span>
                  {g}
                </li>
              ))}
            </ul>

            {submitted ? (
              <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-4 text-center">
                <p className="font-semibold text-green-700 dark:text-green-400">✅ 제출이 완료되었습니다!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {sections.submit.submissionItems ? (
                  sections.submit.submissionItems.map((item) => (
                    <div key={item.key}>
                      <label className="block text-sm font-medium text-foreground mb-1">{item.title}</label>
                      <input
                        type="url"
                        placeholder={item.format.includes("url") ? "https://" : "내용을 입력하세요"}
                        value={submitValues[item.key] ?? ""}
                        onChange={(e) => setSubmitValues((v) => ({ ...v, [item.key]: e.target.value }))}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  ))
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      제출 파일 ({sections.submit.allowedArtifactTypes.join(", ")})
                    </label>
                    <input
                      type="text"
                      placeholder="파일 경로 또는 URL"
                      value={submitValues["main"] ?? ""}
                      onChange={(e) => setSubmitValues({ main: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  제출하기
                </button>
              </form>
            )}
          </div>

          {submissions.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold mb-3">내 제출 내역</h3>
              <div className="space-y-2">
                {submissions.map((s) => (
                  <div key={s.id} className="text-sm flex justify-between py-2 border-b border-border last:border-0">
                    <span className="text-muted-foreground">{s.value}</span>
                    <span className="text-xs text-muted-foreground">{new Date(s.submittedAt).toLocaleString("ko-KR")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* 리더보드 */}
        <TabsContent value="leaderboard">
          <LeaderboardTable
            entries={leaderboard?.entries ?? []}
            note={sections.leaderboard.note}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
