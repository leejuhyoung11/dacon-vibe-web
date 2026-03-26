"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getTeamByCode, getHackathonDetail, getWarroomTasks, addWarroomTask,
  updateWarroomTask, deleteWarroomTask, getWarroomChats, addWarroomChat,
  getWarroomDoc, upsertWarroomDoc, getWarroomSubmissions, upsertWarroomSubmission,
} from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import type { Team, HackathonDetail, WarroomTask, WarroomChat, WarroomDoc, WarroomSubmission } from "@/lib/types";
import type { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { ArrowLeft, Plus, Trash2, Send, Eye, Edit3, CheckCircle2, Circle } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDDay(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function DDayBadge({ dateStr, label }: { dateStr: string; label: string }) {
  const d = getDDay(dateStr);
  if (d < 0) return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-foreground">{label}</span>
      <span className="text-xs text-muted-foreground">마감됨</span>
    </div>
  );
  const badgeColor = d <= 3 ? "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400"
    : d <= 7 ? "bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-500"
    : "bg-muted text-muted-foreground";
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-foreground leading-tight">{label}</span>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ml-2 ${badgeColor}`}>D-{d}</span>
    </div>
  );
}

function TaskDueBadge({ dueDate }: { dueDate?: string }) {
  if (!dueDate) return null;
  const d = getDDay(dueDate);
  const color = d <= 3 ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
    : d <= 7 ? "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-500"
    : "bg-muted text-muted-foreground";
  return <span className={`text-[10px] px-1.5 py-0.5 rounded ${color}`}>D-{d < 0 ? "마감" : d}</span>;
}

const PRIORITY_LABEL: Record<string, string> = { high: "높음", medium: "중", low: "낮음" };
const PRIORITY_COLOR: Record<string, string> = {
  high: "text-red-500", medium: "text-orange-400", low: "text-muted-foreground",
};

// ─── Kanban Board ─────────────────────────────────────────────────────────────

function KanbanColumn({
  title, status, tasks, bgColor, onDrop, onDragOver, onAddTask, onUpdateTask, onDeleteTask, teamMembers,
}: {
  title: string; status: string; tasks: WarroomTask[]; bgColor: string;
  onDrop: (e: React.DragEvent, status: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onAddTask: (status: string, title: string, priority: WarroomTask["priority"]) => void;
  onUpdateTask: (id: string, updates: Partial<WarroomTask>) => void;
  onDeleteTask: (id: string) => void;
  teamMembers: string[];
}) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<WarroomTask["priority"]>("medium");
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  return (
    <div
      className="flex flex-col rounded-xl border border-border bg-card overflow-hidden"
      onDrop={(e) => onDrop(e, status)}
      onDragOver={onDragOver}
    >
      <div className={`px-4 py-3 ${bgColor}`}>
        <span className="text-sm font-bold">{title}</span>
        <span className="ml-2 text-xs text-muted-foreground">{tasks.length}</span>
      </div>
      <div className="flex flex-col gap-2 p-3 min-h-[120px]">
        {tasks.map((task) => (
          <div
            key={task.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData("taskId", task.id)}
            className="bg-background rounded-lg border border-border p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow"
          >
            {editing === task.id ? (
              <div className="space-y-2">
                <input
                  autoFocus
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { onUpdateTask(task.id, { title: editTitle }); setEditing(null); }
                    if (e.key === "Escape") setEditing(null);
                  }}
                  className="w-full text-sm bg-muted rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <div className="flex gap-2">
                  <button onClick={() => { onUpdateTask(task.id, { title: editTitle }); setEditing(null); }}
                    className="text-xs text-primary font-medium">저장</button>
                  <button onClick={() => setEditing(null)} className="text-xs text-muted-foreground">취소</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-medium leading-snug flex-1">{task.title}</p>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => { setEditing(task.id); setEditTitle(task.title); }}
                      className="text-muted-foreground hover:text-foreground">
                      <Edit3 size={12} />
                    </button>
                    <button onClick={() => onDeleteTask(task.id)}
                      className="text-muted-foreground hover:text-destructive">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-medium ${PRIORITY_COLOR[task.priority]}`}>
                    {PRIORITY_LABEL[task.priority]}
                  </span>
                  {task.dueDate && <TaskDueBadge dueDate={task.dueDate} />}
                  {task.assignee && (
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                      @{task.assignee.split("@")[0]}
                    </span>
                  )}
                </div>
                <div className="mt-2 pt-2 border-t border-border">
                  <select
                    value={task.assignee ?? ""}
                    onChange={(e) => onUpdateTask(task.id, { assignee: e.target.value || undefined })}
                    className="text-[10px] bg-transparent text-muted-foreground focus:outline-none w-full"
                  >
                    <option value="">담당자 미배정</option>
                    {teamMembers.map((m) => (
                      <option key={m} value={m}>{m.split("@")[0]}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        ))}

        {adding ? (
          <div className="bg-background rounded-lg border border-border p-3 space-y-2">
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newTitle.trim()) {
                  onAddTask(status, newTitle.trim(), newPriority);
                  setNewTitle(""); setAdding(false);
                }
                if (e.key === "Escape") { setAdding(false); setNewTitle(""); }
              }}
              placeholder="태스크 제목 입력 후 Enter"
              className="w-full text-sm bg-muted rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <div className="flex items-center gap-2">
              <select value={newPriority} onChange={(e) => setNewPriority(e.target.value as WarroomTask["priority"])}
                className="text-xs bg-muted rounded px-2 py-1 focus:outline-none">
                <option value="high">높음</option>
                <option value="medium">중</option>
                <option value="low">낮음</option>
              </select>
              <button onClick={() => { setAdding(false); setNewTitle(""); }}
                className="text-xs text-muted-foreground">취소</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground py-2 transition-colors"
          >
            <Plus size={12} /> 태스크 추가
          </button>
        )}
      </div>
    </div>
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

  // tasks
  const [tasks, setTasks] = useState<WarroomTask[]>([]);
  // chat
  const [chats, setChats] = useState<WarroomChat[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  // docs
  const [doc, setDoc] = useState<WarroomDoc | null>(null);
  const [docContent, setDocContent] = useState("");
  const [docPreview, setDocPreview] = useState(false);
  const [docSaved, setDocSaved] = useState(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // submissions
  const [wSubmissions, setWSubmissions] = useState<WarroomSubmission[]>([]);
  const [subUrls, setSubUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getSession().then((res: { data: { session: Session | null } }) => {
      setUser(res.data.session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const result = await getTeamByCode(teamCode);
        if (!result) { setStatus("error"); return; }
        setTeam(result.team);
        const [d, t] = await Promise.all([
          getHackathonDetail(result.team.hackathonSlug),
          getWarroomTasks(teamCode),
        ]);
        setDetail(d);
        setTasks(t);
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
    } else if (activeTab === "docs") {
      getWarroomDoc(teamCode).then((d) => {
        setDoc(d);
        setDocContent(d?.content ?? "");
      });
    } else if (activeTab === "submit") {
      getWarroomSubmissions(teamCode).then((subs) => {
        setWSubmissions(subs);
        const urls: Record<string, string> = {};
        subs.forEach((s) => { if (s.url) urls[s.deadlineKey] = s.url; });
        setSubUrls(urls);
      });
    }
  }, [activeTab, teamCode]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats]);

  // ─── Task handlers ──────────────────────────────────────────────────────────

  function handleDragOver(e: React.DragEvent) { e.preventDefault(); }

  async function handleDrop(e: React.DragEvent, newStatus: string) {
    const taskId = e.dataTransfer.getData("taskId");
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus as WarroomTask["status"] } : t));
    await updateWarroomTask(taskId, { status: newStatus as WarroomTask["status"] });
  }

  async function handleAddTask(status: string, title: string, priority: WarroomTask["priority"]) {
    await addWarroomTask({ teamCode, title, status: status as WarroomTask["status"], priority });
    const updated = await getWarroomTasks(teamCode);
    setTasks(updated);
  }

  async function handleUpdateTask(id: string, updates: Partial<WarroomTask>) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, ...updates } : t));
    await updateWarroomTask(id, updates);
  }

  async function handleDeleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await deleteWarroomTask(id);
  }

  // ─── Chat handler ───────────────────────────────────────────────────────────

  async function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || !user) return;
    await addWarroomChat(teamCode, chatInput.trim());
    setChatInput("");
    const updated = await getWarroomChats(teamCode);
    setChats(updated);
  }

  // ─── Docs handler ───────────────────────────────────────────────────────────

  const handleDocChange = useCallback((value: string) => {
    setDocContent(value);
    setDocSaved(false);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      await upsertWarroomDoc(teamCode, value, user?.email ?? "");
      setDocSaved(true);
    }, 1000);
  }, [teamCode, user]);

  // ─── Submit handler ─────────────────────────────────────────────────────────

  async function handleSubmit(deadlineKey: string) {
    const url = subUrls[deadlineKey];
    if (!url?.trim()) return;
    const sub: Omit<WarroomSubmission, "id"> = {
      teamCode,
      deadlineKey,
      status: "submitted",
      url: url.trim(),
      submittedBy: user?.email ?? "",
      submittedAt: new Date().toISOString(),
      confirmedBy: user?.email ? [user.email] : [],
    };
    await upsertWarroomSubmission(sub);
    const updated = await getWarroomSubmissions(teamCode);
    setWSubmissions(updated);
    // send chat message
    await addWarroomChat(
      teamCode,
      `[시스템] ${user?.email?.split("@")[0]}이(가) "${deadlineKey}" 제출물을 제출했습니다.`,
      true,
    );
  }

  // ─── Sidebar ────────────────────────────────────────────────────────────────

  const upcomingMilestones = detail?.sections.schedule.milestones.filter(
    (m) => getDDay(m.at) >= -1,
  ) ?? [];

  const teamMembers = user?.email ? [user.email] : [];

  const setTab = (tab: string) => router.push(`/warroom/${teamCode}?tab=${tab}`);

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground">로딩중...</div>;
  }
  if (status === "error" || !team) {
    return <div className="flex items-center justify-center min-h-[40vh] text-destructive">팀 정보를 불러올 수 없습니다.</div>;
  }

  const tabs = [
    { key: "tasks", label: "태스크 보드" },
    { key: "chat", label: "채팅" },
    { key: "docs", label: "공유 문서" },
    { key: "submit", label: "제출 허브" },
  ];

  const submissionItems = detail?.sections.submit.submissionItems ?? [];

  return (
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
        {/* Main area */}
        <div className="flex-1 min-w-0">
          {/* ── Tasks Tab ── */}
          {activeTab === "tasks" && (
            <div>
              <h2 className="text-lg font-bold mb-4">태스크 보드</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { status: "todo", label: "To-do", bg: "bg-muted" },
                  { status: "inprogress", label: "진행 중", bg: "bg-blue-50 dark:bg-blue-950/20" },
                  { status: "done", label: "완료", bg: "bg-green-50 dark:bg-green-950/20" },
                ].map((col) => (
                  <KanbanColumn
                    key={col.status}
                    title={col.label}
                    status={col.status}
                    bgColor={col.bg}
                    tasks={tasks.filter((t) => t.status === col.status)}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onAddTask={handleAddTask}
                    onUpdateTask={handleUpdateTask}
                    onDeleteTask={handleDeleteTask}
                    teamMembers={teamMembers}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Chat Tab ── */}
          {activeTab === "chat" && (
            <div className="flex flex-col h-[calc(100vh-220px)]">
              <h2 className="text-lg font-bold mb-4">팀 채팅</h2>
              {team.contact?.url && (
                <div className="mb-3 rounded-lg border border-border bg-muted/40 p-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">팀 오픈카톡</span>
                  <a href={team.contact.url} target="_blank" rel="noreferrer"
                    className="text-xs text-primary font-medium hover:underline">
                    카카오톡 채팅방 열기 →
                  </a>
                </div>
              )}
              <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-card p-4 space-y-3 mb-4">
                {chats.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">아직 메시지가 없습니다.</p>
                ) : (
                  chats.map((msg) => (
                    <div key={msg.id} className={msg.isSystem ? "text-center" : ""}>
                      {msg.isSystem ? (
                        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">{msg.content}</span>
                      ) : (
                        <div className={`flex gap-3 ${msg.userEmail === user?.email ? "flex-row-reverse" : ""}`}>
                          <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
                            {msg.userEmail[0]?.toUpperCase()}
                          </span>
                          <div className={`flex flex-col gap-0.5 max-w-[70%] ${msg.userEmail === user?.email ? "items-end" : ""}`}>
                            <span className="text-[10px] text-muted-foreground">{msg.userEmail.split("@")[0]}</span>
                            <span className={`text-sm rounded-xl px-3 py-2 ${
                              msg.userEmail === user?.email
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-foreground"
                            }`}>{msg.content}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(msg.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
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

          {/* ── Docs Tab ── */}
          {activeTab === "docs" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">공유 문서</h2>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{docSaved ? "저장됨" : "저장 중..."}</span>
                  <button
                    onClick={() => setDocPreview(!docPreview)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2.5 py-1.5"
                  >
                    {docPreview ? <Edit3 size={12} /> : <Eye size={12} />}
                    {docPreview ? "편집" : "미리보기"}
                  </button>
                </div>
              </div>

              {doc?.lastEditedBy && (
                <p className="text-xs text-muted-foreground mb-3">
                  마지막 수정: {doc.lastEditedBy.split("@")[0]} ({new Date(doc.lastEditedAt).toLocaleString("ko-KR")})
                </p>
              )}

              {docPreview ? (
                <div className="rounded-xl border border-border bg-card p-6 min-h-[400px] prose prose-sm dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm">{docContent || "내용이 없습니다."}</pre>
                </div>
              ) : (
                <textarea
                  value={docContent}
                  onChange={(e) => handleDocChange(e.target.value)}
                  placeholder={"# 기획서 제목\n\n여기에 팀 문서를 작성하세요..."}
                  className="w-full rounded-xl border border-border bg-card p-6 text-sm font-mono min-h-[400px] resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={!user}
                />
              )}

              {submissionItems.length > 0 && (
                <div className="mt-4">
                  <button
                    onClick={() => setTab("submit")}
                    className="text-xs text-primary hover:underline"
                  >
                    기획서로 제출하기 → 제출 허브로 이동
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Submit Hub Tab ── */}
          {activeTab === "submit" && (
            <div>
              <h2 className="text-lg font-bold mb-4">제출 허브</h2>
              {submissionItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  이 해커톤에는 등록된 제출 항목이 없습니다.
                </div>
              ) : (
                <div className="space-y-4">
                  {submissionItems.map((item) => {
                    const sub = wSubmissions.find((s) => s.deadlineKey === item.key);
                    const isSubmitted = sub?.status === "submitted";
                    // find matching milestone
                    const milestone = detail?.sections.schedule.milestones.find(
                      (m) => m.name.includes(item.title.replace("(1차 제출)", "").trim().substring(0, 5))
                    );
                    const dday = milestone ? getDDay(milestone.at) : null;

                    return (
                      <div
                        key={item.key}
                        className={`rounded-xl border p-5 ${isSubmitted ? "border-green-400 bg-green-50/50 dark:bg-green-950/10" : "border-border bg-card"}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-foreground">{item.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">형식: {item.format}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {dday !== null && (
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                dday <= 3 ? "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                                  : dday <= 7 ? "bg-orange-100 text-orange-600"
                                  : "bg-muted text-muted-foreground"
                              }`}>D-{dday < 0 ? "마감" : dday}</span>
                            )}
                            {isSubmitted ? (
                              <CheckCircle2 size={18} className="text-green-500" />
                            ) : (
                              <Circle size={18} className="text-muted-foreground" />
                            )}
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
                              onClick={() => {
                                setWSubmissions((prev) => prev.map((s) => s.deadlineKey === item.key ? { ...s, status: "pending" } : s));
                              }}
                              className="text-xs text-muted-foreground hover:text-foreground underline mt-1"
                            >
                              재제출
                            </button>
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
                            >
                              제출
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="w-64 shrink-0 space-y-4 hidden lg:block">
          {/* Next deadlines */}
          {upcomingMilestones.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">다음 마감</p>
              {upcomingMilestones.slice(0, 4).map((m, i) => (
                <DDayBadge key={i} dateStr={m.at} label={m.name} />
              ))}
            </div>
          )}

          {/* Team info */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">팀원</p>
            {user && (
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {user.email?.[0]?.toUpperCase()}
                </span>
                <div>
                  <p className="text-xs font-medium">{user.email?.split("@")[0]}</p>
                  <p className="text-[10px] text-muted-foreground">팀장</p>
                </div>
                <span className="ml-auto w-2 h-2 rounded-full bg-green-500" title="온라인" />
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-3">총 {team.memberCount}명</p>
          </div>

          {/* Hackathon info */}
          {detail && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">해커톤</p>
              <p className="text-xs text-foreground leading-relaxed">{detail.title}</p>
              <Link href={`/hackathons/${detail.slug}`}
                className="text-xs text-primary hover:underline mt-2 inline-block">
                상세 보기 →
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default function WarroomPage() {
  return (
    <Suspense>
      <WarroomContent />
    </Suspense>
  );
}
