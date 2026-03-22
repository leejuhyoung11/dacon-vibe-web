"use client";

import { useEffect } from "react";
import { isSeeded, seedData } from "@/lib/storage";
import { seedHackathons, seedHackathonDetails, seedTeams, seedLeaderboards } from "@/lib/seed";

export default function SeedInitializer() {
  useEffect(() => {
    if (!isSeeded()) {
      seedData({
        hackathons: seedHackathons,
        hackathonDetails: seedHackathonDetails,
        teams: seedTeams,
        leaderboards: seedLeaderboards,
      });
    }
  }, []);

  return null;
}
