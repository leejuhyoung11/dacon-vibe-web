import type { Hackathon, HackathonDetail, Team, Leaderboard, Submission } from "./types";

const KEYS = {
  hackathons: "hackathons",
  hackathonDetails: "hackathon_details",
  teams: "teams",
  leaderboards: "leaderboards",
  submissions: "submissions",
  seeded: "__seeded__",
} as const;

function get<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function set<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// Hackathons
export function getHackathons(): Hackathon[] {
  return get<Hackathon[]>(KEYS.hackathons) ?? [];
}

export function getHackathonDetail(slug: string): HackathonDetail | null {
  const all = get<HackathonDetail[]>(KEYS.hackathonDetails) ?? [];
  return all.find((h) => h.slug === slug) ?? null;
}

// Teams
export function getTeams(): Team[] {
  return get<Team[]>(KEYS.teams) ?? [];
}

export function getTeamsByHackathon(slug: string): Team[] {
  return getTeams().filter((t) => t.hackathonSlug === slug);
}

export function addTeam(team: Team): void {
  const teams = getTeams();
  set(KEYS.teams, [...teams, team]);
}

// Leaderboards
export function getLeaderboard(slug: string): Leaderboard | null {
  const all = get<Leaderboard[]>(KEYS.leaderboards) ?? [];
  return all.find((l) => l.hackathonSlug === slug) ?? null;
}

export function getAllLeaderboards(): Leaderboard[] {
  return get<Leaderboard[]>(KEYS.leaderboards) ?? [];
}

export function updateLeaderboard(lb: Leaderboard): void {
  const all = getAllLeaderboards();
  const idx = all.findIndex((l) => l.hackathonSlug === lb.hackathonSlug);
  if (idx >= 0) all[idx] = lb;
  else all.push(lb);
  set(KEYS.leaderboards, all);
}

// Submissions
export function getSubmissions(slug: string): Submission[] {
  const all = get<Submission[]>(KEYS.submissions) ?? [];
  return all.filter((s) => s.hackathonSlug === slug);
}

export function addSubmission(sub: Submission): void {
  const all = get<Submission[]>(KEYS.submissions) ?? [];
  set(KEYS.submissions, [...all, sub]);
}

// Seed
export function isSeeded(): boolean {
  return localStorage.getItem(KEYS.seeded) === "1";
}

export function markSeeded(): void {
  localStorage.setItem(KEYS.seeded, "1");
}

export function seedData(data: {
  hackathons: Hackathon[];
  hackathonDetails: HackathonDetail[];
  teams: Team[];
  leaderboards: Leaderboard[];
}): void {
  set(KEYS.hackathons, data.hackathons);
  set(KEYS.hackathonDetails, data.hackathonDetails);
  set(KEYS.teams, data.teams);
  set(KEYS.leaderboards, data.leaderboards);
  markSeeded();
}
