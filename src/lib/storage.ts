import type { Hackathon, HackathonDetail, Team, Leaderboard, Submission } from "./types";
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
