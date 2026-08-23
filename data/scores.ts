import { createClient } from "@/lib/supabase/client";

export type ScoreEntry = {
  id: string;
  gameId: string;
  playerName: string;
  score: number;
  createdAt: string;
};

type ScoreRow = {
  id: string;
  game_id: string;
  player_name: string;
  score: number;
  created_at: string;
};

function toScoreEntry(row: ScoreRow): ScoreEntry {
  return {
    id: row.id,
    gameId: row.game_id,
    playerName: row.player_name,
    score: row.score,
    createdAt: row.created_at,
  };
}

export async function getLeaderboard(
  gameId: string,
  limit = 12,
): Promise<ScoreEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("scores")
    .select("*")
    .eq("game_id", gameId)
    .order("score", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data as ScoreRow[]).map(toScoreEntry);
}

export async function saveScore(entry: {
  gameId: string;
  playerName: string;
  score: number;
}): Promise<ScoreEntry> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("scores")
    .insert({
      game_id: entry.gameId,
      player_name: entry.playerName,
      score: entry.score,
    })
    .select()
    .single();

  if (error) throw error;
  return toScoreEntry(data as ScoreRow);
}
