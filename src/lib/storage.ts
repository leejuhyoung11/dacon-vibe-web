import type { Hackathon, HackathonDetail, Team, Leaderboard, Submission, WarroomTask, WarroomChat, WarroomDoc, WarroomSubmission } from "./types";
import { supabase } from "./supabase";

// Hackathons
export async function getHackathons(): Promise<Hackathon[]> {
  const { data, error } = await supabase.from("hackathons").select("data");
  if (error) throw error;
  return (data ?? []).map((row: { data: unknown }) => row.data as Hackathon);
}

export async function getHackathonDetail(slug: string): Promise<HackathonDetail | null> {
  const { data, error } = await supabase
    .from("hackathon_details")
    .select("data")
    .eq("slug", slug)
    .single();
  if (error) return null;
  return (data?.data as HackathonDetail) ?? null;
}

// Teams
export async function getTeams(): Promise<Team[]> {
  const { data, error } = await supabase.from("teams").select("data");
  if (error) throw error;
  return (data ?? []).map((row: { data: unknown }) => row.data as Team);
}

export async function getTeamsByHackathon(slug: string): Promise<Team[]> {
  const { data, error } = await supabase
    .from("teams")
    .select("data")
    .eq("hackathon_slug", slug);
  if (error) throw error;
  return (data ?? []).map((row: { data: unknown }) => row.data as Team);
}

export async function addTeam(team: Team): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("teams").insert({
    team_code: team.teamCode,
    hackathon_slug: team.hackathonSlug,
    creator_id: user?.id ?? null,
    data: team,
  });
  if (error) throw error;
}

// Leaderboards
export async function getLeaderboard(slug: string): Promise<Leaderboard | null> {
  const { data, error } = await supabase
    .from("leaderboards")
    .select("data")
    .eq("hackathon_slug", slug)
    .single();
  if (error) return null;
  return (data?.data as Leaderboard) ?? null;
}

export async function getAllLeaderboards(): Promise<Leaderboard[]> {
  const { data, error } = await supabase.from("leaderboards").select("data");
  if (error) throw error;
  return (data ?? []).map((row: { data: unknown }) => row.data as Leaderboard);
}

export async function updateLeaderboard(lb: Leaderboard): Promise<void> {
  const { error } = await supabase
    .from("leaderboards")
    .upsert({ hackathon_slug: lb.hackathonSlug, data: lb });
  if (error) throw error;
}

// Submissions
export async function getSubmissions(slug: string): Promise<Submission[]> {
  const { data, error } = await supabase
    .from("submissions")
    .select("data")
    .eq("hackathon_slug", slug);
  if (error) return [];
  return (data ?? []).map((row: { data: unknown }) => row.data as Submission);
}

export async function addSubmission(sub: Submission): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("submissions").insert({
    id: sub.id,
    hackathon_slug: sub.hackathonSlug,
    user_id: user?.id ?? null,
    data: sub,
  });
  if (error) throw error;
}

// ─── Warroom ─────────────────────────────────────────────────────────────────

export async function getMyTeams(): Promise<Team[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase.from("teams").select("data").eq("creator_id", user.id);
  if (error) return [];
  return (data ?? []).map((row: { data: unknown }) => row.data as Team);
}

export async function getMyTeamCodes(): Promise<Set<string>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Set();
  const { data } = await supabase.from("teams").select("team_code").eq("creator_id", user.id);
  return new Set((data ?? []).map((r: { team_code: string }) => r.team_code));
}

export async function getTeamByCode(teamCode: string): Promise<{ team: Team; creatorId: string | null } | null> {
  const { data, error } = await supabase.from("teams").select("data, creator_id").eq("team_code", teamCode).single();
  if (error || !data) return null;
  return { team: data.data as Team, creatorId: data.creator_id as string | null };
}

// Tasks
export async function getWarroomTasks(teamCode: string): Promise<WarroomTask[]> {
  const { data, error } = await supabase.from("warroom_tasks").select("*").eq("team_code", teamCode).order("created_at");
  if (error) return [];
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    teamCode: r.team_code as string,
    title: r.title as string,
    assignee: r.assignee as string | undefined,
    dueDate: r.due_date as string | undefined,
    status: r.status as WarroomTask["status"],
    priority: r.priority as WarroomTask["priority"],
    createdAt: r.created_at as string,
  }));
}

export async function addWarroomTask(task: Omit<WarroomTask, "id" | "createdAt">): Promise<void> {
  const { error } = await supabase.from("warroom_tasks").insert({
    id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    team_code: task.teamCode,
    title: task.title,
    assignee: task.assignee ?? null,
    due_date: task.dueDate ?? null,
    status: task.status,
    priority: task.priority,
  });
  if (error) throw error;
}

export async function updateWarroomTask(id: string, updates: Partial<Pick<WarroomTask, "title" | "assignee" | "dueDate" | "status" | "priority">>): Promise<void> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.assignee !== undefined) dbUpdates.assignee = updates.assignee ?? null;
  if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate ?? null;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  const { error } = await supabase.from("warroom_tasks").update(dbUpdates).eq("id", id);
  if (error) throw error;
}

export async function deleteWarroomTask(id: string): Promise<void> {
  const { error } = await supabase.from("warroom_tasks").delete().eq("id", id);
  if (error) throw error;
}

// Chat
export async function getWarroomChats(teamCode: string): Promise<WarroomChat[]> {
  const { data, error } = await supabase.from("warroom_chats").select("*").eq("team_code", teamCode).order("created_at");
  if (error) return [];
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    teamCode: r.team_code as string,
    userEmail: r.user_email as string,
    content: r.content as string,
    isSystem: r.is_system as boolean,
    createdAt: r.created_at as string,
  }));
}

export async function addWarroomChat(teamCode: string, content: string, isSystem = false): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("warroom_chats").insert({
    id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    team_code: teamCode,
    user_id: user?.id ?? null,
    user_email: user?.email ?? "시스템",
    content,
    is_system: isSystem,
  });
  if (error) throw error;
}

// Docs
export async function getWarroomDoc(teamCode: string): Promise<WarroomDoc | null> {
  const { data, error } = await supabase.from("warroom_docs").select("*").eq("team_code", teamCode).single();
  if (error) return null;
  return {
    teamCode: data.team_code,
    content: data.content ?? "",
    lastEditedBy: data.last_edited_by,
    lastEditedAt: data.last_edited_at,
  };
}

export async function upsertWarroomDoc(teamCode: string, content: string, editorEmail: string): Promise<void> {
  const { error } = await supabase.from("warroom_docs").upsert({
    team_code: teamCode,
    content,
    last_edited_by: editorEmail,
    last_edited_at: new Date().toISOString(),
  });
  if (error) throw error;
}

// Warroom Submissions
export async function getWarroomSubmissions(teamCode: string): Promise<WarroomSubmission[]> {
  const { data, error } = await supabase.from("warroom_submissions").select("*").eq("team_code", teamCode);
  if (error) return [];
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    teamCode: r.team_code as string,
    deadlineKey: r.deadline_key as string,
    status: r.status as WarroomSubmission["status"],
    url: r.url as string | undefined,
    submittedBy: r.submitted_by as string | undefined,
    submittedAt: r.submitted_at as string | undefined,
    confirmedBy: (r.confirmed_by as string[]) ?? [],
  }));
}

export async function upsertWarroomSubmission(sub: Omit<WarroomSubmission, "id">): Promise<void> {
  const id = `${sub.teamCode}:${sub.deadlineKey}`;
  const { error } = await supabase.from("warroom_submissions").upsert({
    id,
    team_code: sub.teamCode,
    deadline_key: sub.deadlineKey,
    status: sub.status,
    url: sub.url ?? null,
    submitted_by: sub.submittedBy ?? null,
    submitted_at: sub.submittedAt ?? null,
    confirmed_by: sub.confirmedBy,
  });
  if (error) throw error;
}
