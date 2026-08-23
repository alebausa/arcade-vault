import { PLAYERS } from "./users";

export type ScoreEntry = {
  id: string;
  gameId: string;
  playerName: string;
  score: number;
  createdAt: string;
};

function seededScores(seed: number, count = 12) {
  let s = seed;
  const rand = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const used = new Set<string>();
  const rows: { rank: number; name: string; score: number; date: string }[] = [];
  for (let i = 0; i < count; i++) {
    let name: string;
    do {
      name = PLAYERS[Math.floor(rand() * PLAYERS.length)];
    } while (used.has(name) && used.size < PLAYERS.length);
    used.add(name);
    const base = Math.floor(50000 + rand() * 250000);
    const score = base - i * Math.floor(2000 + rand() * 4000);
    const day = String(1 + Math.floor(rand() * 28)).padStart(2, "0");
    const mon = String(1 + Math.floor(rand() * 12)).padStart(2, "0");
    rows.push({ rank: i + 1, name, score: Math.max(score, 1000), date: `${day}/${mon}/2026` });
  }
  return rows.sort((a, b) => b.score - a.score).map((r, i) => ({ ...r, rank: i + 1 }));
}

export async function getLeaderboard(gameId: string, limit = 12): Promise<ScoreEntry[]> {
  const seed = gameId.length * 17 + 3;
  return seededScores(seed, limit).map((row) => ({
    id: `${gameId}_${row.rank}`,
    gameId,
    playerName: row.name,
    score: row.score,
    createdAt: row.date,
  }));
}

export async function saveScore(entry: {
  gameId: string;
  playerName: string;
  score: number;
}): Promise<ScoreEntry> {
  return {
    id: `score_${Date.now()}`,
    gameId: entry.gameId,
    playerName: entry.playerName,
    score: entry.score,
    createdAt: new Date().toISOString(),
  };
}
