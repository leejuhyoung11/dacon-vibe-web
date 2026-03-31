"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getTeamByCode, getHackathonDetail, getWarroomTasks, addWarroomTask,
  updateWarroomTask, deleteWarroomTask, getWarroomChats, addWarroomChat,
  getWarroomSubmissions, upsertWarroomSubmission,
  getWarroomFiles, addWarroomFile, deleteWarroomFile,
  getRecruitPost, upsertRecruitPost,
  getApplicants, updateApplicantStatus, incrementTeamMemberCount, transitionToTeamParticipation,
  getProfileInfo, getProfilePortfolios, getProfileFeedbacks, getProfileMedals,
  getHackathons, updateTeamHackathon, updateTeamOpen,
  sendTeamInvitation, getTeamInvitations, getTeamMembers, updateTeamRecruitInfo,
} from "@/lib/storage";
import type { TeamMember } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import type { Team, Hackathon, HackathonDetail, WarroomTask, WarroomChat, WarroomSubmission, WarroomFile, RecruitPost, Applicant, ProfileInfo, ProfilePortfolio, ProfileFeedback, ProfileMedals, HackathonMedal, CommunityMedal, TeamInvitation } from "@/lib/types";
import type { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { ArrowLeft, Plus, Trash2, Send, CheckCircle2, Circle, X, Upload, Check, Users, Github, Linkedin, Mail } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDDay(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function DDayBadge({ dateStr, label }: { dateStr: string; label: string }) {
  const d = getDDay(dateStr);
  const badgeColor = d < 0 ? "bg-muted text-muted-foreground"
    : d <= 3 ? "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400"
    : d <= 7 ? "bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-500"
    : "bg-muted text-muted-foreground";
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-foreground leading-tight">{label}</span>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ml-2 ${badgeColor}`}>
        {d < 0 ? "마감됨" : `D-${d}`}
      </span>
    </div>
  );
}

const PRIORITY_LABEL: Record<string, string> = { high: "높음", medium: "중", low: "낮음" };
const PRIORITY_COLOR: Record<string, string> = {
  high: "text-red-500 bg-red-50 dark:bg-red-950/20",
  medium: "text-orange-500 bg-orange-50 dark:bg-orange-950/20",
  low: "text-muted-foreground bg-muted",
};
const STATUS_LABEL: Record<string, string> = { todo: "할 일", inprogress: "진행 중", done: "완료" };

// ─── Applicant Profile Modal ──────────────────────────────────────────────────

const MEDAL_STYLES: Record<HackathonMedal, { bg: string; color: string }> = {
  Novice:  { bg: "#F5F5F5", color: "#666" },
  Bronze:  { bg: "#FAECE7", color: "#712B13" },
  Silver:  { bg: "#F1EFE8", color: "#444441" },
  Gold:    { bg: "#FAEEDA", color: "#633806" },
  Master:  { bg: "#EEEDFE", color: "#3C3489" },
};
const COMMUNITY_STYLES: Record<CommunityMedal, { bg: string; color: string }> = {
  None:        { bg: "#F5F5F5", color: "#666" },
  Contributor: { bg: "#EEEDFE", color: "#3C3489" },
  Expert:      { bg: "#DDD9FC", color: "#2D288A" },
  Legend:      { bg: "#C9C3FB", color: "#1E1960" },
};

function ApplicantProfileModal({ applicantId, applicantEmail, onClose }: {
  applicantId: string;
  applicantEmail: string;
  onClose: () => void;
}) {
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [portfolios, setPortfolios] = useState<ProfilePortfolio[]>([]);
  const [feedbacks, setFeedbacks] = useState<ProfileFeedback[]>([]);
  const [medals, setMedals] = useState<ProfileMedals | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [pi, pm, pp, pf] = await Promise.all([
        getProfileInfo(applicantId),
        getProfileMedals(applicantId),
        getProfilePortfolios(applicantId),
        getProfileFeedbacks(applicantId),
      ]);
      setProfile(pi);
      if (pm) setMedals(pm);
      setPortfolios(pp);
      setFeedbacks(pf);
      setLoading(false);
    }
    load();
  }, [applicantId]);

  const initials = (profile?.nickname ?? applicantEmail)[0]?.toUpperCase() ?? "?";
  const hStyle = medals?.hackathon_medal ? MEDAL_STYLES[medals.hackathon_medal] : MEDAL_STYLES.Novice;
  const cStyle = medals?.community_medal ? COMMUNITY_STYLES[medals.community_medal] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-background rounded-2xl border border-border shadow-2xl flex flex-col"
        style={{ maxHeight: "min(90vh, 800px)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-bold">지원자 프로필</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !profile ? (
            <div className="text-center py-20 space-y-3">
              <p className="text-4xl">🔍</p>
              <p className="text-base font-semibold text-foreground">프로필 없음</p>
              <p className="text-sm text-muted-foreground">{applicantEmail}</p>
              <p className="text-sm text-muted-foreground">아직 프로필을 등록하지 않은 사용자입니다.</p>
            </div>
          ) : (
            <div className="space-y-6">

              {/* 프로필 헤더 */}
              <div className="flex items-start gap-5 pb-5 border-b border-border">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.nickname} className="w-16 h-16 rounded-full object-cover shrink-0" />
                ) : (
                  <span className="w-16 h-16 rounded-full bg-primary text-primary-foreground text-xl font-bold flex items-center justify-center shrink-0">
                    {initials}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold text-foreground leading-tight">{profile.nickname}</p>
                  <p className="text-sm text-muted-foreground mb-1">@{profile.nickname.toLowerCase().replace(/\s/g, "")}</p>
                  {profile.bio && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {medals?.hackathon_medal && (
                      <span style={{ background: hStyle.bg, color: hStyle.color }} className="text-xs px-2.5 py-0.5 rounded-full font-medium">{medals.hackathon_medal}</span>
                    )}
                    {medals?.community_medal && medals.community_medal !== "None" && cStyle && (
                      <span style={{ background: cStyle.bg, color: cStyle.color }} className="text-xs px-2.5 py-0.5 rounded-full font-medium">{medals.community_medal}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {profile.github_url && (
                    <a href={profile.github_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                      <Github size={13} /> GitHub
                    </a>
                  )}
                  {profile.linkedin_url && (
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                      <Linkedin size={13} /> LinkedIn
                    </a>
                  )}
                </div>
              </div>

              {/* 직무 & 스킬 */}
              {(profile.roles?.length > 0 || profile.skills?.length > 0) && (
                <div className="space-y-3">
                  {profile.roles?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">직무</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.roles.map((r) => (
                          <span key={r} className="text-sm px-3 py-1 rounded-lg font-medium" style={{ background: "#E6F1FB", color: "#185FA5" }}>{r}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile.skills?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">스킬</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map((s) => (
                          <span key={s} className="text-sm px-3 py-1 rounded-lg border border-border text-muted-foreground">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 포트폴리오 */}
              {portfolios.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">포트폴리오 ({portfolios.length})</p>
                  <div className="space-y-3">
                    {portfolios.map((p) => (
                      <div key={p.id} className="rounded-xl border border-border p-4">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <p className="text-sm font-semibold text-foreground leading-snug">{p.title}</p>
                          {p.demo_url && (
                            <a href={p.demo_url} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline shrink-0">데모 →</a>
                          )}
                        </div>
                        {p.summary && (
                          <p className="text-sm text-muted-foreground leading-relaxed mb-2">{p.summary}</p>
                        )}
                        {p.tech_tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {p.tech_tags.map((t) => (
                              <span key={t} className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 팀원 피드백 */}
              {feedbacks.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">팀원 피드백 ({feedbacks.length})</p>
                  <div className="space-y-3">
                    {feedbacks.map((f) => (
                      <div key={f.id} className="rounded-xl border border-border p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
                            {f.reviewer_nickname[0]?.toUpperCase()}
                          </span>
                          <span className="text-sm font-medium text-foreground">{f.reviewer_nickname}</span>
                          <span className="text-yellow-400 text-sm">{"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{f.content}</p>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {f.team_name} · {new Date(f.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit" })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {portfolios.length === 0 && feedbacks.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">등록된 포트폴리오나 피드백이 없습니다.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Task Modal ───────────────────────────────────────────────────────────────

interface TaskModalProps {
  task: WarroomTask | null; // null = creating new
  teamMembers: string[];
  onSave: (data: Partial<WarroomTask>) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

function TaskModal({ task, teamMembers, onSave, onDelete, onClose }: TaskModalProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [status, setStatus] = useState<WarroomTask["status"]>(task?.status ?? "todo");
  const [priority, setPriority] = useState<WarroomTask["priority"]>(task?.priority ?? "medium");
  const [assignee, setAssignee] = useState(task?.assignee ?? "");
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? task.dueDate.slice(0, 10) : ""
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    await onSave({
      title: title.trim(),
      status,
      priority,
      assignee: assignee || undefined,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
    });
    setSaving(false);
    onClose();
  }

  async function handleDelete() {
    if (!onDelete) return;
    setSaving(true);
    await onDelete();
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
          <h2 className="font-bold text-base">{task ? "태스크 편집" : "새 태스크"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
              제목
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
              placeholder="태스크 제목을 입력하세요"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
              상태
            </label>
            <div className="flex gap-2">
              {(["todo", "inprogress", "done"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    status === s
                      ? s === "todo" ? "bg-muted border-border text-foreground"
                        : s === "inprogress" ? "bg-blue-500 border-blue-500 text-white"
                        : "bg-green-500 border-green-500 text-white"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
              중요도
            </label>
            <div className="flex gap-2">
              {(["high", "medium", "low"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    priority === p
                      ? p === "high" ? "bg-red-500 border-red-500 text-white"
                        : p === "medium" ? "bg-orange-400 border-orange-400 text-white"
                        : "bg-muted border-border text-foreground"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {PRIORITY_LABEL[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
              담당자
            </label>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">미배정</option>
              {teamMembers.map((m) => (
                <option key={m} value={m}>{m.split("@")[0]}</option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
              데드라인
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 pb-5">
          {task && onDelete ? (
            <button
              onClick={handleDelete}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 disabled:opacity-50"
            >
              <Trash2 size={13} /> 삭제
            </button>
          ) : <div />}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted">
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || saving}
              className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "저장 중..." : task ? "저장" : "만들기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Task Card (minimal, click to open modal) ─────────────────────────────────

function TaskCard({ task, onClick }: { task: WarroomTask; onClick: () => void }) {
  const hasDue = !!task.dueDate;
  const dday = hasDue ? getDDay(task.dueDate!) : null;
  const dueColor = dday === null ? "" : dday <= 3 ? "text-red-500" : dday <= 7 ? "text-orange-500" : "text-muted-foreground";

  return (
    <button
      onClick={onClick}
      draggable
      onDragStart={(e) => e.dataTransfer.setData("taskId", task.id)}
      className="w-full text-left bg-background rounded-xl border border-border p-3.5 cursor-pointer hover:shadow-sm hover:border-primary/40 transition-all active:scale-[0.99]"
    >
      <p className="text-sm font-medium leading-snug mb-2.5">{task.title}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${PRIORITY_COLOR[task.priority]}`}>
          {PRIORITY_LABEL[task.priority]}
        </span>
        {hasDue && dday !== null && (
          <span className={`text-[10px] font-medium ${dueColor}`}>
            {dday < 0 ? "기한 초과" : `D-${dday}`}
          </span>
        )}
        {task.assignee && (
          <span className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
            @{task.assignee.split("@")[0]}
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function WarroomContent() {
  const { teamCode } = useParams<{ teamCode: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") ?? "tasks";

  const [team, setTeam] = useState<Team | null>(null);
  const [detail, setDetail] = useState<HackathonDetail | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  const [tasks, setTasks] = useState<WarroomTask[]>([]);
  const [modalTaskId, setModalTaskId] = useState<string | "new" | null>(null);

  const [chats, setChats] = useState<WarroomChat[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [wSubmissions, setWSubmissions] = useState<WarroomSubmission[]>([]);
  const [subUrls, setSubUrls] = useState<Record<string, string>>({});

  // Files
  const [files, setFiles] = useState<WarroomFile[]>([]);
  const [fileUploading, setFileUploading] = useState(false);
  const [fileDragOver, setFileDragOver] = useState(false);

  // Recruit
  const [recruitPost, setRecruitPost] = useState<RecruitPost | null>(null);
  const [recruitForm, setRecruitForm] = useState({ positions: [] as string[], description: "", contactUrl: "", requirements: "", isOpen: true });
  const [recruitPositionInput, setRecruitPositionInput] = useState("");
  const [recruitSaving, setRecruitSaving] = useState(false);

  // Team / Applicants
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [profileModal, setProfileModal] = useState<{ id: string; email: string } | null>(null);

  // Invitations
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteError, setInviteError] = useState("");

  // Settings
  const [allHackathons, setAllHackathons] = useState<Hackathon[]>([]);
  const [settingHackathonSlug, setSettingHackathonSlug] = useState("");
  const [settingSaving, setSettingSaving] = useState(false);
  const [settingSaved, setSettingSaved] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then((res: { data: { session: Session | null } }) => {
      if (!res.data.session?.user) { router.replace("/warroom"); return; }
      setUser(res.data.session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e: AuthChangeEvent, session: Session | null) => {
      if (!session?.user) { router.replace("/warroom"); return; }
      setUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    async function load() {
      try {
        const [result, hackathons] = await Promise.all([
          getTeamByCode(teamCode),
          getHackathons(),
        ]);
        if (!result) { setStatus("error"); return; }
        setTeam(result.team);
        setAllHackathons(hackathons);
        setSettingHackathonSlug(result.team.hackathonSlug ?? "");
        const { data: { session: sess } } = await supabase.auth.getSession();
        setIsCreator(!!sess?.user && result.creatorId === sess.user.id);
        const [d, t, mems] = await Promise.all([
          result.team.hackathonSlug ? getHackathonDetail(result.team.hackathonSlug) : Promise.resolve(null),
          getWarroomTasks(teamCode),
          getTeamMembers(teamCode),
        ]);
        setDetail(d);
        setTasks(t);
        setMembers(mems);
        setStatus("loaded");
      } catch {
        setStatus("error");
      }
    }
    load();
  }, [teamCode]);

  useEffect(() => {
    if (activeTab === "chat") {
      getWarroomChats(teamCode).then(setChats);
    } else if (activeTab === "submit") {
      getWarroomSubmissions(teamCode).then((subs) => {
        setWSubmissions(subs);
        const urls: Record<string, string> = {};
        subs.forEach((s) => { if (s.url) urls[s.deadlineKey] = s.url; });
        setSubUrls(urls);
      });
    } else if (activeTab === "files") {
      getWarroomFiles(teamCode).then(setFiles);
    } else if (activeTab === "recruit") {
      getRecruitPost(teamCode).then((post) => {
        setRecruitPost(post);
        // positions/description/contactUrl은 항상 team 데이터 기준
        // requirements/isOpen만 공고 저장값 사용
        setRecruitForm({
          positions: team?.lookingFor ?? [],
          description: team?.intro ?? "",
          contactUrl: team?.contact?.url ?? "",
          requirements: post?.requirements ?? "",
          isOpen: post?.isOpen ?? true,
        });
      });
    } else if (activeTab === "team") {
      Promise.all([
        getApplicants(teamCode),
        getTeamInvitations(teamCode),
        getTeamMembers(teamCode),
      ]).then(([apps, invs, mems]) => {
        setApplicants(apps);
        setInvitations(invs);
        setMembers(mems);
      });
    }
  }, [activeTab, teamCode, team]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats]);

  // ─── Task handlers ──────────────────────────────────────────────────────────

  async function handleSaveTask(data: Partial<WarroomTask>) {
    if (modalTaskId === "new") {
      await addWarroomTask({
        teamCode,
        title: data.title!,
        status: data.status ?? "todo",
        priority: data.priority ?? "medium",
        assignee: data.assignee,
        dueDate: data.dueDate,
      });
    } else if (modalTaskId) {
      await updateWarroomTask(modalTaskId, data);
    }
    const updated = await getWarroomTasks(teamCode);
    setTasks(updated);
  }

  async function handleDeleteTask() {
    if (!modalTaskId || modalTaskId === "new") return;
    await deleteWarroomTask(modalTaskId);
    setTasks((prev) => prev.filter((t) => t.id !== modalTaskId));
  }

  function handleDragOver(e: React.DragEvent) { e.preventDefault(); }

  async function handleDrop(e: React.DragEvent, newStatus: WarroomTask["status"]) {
    const taskId = e.dataTransfer.getData("taskId");
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
    await updateWarroomTask(taskId, { status: newStatus });
  }

  // ─── Chat handlers ──────────────────────────────────────────────────────────

  async function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || !user) return;
    await addWarroomChat(teamCode, chatInput.trim());
    setChatInput("");
    const updated = await getWarroomChats(teamCode);
    setChats(updated);
  }

  // ─── Submit handlers ─────────────────────────────────────────────────────────

  async function handleSubmit(deadlineKey: string) {
    const url = subUrls[deadlineKey];
    if (!url?.trim()) return;
    await upsertWarroomSubmission({
      teamCode, deadlineKey, status: "submitted",
      url: url.trim(), submittedBy: user?.email ?? "",
      submittedAt: new Date().toISOString(),
      confirmedBy: user?.email ? [user.email] : [],
    });
    const updated = await getWarroomSubmissions(teamCode);
    setWSubmissions(updated);
    await addWarroomChat(
      teamCode,
      `[시스템] ${user?.email?.split("@")[0]}이(가) "${deadlineKey}" 제출물을 제출했습니다.`,
      true,
    );
  }

  // ─── File handlers ───────────────────────────────────────────────────────────

  async function handleFileUpload(file: File) {
    if (!user) return;
    const allowed = ["application/pdf", "image/png", "image/jpeg", "image/gif", "image/webp", "application/zip"];
    if (!allowed.includes(file.type)) { alert("PDF, 이미지, ZIP 파일만 업로드 가능합니다."); return; }
    if (file.size > 50 * 1024 * 1024) { alert("파일 크기는 50MB를 초과할 수 없습니다."); return; }
    setFileUploading(true);
    try {
      const path = `${teamCode}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("team-files").upload(path, file);
      let fileUrl = "";
      if (uploadError) {
        // Storage not configured: use object URL as fallback for demo
        fileUrl = URL.createObjectURL(file);
      } else {
        const { data: { publicUrl } } = supabase.storage.from("team-files").getPublicUrl(path);
        fileUrl = publicUrl;
      }
      await addWarroomFile({
        teamCode,
        fileName: file.name,
        fileUrl,
        storagePath: path,
        fileType: file.type,
        fileSize: file.size,
        uploaderId: user.id,
        uploaderEmail: user.email ?? "",
      });
      const updated = await getWarroomFiles(teamCode);
      setFiles(updated);
    } catch {
      alert("파일 업로드 중 오류가 발생했습니다.");
    } finally {
      setFileUploading(false);
    }
  }

  async function handleDeleteFile(file: WarroomFile) {
    if (!confirm(`"${file.fileName}" 파일을 삭제할까요?`)) return;
    await deleteWarroomFile(file.id, file.storagePath);
    setFiles((prev) => prev.filter((f) => f.id !== file.id));
  }

  // ─── Recruit handlers ─────────────────────────────────────────────────────────

  async function handleSaveRecruitPost() {
    // 기존 글 있으면 토글만 변경도 저장 허용, 신규 등록은 필수 필드 체크
    if (!recruitPost && (!recruitForm.description.trim() || !recruitForm.contactUrl.trim())) return;
    setRecruitSaving(true);
    try {
      await upsertRecruitPost({ teamCode, ...recruitForm });
      await updateTeamOpen(teamCode, recruitForm.isOpen);
      const [updated, updatedTeam] = await Promise.all([
        getRecruitPost(teamCode),
        updateTeamRecruitInfo(teamCode, recruitForm.positions, recruitForm.description, recruitForm.contactUrl),
      ]);
      setRecruitPost(updated);
      if (updatedTeam) setTeam(updatedTeam);
    } finally {
      setRecruitSaving(false);
    }
  }

  // ─── Applicant handlers ───────────────────────────────────────────────────────

  async function handleApplicant(applicant: Applicant, action: "accepted" | "rejected") {
    await updateApplicantStatus(applicant.id, action);
    setApplicants((prev) => prev.map((a) => a.id === applicant.id ? { ...a, status: action } : a));
    if (action === "accepted") {
      const updatedTeam = await incrementTeamMemberCount(applicant.teamCode);
      if (updatedTeam) setTeam(updatedTeam);
      // 수락된 멤버의 해커톤 참여 상태를 팀 참여로 전환
      if (team?.hackathonSlug) {
        try {
          await transitionToTeamParticipation(
            applicant.applicantId,
            team.hackathonSlug,
            applicant.teamCode,
          );
        } catch (e) {
          console.warn("participation transition failed", e);
        }
      }
      const mems = await getTeamMembers(applicant.teamCode);
      setMembers(mems);
    }
  }

  async function handleSendInvite() {
    if (!inviteEmail.trim() || !team) return;
    setInviteSending(true);
    setInviteError("");
    try {
      await sendTeamInvitation(teamCode, team.name, inviteEmail.trim().toLowerCase());
      const updated = await getTeamInvitations(teamCode);
      setInvitations(updated);
      setInviteEmail("");
    } catch (e) {
      setInviteError(e instanceof Error ? e.message : "초대장 전송에 실패했습니다");
    } finally {
      setInviteSending(false);
    }
  }

  async function handleSaveHackathon() {
    if (!settingHackathonSlug || !team) return;
    setSettingSaving(true);
    try {
      await updateTeamHackathon(teamCode, settingHackathonSlug);
      const [updatedResult, d] = await Promise.all([
        getTeamByCode(teamCode),
        getHackathonDetail(settingHackathonSlug),
      ]);
      if (updatedResult) setTeam(updatedResult.team);
      setDetail(d);
      // 해커톤 마일스톤 기반 기본 태스크 생성
      const milestones = d?.sections.schedule.milestones ?? [];
      if (milestones.length > 0 && tasks.length === 0) {
        const defaultTasks = [
          { title: "기획서 작성", milestone: milestones.find((m) => m.name.includes("기획서")) },
          { title: "산출물 개발", milestone: milestones.find((m) => m.name.includes("웹링크") || m.name.includes("제출 마감")) },
          { title: "최종 제출", milestone: milestones[milestones.length - 1] },
        ];
        await Promise.all(defaultTasks.map((t) =>
          addWarroomTask({ teamCode, title: t.title, status: "todo", priority: "medium", dueDate: t.milestone?.at })
        ));
        const updatedTasks = await getWarroomTasks(teamCode);
        setTasks(updatedTasks);
      }
      setSettingSaved(true);
      setTimeout(() => setSettingSaved(false), 2000);
    } catch {
      // ignore
    } finally {
      setSettingSaving(false);
    }
  }

  // ─── Derived ────────────────────────────────────────────────────────────────

  const upcomingMilestones = detail?.sections.schedule.milestones.filter(
    (m) => getDDay(m.at) >= -1,
  ) ?? [];
  const teamMembers = members.length > 0
    ? members.map((m) => m.nickname || m.email.split("@")[0])
    : user?.email ? [user.email.split("@")[0]] : [];
  const submissionItems = detail?.sections.submit.submissionItems ?? [];
  const setTab = (tab: string) => router.push(`/warroom/${teamCode}?tab=${tab}`);

  const selectedTask = modalTaskId && modalTaskId !== "new"
    ? tasks.find((t) => t.id === modalTaskId) ?? null
    : null;

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground">로딩중...</div>;
  }
  if (status === "error" || !team) {
    return <div className="flex items-center justify-center min-h-[40vh] text-destructive">팀 정보를 불러올 수 없습니다.</div>;
  }

  const pendingApplicantCount = applicants.filter((a) => a.status === "pending").length;

  const tabs = [
    { key: "tasks", label: "태스크 보드" },
    { key: "chat", label: "채팅" },
    { key: "files", label: "파일함" },
    { key: "recruit", label: "팀원 모집" },
    { key: "team", label: `팀 구성${pendingApplicantCount > 0 ? ` (${pendingApplicantCount})` : ""}` },
    { key: "submit", label: "제출 허브" },
    { key: "settings", label: "설정" },
  ];

  const columns: { status: WarroomTask["status"]; label: string; headerBg: string }[] = [
    { status: "todo", label: "할 일", headerBg: "bg-muted" },
    { status: "inprogress", label: "진행 중", headerBg: "bg-blue-50 dark:bg-blue-950/20" },
    { status: "done", label: "완료", headerBg: "bg-green-50 dark:bg-green-950/20" },
  ];

  return (
    <>
      {/* Task Modal */}
      {modalTaskId && (
        <TaskModal
          task={modalTaskId === "new" ? null : selectedTask}
          teamMembers={teamMembers}
          onSave={handleSaveTask}
          onDelete={modalTaskId !== "new" ? handleDeleteTask : undefined}
          onClose={() => setModalTaskId(null)}
        />
      )}

      {/* Applicant Profile Modal */}
      {profileModal && (
        <ApplicantProfileModal
          applicantId={profileModal.id}
          applicantEmail={profileModal.email}
          onClose={() => setProfileModal(null)}
        />
      )}

      <div className="flex flex-col min-h-screen">
        {/* Sub-navbar */}
        <div className="sticky top-14 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-4 h-11 flex items-center gap-4">
            <Link href="/warroom" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground shrink-0">
              <ArrowLeft size={14} /> 작전실
            </Link>
            <span className="text-muted-foreground">|</span>
            <span className="text-sm font-semibold text-foreground shrink-0">{team.name}</span>
            <div className="flex items-center gap-1 ml-auto overflow-x-auto">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                    activeTab === t.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2-column layout */}
        <div className="mx-auto max-w-6xl px-4 py-6 flex gap-6 w-full flex-1">
          {/* Main */}
          <div className="flex-1 min-w-0">

            {/* ── Tasks Tab ── */}
            {activeTab === "tasks" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">태스크 보드</h2>
                  <button
                    onClick={() => setModalTaskId("new")}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    <Plus size={14} /> 새 태스크
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {columns.map((col) => {
                    const colTasks = tasks.filter((t) => t.status === col.status);
                    return (
                      <div
                        key={col.status}
                        className="flex flex-col rounded-xl border border-border bg-card overflow-hidden"
                        onDrop={(e) => handleDrop(e, col.status)}
                        onDragOver={handleDragOver}
                      >
                        <div className={`px-4 py-3 ${col.headerBg} flex items-center gap-2`}>
                          <span className="text-sm font-bold">{col.label}</span>
                          <span className="text-xs text-muted-foreground bg-background/60 px-1.5 py-0.5 rounded-full">
                            {colTasks.length}
                          </span>
                        </div>
                        <div className="flex flex-col gap-2 p-3 min-h-[160px]">
                          {colTasks.map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              onClick={() => setModalTaskId(task.id)}
                            />
                          ))}
                          {colTasks.length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-6">
                              {col.status === "todo" ? "태스크를 추가해보세요" : "없음"}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Chat Tab ── */}
            {activeTab === "chat" && (
              <div className="flex flex-col h-[calc(100vh-220px)]">
                <h2 className="text-lg font-bold mb-4">팀 채팅</h2>
                <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-card p-4 space-y-3 mb-4">
                  {chats.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">아직 메시지가 없습니다.</p>
                  ) : chats.map((msg) => (
                    <div key={msg.id} className={msg.isSystem ? "text-center" : ""}>
                      {msg.isSystem ? (
                        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">{msg.content}</span>
                      ) : (
                        <div className={`flex gap-3 ${msg.userEmail === user?.email ? "flex-row-reverse" : ""}`}>
                          {msg.userEmail !== user?.email ? (
                            <button
                              title={msg.userEmail}
                              onClick={() => window.open(`/user/${encodeURIComponent(msg.userEmail)}`, "_blank")}
                              className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                            >
                              {msg.userEmail[0]?.toUpperCase()}
                            </button>
                          ) : (
                            <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
                              {msg.userEmail[0]?.toUpperCase()}
                            </span>
                          )}
                          <div className={`flex flex-col gap-0.5 max-w-[70%] ${msg.userEmail === user?.email ? "items-end" : ""}`}>
                            <span className="text-[10px] text-muted-foreground">{msg.userEmail.split("@")[0]}</span>
                            <span className={`text-sm rounded-xl px-3 py-2 ${
                              msg.userEmail === user?.email ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                            }`}>{msg.content}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(msg.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                {user ? (
                  <form onSubmit={handleSendChat} className="flex gap-2">
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="메시지를 입력하세요..."
                      className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button type="submit" disabled={!chatInput.trim()}
                      className="rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50 hover:opacity-90">
                      <Send size={14} />
                    </button>
                  </form>
                ) : (
                  <p className="text-sm text-center text-muted-foreground">채팅하려면 로그인이 필요합니다.</p>
                )}
              </div>
            )}

            {/* ── Files Tab ── */}
            {activeTab === "files" && (
              <div>
                <h2 className="text-lg font-bold mb-4">파일함</h2>

                {/* Upload Area */}
                <div
                  className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors mb-6 ${
                    fileDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setFileDragOver(true); }}
                  onDragLeave={() => setFileDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setFileDragOver(false);
                    const f = e.dataTransfer.files[0];
                    if (f) handleFileUpload(f);
                  }}
                >
                  <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">
                    파일을 여기에 드래그하거나 클릭해서 업로드
                  </p>
                  <p className="text-xs text-muted-foreground">PDF, 이미지, ZIP · 최대 50MB</p>
                  <label className={`mt-3 inline-block cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    user ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}>
                    {fileUploading ? "업로드 중..." : "파일 선택"}
                    {user && !fileUploading && (
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,image/*,.zip"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ""; }}
                      />
                    )}
                  </label>
                  {!user && <p className="text-xs text-muted-foreground mt-2">업로드하려면 로그인이 필요합니다.</p>}
                </div>

                {/* File List */}
                {files.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">업로드된 파일이 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {files.map((f) => {
                      const isPdf = f.fileType === "application/pdf";
                      const isImage = f.fileType?.startsWith("image/");
                      const sizeStr = f.fileSize
                        ? f.fileSize > 1024 * 1024
                          ? `${(f.fileSize / 1024 / 1024).toFixed(1)}MB`
                          : `${(f.fileSize / 1024).toFixed(0)}KB`
                        : "";
                      return (
                        <div key={f.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                          <span className="text-2xl shrink-0">
                            {isPdf ? "📄" : isImage ? "🖼️" : "📦"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{f.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {f.uploaderEmail.split("@")[0]} · {new Date(f.createdAt).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              {sizeStr && ` · ${sizeStr}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {(isPdf || isImage) ? (
                              <a href={f.fileUrl} target="_blank" rel="noreferrer"
                                className="text-xs text-primary hover:underline font-medium">
                                {isPdf ? "뷰어로 열기" : "이미지 보기"}
                              </a>
                            ) : (
                              <a href={f.fileUrl} download={f.fileName}
                                className="text-xs text-primary hover:underline font-medium">
                                다운로드
                              </a>
                            )}
                            {user?.email === f.uploaderEmail && (
                              <button
                                onClick={() => handleDeleteFile(f)}
                                className="text-destructive hover:text-destructive/80 ml-1"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Recruit Tab ── */}
            {activeTab === "recruit" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">팀원 모집</h2>
                  {recruitPost && (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      recruitPost.isOpen
                        ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {recruitPost.isOpen ? "모집 중" : "모집 완료"}
                    </span>
                  )}
                </div>

                <div className="space-y-5 rounded-xl border border-border bg-card p-5">
                  {/* 모집 상태 */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium shrink-0">모집 상태</span>
                    <button
                      type="button"
                      onClick={() => setRecruitForm((v) => ({ ...v, isOpen: !v.isOpen }))}
                      className={`relative inline-flex shrink-0 items-center w-10 h-5 rounded-full overflow-hidden transition-colors focus:outline-none ${recruitForm.isOpen ? "bg-primary" : "bg-border"}`}
                    >
                      <span className={`inline-block w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${recruitForm.isOpen ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                    <span className={`text-sm font-medium shrink-0 ${recruitForm.isOpen ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                      {recruitForm.isOpen ? "모집 중" : "모집 완료"}
                    </span>
                  </div>

                  {/* 포지션 */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">
                      모집 포지션 *
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {recruitForm.positions.map((p) => (
                        <span key={p} className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                          {p}
                          <button onClick={() => setRecruitForm((v) => ({ ...v, positions: v.positions.filter((x) => x !== p) }))}>
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={recruitPositionInput}
                        onChange={(e) => setRecruitPositionInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && recruitPositionInput.trim()) {
                            setRecruitForm((v) => ({ ...v, positions: [...v.positions, recruitPositionInput.trim()] }));
                            setRecruitPositionInput("");
                          }
                        }}
                        placeholder="예: Backend Developer"
                        className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <button
                        onClick={() => {
                          if (recruitPositionInput.trim()) {
                            setRecruitForm((v) => ({ ...v, positions: [...v.positions, recruitPositionInput.trim()] }));
                            setRecruitPositionInput("");
                          }
                        }}
                        className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* 팀 소개 */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">
                      팀 소개 *
                    </label>
                    <textarea
                      value={recruitForm.description}
                      onChange={(e) => setRecruitForm((v) => ({ ...v, description: e.target.value }))}
                      placeholder="팀을 소개해주세요..."
                      rows={4}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                  </div>

                  {/* 연락 링크 */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">
                      연락 링크 *
                    </label>
                    <input
                      value={recruitForm.contactUrl}
                      onChange={(e) => setRecruitForm((v) => ({ ...v, contactUrl: e.target.value }))}
                      placeholder="https://open.kakao.com/..."
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  {/* 우대 조건 */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">
                      우대 조건 (선택)
                    </label>
                    <textarea
                      value={recruitForm.requirements}
                      onChange={(e) => setRecruitForm((v) => ({ ...v, requirements: e.target.value }))}
                      placeholder="우대 조건을 입력하세요..."
                      rows={2}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                  </div>

                  <button
                    onClick={handleSaveRecruitPost}
                    disabled={
                      recruitSaving || !user ||
                      (!recruitPost && (!recruitForm.description.trim() || !recruitForm.contactUrl.trim()))
                    }
                    className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {recruitSaving ? "저장 중..." : recruitPost ? "저장" : "저장 & 공개"}
                  </button>
                </div>
              </div>
            )}

            {/* ── Team Tab ── */}
            {activeTab === "team" && (
              <div className="space-y-6">
                {/* 초대장 보내기 */}
                {isCreator && (
                  <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Mail size={14} className="text-primary" /> 이메일로 초대장 보내기
                    </h3>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => { setInviteEmail(e.target.value); setInviteError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && handleSendInvite()}
                        placeholder="초대할 사람의 이메일 주소"
                        className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        disabled={inviteSending}
                      />
                      <button
                        onClick={handleSendInvite}
                        disabled={!inviteEmail.trim() || inviteSending}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 shrink-0"
                      >
                        {inviteSending ? "전송 중..." : "초대"}
                      </button>
                    </div>
                    {inviteError && <p className="text-xs text-destructive mt-2">{inviteError}</p>}
                  </div>
                )}

                {/* 보낸 초대장 목록 */}
                {invitations.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground">보낸 초대장 ({invitations.length})</h3>
                    <div className="space-y-2">
                      {invitations.map((inv) => (
                        <div key={inv.id} className="rounded-xl border border-border bg-card p-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                              <Mail size={14} className="text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{inv.inviteeEmail}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {new Date(inv.createdAt).toLocaleDateString("ko-KR")}
                              </p>
                            </div>
                          </div>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                            inv.status === "accepted"
                              ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                              : inv.status === "rejected"
                              ? "bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                          }`}>
                            {inv.status === "accepted" ? "수락됨" : inv.status === "rejected" ? "거절됨" : "대기 중"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 지원자 목록 */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                    지원자 {applicants.length}명
                  </h3>
                  {applicants.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-12 text-center rounded-xl border border-border bg-card">
                      <Users size={36} className="text-muted-foreground opacity-40" />
                      <p className="text-sm text-muted-foreground">아직 지원자가 없습니다</p>
                      <p className="text-xs text-muted-foreground">팀원 모집 탭에서 공고를 올리면 지원자가 생깁니다.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {applicants.map((a) => (
                        <div
                          key={a.id}
                          className={`rounded-xl border border-border bg-card p-4 flex items-start gap-4 ${a.status === "rejected" ? "opacity-60" : ""}`}
                        >
                          <button
                            onClick={() => setProfileModal({ id: a.applicantId, email: a.applicantEmail })}
                            className="w-10 h-10 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity"
                          >
                            {a.applicantEmail[0]?.toUpperCase()}
                          </button>
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => setProfileModal({ id: a.applicantId, email: a.applicantEmail })}
                              className="font-semibold text-sm hover:underline text-left"
                            >
                              {a.applicantEmail.split("@")[0]}
                            </button>
                            {a.position && <p className="text-xs text-muted-foreground mt-0.5">지원 포지션: {a.position}</p>}
                            {a.message && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.message}</p>}
                            <p className="text-[11px] text-muted-foreground mt-1">
                              {new Date(a.createdAt).toLocaleDateString("ko-KR")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {a.status === "pending" ? (
                              <>
                                <button
                                  onClick={() => handleApplicant(a, "accepted")}
                                  className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90 font-medium"
                                >
                                  <Check size={12} /> 수락
                                </button>
                                <button
                                  onClick={() => handleApplicant(a, "rejected")}
                                  className="flex items-center gap-1 text-xs border border-border text-muted-foreground px-3 py-1.5 rounded-lg hover:bg-muted font-medium"
                                >
                                  <X size={12} /> 거절
                                </button>
                              </>
                            ) : (
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                a.status === "accepted"
                                  ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                                  : "bg-muted text-muted-foreground"
                              }`}>
                                {a.status === "accepted" ? "수락됨" : "거절됨"}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Submit Tab ── */}
            {activeTab === "submit" && (
              <div>
                <h2 className="text-lg font-bold mb-4">제출 허브</h2>
                {!team.hackathonSlug ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    <p className="mb-2">연결된 해커톤이 없습니다.</p>
                    <button onClick={() => router.push(`/warroom/${teamCode}?tab=settings`)} className="text-primary underline text-sm">설정에서 해커톤 연결하기</button>
                  </div>
                ) : submissionItems.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">이 해커톤에는 등록된 제출 항목이 없습니다.</div>
                ) : (
                  <div className="space-y-4">
                    {submissionItems.map((item) => {
                      const sub = wSubmissions.find((s) => s.deadlineKey === item.key);
                      const isSubmitted = sub?.status === "submitted";
                      const milestone = detail?.sections.schedule.milestones.find(
                        (m) => m.name.includes(item.title.replace("(1차 제출)", "").trim().substring(0, 5))
                      );
                      const dday = milestone ? getDDay(milestone.at) : null;

                      return (
                        <div key={item.key}
                          className={`rounded-xl border p-5 ${isSubmitted ? "border-green-400 bg-green-50/50 dark:bg-green-950/10" : "border-border bg-card"}`}>
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-semibold">{item.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">형식: {item.format}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {dday !== null && (
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                  dday <= 3 ? "bg-red-100 text-red-600" : dday <= 7 ? "bg-orange-100 text-orange-600" : "bg-muted text-muted-foreground"
                                }`}>{dday < 0 ? "마감" : `D-${dday}`}</span>
                              )}
                              {isSubmitted ? <CheckCircle2 size={18} className="text-green-500" /> : <Circle size={18} className="text-muted-foreground" />}
                            </div>
                          </div>
                          {isSubmitted ? (
                            <div className="space-y-1">
                              <p className="text-sm text-green-600 dark:text-green-400 font-medium">✅ 제출 완료</p>
                              <p className="text-xs text-muted-foreground">
                                {sub?.submittedBy?.split("@")[0]} · {sub?.submittedAt && new Date(sub.submittedAt).toLocaleString("ko-KR")}
                              </p>
                              <p className="text-xs text-muted-foreground break-all">{sub?.url}</p>
                              <button
                                onClick={() => setWSubmissions((prev) => prev.map((s) => s.deadlineKey === item.key ? { ...s, status: "pending" } : s))}
                                className="text-xs text-muted-foreground hover:text-foreground underline mt-1"
                              >재제출</button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={subUrls[item.key] ?? ""}
                                onChange={(e) => setSubUrls((v) => ({ ...v, [item.key]: e.target.value }))}
                                placeholder={item.format.includes("url") ? "https://..." : "URL 또는 내용 입력"}
                                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                              />
                              <button
                                onClick={() => handleSubmit(item.key)}
                                disabled={!subUrls[item.key]?.trim() || !user}
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 shrink-0"
                              >제출</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Settings Tab ── */}
            {activeTab === "settings" && (
              <div className="space-y-6 max-w-lg">
                <h2 className="text-lg font-bold">팀 설정</h2>

                {/* 해커톤 연결 */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="font-semibold mb-1">해커톤 연결</h3>
                  {team.hackathonSlug ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 px-3 py-2">
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                          {allHackathons.find((h) => h.slug === team.hackathonSlug)?.title ?? team.hackathonSlug}
                        </span>
                      </div>
                      <Link
                        href={`/hackathons/${team.hackathonSlug}`}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        해커톤 페이지로 이동 <ArrowLeft size={11} className="rotate-180" />
                      </Link>
                      {isCreator && (
                        <div className="pt-2 border-t border-border">
                          <p className="text-xs text-muted-foreground mb-2">해커톤 변경</p>
                          <div className="flex gap-2">
                            <select
                              value={settingHackathonSlug}
                              onChange={(e) => setSettingHackathonSlug(e.target.value)}
                              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              <option value="">선택하세요</option>
                              {allHackathons.map((h) => (
                                <option key={h.slug} value={h.slug}>{h.title}</option>
                              ))}
                            </select>
                            <button
                              onClick={handleSaveHackathon}
                              disabled={settingSaving || !settingHackathonSlug || settingHackathonSlug === team.hackathonSlug}
                              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 shrink-0"
                            >
                              {settingSaving ? "저장중..." : settingSaved ? "저장됨 ✓" : "변경"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : isCreator ? (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">아직 해커톤이 연결되지 않았습니다. 참가할 해커톤을 선택하세요.</p>
                      <div className="flex gap-2">
                        <select
                          value={settingHackathonSlug}
                          onChange={(e) => setSettingHackathonSlug(e.target.value)}
                          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="">해커톤 선택</option>
                          {allHackathons.map((h) => (
                            <option key={h.slug} value={h.slug}>{h.title}</option>
                          ))}
                        </select>
                        <button
                          onClick={handleSaveHackathon}
                          disabled={settingSaving || !settingHackathonSlug}
                          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 shrink-0"
                        >
                          {settingSaving ? "저장중..." : settingSaved ? "저장됨 ✓" : "저장"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">아직 해커톤이 연결되지 않았습니다. 팀장에게 문의하세요.</p>
                  )}
                </div>

                {/* 팀 기본 정보 */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="font-semibold mb-3">팀 정보</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">팀 코드</dt>
                      <dd className="font-mono text-xs">{team.teamCode}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">멤버 수</dt>
                      <dd>{team.memberCount}명</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">모집 상태</dt>
                      <dd>{team.isOpen ? "모집 중" : "마감"}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="w-64 shrink-0 space-y-4 hidden lg:block">
            {upcomingMilestones.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">다음 마감</p>
                {upcomingMilestones.slice(0, 4).map((m, i) => (
                  <DDayBadge key={i} dateStr={m.at} label={m.name} />
                ))}
              </div>
            )}
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">팀원</p>
              <div className="space-y-2">
                {members.length > 0 ? members.map((m) => (
                  <div key={m.userId} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
                      {(m.nickname || m.email)?.[0]?.toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{m.nickname || m.email.split("@")[0]}</p>
                      <p className="text-[10px] text-muted-foreground">{m.role === "creator" ? "팀장" : "팀원"}</p>
                    </div>
                  </div>
                )) : user ? (
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                      {user.email?.[0]?.toUpperCase()}
                    </span>
                    <div>
                      <p className="text-xs font-medium">{user.email?.split("@")[0]}</p>
                      <p className="text-[10px] text-muted-foreground">팀장</p>
                    </div>
                  </div>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground mt-3">총 {members.length > 0 ? members.length : team.memberCount}명</p>
            </div>
            {detail && (
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">해커톤</p>
                <p className="text-xs text-foreground leading-relaxed">{detail.title}</p>
                <Link href={`/hackathons/${detail.slug}`} className="text-xs text-primary hover:underline mt-2 inline-block">
                  상세 보기 →
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}

export default function WarroomPage() {
  return (
    <Suspense>
      <WarroomContent />
    </Suspense>
  );
}
