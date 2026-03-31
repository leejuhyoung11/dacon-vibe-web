import type { Hackathon, HackathonDetail, Team, Leaderboard, Submission, WarroomTask, WarroomChat, WarroomDoc, WarroomSubmission, Notification, RecruitPost, Applicant, WarroomFile, ParticipationType, HackathonParticipant, ProfileInfo, ProfilePortfolio, ProfileFeedback, ProfileMedals, CommunityPost, CommunityPostFull, CommunityCommentFull, CommunityMedal, TeamInvitation } from "./types";
import { getCommunityMedal } from "./constants";
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
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  const { error } = await supabase.from("teams").insert({
    team_code: team.teamCode,
    hackathon_slug: team.hackathonSlug || null,
    creator_id: user?.id ?? null,
    data: team,
  });
  if (error) throw error;
}

export async function updateTeamHackathon(teamCode: string, hackathonSlug: string): Promise<void> {
  const { data, error } = await supabase.from("teams").select("data").eq("team_code", teamCode).single();
  if (error || !data) throw error ?? new Error("팀을 찾을 수 없습니다");
  const updated = { ...(data.data as Team), hackathonSlug };
  const { error: updateError } = await supabase.from("teams").update({
    hackathon_slug: hackathonSlug,
    data: updated,
  }).eq("team_code", teamCode);
  if (updateError) throw updateError;
}

export async function updateTeamOpen(teamCode: string, isOpen: boolean): Promise<void> {
  const { data, error } = await supabase.from("teams").select("data").eq("team_code", teamCode).single();
  if (error || !data) return;
  const updated = { ...(data.data as Team), isOpen };
  await supabase.from("teams").update({ data: updated, is_open: isOpen }).eq("team_code", teamCode);
}

export async function updateTeamRecruitInfo(
  teamCode: string,
  lookingFor: string[],
  intro: string,
  contactUrl: string,
): Promise<Team | null> {
  const { data, error } = await supabase.from("teams").select("data").eq("team_code", teamCode).single();
  if (error || !data) return null;
  const updated = { ...(data.data as Team), lookingFor, intro, contact: { type: "link", url: contactUrl } };
  await supabase.from("teams").update({ data: updated }).eq("team_code", teamCode);
  return updated;
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

export async function uploadSubmissionFile(
  file: File,
  hackathonSlug: string,
): Promise<{ publicUrl: string; storagePath: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) throw new Error("로그인이 필요합니다");

  const ext = file.name.split(".").pop() ?? "bin";
  const storagePath = `submissions/${hackathonSlug}/${user.id}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("team-files").upload(storagePath, file, { upsert: false });
  if (error) throw error;

  const { data: urlData } = supabase.storage.from("team-files").getPublicUrl(storagePath);
  return { publicUrl: urlData.publicUrl, storagePath };
}

export async function addSubmission(sub: Submission): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
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
  const codes = await getMyTeamCodes();
  if (codes.size === 0) return [];
  const { data, error } = await supabase
    .from("teams")
    .select("data")
    .in("team_code", Array.from(codes));
  if (error) return [];
  return (data ?? []).map((row: { data: unknown }) => row.data as Team);
}

export async function getMyTeamCodes(): Promise<Set<string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return new Set();
  const [creatorRes, memberRes, applicantRes] = await Promise.all([
    supabase.from("teams").select("team_code").eq("creator_id", user.id),
    supabase.from("hackathon_participants")
      .select("team_code")
      .eq("user_id", user.id)
      .eq("participation_type", "team")
      .not("team_code", "is", null),
    supabase.from("warroom_applicants")
      .select("team_slug")
      .eq("applicant_id", user.id)
      .eq("status", "accepted"),
  ]);
  const codes = new Set<string>();
  (creatorRes.data ?? []).forEach((r: { team_code: string }) => codes.add(r.team_code));
  (memberRes.data ?? []).forEach((r: { team_code: string | null }) => r.team_code && codes.add(r.team_code));
  (applicantRes.data ?? []).forEach((r: { team_slug: string }) => codes.add(r.team_slug));
  return codes;
}

export interface TeamMember {
  userId: string;
  email: string;
  nickname: string;
  avatarUrl?: string;
  role: "creator" | "member";
}

export async function getTeamMembers(teamCode: string): Promise<TeamMember[]> {
  // 팀 정보(creator) + 수락된 지원자 병렬 조회
  const [teamRes, applicantsRes] = await Promise.all([
    supabase.from("teams").select("creator_id").eq("team_code", teamCode).single(),
    supabase.from("warroom_applicants")
      .select("applicant_id, applicant_email")
      .eq("team_slug", teamCode)
      .eq("status", "accepted"),
  ]);

  const memberIds: { userId: string; email: string; role: "creator" | "member" }[] = [];

  if (teamRes.data?.creator_id) {
    // creator 이메일은 auth에서 직접 가져올 수 없으므로 profile_info로 대체
    memberIds.push({ userId: teamRes.data.creator_id as string, email: "", role: "creator" });
  }
  (applicantsRes.data ?? []).forEach((r: { applicant_id: string; applicant_email: string }) => {
    if (r.applicant_id !== teamRes.data?.creator_id) {
      memberIds.push({ userId: r.applicant_id, email: r.applicant_email, role: "member" });
    }
  });

  // 각 멤버의 프로필 조회
  const profiles = await Promise.all(
    memberIds.map((m) =>
      supabase.from("profile_info").select("user_id, nickname, avatar_url").eq("user_id", m.userId).maybeSingle()
    )
  );

  return memberIds.map((m, i) => {
    const p = profiles[i].data;
    return {
      userId: m.userId,
      email: m.email,
      nickname: p?.nickname as string ?? m.email.split("@")[0] ?? "팀원",
      avatarUrl: p?.avatar_url as string | undefined,
      role: m.role,
    };
  });
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
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
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

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    userId: r.user_id as string,
    type: r.type as Notification["type"],
    title: r.title as string,
    description: r.description as string | undefined,
    teamCode: r.team_slug as string | undefined,
    actionUrl: r.action_url as string | undefined,
    isRead: r.is_read as boolean,
    meta: r.meta as Record<string, unknown> | undefined,
    createdAt: r.created_at as string,
  }));
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  if (error) return 0;
  return count ?? 0;
}

export async function addNotification(n: Omit<Notification, "id" | "createdAt">): Promise<void> {
  const { error } = await supabase.from("notifications").insert({
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    user_id: n.userId,
    type: n.type,
    title: n.title,
    description: n.description ?? null,
    team_slug: n.teamCode ?? null,
    action_url: n.actionUrl ?? null,
    is_read: false,
    meta: n.meta ?? null,
  });
  if (error) throw error;
}

export async function markNotificationRead(id: string): Promise<void> {
  await supabase.from("notifications").update({ is_read: true }).eq("id", id);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId);
}

// ─── Recruit ─────────────────────────────────────────────────────────────────

export async function getRecruitPost(teamCode: string): Promise<RecruitPost | null> {
  const { data, error } = await supabase
    .from("warroom_recruit_posts")
    .select("*")
    .eq("team_slug", teamCode)
    .single();
  if (error || !data) return null;
  return {
    teamCode: data.team_slug as string,
    positions: data.positions as string[],
    description: data.description as string,
    contactUrl: data.contact_url as string,
    requirements: data.requirements as string | undefined,
    isOpen: data.is_open as boolean,
    createdBy: data.created_by as string | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

export async function upsertRecruitPost(post: Omit<RecruitPost, "createdAt" | "updatedAt">): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  const { error } = await supabase.from("warroom_recruit_posts").upsert({
    team_slug: post.teamCode,
    positions: post.positions,
    description: post.description,
    contact_url: post.contactUrl,
    requirements: post.requirements ?? null,
    is_open: post.isOpen,
    created_by: user?.id ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "team_slug" });
  if (error) throw error;
}

export async function getApplicants(teamCode: string): Promise<Applicant[]> {
  const { data, error } = await supabase
    .from("warroom_applicants")
    .select("*")
    .eq("team_slug", teamCode)
    .neq("source", "invite")
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    teamCode: r.team_slug as string,
    applicantId: r.applicant_id as string,
    applicantEmail: r.applicant_email as string,
    position: r.position as string | undefined,
    message: r.message as string | undefined,
    status: r.status as Applicant["status"],
    createdAt: r.created_at as string,
  }));
}

export async function addApplicant(
  teamCode: string,
  position: string | undefined,
  message: string | undefined,
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) throw new Error("로그인이 필요합니다");
  const { error } = await supabase.from("warroom_applicants").insert({
    id: `apply-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    team_slug: teamCode,
    applicant_id: user.id,
    applicant_email: user.email ?? "",
    position: position ?? null,
    message: message ?? null,
    status: "pending",
  });
  if (error) throw error;
}

export async function hasApplied(teamCode: string): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return false;
  const { data } = await supabase
    .from("warroom_applicants")
    .select("id")
    .eq("team_slug", teamCode)
    .eq("applicant_id", user.id)
    .maybeSingle();
  return !!data;
}

export async function updateApplicantStatus(id: string, status: Applicant["status"]): Promise<void> {
  const { error } = await supabase.from("warroom_applicants").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function syncTeamMemberCount(teamCode: string): Promise<Team | null> {
  const [teamRes, creatorRes, acceptedRes] = await Promise.all([
    supabase.from("teams").select("data, creator_id").eq("team_code", teamCode).single(),
    supabase.from("teams").select("creator_id").eq("team_code", teamCode).single(),
    supabase.from("warroom_applicants")
      .select("id", { count: "exact", head: true })
      .eq("team_slug", teamCode)
      .eq("status", "accepted"),
  ]);
  if (teamRes.error || !teamRes.data) return null;
  const creatorCount = creatorRes.data?.creator_id ? 1 : 0;
  const memberCount = creatorCount + (acceptedRes.count ?? 0);
  const team = teamRes.data.data as Team;
  const updated = { ...team, memberCount };
  const { error: updateError } = await supabase
    .from("teams")
    .update({ data: updated })
    .eq("team_code", teamCode);
  if (updateError) throw updateError;
  return updated;
}

/** @deprecated use syncTeamMemberCount */
export async function incrementTeamMemberCount(teamCode: string): Promise<Team | null> {
  return syncTeamMemberCount(teamCode);
}

// ─── Warroom Files ────────────────────────────────────────────────────────────

export async function getWarroomFiles(teamCode: string): Promise<WarroomFile[]> {
  const { data, error } = await supabase
    .from("warroom_files")
    .select("*")
    .eq("team_slug", teamCode)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    teamCode: r.team_slug as string,
    fileName: r.file_name as string,
    fileUrl: r.file_url as string,
    storagePath: r.storage_path as string,
    fileType: r.file_type as string | undefined,
    fileSize: r.file_size as number | undefined,
    uploaderId: r.uploader_id as string,
    uploaderEmail: r.uploader_email as string,
    createdAt: r.created_at as string,
  }));
}

export async function addWarroomFile(file: Omit<WarroomFile, "id" | "createdAt">): Promise<void> {
  const { error } = await supabase.from("warroom_files").insert({
    id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    team_slug: file.teamCode,
    file_name: file.fileName,
    file_url: file.fileUrl,
    storage_path: file.storagePath,
    file_type: file.fileType ?? null,
    file_size: file.fileSize ?? null,
    uploader_id: file.uploaderId,
    uploader_email: file.uploaderEmail,
  });
  if (error) throw error;
}

export async function deleteWarroomFile(id: string, storagePath: string): Promise<void> {
  await supabase.storage.from("team-files").remove([storagePath]);
  await supabase.from("warroom_files").delete().eq("id", id);
}

// ─── Hackathon Participation ───────────────────────────────────────────────────

export async function joinHackathon(
  hackathonSlug: string,
  participationType: ParticipationType = "individual",
  teamCode?: string,
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) throw new Error("로그인이 필요합니다");
  const { error } = await supabase.from("hackathon_participants").insert({
    user_id: user.id,
    hackathon_slug: hackathonSlug,
    participation_type: participationType,
    team_code: teamCode ?? null,
  });
  if (error) throw error;
}

export async function leaveHackathon(hackathonSlug: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return;
  await supabase.from("hackathon_participants")
    .delete()
    .eq("user_id", user.id)
    .eq("hackathon_slug", hackathonSlug);
}

export async function getMyParticipation(hackathonSlug: string): Promise<HackathonParticipant | null> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return null;
  const { data } = await supabase
    .from("hackathon_participants")
    .select("hackathon_slug, participation_type, team_code, joined_at")
    .eq("user_id", user.id)
    .eq("hackathon_slug", hackathonSlug)
    .maybeSingle();
  if (!data) return null;
  return {
    hackathonSlug: data.hackathon_slug as string,
    participationType: (data.participation_type ?? "individual") as ParticipationType,
    teamCode: data.team_code as string | null,
    joinedAt: data.joined_at as string,
  };
}

export async function isParticipating(hackathonSlug: string): Promise<boolean> {
  return !!(await getMyParticipation(hackathonSlug));
}

export async function transitionToTeamParticipation(
  userId: string,
  hackathonSlug: string,
  teamCode: string,
): Promise<void> {
  // 이미 다른 팀에 속해 있으면 충돌 방지
  const { data: existing } = await supabase
    .from("hackathon_participants")
    .select("team_code, participation_type")
    .eq("user_id", userId)
    .eq("hackathon_slug", hackathonSlug)
    .maybeSingle();

  if (
    existing?.participation_type === "team" &&
    existing.team_code !== teamCode
  ) {
    throw new Error("이미 다른 팀에 참여 중입니다.");
  }

  const { error } = await supabase.from("hackathon_participants").upsert(
    {
      user_id: userId,
      hackathon_slug: hackathonSlug,
      participation_type: "team",
      team_code: teamCode,
    },
    { onConflict: "user_id,hackathon_slug" },
  );
  if (error) throw error;
}

export async function getMyParticipatedSlugs(): Promise<string[]> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return [];
  const { data } = await supabase
    .from("hackathon_participants")
    .select("hackathon_slug, joined_at")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });
  return (data ?? []).map((r: { hackathon_slug: string }) => r.hackathon_slug);
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function getProfileInfo(userId: string): Promise<ProfileInfo | null> {
  try {
    const { data, error } = await supabase
      .from("profile_info")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (error || !data) return null;
    return data as ProfileInfo;
  } catch {
    return null;
  }
}

export async function upsertProfileInfo(info: Omit<ProfileInfo, "updated_at">): Promise<void> {
  const { error } = await supabase.from("profile_info").upsert({
    ...info,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (error) throw error;
}

export async function getProfilePortfolios(userId: string): Promise<ProfilePortfolio[]> {
  try {
    const { data, error } = await supabase
      .from("profile_portfolios")
      .select("*")
      .eq("user_id", userId)
      .order("display_order");
    if (error || !data) return [];
    return data as ProfilePortfolio[];
  } catch {
    return [];
  }
}

export async function addProfilePortfolio(
  portfolio: Omit<ProfilePortfolio, "id" | "created_at">
): Promise<void> {
  const { error } = await supabase.from("profile_portfolios").insert({
    ...portfolio,
    id: `portfolio-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    created_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function deleteProfilePortfolio(id: string): Promise<void> {
  const { error } = await supabase.from("profile_portfolios").delete().eq("id", id);
  if (error) throw error;
}

export async function getProfileFeedbacks(userId: string): Promise<ProfileFeedback[]> {
  try {
    const { data, error } = await supabase
      .from("profile_feedbacks")
      .select("*")
      .eq("target_user_id", userId)
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data as ProfileFeedback[];
  } catch {
    return [];
  }
}

export async function getProfileMedals(userId: string): Promise<ProfileMedals | null> {
  try {
    const { data, error } = await supabase
      .from("profile_medals")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (error || !data) return null;
    return data as ProfileMedals;
  } catch {
    return null;
  }
}

// ─── Community ────────────────────────────────────────────────────────────────

async function enrichPosts(
  posts: CommunityPost[],
  currentUserId: string | null,
): Promise<CommunityPostFull[]> {
  if (posts.length === 0) return [];

  const authorIds = [...new Set(posts.map((p) => p.author_id))];
  const [profilesRes, medalsRes] = await Promise.all([
    supabase.from("profile_info").select("user_id, nickname, avatar_url").in("user_id", authorIds),
    supabase.from("profile_medals").select("user_id, community_medal").in("user_id", authorIds),
  ]);

  type ProfileRow = { user_id: string; nickname: string; avatar_url?: string };
  type MedalRow   = { user_id: string; community_medal: CommunityMedal };

  const profiles = new Map<string, ProfileRow>(
    ((profilesRes.data ?? []) as ProfileRow[]).map((p) => [p.user_id, p])
  );
  const medals = new Map<string, MedalRow>(
    ((medalsRes.data ?? []) as MedalRow[]).map((m) => [m.user_id, m])
  );

  let upvotedIds = new Set<string>();
  if (currentUserId && posts.length > 0) {
    const { data: uvData } = await supabase
      .from("post_upvotes")
      .select("post_id")
      .eq("user_id", currentUserId)
      .in("post_id", posts.map((p) => p.id));
    upvotedIds = new Set(((uvData ?? []) as { post_id: string }[]).map((u) => u.post_id));
  }

  return posts.map((post) => ({
    ...post,
    author_nickname:   profiles.get(post.author_id)?.nickname ?? "사용자",
    author_avatar_url: profiles.get(post.author_id)?.avatar_url,
    community_medal:   (medals.get(post.author_id)?.community_medal ?? "None") as CommunityMedal,
    is_upvoted:        upvotedIds.has(post.id),
  }));
}

export async function getCommunityPosts(
  hackathonSlug?: string,
  sort: "latest" | "popular" = "latest",
): Promise<CommunityPostFull[]> {
  const { data: { session } } = await supabase.auth.getSession();
  const currentUserId = session?.user?.id ?? null;

  let q = supabase.from("community_posts").select("*");
  if (hackathonSlug) q = q.eq("hackathon_slug", hackathonSlug);
  q = sort === "popular"
    ? q.order("upvote_count", { ascending: false })
    : q.order("created_at", { ascending: false });

  const { data, error } = await q;
  if (error || !data) return [];
  return enrichPosts(data as CommunityPost[], currentUserId);
}

export async function getCommunityPost(postId: string): Promise<CommunityPostFull | null> {
  const { data: { session } } = await supabase.auth.getSession();
  const currentUserId = session?.user?.id ?? null;

  const { data, error } = await supabase
    .from("community_posts")
    .select("*")
    .eq("id", postId)
    .single();
  if (error || !data) return null;

  const posts = await enrichPosts([data as CommunityPost], currentUserId);
  return posts[0] ?? null;
}

export async function createCommunityPost(
  title: string,
  content: string,
  hackathonSlug: string | null,
): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) throw new Error("로그인이 필요합니다");

  const id = `post-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const { error } = await supabase.from("community_posts").insert({
    id,
    hackathon_slug: hackathonSlug ?? null,
    author_id: user.id,
    title,
    content,
    upvote_count: 0,
    comment_count: 0,
  });
  if (error) throw error;
  return id;
}

export async function togglePostUpvote(
  postId: string,
  authorId: string,
): Promise<{ upvoted: boolean; count: number }> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) throw new Error("로그인이 필요합니다");
  if (user.id === authorId) throw new Error("자신의 글에는 upvote할 수 없습니다");

  const { data: existing } = await supabase
    .from("post_upvotes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  let delta: number;
  let upvoted: boolean;

  if (existing) {
    await supabase.from("post_upvotes").delete().eq("post_id", postId).eq("user_id", user.id);
    delta = -1; upvoted = false;
  } else {
    await supabase.from("post_upvotes").insert({
      id: `pv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      post_id: postId,
      user_id: user.id,
    });
    delta = 1; upvoted = true;
  }

  const { data: postRow } = await supabase.from("community_posts").select("upvote_count").eq("id", postId).single();
  const newCount = Math.max(0, ((postRow?.upvote_count as number) ?? 0) + delta);
  await supabase.from("community_posts").update({ upvote_count: newCount }).eq("id", postId);

  // Update author's profile_medals
  const { data: medalRow } = await supabase
    .from("profile_medals")
    .select("community_score, community_upvotes")
    .eq("user_id", authorId)
    .maybeSingle();
  if (medalRow) {
    const newScore   = Math.max(0, ((medalRow.community_score as number) ?? 0) + delta);
    const newUpvotes = Math.max(0, ((medalRow.community_upvotes as number) ?? 0) + delta);
    await supabase.from("profile_medals").update({
      community_score:   newScore,
      community_upvotes: newUpvotes,
      community_medal:   getCommunityMedal(newScore),
    }).eq("user_id", authorId);
  }

  return { upvoted, count: newCount };
}

export async function getCommunityComments(postId: string): Promise<CommunityCommentFull[]> {
  const { data: { session } } = await supabase.auth.getSession();
  const currentUserId = session?.user?.id ?? null;

  const { data, error } = await supabase
    .from("community_comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];

  type CommentRow = { id: string; post_id: string; author_id: string; content: string; upvote_count: number; created_at: string };
  const comments = data as CommentRow[];
  if (comments.length === 0) return [];

  const authorIds = [...new Set(comments.map((c) => c.author_id))];
  const [profilesRes, medalsRes] = await Promise.all([
    supabase.from("profile_info").select("user_id, nickname, avatar_url").in("user_id", authorIds),
    supabase.from("profile_medals").select("user_id, community_medal").in("user_id", authorIds),
  ]);

  type ProfileRow = { user_id: string; nickname: string; avatar_url?: string };
  type MedalRow   = { user_id: string; community_medal: CommunityMedal };

  const profiles = new Map<string, ProfileRow>(
    ((profilesRes.data ?? []) as ProfileRow[]).map((p) => [p.user_id, p])
  );
  const medals = new Map<string, MedalRow>(
    ((medalsRes.data ?? []) as MedalRow[]).map((m) => [m.user_id, m])
  );

  let upvotedIds = new Set<string>();
  if (currentUserId) {
    const { data: uvData } = await supabase
      .from("comment_upvotes")
      .select("comment_id")
      .eq("user_id", currentUserId)
      .in("comment_id", comments.map((c) => c.id));
    upvotedIds = new Set(((uvData ?? []) as { comment_id: string }[]).map((u) => u.comment_id));
  }

  return comments.map((c) => ({
    ...c,
    author_nickname:   profiles.get(c.author_id)?.nickname ?? "사용자",
    author_avatar_url: profiles.get(c.author_id)?.avatar_url,
    community_medal:   (medals.get(c.author_id)?.community_medal ?? "None") as CommunityMedal,
    is_upvoted:        upvotedIds.has(c.id),
  }));
}

export async function createCommunityComment(postId: string, content: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) throw new Error("로그인이 필요합니다");

  const { error } = await supabase.from("community_comments").insert({
    id: `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    post_id: postId,
    author_id: user.id,
    content,
    upvote_count: 0,
  });
  if (error) throw error;

  const { data: postRow } = await supabase.from("community_posts").select("comment_count").eq("id", postId).single();
  const newCount = ((postRow?.comment_count as number) ?? 0) + 1;
  await supabase.from("community_posts").update({ comment_count: newCount }).eq("id", postId);
}

export async function toggleCommentUpvote(
  commentId: string,
  authorId: string,
): Promise<{ upvoted: boolean; count: number }> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) throw new Error("로그인이 필요합니다");
  if (user.id === authorId) throw new Error("자신의 댓글에는 upvote할 수 없습니다");

  const { data: existing } = await supabase
    .from("comment_upvotes")
    .select("id")
    .eq("comment_id", commentId)
    .eq("user_id", user.id)
    .maybeSingle();

  let delta: number;
  let upvoted: boolean;

  if (existing) {
    await supabase.from("comment_upvotes").delete().eq("comment_id", commentId).eq("user_id", user.id);
    delta = -1; upvoted = false;
  } else {
    await supabase.from("comment_upvotes").insert({
      id: `cv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      comment_id: commentId,
      user_id: user.id,
    });
    delta = 1; upvoted = true;
  }

  const { data: cmtRow } = await supabase.from("community_comments").select("upvote_count").eq("id", commentId).single();
  const newCount = Math.max(0, ((cmtRow?.upvote_count as number) ?? 0) + delta);
  await supabase.from("community_comments").update({ upvote_count: newCount }).eq("id", commentId);

  // Update author's profile_medals
  const { data: medalRow } = await supabase
    .from("profile_medals")
    .select("community_score, community_upvotes")
    .eq("user_id", authorId)
    .maybeSingle();
  if (medalRow) {
    const newScore   = Math.max(0, ((medalRow.community_score as number) ?? 0) + delta);
    const newUpvotes = Math.max(0, ((medalRow.community_upvotes as number) ?? 0) + delta);
    await supabase.from("profile_medals").update({
      community_score:   newScore,
      community_upvotes: newUpvotes,
      community_medal:   getCommunityMedal(newScore),
    }).eq("user_id", authorId);
  }

  return { upvoted, count: newCount };
}

// ─── Team Invitations ─────────────────────────────────────────────────────────

export async function sendTeamInvitation(
  teamCode: string,
  teamName: string,
  inviteeEmail: string,
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) throw new Error("로그인이 필요합니다");

  // 중복 초대 방지
  const { data: existing } = await supabase
    .from("team_invitations")
    .select("id, status")
    .eq("team_code", teamCode)
    .eq("invitee_email", inviteeEmail)
    .maybeSingle();
  if (existing && (existing as { status: string }).status === "pending") throw new Error("이미 초대장을 보낸 이메일입니다");
  if (existing && (existing as { status: string }).status === "accepted") throw new Error("이미 팀에 참여한 멤버입니다");

  const id = `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const { error } = await supabase.from("team_invitations").insert({
    id,
    team_code: teamCode,
    team_name: teamName,
    invitee_email: inviteeEmail,
    invited_by: user.email ?? "",
    status: "pending",
  });
  if (error) throw error;
}

export async function getTeamInvitations(teamCode: string): Promise<TeamInvitation[]> {
  const { data, error } = await supabase
    .from("team_invitations")
    .select("*")
    .eq("team_code", teamCode)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    teamCode: r.team_code as string,
    teamName: r.team_name as string,
    inviteeEmail: r.invitee_email as string,
    invitedBy: r.invited_by as string,
    status: r.status as TeamInvitation["status"],
    createdAt: r.created_at as string,
  }));
}

export async function getPendingInvitationsForMe(): Promise<TeamInvitation[]> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user?.email) return [];
  const { data, error } = await supabase
    .from("team_invitations")
    .select("*")
    .eq("invitee_email", user.email)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    teamCode: r.team_code as string,
    teamName: r.team_name as string,
    inviteeEmail: r.invitee_email as string,
    invitedBy: r.invited_by as string,
    status: r.status as TeamInvitation["status"],
    createdAt: r.created_at as string,
  }));
}

export async function getPendingInvitationCount(): Promise<number> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user?.email) return 0;
  const { count, error } = await supabase
    .from("team_invitations")
    .select("id", { count: "exact", head: true })
    .eq("invitee_email", user.email)
    .eq("status", "pending");
  if (error) return 0;
  return count ?? 0;
}

export async function respondToInvitation(
  invitationId: string,
  response: "accepted" | "rejected",
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) throw new Error("로그인이 필요합니다");

  const { data: inv, error: fetchError } = await supabase
    .from("team_invitations")
    .select("*")
    .eq("id", invitationId)
    .single();
  if (fetchError || !inv) throw new Error("초대장을 찾을 수 없습니다");

  const { error } = await supabase
    .from("team_invitations")
    .update({ status: response })
    .eq("id", invitationId);
  if (error) throw error;

  if (response === "accepted") {
    // warroom_applicants에 수락된 멤버로 추가
    const applicantId = `apply-inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await supabase.from("warroom_applicants").insert({
      id: applicantId,
      team_slug: inv.team_code as string,
      applicant_id: user.id,
      applicant_email: user.email ?? "",
      position: null,
      message: "초대 수락",
      status: "accepted",
      source: "invite",
    });

    // 팀 멤버 수 동기화 (실제 카운트 기반)
    const syncedTeam = await syncTeamMemberCount(inv.team_code as string);
    if (syncedTeam) {
      const teamData = syncedTeam;

      if (teamData.hackathonSlug) {
        await supabase.from("hackathon_participants").upsert(
          {
            user_id: user.id,
            hackathon_slug: teamData.hackathonSlug,
            participation_type: "team",
            team_code: inv.team_code as string,
          },
          { onConflict: "user_id,hackathon_slug" },
        );
      }
    }

    // 팀 creator에게 joined 알림
    const { data: teamCreatorRow } = await supabase
      .from("teams")
      .select("creator_id")
      .eq("team_code", inv.team_code as string)
      .single();
    if (teamCreatorRow?.creator_id) {
      await supabase.from("notifications").insert({
        id: `notif-inv-join-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        user_id: teamCreatorRow.creator_id as string,
        type: "joined",
        title: `${user.email?.split("@")[0]}님이 초대를 수락하고 팀에 참여했습니다`,
        description: `팀: ${inv.team_name as string}`,
        team_slug: inv.team_code as string,
        action_url: `/warroom/${inv.team_code as string}?tab=team`,
        is_read: false,
        meta: null,
      });
    }
  } else {
    // 거절 시: 팀 creator에게 rejected 알림
    const { data: teamCreatorRow } = await supabase
      .from("teams")
      .select("creator_id")
      .eq("team_code", inv.team_code as string)
      .single();
    if (teamCreatorRow?.creator_id) {
      await supabase.from("notifications").insert({
        id: `notif-inv-rej-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        user_id: teamCreatorRow.creator_id as string,
        type: "rejected",
        title: `${user.email?.split("@")[0]}님이 초대를 거절했습니다`,
        description: `팀: ${inv.team_name as string} · 초대 이메일: ${inv.invitee_email as string}`,
        team_slug: inv.team_code as string,
        action_url: `/warroom/${inv.team_code as string}?tab=team`,
        is_read: false,
        meta: null,
      });
    }
  }
}
