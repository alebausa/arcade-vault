import { notFound } from "next/navigation";
import { getGameById } from "@/data/games";
import { GamePlayerClient } from "@/app/components/game-player-client";

export default async function GamePlayPage({ params }: PageProps<"/game/[id]/play">) {
  const { id } = await params;
  const game = await getGameById(id);

  if (!game) {
    notFound();
  }

  return <GamePlayerClient game={game} />;
}
