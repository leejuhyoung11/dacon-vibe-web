// Hackathon List
export interface HackathonPeriod {
  timezone: string;
  submissionDeadlineAt: string;
  endAt: string;
}

export interface HackathonLinks {
  detail: string;
  rules: string;
  faq: string;
}

export interface Hackathon {
  slug: string;
  title: string;
  status: "ongoing" | "upcoming" | "ended";
  tags: string[];
  thumbnailUrl: string;
  period: HackathonPeriod;
  links: HackathonLinks;
}

// Hackathon Detail
export interface TeamPolicy {
  allowSolo: boolean;
  maxTeamSize: number;
}

export interface EvalLimit {
  maxRuntimeSec?: number;
  maxSubmissionsPerDay?: number;
}

export interface VoteBreakdownItem {
  key: string;
  label: string;
  weightPercent: number;
}

export interface ScoreDisplay {
  label: string;
  breakdown: VoteBreakdownItem[];
}

export interface Milestone {
  name: string;
  at: string;
}

export interface PrizeItem {
  place: string;
  amountKRW: number;
}

export interface SubmissionItem {
  key: string;
  title: string;
  format: string;
}

export interface HackathonDetail {
  slug: string;
  title: string;
  sections: {
    overview: {
      summary: string;
      teamPolicy: TeamPolicy;
    };
    info: {
      notice: string[];
      links: { rules: string; faq: string };
    };
    eval: {
      metricName: string;
      description: string;
      limits?: EvalLimit;
      scoreSource?: "vote";
      scoreDisplay?: ScoreDisplay;
    };
    schedule: {
      timezone: string;
      milestones: Milestone[];
    };
    prize: {
      items: PrizeItem[];
    };
    teams: {
      campEnabled: boolean;
      listUrl: string;
    };
    submit: {
      allowedArtifactTypes: string[];
      submissionUrl: string;
      guide: string[];
      submissionItems?: SubmissionItem[];
    };
    leaderboard: {
      publicLeaderboardUrl: string;
      note: string;
    };
  };
}

// Teams
export interface Team {
  teamCode: string;
  hackathonSlug: string;
  name: string;
  isOpen: boolean;
  memberCount: number;
  lookingFor: string[];
  intro: string;
  contact: { type: string; url: string };
  createdAt: string;
}

// Leaderboard
export interface ScoreBreakdown {
  participant: number;
  judge: number;
}

export interface Artifacts {
  webUrl?: string;
  pdfUrl?: string;
  planTitle?: string;
}

export interface LeaderboardEntry {
  rank: number;
  teamName: string;
  score: number;
  submittedAt: string;
  scoreBreakdown?: ScoreBreakdown;
  artifacts?: Artifacts;
}

export interface Leaderboard {
  hackathonSlug: string;
  updatedAt: string;
  entries: LeaderboardEntry[];
}

// Submission (user-created)
export interface Submission {
  id: string;
  hackathonSlug: string;
  teamName: string;
  artifactType: string;
  value: string;
  note?: string;
  submittedAt: string;
}
